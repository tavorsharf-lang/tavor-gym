import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Wand2 } from 'lucide-react'
import { getSettings } from '@/db/db'
import { getAllExercises, getExerciseHistory, getLastPerformedMap, getSessionsSince } from '@/db/queries'
import { useHiddenExerciseIds } from '@/db/hiddenExercises'
import type { Exercise, MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS } from '@/db/types'
import {
  coverageLookbackFrom,
  liveCoverageInput,
  muscleCoverage,
  suggestWorkout,
  uncoveredGroups,
} from '@/domain/coverage'
import type { MuscleCoverage } from '@/domain/coverage'
import { recommendWeight } from '@/domain/recommendation'
import { useWorkout } from '@/state/activeWorkoutStore'
import { toast } from '@/components/ui'
import { useAudioCue } from '@/hooks/useAudioCue'
import { MuscleGrid } from '@/components/exercises/MuscleGrid'
import { ExercisePickList } from '@/components/exercises/ExercisePickList'
import type { PickRow } from '@/components/exercises/ExercisePickList'

/**
 * אימון בלי תוכנית.
 *
 * המסלול השני להתחיל להתאמן, ואת כולו אפשר לתאר בשלוש מילים: **שריר, תרגיל,
 * תיעוד.** אין סל, אין גרירה, אין אישור, ואין מסך תכנון לפני הסט הראשון — מי
 * שמחליט ביום עצמו לא אמור לשלם מחיר של מי שמתכנן מראש.
 *
 * נקודת הפתיחה היא **שריר ולא תוכנית**, והשרירים מסודרים לפי התאוששות. זו לא
 * קוסמטיקה: "מה נח" היא השאלה שבאמת נשאלת בכניסה לחדר, והסדר עונה עליה לפני
 * שנקראה מילה אחת.
 *
 * המסך הוא **מסלול ולא גיליון**, גם כשנכנסים אליו מתוך אימון שרץ: רשת של
 * שמונה אריחים ורשימה של תרגילים לא נכנסות לגיליון בלי לגלול, ובאמצע אימון
 * גלילה היא בדיוק מה שאין סבלנות אליו. היציאה מחזירה למקום שממנו נכנסת.
 */

type Phase = { group: MuscleGroup | null }

