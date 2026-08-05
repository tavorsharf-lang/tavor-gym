import { useCallback, useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ListOrdered, Trophy } from 'lucide-react'
import { getSettings } from '@/db/db'
import { getBlocks, getExerciseHistory, getRoutines } from '@/db/queries'
import type { DraftSet, WeightMode } from '@/db/types'
import { EmptyState, fireConfetti, toast } from '@/components/ui'
import { Screen } from '@/components/shell/ScreenHeader'
import { VideoPlayer } from '@/components/media/VideoPlayer'
import { openItems, useWorkout } from '@/state/activeWorkoutStore'
import { prHeadline } from '@/domain/prs'
import { formatClock, formatSetShort } from '@/domain/units'
import type { ExerciseSessionSummary } from '@/domain/recommendation'
import { useNow } from '@/hooks/useNow'
import { useAudioCue } from '@/hooks/useAudioCue'
import { useWakeLock } from '@/hooks/useWakeLock'
import { ExerciseCard } from '@/components/workout/ExerciseCard'
import { QueueRow } from '@/components/workout/QueueRow'
import { RestOverlay } from '@/components/workout/RestOverlay'
import { RatingSheet } from '@/components/workout/RatingSheet'
import { SubstituteSheet } from '@/components/workout/SubstituteSheet'
import { QueueSheet } from '@/components/workout/QueueSheet'
import { FinishSheet } from '@/components/workout/FinishSheet'

/**
 * מסך האימון.
 *
 * הוא מופעל ביד אחת, מיוזעת, באמצע סט. שלוש החלטות נגזרות מזה:
 *   • התרגיל הפעיל פרוש במלואו וכל השאר מכווץ לשורה — אין גלילה מיותרת.
 *   • "סיים אימון" יושב בסוף התוכן ולא כמזח קבוע, כדי שלא יתחרה על האגודל
 *     מול הכפתור הכתום של "סיים סט". הכפתור הכתום הוא היעד היחיד באזור הזה.
 *   • המצב מגיע מ-Zustand ולא מ-useLiveQuery: טבלת האימון הפעיל נכתבת אחרי
 *     כל נגיעה, והאזנה אליה הייתה מרנדרת את המסך בלי סוף.
 */

type SheetName = 'finish' | 'queue' | 'rating' | 'substitute'

/**
 * שעון האימון. יושב ברכיב נפרד בכוונה — כך הטיק של כל שנייה מרנדר מחדש
 * שורה אחת ולא את כרטיס התרגיל וכל התור.
 */
function ElapsedClock({ startedAt }: { startedAt: number }): JSX.Element {
  const now = useNow(1000)
  return (
    <span dir="ltr" className="tnum text-sm font-bold text-bone-300">
      {formatClock(Math.max(0, (now - startedAt) / 1000))}
    </span>
  )
}

/** "4 סטים · 25×10" — הסט הכבד ביותר מייצג את השורה המכווצת */
function summarize(sets: DraftSet[], mode: WeightMode): string {
  const work = sets.filter((s) => s.type === 'work')
  if (work.length === 0) return ''
  const top = work.reduce((best, s) => (s.weightKg > best.weightKg ? s : best))
  return `${work.length} סטים · ${formatSetShort(top.weightKg, top.reps, mode)}`
}

