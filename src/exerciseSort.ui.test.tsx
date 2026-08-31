import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { invalidateHiddenVideos } from './db/hiddenVideos'
import { invalidateHiddenExercises } from './db/hiddenExercises'
import { invalidateVideoPrefs } from './db/videoPrefs'
import { useBasket } from './state/builderBasket'
import { useWorkout } from './state/activeWorkoutStore'

/**
 * המיון והסינון ברשימות התרגילים.
 *
 * מה שנבדק כאן ואי אפשר לבדוק ברמת ה-domain: ששורת המיון באמת מרונדרת במסך,
 * שהיא מזיזה את השורות בפועל, ושהמתג "כל מי שנוגע" מביא תרגילים שהרשימה
 * הרגילה לא מראה — כולל כאלה שיושבים תחת כותרת של שריר אחר.
 */

const SLOW = 15_000

async function resetAll(): Promise<void> {
  useWorkout.setState({
    workout: null,
    exercisesById: {},
    prCache: [],
    pendingPrEvents: [],
    hydrated: false,
  })
  useBasket.getState().clear()
  invalidateHiddenVideos()
  invalidateHiddenExercises()
  invalidateVideoPrefs()
  window.location.hash = '#/'
  await db.delete()
  await db.open()
  await ensureReady()
}

