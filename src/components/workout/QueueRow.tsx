import type { JSX } from 'react'
import { Check, Clock } from 'lucide-react'
import type { Exercise, QueueItem } from '@/db/types'
import { formatRepRange } from '@/domain/units'

/**
 * תרגיל מכווץ בתור. שורה אחת, שטח לחיצה של 60 פיקסל — נגיעה אחת מעבירה
 * את האימון לתרגיל הזה.
 */
export function QueueRow({
  item,
  exercise,
  setCount,
  summary,
  onTap,
}: {
  item: QueueItem
  exercise: Exercise
  setCount: number
  /** "4 סטים · 25×10" — ריק כשעוד לא בוצע כלום */
  summary: string
  onTap: () => void
}): JSX.Element {
  const done = item.status === 'done'
  const deferred = item.status === 'deferred'

  const frame = deferred
    ? 'border-dashed border-flame-500/45 bg-flame-500/[0.04]'
    : done
      ? 'border-ink-800 bg-ink-900/40'
      : 'border-ink-800 bg-ink-900/60'

  return (
    <button
      type="button"
      onClick={onTap}
      className={`flex min-h-[60px] w-full items-center gap-3 rounded-card border px-3 py-2 text-start transition-colors active:bg-ink-800 ${frame} ${
        done ? 'opacity-55' : ''
      }`}
    >
      <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
        {done ? (
          <Check size={20} strokeWidth={3} className="text-pr-400" />
        ) : deferred ? (
          <Clock size={18} strokeWidth={2.5} className="text-flame-400" />
        ) : (
          <span className="size-3.5 rounded-full border-2 border-ink-600" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-bold text-bone-100">
          {exercise.name}
        </span>
        {deferred && (
          <span className="mt-0.5 block truncate text-[0.6875rem] font-semibold text-flame-400">
            ממתין — המתקן היה תפוס
          </span>
        )}
      </span>

      <span className="tnum shrink-0 text-xs font-semibold text-bone-500" dir={summary ? 'rtl' : 'ltr'}>
        {summary || `${item.targetSets}×${formatRepRange(item.targetReps)}`}
      </span>

      {/* קורא מסך: מספר הסטים כבר מגולם בסיכום, אבל שורה בלי סיכום צריכה אותו */}
      {!summary && setCount > 0 && <span className="sr-only">{setCount} סטים</span>}
    </button>
  )
}
