import type {
  Exercise,
  ExerciseMetric,
  Rating,
  RepRange,
  Rir,
  SetLog,
  WeightMode,
} from '@/db/types'
import { RATING_LABELS, RIR_LABELS } from '@/db/types'
import {
  formatClock,
  formatSetShort,
  formatWeight,
  roundToIncrement,
  weightStep,
} from '@/domain/units'
import { workSets, workingWeight } from '@/domain/volume'

/**
 * מנוע ההמלצות — כמה להרים היום.
 *
 * העיקרון: התקדמות בחזרות לפני התקדמות במשקל. עולים רק כשכל סטי העבודה
 * הגיעו לראש הטווח, ורק אם זה לא הרגיש קשה. יורדים רק אחרי שני אימונים
 * ברצף מתחת לטווח — נפילה בודדת היא בדרך כלל שינה או אוכל, לא חוזק.
 *
 * סטי חימום שקופים כאן לחלוטין, וכל המספרים שיוצאים הם בדיוק כמו שרשום
 * על המכונה — perSide לעולם לא מוכפל בהמלצה.
 */

export interface ExerciseSessionSummary {
  sessionId: string
  /** YYYY-MM-DD */
  date: string
  startedAt: number
  /** כל הסטים של התרגיל באימון הזה — חימום ועבודה */
  sets: SetLog[]
  rating: { rating: Rating; rir: Rir | null } | null
}

export type RecommendationAction = 'increase' | 'hold' | 'decrease' | 'none'

export interface WeightRecommendation {
  action: RecommendationAction
  /** ביחידות המכונה — לעולם לא מוכפל */
  weightKg: number | null
  /**
   * היעד לשדה הספירה, כשההמלצה יודעת לנקוב בו.
   *
   * קיים בשביל תרגילי משקל גוף, שבהם אין משקל להציע אבל כן יש מה לכוון אליו —
   * "פעם קודמת 20, נסה 22". בתרגיל זמן זה מספר שניות.
   */
  targetCount?: number | null
  /** משפט עברי אחד עם המספרים האמיתיים */
  reason: string
  /** להדגשה ויזואלית */
  tone: 'up' | 'steady' | 'down' | 'neutral'
}

/**
 * מעל כמה ימים בלי לגעת בתרגיל ההמלצה מתרסנת.
 *
 * הגידים והרצועות מאבדים הסתגלות מהר יותר מהשריר, ולכן חזרה למשקל שהיה היא
 * הרגע המסוכן ביותר. אחרי שלושה שבועות יורדים מדרגה, ואחרי חודשיים יורדים
 * הרבה — שני המספרים הם נוהג מקובל ולא נוסחה.
 */
const LAYOFF_DAYS = 21
const LONG_LAYOFF_DAYS = 56
const DAY_MS = 86_400_000

function daysBetween(from: number, to: number): number {
  return Math.floor((to - from) / DAY_MS)
}

/**
 * הסטים שבוצעו במשקל העבודה בלבד.
 *
 * `workingWeight` כבר עמיד לחריגים (הוא המשקל השכיח), אבל בדיקת הטווח רצה על
 * *כל* הסטים — ולכן ניסיון שיא של סינגל כבד, או דרופסט קל בסוף, נראו כמו
 * "הסט הנמוך היה 3 חזרות" והפכו המלצת עלייה להקפאה. פעמיים ברצף זה הוריד
 * 10% דווקא כשהמתאמן מתחזק. סט נחשב רק אם הוא בטווח קפיצה אחת ממשקל העבודה.
 */
function atWorkingWeight(sets: readonly SetLog[], ref: number, increment: number): SetLog[] {
  const tolerance = (increment > 0 ? increment : 2.5) + 1e-9
  const kept = sets.filter((s) => Math.abs(s.weightKg - ref) <= tolerance)
  return kept.length > 0 ? kept : [...sets]
}

/**
 * מסדר מהחדש לישן ומשליך אימונים בלי אף סט עבודה.
 *
 * מיוצא כי גם מסך האימון צריך אותו: אם "פעם קודמת" יציג אימון שהיה בו רק סט
 * חימום, בעוד ההמלצה מדברת על אימון קודם יותר, שני החלקים של אותו כרטיס
 * יסתרו זה את זה.
 */
export function usableHistory(
  history: readonly ExerciseSessionSummary[]
): ExerciseSessionSummary[] {
  return history
    .filter((h) => workSets(h.sets).length > 0)
    .slice()
    .sort((a, b) => b.startedAt - a.startedAt)
}

/** האימון האחרון שבוצעה בו עבודה אמיתית, או null */
export function lastWorkedSession(
  history: readonly ExerciseSessionSummary[]
): ExerciseSessionSummary | null {
  return usableHistory(history)[0] ?? null
}

