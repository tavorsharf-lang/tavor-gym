import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { MessageCircleQuestion, Plus, Timer, Trophy } from 'lucide-react'
import { getSettings, saveSettings } from '@/db/db'
import { getBlocks, getExerciseHistory, getFinishedSessions, getRoutines } from '@/db/queries'
import type { DraftSet, ExerciseMetric, WeightMode } from '@/db/types'
import { EmptyState, fireConfetti, toast } from '@/components/ui'
import { Screen } from '@/components/shell/ScreenHeader'
import { VideoPlayer } from '@/components/media/VideoPlayer'
import { openItems, skippedItems, useWorkout } from '@/state/activeWorkoutStore'
import { detachFromPlans, findPlanUsage } from '@/db/catalog'
import { imageIdOf, primaryImageFor } from '@/db/exerciseImages'
import { loadMapFor } from '@/db/loadMap'
import type { PlanUsage } from '@/db/catalog'
import { shouldSuggestRemoval } from '@/domain/skipStreak'
import { SkipStreakSheet } from '@/components/workout/SkipStreakSheet'
import { prHeadline } from '@/domain/prs'
import { formatRepRange, formatSetShort } from '@/domain/units'
import { distinguisher, duplicateNames } from '@/domain/naming'
import type { ExerciseSessionSummary } from '@/domain/recommendation'
import { useAudioCue } from '@/hooks/useAudioCue'
import { useWakeLock } from '@/hooks/useWakeLock'
import { ElapsedClock } from '@/components/workout/ElapsedClock'
import { ExerciseCard } from '@/components/workout/ExerciseCard'
import { QueueRow } from '@/components/workout/QueueRow'
import { RestOverlay } from '@/components/workout/RestOverlay'
import type { RestFocus } from '@/components/workout/RestOverlay'
import { RatingSheet } from '@/components/workout/RatingSheet'
import { SubstituteSheet } from '@/components/workout/SubstituteSheet'
import { QueueSheet } from '@/components/workout/QueueSheet'
import { AddExerciseSheet } from '@/components/workout/AddExerciseSheet'
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

type SheetName = 'add' | 'finish' | 'queue' | 'rating' | 'substitute'

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

/**
 * מתג "איזה אימון זה היום" — שבב בגובה 28 בשורת פס ההתקדמות.
 *
 * הוויזואל 28 והאצבע 44: הפסאודו שמסביב מרחיב את שטח הלחיצה בלי לגעת בגובה
 * השורה. `aria-pressed` נשאר, כי זה מתג ולא ניווט.
 */
