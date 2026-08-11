import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Trophy, X } from 'lucide-react'
import { BottomSheet, EmptyState } from '@/components/ui'
import { VideoThumb } from '@/components/media/VideoThumb'
import { VideoPlayer } from '@/components/media/VideoPlayer'
import { getAllPrs, getSubstituteCandidates } from '@/db/queries'
import { EQUIPMENT_LABELS, MUSCLE_GROUPS } from '@/db/types'
import type { Exercise, PersonalRecord } from '@/db/types'
import { formatClock, formatWeight } from '@/domain/units'
import { distinguisher, duplicateNames } from '@/domain/naming'
import { normalize } from '@/lib/text'

/**
 * החלפת תרגיל באמצע אימון.
 *
 * הסיבה נשמרת ולא נזרקת: "המתקן תפוס" הוא אילוץ רגעי ולא שינוי טעם, ורק
 * ההפרדה הזו מאפשרת אחר כך לדעת אם התוכנית באמת לא עובדת.
 */

interface SubstituteSheetProps {
  open: boolean
  onClose: () => void
  exercise: Exercise
  onPick: (exerciseId: string, reason: 'occupied' | 'choice') => void
}

/** משווה טקסט עברי בלי רגישות לגרשיים טיפוגרפיים */

/** השיא שמעניין בשורת בחירה — הכי כבד, או הכי הרבה חזרות בתרגילי משקל גוף */
function prText(ex: Exercise, prs: PersonalRecord[]): string | null {
  const own = prs.filter((p) => p.exerciseId === ex.id)
  if (ex.weightMode === 'bodyweight') {
    const reps = own.find((p) => p.kind === 'maxReps')
    if (!reps) return null
    // פלאנק נמדד בשניות. "שיא: 80 חזרות" הוא בדיוק סוג המספר שמאבד אמון.
    return ex.metric === 'seconds'
      ? `שיא: ${formatClock(reps.value)}`
      : `שיא: ${reps.value} חזרות`
  }
  const max = own.find((p) => p.kind === 'maxWeight')
  return max ? `שיא: ${formatWeight(max.value, ex.weightMode)}` : null
}

function Row({
  ex,
  prs,
  apart,
  onPick,
  onPlay,
}: {
  ex: Exercise
  prs: PersonalRecord[]
  /** המשקל שמבדיל בין שני תרגילים בעלי אותו שם, כשיש כאלה ברשימה */
  apart: string | null
  onPick: () => void
  onPlay: () => void
}): JSX.Element {
  const pr = prText(ex, prs)
  return (
    <li className="card flex items-center gap-3 p-2">
      <VideoThumb exerciseId={ex.id} size="sm" onOpen={onPlay} />
      <button
        type="button"
        onClick={onPick}
        className="flex min-h-13 flex-1 flex-col justify-center gap-0.5 rounded-xl px-2 text-start active:bg-ink-800"
      >
        <span className="text-base leading-tight font-bold text-bone-50">{ex.name}</span>
        <span className="meta">
          {[ex.subTarget, EQUIPMENT_LABELS[ex.equipment], apart].filter(Boolean).join(' · ')}
        </span>
        {pr ? (
          <span className="mt-0.5 flex items-center gap-1 text-xs font-bold text-bone-400">
            <Trophy size={12} className="shrink-0 text-flame-400" />
            <span dir="rtl">{pr}</span>
          </span>
        ) : null}
      </button>
    </li>
  )
}

