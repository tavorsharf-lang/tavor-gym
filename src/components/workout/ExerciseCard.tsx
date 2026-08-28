import { useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Check, ChevronDown, Clock, Minus, NotebookPen, Plus, Repeat, SkipForward, Timer } from 'lucide-react'
import type {
  AppSettings,
  DraftSet,
  Exercise,
  QueueItem,
  Rating,
  Rir,
  SetType,
} from '@/db/types'
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, RATING_LABELS } from '@/db/types'
import { BottomSheet, Button, PlateProgress, Stepper } from '@/components/ui'
import type { PlateSegState } from '@/components/ui'
import { ExerciseThumb } from '@/components/media/ExerciseThumb'
import { touchedGroups, useWorkout } from '@/state/activeWorkoutStore'
import type { ExerciseSessionSummary } from '@/domain/recommendation'
import { lastSessionSetsText, lastWorkedSession, recommendWeight } from '@/domain/recommendation'
import { suggestWarmup } from '@/domain/warmup'
import {
  countLabel,
  countStep,
  formatClock,
  formatRatingText,
  formatRepRange,
  formatWeight,
  round2,
  weightStep,
} from '@/domain/units'
import { workSets } from '@/domain/volume'
import { formatRelativeDay } from '@/lib/dates'
import type { AudioCue } from '@/hooks/useAudioCue'
import { SetRow } from './SetRow'
import { RecommendationChip } from './RecommendationChip'
import { PlateHint } from './PlateHint'
import { PlateChips } from './PlateChips'
import { RepChips } from './RepChips'
import { HoldOverlay } from './HoldOverlay'

/**
 * הכרטיס של התרגיל הפעיל — המסך שבו נמצאים באמת באמצע אימון.
 *
 * הסדר קבוע ולא משתנה בין תרגילים, כי היד לומדת אותו: מה עושים, איך עושים,
 * מה עשיתי פעם קודמת, כמה להרים היום, מה כבר תיעדתי, ומה מתעד עכשיו.
 * הכפתור הכתום היחיד בכרטיס הוא "סיים סט", והוא גדול בכוונה.
 */

export interface ExerciseCardProps {
  item: QueueItem
  exercise: Exercise
  sets: DraftSet[]
  rating: { rating: Rating; rir: Rir | null } | null
  onOpenVideo: () => void
  onOpenSubstitute: () => void
  onOpenRating: () => void
  /**
   * "סיים תרגיל" — עובר דרך המסך ולא ישר ל-store, כי כשמתג הדירוג דלוק
   * המסך פותח קודם את שאלון "איך היה" ורק אחרי המענה סוגר את התרגיל.
   */
  onFinishExercise: () => void
  /**
   * "דלג היום" — גם הוא עובר דרך המסך, כי אחרי הדילוג השלישי ברצף הוא
   * מציע להוציא את התרגיל מהתוכנית, וזו החלטה שדורשת את ההיסטוריה.
   */
  onSkip: () => void
  settings: AppSettings
  history: ExerciseSessionSummary[]
  /** מופע האודיו של המסך — חייב להיות אותו הקשר שנפתח במחוות המשתמש */
  audio: AudioCue
  /** נקרא אחרי כל סט שנשמר, כדי שהמסך ירוקן את תור השיאים ויחגוג */
  onLogged: () => void
}

/** עורך סט קיים. חי בגיליון נפרד כדי שהמספרים הגדולים לא ידחפו את הכרטיס */
function SetEditor({
  set,
  exercise,
  onSave,
}: {
  set: DraftSet
  exercise: Exercise
  onSave: (weightKg: number, reps: number) => void
}): JSX.Element {
  const [weightKg, setWeightKg] = useState(set.weightKg)
  const [reps, setReps] = useState(set.reps)
  const step = weightStep(exercise)

  return (
    <div className="flex flex-col gap-4 pt-1 pb-4">
      {exercise.weightMode !== 'bodyweight' && (
        <Stepper
          label="משקל"
          unit={exercise.weightMode === 'perSide' ? 'ק״ג לכל צד' : 'ק״ג'}
          value={weightKg}
          onChange={setWeightKg}
          step={step}
          min={0}
        />
      )}
      <Stepper
        label={countLabel(exercise.metric)}
        unit={exercise.metric === 'seconds' ? 'שניות' : 'חזרות'}
        value={reps}
        onChange={setReps}
        step={countStep(exercise.metric)}
        min={0}
      />
      <Button variant="flame" size="lg" fullWidth onClick={() => onSave(weightKg, reps)}>
        שמור שינוי
      </Button>
    </div>
  )
}

