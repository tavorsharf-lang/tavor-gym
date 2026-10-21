import type { ActiveWorkout } from '@/db/types'

/**
 * אימון שנשכח פתוח.
 *
 * האימון יוצא מהחדר כושר יחד איתך, אבל שורת ה-`activeWorkout` נשארת. "סיים
 * אימון" הוא הלחיצה היחידה בכל הזרימה שקורית **אחרי** שהברזל נגמר, כלומר
 * בדיוק ברגע שבו הטלפון כבר בכיס — ולכן היא הלחיצה שהכי קל לא ללחוץ.
 *
 * מה שקורה אז אינו רק אימון שנשאר ברשימה: `finish` מחשב את המשך מ"עכשיו",
 * ולכן סגירה למחרת רושמת אימון של 24 שעות. אותה חותמת נכתבת גם ל-`createdAt`
 * של כל הדירוגים ול-`achievedAt` של שיאי הנפח. האימון האמיתי היחיד שיש
 * במסד נרשם ככה: הסט האחרון ב-16:34, הסגירה ב-15:39 למחרת, `durationSeconds`
 * ‎87,305.
 *
 * הכלל כאן הוא ההכרעה מי משתי האפשרויות נכונה, והוא נמדד על **הסט האחרון**
 * ולא על `lastSavedAt`: `completedAt` הוא הדבר היחיד שמעיד על אימון, והוא
 * גם השעה שעליה נכון לסגור. `lastSavedAt` זז מכל נגיעה במסך — פתיחת תור,
 * שינוי יעד, גלילה שגררה כתיבה — וחלק מהן קורות דווקא כשחוזרים לאפליקציה
 * יום אחרי, כלומר הוא מתאפס בדיוק ברגע שבו צריך לזהות את הנטישה.
 *
 * אותו רעיון כבר קיים ב-`hydrate`, על המנוחה: דד-ליין שעבר מזמן לא מצייץ
 * בפתיחה מחדש. זה אותו דבר, שכבה אחת מעל.
 */

/**
 * מעבר לזה אימון פתוח הוא אימון שנשכח, לא אימון שבאמצע.
 *
 * ארבע שעות ולא שעה: הפסקה אמיתית באמצע אימון יכולה להיות ארוכה (מתקן תפוס,
 * טלפון, מישהו שעצר לדבר), ואימון שלם עובר רק לעתים נדירות שעתיים. ארבע
 * שעות לא נפגשות עם שום אימון אמיתי, ובכל זאת כל "שכחתי מאתמול" חוצה אותן
 * בהפרש גדול. ובכל מקרה זו שאלה ולא החלטה — ראה `StaleVerdict`.
 */
export const STALE_AFTER_MS = 4 * 3_600_000

export type StaleVerdict =
  /** באמצע אימון, או בהפסקה שעדיין סבירה */
  | { state: 'live' }
  /** נרשמו סטים, והאחרון בהם הוא השעה שעליה נכון לסגור */
  | { state: 'abandoned'; lastSetAt: number }
  /**
   * נפתח ולא נרשם בו כלום.
   *
   * מקרה נפרד כי אין לו שעת סגירה, וגם כי סגירה שלו הייתה כותבת להיסטוריה
   * אימון ריק — בדיוק השורה מ-10.8 (‎20 שניות, תשעה תרגילים מדולגים, אפס
   * סטים) שיושבת במסד עד היום. מה שנכון לעשות איתו הוא לבטל אותו.
   */
  | { state: 'empty'; startedAt: number }

/** החותמת של הסט האחרון באימון, או `null` אם לא נרשם אף סט */
export function lastSetAt(workout: ActiveWorkout): number | null {
  let latest: number | null = null
  for (const sets of Object.values(workout.setsByKey)) {
    for (const s of sets) {
      if (latest === null || s.completedAt > latest) latest = s.completedAt
    }
  }
  return latest
}

export function staleWorkout(workout: ActiveWorkout, now: number): StaleVerdict {
  const last = lastSetAt(workout)
  // אימון בלי סטים נמדד מהפתיחה — אחרת אימון שנפתח ונזנח מיד היה "חי" לנצח
  const since = last ?? workout.startedAt
  if (now - since <= STALE_AFTER_MS) return { state: 'live' }
  if (last === null) return { state: 'empty', startedAt: workout.startedAt }
  /*
    הצמדה ל-`startedAt` ולא `last` חשוף.

    שעון המכשיר יכול לזוז אחורה בין הסט לפתיחה הבאה (מעבר אזור זמן, תיקון
    NTP), ואז הסט האחרון מוקדם מפתיחת האימון. סגירה על הערך הזה הייתה כותבת
    `durationSeconds` שלילי — מספר שאף מסך לא מצפה לו, ושנכנס גם לנפח
    השבועי ולגרפים.
  */
  return { state: 'abandoned', lastSetAt: Math.max(last, workout.startedAt) }
}
