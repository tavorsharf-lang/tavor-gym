import type { JSX } from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type { Exercise } from '@/db/types'
import type { WeightRecommendation } from '@/domain/recommendation'

/**
 * ההמלצה של היום.
 *
 * לעולם לא מתמלאת לבד — המשקל בשדה הוא של המשתמש, וההמלצה היא הצעה בלחיצה
 * אחת. כל הכרטיס הוא שטח הלחיצה, כדי שאפשר יהיה לפגוע בו ביד רועדת.
 */

const TONES: Record<WeightRecommendation['tone'], string> = {
  up: 'text-flame-400',
  down: 'text-hard-400',
  steady: 'text-bone-400',
  neutral: '',
}

function ToneIcon({ tone }: { tone: WeightRecommendation['tone'] }): JSX.Element | null {
  if (tone === 'up') return <TrendingUp size={20} strokeWidth={2.5} />
  if (tone === 'down') return <TrendingDown size={20} strokeWidth={2.5} />
  if (tone === 'steady') return <Minus size={20} strokeWidth={2.5} />
  return null
}

export function RecommendationChip({
  recommendation,
  exercise,
  onApply,
}: {
  recommendation: WeightRecommendation
  exercise: Exercise
  onApply: (weightKg: number) => void
}): JSX.Element {
  const weight = recommendation.weightKg
  // בלי משקל אין מה למלא — נשארת רק המשפט עצמו
  const canApply = weight !== null && exercise.weightMode !== 'bodyweight'

  const body = (
    <>
      <span className={`shrink-0 ${TONES[recommendation.tone]}`} aria-hidden="true">
        <ToneIcon tone={recommendation.tone} />
      </span>
      <span className="min-w-0 flex-1 text-start text-sm leading-snug font-semibold text-bone-200">
        {recommendation.reason}
      </span>
    </>
  )

  if (!canApply) {
    return (
      <div className="mt-3 flex items-center gap-2.5 rounded-card border border-ink-700 bg-ink-900/60 px-3 py-3">
        {body}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onApply(weight)}
      className="btn-ghost mt-3 flex min-h-14 w-full items-center gap-2.5 rounded-card px-3 py-2"
    >
      {body}
      <span className="shrink-0 rounded-pill bg-flame-500/15 px-3.5 py-2 text-sm font-extrabold text-flame-400">
        מלא
      </span>
    </button>
  )
}