/**
 * כוונון היעד באמצע אימון — כמה סטים וכמה מנוחה.
 *
 * שני מספרים שהתשובה עליהם משתנה בתוך האימון עצמו ("היום יש לי כוח לעוד סט",
 * "המכונה תפוסה, אני מקצר מנוחה"), ולכן הם צריכים להיות במרחק נגיעה מהכפתור
 * הכתום ולא בעורך התוכניות. השינוי חל על האימון הזה בלבד.
 */
function TuneRow({
  targetSets,
  restSeconds,
  doneWorkSets,
  onSets,
  onRest,
}: {
  targetSets: number
  restSeconds: number
  /** אי אפשר לרדת מתחת למה שכבר בוצע — זה היה מוחק את הסטים מהמסך */
  doneWorkSets: number
  onSets: (next: number) => void
  onRest: (next: number) => void
}): JSX.Element {
  const cell =
    'flex flex-1 items-center justify-between gap-1 rounded-xl border border-ink-700 bg-ink-900/50 px-1.5 py-1.5'
  const nudge =
    'flex size-11 shrink-0 items-center justify-center rounded-lg text-bone-300 active:bg-ink-700 disabled:opacity-30'

  return (
    <div className="mt-3 flex gap-2">
      <div className={cell}>
        {/* dir=ltr על צמד הכפתורים בלבד — מינוס משמאל ופלוס מימין, כמו בכל
            שאר הפקדים באפליקציה, כדי שהאצבע לא תצטרך ללמוד שני כיוונים */}
        <button
          type="button"
          aria-label="סט אחד פחות"
          disabled={targetSets <= Math.max(1, doneWorkSets)}
          onClick={() => onSets(targetSets - 1)}
          className={nudge}
        >
          <Minus size={16} strokeWidth={3} />
        </button>
        <span className="flex min-w-0 flex-col items-center leading-tight">
          <span className="tnum text-sm font-extrabold text-bone-100">{targetSets}</span>
          <span className="text-[0.625rem] font-medium text-bone-500">סטים</span>
        </span>
        <button
          type="button"
          aria-label="סט אחד יותר"
          onClick={() => onSets(targetSets + 1)}
          className={nudge}
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>

      <div className={cell}>
        <button
          type="button"
          aria-label="פחות 15 שניות מנוחה"
          disabled={restSeconds <= 0}
          onClick={() => onRest(restSeconds - 15)}
          className={nudge}
        >
          <Minus size={16} strokeWidth={3} />
        </button>
        <span className="flex min-w-0 flex-col items-center leading-tight">
          <span dir="ltr" className="tnum text-sm font-extrabold text-bone-100">
            {restSeconds > 0 ? formatClock(restSeconds) : '—'}
          </span>
          <span className="flex items-center gap-0.5 text-[0.625rem] font-medium text-bone-500">
            <Timer size={9} aria-hidden="true" />
            מנוחה
          </span>
        </span>
        <button
          type="button"
          aria-label="עוד 15 שניות מנוחה"
          onClick={() => onRest(restSeconds + 15)}
          className={nudge}
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}

export function ExerciseCard({
  item,
  exercise,
  sets,
  rating,
  onOpenVideo,
  onOpenSubstitute,
  onOpenRating,
  onFinishExercise,
  onSkip,
  settings,
  history,
  audio,
  onLogged,
}: ExerciseCardProps): JSX.Element {
  const logSet = useWorkout((s) => s.logSet)
  const updateSet = useWorkout((s) => s.updateSet)
  const toggleSetType = useWorkout((s) => s.toggleSetType)
  const removeSet = useWorkout((s) => s.removeSet)
  const startRest = useWorkout((s) => s.startRest)
  const deferItem = useWorkout((s) => s.deferItem)
  const markWarmupOffered = useWorkout((s) => s.markWarmupOffered)
  const setTargetSets = useWorkout((s) => s.setTargetSets)
  const setItemRest = useWorkout((s) => s.setItemRest)
  const saveNote = useWorkout((s) => s.saveNote)
  const workout = useWorkout((s) => s.workout)
  const exercisesById = useWorkout((s) => s.exercisesById)
  const prCache = useWorkout((s) => s.prCache)

  /*
    "עכשיו" נלכד פעם אחת לכל כרטיס. ההמלצה משתמשת בו רק כדי למדוד *ימים* מאז
    האימון האחרון בתרגיל, ולכן ערך שמתעדכן כל שנייה היה מרנדר את מסך האימון
    בלי שום תמורה. הכרטיס ממילא מקבל key לפי פריט התור.
  */
  const [now] = useState(() => Date.now())
  const [isWarmup, setIsWarmup] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<DraftSet | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [holdOpen, setHoldOpen] = useState(false)

  const bodyweight = exercise.weightMode === 'bodyweight'
  const timed = exercise.metric === 'seconds'
  const workCount = sets.filter((s) => s.type === 'work').length
  const lastWork = [...sets].reverse().find((s) => s.type === 'work') ?? null

  // הטווח שבתוכנית הוא הקובע, לא זה שבקטלוג — הוא גם מה שמוצג על הכרטיס.
  // וכשלתוכנית יש משקל התחלה משלה (תוכנית חזרה), הוא גובר על זה שבקטלוג.
  const recommendation = useMemo(
    () =>
      recommendWeight(
        item.startWeightKg === null
          ? exercise
          : { ...exercise, seedWeightKg: item.startWeightKg },
        history,
        item.targetReps,
        now
      ),
    [exercise, history, item.targetReps, item.startWeightKg, now]
  )

  // אותו סינון שמנוע ההמלצות עושה: אימון שהיה בו רק חימום אינו "פעם קודמת"
  const previous = lastWorkedSession(history)
  const previousWork = previous ? workSets(previous.sets) : []
  // בתרגיל זמן כל הסטים נשמרים במשקל אפס, ולכן השוואת משקל הייתה מחזירה תמיד
  // את הסט הראשון — והשדה היה נפתח על 0:45 כשהפעם הקודמת הסתיימה ב-1:15
  const previousTop =
    previousWork.length > 0
      ? previousWork.reduce((best, s) =>
          timed ? (s.reps > best.reps ? s : best) : s.weightKg > best.weightKg ? s : best
        )
      : null

  /*
    סדר ההעדפות למשקל שבשדה: מה שהרמתי לפני רגע, אחר כך המשקל שבוצע *בפועל*
    בסט הכבד של הפעם הקודמת, ורק אז ההמלצה. ההמלצה היא הצעה לשינוי ולכן היא
    לא ממלאת את השדה לבד — היא במרחק לחיצה אחת בשבב שמעל. משקל ההתחלה של
    התוכנית קודם לזה שבקטלוג, וזה מה שמאפשר לתוכנית חזרה להתחיל קל.
  */
  const seedWeight =
    lastWork?.weightKg ??
    previousTop?.weightKg ??
    recommendation.weightKg ??
    item.startWeightKg ??
    exercise.seedWeightKg ??
    0
  /*
    שדה הספירה נפתח תמיד על אותו מספר, ולא על מה שנרשם בסט הקודם:
      • תרגיל חזרות — ברירת המחדל שבהגדרות (6). זו נקודת פתיחה קבועה שממנה
        מסמנים כמה באמת יצאו, ולא גרירה של הסט הקודם שצריך לזכור לתקן.
      • תרגיל זמן — היעד עצמו. פלאנק נכנסים אליו מול שעון, ו"6 שניות" זו לא
        הצעה אלא טעות.
    היעד עצמו נמדד תמיד מול הטווח של *התוכנית* (item), לא של הקטלוג.
  */
  const fallbackCount = timed ? item.targetReps.min : settings.defaultReps
  const seedReps = fallbackCount

  const [entry, setEntry] = useState(() => ({ weightKg: seedWeight, reps: seedReps }))
  // חתימה של מקורות ברירת המחדל. משתנה כשנרשם סט או כשההיסטוריה הגיעה מהמסד,
  // ואז השדות נטענים מחדש — אבל עריכה ידנית בין לבין נשמרת.
  const seedSig = `${item.key}|${sets.length}|${lastWork?.logId ?? 0}|${lastWork?.weightKg ?? 0}|${
    recommendation.weightKg ?? 0
  }|${previousTop?.weightKg ?? 0}|${fallbackCount}`
  const [seenSig, setSeenSig] = useState(seedSig)
  if (seenSig !== seedSig) {
    setSeenSig(seedSig)
    setEntry({ weightKg: seedWeight, reps: seedReps })
  }

  // דגשי ביצוע פתוחים עד הסט הראשון, ואז נסגרים פעם אחת ומשאירים את ההחלטה
  // למשתמש. הכרטיס ממילא מקבל key לפי פריט התור, ולכן זה מתאפס בכל תרגיל.
  const [cuesOpen, setCuesOpen] = useState(sets.length === 0)
  const autoCollapsed = useRef(sets.length > 0)
  if (!autoCollapsed.current && sets.length > 0) {
    autoCollapsed.current = true
    setCuesOpen(false)
  }

  const autoRated = useRef(false)

  const groups = touchedGroups(workout, exercisesById)
  const warmupPlan = suggestWarmup({
    exercise,
    touchedGroups: groups,
    plannedWeightKg: recommendation.weightKg ?? previousTop?.weightKg ?? exercise.seedWeightKg,
    enabled: settings.autoWarmup,
    percent: settings.warmupPercent,
  })
  /*
    השלב הבא ברמפה. תרגיל כבד מקבל שלושה סטים עולים, וכל סט חימום שנרשם מקדם
    את ההצעה — כך ההצעה תמיד מדברת על מה שעכשיו ולא על מה שכבר עשית.
  */
  const warmupDone = sets.filter((s) => s.type === 'warmup').length
  const warmupSuggestion = warmupPlan[warmupDone] ?? null

  // שיא שנרשם באימון הזה מסומן לפי רגע הסט — הרשומה נשמרת עם אותה חותמת
  const prStamps = new Set(
    prCache.filter((p) => p.exerciseId === exercise.id).map((p) => p.achievedAt)
  )

  const segments: PlateSegState[] = sets.map((s) => (s.type === 'warmup' ? 'warmup' : 'work'))

  const commitSet = async (type: SetType, weightKg: number, reps: number): Promise<void> => {
    if (busy || reps <= 0) return
    setBusy(true)
    try {
      await logSet(item.key, type, weightKg, reps)
      audio.keepAlive()
      // 0 הוא בחירה מפורשת של "בלי מנוחה" (סופרסט, תרגיל סיום) ולא ערך חסר,
      // ולכן ההשוואה היא מול undefined ולא מול falsy
      const base = Number.isFinite(item.restSeconds)
        ? item.restSeconds
        : settings.defaultRestSeconds
      // חימום הוא לא סט כבד — חצי מנוחה מספיקה ושומרת על קצב
      const rest = type === 'warmup' ? Math.round(base * 0.5) : base
      // מי שמתעד מנוחה בשעון כיבה את הטיימר — הסט נרשם, המסך לא קופץ
      if (rest > 0 && settings.restTimerEnabled) await startRest(item.key, rest)
      setIsWarmup(false)
      onLogged()
      if (
        settings.askRating &&
        type === 'work' &&
        workCount + 1 >= item.targetSets &&
        !rating &&
        !autoRated.current
      ) {
        autoRated.current = true
        onOpenRating()
      }
    } finally {
      setBusy(false)
    }
  }

  const heroLabel = isWarmup
    ? 'סיים סט חימום'
    : workCount + 1 === item.targetSets
      ? 'סיים סט אחרון'
      : 'סיים סט'

  const setLine =
    workCount < item.targetSets
      ? `סט ${workCount + 1} מתוך ${item.targetSets}`
      : `סט ${workCount + 1} — מעבר ליעד ${item.targetSets}`

  let workNumber = 0

  return (
    <article
      className={`card card-active relative p-4 ${
        item.status === 'deferred' ? 'border-dashed border-flame-500/45' : ''
      }`}
    >
      {/* 1 — מי אני, מה היעד, וכמה כבר עשיתי */}
      <div className="flex items-start gap-3">
        <ExerciseThumb
          exerciseId={exercise.id}
          libraryId={exercise.libraryId}
          onOpen={onOpenVideo}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl leading-tight font-extrabold text-bone-50">{exercise.name}</h2>
          <p className="meta mt-1 truncate">
            {exercise.subTarget} · {MUSCLE_GROUPS[exercise.muscleGroup].label} ·{' '}
            {EQUIPMENT_LABELS[exercise.equipment]}
          </p>
          <p className="mt-1.5 text-sm font-bold text-flame-400">
            {setLine}
            <span className="ms-2 text-xs font-medium text-bone-500">
              {/* אי LTR: בלי זה "8–12" מוצג כ-"12–8" ונקרא כטווח יורד */}
              <span dir="ltr" className="tnum">
                {formatRepRange(item.targetReps, exercise.metric)}
              </span>{' '}
              {timed ? 'להחזיק' : 'חזרות'}
            </span>
          </p>
        </div>
      </div>

      <PlateProgress className="mt-3" total={item.targetSets} states={segments} />

      <TuneRow
        targetSets={item.targetSets}
        restSeconds={item.restSeconds}
        doneWorkSets={workCount}
        onSets={(next) => void setTargetSets(item.key, next)}
        onRest={(next) => void setItemRest(item.key, next)}
      />

      {item.status === 'deferred' && (
        <p className="mt-3 inline-flex rounded-pill border border-dashed border-flame-500/45 px-3 py-1 text-[0.6875rem] font-bold text-flame-400">
          ממתין — המתקן היה תפוס
        </p>
      )}

      {/* 2 — דגשי ביצוע */}
      {exercise.cues.length > 0 && (
        <div className="mt-4 rounded-card border border-ink-700 bg-ink-900/50">
          <button
            type="button"
            onClick={() => setCuesOpen((v) => !v)}
            aria-expanded={cuesOpen}
            className="flex min-h-12 w-full items-center justify-between gap-2 px-3 text-start"
          >
            <span className="text-xs font-extrabold tracking-wide text-bone-300">דגשי ביצוע</span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-bone-500 transition-transform ${cuesOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {cuesOpen && (
            <ul className="animate-fade flex flex-col gap-1.5 px-3 pt-0.5 pb-3">
              {exercise.cues.map((cue) => (
                <li key={cue} className="flex gap-2 text-[0.8125rem] leading-snug text-bone-200">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-flame-500" />
                  {cue}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 2.5 — ההערה שלי על המכונה הזו */}
      <button
        type="button"
        onClick={() => {
          setNoteDraft(exercise.personalNote ?? '')
          setNoteOpen(true)
        }}
        className={`mt-3 flex w-full items-start gap-2 rounded-card border px-3 py-2.5 text-start ${
          exercise.personalNote
            ? 'border-flame-500/25 bg-flame-500/[0.06]'
            : 'border-dashed border-ink-700'
        }`}
      >
        <NotebookPen
          size={14}
          className={`mt-0.5 shrink-0 ${exercise.personalNote ? 'text-flame-400' : 'text-bone-600'}`}
          aria-hidden="true"
        />
        <span
          className={`min-w-0 flex-1 text-[0.8125rem] leading-snug ${
            exercise.personalNote ? 'font-semibold text-bone-100' : 'text-bone-500'
          }`}
        >
          {exercise.personalNote || 'הערה למכונה הזו — גובה מושב, מה כאב, מה לזכור'}
        </span>
      </button>

      {/* 3 — פעם קודמת */}
      <div className="mt-3">
        <p className="meta">פעם קודמת</p>
        {previous && previousWork.length > 0 ? (
          <p className="mt-1 text-sm font-semibold text-bone-200">
            <span dir="ltr" className="tnum">
              {lastSessionSetsText(previous, exercise.weightMode, exercise.metric)}
            </span>
            <span className="text-bone-500">
              {previous.rating ? ` · ${RATING_LABELS[previous.rating.rating]}` : ''}
              {` · ${formatRelativeDay(previous.startedAt)}`}
            </span>
          </p>
        ) : (
          <p className="mt-1 text-sm font-semibold text-bone-400">
            אין נתונים קודמים — הסט הזה קובע את הבסיס
          </p>
        )}
      </div>

      {/* 4 — כמה להרים היום */}
      <RecommendationChip
        recommendation={recommendation}
        exercise={exercise}
        onApply={(weightKg) => setEntry((e) => ({ ...e, weightKg }))}
        onApplyCount={(reps) => setEntry((e) => ({ ...e, reps }))}
      />

      {/* 5 — מה כבר תועד */}
      {sets.length > 0 && (
        <ul key={sets.length} className="animate-exhale mt-3 flex flex-col gap-1.5">
          {sets.map((s) => {
            if (s.type === 'work') workNumber += 1
            return (
              <SetRow
                key={s.logId}
                index={workNumber}
                set={s}
                exercise={exercise}
                isPr={prStamps.has(s.completedAt)}
                onEdit={() => setEditing(s)}
                onToggleType={() => void toggleSetType(item.key, s.logId)}
                onDelete={() => void removeSet(item.key, s.logId)}
              />
            )
          })}
        </ul>
      )}

      {/* 6 — הצעת חימום, פעם אחת לכל קבוצת שריר */}
      {warmupSuggestion && !item.warmupOffered && (
        <div className="mt-3 rounded-card border border-dashed border-warmup-400/45 bg-warmup-400/[0.06] p-3">
          <p className="text-[0.8125rem] font-bold text-warmup-400">{warmupSuggestion.reason}</p>
          <p className="tnum mt-0.5 text-sm font-semibold text-bone-200">
            {formatWeight(warmupSuggestion.weightKg, exercise.weightMode)} ×{' '}
            {timed ? formatClock(warmupSuggestion.reps) : warmupSuggestion.reps}
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button
              size="sm"
              className="flex-1 border-warmup-400/40 text-warmup-400"
              disabled={busy}
              onClick={() => {
                // ברמפה לא מסמנים "הוצע" — השלב הבא צריך להופיע אחרי הסט הזה
                if (warmupDone + 1 >= warmupPlan.length) void markWarmupOffered(item.key)
                void commitSet('warmup', warmupSuggestion.weightKg, warmupSuggestion.reps)
              }}
            >
              הוסף
            </Button>
            <Button
              size="sm"
              variant="quiet"
              className="flex-1"
              onClick={() => void markWarmupOffered(item.key)}
            >
              לא צריך
            </Button>
          </div>
        </div>
      )}

      {/* 7 — הזנת הסט */}
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsWarmup((v) => !v)}
            aria-pressed={isWarmup}
            className={`flex min-h-12 items-center rounded-pill border px-4 text-sm font-extrabold transition-colors ${
              isWarmup
                ? 'border-warmup-400/60 bg-warmup-400/15 text-warmup-400'
                : 'border-ink-700 bg-ink-800 text-bone-400'
            }`}
          >
            חימום
          </button>
          {isWarmup && (
            <span className="text-[0.6875rem] leading-snug font-medium text-warmup-400">
              לא נספר בנפח, בשיאים ובהמלצות
            </span>
          )}
        </div>

        {/*
          שני מסלולי הזנה שונים לשני סוגי ציוד. במכונת פינים המספר על המדבקה
          הוא האמת ומקלידים אותו; במוט ובמזחלת סופרים פלטות בזמן שמעמיסים.
          שדה המשקל זהה בשניהם — מה שמשתנה זה מה עומד לידו.
        */}
        {/*
          שדה מתחת לשדה, ולא שניים בשורה. בעמודה של חצי כרטיס שני כפתורי ה-+/-
          בולעים את כל הרוחב והמספר נמעך לפס דק — בדיוק ה"אני לא רואה כמה ק״ג
          וכמה חזרות" שהפריסה הזו באה לתקן. השדות האלה הם הפעולה של המסך.
        */}
        <div className="mt-3 flex flex-col gap-4">
          {!bodyweight && (
            <div>
              <Stepper
                label="משקל"
                unit={exercise.weightMode === 'perSide' ? 'ק״ג לכל צד' : 'ק״ג'}
                value={entry.weightKg}
                onChange={(weightKg) => setEntry((e) => ({ ...e, weightKg }))}
                step={weightStep(exercise)}
                min={0}
                hint={
                  exercise.usesPlates
                    ? undefined
                    : 'אפשר להקליד בדיוק את המספר שכתוב על המכונה'
                }
              />
              {exercise.usesPlates ? (
                <PlateChips
                  exercise={exercise}
                  plates={settings.plates}
                  onAdd={(deltaKg) =>
                    setEntry((e) => ({ ...e, weightKg: round2(e.weightKg + deltaKg) }))
                  }
                  onReset={() =>
                    setEntry((e) => ({
                      ...e,
                      weightKg:
                        exercise.weightMode === 'perSide'
                          ? 0
                          : (exercise.barWeightKg ?? settings.plates.barWeightKg),
                    }))
                  }
                />
              ) : null}
              {/* 8 — מה להעמיס על כל צד */}
              <PlateHint targetKg={entry.weightKg} exercise={exercise} plates={settings.plates} />
            </div>
          )}
          <div>
            {/*
              בתרגיל זמן הסטופר הוא המסלול הראשי: מודדים על המסך במקום לנחש
              מול שעון. הוא רושם את הסט בעצמו בעצירה — השדה למטה נשאר למי
              שמדד בדרך אחרת ומקליד תוצאה.
            */}
            {timed && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  audio.keepAlive()
                  setHoldOpen(true)
                }}
                className="mb-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-card border border-flame-500/40 bg-flame-500/10 text-base font-extrabold text-flame-300 active:bg-flame-500/20"
              >
                <Timer size={20} />
                מדוד עם סטופר — היעד {formatClock(item.targetReps.min)}
              </button>
            )}
            <Stepper
              label={countLabel(exercise.metric)}
              unit={timed ? 'שניות' : 'חזרות'}
              value={entry.reps}
              onChange={(reps) => setEntry((e) => ({ ...e, reps }))}
              step={countStep(exercise.metric)}
              min={0}
              hint={timed ? `היעד ${formatClock(item.targetReps.min)}` : undefined}
            />
            {!timed && (
              <RepChips
                value={entry.reps}
                targetReps={item.targetReps}
                fallback={fallbackCount}
                onPick={(reps) => setEntry((e) => ({ ...e, reps }))}
              />
            )}
          </div>
        </div>
      </div>

      {/* 9 — הפעולה הראשית. כפתור אחד, ענק, במקום קבוע בכל תרגיל */}
      <button
        type="button"
        disabled={busy || entry.reps <= 0}
        onClick={() => void commitSet(isWarmup ? 'warmup' : 'work', entry.weightKg, entry.reps)}
        className="btn-flame mt-4 flex min-h-[4.5rem] w-full items-center justify-center rounded-card text-2xl font-extrabold [-webkit-touch-callout:none] disabled:opacity-40 disabled:shadow-none disabled:[filter:none] disabled:[transform:none]"
      >
        {heroLabel}
      </button>

      {/* 10 — פעולות משניות. אייקון מעל תווית, כדי שהתווית לא תיחתך */}
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void deferItem(item.key)}
          className="btn-ghost flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.6875rem] font-bold"
        >
          <Clock size={16} className="text-flame-400" />
          המתקן תפוס
        </button>
        <button
          type="button"
          onClick={onOpenSubstitute}
          className="btn-ghost flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.6875rem] font-bold"
        >
          <Repeat size={16} className="text-bone-400" />
          החלף תרגיל
        </button>
        {/* דילוג קיים רק לפני הסט הראשון — אחרי שיש סטים הסגירה היא "סיים תרגיל" */}
        {sets.length === 0 && (
          <button
            type="button"
            onClick={onSkip}
            className="btn-ghost flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.6875rem] font-bold"
          >
            <SkipForward size={16} className="text-bone-500" />
            דלג היום
          </button>
        )}
        <button
          type="button"
          onClick={onFinishExercise}
          className={`btn-ghost flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.6875rem] font-bold ${
            sets.length === 0 ? '' : 'col-span-2'
          }`}
        >
          <Check size={16} className="text-pr-400" />
          סיים תרגיל
        </button>
      </div>

      {/* 11 — דירוג קיים, בלחיצה אפשר לשנות */}
      {rating && (
        <button
          type="button"
          onClick={onOpenRating}
          className="mt-2.5 flex min-h-12 w-full items-center justify-center gap-2 rounded-pill border border-ink-700 bg-ink-900/60 px-4 text-sm font-bold text-bone-300"
        >
          <span>הרגיש {formatRatingText(rating.rating, rating.rir)}</span>
        </button>
      )}

      <BottomSheet open={noteOpen} onClose={() => setNoteOpen(false)} title="הערה לתרגיל">
        <div className="flex flex-col gap-3 pt-1 pb-4">
          <p className="text-sm leading-relaxed text-bone-400">
            מה שכדאי לזכור על המכונה הזו בפעם הבאה. נשמר על התרגיל, לא על האימון.
          </p>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={3}
            autoFocus
            placeholder="מושב בגובה 4, ידיות במצב 2"
            className="w-full resize-none rounded-2xl border border-ink-700 bg-ink-850 p-3 leading-relaxed text-bone-50 placeholder:text-bone-500 focus:border-flame-500/50 focus:outline-none"
          />
          <Button
            variant="flame"
            size="lg"
            fullWidth
            onClick={() => {
              void saveNote(exercise.id, noteDraft)
              setNoteOpen(false)
            }}
          >
            שמור
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={editing !== null} onClose={() => setEditing(null)} title="עריכת סט">
        {editing && (
          <SetEditor
            key={editing.logId}
            set={editing}
            exercise={exercise}
            onSave={(weightKg, reps) => {
              void updateSet(item.key, editing.logId, weightKg, reps)
              setEditing(null)
            }}
          />
        )}
      </BottomSheet>

      {timed && (
        <HoldOverlay
          open={holdOpen}
          targetSeconds={item.targetReps.min}
          exerciseName={exercise.name}
          audio={audio}
          onClose={() => setHoldOpen(false)}
          onSave={(elapsed) => {
            // הסטופר נסגר לפני הרישום: commitSet פותח את מסך המנוחה, ושני
            // פורטלים על אותו z-index נלחמים זה בזה
            setHoldOpen(false)
            void commitSet(isWarmup ? 'warmup' : 'work', entry.weightKg, elapsed)
          }}
        />
      )}
    </article>
  )
}