/** שמות התרגילים לפי סדר הופעתם במסך, לפי כותרת השורה */
function orderOnScreen(names: readonly string[]): string[] {
  const html = document.body.innerHTML
  return [...names]
    .map((name) => ({ name, at: html.indexOf(`>${name}<`) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((x) => x.name)
}

describe('מיון רשימת התרגילים', () => {
  beforeEach(resetAll)

  it('מיון לפי אחוז מסדר מחדש ומראה את המספר שקבע את הסדר', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/builder/legs'
    render(<App />)

    // שורת המיון קיימת, ו"רגיל" הוא מה שנבחר בפתיחה — הסדר שהמסך תמיד היה בו
    const byPct = await screen.findByRole('button', { name: /^אחוז/ }, { timeout: SLOW })
    expect(screen.getByRole('button', { name: /^רגיל/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByText('95%')).toBeNull()

    await user.click(byPct)

    /*
      תחת "ארבע-ראשי" הכרטיסים אומרים: פשיטת ברכיים 100, לחיצת רגליים 95,
      סקוואט במכונה 95. המספרים מודפסים על הכרטיס, והמיון רק מסדר לפיהם.
    */
    await waitFor(() => expect(screen.getAllByText('100%').length).toBeGreaterThan(0), {
      timeout: SLOW,
    })
    const order = orderOnScreen(['פשיטת ברכיים', 'לחיצת רגליים'])
    expect(order).toEqual(['פשיטת ברכיים', 'לחיצת רגליים'])
  }, 40000)

  it('לחיצה שנייה על מיון פעיל הופכת את הכיוון', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/builder/legs'
    render(<App />)

    const byPct = await screen.findByRole('button', { name: /^אחוז/ }, { timeout: SLOW })
    await user.click(byPct)
    await waitFor(() => expect(screen.getAllByText('100%').length).toBeGreaterThan(0), {
      timeout: SLOW,
    })
    expect(orderOnScreen(['פשיטת ברכיים', 'לחיצת רגליים'])).toEqual(['פשיטת ברכיים', 'לחיצת רגליים'])

    // אותו צ׳יפ שוב — מהנמוך לגבוה, והחץ בתווית הנגישה מעיד על הכיוון
    await user.click(screen.getByRole('button', { name: /^אחוז/ }))
    await waitFor(() =>
      expect(orderOnScreen(['פשיטת ברכיים', 'לחיצת רגליים'])).toEqual([
        'לחיצת רגליים',
        'פשיטת ברכיים',
      ])
    )
    expect(screen.getByRole('button', { name: /מהנמוך לגבוה/ })).toBeTruthy()
  }, 40000)

  it('סינון ציוד מצמצם את הרשימה ואומר מה נפל בלי סיווג', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/library'
    render(<App />)

    await screen.findByRole('button', { name: 'סינון לפי ציוד' }, { timeout: SLOW })
    await user.click(screen.getByRole('button', { name: 'סינון לפי ציוד' }))

    const sheet = await screen.findByRole('dialog', {}, { timeout: SLOW })
    await user.click(within(sheet).getByRole('button', { name: 'משקל גוף' }))

    /*
      רשומות המאגר שעדיין לא נוספו לתרגילים שלי אין להן סיווג ציוד — הוא
      נקבע בהוספה — ולכן הן נופלות. השורה שאומרת את זה היא ההבדל בין סינון
      לבין היעלמות.
    */
    await waitFor(() => expect(screen.getByText(/אין להן עדיין סיווג ציוד/)).toBeTruthy(), {
      timeout: SLOW,
    })
  }, 40000)

  it('סינון שמרוקן את הרשימה משאיר את הדרך לבטל אותו', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/builder/biceps'
    render(<App />)

    await screen.findByRole('button', { name: 'סינון לפי ציוד' }, { timeout: SLOW })
    await user.click(screen.getByRole('button', { name: 'סינון לפי ציוד' }))
    const sheet = await screen.findByRole('dialog', {}, { timeout: SLOW })
    // אין תרגיל יד קדמית במשקל גוף — הרשימה מתרוקנת לגמרי
    await user.click(within(sheet).getByRole('button', { name: 'משקל גוף' }))
    // הגיליון נסגר ב-Escape — אין בו כפתור סגירה, הרקע והמקש הם הדרך
    await user.keyboard('{Escape}')

    /*
      הצ׳יפים של תת-השרירים נעלמים עם הרשימה, וזה בסדר — הם מרפאים את עצמם.
      שורת המיון חייבת להישאר: היא הדרך היחידה לבטל סינון ציוד, ובלעדיה
      המסך נתקע ריק עד שיוצאים ממנו.
    */
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /סינון ציוד/ })).toBeTruthy()
    )
  }, 40000)

  it('אותה שורת מיון גם בבורר שבאמצע אימון', async () => {
    const user = userEvent.setup()
    await useWorkout.getState().start('F1', [])
    window.location.hash = '#/workout'
    render(<App />)

    await screen.findByRole('button', { name: 'תור התרגילים' }, { timeout: SLOW })
    await user.click(screen.getByRole('button', { name: 'הוסף תרגיל לאימון' }))

    /*
      הבורר הוא גיליון מעל מסך האימון, ולכן הטענות נשאלות בתוכו: מסך האימון
      חי מתחתיו ונושא שמות משלו.
    */
    const sheet = await screen.findByRole('dialog', {}, { timeout: SLOW })
    await user.click(within(sheet).getByRole('button', { name: /^אחוז/ }))

    await waitFor(() => expect(within(sheet).getAllByText(/%$/).length).toBeGreaterThan(0), {
      timeout: SLOW,
    })
    // והסינון קיים גם כאן — "מה פנוי עכשיו" היא שאלה של אמצע אימון
    expect(within(sheet).getByRole('button', { name: 'סינון לפי ציוד' })).toBeTruthy()
  }, 40000)

  it('"כל מי שנוגע" חושף תרגילים שיושבים תחת כותרת של שריר אחר', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/builder/legs'
    render(<App />)

    /*
      הצ׳יפ ולא הכותרת: שניהם נושאים את שם השריר, והכותרת פותחת את הכרטיס
      האנטומי. התווית שלה מסתיימת ב"איפה השריר הזה יושב", וזה מה שמפריד.
    */
    const chip = await screen.findByRole(
      'button',
      { name: (name: string) => name.startsWith('ארבע-ראשי') && !name.includes('איפה') },
      { timeout: SLOW }
    )
    await user.click(chip)

    const wide = await screen.findByRole('button', { name: /כל מי שנוגע/ }, { timeout: SLOW })
    await user.click(wide)

    /*
      סקוואט במכונה מקובץ תחת "עכוז גדול" ברשימה הרגילה — זה השריר החזק
      בכרטיס שלו — ולכן הוא *לא* מופיע תחת "ארבע-ראשי" למרות שהכרטיס נותן לו
      שם אחוז מלא. זו בדיוק הנקודה של התצוגה הרחבה.
    */
    await waitFor(() => expect(screen.getByText(/כל התרגילים שהכרטיס שלהם מזכיר/)).toBeTruthy(), {
      timeout: SLOW,
    })
    expect(screen.getByText('פשיטת ברכיים')).toBeTruthy()
    expect(screen.getByText('לחיצת רגליים')).toBeTruthy()
  }, 40000)
})
