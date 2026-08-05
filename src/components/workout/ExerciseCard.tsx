import { useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Check, ChevronDown, Clock, Repeat } from 'lucide-react'
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
import { VideoThumb } from '@/components/media/VideoThumb'
import { touchedGroups, useWorkout } from '@/state/activeWorkoutStore'
import type { ExerciseSessionSummary } from '@/domain/recommendation'
import { lastSessionSetsText, lastWorkedSession, recommendWeight } from '@/domain/recommendation'
import { suggestWarmup } from '@/domain/warmup'
import { formatRatingText, formatRepRange, formatWeight, weightStep } from '@/domain/units'
import { workSets } from '@/domain/volume'
import { formatRelativeDay } from '@/lib/dates'
import type { AudioCue } from '@/hooks/useAudioCue'
import { SetRow } from './SetRow'
import { RecommendationChip } from './RecommendationChip'
import { PlateHint } from './PlateHint'

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
          suffix={exercise.weightMode === 'perSide' ? 'ק״ג לכל צד' : 'ק״ג'}
          value={weightKg}
          onChange={setWeightKg}
          step={step}
          min={0}
        />
      )}
      <Stepper label="חזרות" value={reps} onChange={setReps} step={1} min={0} />
      <Button variant="flame" size="lg" fullWidth onClick={() => onSave(weightKg, reps)}>
        שמור שינוי
      </Button>
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
  const completeCurrent = useWorkout((s) => s.completeCurrent)
  const markWarmupOffered = useWorkout((s) => s.markWarmupOffered)
  const workout = useWorkout((s) => s.workout)
  const exercisesById = useWorkout((s) => s.exercisesById)
  const prCache = useWorkout((s) => s.prCache)

  const [isWarmup, setIsWarmup] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<DraftSet | null>(null)

  const bodyweight = exercise.weightMode === 'bodyweight'
  const workCount = sets.filter((s) => s.type === 'work').length
  const lastWork = [...sets].reverse().find((s) => s.type === 'work') ?? null

  // הטווח שבתוכנית הוא הקובע, לא זה שבקטלוג — הוא גם מה שמוצג על הכרטיס
  const recommendation = useMemo(
    () => recommendWeight(exercise, history, item.targetReps),
    [exercise, history, item.targetReps]
  )

  // אותו סינון שמנוע ההמלצות עושה: אימון שהיה בו רק חימום אינו "פעם קודמת"
  const previous = lastWorkedSession(history)
  const previousWork = previous ? workSets(previous.sets) : []
  const previousTop =
    previousWork.length > 0
      ? previousWork.reduce((best, s) => (s.weightKg > best.weightKg ? s : best))
      : null

  // סדר ההעדפות למספרים שבשדות: מה שהרמתי לפני רגע, אחר כך ההמלצה,
  // אחר כך הסט הכבד של הפעם הקודמת, ורק בסוף משקל הזריעה.
  const seedWeight =
    lastWork?.weightKg ??
    recommendation.weightKg ??
    previousTop?.weightKg ??
    exercise.seedWeightKg ??
    0
  const seedReps = lastWork?.reps ?? previousTop?.reps ?? exercise.targetReps.max

  const [entry, setEntry] = useState(() => ({ weightKg: seedWeight, reps: seedReps }))
  // חתימה של מקורות ברירת המחדל. משתנה כשנרשם סט או כשההיסטוריה הגיעה מהמסד,
  // ואז השדות נטענים מחדש — אבל עריכה ידנית בין לבין נשמרת.
  const seedSig = `${item.key}|${sets.length}|${lastWork?.logId ?? 0}|${lastWork?.weightKg ?? 0}|${
    lastWork?.reps ?? 0
  }|${recommendation.weightKg ?? 0}|${previousTop?.weightKg ?? 0}`
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
  const warmupSuggestion = suggestWarmup({
    exercise,
    touchedGroups: groups,
    plannedWeightKg: recommendation.weightKg ?? previousTop?.weightKg ?? exercise.seedWeightKg,
    enabled: settings.autoWarmup,
    percent: settings.warmupPercent,
  })

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
      const base = item.restSeconds || settings.defaultRestSeconds
      // חימום הוא לא סט כבד — חצי מנוחה מספיקה ושומרת על קצב
      await startRest(item.key, type === 'warmup' ? Math.round(base * 0.5) : base)
      setIsWarmup(false)
      onLogged()
      if (type === 'work' && workCount + 1 >= item.targetSets && !rating && !autoRated.current) {
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
        <VideoThumb exerciseId={exercise.id} onOpen={onOpenVideo} />
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
                {formatRepRange(item.targetReps)}
              </span>{' '}
              חזרות
            </span>
          </p>
        </div>
      </div>

      <PlateProgress className="mt-3" total={item.targetSets} states={segments} />

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

      {/* 3 — פעם קודמת */}
      <div className="mt-3">
        <p className="meta">פעם קודמת</p>
        {previous && previousWork.length > 0 ? (
          <p className="mt-1 text-sm font-semibold text-bone-200">
            <span dir="ltr" className="tnum">
              {lastSessionSetsText(previous, exercise.weightMode)}
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
            {formatWeight(warmupSuggestion.weightKg, exercise.weightMode)} × {warmupSuggestion.reps}
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button
              size="sm"
              className="flex-1 border-warmup-400/40 text-warmup-400"
              disabled={busy}
              onClick={() => {
                void markWarmupOffered(item.key)
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

        <div className={`mt-3 grid gap-3 ${bodyweight ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!bodyweight && (
            <div>
              <Stepper
                label="משקל"
                suffix={exercise.weightMode === 'perSide' ? 'ק״ג לכל צד' : 'ק״ג'}
                value={entry.weightKg}
                onChange={(weightKg) => setEntry((e) => ({ ...e, weightKg }))}
                step={weightStep(exercise)}
                min={0}
              />
              {/* 8 — מה להעמיס על כל צד */}
              <PlateHint targetKg={entry.weightKg} exercise={exercise} plates={settings.plates} />
            </div>
          )}
          <Stepper
            label="חזרות"
            value={entry.reps}
            onChange={(reps) => setEntry((e) => ({ ...e, reps }))}
            step={1}
            min={0}
          />
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
      <div className="mt-2.5 grid grid-cols-3 gap-2">
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
        <button
          type="button"
          onClick={() => void completeCurrent()}
          className="btn-ghost flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.6875rem] font-bold"
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
    </article>
  )
}