export function WorkoutScreen(): JSX.Element | null {
  const workout = useWorkout((s) => s.workout)
  const exercisesById = useWorkout((s) => s.exercisesById)
  const hydrated = useWorkout((s) => s.hydrated)
  const setCurrent = useWorkout((s) => s.setCurrent)
  const substitute = useWorkout((s) => s.substitute)
  const rate = useWorkout((s) => s.rate)
  const adjustRest = useWorkout((s) => s.adjustRest)
  const stopRest = useWorkout((s) => s.stopRest)
  const finish = useWorkout((s) => s.finish)

  const settings = useLiveQuery(() => getSettings(), [])
  const routines = useLiveQuery(() => getRoutines(), [])
  const blocks = useLiveQuery(() => getBlocks(), [])

  const audio = useAudioCue(settings?.soundEnabled ?? true, settings?.soundVolume ?? 0.8)
  const wakeLock = useWakeLock(settings?.wakeLockEnabled ?? true)

  const [sheet, setSheet] = useState<SheetName | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [finishedId, setFinishedId] = useState<string | null>(null)
  const [history, setHistory] = useState<ExerciseSessionSummary[]>([])
  const [historyFor, setHistoryFor] = useState<string | null>(null)

  const bannerTimer = useRef<number | null>(null)
  const wakeToasted = useRef(false)

  const activeItem = workout?.queue.find((q) => q.key === workout.currentKey) ?? null
  const activeExercise = activeItem ? (exercisesById[activeItem.exerciseId] ?? null) : null
  const activeExerciseId = activeItem?.exerciseId ?? null

  // ההיסטוריה נטענת רק לתרגיל הפעיל — היא לא משתנה תוך כדי אימון, ולכן
  // useEffect פשוט ולא useLiveQuery.
  useEffect(() => {
    if (!activeExerciseId) {
      setHistory([])
      setHistoryFor(null)
      return
    }
    let cancelled = false
    void getExerciseHistory(activeExerciseId).then((rows) => {
      if (cancelled) return
      setHistory(rows)
      setHistoryFor(activeExerciseId)
    })
    return () => {
      cancelled = true
    }
  }, [activeExerciseId])

  useEffect(() => {
    if (!wakeLock.error || wakeToasted.current) return
    wakeToasted.current = true
    toast(wakeLock.error, { tone: 'warn' })
  }, [wakeLock.error])

  // התאוששות מקריסה מחזירה מסך אימון בלי שהייתה מחווה שפותחת אודיו ב-iOS.
  // הנגיעה הראשונה במסך היא ההזדמנות לפתוח אותו, אחרת הטיימר יישאר אילם.
  useEffect(() => {
    if (audio.isUnlocked) return
    const onFirstTouch = () => audio.unlock()
    document.addEventListener('pointerdown', onFirstTouch, { once: true })
    return () => document.removeEventListener('pointerdown', onFirstTouch)
  }, [audio])

  useEffect(() => {
    return () => {
      if (bannerTimer.current !== null) window.clearTimeout(bannerTimer.current)
    }
  }, [])

  const confettiEnabled = settings?.confettiEnabled ?? true

  /** מרוקן את תור השיאים אחרי סט. תמיד מתוך מטפל אירוע, לעולם לא ברינדור. */
  const celebrate = useCallback(() => {
    const events = useWorkout.getState().drainPrEvents()
    if (events.length === 0) return
    const byId = useWorkout.getState().exercisesById

    let headline: string | null = null
    for (const event of events) {
      const exercise = byId[event.exerciseId]
      if (!exercise) continue
      const text = prHeadline(exercise, event)
      headline ??= text
      if (confettiEnabled) fireConfetti('big')
      toast(text, { tone: 'success' })
    }
    if (headline === null) return

    audio.beep('pr')
    setBanner(headline)
    if (bannerTimer.current !== null) window.clearTimeout(bannerTimer.current)
    // ארוך יחסית בכוונה: מסך המנוחה עולה באותו רגע ומסתיר את הכרטיס,
    // והבאנר צריך לשרוד גם דילוג מהיר על המנוחה
    bannerTimer.current = window.setTimeout(() => setBanner(null), 8000)
  }, [audio, confettiEnabled])

  const handleFinish = useCallback(async () => {
    try {
      const id = await finish()
      setSheet(null)
      // הניווט נעשה דרך רינדור ולא דרך navigate(), כדי שהמצב הריק שנוצר
      // באותו רגע לא יקפיץ קודם למסך הבית.
      setFinishedId(id)
    } catch {
      toast('לא הצלחתי לסגור את האימון — הסטים שמורים, אפשר לנסות שוב', { tone: 'warn' })
    }
  }, [finish])

  if (!workout) {
    if (finishedId !== null) return <Navigate to={`/summary/${finishedId}`} replace />
    if (hydrated) return <Navigate to="/" replace />
    return null
  }
  if (!settings) return null

  const routine = routines?.find((r) => r.id === workout.routineId) ?? null
  const blockNames = (blocks ?? [])
    .filter((b) => workout.blockIds.includes(b.id))
    .map((b) => b.name)
  const subtitle = [routine?.subtitle, ...blockNames].filter(Boolean).join(' · ')

  const total = workout.queue.length
  const done = workout.queue.filter((q) => q.status === 'done').length
  const progress = total > 0 ? (done / total) * 100 : 0

  const restItem = workout.queue.find((q) => q.key === workout.restForKey) ?? null
  const restExercise = restItem ? exercisesById[restItem.exerciseId] : undefined
  let restLabel: string | undefined
  if (restItem && restExercise) {
    const workDone = (workout.setsByKey[restItem.key] ?? []).filter((s) => s.type === 'work').length
    restLabel =
      workDone < restItem.targetSets
        ? `הסט הבא: ${workDone + 1} מתוך ${restItem.targetSets} · ${restExercise.name}`
        : `סיימת את ${restExercise.name}`
  }

  return (
    <Screen dock={false}>
      <header
        className="sticky top-0 z-30 -mx-4 mb-3 border-b border-ink-800/70 bg-ink-950/85 px-3 backdrop-blur-xl"
        style={{ paddingTop: 'calc(var(--safe-t) + 0.5rem)' }}
      >
        <div className="flex items-center gap-1 pb-2">
          <button
            type="button"
            onClick={() => setSheet('finish')}
            className="flex min-h-12 shrink-0 items-center rounded-xl px-3 text-sm font-bold text-bone-400 active:bg-ink-800"
          >
            סיים
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-extrabold text-bone-50">
              {routine ? routine.name : 'אימון חופשי'}
            </p>
            {subtitle && <p className="truncate text-[0.6875rem] text-bone-500">{subtitle}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <ElapsedClock startedAt={workout.startedAt} />
            <button
              type="button"
              aria-label="תור התרגילים"
              onClick={() => setSheet('queue')}
              className="flex size-12 items-center justify-center rounded-full text-bone-400 active:bg-ink-800"
            >
              <ListOrdered size={20} />
            </button>
          </div>
        </div>

        <div className="-mx-3 h-[3px] bg-ink-800" role="img" aria-label={`${done} מתוך ${total} תרגילים`}>
          <div
            className="h-full bg-linear-to-l from-flame-500 to-flame-400 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {total === 0 ? (
        <EmptyState
          title="אין תרגילים באימון הזה"
          hint="אפשר להוסיף תרגיל מתוך התור, או פשוט לסיים ולהתחיל אימון אחר."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {workout.queue.map((item) => {
            const exercise = exercisesById[item.exerciseId]
            if (!exercise) return null
            const sets = workout.setsByKey[item.key] ?? []

            if (item.key === workout.currentKey) {
              return (
                <div key={item.key} className="animate-rise relative">
                  {banner && (
                    <div className="animate-stamp pointer-events-none absolute inset-x-4 -top-2 z-20 flex items-center justify-center gap-2 rounded-pill border border-pr-400/40 bg-ink-950/95 px-4 py-2 text-sm font-extrabold text-pr-400 shadow-lg">
                      <Trophy size={16} />
                      {banner}
                    </div>
                  )}
                  <ExerciseCard
                    item={item}
                    exercise={exercise}
                    sets={sets}
                    rating={workout.ratingsByKey[item.key] ?? null}
                    onOpenVideo={() => setVideoOpen(true)}
                    onOpenSubstitute={() => setSheet('substitute')}
                    onOpenRating={() => setSheet('rating')}
                    settings={settings}
                    history={historyFor === item.exerciseId ? history : []}
                    audio={audio}
                    onLogged={celebrate}
                  />
                </div>
              )
            }

            return (
              <QueueRow
                key={item.key}
                item={item}
                exercise={exercise}
                setCount={sets.length}
                summary={summarize(sets, exercise.weightMode)}
                onTap={() => void setCurrent(item.key)}
              />
            )
          })}

          {workout.currentKey === null && (
            <p className="card px-4 py-5 text-center text-sm font-semibold text-bone-400">
              כל התרגילים סומנו כהושלמו. אפשר לפתוח תרגיל מהתור, או לסגור את האימון.
            </p>
          )}
        </div>
      )}

      {/* המזח: כפתור אחד שקט בסוף התוכן, הרחק מהכתום של "סיים סט" */}
      <div className="mt-6 pb-safe">
        <button
          type="button"
          onClick={() => setSheet('finish')}
          className="btn-ghost flex min-h-15 w-full items-center justify-center rounded-card text-base font-bold"
        >
          סיים אימון
        </button>
      </div>

      <RestOverlay
        endsAt={workout.restEndsAt}
        totalSeconds={workout.restTotalSeconds}
        audio={audio}
        onAdjust={(delta) => void adjustRest(delta)}
        onSkip={() => void stopRest()}
        nextLabel={restLabel}
      />

      {activeExercise && (
        <>
          <VideoPlayer
            exerciseId={activeExercise.id}
            exerciseName={activeExercise.name}
            open={videoOpen}
            onClose={() => setVideoOpen(false)}
          />
          <RatingSheet
            open={sheet === 'rating'}
            onClose={() => setSheet(null)}
            exercise={activeExercise}
            current={activeItem ? (workout.ratingsByKey[activeItem.key] ?? null) : null}
            askRir={settings.askRir}
            onRate={(rating, rir) => {
              if (activeItem) void rate(activeItem.key, rating, rir)
              setSheet(null)
            }}
          />
          <SubstituteSheet
            open={sheet === 'substitute'}
            onClose={() => setSheet(null)}
            exercise={activeExercise}
            onPick={(exerciseId, reason) => {
              if (activeItem) void substitute(activeItem.key, exerciseId, reason)
              setSheet(null)
            }}
          />
        </>
      )}

      <QueueSheet open={sheet === 'queue'} onClose={() => setSheet(null)} />

      <FinishSheet
        open={sheet === 'finish'}
        onClose={() => setSheet(null)}
        onConfirm={() => void handleFinish()}
        openItems={openItems(workout)}
        exercisesById={exercisesById}
      />
    </Screen>
  )
}
