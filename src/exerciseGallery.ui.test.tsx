import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { invalidateHiddenVideos } from './db/hiddenVideos'
import { invalidateHiddenExercises } from './db/hiddenExercises'
import { invalidateVideoPrefs } from './db/videoPrefs'
import { primaryImageFor } from './db/exerciseImages'
import { LIBRARY_CATALOG } from './db/libraryManifest'
import { useBasket } from './state/builderBasket'

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
  useBasket.getState().clear()
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

  it('גם בבניית אימון השורה מציגה את הכרטיס ופותחת עליו', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/builder/legs'
    render(<App />)

    const press = primaryImageFor('leg-press')
    expect(press).not.toBeNull()

    const thumb = await screen.findByRole(
      'button',
      { name: `אילו שרירים עובדים ב${press!.nameHe}` },
      { timeout: SLOW }
    )
    expect(thumb.querySelector('img')?.getAttribute('src')).toContain(press!.thumb)

    await user.click(thumb)
    const dialog = await screen.findByRole('dialog', {}, { timeout: SLOW })
    await waitFor(() =>
      expect(dialog.querySelector(`img[alt="אילו שרירים עובדים ב${press!.nameHe}"]`)).not.toBeNull()
    )
    // הלחיצה על הריבוע לא בוחרת את התרגיל לסל — היא פותחת תצוגה
    expect(useBasket.getState().items).toHaveLength(0)
  }, 40000)

  it('שורת הצ׳יפים דו-שלבית: קבוצה קודם, ובתוכה תת-השרירים שלה', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/exercises'
    render(<App />)

    /*
      ‏getAllBy ולא getBy: אותו שם שריר מופיע גם ככותרת תת-קטגוריה וגם כתגית
      משנית בשורות של תרגילים אחרים — וזה בדיוק מה שהתכוונו אליו.
    */
    await screen.findAllByText('חזה אמצעי', {}, { timeout: SLOW })
    expect(screen.getAllByText('ארבע-ראשי').length).toBeGreaterThan(0)

    /*
      ברמה הראשונה יש קבוצות שריר בלבד — זו כל מטרת השורה הדו-שלבית. הטענה
      היא על צ׳יפ ולא על היעדר הטקסט "חזה עליון" מהמסך, כי הוא מופיע שם גם
      ככותרת תת-קטגוריה; מה שמפריד ביניהם הוא `aria-pressed`, שיש רק לצ׳יפ.
    */
    expect(screen.queryAllByRole('button', { name: /^חזה עליון/, pressed: false })).toHaveLength(0)

    // הצ׳יפ של הקבוצה נושא את מספר התרגילים שבה, ולכן שמו "חזה 6"
    await user.click(screen.getByRole('button', { name: /^חזה \d+$/ }))
    await waitFor(() => expect(screen.queryByText('לחיצת רגליים')).toBeNull())

    /*
      הרמה השנייה. הצ׳יפ מסנן את השורות ולא את עצמו: כל אחיותיו נשארות על
      המסך גם אחרי הבחירה, אחרת מעבר ל"חזה אמצעי" היה דורש איפוס קודם.
    */
    const upper = await screen.findByRole('button', { name: /^חזה עליון \d+$/ })
    await user.click(upper)
    expect(upper.getAttribute('aria-pressed')).toBe('true')
    await waitFor(() =>
      expect(screen.queryByText('לחיצת חזה במוט — ספסל שטוח')).toBeNull()
    )
    expect(screen.getByText('לחיצת חזה במוט בשיפוע חיובי')).not.toBeNull()

    // "כל השרירים" מחזיר את כל הגוף — ולא מתנגש בשם עם מתג שלי/הכל
    await user.click(screen.getByRole('button', { name: 'כל השרירים' }))
    await screen.findByText('לחיצת רגליים', {}, { timeout: SLOW })
  }, 40000)

  it('מתחת לכרטיס יושבת מפת העומס, והשורה פותחת את הכרטיס האנטומי', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/exercises'
    render(<App />)

    /*
      חתירה במכונה. שני תרגילים בקטלוג חולקים את הכרטיס הזה — כבד וקל —
      ולכן getAllBy; שניהם פותחים את אותה תמונה ואת אותה מפה.
    */
    const card = primaryImageFor('seated-row-heavy')
    expect(card).not.toBeNull()
    const thumbs = await screen.findAllByRole(
      'button',
      { name: `אילו שרירים עובדים ב${card!.nameHe}` },
      { timeout: SLOW }
    )
    await user.click(thumbs[0])

    /*
      האחוזים שעל הכרטיס, כשורות שאפשר לקרוא בלי לסרוק את התמונה בעיניים.
      ‏`within` על הגלריה ולא `screen`: הרשימה שמתחתיה מציגה בעצמה תגיות
      אחוזים על השורות, ובלי ההיקוף הטענה הייתה נפתרת עליהן.
    */
    const gallery = await screen.findByRole(
      'dialog',
      { name: /הדגמות והסברים/ },
      { timeout: SLOW }
    )
    await within(gallery).findByText('מפת עומס', {}, { timeout: SLOW })
    expect(within(gallery).getByText('50%')).toBeTruthy()
    expect(within(gallery).getByText('10%')).toBeTruthy()
    expect(within(gallery).getByText('רחב גבי')).toBeTruthy()

    /*
      והשורה פותחת את האנטומיה. זו השאלה שעולה מיד אחרי "מעוינים 25%" —
      איפה זה בכלל — והתשובה היא אחד מ-45 הכרטיסים שכבר יש לנו.
    */
    await user.click(within(gallery).getByRole('button', { name: /^רחב גבי 50 אחוז/ }))
    await screen.findByAltText('כרטיס אנטומי — רחב גבי', {}, { timeout: SLOW })
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
