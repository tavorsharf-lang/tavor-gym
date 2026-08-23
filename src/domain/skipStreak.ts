import type { Session } from '@/db/types'

/**
 * כמה פעמים ברצף דילגת על תרגיל.
 *
 * המטרה: להציע להוציא מהתוכנית תרגיל שאתה לא באמת עושה. תוכנית שכתובה בה
 * שורה שמדולגת כל שבוע היא תוכנית שמשקרת — ההצעה במסך הבית, פס ההתקדמות
 * באימון וספירת הכיסוי כולם מודדים מול משהו שכבר לא קורה.
 *
 * שתי החלטות שקובעות אם המספר אמין:
 *
 *  1. **רק דילוג מוצהר נספר.** אימון שנגמר באמצע משאיר חצי תוכנית בלי סטים,
 *     וספירה לפי `skippedExerciseIds` הייתה מסמנת את כולם כמיותרים אחרי
 *     שלושה ערבים עמוסים. `deliberatelySkippedIds` הוא מה שנלחץ ביד.
 *  2. **הרצף נשבר רק על אימון שהתרגיל היה בו.** אימון שהתרגיל בכלל לא תוכנן
 *     בו (יום אחר בפיצול, אימון חופשי) אינו הצבעה לשום כיוון, ולכן הוא מדולג
 *     בספירה במקום לאפס אותה — אחרת בפיצול A/B/C הרצף לעולם לא היה מגיע ל-3.
 */

/** מכמה דילוגים רצופים מציעים להוציא מהתוכנית */
export const SKIP_STREAK_THRESHOLD = 3

/**
 * @param sessions ההיסטוריה, בסדר כלשהו. הפונקציה ממיינת בעצמה מהחדש לישן.
 * @returns אורך הרצף העדכני של דילוגים מוצהרים, 0 כשהאימון האחרון שכלל את
 *   התרגיל לא דילג עליו.
 */
export function skipStreak(exerciseId: string, sessions: readonly Session[]): number {
  const ordered = [...sessions].sort((a, b) => b.startedAt - a.startedAt)

  let streak = 0
  for (const session of ordered) {
    /*
      תרגום החלפות: הספירה מדברת על *שורת התוכנית*, לא על מי שעמד במקומה.

      `plannedOrder` נבנה מהתרגיל המקורי, בעוד `deliberatelySkippedIds` נבנה
      מהתרגיל בפועל — ולכן בלי התרגום, "המתקן תפוס → מחליף → מדלג" נספר לרעת
      המחליף ולא לרעת השורה שאף פעם לא מבוצעת. גרוע מזה: ההוצאה הייתה מוציאה
      את המחליף מכל התוכניות, כולל יום אחר בפיצול שבו הוא דווקא נעשה.
    */
    const asPlanned = (ids: readonly string[]): string[] =>
      ids.map(
        (id) =>
          session.substitutions.find((sub) => sub.actualExerciseId === id)
            ?.plannedExerciseId ?? id
      )

    // התרגיל לא היה על השולחן באימון הזה — לא הצבעה, לא שובר רצף
    const planned =
      session.plannedOrder.includes(exerciseId) ||
      asPlanned(session.actualOrder).includes(exerciseId) ||
      asPlanned(session.skippedExerciseIds).includes(exerciseId)
    if (!planned) continue

    if (asPlanned(session.deliberatelySkippedIds ?? []).includes(exerciseId)) {
      streak += 1
      continue
    }
    // התרגיל היה בתוכנית ולא דולג במפורש — הרצף נגמר כאן
    break
  }
  return streak
}

/**
 * האם להציע להוציא את התרגיל מהתוכנית *עכשיו*, אחרי הדילוג שקרה ברגע זה.
 *
 * הדילוג הנוכחי עוד לא נשמר לשום סשן — האימון פתוח — ולכן הוא נספר כאן
 * ידנית מעל ההיסטוריה. ההצעה מוצגת בדיוק על הסף ולא מעליו: מי שענה "לא,
 * תשאיר" לא אמור להישאל שוב בכל דילוג נוסף עד סוף הזמן.
 */
export function shouldSuggestRemoval(
  exerciseId: string,
  sessions: readonly Session[]
): boolean {
  return skipStreak(exerciseId, sessions) + 1 === SKIP_STREAK_THRESHOLD
}
