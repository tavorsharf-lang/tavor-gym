import { SEED_EXERCISES } from './seed'
import type { Exercise } from './types'

/**
 * התיקונים של מיגרציה 10 שאינם שם, מיקוד או דגשים — במקום אחד.
 *
 * מודול נפרד ולא קוד בתוך המיגרציה, מאותה סיבה כמו `calfMerge`: מיגרציה רצה
 * פעם אחת ורק על מסד שעולה מגרסה 9, אבל אותה המרה נחוצה שוב בכל ייבוא גיבוי —
 * קובץ שנוצר לפני הפיצול מחזיר את הרשומות הישנות לתוך מסד שכבר בגרסה 10, ושם
 * אין מיגרציה שתתפוס אותן.
 *
 * שני התיקונים כאן נולדו מצפייה חוזרת בסרטונים:
 *
 *  1. `db-bench-press` הוא תרגיל מוט ולא דאמבלים (זה כבר תוקן בשם בגרסה 3),
 *     ולכן `usesPlates` שלו היה צריך להיות דלוק מאז. בלי זה מחשבון הפלטות
 *     כבוי דווקא בתרגיל היחיד בקטלוג שבו באמת מעמיסים פלטות על מוט.
 *  2. `dips` הועבר כאן מ-`chest` ל-`triceps` על סמך כותרת הסרטון. **ההעברה
 *     הזו בוטלה במיגרציה 16** — כרטיס השרירים של המכונה, שנכנס למאגר אחרי
 *     גרסה 10, מודד חזה תחתון 48% מול טרייספס 27%. ראה `dipsChest.ts`.
 *
 * הפונקציה מחזירה את אותו אובייקט כשאין מה לשנות, כדי שהקורא ידלג על הכתיבה.
 */

/** הרשומה השטוחה — המזהה ההיסטורי, ולכן זה שנושא את כל ההיסטוריה */
export const FLAT_BENCH_ID = 'db-bench-press'

/** התאומה שנולדה בפיצול */
export const INCLINE_BENCH_ID = 'incline-barbell-bench-press'

export function withV10Fields(exercise: Exercise): Exercise {
  if (exercise.id === FLAT_BENCH_ID && !exercise.usesPlates) {
    return { ...exercise, usesPlates: true }
  }
  /*
    כאן ישבה גם העברת `dips` מ-`chest` ל-`triceps`.

    היא הוסרה במיגרציה 16 ולא נשארה כ"מה שהיה נכון בגרסה 10", בשונה משאר
    התיקונים הקפואים בקובץ הזה — כי היא לא טקסט אלא **סיווג**, והיא ממשיכה
    לרוץ בכל ייבוא גיבוי. אילו הייתה נשארת, כל שחזור היה מחזיר את הסיווג
    שהוסר. ההיפוך והראיות שלו יושבים ב-`dipsChest.ts`.
  */
  return exercise
}

/** הרשומה החדשה כפי שהזריעה מגדירה אותה — מקור אחד לשתי דרכי ההגעה */
export function inclineBenchSeed(): Exercise {
  const seeded = SEED_EXERCISES.find((e) => e.id === INCLINE_BENCH_ID)
  if (!seeded) throw new Error(`הזריעה חייבת להכיל את ${INCLINE_BENCH_ID}`)
  return { ...seeded }
}

/**
 * משלים את רשומת השיפוע לרשימת תרגילים שהגיעה בלי אותה — גיבוי ישן, או מסד
 * שעולה מגרסה 9. היא נכנסת מיד אחרי הרשומה השטוחה ודוחפת את כל מי שאחריה
 * מקום אחד קדימה, כדי שהקטלוג יישאר ממוין ושתי התאומות יישבו זו ליד זו.
 *
 * מחזירה את אותו מערך כשהרשומה כבר קיימת.
 */
export function withInclineBench(exercises: readonly Exercise[]): readonly Exercise[] {
  if (exercises.some((e) => e.id === INCLINE_BENCH_ID)) return exercises
  const flat = exercises.find((e) => e.id === FLAT_BENCH_ID)
  // בלי הרשומה השטוחה אין למה להיצמד — הקטלוג הזה לא נזרע מהזריעה שלנו
  if (!flat) return exercises
  const now = Date.now()
  const fresh: Exercise = { ...inclineBenchSeed(), order: flat.order + 1, createdAt: now, updatedAt: now }
  return [
    ...exercises.map((e) => (e.order > flat.order ? { ...e, order: e.order + 1 } : e)),
    fresh,
  ]
}