export function SubstituteSheet({
  open,
  onClose,
  exercise,
  onPick,
}: SubstituteSheetProps): JSX.Element {
  const [reason, setReason] = useState<'occupied' | 'choice'>('occupied')
  const [query, setQuery] = useState('')
  const [playing, setPlaying] = useState<Exercise | null>(null)

  useEffect(() => {
    if (!open) return
    setReason('occupied')
    setQuery('')
    setPlaying(null)
  }, [open])

  const candidates = useLiveQuery<Exercise[], Exercise[]>(
    () => (open ? getSubstituteCandidates(exercise) : Promise.resolve([])),
    [open, exercise.id],
    []
  )
  const prs = useLiveQuery<PersonalRecord[], PersonalRecord[]>(
    () => (open ? getAllPrs() : Promise.resolve([])),
    [open],
    []
  )

  // התרגיל הנוכחי נספר גם הוא: הוא זה שנשאר על המסך ליד המועמדים
  const duplicates = useMemo(
    () => duplicateNames([exercise, ...candidates]),
    [exercise, candidates]
  )

  const { same, others } = useMemo(() => {
    const q = normalize(query)
    const filtered = q
      ? candidates.filter(
          (e) => normalize(e.name).includes(q) || normalize(e.nameEn ?? '').includes(q)
        )
      : candidates
    return {
      same: filtered.filter((e) => e.subTarget === exercise.subTarget),
      others: filtered.filter((e) => e.subTarget !== exercise.subTarget),
    }
  }, [candidates, query, exercise.subTarget])

  function choose(id: string): void {
    onPick(id, reason)
    onClose()
  }

  const empty = same.length === 0 && others.length === 0

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="החלף תרגיל">
        <p className="-mt-1 mb-4 text-sm font-semibold text-bone-400">במקום {exercise.name}</p>

        {/* הסיבה נבחרת לפני התרגיל — היא זו שנשמרת להיסטוריה */}
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-pill border border-ink-700 bg-ink-850 p-1">
          {(
            [
              { value: 'occupied' as const, label: 'המתקן תפוס' },
              { value: 'choice' as const, label: 'בא לי משהו אחר' },
            ]
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setReason(opt.value)}
              aria-pressed={reason === opt.value}
              className={[
                'min-h-12 rounded-pill px-3 text-sm font-bold transition-colors',
                reason === opt.value
                  ? 'bg-flame-500/15 text-flame-300 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-flame-400)_45%,transparent)]'
                  : 'text-bone-400 active:bg-ink-800',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search
            size={16}
            className="pointer-events-none absolute inset-y-0 start-3 my-auto text-bone-600"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש תרגיל"
            aria-label="חיפוש תרגיל"
            className="min-h-12 w-full rounded-2xl border border-ink-700 bg-ink-850 ps-9 pe-10 text-bone-50 placeholder:text-bone-600 focus:border-flame-500/50 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="נקה חיפוש"
              className="absolute inset-y-0 end-1 my-auto flex size-11 items-center justify-center rounded-full text-bone-500 active:bg-ink-800"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {empty ? (
          <EmptyState
            title="אין תחליף מתאים כאן"
            hint={
              query
                ? 'אף תרגיל לא תואם לחיפוש. נסה שם קצר יותר.'
                : 'אין עוד תרגילים פעילים לקבוצת השריר הזו בקטלוג.'
            }
          />
        ) : (
          <div className="flex flex-col gap-5 pb-4">
            {same.length ? (
              <section>
                <h3 className="meta mb-2">אותו מיקוד — {exercise.subTarget}</h3>
                <ul className="flex flex-col gap-2">
                  {same.map((ex) => (
                    <Row
                      key={ex.id}
                      ex={ex}
                      prs={prs}
                      apart={distinguisher(ex, duplicates)}
                      onPick={() => choose(ex.id)}
                      onPlay={() => setPlaying(ex)}
                    />
                  ))}
                </ul>
              </section>
            ) : null}

            {others.length ? (
              <section>
                <h3 className="meta mb-2">
                  עוד תרגילים ל{MUSCLE_GROUPS[exercise.muscleGroup].label}
                </h3>
                <ul className="flex flex-col gap-2">
                  {others.map((ex) => (
                    <Row
                      key={ex.id}
                      ex={ex}
                      prs={prs}
                      apart={distinguisher(ex, duplicates)}
                      onPick={() => choose(ex.id)}
                      onPlay={() => setPlaying(ex)}
                    />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </BottomSheet>

      {playing ? (
        <VideoPlayer
          exerciseId={playing.id}
          exerciseName={playing.name}
          open
          onClose={() => setPlaying(null)}
        />
      ) : null}
    </>
  )
}
