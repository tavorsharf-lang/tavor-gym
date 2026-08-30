import { describe, expect, it } from 'vitest'
import { IMAGE_MANIFEST } from '@/db/imageManifest'
import { IMAGES_WITHOUT_PERCENTAGES, MUSCLE_BREAKDOWN } from '@/db/muscleBreakdown'
import { EXERCISE_IMAGES } from '@/db/exerciseImages'
import { LIBRARY_CATALOG } from '@/db/libraryManifest'
import { SEED_EXERCISES } from '@/db/seed'
import { MUSCLE_TAXONOMY, NOT_A_SUBTARGET, breakdownFor, primaryPctFor, secondaryFor, subTargetFor } from '@/db/subTargets'
import type { MuscleGroup } from '@/db/types'

/**
 * ‏`MUSCLE_BREAKDOWN` הוא תמלול ידני של 89 תמונות, ולכן הכשל שמאיים עליו הוא
 * דריפט: תמונה שמוחלפת בייבוא הבא, מזהה שמשתנה, או תווית חדשה שאין לה מקום
 * בטקסונומיה. כל אלה מתבטאים בשקט — `subTargetFor` פשוט מחזיר null והשורה
 * נופלת ל"אחר" בלי שאף אחד יראה שגיאה.
 */
describe('התמלול מול מאגר התמונות', () => {
  it('כל מזהה בתמלול הוא תמונה קיימת', () => {
    expect(Object.keys(MUSCLE_BREAKDOWN).filter((id) => !IMAGE_MANIFEST[id])).toEqual([])
  })

  it('כל תמונה מתומללת, או רשומה במפורש כחסרת אחוזים', () => {
    const without = new Set(IMAGES_WITHOUT_PERCENTAGES)
    const missing = Object.keys(IMAGE_MANIFEST).filter(
      (id) => !MUSCLE_BREAKDOWN[id] && !without.has(id)
    )
    expect(missing).toEqual([])
  })

  /*
    כל תווית חייבת להיות מסווגת — או תת-קטגוריה, או מוחרגת במפורש. תווית
    חדשה שאף אחד לא הכריע לגביה נופלת כאן, וזה בדיוק הרגע שבו צריך להכריע:
    בלי הבדיקה היא פשוט נעלמת מהמסך בשקט.
  */
  it('כל תווית שריר מסווגת — כתת-קטגוריה או כמוחרגת', () => {
    const unknown = new Set<string>()
    for (const rows of Object.values(MUSCLE_BREAKDOWN))
      for (const row of rows)
        if (!MUSCLE_TAXONOMY[row.en] && !NOT_A_SUBTARGET.has(row.en)) unknown.add(row.en)
    expect([...unknown]).toEqual([])
  })

  it('המוחרגות אינן גם תת-קטגוריה', () => {
    expect([...NOT_A_SUBTARGET].filter((en) => MUSCLE_TAXONOMY[en])).toEqual([])
  })

  it('האחוזים חיוביים ולא עולים על 100', () => {
    const bad: string[] = []
    for (const [id, rows] of Object.entries(MUSCLE_BREAKDOWN))
      for (const row of rows)
        if (row.pct <= 0 || row.pct > 100) bad.push(`${id} → ${row.en} ${row.pct}`)
    expect(bad).toEqual([])
  })
})

describe('שיוך תרגיל לתת-קטגוריה', () => {
  const groupOf = new Map<string, MuscleGroup>([
    ...SEED_EXERCISES.map((e) => [e.id, e.muscleGroup] as const),
    ...LIBRARY_CATALOG.map((e) => [e.id, e.muscleGroup] as const),
  ])

  it('לכל תרגיל שיש לו כרטיס יש תת-קטגוריה', () => {
    const without: string[] = []
    for (const id of Object.keys(EXERCISE_IMAGES)) {
      const group = groupOf.get(id)
      if (!group) continue
      if (breakdownFor(id).length === 0) continue
      if (!subTargetFor(id, group)) without.push(id)
    }
    expect(without).toEqual([])
  })

  /*
    זה הכלל שההגבלה לקבוצה קיימת בשבילו. `dips` בקטלוג הוא יד אחורית, והכרטיס
    שלו מסמן חזה תחתון 48 מול טרייספס 27 — בלי ההגבלה הוא היה מקבל כותרת של
    חזה בתוך מסך היד האחורית.
  */
  it('התת-קטגוריה מוגבלת לקבוצת השריר של התרגיל', () => {
    expect(subTargetFor('dips', 'triceps')).toBe('תלת-ראשי')
    expect(primaryPctFor('dips', 'triceps')).toBe(27)
    // אותה תמונה בדיוק, מקבוצה אחרת — ושם דווקא החזה הוא הכותרת
    expect(subTargetFor('lib-machine_chest_press', 'chest')).toBe('חזה אמצעי')
  })

  it('העיקרי הוא בעל האחוז הגבוה, והמשניים כל השאר', () => {
    expect(subTargetFor('db-bench-press', 'chest')).toBe('חזה אמצעי')
    expect(primaryPctFor('db-bench-press', 'chest')).toBe(65)
    const secondary = secondaryFor('db-bench-press', 'chest')
    expect(secondary.map((m) => m.he)).not.toContain('חזה אמצעי')
    // מייצבים אינם תת-קטגוריה ולכן אינם תגית
    expect(secondary.map((m) => m.he)).not.toContain('מייצבים')
  })

  it('תרגיל בלי כרטיס מחזיר null ולא נופל', () => {
    expect(subTargetFor('לא-קיים', 'chest')).toBeNull()
    expect(secondaryFor('לא-קיים', 'chest')).toEqual([])
    expect(primaryPctFor('לא-קיים', 'chest')).toBeNull()
  })

  /*
    לפשיטת מרפקים מעל הראש הכרטיס הראשון הוא כרטיס הסבר בלי אחוזים. הבדיקה
    נועלת את הדילוג עליו — בלעדיו התרגיל היה חוזר בלי תת-קטגוריה בכלל.
  */
  it('מדלג על כרטיס שאין עליו אחוזים', () => {
    expect(breakdownFor('overhead-tricep-ext').length).toBeGreaterThan(0)
    expect(subTargetFor('overhead-tricep-ext', 'triceps')).toBe('תלת-ראשי — ראש ארוך')
  })
})

