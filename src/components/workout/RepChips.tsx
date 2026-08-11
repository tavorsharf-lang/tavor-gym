import type { JSX } from 'react'
import type { RepRange } from '@/db/types'
import { repMarks } from '@/domain/units'

/**
 * "כמה חזרות עשיתי" — סימון ישיר של המספר שבוצע.
 *
 * הכפתורים +/- טובים לתיקון של חזרה אחת, אבל סט נגמר בידיעה שלמה ("עשיתי
 * תשע"), ולא בספירה מהמספר שהיה בשדה. השורה הזו הופכת את הידיעה הזו ללחיצה
 * אחת, והמספר שנבחר מסומן בכתום כדי שיהיה כתוב במפורש מה תיעדתי.
 */

export function RepChips({
  value,
  targetReps,
  fallback,
  onPick,
}: {
  value: number
  targetReps: RepRange
  /** המספר שהשדה נפתח עליו — תמיד יהיה על השורה */
  fallback: number
  onPick: (reps: number) => void
}): JSX.Element | null {
  const marks = repMarks(targetReps, fallback)
  if (marks.length === 0) return null

  return (
    <div className="mt-2.5">
      <span className="meta">כמה חזרות עשיתי</span>
      {/* dir=ltr: המספרים עולים משמאל לימין, כמו כל סרגל מספרים באפליקציה */}
      <div dir="ltr" className="mt-1.5 flex flex-wrap gap-1.5">
        {marks.map((n) => {
          const picked = n === value
          return (
            <button
              key={n}
              type="button"
              aria-pressed={picked}
              aria-label={`${n} חזרות`}
              onClick={() => onPick(n)}
              className={`tnum flex h-11 min-w-11 flex-1 items-center justify-center rounded-xl border px-2 text-base font-extrabold transition-colors ${
                picked
                  ? 'border-flame-500/60 bg-flame-500/15 text-flame-400'
                  : 'border-ink-700 bg-ink-850 text-bone-300 active:bg-ink-700'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
