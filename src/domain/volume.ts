import type { Exercise, SetLog, WeightMode } from '@/db/types'
import { round2 } from './units'

/**
 * חישוב נפח — נקודה אחת בלבד בכל האפליקציה.
 *
 * שני כללים שאסור לשכפל בשום מקום אחר:
 *   1. סטי חימום שווים 0. הם נשמרים ומוצגים, אבל לא נספרים.
 *   2. perSide מוכפל בשתיים — *רק* כאן. בכל מסך אחר מציגים את המספר כמו
 *      שהוא רשום על המכונה.
 */

/** נפח של סט בודד בק״ג */
export function setVolume(
  set: Pick<SetLog, 'type' | 'weightKg' | 'reps'>,
  weightMode: WeightMode
): number {
  if (set.type !== 'work') return 0
  if (weightMode === 'bodyweight') return 0
  const effective = weightMode === 'perSide' ? set.weightKg * 2 : set.weightKg
  return round2(effective * set.reps)
}

export interface VolumeTotals {
  volumeKg: number
  /** כל הסטים, כולל חימום */
  totalSets: number
  workSets: number
  warmupSets: number
  /** חזרות בסטי עבודה בלבד */
  workReps: number
}

const EMPTY: VolumeTotals = {
  volumeKg: 0,
  totalSets: 0,
  workSets: 0,
  warmupSets: 0,
  workReps: 0,
}

/**
 * סיכום קבוצת סטים.
 * @param modeOf מחזיר את מצב המשקל של תרגיל. חסר → מתייחסים כ-total.
 */
export function summarize(
  sets: readonly SetLog[],
  modeOf: (exerciseId: string) => WeightMode | undefined
): VolumeTotals {
  const out = { ...EMPTY }
  for (const s of sets) {
    out.totalSets += 1
    if (s.type === 'warmup') {
      out.warmupSets += 1
      continue
    }
    out.workSets += 1
    out.workReps += s.reps
    out.volumeKg += setVolume(s, modeOf(s.exerciseId) ?? 'total')
  }
  out.volumeKg = round2(out.volumeKg)
  return out
}

/** בונה מפה מהירה מתרגיל למצב משקל */
export function weightModeLookup(exercises: readonly Exercise[]): (id: string) => WeightMode | undefined {
  const map = new Map(exercises.map((e) => [e.id, e.weightMode]))
  return (id) => map.get(id)
}

/** רק סטי העבודה, לפי סדר הביצוע */
export function workSets(sets: readonly SetLog[]): SetLog[] {
  return sets.filter((s) => s.type === 'work').sort((a, b) => a.completedAt - b.completedAt)
}

/** המשקל הכבד ביותר בסטי עבודה, כמו שהוא רשום על המכונה */
export function topWorkWeight(sets: readonly SetLog[]): number | null {
  const w = workSets(sets)
  if (!w.length) return null
  return w.reduce((max, s) => Math.max(max, s.weightKg), -Infinity)
}

/**
 * "משקל העבודה" של תרגיל באימון — המשקל שבו בוצע הכי הרבה סטים,
 * ובתיקו הכבד יותר. יציב יותר מ"המקסימום" כשיש סט יחיד חריג.
 */
export function workingWeight(sets: readonly SetLog[]): number | null {
  const w = workSets(sets)
  if (!w.length) return null
  const counts = new Map<number, number>()
  for (const s of w) counts.set(s.weightKg, (counts.get(s.weightKg) ?? 0) + 1)
  let best = w[0].weightKg
  let bestCount = 0
  for (const [weight, count] of counts) {
    if (count > bestCount || (count === bestCount && weight > best)) {
      best = weight
      bestCount = count
    }
  }
  return best
}
