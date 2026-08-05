import { useState } from 'react'
import type { JSX } from 'react'
import { Ellipsis, Flame, Pencil, Repeat, Trash2, Trophy } from 'lucide-react'
import type { DraftSet, Exercise } from '@/db/types'
import { formatSetShort } from '@/domain/units'
import { toast } from '@/components/ui'

/**
 * סט שכבר תועד.
 *
 * החלקה הצידה לא אמינה ביד מיוזעת ובכפפות, ולכן הפעולות יושבות מאחורי כפתור
 * מפורש שפותח שורת פעולות מתחת לסט.
 */
export function SetRow({
  index,
  set,
  exercise,
  onEdit,
  onToggleType,
  onDelete,
  isPr = false,
}: {
  /** מספר הסט להצגה — נספר רק על סטי עבודה */
  index: number
  set: DraftSet
  exercise: Exercise
  onEdit: () => void
  onToggleType: () => void
  onDelete: () => void
  isPr?: boolean
}): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const warmup = set.type === 'warmup'
  const text = formatSetShort(set.weightKg, set.reps, exercise.weightMode)

  return (
    <li
      className={`rounded-xl border ${
        warmup ? 'border-warmup-400/25 bg-warmup-400/[0.06]' : 'border-ink-700 bg-ink-900/70'
      }`}
    >
      <div className="flex items-center gap-2.5 ps-2.5 pe-1">
        {warmup ? (
          <span className="flex h-8 shrink-0 items-center gap-1 rounded-pill border border-warmup-400/40 px-2 text-[0.625rem] font-extrabold text-warmup-400">
            <Flame size={11} strokeWidth={2.5} className="opacity-60" aria-hidden="true" />
            חימום
          </span>
        ) : (
          <span className="tnum flex size-8 shrink-0 items-center justify-center rounded-full border border-ink-600 bg-ink-800 text-xs font-extrabold text-bone-300">
            {index}
          </span>
        )}

        <span dir="ltr" className="tnum py-3 text-base font-extrabold text-bone-50">
          {text}
        </span>

        {exercise.weightMode === 'perSide' && (
          <span className="text-[0.6875rem] font-medium text-bone-500">כל צד</span>
        )}

        {isPr && (
          <Trophy size={16} className="animate-stamp shrink-0 text-pr-400" aria-label="שיא אישי" />
        )}

        <span className="flex-1" />

        <button
          type="button"
          aria-label={menuOpen ? 'סגור פעולות' : 'פעולות לסט'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${
            menuOpen ? 'bg-ink-700 text-flame-400' : 'text-bone-500'
          }`}
        >
          <Ellipsis size={20} />
        </button>
      </div>

      {menuOpen && (
        <div className="animate-fade flex gap-1.5 border-t border-ink-800 p-1.5">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              onEdit()
            }}
            className="btn-ghost flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold"
          >
            <Pencil size={15} />
            ערוך
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              onToggleType()
            }}
            className="btn-ghost flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold"
          >
            <Repeat size={15} />
            {warmup ? 'הפוך לעבודה' : 'הפוך לחימום'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              onDelete()
              toast(`הסט נמחק — ${text}`, { tone: 'warn' })
            }}
            className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-lg border border-hard-400/35 bg-hard-400/10 text-xs font-bold text-hard-400"
          >
            <Trash2 size={15} />
            מחק
          </button>
        </div>
      )}
    </li>
  )
}
