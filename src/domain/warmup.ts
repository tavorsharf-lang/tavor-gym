import type { Exercise, MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS } from '@/db/types'
import { roundToIncrement, weightStep } from '@/domain/units'

/**
 * הצעת חימום.
 *
 * החימום נקשר לקבוצת השריר ולא לתרגיל: מחממים פעם אחת כשנכנסים לחזה,
 * ולא שוב לפני כל תרגיל חזה באותו אימון. לכן ההחלטה תלויה במה שכבר תועד
 * באימון הנוכחי, לא בהיסטוריה.
 *
 * לתרגיל בידוד סט אחד מספיק. לתרגיל מורכב כבד — לחיצת רגליים ב-160, סקוואט
 * ב-120 — קפיצה מסט יחיד ישר למשקל העבודה היא דלה מקצועית: מה שצריך הכנה שם
 * הוא המפרק ומערכת העצבים, וזה מה שרמפה עולה עושה בלי לצבור עייפות.
 */

export interface WarmupContext {
  exercise: Exercise
  /** קבוצות שריר שכבר יש להן לפחות סט אחד באימון הנוכחי */
  touchedGroups: ReadonlySet<MuscleGroup>
  /** משקל העבודה המתוכנן להיום — מההמלצה או מהאימון הקודם. null כשלא ידוע. */
  plannedWeightKg: number | null
  /** settings.autoWarmup */
  enabled: boolean
  /** settings.warmupPercent — האחוז של סט החימום היחיד */
  percent: number
}

export interface WarmupSuggestion {
  weightKg: number
  reps: number
  reason: string
}

/**
 * הרמפה לתרגיל מורכב כבד: אחוז ממשקל העבודה, וכמה חזרות.
 *
 * שלושה סטים עולים שיורדים בחזרות ככל שהמשקל עולה — הנוהג המקובל. הסט האחרון
 * קצר בכוונה: הוא מכין את מערכת העצבים למשקל, לא מעייף את השריר לפניו.
 */
const RAMP: readonly { percent: number; reps: number }[] = [
  { percent: 40, reps: 10 },
  { percent: 60, reps: 6 },
  { percent: 80, reps: 3 },
]

/**
 * קבוצות שבהן תרגיל יכול להיות מורכב וכבד מספיק כדי להצדיק רמפה.
 * שריר קטן לא מגיע למשקלים שבהם קפיצה ישירה מסוכנת.
 */
const RAMP_GROUPS: readonly MuscleGroup[] = ['legs', 'back', 'chest']

/**
 * מאיזה משקל מתחילה רמפה, ביחידות של קפיצת המשקל של התרגיל.
 *
 * הסף נמדד בקפיצות ולא בקילוגרמים כי המספר על המכונה אומר דברים שונים לפי
 * מצב המשקל — 22.5 לכל צד ו-160 כולל הם אותו סוג עומס, וההכפלה של perSide
 * שמורה ל-domain/volume.ts בלבד. הקפיצה של הציוד היא הסקאלה הטבעית שלו.
 *
 * 20 נבחר מול הקטלוג האמיתי ולא מהאוויר: הוא מפריד בין לחיצת רגליים (32
 * קפיצות), סקוואט (24) וחתירה כבדה (24) — שם קפיצה ישירה למשקל העבודה באמת
 * מסוכנת — לבין מקבילים (16), לחיצת חזה חופשי (9) ופרפר (6), שסט אחד מספיק להם.
 */
const RAMP_MIN_STEPS = 20

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** האם התרגיל כבד ומורכב מספיק כדי שרמפה תשתלם */
function wantsRamp(exercise: Exercise, plannedWeightKg: number, increment: number): boolean {
  if (!RAMP_GROUPS.includes(exercise.muscleGroup)) return false
  if (exercise.equipment === 'cables' || exercise.equipment === 'bodyweight') return false
  return plannedWeightKg >= increment * RAMP_MIN_STEPS
}

/**
 * סטי החימום המוצעים, לפי הסדר. מערך ריק = אין מה להציע.
 *
 * מחזיר מערך ולא הצעה בודדת כי לתרגיל כבד יש כמה שלבים, והכרטיס מציע את הבא
 * בתור אחרי כל סט חימום שנרשם.
 */
export function suggestWarmup(ctx: WarmupContext): WarmupSuggestion[] {
  const { exercise, touchedGroups, plannedWeightKg, enabled, percent } = ctx
  if (!enabled) return []
  if (touchedGroups.has(exercise.muscleGroup)) return []
  if (exercise.weightMode === 'bodyweight') return []
  if (plannedWeightKg === null || plannedWeightKg <= 0) return []

  const increment = weightStep(exercise)
  const group = MUSCLE_GROUPS[exercise.muscleGroup].label
  // מעגלים כלפי מטה — חימום כבד מדי מפספס את המטרה. אף פעם לא פחות מקפיצה אחת.
  const at = (pct: number): number =>
    Math.max(increment, roundToIncrement((plannedWeightKg * pct) / 100, increment, 'down'))

  if (wantsRamp(exercise, plannedWeightKg, increment)) {
    const steps = RAMP.map((step) => ({ weightKg: at(step.percent), reps: step.reps }))
    // רמפה שכל שלביה יצאו לאותו משקל (ציוד עם קפיצה גסה) מתכווצת חזרה לסט אחד
    const distinct = steps.filter(
      (s, i) => i === 0 || s.weightKg > steps[i - 1].weightKg
    )
    if (distinct.length > 1) {
      return distinct.map((s, i) => ({
        ...s,
        reason:
          i === 0
            ? `רמפת חימום ל${group} — ${distinct.length} סטים עולים לפני משקל העבודה`
            : `שלב ${i + 1} מתוך ${distinct.length} ברמפת החימום`,
      }))
    }
  }

  return [
    {
      weightKg: at(percent),
      reps: clamp(exercise.targetReps.max, 8, 15),
      reason: `סט חימום ראשון ל${group} — ${Math.round(percent)}% ממשקל העבודה`,
    },
  ]
}

/** אילו קבוצות שריר כבר נגעו בהן — מחושב מהסטים שתועדו באימון */
export function groupsTouchedFrom(
  sets: readonly { exerciseId: string }[],
  groupOf: (id: string) => MuscleGroup | undefined
): Set<MuscleGroup> {
  const out = new Set<MuscleGroup>()
  for (const s of sets) {
    const group = groupOf(s.exerciseId)
    if (group) out.add(group)
  }
  return out
}
