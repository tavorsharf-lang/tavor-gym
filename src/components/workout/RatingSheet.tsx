import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { BottomSheet } from '@/components/ui'
import { RIR_LABELS } from '@/db/types'
import type { Exercise, Rating, Rir } from '@/db/types'

/**
 * דירוג המאמץ בסוף תרגיל.
 *
 * שני שלבים בכוונה: קודם שאלה אחת ענקית שאפשר לענות עליה בלי להסתכל, ורק
 * אחר כך, למי שרוצה, עידון של כמה חזרות נשארו. הרוב יסיימו אחרי הלחיצה
 * הראשונה — וזה בסדר.
 */

interface RatingSheetProps {
  open: boolean
  onClose: () => void
  exercise: Exercise
  current: { rating: Rating; rir: Rir | null } | null
  onRate: (rating: Rating, rir: Rir | null) => void
  askRir: boolean
}

interface Choice {
  value: Rating
  label: string
  hint: string
  /** מסגרת ורקע במצב רגיל */
  idle: string
  /** ההדגשה כשהאפשרות נבחרה */
  picked: string
  bars: string
}

const CHOICES: Choice[] = [
  {
    value: 1,
    label: 'קל',
    hint: 'יכולתי עוד הרבה',
    idle: 'border-pr-400/25 bg-pr-400/6 text-pr-400',
    picked: 'border-pr-400/70 bg-pr-400/16 text-pr-400',
    bars: 'bg-pr-400',
  },
  {
    value: 2,
    label: 'בינוני',
    hint: 'היה מאמץ אמיתי',
    idle: 'border-ink-700 bg-ink-800 text-bone-200',
    picked: 'border-bone-400/70 bg-ink-700 text-bone-50',
    bars: 'bg-bone-200',
  },
  {
    value: 3,
    label: 'קשה',
    hint: 'בקושי סיימתי',
    idle: 'border-hard-400/25 bg-hard-400/6 text-hard-400',
    picked: 'border-hard-400/70 bg-hard-400/16 text-hard-400',
    bars: 'bg-hard-400',
  },
]

const RIR_VALUES: Rir[] = [0, 1, 2, 3, 4]

export function RatingSheet({
  open,
  onClose,
  exercise,
  current,
  onRate,
  askRir,
}: RatingSheetProps): JSX.Element {
  const currentRating = current?.rating ?? null
  const currentRir = current?.rir ?? null

  const [rating, setRating] = useState<Rating | null>(currentRating)
  const [rir, setRir] = useState<Rir | null>(currentRir)
  /** האם נגעו בדירוג בפתיחה הזו — בלי זה סגירה סתמית הייתה מוחקת RIR קיים */
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!open) return
    setRating(currentRating)
    setRir(currentRir)
    setDirty(false)
  }, [open, currentRating, currentRir])

  /**
   * onRate נקרא פעם אחת בלבד, בסוף הזרימה. קריאה כבר בלחיצה על הדירוג הייתה
   * גורמת למסך האימון לסגור את הגיליון לפני ששלב ה-RIR בכלל הספיק להופיע.
   */
  function pickRating(value: Rating): void {
    setDirty(true)
    setRating(value)
    setRir(null)
    if (!askRir) {
      onRate(value, null)
      onClose()
    }
  }

  function pickRir(value: Rir): void {
    if (rating === null) return
    setRir(value)
    onRate(rating, value)
    onClose()
  }

  function dismiss(): void {
    if (dirty && rating !== null) onRate(rating, null)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={dismiss} title="איך היה?">
      <p className="-mt-1 mb-4 text-sm font-semibold text-bone-400">{exercise.name}</p>

      <div className="flex flex-col gap-3">
        {CHOICES.map((choice) => {
          const selected = rating === choice.value
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => pickRating(choice.value)}
              aria-pressed={selected}
              className={[
                'flex min-h-24 w-full items-center gap-4 rounded-card border px-5 text-start',
                'transition-transform duration-100 active:scale-[0.985]',
                selected ? choice.picked : choice.idle,
                selected ? 'ring-1 ring-current/50' : '',
              ].join(' ')}
            >
              {/* שלושה פסים שמתמלאים לפי עוצמת המאמץ — קריא גם בלי לקרוא */}
              <span className="flex shrink-0 flex-col-reverse gap-1" aria-hidden="true">
                {[1, 2, 3].map((level) => (
                  <span
                    key={level}
                    className={[
                      'block h-1.5 w-6 rounded-pill',
                      level <= choice.value ? choice.bars : 'bg-current opacity-15',
                    ].join(' ')}
                  />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-2xl leading-tight font-extrabold">{choice.label}</span>
                <span className="mt-1 block text-sm font-medium text-bone-500">{choice.hint}</span>
              </span>
            </button>
          )
        })}
      </div>

      {askRir && rating !== null ? (
        <div className="animate-rise mt-6 border-t border-ink-800 pt-5">
          <p className="mb-3 text-sm font-bold text-bone-200">רוצה לדייק? כמה חזרות נשארו לך</p>
          <div className="flex flex-wrap gap-2">
            {RIR_VALUES.map((value) => {
              const selected = rir === value
              return (
                <button
                  key={value}
                  type="button"
                  dir="ltr"
                  onClick={() => pickRir(value)}
                  aria-pressed={selected}
                  className={[
                    'tnum min-h-12 min-w-14 rounded-pill border px-3 text-sm font-extrabold',
                    'transition-transform duration-100 active:scale-95',
                    selected
                      ? 'border-flame-400/70 bg-flame-500/15 text-flame-300'
                      : 'border-ink-700 bg-ink-800 text-bone-200',
                  ].join(' ')}
                >
                  {RIR_LABELS[value]}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="mt-4 min-h-12 w-full rounded-2xl text-sm font-bold text-bone-500 active:bg-ink-800"
          >
            דלג
          </button>
        </div>
      ) : null}

      <div className="h-4" />
    </BottomSheet>
  )
}
