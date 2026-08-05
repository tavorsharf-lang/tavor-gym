import type { Exercise, MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS } from '@/db/types'
import { roundToIncrement, weightStep } from '@/domain/units'

/**
 * הצעת סט חימום.
 *
 * החימום נקשר לקבוצת השריר ולא לתרגיל: מחממים פעם אחת כשנכנסים לחזה,
 * ולא שוב לפני כל תרגיל חזה באותו אימון. לכן ההחלטה תלויה במה שכבר תועד
 * באימון הנוכחי, לא בהיסטוריה.
 */

export interface WarmupContext {
  exercise: Exercise
  /** קבוצות שריר שכבר יש להן לפחות סט אחד באימון הנוכחי */
  touchedGroups: ReadonlySet<MuscleGroup>
  /** משקל העבודה המתוכנן להיום — מההמלצה או מהאימון הקודם. null כשלא ידוע. */
  plannedWeightKg: number | null
  /** settings.autoWarmup */
  enabled: boolean
  /** settings.warmupPercent */
  percent: number
}

export interface WarmupSuggestion {
  weightKg: number
  reps: number
  reason: string
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export function suggestWarmup(ctx: WarmupContext): WarmupSuggestion | null {
  const { exercise, touchedGroups, plannedWeightKg, enabled, percent } = ctx
  if (!enabled) return null
  if (touchedGroups.has(exercise.muscleGroup)) return null
  if (exercise.weightMode === 'bodyweight') return null
  if (plannedWeightKg === null || plannedWeightKg <= 0) return null

  const increment = weightStep(exercise)
  // מעגלים כלפי מטה — חימום כבד מדי מפספס את המטרה. אף פעם לא פחות מקפיצה אחת.
  const weightKg = Math.max(
    increment,
    roundToIncrement((plannedWeightKg * percent) / 100, increment, 'down')
  )

  return {
    weightKg,
    reps: clamp(exercise.targetReps.max, 8, 15),
    reason: `סט חימום ראשון ל${MUSCLE_GROUPS[exercise.muscleGroup].label} — ${Math.round(percent)}% ממשקל העבודה`,
  }
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
