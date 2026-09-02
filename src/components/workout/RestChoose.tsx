import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import { getSessionsSince, getLastPerformedMap } from '@/db/queries'
import type { Exercise, MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS } from '@/db/types'
import { coverageLookbackFrom, liveCoverageInput, muscleCoverage, uncoveredGroups } from '@/domain/coverage'
import { formatSetShort } from '@/domain/units'
import { useRestTimer } from '@/hooks/useRestTimer'
import { formatClock } from '@/domain/units'
import { useWorkout } from '@/state/activeWorkoutStore'
import { ExerciseThumb } from '@/components/media/ExerciseThumb'

/**
 * "מה הלאה" — בתוך המנוחה, לא אחריה.
 *
 * זה הלב של אימון חופשי. בלי תוכנית, ההחלטה מה עושים אחר כך נופלת בדיוק ברגע
 * שבו אין מה לעשות איתה: עומדים ליד המכונה, הטיימר רץ, והראש פנוי. הפאנל הזה
 * לוקח את הדקה המתה הזו והופך אותה לזמן ההחלטה — **וכשהטיימר נגמר אתה כבר
 * מכוון על התרגיל הבא** במקום להתחיל לחפש אותו.
 *
 * **לחיצה על הצעה לא נוגעת ב-`restEndsAt`.** זו כל הפואנטה, ולא פרט מימוש:
 * מנוחה שמתאפסת בכל החלפת תרגיל הייתה הופכת את הבחירה לעונש.
 *
 * שני מקורות להצעות, ובכוונה שונים זה מזה — האחד ממשיך את מה שאתה בתוכו,
 * והשני שובר אליו:
 *   1. **אותו שריר** — התרגיל הבא בקבוצה הנוכחית שלא נגעת בו באימון הזה.
 *   2. **שריר טרי** — הראשון בקבוצה המוזנחת ביותר שלא נגעת בה היום.
 */

interface Suggestion {
  exercise: Exercise
  /** "עוד לגב" / "כתפיים · טרי" */
  note: string
  fresh: boolean
  /** "קודם 45 × 10" או "ראשון" */
  previous: string
}

