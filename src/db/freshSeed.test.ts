import { describe, expect, it } from 'vitest'
import {
  SEED_BLOCKS,
  SEED_EXERCISES,
  SEED_ROUTINES,
  freshSeedBlocks,
  freshSeedExercises,
  freshSeedRoutines,
} from './seed'
import { duplicateNames } from '@/domain/naming'

/**
 * שכבת הזריעה להתקנה חדשה.
 *
 * מה שנבדק כאן הוא חוזה בשני כיוונים, ושניהם נדרשים: מה שנשלח למכשיר של מישהו
 * אחר חייב לצאת ריק ממשקלים, ומה שנשאר בקבועים חייב להישאר מלא בהם.
 */

describe('freshSeed — מה שהתקנה חדשה מקבלת', () => {
  it('אף תרגיל לא מגיע עם משקל זריעה', () => {
    const withWeight = freshSeedExercises().filter((e) => e.seedWeightKg !== null)
    expect(withWeight.map((e) => e.id)).toEqual([])
  })

  it('אף פריט בתוכנית ובבלוק לא מגיע עם משקל התחלה', () => {
    /*
      חובה בנוסף לקטלוג ולא במקומו: `PlanItem.startWeightKg` גובר על
      `Exercise.seedWeightKg` בזמן ריצה, ולכן ריקון הקטלוג לבדו היה משאיר את
      14 המשקלים של תבור ב-F1/F2 פעילים מהסט הראשון.
    */
    const items = [...freshSeedRoutines(), ...freshSeedBlocks()].flatMap((p) => p.items)
    const withWeight = items.filter((i) => i.startWeightKg !== null)
    expect(withWeight.map((i) => i.exerciseId)).toEqual([])
  })

  it('אין שני תרגילים בעלי אותו שם — אחרת אי אפשר להבדיל ביניהם בלי משקל', () => {
    expect([...duplicateNames(freshSeedExercises())]).toEqual([])
  })

  it('שומרת על כל השאר — אותם מזהים, אותה כמות, אותו סדר', () => {
    const fresh = freshSeedExercises()
    expect(fresh.map((e) => e.id)).toEqual(SEED_EXERCISES.map((e) => e.id))
    /*
      הקישורים למאגר ולסרטונים הם לפי `id` ולא לפי שם, ולכן שינוי השם של שני
      התאומים לא מנתק סרטון או תמונה. השורה הזו היא מה שיתפוס ניסיון עתידי
      "לנקות" את הזריעה על ידי הסרת תרגיל.
    */
    expect(fresh.map((e) => e.libraryId)).toEqual(SEED_EXERCISES.map((e) => e.libraryId))
  })

  it('מחזירה את אותה הפניה כשאין מה לשנות — שלושת מסלולי הכתיבה חייבים להיות זהים', () => {
    const fresh = freshSeedExercises()
    const untouched = fresh.filter((e, i) => e === SEED_EXERCISES[i])
    // ‏6 מ-29 כבר נזרעים בלי משקל היום, ואף אחד מהם אינו תאום — הם עוברים כמו שהם
    expect(untouched.length).toBeGreaterThan(0)
  })
})

describe('גדר הפוכה — הקבועים נשארים כפי שהם', () => {
  /*
    זו הבדיקה שמונעת מאדם עתידי "לנקות" את SEED_EXERCISES ולהרוס בשקט שלושה
    דברים בבת אחת: את הפיקסטורות של naming.test ו-catalogFix.test, את התיעוד
    של מקור המספרים, ואת העותק האחרון של המשקלים של תבור בתוך המאגר — כלומר
    את מה שגורם להם לשרוד בקוד גם אם קובץ הגיבוי ילך לאיבוד.
  */
  it('המשקלים האמיתיים עדיין יושבים בקבוע', () => {
    const byId = new Map(SEED_EXERCISES.map((e) => [e.id, e.seedWeightKg]))
    expect(byId.get('leg-press')).toBe(160)
    expect(byId.get('seated-row-heavy')).toBe(60)
    expect(byId.get('seated-row-light')).toBe(50)
  })

  it('שני זוגות התאומים עדיין חולקים שם בקבוע', () => {
    expect([...duplicateNames(SEED_EXERCISES)].sort()).toEqual(
      ['חתירה במכונה', 'לחיצת חזה במכונה'].sort()
    )
  })

  it('משקלי ההתחלה של תוכנית החזרה עדיין בקבוע', () => {
    const f1 = SEED_ROUTINES.find((r) => r.id === 'F1')
    expect(f1?.items.find((i) => i.exerciseId === 'leg-press')?.startWeightKg).toBe(95)
    // הבלוקים מעולם לא נשאו משקל התחלה — הריקון שם הוא הגנה לעתיד ולא תיקון
    expect(SEED_BLOCKS.flatMap((b) => b.items).every((i) => i.startWeightKg === null)).toBe(true)
  })
})