function belowBottom(summary: ExerciseSessionSummary, min: number, increment: number): boolean {
  const sets = workSets(summary.sets)
  const ref = workingWeight(sets)
  if (ref === null) return false
  return atWorkingWeight(sets, ref, increment).some((s) => s.reps < min)
}

/**
 * מה לכוון אליו בתרגיל משקל גוף.
 *
 * אין כאן משקל להציע, ולכן המנוע שתק — ובפול-באדי זה אומר ששני תרגילים בכל
 * אימון (שכיבות סמיכה ופלאנק) לא מקבלים שום כיוון. יעד קונקרטי מהפעם הקודמת
 * הוא בדיוק מה שהופך "עוד חזרות" מסיסמה למספר.
 */
function bodyweightGoal(
  exercise: Exercise,
  history: readonly ExerciseSessionSummary[],
  targetReps: RepRange
): WeightRecommendation {
  const timed = exercise.metric === 'seconds'
  const unit = (n: number): string => (timed ? formatClock(n) : String(n))
  const verb = timed ? 'להחזיק' : 'לעשות'

  const last = lastWorkedSession(history)
  const sets = last ? workSets(last.sets) : []
  if (sets.length === 0) {
    return {
      action: 'none',
      weightKg: null,
      targetCount: targetReps.min,
      reason: timed
        ? `אין עדיין היסטוריה — היעד הוא ${unit(targetReps.min)}`
        : `אין עדיין היסטוריה — היעד הוא ${targetReps.min} חזרות`,
      tone: 'neutral',
    }
  }

  const best = sets.reduce((m, s) => Math.max(m, s.reps), 0)
  const step = timed ? 5 : 1

  // כל הסטים הגיעו לראש הטווח — מותר לבקש יותר
  if (sets.every((s) => s.reps >= targetReps.max)) {
    const next = targetReps.max + step
    return {
      action: 'increase',
      weightKg: null,
      targetCount: next,
      reason: `הגעת ל-${unit(targetReps.max)} בכל הסטים — נסה ${verb} ${unit(next)}`,
      tone: 'up',
    }
  }

  return {
    action: 'hold',
    weightKg: null,
    targetCount: best,
    reason: `פעם קודמת ${unit(best)} בסט הטוב — היעד היום ${verb} לפחות כמו זה`,
    tone: 'steady',
  }
}

/**
 * @param targetReps טווח החזרות שבאמת עובדים לפיו. במסך האימון זה הטווח
 *   שבתוכנית, שיכול להיות שונה מזה שבקטלוג — בלי הפרמטר הזה ההמלצה הייתה
 *   מודדת מול טווח אחר מזה שמוצג על המסך.
 * @param now חותמת הזמן של עכשיו, לריסון אחרי הפסקה. בלעדיה המנוע עיוור לזמן
 *   ויציע לעלות במשקל גם אחרי חודשיים בלי לגעת בתרגיל.
 */
