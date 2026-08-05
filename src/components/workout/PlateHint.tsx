import type { JSX } from 'react'
import { Layers } from 'lucide-react'
import type { Exercise, PlateSettings } from '@/db/types'
import { calcPlates } from '@/domain/plates'

/**
 * "מה להעמיס על כל צד" — שורה אחת מתחת לשדה המשקל.
 * לא מוצג כלום כשהתרגיל לא עובד עם פלטות; שקט עדיף על רעש באמצע סט.
 */
export function PlateHint({
  targetKg,
  exercise,
  plates,
}: {
  targetKg: number
  exercise: Exercise
  plates: PlateSettings
}): JSX.Element | null {
  const breakdown = calcPlates(targetKg, exercise, plates)
  if (!breakdown) return null

  const tone = breakdown.error
    ? 'text-hard-400'
    : breakdown.exact
      ? 'text-bone-400'
      : 'text-bone-500'

  return (
    <p className={`mt-2 flex items-center gap-1.5 text-[0.6875rem] font-medium ${tone}`}>
      <Layers size={12} className="shrink-0" aria-hidden="true" />
      <span className="tnum truncate">{breakdown.text}</span>
    </p>
  )
}
