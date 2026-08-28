import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { invalidateHiddenVideos } from './db/hiddenVideos'
import { invalidateHiddenExercises } from './db/hiddenExercises'
import { invalidateVideoPrefs } from './db/videoPrefs'
import { primaryImageFor } from './db/exerciseImages'
import { LIBRARY_CATALOG } from './db/libraryManifest'

/**
 * כרטיס השרירים ברשימת התרגילים, והגלריה שנפתחת ממנו.
 *
 * זו הבדיקה שתופסת את מה ש-`exerciseImages.test.ts` לא יכול: הוא בודק שהמפה
 * והקבצים מסתדרים, ולכן ריבוע שלא מתרנדר בכלל — או כפתור שמנווט למסך התרגיל
 * במקום לפתוח את הגלריה — היה עובר אצלו בהצלחה מלאה.
 *
 * שתי בדיקות ולא שש, מאותו שיקול עלות כמו ב-`builder.ui.test.tsx`: כל בדיקה
 * כאן מרנדרת את האפליקציה כולה ומאתחלת את המסד.
 */

const SLOW = 15_000

async function resetAll(): Promise<void> {
  window.location.hash = '#/'
  invalidateHiddenVideos()
  invalidateHiddenExercises()
  invalidateVideoPrefs()
  await db.delete()
  await db.open()
  await ensureReady()
}

describe('כרטיס השרירים ברשימת התרגילים', () => {
  beforeEach(resetAll)

  it('השורה מציגה את הכרטיס, והריבוע פותח את הגלריה עליו', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/exercises'
    render(<App />)

    // המתנה לתוכן ולא לכותרת — הכותרת מרונדרת לפני שהשאילתות חזרו
    const squat = primaryImageFor('machine-squat')
    expect(squat).not.toBeNull()

    const thumb = await screen.findByRole(
      'button',
      { name: `אילו שרירים עובדים ב${squat!.nameHe}` },
      { timeout: SLOW }
    )
    // הריבוע מצייר את הממוזערת ולא פריים מהסרטון
    const img = thumb.querySelector('img')
    expect(img?.getAttribute('src')).toContain(squat!.thumb)

    await user.click(thumb)

    // הגלריה נפתחה על הכרטיס — לא על סרטון, ולא על מסך התרגיל
    const dialog = await screen.findByRole('dialog', {}, { timeout: SLOW })
    await waitFor(() =>
      expect(dialog.querySelector(`img[alt="אילו שרירים עובדים ב${squat!.nameHe}"]`)).not.toBeNull()
    )
    expect(window.location.hash).toBe('#/exercises')
  }, 40000)

  it('גוף השורה עדיין מנווט למסך התרגיל', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/exercises'
    render(<App />)

    /*
      איתור לפי הטקסט ולא לפי שם נגיש: השם הנגיש של כפתור השורה מורכב מכל מה
      שבתוכו — שם, שם באנגלית, תת-מיקוד, ציוד והביצוע האחרון — ולכן הוא ארוך
      ותלוי בנתונים. הטקסט של שם התרגיל הוא מה שהמשתמש באמת מזהה.
    */
    const label = await screen.findByText('סקוואט במכונה', {}, { timeout: SLOW })
    const row = label.closest('button')
    expect(row).not.toBeNull()
    await user.click(row!)
    await waitFor(() => expect(window.location.hash).toBe('#/exercise/machine-squat'))
  }, 40000)

  /*
    הדגל `startOnImage` קיים בדיוק בשביל הבדיקה הזו.

    לפני שהוא נוסף המיקום ההתחלתי הוסק מ-`startIndex === 0`, וזה שבר את מסך
    תרגיל המאגר: לחיצה על **הסרטון הראשון** שולחת startIndex=0, ולכן היא הייתה
    נוחתת על הכרטיס במקום על הסרטון שנלחץ.
  */
  it('במסך תרגיל המאגר הסרטון הראשון עדיין נפתח על הסרטון', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/library/lib-goblet_squat'
    render(<App />)

    // הכפתור מזוהה לפי נושא הסרטון — הוא מה שכתוב עליו, ואין לו aria-label
    const topic = LIBRARY_CATALOG.find((e) => e.id === 'lib-goblet_squat')!.videos[0].topic
    const label = await screen.findByText(topic, {}, { timeout: SLOW })
    const first = label.closest('button')
    expect(first).not.toBeNull()
    await user.click(first!)

    const dialog = await screen.findByRole('dialog', {}, { timeout: SLOW })
    // וידאו ולא תמונה — הכרטיס נשאר זמין בגלריה, אבל לא הוא מה שנפתח
    await waitFor(() => expect(dialog.querySelector('video')).not.toBeNull())
    expect(dialog.querySelector('img[alt^="אילו שרירים"]')).toBeNull()
  }, 40000)
})
