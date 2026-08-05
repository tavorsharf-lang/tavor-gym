import type { Exercise, RepRange, WeightMode } from '@/db/types'

/**
 * עיגול ועיצוב של משקלים.
 *
 * כלל הזהב: המספר שנשמר ומוצג הוא המספר שרשום על המכונה. שום פונקציה כאן
 * לא מכפילה perSide — זה קורה רק ב-volume.ts.
 */

/** עיגול למכפלה הקרובה של האינקרמנט. increment 0 מחזיר את הערך כמו שהוא. */
export function roundToIncrement(
  value: number,
  increment: number,
  direction: 'nearest' | 'down' | 'up' = 'nearest'
): number {
  if (!increment || increment <= 0) return round2(value)
  const q = value / increment
  const n =
    direction === 'down' ? Math.floor(q + 1e-9) : direction === 'up' ? Math.ceil(q - 1e-9) : Math.round(q)
  return round2(n * increment)
}

/** מנקה שגיאות נקודה צפה — 22.500000000000004 → 22.5 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** "22.5" ולא "22.50"; "60" ולא "60.0"; "1.25" נשאר מדויק */
export function formatKg(kg: number): string {
  const r = round2(kg)
  if (Number.isInteger(r)) return String(r)
  // מוריד אפסים מיותרים בסוף: 22.50 → 22.5
  return String(r)
}

/** התווית שמופיעה ליד המשקל: "כל צד" כשרלוונטי */
export function weightSuffix(mode: WeightMode): string {
  if (mode === 'perSide') return 'כל צד'
  if (mode === 'bodyweight') return ''
  return 'ק״ג'
}

/** "22.5 ק״ג כל צד" · "60 ק״ג" · "משקל גוף" */
export function formatWeight(kg: number | null, mode: WeightMode): string {
  if (mode === 'bodyweight') return 'משקל גוף'
  if (kg === null) return '—'
  return mode === 'perSide' ? `${formatKg(kg)} ק״ג כל צד` : `${formatKg(kg)} ק״ג`
}

/** גרסה קצרה לרשימות צפופות: "22.5×10" */
export function formatSetShort(kg: number, reps: number, mode: WeightMode): string {
  if (mode === 'bodyweight') return `${reps} חזרות`
  return `${formatKg(kg)}×${reps}`
}

export function formatRepRange(r: RepRange): string {
  return r.min === r.max ? String(r.min) : `${r.min}–${r.max}`
}

/** שניות → "1:30" · "12:05" · "1:02:30" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

/** משך אימון בעברית: "58 דקות" · "שעה ו-12 דקות" */
export function formatDuration(totalSeconds: number): string {
  const mins = Math.round(totalSeconds / 60)
  if (mins < 60) return `${mins} דקות`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const hoursText = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`
  if (m === 0) return hoursText
  return `${hoursText} ו-${m} דקות`
}

/** נפח: 12,450 ק״ג · 12.4 טון כשגדול */
export function formatVolume(kg: number): string {
  if (kg >= 10000) return `${(kg / 1000).toFixed(1)} טון`
  return `${Math.round(kg).toLocaleString('he-IL')} ק״ג`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

/** הצעד לכפתורי +/- של שדה המשקל */
export function weightStep(ex: Pick<Exercise, 'weightIncrementKg' | 'weightMode'>): number {
  if (ex.weightMode === 'bodyweight') return 0
  return ex.weightIncrementKg > 0 ? ex.weightIncrementKg : 2.5
}

/** מזהה קצר ויציב, בלי תלות ב-crypto.randomUUID (לא קיים בכל ההקשרים) */
export function newId(prefix = ''): string {
  const rnd = Math.random().toString(36).slice(2, 10)
  const t = Date.now().toString(36)
  return `${prefix}${t}${rnd}`
}
