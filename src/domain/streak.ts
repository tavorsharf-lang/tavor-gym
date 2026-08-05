import type { Session } from '@/db/types'
import { MS_DAY, startOfWeek } from '@/lib/dates'

/**
 * רצף שבועי — כמה שבועות ברציפות עמדת ביעד האימונים.
 *
 * השבוע הנוכחי מיוחד: הוא עוד לא נגמר, ולכן הוא נספר רק אחרי שהיעד הושג.
 * אחרת כל יום ראשון בבוקר הרצף היה נראה שבור.
 */

export interface StreakInfo {
  /** שבועות רצופים שהושלמו, כולל הנוכחי אם היעד כבר הושג */
  streakWeeks: number
  thisWeekCount: number
  goal: number
  /** כמה אימונים נשארו השבוע כדי לשמור על הרצף */
  remainingThisWeek: number
  /** 8 השבועות האחרונים, מהישן לחדש, לשורת העמודות במסך הבית */
  recentWeeks: { weekStart: number; count: number; met: boolean }[]
}

/** כמה שבועות מוצגים בשורת העמודות */
const RECENT_WEEKS = 8

/**
 * תחילת השבוע הקודם. יורדים יום אחד ומיישרים מחדש במקום להחסיר 7×MS_DAY,
 * כי מעבר שעון קיץ מזיז את התוצאה בשעה ומקפיץ אותה ליום הלא נכון.
 */
function previousWeekStart(weekStart: number): number {
  return startOfWeek(weekStart - MS_DAY)
}

export function computeStreak(
  sessions: readonly Session[],
  goal: number,
  now: number
): StreakInfo {
  const target = goal > 0 ? goal : 1

  const counts = new Map<number, number>()
  for (const s of sessions) {
    if (s.endedAt <= 0) continue
    // משייכים לפי מועד ההתחלה, כמו שדה date — אימון שהתחיל בשבת בלילה
    // שייך לשבוע שבו התחיל גם אם נגמר אחרי חצות
    const week = startOfWeek(s.startedAt)
    counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  const countAt = (week: number): number => counts.get(week) ?? 0

  const thisWeekStart = startOfWeek(now)
  const thisWeekCount = countAt(thisWeekStart)

  let streakWeeks = 0
  for (let w = previousWeekStart(thisWeekStart); countAt(w) >= target; w = previousWeekStart(w)) {
    streakWeeks += 1
  }
  if (thisWeekCount >= target) streakWeeks += 1

  const recentWeeks: StreakInfo['recentWeeks'] = []
  let week = thisWeekStart
  for (let i = 0; i < RECENT_WEEKS; i += 1) {
    const count = countAt(week)
    recentWeeks.push({ weekStart: week, count, met: count >= target })
    week = previousWeekStart(week)
  }
  recentWeeks.reverse()

  return {
    streakWeeks,
    thisWeekCount,
    goal: target,
    remainingThisWeek: Math.max(0, target - thisWeekCount),
    recentWeeks,
  }
}
