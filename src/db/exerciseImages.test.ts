// @vitest-environment node
// eslint-disable-next-line
/// <reference types="node" />
// אותה סיבה כמו ב-manifests.test.ts: הבדיקה נוגעת בדיסק, וזה מה שאי אפשר
// לעשות בדפדפן. קוד האפליקציה עצמו לא נוגע ב-API של השרת.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { IMAGE_COUNT, IMAGE_MANIFEST } from '@/db/imageManifest'
import { EXERCISE_IMAGES, IMAGELESS_NOTES, imagesFor, primaryImageFor } from '@/db/exerciseImages'
import { LIBRARY_CATALOG } from '@/db/libraryManifest'
import { SEED_EXERCISES } from '@/db/seed'

const PUBLIC = join(process.cwd(), 'public')

/**
 * המניפסט נוצר על ידי scripts/import-images.mjs והקבצים מקובעים ב-git.
 *
 * הכשל שהבדיקות האלה קיימות בשבילו הוא אותו כשל שקט של מניפסט הסרטונים: מזהה
 * שמשתנה בהרצה חוזרת הופך ערך ב-EXERCISE_IMAGES למצביע מת, `imagesFor` מחזיר
 * מערך ריק, והשורה חוזרת בשקט לפריים הסרטון בלי שאף אחד יראה שגיאה.
 */
describe('כרטיסי השרירים מול הדיסק', () => {
  it('כל תמונה וכל ממוזערת קיימות ב-public', () => {
    const missing: string[] = []
    for (const img of Object.values(IMAGE_MANIFEST)) {
      if (!existsSync(join(PUBLIC, img.src))) missing.push(img.src)
      if (!existsSync(join(PUBLIC, img.thumb))) missing.push(img.thumb)
    }
    expect(missing).toEqual([])
  })

  it('הספירה במניפסט תואמת למספר הרשומות', () => {
    expect(Object.keys(IMAGE_MANIFEST).length).toBe(IMAGE_COUNT)
  })
})

describe('שיוך הכרטיסים לתרגילים', () => {
  it('כל מזהה תמונה במפה קיים במניפסט', () => {
    const dead: string[] = []
    for (const [exerciseId, ids] of Object.entries(EXERCISE_IMAGES)) {
      for (const id of ids) if (!IMAGE_MANIFEST[id]) dead.push(`${exerciseId} → ${id}`)
    }
    expect(dead).toEqual([])
  })

  it('כל מפתח במפה הוא תרגיל אמיתי — בקטלוג או במאגר', () => {
    const known = new Set([...SEED_EXERCISES.map((e) => e.id), ...LIBRARY_CATALOG.map((e) => e.id)])
    expect(Object.keys(EXERCISE_IMAGES).filter((id) => !known.has(id))).toEqual([])
  })

  it('לכל תרגיל בקטלוג יש כרטיס', () => {
    expect(SEED_EXERCISES.filter((e) => imagesFor(e.id).length === 0).map((e) => e.id)).toEqual([])
  })

  /*
    אין היום ולו רשומה אחת בלי כרטיס, ו-`IMAGELESS_NOTES` ריק. הבדיקה נועלת
    את שניהם יחד: רשומת מאגר חדשה בלי כרטיס תיפול כאן עד שמישהו יחליט אם היא
    צריכה תמונה או שורה מתועדת ב-IMAGELESS_NOTES.
  */
  it('כל רשומת מאגר מקבלת כרטיס, או מתועדת למה לא', () => {
    const without = LIBRARY_CATALOG.filter((e) => imagesFor(e.id).length === 0).map((e) => e.id)
    expect(without).toEqual(Object.keys(IMAGELESS_NOTES))
  })

  it('בפועל: אף תרגיל בקטלוג או במאגר אינו בלי כרטיס', () => {
    const without = [
      ...SEED_EXERCISES.filter((e) => !primaryImageFor(e.id, e.libraryId)).map((e) => e.id),
      ...LIBRARY_CATALOG.filter((e) => !primaryImageFor(e.id)).map((e) => e.id),
    ]
    expect(without).toEqual([])
  })

  it('אף תמונה לא נשארת בלי תרגיל שמצביע עליה', () => {
    const used = new Set(Object.values(EXERCISE_IMAGES).flat())
    expect(Object.keys(IMAGE_MANIFEST).filter((id) => !used.has(id))).toEqual([])
  })

  it('תרגיל בלי מיפוי משלו נופל לתרגיל המקושר במאגר', () => {
    // מזהה שאינו במפה, עם קישור למאגר שכן — בדיוק המצב של תרגיל שהמשתמש הוסיף
    expect(primaryImageFor('לא-קיים', 'lib-goblet_squat')?.nameEn).toBe('GOBLET SQUAT')
    // מזהה שאינו בשום מפה — תרגיל שהמשתמש יצר בעצמו
    expect(primaryImageFor('לא-קיים', 'lib-לא-קיים')).toBeNull()
    expect(primaryImageFor('לא-קיים')).toBeNull()
  })

  it('מזהה הקטלוג גובר על הקישור למאגר', () => {
    // dips בקטלוג הוא מכונת מקבילים עם פלטות; lib-dips הוא משקל גוף על מוטות
    expect(primaryImageFor('dips', 'lib-dips')?.nameEn).toBe('MACHINE CHEST DIP')
    expect(primaryImageFor('lib-dips')?.nameEn).toBe('PARALLEL BAR DIPS')
  })
})
