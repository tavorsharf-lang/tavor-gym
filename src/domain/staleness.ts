import type { Block, Routine, RoutineId, Session } from '@/db/types'
import { daysSince, formatDayCount } from '@/lib/dates'

/**
 * "מה לעשות היום" — דירוג התוכניות והבלוקים לפי כמה זמן לא נגעו בהם.
 *
 * שני כללים שחוזרים בכל הקובץ:
 *   1. רק אימון שנסגר (endedAt > 0) נחשב שבוצע. אימון שנקטע באמצע לא מאפס
 *      את השעון — אחרת קריסה של האפליקציה הייתה "מוחקת" את ההזנחה.
 *   2. מה שמעולם לא בוצע גובר על כל ותק, כמה גדול שיהיה.
 */

export interface RoutineStatus {
  routineId: RoutineId
  name: string
  /** הסדר שהמשתמש רואה במסך התוכניות — הוא גם שובר השוויון בהצעה */
  order: number
  lastDoneAt: number | null
  daysSince: number | null
  neverDone: boolean
}

export interface BlockStatus {
  blockId: string
  name: string
  lastDoneAt: number | null
  daysSince: number | null
  neverDone: boolean
  stale: boolean
}

/** סדר השובר-שוויון בין תוכניות */
/*
  שובר שוויון בין תוכניות שלא בוצעו מעולם, או שעברו מהן אותו מספר ימים.

  קודם הייתה כאן רשימה קשיחה של A/B/C, ולכן indexOf החזיר ‎-1 לשתי תוכניות
  הפול-באדי שהן ברירת המחדל — התנאי לא התקיים אף פעם, והבחירה נפלה בפועל על
  סדר האיטרציה. זה עבד במקרה. `Routine.order` הוא השדה שקיים בדיוק בשביל זה.
*/

/**
 * מתי בוצע לאחרונה כל מפתח (תוכנית או בלוק).
 * @param keysOf המפתחות שהאימון "סוגר" — routineId בודד או רשימת blockIds
 */
function lastDoneByKey(
  sessions: readonly Session[],
  keysOf: (session: Session) => readonly string[]
): Map<string, number> {
  const out = new Map<string, number>()
  for (const s of sessions) {
    // אותו כלל כמו ברצף: אימון בלי סט עבודה לא מאפס את שעון ההזנחה, אחרת
    // "סיים בכל זאת" על אימון ריק היה שולח את ההצעה של מחר לתוכנית הלא נכונה
    if (s.endedAt <= 0 || s.totalWorkSets <= 0) continue
    for (const key of keysOf(s)) {
      const prev = out.get(key)
      if (prev === undefined || s.endedAt > prev) out.set(key, s.endedAt)
    }
  }
  return out
}

export function routineStatuses(
  routines: readonly Routine[],
  sessions: readonly Session[],
  now: number
): RoutineStatus[] {
  const last = lastDoneByKey(sessions, (s) => (s.routineId === null ? [] : [s.routineId]))
  return [...routines]
    .sort((a, b) => a.order - b.order)
    .map((r) => {
      const lastDoneAt = last.get(r.id) ?? null
      return {
        routineId: r.id,
        name: r.name,
        order: r.order,
        lastDoneAt,
        daysSince: lastDoneAt === null ? null : daysSince(lastDoneAt, now),
        neverDone: lastDoneAt === null,
      }
    })
}

/** ככל שהמספר גדול יותר — מוזנח יותר. אינסוף שמור למה שמעולם לא בוצע. */
function neglectRank(status: RoutineStatus): number {
  return status.neverDone ? Number.POSITIVE_INFINITY : status.daysSince ?? 0
}

/**
 * התוכנית שהכי הרבה זמן לא בוצעה; מה שמעולם לא בוצע קודם.
 *
 * תיקו נשבר לפי `Routine.order` — הסדר שהמשתמש רואה במסך התוכניות — ולא לפי
 * סדר ההגעה של המערך. קודם הייתה כאן רשימה קשיחה של A/B/C, שהחזירה ‎-1 לשתי
 * תוכניות הפול-באדי ולכן לא הכריעה אותן בכלל; ההכרעה נפלה בפועל על סדר
 * האיטרציה, כלומר על פרט מימוש שאף אחד לא התכוון אליו.
 */
export function suggestRoutine(statuses: readonly RoutineStatus[]): RoutineId | null {
  let best: RoutineStatus | null = null
  for (const s of statuses) {
    if (best === null) {
      best = s
      continue
    }
    const rank = neglectRank(s)
    const bestRank = neglectRank(best)
    if (rank > bestRank) best = s
    // Infinity === Infinity, ולכן שתי תוכניות שמעולם לא בוצעו מגיעות לכאן
    else if (rank === bestRank && s.order < best.order) best = s
  }
  return best === null ? null : best.routineId
}

export function blockStatuses(
  blocks: readonly Block[],
  sessions: readonly Session[],
  now: number,
  staleDays: number
): BlockStatus[] {
  const last = lastDoneByKey(sessions, (s) => s.blockIds)
  return [...blocks]
    .sort((a, b) => a.order - b.order)
    .map((b) => {
      const lastDoneAt = last.get(b.id) ?? null
      const since = lastDoneAt === null ? null : daysSince(lastDoneAt, now)
      return {
        blockId: b.id,
        name: b.name,
        lastDoneAt,
        daysSince: since,
        neverDone: lastDoneAt === null,
        // הסף עצמו כבר נחשב מוזנח: staleDays=7 → ביום השביעי הבלוק חוזר
        stale: since === null || since >= staleDays,
      }
    })
}

/**
 * מספר גדול = מוזנח יותר. MAX_SAFE_INTEGER ולא Infinity, כי המשווה מחסר
 * ערכים ו-Infinity − Infinity הוא NaN — שהיה הורס את המיון.
 */
function blockNeglectRank(status: BlockStatus): number {
  return status.neverDone ? Number.MAX_SAFE_INTEGER : status.daysSince ?? 0
}

/** הבלוקים המוזנחים, המוזנח ביותר קודם. אלה שמסומנים מראש בגיליון הפתיחה. */
export function suggestBlocks(statuses: readonly BlockStatus[]): string[] {
  return statuses
    .filter((s) => s.stale)
    // sort יציב — בתיקו נשמר סדר הבלוקים כפי שהתקבל
    .sort((a, b) => blockNeglectRank(b) - blockNeglectRank(a))
    .map((s) => s.blockId)
}

/** "לא עשית אימון B כבר 9 ימים" · "עוד לא עשית את אימון C" */
export function stalenessText(status: RoutineStatus): string {
  if (status.neverDone || status.daysSince === null) return `עוד לא עשית את ${status.name}`
  if (status.daysSince <= 0) return `עשית ${status.name} היום`
  // formatDayCount(1) הוא "יום", ו״לא עשית כבר יום״ נשמע צולע
  if (status.daysSince === 1) return `עשית ${status.name} אתמול`
  return `לא עשית ${status.name} כבר ${formatDayCount(status.daysSince)}`
}
