import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { invalidateHiddenVideos } from './db/hiddenVideos'
import { invalidateHiddenExercises } from './db/hiddenExercises'
import { invalidateVideoPrefs } from './db/videoPrefs'
import { invalidateMuscleFixes } from './db/muscleFixes'
import { useBasket } from './state/builderBasket'

/**
 * תיקון שם ושיוך שריר מתוך רשימת התרגילים.
 *
 * ‏`muscleFixes.test.ts` נועל את שכבת הנתונים, והוא היה עובר בשלמותו גם אם
 * הלחיצה הארוכה מפסיקה לירות או אם היא יורה ו*גם* מנווטת למסך התרגיל — שני
 * הכשלים הסבירים כאן, ושניהם בלתי נראים בבדיקת מסד.
 *
 * שתי בדיקות, וזו ההפרדה: לשורה בקטלוג יש רשומה לכתוב אליה, ולשורת מאגר אין
 * — שינוי שם שם *חייב* ליצור לה כרטיס, ואת הצלע הזו אין איפה לבדוק חוץ מכאן.
 * כל אחת מרנדרת את האפליקציה כולה ומאתחלת את המסד, ולכן אין שלישית.
 */

const SLOW = 15_000
/**
 * לשמירה עצמה. ברירת המחדל של `waitFor` היא שנייה, וזה מעט מדי כאן: השמירה
 * היא שרשרת של שלוש כתיבות (השכבה, יצירת הכרטיס, השם), ותחת ריצת הסוויטה
 * המלאה fake-indexeddb איטית מספיק כדי לחרוג — כלומר הבדיקה נכשלה על זמן
 * ולא על התנהגות.
 */
const SETTLE = 8_000
/** קצת מעבר ל-HOLD_MS שב-useLongPress */
const HOLD = 600

async function resetAll(): Promise<void> {
  window.location.hash = '#/'
  useBasket.getState().clear()
  invalidateHiddenVideos()
  invalidateHiddenExercises()
  invalidateVideoPrefs()
  invalidateMuscleFixes()
  await db.delete()
  await db.open()
  await ensureReady()
}

/**
 * לחיצה ארוכה על אלמנט, בלי תזוזה — כלומר לא גלילה.
 *
 * ה-click בסוף אינו קישוט: הוא מה שהדפדפן שולח אחרי ההרפיה, והוא בדיוק מה
 * שהיה מנווט למסך התרגיל מתחת לגיליון שנפתח.
 */
async function longPress(el: HTMLElement): Promise<void> {
  fireEvent.pointerDown(el, { button: 0, clientX: 40, clientY: 40 })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, HOLD))
  })
  fireEvent.pointerUp(el)
  fireEvent.click(el)
}

describe('תיקון שיוך שריר ברשימת התרגילים', () => {
  beforeEach(resetAll)

  /** גוף השורה, להבדיל מהריבוע שנושא את אותו שם ב-aria-label */
  async function rowFor(name: RegExp): Promise<HTMLElement> {
    const candidates = await screen.findAllByRole('button', { name }, { timeout: SLOW })
    const row = candidates.find((b) => !b.getAttribute('aria-label'))
    expect(row).toBeDefined()
    return row!
  }

  it(
    'לחיצה ארוכה משנה שם ומעבירה לקבוצה אחרת, בלי לנווט למסך התרגיל',
    async () => {
      const user = userEvent.setup()
      window.location.hash = '#/exercises'
      render(<App />)

      await longPress(await rowFor(/מקבילים במכונה/))

      // הגיליון נפתח — ולא ניווטנו למסך התרגיל, שאין בו כפתור "שמור"
      const sheet = await screen.findByRole('dialog')
      expect(window.location.hash).toBe('#/exercises')
      const saveBtn = within(sheet).getByRole('button', { name: 'שמור' }) as HTMLButtonElement
      // נפתח על המצב הנוכחי, ולכן אין מה לשמור עד שמשנים משהו
      expect(saveBtn.disabled).toBe(true)

      const nameField = within(sheet).getByLabelText('שם התרגיל')
      await user.clear(nameField)
      await user.type(nameField, 'מקבילים')

      await user.click(within(sheet).getByRole('button', { name: 'חזה', pressed: false }))
      await user.click(within(sheet).getByRole('button', { name: 'חזה עליון' }))
      await user.click(saveBtn)

      /*
        הקבוצה נכתבת לרשומה עצמה ולא לשכבת התצוגה — זו כל ההבחנה של
        `saveMuscleFix`, וזו הצלע שאי אפשר לראות במסך.
      */
      await waitFor(async () => {
        const after = await db.exercises.get('dips')
        expect(after?.name).toBe('מקבילים')
        expect(after?.muscleGroup).toBe('chest')
        expect(after?.secondaryMuscles).not.toContain('chest')
      }, { timeout: SETTLE })
    },
    SLOW
  )

  /**
   * לשורת מאגר אין רשומה לשמור בה שם, ולכן השמירה חייבת ליצור לה כרטיס —
   * ובסדר הנכון: התיקון קודם, כדי ש-`addFromLibrary` יעביר אותו לכרטיס
   * שהוא יוצר. הפוך, הכרטיס היה נולד עם הקבוצה שבמניפסט וגובר עליה לנצח.
   */
  it(
    'שינוי שם לשורת מאגר יוצר לה כרטיס, עם השיוך המתוקן',
    async () => {
      const user = userEvent.setup()
      window.location.hash = '#/exercises'
      render(<App />)

      // שורות המאגר חיות רק במצב "הכל"
      await user.click(await screen.findByRole('button', { name: 'הכל' }, { timeout: SLOW }))
      await longPress(await rowFor(/^מתח/))

      const sheet = await screen.findByRole('dialog')
      const nameField = within(sheet).getByLabelText('שם התרגיל')
      await user.clear(nameField)
      await user.type(nameField, 'מתח רחב')
      await user.click(within(sheet).getByRole('button', { name: 'כתפיים', pressed: false }))
      await user.click(within(sheet).getByRole('button', { name: 'שמור' }))

      await waitFor(async () => {
        const created = await db.exercises.where('libraryId').equals('lib-pull_up').first()
        expect(created?.name).toBe('מתח רחב')
        expect(created?.muscleGroup).toBe('shoulders')
      }, { timeout: SETTLE })
    },
    SLOW
  )
})
