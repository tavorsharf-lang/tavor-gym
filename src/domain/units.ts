import type { Exercise, ExerciseMetric, RepRange, WeightMode } from '@/db/types'
import { RATING_LABELS } from '@/db/types'

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

/** גרסה קצרה לרשימות צפופות: "22.5×10" · "1:15" בתרגיל זמן */
export function formatSetShort(
  kg: number,
  reps: number,
  mode: WeightMode,
  metric: ExerciseMetric = 'reps'
): string {
  if (metric === 'seconds') {
    // תרגיל זמן במשקל חיצוני (פלאנק עם צלחת) עדיין צריך להראות את המשקל
    return mode === 'bodyweight' ? formatClock(reps) : `${formatKg(kg)}×${formatClock(reps)}`
  }
  if (mode === 'bodyweight') return `${reps} חזרות`
  return `${formatKg(kg)}×${reps}`
}

export function formatRepRange(r: RepRange, metric: ExerciseMetric = 'reps'): string {
  const one = (n: number) => (metric === 'seconds' ? formatClock(n) : String(n))
  return r.min === r.max ? one(r.min) : `${one(r.min)}–${one(r.max)}`
}

/**
 * המילה שמתארת את מה שסופרים בתרגיל — "חזרות" או "זמן".
 * מרוכזת כאן כי היא מופיעה בתווית השדה, בשורת היעד ובכל מסך שמציג טווח.
 */
export function countLabel(metric: ExerciseMetric = 'reps'): string {
  return metric === 'seconds' ? 'זמן' : 'חזרות'
}

/**
 * הקפיצה של כפתורי ה-+/- בשדה שסופר.
 * בזמן קופצים ב-5 שניות: פלאנק נמדד בפועל בקפיצות כאלה, וקפיצה של שנייה
 * הייתה דורשת שבעים לחיצות כדי להגיע ליעד.
 */
export function countStep(metric: ExerciseMetric = 'reps'): number {
  return metric === 'seconds' ? 5 : 1
}

/**
 * התקרה של שדה היעד בעורכים.
 *
 * חשוב שהיא תהיה מודעת ליחידה ולא קבועה: תקרה של 50 מול יעד פלאנק של 75 שניות
 * הייתה חותכת אותו ל-0:50 בלחיצה אחת על מינוס, בלי להגיד כלום.
 */
export function countMax(metric: ExerciseMetric = 'reps'): number {
  return metric === 'seconds' ? 600 : 50
}

/** שתי שורות שבבים על מסך טלפון, בלי להפוך את הכרטיס לרשימה */
const MAX_REP_MARKS = 12

/**
 * טווח צר מקבל מספר אחד מתחת ומעל, כי סט נגמר גם בחזרה שלא יצאה וגם בחזרה
 * שיצאה בהפתעה. טווח רחב כמו 12–20 כבר מכסה בעצמו את שתי האפשרויות, וריפוד
 * שלו רק גונב מקום.
 */
const NARROW_SPAN = 4

/**
 * המספרים שאפשר לסמן בהם "כמה חזרות עשיתי" בסוף סט.
 *
 * שני מקורות, ולא אחד: כל טווח היעד של התרגיל, *ובנוסף* המספר שהשדה נפתח
 * עליו. הם רחוקים זה מזה — היעד בהרמות צד הוא 12–20 והשדה נפתח על 6 — ולכן
 * חלון רציף אחד שמתחיל ב-5 לא מגיע ל-20, וגם ההפך. חלון כזה היה נותן את אותה
 * שורה בדיוק לכל תרגיל באימון ועוצר ב-12, כלומר בשני שלישים מהתרגילים אי אפשר
 * לסמן את מה שבאמת עשית — וזו כל מטרת השורה.
 *
 * לכן ברירת המחדל נוסעת כשבב נפרד לפני הטווח (או אחריו), ולא נבלעת בו.
 */
export function repMarks(range: RepRange, fallback: number): number[] {
  const pad = range.max - range.min <= NARROW_SPAN ? 1 : 0
  const hi = Math.max(1, range.max + pad)
  const lo = Math.min(hi, Math.max(1, range.min - pad))
  const seed = Number.isFinite(fallback) && fallback >= 1 ? Math.round(fallback) : null

  /*
    יעד חריג ורחב לא מותר לו לפרוץ את הכרטיס, ולכן הוא נחתך — מלמטה דווקא, כי
    ראש הטווח הוא לאן מכוונים. החיתוך נעשה פעמיים: הרמת הרצפה יכולה להוציא את
    ברירת המחדל מהחלון ולדרוש לה שבב משלה, וזה תופס מקום שצריך לפנות מראש.
    מעבר שני מספיק — הרצפה רק עולה, וערך שכבר בחוץ לא חוזר פנימה.
  */
  const outside = (start: number): boolean => seed !== null && (seed < start || seed > hi)
  let start = Math.max(lo, hi - MAX_REP_MARKS + 1)
  if (outside(start)) start = Math.max(lo, hi - MAX_REP_MARKS + 2)

  const out: number[] = []
  if (seed !== null && seed < start) out.push(seed)
  for (let n = start; n <= hi; n += 1) out.push(n)
  if (seed !== null && seed > hi) out.push(seed)
  return out
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

/**
 * טקסט הדירוג כפי שהוא מוצג בכל המסכים: "בינוני · נשארו 2 במחסנית".
 *
 * RIR 0 מקבל טיפול נפרד כי התווית שלו היא המילה "כשל", ו"נשארו כשל במחסנית"
 * הוא משפט שבור. ריכוז כאן במקום שכפול בשלושה מסכים.
 */
export function formatRatingText(rating: 1 | 2 | 3, rir: number | null): string {
  const base = RATING_LABELS[rating]
  if (rir === null) return base
  if (rir === 0) return `${base} · כשל`
  return `${base} · נשארו ${rir >= 4 ? '4+' : rir} במחסנית`
}

/** מזהה קצר ויציב, בלי תלות ב-crypto.randomUUID (לא קיים בכל ההקשרים) */
export function newId(prefix = ''): string {
  const rnd = Math.random().toString(36).slice(2, 10)
  const t = Date.now().toString(36)
  return `${prefix}${t}${rnd}`
}