/*
  רשימת התוויות היא ממשק ולא פרט פנימי: היא מה שכתוב ככותרת במסך התרגילים,
  מה שכתוב על הצ׳יפים, ומה שהמשתמש מחפש לפיו. שינוי שם הוא החלטה שצריך לקבל
  במפורש, ולא תוצר לוואי של הוספת מיפוי לשריר חדש — ולכן הרשימה נעולה כאן.
*/
describe('רשימת התת-קטגוריות', () => {
  const EXPECTED: Record<MuscleGroup, string[]> = {
    chest: ['חזה עליון', 'חזה אמצעי', 'חזה תחתון', 'סראטוס'],
    back: ['רחב גבי', 'עגול גדול', 'מעוינים', 'טרפז אמצעי-תחתון', 'זוקפי הגב'],
    shoulders: ['כתף קדמית', 'כתף אמצעית', 'כתף אחורית', 'טרפז עליון', 'חוגרת המסובבים'],
    biceps: ['דו-ראשי', 'דו-ראשי — ראש קצר', 'דו-ראשי — ראש ארוך', 'ברכיאליס'],
    triceps: [
      'תלת-ראשי',
      'תלת-ראשי — ראש ארוך',
      'תלת-ראשי — ראש חיצוני',
      'תלת-ראשי — ראש פנימי',
    ],
    legs: [
      'ארבע-ראשי',
      'עכוז גדול',
      'עכוז אמצעי',
      'המסטרינגס',
      'מקרבים',
      'כופפי הירך',
      'תאומים',
      'סוליאוס',
      'פרונאוס',
    ],
    abs: ['ישר בטני', 'אלכסונים', 'בטן עמוקה', 'כופפי הירך'],
    forearms: ['כופפי אמה', 'פושטי אמה', 'ברכיורדיאליס'],
  }

  it('כל קבוצה מחזיקה בדיוק את התוויות שהוכרעו', () => {
    const actual = {} as Record<MuscleGroup, string[]>
    for (const { sub, group } of Object.values(MUSCLE_TAXONOMY)) {
      const list = (actual[group] ??= [])
      if (!list.includes(sub)) list.push(sub)
    }
    expect(actual).toEqual(EXPECTED)
  })

  /*
    שלוש ההצמדות שאינן אנטומיה טהורה. הן מכוונות, ולכן הן כתובות ולא נסמכות
    על הזיכרון של מי שיקרא את הקובץ בפעם הבאה.
  */
  it('העדין הוא מקרב, והחייט אינו המסטרינג', () => {
    expect(MUSCLE_TAXONOMY['Gracilis']).toEqual({ sub: 'מקרבים', group: 'legs' })
    expect(MUSCLE_TAXONOMY['Sartorius']).toEqual({ sub: 'כופפי הירך', group: 'legs' })
  })

  it('הברכיורדיאליס הוא שריר אמה', () => {
    expect(MUSCLE_TAXONOMY['Brachioradialis'].group).toBe('forearms')
  })

  it('"כופפי הירך" חיה בשתי קבוצות במכוון — זה אותו שריר', () => {
    expect(MUSCLE_TAXONOMY['Iliopsoas'].group).toBe('abs')
    expect(MUSCLE_TAXONOMY['Sartorius'].sub).toBe(MUSCLE_TAXONOMY['Iliopsoas'].sub)
  })

  /* הפיצול של השוק הוא ההבדל היחיד שנראה על המסך: כותרת אחת התחלפה */
  it('הרמת עקבים יושבת תחת תאומים ולא תחת שוק', () => {
    expect(subTargetFor('calf-raise', 'legs')).toBe('תאומים')
    expect(secondaryFor('calf-raise', 'legs').map((m) => m.he)).toContain('סוליאוס')
  })
})
