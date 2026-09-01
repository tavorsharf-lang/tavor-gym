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
 * המנוחה — שני מסכים על ספירה אחת.
 *
 * ברירת המחדל אחרי סט היא המנוחה **שבתוך הכרטיס**, והמסך המלא נפתח רק בלחיצה
 * על המספר. שתי הצלעות נבדקות כאן, וזו ההפרדה:
 *   • שהמנוחה המוטמעת אכן מופיעה אחרי סט, ושהמסך המלא *אינו* קופץ לבד.
 *   • שהמסך המלא, כשפותחים אותו, הוא עדיין אותו מסך: הכרטיס, מד הסטים,
 *     התרגיל הבא ומפת השרירים — ושהוא רץ על אותו טיימר, לא על ספירה שנייה.
 *
 * הנתונים לא נבנים בבדיקה: מכונת הרגליים היא הפריט הראשון ב-F1, יש לה כרטיס
 * במניפסט ויש עליו אחוזים. אם אחד מהשלושה יישבר — הבדיקה נופלת, וזו בדיוק
 * השרשרת שהמסך תלוי בה.
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

describe('המנוחה', () => {
  beforeEach(resetAll)

  it('מופיעה בתוך הכרטיס, ולא כשכבה שקופצת מעל המסך', async () => {
    const user = userEvent.setup()
    await useWorkout.getState().start('F1', [])
    const first = (useWorkout.getState().workout?.queue ?? [])[0].key

    await useWorkout.getState().logSet(first, 'work', 100, 10)
    await useWorkout.getState().startRest(first, 90)

    window.location.hash = '#/workout'
    render(<App />)

    // המנוחה המוטמעת על המסך — ושום דיאלוג לא נפתח מעליה
    const clock = await screen.findByRole(
      'button',
      { name: /פתח את מסך המנוחה המלא/ },
      { timeout: SLOW }
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    /*
      הכרטיס עצמו נשאר קריא מתחת לספירה — זו כל הנקודה. השם מופיע פעמיים
      במכוון: ככותרת הכרטיס, ושוב בצד המנוחה כ"הסט הבא", כי נשאר עוד סט בו.
    */
    expect(screen.getAllByText('לחיצת רגליים').length).toBeGreaterThanOrEqual(2)

    /*
      לחיצה על המספר פותחת את המסך המלא — **על אותו טיימר**. חותמת הסיום
      היא מקור אמת אחד בחנות, ולכן פתיחת השכבה לא נוגעת בה בכלל.
    */
    const before = useWorkout.getState().workout?.restEndsAt
    await user.click(clock)
    await screen.findByRole('dialog')
    expect(useWorkout.getState().workout?.restEndsAt).toBe(before)

    // וה-✕ מחזיר למנוחה שבכרטיס בלי לעצור אותה
    await user.click(screen.getByRole('button', { name: /סגור את מסך המנוחה/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(useWorkout.getState().workout?.restEndsAt).toBe(before)
  }, 40000)

  it('המסך המלא מציג את הכרטיס, מה נשאר, מה הבא ואת מפת השרירים', async () => {
    const user = userEvent.setup()
    await useWorkout.getState().start('F1', [])
    const queue = useWorkout.getState().workout?.queue ?? []
    const first = queue[0].key
    const nextName = useWorkout.getState().exercisesById[queue[1].exerciseId].name

    // סט עבודה אחד ואז מנוחה — בדיוק מה שקורה בלחיצה על "סיים סט"
    await useWorkout.getState().logSet(first, 'work', 100, 10)
    await useWorkout.getState().startRest(first, 90)

    window.location.hash = '#/workout'
    render(<App />)

    await user.click(
      await screen.findByRole('button', { name: /פתח את מסך המנוחה המלא/ }, { timeout: SLOW })
    )

    /*
      הכפתור הראשי אומר לאן הלחיצה מובילה — "סט הבא" כשנשאר סט בתרגיל הזה,
      "לתרגיל הבא" כשהיעד הושלם. "דלג" ירד מהמסך: אותה פעולה בדיוק, אבל השם
      תיאר ויתור על משהו בזמן שהלחיצה היא ההתחלה של הסט הבא.
    */
    const start = await screen.findByRole('button', { name: 'סט הבא' }, { timeout: SLOW })
    expect(screen.queryByRole('button', { name: 'דלג על המנוחה' })).toBeNull()

    // כרטיס השרירים של התרגיל ממלא את הטבעת
    await waitFor(() =>
      expect(document.querySelector('img[src*="45_plate_loaded_leg_press"]')).toBeTruthy()
    )

    /*
      מה נשאר בתרגיל הזה, ומה מחכה אחריו בתור — ושתי הטענות נשאלות *בתוך*
      השכבה: מסך האימון חי מתחתיה עם אותם שמות בדיוק, ושאילתה גלובלית הייתה
      עוברת גם אם השכבה לא הציגה כלום.
    */
    const sheet = within(screen.getByRole('dialog'))
    expect(sheet.getByText(/סט 1 הושלם/)).toBeTruthy()
    expect(sheet.getByText(nextName)).toBeTruthy()

    /*
      מפת השרירים עם האחוזים. על הכרטיס של מכונת הרגליים מודפסים 50/30/15
      לשלושת ראשי הארבע-ראשי ועוד 5 לעכוז — 100 בדיוק, כלומר חלוקה של אותה
      עבודה — ולכן 95% הוא חיבור של פרוסות ולא מספר חדש.
    */
    expect(sheet.getByText('95%')).toBeTruthy()
    /*
      והשם הוא זה שהאפליקציה משתמשת בו. הכרטיס של מכונת הרגליים מפרק את
      הארבע-ראשי לשלושה ראשים ומדפיס עליהם "ונדוס לטרליס" ו"רקטוס פמוריס" —
      שמות שתבור לא בחר מעולם ולא רואה בשום מסך אחר. הם מתאחדים לשורה אחת
      בשפה שלנו, ואחוז אחד שהוא סכום הפרוסות של אותה עוגה.
    */
    expect(sheet.getByText('ארבע-ראשי')).toBeTruthy()
    expect(sheet.queryByText(/ונדוס|רקטוס/)).toBeNull()

    // הכוונון קופץ ב-30 שניות לשני הכיוונים
    const before = useWorkout.getState().workout?.restEndsAt ?? 0
    await user.click(screen.getByRole('button', { name: 'הוסף 30 שניות' }))
    await waitFor(() =>
      expect((useWorkout.getState().workout?.restEndsAt ?? 0) - before).toBeGreaterThan(25_000)
    )
    await user.click(screen.getByRole('button', { name: 'הפחת 30 שניות' }))
    await waitFor(() =>
      expect(Math.abs((useWorkout.getState().workout?.restEndsAt ?? 0) - before)).toBeLessThan(2_000)
    )

    // והלחיצה על הכפתור הראשי מסיימת את המנוחה
    await user.click(start)
    await waitFor(() => expect(useWorkout.getState().workout?.restEndsAt).toBeNull())
  }, 40000)

  /*
    התמונה שבטבעת היא הכניסה לגלריה, בדיוק כמו הריבוע שעל הכרטיס.

    הבדיקה נכנסת דרך המסך המלא **אחרי שהיעד הושלם**, וזה לא סתם תרחיש: שם
    התור כבר התקדם, והתרגיל שעל התמונה אינו הפעיל. גלריה שקשורה לתרגיל הפעיל
    הייתה נפתחת על התרגיל הבא — תמונה אחת על המסך ואחרת מתחת לאצבע.
  */
  it('לחיצה על התמונה במסך המלא פותחת את הגלריה של התרגיל שנחים ממנו', async () => {
    const user = userEvent.setup()
    await useWorkout.getState().start('F1', [])
    const queue = useWorkout.getState().workout?.queue ?? []
    const first = queue[0].key
    const firstName = useWorkout.getState().exercisesById[queue[0].exerciseId].name

    // סוגרים את התרגיל: מנוחה רצה עליו, אבל הפעיל כבר הבא בתור
    await useWorkout.getState().logSet(first, 'work', 100, 10)
    await useWorkout.getState().startRest(first, 90)
    await useWorkout.getState().completeCurrent()
    expect(useWorkout.getState().workout?.currentKey).not.toBe(first)

    window.location.hash = '#/workout'
    render(<App />)

    await user.click(
      await screen.findByRole('button', { name: /פתח את מסך המנוחה המלא/ }, { timeout: SLOW })
    )
    await user.click(
      await screen.findByRole('button', { name: `הדגמות ואחוזי העומס של ${firstName}` })
    )

    /*
      הגלריה נפתחה, והיא של התרגיל שעל התמונה — לא של זה שהתור עבר אליו.
      הכותרת שלה נושאת את השם, וזו הטענה שמפרידה בין השניים.
    */
    expect(
      await screen.findByRole('dialog', { name: `הדגמות והסברים — ${firstName}` })
    ).toBeTruthy()
    // והספירה לא נעצרה מתחתיה
    expect(useWorkout.getState().workout?.restEndsAt).not.toBeNull()
  }, 40000)
})
