import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ListOrdered, MessageCircleQuestion, Timer, Trophy } from 'lucide-react'
import { getSettings, saveSettings } from '@/db/db'
import { getBlocks, getExerciseHistory, getFinishedSessions, getRoutines } from '@/db/queries'
import type { DraftSet, ExerciseMetric, WeightMode } from '@/db/types'
import { EmptyState, fireConfetti, toast } from '@/components/ui'
import { Screen } from '@/components/shell/ScreenHeader'
import { VideoPlayer } from '@/components/media/VideoPlayer'
import { openItems, skippedItems, useWorkout } from '@/state/activeWorkoutStore'
import { detachFromPlans, findPlanUsage } from '@/db/catalog'
import type { PlanUsage } from '@/db/catalog'
import { shouldSuggestRemoval } from '@/domain/skipStreak'
import { SkipStreakSheet } from '@/components/workout/SkipStreakSheet'
import { prHeadline } from '@/domain/prs'
import { formatClock, formatSetShort } from '@/domain/units'
import { distinguisher, duplicateNames } from '@/domain/naming'
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

/**
 * "4 סטים · 25×10" לשורה המכווצת, מפורק לשני חלקים.
 * המספרים חייבים להישאר בריצת LTR נפרדת, אחרת 25×10 מתהפך ל-10×25.
 */
function summarize(
  sets: DraftSet[],
  mode: WeightMode,
  metric?: ExerciseMetric
): { count: number; top: string } | null {
  const work = sets.filter((s) => s.type === 'work')
  if (work.length === 0) return null
  // בתרגיל זמן כל הסטים באותו משקל (אפס), ולכן "הסט הטוב" הוא הארוך ביותר
  const better = (a: DraftSet, b: DraftSet): boolean =>
    metric === 'seconds' ? b.reps > a.reps : b.weightKg > a.weightKg
  const top = work.reduce((best, s) => (better(best, s) ? s : best))
  return { count: work.length, top: formatSetShort(top.weightKg, top.reps, mode, metric) }
}

