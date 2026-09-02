import type { JSX } from 'react'
import type { MuscleCoverage, Recovery } from '@/domain/coverage'
import { recoveryOf, recoveryText } from '@/domain/coverage'
import { groupCardFor } from '@/db/muscleCards'
import { assetUrl } from '@/db/mediaDb'

/**
 * רשת שמונת השרירים, מסודרת לפי התאוששות.
 *
 * זו נקודת הפתיחה של אימון בלי תוכנית: לא "איזה אימון היום" אלא "מה נח". הסדר
 * מגיע כמו שהוא מ-`muscleCoverage` — המוזנח ראשון — ולא מ-`MUSCLE_GROUP_ORDER`,
 * כי הסדר *הוא* התשובה. קבוצה לא נעלמת מהרשת גם באפס סטים; קבוצה שנעלמת מהמסך
 * היא בדיוק זו שממשיכים לשכוח.
 *
 * שלושת המצבים נגזרים כולם מאותה שורת `MuscleCoverage`, ואין כאן חישוב שני:
 * `uncovered` הוא הדגל, `daysSince` הוא המספר, ו-`coverageText` הוא המילים.
 */

interface Look {
  dot: string
  text: string
  frame: string
}

const LOOK: Record<Recovery, Look> = {
  fresh: { dot: 'bg-pr-400', text: 'text-pr-400', frame: 'border-pr-400/25' },
  rested: { dot: 'bg-bone-300', text: 'text-bone-300', frame: 'border-ink-800' },
  tired: { dot: 'bg-flame-300', text: 'text-flame-300', frame: 'border-ink-800' },
}

export function MuscleGrid({
  rows,
  onPick,
}: {
  /** מ-`muscleCoverage`, בסדר שהוא החזיר — המוזנח ראשון */
  rows: readonly MuscleCoverage[]
  onPick: (row: MuscleCoverage) => void
}): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.map((row) => {
        const look = LOOK[recoveryOf(row)]
        const card = groupCardFor(row.group)
        return (
          <button
            key={row.group}
            type="button"
            onClick={() => onPick(row)}
            aria-label={`${row.label} — ${recoveryText(row)}`}
            className={`flex h-21 items-center gap-2.5 rounded-[18px] border bg-linear-to-b from-ink-850 to-ink-900 px-2.5 text-start active:border-ink-600 ${look.frame}`}
          >
            {/*
              ‏`contain` ולא `cover`: הכרטיס הוא איור על רקע לבן, וחיתוך בולע
              בדיוק את החלק המסומן — כלומר את מה שמזהה את השריר.
            */}
            {card ? (
              <img
                src={assetUrl(card.thumb)}
                alt=""
                loading="lazy"
                className="size-13 shrink-0 rounded-[13px] bg-bone-50 object-contain"
              />
            ) : (
              <span className="size-13 shrink-0 rounded-[13px] border border-dashed border-ink-700" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.9375rem] leading-tight font-extrabold text-bone-100">
                {row.label}
              </span>
              <span className="mt-1.5 flex items-center gap-1.5">
                <span className={`size-[5px] shrink-0 rounded-full ${look.dot}`} aria-hidden="true" />
                <span
                  className={`min-w-0 truncate text-[0.65625rem] leading-tight font-semibold ${look.text}`}
                >
                  {recoveryText(row)}
                </span>
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