export function RestChoose({
  currentGroup,
  rest,
  onPick,
  onOtherMuscle,
  onOpenFull,
  onAdd30,
}: {
  currentGroup: MuscleGroup
  /** null = טיימר המנוחה כבוי; אז אין שורת ספירה, ורק ההחלטה נשארת */
  rest: { endsAt: number; totalSeconds: number } | null
  onPick: (exercise: Exercise) => void
  onOtherMuscle: () => void
  onOpenFull: () => void
  onAdd30: () => void
}): JSX.Element {
  const workout = useWorkout((s) => s.workout)
  const exercisesById = useWorkout((s) => s.exercisesById)
  const [now] = useState(() => Date.now())
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)

  // בלי onFinish: `RestOverlay` הוא הבעלים היחיד של הצליל ושל ההבזק
  const timer = useRestTimer(rest?.endsAt ?? null, rest?.totalSeconds ?? 0, () => {})

  /** מה כבר נגעת בו באימון הזה — לא מציעים אותו שוב */
  const touched = useMemo(() => {
    const ids = new Set<string>()
    const groups = new Set<MuscleGroup>()
    for (const item of workout?.queue ?? []) {
      ids.add(item.exerciseId)
      const ex = exercisesById[item.exerciseId]
      if (ex) groups.add(ex.muscleGroup)
    }
    return { ids, groups }
  }, [workout?.queue, exercisesById])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [history, lastPerformed] = await Promise.all([
        getSessionsSince(coverageLookbackFrom(now)),
        getLastPerformedMap(),
      ])
      if (cancelled) return

      const all = Object.values(exercisesById).filter((e) => e.isActive)
      const live = liveCoverageInput(useWorkout.getState().workout, now)
      const rows = muscleCoverage(
        all,
        [...history.sessions, ...live.sessions],
        [...history.sets, ...live.sets],
        now,
        4
      )

      const describe = (exercise: Exercise, note: string, fresh: boolean): Suggestion => {
        const last = lastPerformed.get(exercise.id)
        return {
          exercise,
          note,
          fresh,
          previous: last
            ? `קודם ${formatSetShort(last.weightKg, last.reps, exercise.weightMode, exercise.metric)}`
            : 'ראשון',
        }
      }

      const out: Suggestion[] = []

      // 1 — עוד באותו שריר
      const sameGroup = all
        .filter((e) => e.muscleGroup === currentGroup && !touched.ids.has(e.id))
        .sort((a, b) => a.order - b.order)[0]
      if (sameGroup) {
        out.push(describe(sameGroup, `עוד ל${MUSCLE_GROUPS[currentGroup].label}`, false))
      }

      // 2 — שריר טרי שלא נגעת בו היום
      const freshRow = uncoveredGroups(rows).find((r) => !touched.groups.has(r.group))
      if (freshRow) {
        const pick = all
          .filter((e) => e.muscleGroup === freshRow.group && !touched.ids.has(e.id))
          .sort((a, b) => a.order - b.order)[0]
        if (pick) out.push(describe(pick, `${freshRow.label} · טרי`, true))
      }

      setSuggestions(out)
    })()
    return () => {
      cancelled = true
    }
  }, [currentGroup, exercisesById, now, touched])

  const clock = formatClock(timer.remainingSeconds)
  const urgent = timer.active && timer.remainingSeconds <= 3

  return (
    <div className="animate-fade absolute inset-0 flex flex-col rounded-[18px] border border-flame-500/30 bg-ink-900 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_srgb,var(--color-flame-500)_14%,transparent),transparent_70%)] p-3">
      {rest ? (
        <div className="flex h-[30px] shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenFull}
            aria-label={`מנוחה, נותרו ${clock} — פתח את מסך המנוחה המלא`}
            className={`tnum shrink-0 text-[1.875rem] leading-none font-extrabold ${
              urgent ? 'animate-heat text-flame-400' : 'text-bone-50'
            }`}
          >
            <span dir="ltr">{clock}</span>
          </button>
          <span className="h-[5px] flex-1 overflow-hidden rounded-[3px] bg-ink-700">
            <span
              className="block h-full rounded-[3px] bg-linear-to-l from-flame-500 to-flame-300 transition-[width] duration-300"
              style={{ width: `${Math.round(timer.progress * 100)}%` }}
            />
          </span>
          {/* dir=ltr: בריצת RTL הסימן קופץ לסוף ו-"‎+30" נקרא "30+" */}
          <button
            type="button"
            dir="ltr"
            onClick={onAdd30}
            aria-label="הוסף 30 שניות למנוחה"
            className="btn-ghost flex h-[30px] shrink-0 items-center rounded-[10px] px-2.5 text-[0.71875rem] font-bold"
          >
            +30
          </button>
        </div>
      ) : null}

      {/*
        ‏`flex: none` על כל שורה, וזו לא קוסמטיקה: בלעדיו ה-flex סוחט שלוש
        שורות של 40 אל מתחת ליעד הלחיצה של 44, בשקט מוחלט.
      */}
      <div className="mt-2 flex flex-1 flex-col gap-1.5">
        {(suggestions ?? []).map((s) => (
          <button
            key={s.exercise.id}
            type="button"
            onClick={() => onPick(s.exercise)}
            className="flex h-10 flex-none items-center gap-2 rounded-[13px] border border-ink-700 bg-ink-850 px-2 text-start active:border-flame-700"
          >
            <ExerciseThumb exerciseId={s.exercise.id} libraryId={s.exercise.libraryId} size="row" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs leading-tight font-bold text-bone-100">
                {s.exercise.name}
              </span>
              <span
                className={`block truncate text-[0.625rem] leading-tight font-semibold ${
                  s.fresh ? 'text-pr-400' : 'text-flame-300'
                }`}
              >
                {s.note}
              </span>
            </span>
            <span dir="ltr" className="tnum shrink-0 text-[0.65625rem] font-bold text-bone-500">
              {s.previous}
            </span>
          </button>
        ))}

        {suggestions !== null && suggestions.length === 0 ? (
          <p className="flex-none text-center text-[0.71875rem] font-semibold text-bone-500">
            עברת על כל השרירים הטריים
          </p>
        ) : null}

        <button
          type="button"
          onClick={onOtherMuscle}
          className="mt-auto flex h-10 flex-none items-center justify-center rounded-[13px] border border-dashed border-ink-600 text-xs font-bold text-bone-300 active:border-ink-700"
        >
          בחר שריר אחר
        </button>
      </div>
    </div>
  )
}