export function FreestyleScreen(): JSX.Element | null {
  const navigate = useNavigate()
  const workout = useWorkout((s) => s.workout)
  const hidden = useHiddenExerciseIds()

  const [{ group }, setPhase] = useState<Phase>({ group: null })
  const [busy, setBusy] = useState(false)
  const [now] = useState(() => Date.now())

  /*
    מאיפה נכנסנו — ולאן `ביטול` מחזיר.

    נלכד פעם אחת בפתיחה ולא נגזר מ-`workout` בזמן אמת: בחירת תרגיל *יוצרת*
    אימון, ומקור שנקרא אחריה היה אומר "מתוך אימון" על מסך שנפתח מהבית.
  */
  const [origin] = useState<'home' | 'workout'>(() => (workout ? 'workout' : 'home'))

  const settings = useLiveQuery(() => getSettings(), [])
  const exercises = useLiveQuery(() => getAllExercises(), [], [])
  const lastPerformed = useLiveQuery(() => getLastPerformedMap(), [], undefined)
  const history = useLiveQuery(() => getSessionsSince(coverageLookbackFrom(Date.now())), [], undefined)

  const { unlock } = useAudioCue(settings?.soundEnabled ?? true, settings?.soundVolume ?? 0.8)

  /*
    הכיסוי כולל את האימון שרץ עכשיו (`liveCoverageInput`).

    בלעדיו אריח "גב" היה ממשיך להאיר "לא נגעת" אחרי שלושה סטים של חתירה
    שנרשמו לפני דקה — כלומר הרשת הייתה משקרת בדיוק ברגע שבו חוזרים אליה
    כדי לבחור מה הלאה.
  */
  const rows: MuscleCoverage[] = useMemo(() => {
    if (!history || !settings) return []
    const live = liveCoverageInput(workout, now)
    return muscleCoverage(
      exercises,
      [...history.sessions, ...live.sessions],
      [...history.sets, ...live.sets],
      now,
      settings.coverageWindowDays
    )
  }, [exercises, history, settings, workout, now])

  /** התרגילים של הקבוצה שנבחרה, בלי מוסתרים */
  const groupExercises = useMemo(
    () =>
      group === null
        ? []
        : exercises
            .filter((e) => e.muscleGroup === group && e.isActive)
            .filter((e) => !hidden?.has(e.id) && !(e.libraryId && hidden?.has(e.libraryId)))
            .sort((a, b) => a.order - b.order),
    [exercises, group, hidden]
  )

  /*
    ההמלצה לכל שורה — מהמנוע ולא מחישוב שני.

    נטענת רק לקבוצה שנבחרה (שלוש עד שמונה שורות) ולא לכל הקטלוג: `recommendWeight`
    דורש היסטוריה מלאה לכל תרגיל, וטעינה מוקדמת שלה הייתה סורקת את כל טבלת
    הסטים בכל פתיחה של המסך.
  */
  const [picks, setPicks] = useState<PickRow[]>([])
  useEffect(() => {
    if (!groupExercises.length) {
      setPicks([])
      return
    }
    let cancelled = false
    void Promise.all(
      groupExercises.map(async (exercise) => {
        const rows = await getExerciseHistory(exercise.id, 4)
        const previous = lastPerformed?.get(exercise.id) ?? null
        return {
          exercise,
          previous: previous ? { weightKg: previous.weightKg, reps: previous.reps } : null,
          recommendation: recommendWeight(exercise, rows, exercise.targetReps, now),
        }
      })
    )
      .then((next) => {
        if (!cancelled) setPicks(next)
      })
      // ‏catch: מסד שנסגר תחת המסך דוחה כל שאילתה שהייתה באוויר, וההמלצות
      // הן ליטוש — היעדרן לעולם לא אמור להפיל משהו
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [groupExercises, lastPerformed, now])

  // מסך שנפתח מתוך אימון שהסתיים בינתיים אינו "מתוך אימון" יותר
  useEffect(() => {
    if (origin === 'workout' && !workout) navigate('/', { replace: true })
  }, [origin, workout, navigate])

  const leaveTo = origin === 'workout' ? '/workout' : '/'



  /**
   * בחירת תרגיל = התחלת עבודה. מיד, בלי אישור.
   *
   * שני מסלולים לאותה לחיצה, וההבדל ביניהם הוא רק אם כבר יש אימון: פתיחה של
   * אימון חופשי חדש, או הוספה לתור שרץ ומעבר אליו. שניהם נוחתים על הכרטיס.
   */
  const start = async (exercise: Exercise): Promise<void> => {
    if (busy) return
    // המחווה הזו היא ההזדמנות לפתוח אודיו ב-iOS. חייבת לקדום לכל await.
    unlock()
    setBusy(true)
    try {
      const state = useWorkout.getState()
      if (!state.workout) {
        if ((await state.startWithItems([exercise.id])) === 'busy') {
          toast('יש כבר אימון פתוח — סיים אותו קודם', { tone: 'warn' })
          navigate('/workout')
          return
        }
        navigate('/workout')
        return
      }
      const outcome = await state.addExercise(exercise.id)
      if (outcome === 'failed') {
        toast('לא הצלחתי להוסיף את התרגיל', { tone: 'warn' })
        return
      }
      /*
        גם על `duplicate` עוברים אליו: המשתמש ביקש את התרגיל הזה עכשיו, והוא
        כבר בתור. מעבר אליו הוא בדיוק מה שהלחיצה התכוונה אליו — סירוב שקט
        היה נראה כמו מסך תקוע.
      */
      const key =
        outcome === 'duplicate'
          ? (useWorkout.getState().workout?.queue.find((q) => q.exerciseId === exercise.id)?.key ??
            null)
          : (useWorkout.getState().workout?.queue.at(-1)?.key ?? null)
      if (key) await useWorkout.getState().setCurrent(key)
      navigate('/workout')
    } finally {
      setBusy(false)
    }
  }

  /** "בנה לי אימון" — ארבעה תרגילים לשרירים הטריים, בלחיצה אחת */
  const buildForMe = async (): Promise<void> => {
    if (busy || !rows.length) return
    unlock()
    setBusy(true)
    try {
      const lastAt = new Map<string, number>()
      for (const [id, entry] of lastPerformed ?? []) lastAt.set(id, entry.at)
      const chosen = suggestWorkout(rows, exercises, lastAt, 4, hidden ?? undefined)
      if (!chosen.length) {
        toast('אין תרגילים להציע — אפשר לבחור שריר ידנית', { tone: 'warn' })
        return
      }
      if ((await useWorkout.getState().startWithItems(chosen.map((e) => e.id))) === 'busy') {
        toast('יש כבר אימון פתוח — סיים אותו קודם', { tone: 'warn' })
      }
      navigate('/workout')
    } finally {
      setBusy(false)
    }
  }

  if (!settings) return null

  const fresh = uncoveredGroups(rows)

  // ── פאזה שנייה: רשימת התרגילים של השריר ────────────────────────────────
  if (group !== null) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-lg pb-safe">
        <header className="flex items-center gap-3 px-3.5 pt-safe pb-1">
          <button
            type="button"
            aria-label="חזרה לרשת השרירים"
            onClick={() => setPhase({ group: null })}
            className="relative flex size-[34px] shrink-0 items-center justify-center rounded-[11px] border border-ink-700 bg-ink-900 text-bone-400 after:absolute after:-inset-[5px] after:content-[''] active:bg-ink-800"
          >
            <ChevronRight size={18} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-xl leading-tight font-extrabold text-bone-50">
            {MUSCLE_GROUPS[group].label}
          </h1>
        </header>

        <div className="px-3.5 pt-3">
          {picks.length > 0 ? (
            <ExercisePickList rows={picks} onPick={(e) => void start(e)} />
          ) : groupExercises.length === 0 ? (
            /*
              מצב אמיתי ולא קישוט: בהתקנה נקייה יד אחורית, בטן או אמות יכולות
              להיות ריקות לגמרי, וזה בדיוק המסך שנפגוש שם.
            */
            <div className="mt-4 rounded-[20px] border border-dashed border-ink-700 px-4 py-5 text-center">
              <p className="text-sm leading-snug font-extrabold text-balance text-bone-300">
                אין תרגילים לשריר הזה בספרייה שלך
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-bone-500">
                אפשר להוסיף מהקטלוג, או לבחור שריר אחר.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/builder/${group}`)}
                  className="btn-flame flex h-[46px] flex-1 items-center justify-center rounded-[14px] text-sm"
                >
                  הוסף מהקטלוג
                </button>
                <button
                  type="button"
                  onClick={() => setPhase({ group: null })}
                  className="btn-ghost flex h-[46px] flex-1 items-center justify-center rounded-[14px] text-sm font-bold"
                >
                  שריר אחר
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[7px]" aria-hidden="true">
              {groupExercises.map((e) => (
                <div key={e.id} className="h-[70px] animate-pulse rounded-2xl bg-ink-900/60" />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── פאזה ראשונה: רשת השרירים ───────────────────────────────────────────
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg pb-safe">
      <header className="px-4 pt-safe">
        <div className="flex items-start gap-3">
          <h1 className="min-w-0 flex-1 text-[1.375rem] leading-tight font-extrabold tracking-[-0.02em] text-bone-50">
            אימון חופשי
          </h1>
          <button
            type="button"
            onClick={() => navigate(leaveTo)}
            className="relative shrink-0 px-1.5 py-2 text-[0.8125rem] font-semibold text-bone-500 after:absolute after:inset-x-0 after:-inset-y-[7px] after:content-['']"
          >
            ביטול
          </button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-pretty text-bone-500">
          אין תוכנית להיום. בחר שריר, והתור ייבנה תוך כדי.
        </p>

        <div className="mt-3.5 flex items-center gap-[7px]">
          <span className="shrink-0 text-[0.625rem] leading-none font-bold tracking-[0.12em] text-bone-500">
            מסודר לפי התאוששות
          </span>
          <span className="h-px flex-1 bg-ink-800" aria-hidden="true" />
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="size-[5px] rounded-full bg-pr-400" aria-hidden="true" />
            <span className="text-[0.625rem] leading-none font-bold text-pr-400">טרי</span>
          </span>
        </div>
      </header>

      <div className="px-3.5 pt-3">
        <MuscleGrid rows={rows} onPick={(row) => setPhase({ group: row.group })} />

        {/*
          המסלול השלישי: לא תוכנית, ולא בחירה ידנית. `suggestWorkout` בוחר
          לרוחב — שריר אחד בכל סיבוב — ולכן ארבעת התרגילים אף פעם לא נופלים
          כולם על אותה קבוצה.
        */}
        <button
          type="button"
          disabled={busy || fresh.length === 0}
          onClick={() => void buildForMe()}
          className="mt-3.5 flex w-full items-start gap-3 rounded-2xl border border-dashed border-ink-700 px-3 py-3 text-start active:border-ink-600 disabled:opacity-50"
        >
          <Wand2 size={17} className="mt-0.5 shrink-0 text-bone-400" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-bone-300">אין לך מושג מה לעשות?</span>
            <span className="mt-1 block text-[0.71875rem] leading-relaxed text-bone-500">
              {fresh.length === 0
                ? 'עברת על כל השרירים הטריים — בחר שריר מהרשת.'
                : '"בנה לי אימון" בוחר 4 תרגילים לשרירים הטריים — ואפשר לשנות כל אחד מהם.'}
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
