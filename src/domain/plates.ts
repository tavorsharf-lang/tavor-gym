import type { Exercise, PlateSettings } from '@/db/types'
import { formatKg, round2 } from './units'

/**
 * מחשבון פלטות — "מה בדיוק להעמיס על כל צד".
 *
 * ההבחנה שקובעת הכל היא מצב המשקל:
 *   perSide — המספר שהמשתמש מזין הוא *כבר* לכל צד, ולכן מפרקים אותו כמו שהוא
 *             בלי להחסיר מוט ובלי לחלק לשניים.
 *   total   — מחסירים את המוט/המזחלת ומחלקים לשניים. barWeightKg 0 לגיטימי:
 *             מזחלת שהתצוגה שלה סופרת רק את הפלטות.
 *
 * כל החישוב על מספרים כמו שהם רשומים על המכונה — אין כאן שום הכפלה של perSide.
 */

/** סובלנות לשגיאות נקודה צפה בהשוואות משקל */
const EPS = 1e-6

/** תקרת ביטחון — מונעת לולאה ארוכה אם הוגדרה פלטה זעירה מול משקל ענק */
const MAX_PLATES = 40

const ERR_BELOW_BAR = 'המשקל קטן מהמוט הריק'
const ERR_NO_PLATES = 'לא הוגדרו פלטות בהגדרות'
const ERR_INVALID = 'משקל לא תקין'

export interface PlateBreakdown {
  /** הפלטות על צד אחד, בסדר יורד */
  plates: number[]
  /** אותן פלטות מקובצות לתצוגה, בסדר יורד */
  grouped: { kg: number; count: number }[]
  /** המשקל המבוקש לכל צד — אחרי הורדת המוט וחלוקה לשניים במצב total */
  perSideKg: number
  /** האם הפלטות מסתכמות בדיוק ב-perSideKg */
  exact: boolean
  /** כשלא מדויק — ההעמסות האפשריות הקרובות ביותר, לכל צד */
  nearestBelowKg: number | null
  nearestAboveKg: number | null
  /** שורה בעברית מוכנה למסך, למשל "לכל צד: 20 + 10 + 2.5" */
  text: string
  /** מוגדר כשהבקשה בלתי אפשרית, למשל משקל מתחת למוט הריק */
  error: string | null
}

/** מנקה את רשימת הפלטות: בלי כפילויות, בלי ערכים לא חיוביים, בסדר יורד */
function normalizePlates(perSideKg: readonly number[]): number[] {
  const seen = new Set<number>()
  const out: number[] = []
  for (const raw of perSideKg) {
    if (!Number.isFinite(raw) || raw <= 0) continue
    const p = round2(raw)
    if (p <= 0 || seen.has(p)) continue
    seen.add(p)
    out.push(p)
  }
  return out.sort((a, b) => b - a)
}

function fail(perSideKg: number, message: string): PlateBreakdown {
  return {
    plates: [],
    grouped: [],
    perSideKg,
    exact: false,
    nearestBelowKg: null,
    nearestAboveKg: null,
    text: message,
    error: message,
  }
}

function group(plates: readonly number[]): { kg: number; count: number }[] {
  const out: { kg: number; count: number }[] = []
  for (const kg of plates) {
    const last = out.length > 0 ? out[out.length - 1] : undefined
    if (last && last.kg === kg) last.count += 1
    else out.push({ kg, count: 1 })
  }
  return out
}

/** "2×20 + 10 + 2.5" — הכמות לפני המשקל, כמו שאומרים את זה בחדר */
function partsText(grouped: readonly { kg: number; count: number }[]): string {
  return grouped.map((g) => (g.count > 1 ? `${g.count}×${formatKg(g.kg)}` : formatKg(g.kg))).join(' + ')
}

export function calcPlates(
  targetKg: number,
  exercise: Pick<Exercise, 'weightMode' | 'usesPlates' | 'barWeightKg'>,
  available: PlateSettings
): PlateBreakdown | null {
  if (!exercise.usesPlates || exercise.weightMode === 'bodyweight') return null
  if (!Number.isFinite(targetKg)) return fail(0, ERR_INVALID)

  const isPerSide = exercise.weightMode === 'perSide'
  // barWeightKg === 0 הוא ערך אמיתי (מזחלת), ולכן ?? ולא ||
  const barKg = isPerSide ? 0 : (exercise.barWeightKg ?? available.barWeightKg)

  if (!isPerSide && targetKg < barKg - EPS) return fail(0, ERR_BELOW_BAR)

  const perSideKg = round2(isPerSide ? targetKg : (targetKg - barKg) / 2)
  if (perSideKg < -EPS) return fail(0, ERR_INVALID)

  const plates = normalizePlates(available.perSideKg)
  if (plates.length === 0 && perSideKg > EPS) return fail(perSideKg, ERR_NO_PLATES)

  // פירוק חמדני מהפלטה הגדולה לקטנה — אופטימלי לכל סט פלטות אמיתי,
  // שבו כל פלטה היא מכפלה של הקטנה ממנה.
  const loaded: number[] = []
  let remainder = perSideKg
  for (const p of plates) {
    while (remainder + EPS >= p && loaded.length < MAX_PLATES) {
      loaded.push(p)
      remainder -= p
    }
  }

  const exact = remainder <= EPS
  const loadedKg = round2(perSideKg - remainder)
  // הלולאה נעצרת כשהשארית קטנה מהפלטה הקטנה ביותר, ולכן ההעמסה שהתקבלה היא
  // הקרובה מלמטה, ותוספת של פלטה קטנה אחת היא הקרובה מלמעלה.
  const smallest = plates.length > 0 ? plates[plates.length - 1] : 0

  const grouped = group(loaded)
  let text: string
  if (grouped.length === 0) text = barKg > 0 ? 'מוט ריק, בלי פלטות' : 'בלי פלטות'
  else text = `לכל צד: ${partsText(grouped)}`
  if (!exact) text += ` (הכי קרוב: ${formatKg(loadedKg)})`

  return {
    plates: loaded,
    grouped,
    perSideKg,
    exact,
    nearestBelowKg: exact ? null : loadedKg,
    nearestAboveKg: exact ? null : round2(loadedKg + smallest),
    text,
    error: null,
  }
}
