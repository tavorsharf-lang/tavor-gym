import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { invalidateHiddenVideos } from './db/hiddenVideos'
import { invalidateHiddenExercises } from './db/hiddenExercises'
import { invalidateVideoPrefs } from './db/videoPrefs'
import { groupCardFor, muscleCardFor } from './db/muscleCards'
import { useBasket } from './state/builderBasket'

/**
 * הכרטיסים האנטומיים במסך התרגילים.
 *
 * ‏`muscleCards.test.ts` בודק שהמיפוי והמניפסט מסתדרים, ולכן הוא היה עובר
 * בשלמותו גם אם הכותרת חזרה בשקט להיות טקסט בלי ריבוע — וזה בדיוק הכשל
 * הסביר כאן, כי כותרת בלי ריבוע נראית תקינה לגמרי.
 *
 * שתי בדיקות בלבד, מאותו שיקול עלות כמו בשאר בדיקות ה-UI: כל אחת מרנדרת את
 * האפליקציה כולה ומאתחלת את המסד.
 */

/*
  ‏`SLOW` הוא תקרת ההמתנה, ו-40000 היא תקרת הבדיקה עצמה. שתיהן נחוצות: המתנה
  של חמש-עשרה שניות בתוך `it` שברירת המחדל שלו היא חמש היא הבטחה ריקה — תחת
  עומס הבדיקה מתה לפני שההמתנה נגמרה, והכשל נראה כמו רגרסיה במקום מה שהוא,
  מכונה תפוסה. שאר בדיקות ה-UI כבר מעבירות 40000 מאותה סיבה.
*/
const SLOW = 15_000

async function resetAll(): Promise<void> {
  window.location.hash = '#/'
  useBasket.getState().clear()
  invalidateHiddenVideos()
  invalidateHiddenExercises()
  invalidateVideoPrefs()
  await db.delete()
  await db.open()
  await ensureReady()
}

describe('כרטיסים אנטומיים במסך התרגילים', () => {
  beforeEach(resetAll)

  it('כותרת התת-קטגוריה פותחת את הכרטיס של אותו שריר', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/exercises'
    render(<App />)

    const card = muscleCardFor('חזה עליון')
    expect(card).not.toBeNull()

    const heading = await screen.findByRole(
      'button',
      { name: 'חזה עליון — איפה השריר הזה יושב' },
      { timeout: SLOW }
    )
    // הכותרת מציגה את הממוזערת שנכנסת ל-precache, לא את המלאה
    expect(heading.querySelector('img')?.getAttribute('src')).toContain(card!.thumb)

    await user.click(heading)

    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector(`img[alt="כרטיס אנטומי — ${card!.nameHe}"]`)).not.toBeNull()
  }, 40000)

  it('כותרת הקבוצה פותחת את כרטיס הסקירה שלה', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/exercises'
    render(<App />)

    const overview = groupCardFor('chest')
    expect(overview).not.toBeNull()

    const button = await screen.findByRole(
      'button',
      { name: 'שרירי חזה — כרטיס אנטומי' },
      { timeout: SLOW }
    )
    await user.click(button)

    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector(`img[alt="כרטיס אנטומי — ${overview!.nameHe}"]`)).not.toBeNull()
  }, 40000)
})