export function WorkoutScreen(): JSX.Element | null {
  const workout = useWorkout((s) => s.workout)
  const exercisesById = useWorkout((s) => s.exercisesById)
  // שני תרגילים בקטלוג נושאים בכוונה אותו שם — בתור הם חייבים להיראות שונים
  const duplicates = useMemo(() => duplicateNames(Object.values(exercisesById)), [exercisesById])
  const hydrated = useWorkout((s) => s.hydrated)
  const setCurrent = useWorkout((s) => s.setCurrent)
  const substitute = useWorkout((s) => s.substitute)
  const rate = useWorkout((s) => s.rate)
  const adjustRest = useWorkout((s) => s.adjustRest)
  const stopRest = useWorkout((s) => s.stopRest)
  const skipItem = useWorkout((s) => s.skipItem)
  const completeCurrent = useWorkout((s) => s.completeCurrent)
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
  /**
   * "סיים תרגיל" כשמתג הדירוג דלוק ואין עדיין דירוג: קודם שאלון, ואז סגירה.
   * הדגל מציין ששאלון הדירוג הפתוח כרגע צריך לסגור את התרגיל כשהוא נסגר.
   */
  const completeAfterRating = useRef(false)
  const activeCardRef = useRef<HTMLDivElement | null>(null)
  /** התרגיל שדילגנו עליו זה עתה ושמוצעת עליו הוצאה מהתוכנית */
  const [streakCandidate, setStreakCandidate] = useState<{
    id: string
    name: string
    usage: PlanUsage[]
  } | null>(null)

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

  /*
    החלפת התרגיל הפעיל מזיזה מאות פיקסלים של תוכן: הכרטיס הישן מתכווץ לשורה
    והחדש נפרש. בלי גלילה מכוונת השורה שנלחצה בורחת מתחת לאצבע והמשתמש מוצא
    את עצמו במקום אקראי. מדלגים על הרינדור הראשון — פתיחת המסך לא צריכה לזוז.
  */
  const currentKey = workout?.currentKey ?? null
  const prevKeyRef = useRef<string | null | undefined>(undefined)
  useLayoutEffect(() => {
    if (prevKeyRef.current === undefined) {
      prevKeyRef.current = currentKey
      return
    }
    if (prevKeyRef.current === currentKey) return
    prevKeyRef.current = currentKey
    /*
      הקריאה אופציונלית על *המתודה* ולא רק על ה-ref.

      ‏`scrollIntoView` פשוט לא קיים ב-jsdom, ו-`?.` על ה-ref בלבד לא מגן
      עליו: ברגע שהכרטיס מחובר, הקריאה זורקת TypeError בתוך useLayoutEffect —
      כלומר שגיאת רינדור שמפילה את כל מסך האימון. זה קרה לסירוגין ולא תמיד,
      כי האפקט יורה רק כשהמפתח הנוכחי מתחלף בזמן שהמסך מורכב (מרוץ בין
      פתיחת האימון לניווט), ולכן זה נראה כמו בדיקה רועדת ולא כמו קריסה.
      גלילה היא ליטוש — היעדרה לעולם לא אמור להפיל מסך.
    */
    activeCardRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
  }, [currentKey])

  /*
    דילוג, ואחריו — רק אם זה הדילוג השלישי ברצף — ההצעה להוציא מהתוכנית.

    הדילוג עצמו קורה קודם ובלי תנאי: הוא הפעולה שהמשתמש ביקש, וההצעה היא
    תוספת שלא מרשה לעצמה לעכב אותה. ההיסטוריה נקראת אחרי הדילוג ובלי await
    לפניו, כדי שלחיצה על "דלג" לא תמתין לשאילתה.
  */
  const handleSkip = useCallback(
    (key: string) => {
      const item = useWorkout.getState().workout?.queue.find((q) => q.key === key)
      void skipItem(key)
      if (!item) return
      /*
        הספירה וההוצאה מדברות על *שורת התוכנית* ולא על התרגיל שעמד במקומה:
        אחרי החלפה, `exerciseId` הוא המחליף — והוצאה שלו הייתה מוחקת אותו
        מכל התוכניות, כולל יום אחר בפיצול שבו הוא דווקא נעשה.
      */
      const plannedId = item.plannedExerciseId
      const exercise = useWorkout.getState().exercisesById[plannedId]
      if (!exercise) return
      void Promise.all([getFinishedSessions(), findPlanUsage(plannedId)])
        .then(([sessions, usage]) => {
          // תרגיל שאינו באף תוכנית — אין מה להוציא, וגיליון שמבטיח הוצאה
          // ואז לא עושה כלום גרוע מלא להציע בכלל
          if (!usage.length) return
          if (shouldSuggestRemoval(plannedId, sessions)) {
            setStreakCandidate({ id: plannedId, name: exercise.name, usage })
          }
        })
        .catch(() => {
          // ההצעה היא תוספת; כישלון קריאה לא אמור להטריד באמצע אימון
        })
    },
    [skipItem]
  )

  /** "סיים תרגיל": כשמתג הדירוג דלוק ויש סטים בלי דירוג — קודם השאלון */
  const handleFinishExercise = useCallback(() => {
    const state = useWorkout.getState()
    const w = state.workout
    const item = w?.queue.find((q) => q.key === w.currentKey)
    if (!w || !item) return
    const hasWork = (w.setsByKey[item.key] ?? []).some((s) => s.type === 'work')
    const hasRating = Boolean(w.ratingsByKey[item.key])
    const askRating = settings?.askRating ?? true
    if (askRating && hasWork && !hasRating) {
      completeAfterRating.current = true
      setSheet('rating')
      return
    }
    void completeCurrent()
  }, [settings?.askRating, completeCurrent])

  /** סגירת שאלון הדירוג — אם הגענו אליו מ"סיים תרגיל", עכשיו סוגרים באמת */
  const closeRating = useCallback(() => {
    setSheet(null)
    if (completeAfterRating.current) {
      completeAfterRating.current = false
      void completeCurrent()
    }
  }, [completeCurrent])

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
  // דילוג מפורש נחשב "טופל" — פס ההתקדמות מודד כמה נשאר להחליט עליו, לא כמה בוצע
  const done = workout.queue.filter((q) => q.status === 'done' || q.status === 'skipped').length
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

      {/*
        שני מתגים של "איזה אימון זה היום": עם/בלי טיימר מנוחה, עם/בלי שאלון
        קושי. הם יושבים כאן ולא רק בהגדרות כי ההחלטה מתקבלת על רצפת חדר הכושר —
        והם נשמרים, כך שהבחירה מחזיקה גם לאימון הבא עד שמשנים אותה.
      */}
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          aria-pressed={settings.restTimerEnabled}
          onClick={() => void saveSettings({ restTimerEnabled: !settings.restTimerEnabled })}
          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-pill border px-3 text-xs font-bold transition-colors ${
            settings.restTimerEnabled
              ? 'border-flame-500/40 bg-flame-500/10 text-flame-300'
              : 'border-ink-700 bg-ink-900/60 text-bone-500'
          }`}
        >
          <Timer size={14} />
          {settings.restTimerEnabled ? 'טיימר מנוחה' : 'טיימר מנוחה כבוי'}
        </button>
        <button
          type="button"
          aria-pressed={settings.askRating}
          onClick={() => void saveSettings({ askRating: !settings.askRating })}
          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-pill border px-3 text-xs font-bold transition-colors ${
            settings.askRating
              ? 'border-flame-500/40 bg-flame-500/10 text-flame-300'
              : 'border-ink-700 bg-ink-900/60 text-bone-500'
          }`}
        >
          <MessageCircleQuestion size={14} />
          {settings.askRating ? 'שאלון קושי' : 'שאלון קושי כבוי'}
        </button>
      </div>

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
                <div
                  key={item.key}
                  ref={activeCardRef}
                  className="animate-rise relative"
                  style={{ scrollMarginTop: 'calc(var(--safe-t) + 4.5rem)' }}
                >
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
                    onFinishExercise={handleFinishExercise}
                    onSkip={() => handleSkip(item.key)}
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
                apart={distinguisher(exercise, duplicates)}
                setCount={sets.length}
                summary={summarize(sets, exercise.weightMode, exercise.metric)}
                onTap={() => void setCurrent(item.key)}
                onSkip={() => handleSkip(item.key)}
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
        onDisable={() => {
          void saveSettings({ restTimerEnabled: false })
          void stopRest()
          toast('טיימר המנוחה כבוי — מדליקים חזרה במתג שבראש מסך האימון')
        }}
        nextLabel={restLabel}
      />

      {activeExercise && (
        <>
          <VideoPlayer
            exerciseId={activeExercise.id}
            libraryId={activeExercise.libraryId}
            exerciseName={activeExercise.name}
            open={videoOpen}
            startOnImage
            onClose={() => setVideoOpen(false)}
          />
          <RatingSheet
            open={sheet === 'rating'}
            onClose={closeRating}
            exercise={activeExercise}
            current={activeItem ? (workout.ratingsByKey[activeItem.key] ?? null) : null}
            askRir={settings.askRir}
            onRate={(rating, rir) => {
              if (activeItem) void rate(activeItem.key, rating, rir)
              closeRating()
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

      <SkipStreakSheet
        open={streakCandidate !== null}
        exerciseName={streakCandidate?.name ?? ''}
        usage={streakCandidate?.usage ?? []}
        onKeep={() => setStreakCandidate(null)}
        onRemove={() => {
          const target = streakCandidate
          setStreakCandidate(null)
          if (!target) return
          void detachFromPlans(target.id)
            .then(() => toast(`${target.name} הוצא מהתוכנית`))
            .catch(() => toast('לא הצלחתי להוציא את התרגיל', { tone: 'warn' }))
        }}
      />

      <FinishSheet
        open={sheet === 'finish'}
        onClose={() => setSheet(null)}
        onConfirm={() => void handleFinish()}
        openItems={openItems(workout)}
        skippedItems={skippedItems(workout)}
        exercisesById={exercisesById}
      />
    </Screen>
  )
}