function ModeChip({
  on,
  icon,
  label,
  onToggle,
}: {
  on: boolean
  icon: JSX.Element
  label: string
  onToggle: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={`relative flex h-7 shrink-0 items-center gap-1 rounded-pill border px-2.5 text-[0.625rem] font-extrabold whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] ${
        on
          ? 'border-flame-500/40 bg-flame-500/10 text-flame-300'
          : 'border-ink-700 bg-ink-900 text-bone-500'
      }`}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>
      {label}
    </button>
  )
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
  /**
   * האם מסך המנוחה המלא פרוש.
   *
   * ברירת המחדל אחרי סט היא המנוחה שבתוך הכרטיס, והמסך המלא נפתח רק בלחיצה
   * על המספר. שניהם קוראים את אותה חותמת `restEndsAt` מהחנות — אין כאן שני
   * טיימרים לסנכרן, יש שכבה שנפתחת ונסגרת מעל ספירה אחת.
   */
  const [restFull, setRestFull] = useState(false)
  /**
   * התרגיל שהגלריה מציגה — ולא בוליאני.
   *
   * בזמן מנוחה הפריט שנחים ממנו כבר לא בהכרח הפעיל: אחרי הסט האחרון התור
   * מתקדם, והתמונה שעל מסך המנוחה שייכת לתרגיל שנסגר. גלריה שקשורה תמיד
   * ל-`activeExercise` הייתה פותחת שם את התרגיל *הבא*, כלומר תמונה אחת על
   * המסך ותמונה אחרת מתחת לאצבע.
   */
  const [videoFor, setVideoFor] = useState<{
    id: string
    libraryId?: string
    name: string
  } | null>(null)
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
  /*
    מה שכבר בתור. גיליון ההחלפה מוציא אותם מרשימת המועמדים — אחרת החלפה
    בתרגיל שממתין בתור הייתה מייצרת שתי שורות לאותו תרגיל, בדיוק הכפילות
    שהוספת תרגיל חוסמת.
  */
  const inWorkout = useMemo(
    () => new Set((workout?.queue ?? []).map((q) => q.exerciseId)),
    [workout?.queue]
  )
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

  /*
    כל מנוחה נפתחת מכווצת.

    ‏`restEndsAt === null` בלבד, ולא כל שינוי שלו: `adjustRest` מזיז את החותמת
    בכל לחיצה על ±30, ואיפוס על כל שינוי היה סוגר את המסך המלא מתחת לאצבע
    בדיוק כשמוסיפים שם זמן.
  */
  const restEndsAt = workout?.restEndsAt ?? null
  useEffect(() => {
    if (restEndsAt === null) setRestFull(false)
  }, [restEndsAt])

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
  const activeIndex = workout.queue.findIndex((q) => q.key === workout.currentKey)
  const remaining = total - done - (activeIndex >= 0 ? 1 : 0)

  /*
    מה שהמנוחה שבכרטיס מכריזה עליו כשהיעד של התרגיל הנוכחי הושלם: השורה
    הבאה בתור שעוד לא נסגרה. פריט שדולג או שהסתיים אינו "הבא", גם כשהוא
    יושב בשורה שמתחת.
  */
  const nextItem =
    activeIndex >= 0
      ? (workout.queue
          .slice(activeIndex + 1)
          .find((q) => q.status !== 'done' && q.status !== 'skipped') ?? null)
      : null
  const nextExercise = nextItem ? exercisesById[nextItem.exerciseId] : undefined
  const nextUp =
    nextItem && nextExercise
      ? {
          name: nextExercise.name,
          targetSets: nextItem.targetSets,
          targetReps: formatRepRange(nextItem.targetReps, nextExercise.metric),
        }
      : null

  /** כל מה שאינו הכרטיס הפעיל, בסדר התור, עם התרגיל והסטים שלו */
  const queueRows = workout.queue
    .filter((q) => q.key !== workout.currentKey && exercisesById[q.exerciseId])
    .map((q) => ({
      item: q,
      exercise: exercisesById[q.exerciseId],
      sets: workout.setsByKey[q.key] ?? [],
    }))

  /*
    מה שמסך המנוחה מציג. הכל נגזר כאן ולא בתוך השכבה: התור, הסטים והתרגילים
    כבר יושבים במסך הזה, וחישוב שני שלהם בשכבה היה מקור שני לאותה אמת בדיוק
    בזמן שהמספרים על שני המסכים חייבים להסכים.
  */
  const restItem = workout.queue.find((q) => q.key === workout.restForKey) ?? null
  const restExercise = restItem ? exercisesById[restItem.exerciseId] : undefined
  let restFocus: RestFocus | null = null
  if (restItem && restExercise) {
    const restSets = workout.setsByKey[restItem.key] ?? []
    const image = primaryImageFor(restExercise.id, restExercise.libraryId)
    /*
      התרגיל הבא בתור — הראשון אחרי זה שנחים ממנו שעוד לא נסגר. פריט שדולג
      או שהסתיים אינו "הבא", גם כשהוא יושב בשורה שמתחת.
    */
    const restIndex = workout.queue.findIndex((q) => q.key === restItem.key)
    // מהפריט שנחים ממנו ולא מהפעיל: כשהיעד הושלם התור כבר התקדם, ושני
    // המספרים חייבים לתאר את אותו רגע
    const afterRestItem =
      workout.queue
        .slice(restIndex + 1)
        .find((q) => q.status !== 'done' && q.status !== 'skipped') ?? null
    const afterRestExercise = afterRestItem ? exercisesById[afterRestItem.exerciseId] : undefined

    restFocus = {
      name: restExercise.name,
      image,
      segments: restSets.map((s) => (s.type === 'warmup' ? 'warmup' : 'work')),
      targetSets: restItem.targetSets,
      doneWorkSets: restSets.filter((s) => s.type === 'work').length,
      /*
        טווח החזרות בלבד. משקל ירד מכאן במכוון: המסך הזה נקרא בהצצה של שנייה,
        המספר שקובע לסט הבא כבר יושב גדול על הכרטיס שמאחור, והשורה שנחסכה היא
        מה שמכניס את מפת השרירים לתוך המסך בלי גלילה.
      */
      nextSet: {
        count: formatRepRange(restItem.targetReps, restExercise.metric),
        countLabel: restExercise.metric === 'seconds' ? 'להחזיק' : 'חזרות',
      },
      /*
        האחוזים מגיעים ישירות מ-`loadMapFor` ולא דרך `loadMapForImage`: השער
        שם מחזיק את *שורות* מפת העומס בגלריה עד לאישור הצורה, וזו תצוגה אחרת
        לגמרי — ארבע תמונות בשורה, לא רשימה — שתבור ביקש במפורש עם האחוזים.
      */
      shares: image ? loadMapFor(imageIdOf(image.src)) : [],
      next:
        afterRestItem && afterRestExercise
          ? {
              exerciseId: afterRestExercise.id,
              libraryId: afterRestExercise.libraryId,
              name: afterRestExercise.name,
              targetSets: afterRestItem.targetSets,
            }
          : null,
    }
  }

  return (
    <Screen dock={false}>
      <header
        className="sticky top-0 z-30 -mx-4 mb-1 border-b border-ink-800/70 bg-ink-950/85 px-3.5 pb-2.5 backdrop-blur-xl"
        style={{ paddingTop: 'calc(var(--safe-t) + 0.375rem)' }}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSheet('finish')}
            className="relative shrink-0 px-1.5 py-2 text-[0.84375rem] font-semibold text-bone-500 after:absolute after:inset-x-0 after:-inset-y-[7px] after:content-['']"
          >
            סיים
          </button>

          {/*
            שורה אחת, לא שתיים. הכתובית שהייתה מתחת לשם ("חזה ויד אחורית ·
            כתפיים · אמו...") נחתכה ממילא באמצע מילה, ולכן היא נכנסת לאותה
            שורה אחרי נקודה מפרידה — מי שרוצה את הפירוט המלא רואה אותו ברשימה
            שמתחת, שעכשיו נמצאת על המסך.
          */}
          <p className="min-w-0 flex-1 truncate text-center text-[0.90625rem] font-extrabold text-bone-100">
            {routine ? routine.name : 'אימון חופשי'}
            {subtitle ? ` · ${subtitle}` : ''}
          </p>

          <ElapsedClock startedAt={workout.startedAt} />
          {/*
            ההוספה יושבת בכותרת ולא במזח, ובכוונה רחוק מהכתום של "סיים סט":
            היא הפעולה שהופכת את המסך הזה לבנייה ולא רק לתיעוד, אבל היא
            לעולם לא מתחרה על האגודל מול היעד היחיד של אזור התחתון.
          */}
          <button
            type="button"
            aria-label="הוסף תרגיל לאימון"
            onClick={() => setSheet('add')}
            className="relative flex size-[34px] shrink-0 items-center justify-center rounded-[11px] border border-ink-700 bg-ink-900 text-bone-500 after:absolute after:-inset-[5px] after:content-[''] active:bg-ink-800"
          >
            <Plus size={18} />
          </button>
        </div>

        {/*
          פס ההתקדמות ושני המתגים באותה שורה.

          המתגים ("איזה אימון זה היום": עם/בלי טיימר, עם/בלי שאלון קושי) ירדו
          משורה משלהם בגובה 44 לשני שבבים בגובה 28 — הם החלטה שמתקבלת פעם
          באימון, ו-88 פיקסלים קבועים בשבילה היו באים על חשבון הכפתור הכתום.
          שטח הלחיצה נשאר 44 דרך הפסאודו שמסביבם.
        */}
        <div className="mt-2.5 flex items-center gap-2">
          <div
            className="flex h-[5px] min-w-0 flex-1 gap-1"
            role="img"
            aria-label={`${done} מתוך ${total} תרגילים`}
          >
            {workout.queue.map((q) => (
              <span
                key={q.key}
                className={`flex-1 rounded-[3px] ${
                  q.status === 'done' || q.status === 'skipped'
                    ? 'bg-pr-400/50'
                    : q.key === workout.currentKey
                      ? 'bg-linear-to-l from-flame-500 to-flame-300'
                      : 'bg-ink-800'
                }`}
              />
            ))}
          </div>
          <span className="shrink-0 text-[0.625rem] leading-none font-bold tracking-[0.04em] whitespace-nowrap text-bone-500">
            {activeIndex >= 0 ? `תרגיל ${activeIndex + 1} מתוך ${total}` : `${total} תרגילים`}
          </span>
          <ModeChip
            on={settings.restTimerEnabled}
            icon={<Timer size={11} />}
            label={settings.restTimerEnabled ? 'מנוחה' : 'מנוחה כבויה'}
            onToggle={() => void saveSettings({ restTimerEnabled: !settings.restTimerEnabled })}
          />
          <ModeChip
            on={settings.askRating}
            icon={<MessageCircleQuestion size={11} />}
            label={settings.askRating ? 'קושי' : 'קושי כבוי'}
            onToggle={() => void saveSettings({ askRating: !settings.askRating })}
          />
        </div>
      </header>

      {total === 0 ? (
        <EmptyState
          title="אין תרגילים באימון הזה"
          hint="אפשר להוסיף תרגיל עכשיו, או פשוט לסיים ולהתחיל אימון אחר."
          action={
            <button
              type="button"
              onClick={() => setSheet('add')}
              className="flex min-h-13 items-center gap-2 rounded-pill border border-flame-500/40 bg-flame-500/12 px-5 text-sm font-bold text-flame-300"
            >
              <Plus size={18} />
              הוסף תרגיל
            </button>
          }
        />
      ) : (
        <>
          {activeItem && activeExercise && (
            <div
              ref={activeCardRef}
              className="animate-rise relative mt-2.5"
              style={{ scrollMarginTop: 'calc(var(--safe-t) + 4.5rem)' }}
            >
              {banner && (
                <div className="animate-stamp pointer-events-none absolute inset-x-4 -top-2 z-20 flex items-center justify-center gap-2 rounded-pill border border-pr-400/40 bg-ink-950/95 px-4 py-2 text-sm font-extrabold text-pr-400 shadow-lg">
                  <Trophy size={16} />
                  {banner}
                </div>
              )}
              <ExerciseCard
                key={activeItem.key}
                item={activeItem}
                exercise={activeExercise}
                sets={workout.setsByKey[activeItem.key] ?? []}
                rating={workout.ratingsByKey[activeItem.key] ?? null}
                onOpenVideo={() =>
                  setVideoFor({
                    id: activeExercise.id,
                    libraryId: activeExercise.libraryId,
                    name: activeExercise.name,
                  })
                }
                onOpenSubstitute={() => setSheet('substitute')}
                onOpenRating={() => setSheet('rating')}
                onFinishExercise={handleFinishExercise}
                onSkip={() => handleSkip(activeItem.key)}
                settings={settings}
                history={historyFor === activeItem.exerciseId ? history : []}
                audio={audio}
                onLogged={celebrate}
                rest={
                  workout.restEndsAt !== null
                    ? { endsAt: workout.restEndsAt, totalSeconds: workout.restTotalSeconds }
                    : null
                }
                onOpenFullRest={() => setRestFull(true)}
                onAdjustRest={(delta) => void adjustRest(delta)}
                onStopRest={() => void stopRest()}
                nextUp={nextUp}
              />
            </div>
          )}

          {/*
            הרשימה. מאז שהכרטיס הפעיל נכנס למסך אחד היא נראית באמת, וזה מה
            שהופך אותה למסלול הראשי אל התור במקום לגיליון: נגיעה בשורה מעבירה
            את האימון לתרגיל שבה.

            כותרת הספירה היא כפתור, כי סידור מחדש של התור עדיין חי בגיליון
            ואין לו דלת אחרת מאז שהאייקון ירד מהכותרת.
          */}
          {queueRows.length > 0 && (
            <>
              <div className="mt-3.5 flex items-center justify-between gap-2 px-1">
                <span className="text-[0.625rem] leading-none font-bold tracking-[0.12em] text-bone-500">
                  הבאים בתור
                </span>
                <button
                  type="button"
                  onClick={() => setSheet('queue')}
                  className="relative text-[0.65625rem] leading-none font-semibold text-bone-500 after:absolute after:inset-x-0 after:-inset-y-[17px] after:content-['']"
                >
                  {done > 0 ? `${done} הושלמו · ` : ''}
                  {remaining > 0 ? `נשארו ${remaining}` : 'זה האחרון'}
                </button>
              </div>

              <div className="mt-2.5 flex flex-col gap-1.5">
                {queueRows.map(({ item, exercise, sets }) => (
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
                ))}
              </div>
            </>
          )}

          {workout.currentKey === null && (
            <p className="card mt-2.5 px-4 py-5 text-center text-sm font-semibold text-bone-400">
              כל התרגילים סומנו כהושלמו. אפשר לפתוח תרגיל מהתור, או לסגור את האימון.
            </p>
          )}
        </>
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

      {/*
        מסך המנוחה המלא. הוא **מורכב תמיד** כשיש מנוחה, גם כשהוא מכווץ, כי הוא
        הבעלים היחיד של הצליל ושל ההבזק — ומנוחה שנוחה בתוך הכרטיס חייבת
        להיגמר באותו cue בדיוק. `collapsed` הוא רק שאלה של מה מצויר.
      */}
      <RestOverlay
        endsAt={workout.restEndsAt}
        totalSeconds={workout.restTotalSeconds}
        collapsed={!restFull}
        onCollapse={() => setRestFull(false)}
        onOpenVideo={
          restExercise
            ? () =>
                setVideoFor({
                  id: restExercise.id,
                  libraryId: restExercise.libraryId,
                  name: restExercise.name,
                })
            : undefined
        }
        audio={audio}
        onAdjust={(delta) => void adjustRest(delta)}
        onStartSet={() => {
          setRestFull(false)
          void stopRest()
        }}
        onDisable={() => {
          setRestFull(false)
          void saveSettings({ restTimerEnabled: false })
          void stopRest()
          toast('טיימר המנוחה כבוי — מדליקים חזרה במתג שבראש מסך האימון')
        }}
        focus={restFocus}
        startedAt={workout.startedAt}
        onAddExercise={() => setSheet('add')}
        onFinishWorkout={() => setSheet('finish')}
      />

      {/*
        הגלריה נפתחת מעל הכל — גם מעל מסך המנוחה — ולכן היא אחרונה ב-JSX:
        שני פורטלים באותו z-index, והאחרון ב-DOM הוא שלמעלה. היא גם מורכבת
        רק כשצריך אותה, וכך המיקום שלה בערימה נקבע ברגע הפתיחה.
      */}
      {videoFor && (
        <VideoPlayer
          key={videoFor.id}
          exerciseId={videoFor.id}
          libraryId={videoFor.libraryId}
          exerciseName={videoFor.name}
          open
          startOnImage
          onClose={() => setVideoFor(null)}
        />
      )}

      {activeExercise && (
        <>
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
            inWorkout={inWorkout}
            onPick={(exerciseId, reason) => {
              if (activeItem) void substitute(activeItem.key, exerciseId, reason)
              setSheet(null)
            }}
          />
        </>
      )}

      {/*
        שני גיליונות אחים ולא מקוננים. סדר האימון ובורר התרגילים הם שתי
        שאלות שונות — "באיזה סדר" מול "מה בכלל" — ובגיליון אחד בתוך השני
        הסגירה של הפנימי הייתה מחזירה למצב שממנו כבר לא רואים את התור.
      */}
      <QueueSheet
        open={sheet === 'queue'}
        onClose={() => setSheet(null)}
        onAddExercise={() => setSheet('add')}
      />

      <AddExerciseSheet open={sheet === 'add'} onClose={() => setSheet(null)} />

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