export function recommendWeight(
  exercise: Exercise,
  history: readonly ExerciseSessionSummary[],
  targetReps: RepRange = exercise.targetReps,
  now?: number
): WeightRecommendation {
  if (exercise.weightMode === 'bodyweight') {
    return bodyweightGoal(exercise, history, targetReps)
  }

  const mode: WeightMode = exercise.weightMode
  const increment = weightStep(exercise)
  const { min, max } = targetReps
  const sessions = usableHistory(history)
  const last = sessions[0]
  const ref = last ? workingWeight(last.sets) : null

  // אין ממה ללמוד — מציעים את משקל הזריעה בלבד
  if (!last || ref === null) {
    const seed = exercise.seedWeightKg
    return {
      action: 'none',
      weightKg: seed,
      reason:
        seed === null
          ? 'אין עדיין היסטוריה בתרגיל הזה — בחר משקל שנוח להתחיל בו'
          : `אין עדיין היסטוריה בתרגיל הזה — ${formatWeight(seed, mode)} הוא משקל ההתחלה`,
      tone: 'neutral',
    }
  }

  /*
    הפסקה גוברת על כל השאר.

    זה נבדק לפני החזרות והדירוג בכוונה: מה שקרה לפני חודשיים תיאר את הגוף של
    אז. באפליקציה שכל הרעיון שלה הוא חזרה הדרגתית אחרי הפסקה, המלצה לעלות
    במשקל אחרי חופשה היא בדיוק הטעות שהיא באה למנוע.
  */
  if (now !== undefined) {
    const days = daysBetween(last.startedAt, now)
    if (days >= LAYOFF_DAYS) {
      const long = days >= LONG_LAYOFF_DAYS
      const eased = Math.max(
        increment,
        roundToIncrement(ref * (long ? 0.75 : 0.9), increment, 'down')
      )
      const weeks = Math.round(days / 7)
      return {
        action: 'decrease',
        weightKg: eased,
        reason: long
          ? `לא עשית את זה כבר ${weeks} שבועות — מתחילים מ-${formatWeight(eased, mode)} ובונים בחזרה`
          : `עברו ${weeks} שבועות מאז — יורדים ל-${formatWeight(eased, mode)} ובודקים איך זה מרגיש`,
        tone: 'down',
      }
    }
  }

  const holdWeight = roundToIncrement(ref, increment)
  // הטווח נמדד רק על סטי משקל העבודה — ראה atWorkingWeight
  const sets = atWorkingWeight(workSets(last.sets), ref, increment)
  const lowestReps = sets.reduce((m, s) => Math.min(m, s.reps), Infinity)
  const hitTopAll = sets.every((s) => s.reps >= max)
  const missedBottom = lowestReps < min

  const rating = last.rating
  // RIR 0 הוא כשל — הוא גובר על "קל" שנלחץ בטעות
  const hard = rating !== null && (rating.rating === 3 || rating.rir === 0)
  // "קל" עם 3 חזרות ומעלה במחסנית — קפיצה כפולה. שומרים את ה-RIR עצמו לניסוח.
  const easyRir: Rir | null =
    rating !== null && rating.rating === 1 && rating.rir !== null && rating.rir >= 3
      ? rating.rir
      : null

  const previous = sessions[1]
  if (missedBottom && previous && belowBottom(previous, min, increment)) {
    // לא נותנים לשבוע גרוע להפוך לחודש גרוע — דלוד של 10%
    const dropped = Math.max(increment, roundToIncrement(ref * 0.9, increment, 'down'))
    return {
      action: 'decrease',
      weightKg: dropped,
      reason: `שני אימונים ברצף מתחת ל-${min} חזרות — מורידים ל-${formatWeight(dropped, mode)} ובונים מחדש`,
      tone: 'down',
    }
  }

  if (missedBottom) {
    return {
      action: 'hold',
      weightKg: holdWeight,
      reason: `הסט הנמוך היה ${lowestReps} חזרות מול תחתית הטווח ${min} — נשארים על ${formatWeight(holdWeight, mode)} לעוד אימון`,
      tone: 'steady',
    }
  }

  if (hitTopAll && !hard) {
    const step = easyRir !== null ? increment * 2 : increment
    const next = roundToIncrement(ref + step, increment)
    return {
      action: 'increase',
      weightKg: next,
      reason:
        easyRir !== null
        ? `היה קל מדי — נשארו ${RIR_LABELS[easyRir]} חזרות במחסנית, אז עולים ל-${formatWeight(next, mode)}`
        : rating === null
          ? `כל הסטים הגיעו ל-${max} חזרות, ראש הטווח — עולים ל-${formatWeight(next, mode)}`
          : `כל הסטים הגיעו ל-${max} חזרות בדירוג ${RATING_LABELS[rating.rating]} — עולים ל-${formatWeight(next, mode)}`,
      tone: 'up',
    }
  }

  if (hitTopAll) {
    return {
      action: 'hold',
      weightKg: holdWeight,
      reason: `הגעת לראש הטווח אבל זה היה קשה — עוד אימון על ${formatWeight(holdWeight, mode)} לפני שעולים`,
      tone: 'steady',
    }
  }

  // הנימוק חייב לדבר על הסט החלש ולא על החזק. "עשית 12, היעד 12" סותר את
  // עצמו כשסט אחד הגיע לראש הטווח והשני לא — ובדיוק במצב הזה אנחנו כאן.
  const atTop = sets.filter((s) => s.reps >= max).length
  return {
    action: 'hold',
    weightKg: holdWeight,
    reason:
      atTop > 0
        ? `${atTop} מתוך ${sets.length} סטים הגיעו ל-${max} — עוד חזרות לפני שעולים`
        : `הסט החלש היה ${lowestReps} חזרות, היעד ${max} — עוד חזרות לפני שעולים`,
    tone: 'steady',
  }
}

/** "60×10 · 60×9 · 55×8" — סטי עבודה בלבד, לפי סדר הביצוע */
export function lastSessionSetsText(
  summary: ExerciseSessionSummary,
  mode: WeightMode,
  metric: ExerciseMetric = 'reps'
): string {
  return workSets(summary.sets)
    .map((s) => formatSetShort(s.weightKg, s.reps, mode, metric))
    .join(' · ')
}
