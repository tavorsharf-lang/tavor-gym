/**
 * תאריכים — הכל בזמן מקומי, שבוע מתחיל ביום ראשון.
 *
 * כל פונקציה שתלויה ב"עכשיו" מקבלת אותו כפרמטר, כדי שאפשר יהיה לבדוק אותה.
 */

export const MS_DAY = 86_400_000

/** YYYY-MM-DD בזמן מקומי (לא UTC — toISOString היה מזיז יום אחורה בערב) */
export function toISODate(d: Date | number): string {
  const date = typeof d === 'number' ? new Date(d) : d
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(now: number = Date.now()): string {
  return toISODate(now)
}

/** חצות מקומי של אותו יום */
export function startOfDay(d: Date | number): number {
  const date = typeof d === 'number' ? new Date(d) : new Date(d.getTime())
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** חצות של יום ראשון של אותו שבוע */
export function startOfWeek(d: Date | number): number {
  const date = new Date(startOfDay(d))
  date.setDate(date.getDate() - date.getDay()) // getDay: 0 = ראשון
  return date.getTime()
}

/** מספר ימים שלמים שעברו, לפי גבולות יום ולא לפי 24 שעות */
export function daysBetween(from: number, to: number): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / MS_DAY)
}

export function daysSince(timestamp: number, now: number = Date.now()): number {
  return daysBetween(timestamp, now)
}

/** מפרסר YYYY-MM-DD לחצות מקומי */
export function parseISODate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

/** "יום שלישי, 5 באוגוסט" */
export function formatDateLong(d: number): string {
  const date = new Date(d)
  const month = new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(date)
  return `יום ${HE_DAYS[date.getDay()]}, ${date.getDate()} ב${month}`
}

/** "5.8.26" */
export function formatDateShort(d: number): string {
  const date = new Date(d)
  return `${date.getDate()}.${date.getMonth() + 1}.${String(date.getFullYear()).slice(2)}`
}

/** "19:42" */
export function formatTime(d: number): string {
  const date = new Date(d)
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** "היום" · "אתמול" · "לפני 3 ימים" · "לפני שבועיים" · תאריך מלא */
export function formatRelativeDay(d: number, now: number = Date.now()): string {
  const days = daysBetween(d, now)
  if (days === 0) return 'היום'
  if (days === 1) return 'אתמול'
  if (days === 2) return 'שלשום'
  if (days < 7) return `לפני ${days} ימים`
  if (days < 14) return 'לפני שבוע'
  if (days < 21) return 'לפני שבועיים'
  if (days < 60) return `לפני ${Math.floor(days / 7)} שבועות`
  return formatDateShort(d)
}

/** "6 ימים" · "יום" · "יומיים" */
export function formatDayCount(days: number): string {
  if (days === 0) return 'היום'
  if (days === 1) return 'יום'
  if (days === 2) return 'יומיים'
  return `${days} ימים`
}
