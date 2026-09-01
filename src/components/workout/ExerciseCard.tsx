import { useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { ChevronDown, Ellipsis, Timer } from 'lucide-react'
import type {
  AppSettings,
  DraftSet,
  Exercise,
  QueueItem,
  Rating,
  Rir,
  SetType,
} from '@/db/types'
import { EQUIPMENT_LABELS } from '@/db/types'
import { BottomSheet, Button, PlateProgress, Stepper } from '@/components/ui'
import type { PlateSegState } from '@/components/ui'
import { ExerciseThumb } from '@/components/media/ExerciseThumb'
import { touchedGroups, useWorkout } from '@/state/activeWorkoutStore'
import type { ExerciseSessionSummary } from '@/domain/recommendation'
import { lastWorkedSession, recommendWeight } from '@/domain/recommendation'
import { suggestWarmup } from '@/domain/warmup'
import {
  countLabel,
  countStep,
  formatClock,
  formatKg,
  formatRatingText,
  formatRepRange,
  formatSetShort,
  formatWeight,
  repMarks,
  round2,
  weightStep,
} from '@/domain/units'
import { workSets } from '@/domain/volume'
import type { AudioCue } from '@/hooks/useAudioCue'
import { SetRow } from './SetRow'
import { PlateChips } from './PlateChips'
import { PlateHint } from './PlateHint'
import { HoldOverlay } from './HoldOverlay'
import { ValueChips } from './ValueChips'
import type { ValueChip } from './ValueChips'
import { SetTuner } from './SetTuner'
import { InlineRest } from './InlineRest'
import { RateStage, RirStage } from './RateStage'
import { ExerciseActionsSheet } from './ExerciseActionsSheet'

/**
 * הכרטיס של התרגיל הפעיל — המסך שבו נמצאים באמת באמצע אימון.
 *
 * הוא בנוי **לפי זמן ולא לפי רשימה**, וזה כל ההבדל מהגרסה שקדמה לו. שם ישבו
 * אחד־עשר מקטעים בטור אחד, הכרטיס היה שני מסכים וחצי של גלילה, והכפתור הכתום
 * נפל מתחת לקו הקיפול. כאן:
 *
 *   • **בזמן סט** צריך שלושה דברים בלבד: מה אני עושה, מה אני רושם, וכפתור אחד.
 *   • **קדם־סט** — דגשים, הערה, חימום, כמה סטים — מתקפל לפס אחד או לגיליון.
 *   • **אחרי־סט** — מנוחה ודירוג מאמץ — נכנס לאותו אזור פיזי בדיוק, בגובה
 *     קבוע, במקום לפתוח מסך חדש או לדחוף את הכרטיס למטה.
 *
 * הלב הוא הבמה: אזור אחד בגובה 196 פיקסלים עם ארבעה מצבים (`work` · `rest` ·
 * `rate` · `rir`). **כלום סביבו לא זז במעבר ביניהם** — לא הכרטיס, לא התור
 * שמתחתיו, ולא האצבע שמחכה על הכפתור.
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
  /** מה שמוצג בבמה כשהמנוחה רצה. null = אין מנוחה כרגע */
  rest: { endsAt: number; totalSeconds: number } | null
  /** פותח את מסך המנוחה המלא על אותו טיימר בדיוק */
  onOpenFullRest: () => void
  onAdjustRest: (deltaSeconds: number) => void
  onStopRest: () => void
  /** התרגיל שמחכה בתור אחרי זה — מה שהמנוחה מכריזה עליו כשהיעד הושלם */
  nextUp: { name: string; targetSets: number; targetReps: string } | null
}

/** עורך סט קיים. חי בגיליון נפרד כדי שהמספרים הגדולים לא ידחפו את הכרטיס */
function SetEditor({
  set,
  exercise,
  plates,
  onSave,
}: {
  set: DraftSet
  exercise: Exercise
  plates: AppSettings['plates']
  onSave: (weightKg: number, reps: number) => void
}): JSX.Element {
  const [weightKg, setWeightKg] = useState(set.weightKg)
  const [reps, setReps] = useState(set.reps)
  const step = weightStep(exercise)

  return (
    <div className="flex flex-col gap-4 pt-1 pb-4">
      {exercise.weightMode !== 'bodyweight' && (
        <div>
          <Stepper
            label="משקל"
            unit={exercise.weightMode === 'perSide' ? 'ק״ג לכל צד' : 'ק״ג'}
            value={weightKg}
            onChange={setWeightKg}
            step={step}
            min={0}
          />
          {/*
            שני הכיוונים של אותה שאלה, וזה בדיוק למה שניהם כאן ולא על הכרטיס:
            ‏`PlateChips` סופר פלטות אל תוך המספר ("הנחתי עוד 20"), ו-`PlateHint`
            מפרק את המספר חזרה לפלטות ("על כל צד: 20+10"). שניהם ארבע-חמש מילים
            צפופות שנקראות ליד המוט, וכל שורה על הבמה נמדדת מול הכפתור הכתום.
            הגיליון הזה הוא המקום שבו מקלידים משקל בשקט.
          */}
          <PlateChips
            exercise={exercise}
            plates={plates}
            onAdd={(deltaKg) => setWeightKg((w) => round2(w + deltaKg))}
            onReset={() =>
              setWeightKg(
                exercise.weightMode === 'perSide'
                  ? 0
                  : (exercise.barWeightKg ?? plates.barWeightKg)
              )
            }
          />
          <PlateHint targetKg={weightKg} exercise={exercise} plates={plates} />
        </div>
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
  rest,
  onOpenFullRest,
  onAdjustRest,
  onStopRest,
  nextUp,
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
  const rate = useWorkout((s) => s.rate)
  const completeCurrent = useWorkout((s) => s.completeCurrent)
  const workout = useWorkout((s) => s.workout)
  const exercisesById = useWorkout((s) => s.exercisesById)
  const prCache = useWorkout((s) => s.prCache)

  /*
    "עכשיו" נלכד פעם אחת לכל כרטיס. ההמלצה משתמשת בו רק כדי למדוד *ימים* מאז
    האימון האחרון בתרגיל, ולכן ערך שמתעדכן כל שנייה היה מרנדר את מסך האימון
    בלי שום תמורה. הכרטיס ממילא מקבל key לפי פריט התור.
  */
  const [now] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<DraftSet | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [holdOpen, setHoldOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const bodyweight = exercise.weightMode === 'bodyweight'
  const timed = exercise.metric === 'seconds'
  const workCount = sets.filter((s) => s.type === 'work').length
  const lastWork = [...sets].reverse().find((s) => s.type === 'work') ?? null

  /*
    ── מצב הבמה ──

    ‏`rest` נגזר מהחנות ולא נשמר כאן: הטיימר שורד רענון, קריסה ומעבר מסך, ומצב
    מקומי שמנסה לשקף אותו היה יכול להתפצל ממנו. `rate`/`rir` דווקא מקומיים —
    הם חיים רק בין הסט האחרון לתשובה, ואין להם מה לשרוד.
  */
  const [stage, setStage] = useState<'work' | 'rate' | 'rir'>('work')
  const [pendingRating, setPendingRating] = useState<Rating | null>(null)
  /** האריח שהשבבים מדברים עליו */
  const [field, setField] = useState<'weight' | 'reps'>(
    bodyweight || timed ? 'reps' : 'weight'
  )
  const [tuneOpen, setTuneOpen] = useState(false)

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
    לא ממלאת את השדה לבד — היא במרחק לחיצה אחת בשבב שמתחת. משקל ההתחלה של
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

  // דגשי ביצוע סגורים תמיד בהתחלה — המונה שעל הפס מספר שהם קיימים, ומי
  // שרוצה לקרוא פותח. הכרטיס ממילא מקבל key לפי פריט התור.
  const [cuesOpen, setCuesOpen] = useState(false)

  /*
    משקל העבודה שהחימום נגזר ממנו.

    שדה ההזנה נכנס אחרון בכוונה. כל עוד יש המלצה או היסטוריה ההצעה יציבה ולא
    רצה עם הסטפר; אבל בתרגיל חדש לגמרי — בלי היסטוריה ובלי משקל זריעה, כלומר
    כל תרגיל בהתקנה טרייה — הוא מה שמאפשר לכפתור החימום להופיע בכלל, ברגע
    שנקבע משקל.

    והנעילה: אחרי סט חימום שדה המשקל מתאפס (סט חימום אינו "הסט הקודם"), ובלעדיה
    הכפתור היה נעלם בדיוק אחרי השלב הראשון ברמפה — הכשל שהוא בא למנוע. הכרטיס
    ממילא מקבל key לפי פריט התור, ולכן הנעילה מתה עם המעבר לתרגיל הבא.
  */
  const knownPlanned =
    recommendation.weightKg ??
    previousTop?.weightKg ??
    exercise.seedWeightKg ??
    (entry.weightKg > 0 ? entry.weightKg : null)
  const lastPlanned = useRef<number | null>(null)
  if (knownPlanned !== null) lastPlanned.current = knownPlanned

  const groups = touchedGroups(workout, exercisesById)
  const warmupPlan = suggestWarmup({
    exercise,
    touchedGroups: groups,
    plannedWeightKg: knownPlanned ?? lastPlanned.current,
    enabled: settings.autoWarmup,
    percent: settings.warmupPercent,
  })
  /*
    השלב הבא ברמפה. תרגיל כבד מקבל שלושה סטים עולים, וכל סט חימום שנרשם מקדם
    את ההצעה — כך ההצעה תמיד מדברת על מה שעכשיו ולא על מה שכבר עשית.
  */
  const warmupDone = sets.filter((s) => s.type === 'warmup').length
  const warmupSuggestion = warmupPlan[warmupDone] ?? null
  /*
    מה שהכפתור ירשום. אחרי שהרמפה נגמרה אין "שלב הבא", אבל הכפתור לא נעלם —
    מי שרוצה עוד סט חימום מקבל את השלב האחרון שוב, הכבד שבהם.
  */
  const warmupNext = warmupSuggestion ?? warmupPlan[warmupPlan.length - 1] ?? null

  // שיא שנרשם באימון הזה מסומן לפי רגע הסט — הרשומה נשמרת עם אותה חותמת
  const prStamps = new Set(
    prCache.filter((p) => p.exerciseId === exercise.id).map((p) => p.achievedAt)
  )
  const hasPr = sets.some((s) => prStamps.has(s.completedAt))

  const segments: PlateSegState[] = sets.map((s) => (s.type === 'warmup' ? 'warmup' : 'work'))

  /*
    משקל אפס בתרגיל שאמור להיות עם משקל. תרגיל משקל גוף ותרגיל זמן נשמרים
    באפס בכוונה ולכן הם מוחרגים — בפלאנק ובשכיבות סמיכה 0 ק״ג הוא הערך הנכון.
  */
  const zeroWeight = !bodyweight && !timed && entry.weightKg <= 0

  /** המנוחה שמגיעה אחרי הסט הזה, לפי סוגו */
  const restFor = (type: SetType): number => {
    // 0 הוא בחירה מפורשת של "בלי מנוחה" (סופרסט, תרגיל סיום) ולא ערך חסר,
    // ולכן ההשוואה היא מול undefined ולא מול falsy
    const base = Number.isFinite(item.restSeconds) ? item.restSeconds : settings.defaultRestSeconds
    // חימום הוא לא סט כבד — חצי מנוחה מספיקה ושומרת על קצב
    return type === 'warmup' ? Math.round(base * 0.5) : base
  }

  /** סוגר את התרגיל ופותח את הבא, עם מנוחה לפניו אם הטיימר דלוק */
  const advance = async (restSeconds: number): Promise<void> => {
    /*
      המנוחה נפתחת על *המפתח שנסגר* ורק אחר כך מתקדמים.

      ‏`restForKey` הוא מה שמסך המנוחה המלא מתאר — התרגיל שממנו נחים, המד שלו
      והתמונה שלו. פתיחה על המפתח החדש הייתה מציירת שם את התרגיל שעוד לא
      התחיל, כלומר מד סטים ריק במקום "היעד הושלם".
    */
    if (restSeconds > 0 && settings.restTimerEnabled) await startRest(item.key, restSeconds)
    await completeCurrent()
  }

  const commitSet = async (type: SetType, weightKg: number, reps: number): Promise<void> => {
    if (busy || reps <= 0) return
    // אותו כלל כמו על הכפתור, כדי שגם מסלול שלא עובר דרכו לא ירשום סט ריק
    if (!bodyweight && !timed && weightKg <= 0) return
    setBusy(true)
    try {
      await logSet(item.key, type, weightKg, reps)
      audio.keepAlive()
      onLogged()

      const restSeconds = restFor(type)
      /*
        רק *השלמת היעד* סוגרת את התרגיל, ולא כל סט שמעבר לו.

        ‏`===` ולא `>=`: סט שביעי ביעד של שש הוא בחירה מפורשת להמשיך, והשוואה
        מרופפת הייתה סוגרת את התרגיל שוב בכל אחד מהם — כלומר מי שמוסיף סט היה
        נזרק לתרגיל הבא בדיוק כשהוא ביקש להישאר.
      */
      const completesTarget = type === 'work' && workCount + 1 === item.targetSets
      if (!completesTarget) {
        if (restSeconds > 0 && settings.restTimerEnabled) await startRest(item.key, restSeconds)
        return
      }
      if (settings.askRating && !rating) {
        setStage('rate')
        return
      }
      await advance(restSeconds)
    } finally {
      setBusy(false)
    }
  }

  /**
   * שמירת הדירוג ומעבר לתרגיל הבא.
   *
   * ‏`busy` הוא לא קישוט: השמירה והמעבר הם שתי כתיבות אסינכרוניות, ולחיצה
   * שנייה בין לבין הייתה מדרגת את התרגיל *הבא* בטעות — הכרטיס כבר התחלף
   * אבל הפונקציה עדיין מחזיקה את המפתח הישן.
   */
  const saveRating = async (value: Rating, rir: Rir | null): Promise<void> => {
    if (busy) return
    setBusy(true)
    try {
      await rate(item.key, value, rir)
      await advance(restFor('work'))
    } finally {
      setBusy(false)
    }
  }

  /** נבחר דירוג בבמה — או שממשיכים ל-RIR, או שסוגרים כאן */
  const pickRating = (value: Rating): void => {
    setPendingRating(value)
    if (settings.askRir) {
      setStage('rir')
      return
    }
    void saveRating(value, null)
  }

  const finishRating = (rir: Rir | null): void => {
    if (pendingRating === null) return
    void saveRating(pendingRating, rir)
  }

  /*
    כשהמשקל עדיין 0 הכפתור מושבת, ולכן הוא חייב לומר למה.

    זה לא מקרה קצה אלא הסט הראשון בכל תרגיל שאין לו היסטוריה — כלומר כל 29
    התרגילים בהתקנה חדשה. כפתור ענום בלי מילה אחת של הסבר היה הופך את המסך
    הראשון של האפליקציה לחידה.
  */
  const heroLabel = zeroWeight
    ? 'קבע משקל כדי לרשום'
    : workCount + 1 === item.targetSets
      ? 'סיים סט אחרון'
      : 'סיים סט'

  const setLine =
    workCount < item.targetSets
      ? `סט ${workCount + 1} מתוך ${item.targetSets}`
      : `סט ${workCount + 1} — מעבר ליעד ${item.targetSets}`

  /*
    ── השבבים ──

    שורה אחת שלא נגללת, ולכן כל בונה מחזיר ערכים מנוכי-כפילויות ובתקרה קשיחה.
    מה שהיא בלעה: `RecommendationChip`, שבבי הפלטות, שבבי החזרות ומקטע "פעם
    קודמת" — ארבעה מקטעים שכולם ענו על "איזה מספר לשים בשדה".
  */
  const step = weightStep(exercise)
  const weightChips = (): ValueChip[] => {
    const out: ValueChip[] = []
    const seen = new Set<number>()
    const push = (id: string, label: string, value: number): void => {
      if (out.length >= 4 || value <= 0 || seen.has(value)) return
      seen.add(value)
      out.push({
        id,
        label,
        picked: Math.abs(entry.weightKg - value) < 1e-9,
        ariaLabel: `${label} — ${formatWeight(value, exercise.weightMode)}`,
        onPick: () => setEntry((e) => ({ ...e, weightKg: value })),
      })
    }
    if (recommendation.weightKg !== null) {
      push('rec', `המלצה ${formatKg(recommendation.weightKg)}`, recommendation.weightKg)
    }
    // בלי היסטוריה אין שבב "קודם", ובלי שורה שמצהירה על כך: השורה
    // "אין נתונים קודמים" תיארה היעדר במקום להציע פעולה.
    if (previousTop) push('prev', `קודם ${formatKg(previousTop.weightKg)}`, previousTop.weightKg)
    const base = recommendation.weightKg ?? previousTop?.weightKg ?? entry.weightKg
    if (step > 0 && base > 0) {
      push('up1', formatKg(round2(base + step)), round2(base + step))
      push('up2', formatKg(round2(base + step * 2)), round2(base + step * 2))
    }
    return out
  }

  const repChips = (): ValueChip[] =>
    repMarks(item.targetReps, fallbackCount).map((n) => ({
      id: `r${n}`,
      label: String(n),
      picked: entry.reps === n,
      ariaLabel: `${n} חזרות`,
      onPick: () => setEntry((e) => ({ ...e, reps: n })),
    }))

  const chips = field === 'weight' && !bodyweight ? weightChips() : repChips()

  const resting = rest !== null && stage === 'work'
  /*
    מה המנוחה מכריזה עליו. נשאר סט בתרגיל הזה — "הסט הבא", והמספרים הם מה
    שעומד להירשם. היעד הושלם — "התרגיל הבא", ואז מדובר בשורה שאחריו בתור.
  */
  const restRemaining = item.targetSets - workCount
  const restNextTitle = restRemaining > 0 || !nextUp ? 'הסט הבא' : 'התרגיל הבא'
  const restNextName = restNextTitle === 'הסט הבא' ? exercise.name : (nextUp?.name ?? '')
  /*
    "100 ק״ג × 6" ולא "100×6": כאן יש רוחב, והשורה נקראת בהצצה של שנייה בזמן
    שהעיניים לא על המספרים הקטנים. בשורת "תועד" הצפופה נשאר הקיצור.
  */
  const restNextLine =
    restNextTitle !== 'הסט הבא'
      ? nextUp
        ? `${nextUp.targetSets}×${nextUp.targetReps}`
        : ''
      : bodyweight || timed
        ? formatSetShort(entry.weightKg, entry.reps, exercise.weightMode, exercise.metric)
        : `${formatKg(entry.weightKg)} ק״ג × ${entry.reps}`

  let workNumber = 0

  return (
    <article
      className={`card card-active relative p-3 ${
        item.status === 'deferred' ? 'border-dashed border-flame-500/45' : ''
      }`}
    >
      {/* 1 — מי אני. שם, תת־שריר וציוד; הקבוצה הראשית כבר בכותרת המסך */}
      <div className="flex items-center gap-[11px]">
        <ExerciseThumb
          exerciseId={exercise.id}
          libraryId={exercise.libraryId}
          size="card"
          onOpen={onOpenVideo}
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[1.0625rem] leading-tight font-extrabold tracking-[-0.02em] text-bone-50">
            {exercise.name}
          </h2>
          <p className="mt-1 truncate text-[0.65625rem] leading-none font-medium tracking-[0.03em] text-bone-500">
            {[exercise.subTarget, EQUIPMENT_LABELS[exercise.equipment]].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button
          type="button"
          aria-label={`פעולות על ${exercise.name}`}
          onClick={() => setActionsOpen(true)}
          className="relative flex size-[34px] shrink-0 items-center justify-center rounded-[11px] border border-ink-700 bg-ink-900 text-bone-500 after:absolute after:-inset-[5px] after:content-[''] active:bg-ink-800"
        >
          <Ellipsis size={18} />
        </button>
      </div>

      {/* 2 — כמה סטים, כמה נשארו, ומה היעד */}
      <div className="mt-[11px] flex items-center gap-2.5">
        <PlateProgress className="flex-1" total={item.targetSets} states={segments} />
        <button
          type="button"
          aria-expanded={tuneOpen}
          onClick={() => setTuneOpen((v) => !v)}
          className="relative flex shrink-0 items-center gap-1.5 after:absolute after:inset-x-0 after:-inset-y-[14px] after:content-['']"
        >
          <span className="tnum border-b border-dashed border-flame-400/50 text-xs font-extrabold whitespace-nowrap text-flame-400">
            {setLine}
          </span>
          <ChevronDown
            size={12}
            aria-hidden="true"
            className={`shrink-0 text-bone-500 transition-transform ${tuneOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {/* אי LTR: בלי זה "8–12" מוצג כ-"12–8" ונקרא כטווח יורד */}
        <span dir="ltr" className="tnum shrink-0 text-xs font-bold text-bone-500">
          {formatRepRange(item.targetReps, exercise.metric)}
        </span>
      </div>

      {/*
        3 — מה כבר תועד. שורה אחת במקום N שורות של 44 פיקסלים.

        ‏`SetRow` לא נמחק — הוא חי בגיליון שהשורה הזו פותחת, שם יש מקום לתקן,
        להפוך לחימום ולמחוק. על הכרטיס מספיק לדעת *מה יצא*, ובהצצה אחת.
      */}
      {sets.length > 0 && (
        <button
          type="button"
          onClick={() => setLogOpen(true)}
          className="animate-rise relative mt-2.5 flex h-[30px] w-full items-center gap-2.5 overflow-hidden rounded-[10px] border border-ink-800 bg-bone-50/[0.03] px-2.5 text-start after:absolute after:inset-x-0 after:-inset-y-[7px] after:content-[''] active:bg-bone-50/[0.06]"
        >
          <span className="shrink-0 text-[0.625rem] leading-none font-bold tracking-[0.1em] text-bone-500">
            תועד
          </span>
          <span dir="ltr" className="tnum min-w-0 flex-1 truncate text-start text-[0.78125rem] font-bold text-bone-200">
            {sets.map((s, i) => (
              <span key={s.logId} className={s.type === 'warmup' ? 'text-warmup-400' : ''}>
                {i > 0 ? '  ·  ' : ''}
                {formatSetShort(s.weightKg, s.reps, exercise.weightMode, exercise.metric)}
              </span>
            ))}
          </span>
          {hasPr ? (
            <span className="shrink-0 text-[0.625rem] leading-none font-extrabold text-pr-400">
              שיא
            </span>
          ) : (
            <span className="shrink-0 text-[0.65625rem] leading-none font-semibold text-bone-500">
              ערוך
            </span>
          )}
        </button>
      )}

      {/*
        4 — הבמה. גובה קבוע, ארבעה מצבים, ואפס תזוזה ביניהם.

        זה החוזה של כל המסך הזה: הכפתור הכתום, המנוחה והדירוג יושבים באותם
        פיקסלים בדיוק, ולכן האצבע לא צריכה לחפש אחרי אף מעבר.
      */}
      <div className="relative mt-2.5 h-[196px]">
        {stage === 'rate' ? (
          <RateStage exerciseName={exercise.name} selected={pendingRating} onPick={pickRating} />
        ) : stage === 'rir' ? (
          <RirStage onPick={(rir) => finishRating(rir)} onSkip={() => finishRating(null)} />
        ) : resting && rest ? (
          <InlineRest
            endsAt={rest.endsAt}
            totalSeconds={rest.totalSeconds}
            nextTitle={restNextTitle}
            nextName={restNextName}
            nextLine={restNextLine}
            onOpenFull={onOpenFullRest}
            onAdd30={() => onAdjustRest(30)}
            onReady={onStopRest}
          />
        ) : (
          <div className="animate-fade absolute inset-0 flex flex-col gap-2">
            {/* אריחי ההזנה — מה שאני רושם, גדול מספיק לקרוא בזווית */}
            <div className="flex h-[78px] gap-2">
              {bodyweight ? (
                <div className="flex flex-[1.08] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-ink-700 bg-ink-900">
                  <span className="text-[0.8125rem] font-extrabold text-bone-300">משקל גוף</span>
                  <span className="text-[0.625rem] font-medium text-bone-500">אין מה להעמיס</span>
                </div>
              ) : (
                <div className="flex-[1.08]">
                  <Stepper
                    variant="tile"
                    focused={field === 'weight'}
                    onActivate={() => setField('weight')}
                    label="משקל"
                    unit={exercise.weightMode === 'perSide' ? 'ק״ג לכל צד' : 'ק״ג'}
                    value={entry.weightKg}
                    onChange={(weightKg) => setEntry((e) => ({ ...e, weightKg }))}
                    step={step}
                    min={0}
                  />
                </div>
              )}
              <div className="flex-1">
                <Stepper
                  variant="tile"
                  focused={field === 'reps'}
                  onActivate={() => setField('reps')}
                  label={countLabel(exercise.metric)}
                  unit={timed ? 'שניות' : 'חזרות'}
                  value={entry.reps}
                  onChange={(reps) => setEntry((e) => ({ ...e, reps }))}
                  step={countStep(exercise.metric)}
                  min={0}
                />
              </div>
            </div>

            {/*
              שורת השבבים — או עורך הסטים במקומה, או הסטופר בתרגיל זמן.
              שלושתם באותם 38 פיקסלים בדיוק, ולכן החלפה ביניהם לא מזיזה כלום.
            */}
            <div className="h-[38px]">
              {tuneOpen ? (
                <SetTuner
                  targetSets={item.targetSets}
                  doneWorkSets={workCount}
                  onPick={(next) => void setTargetSets(item.key, next)}
                />
              ) : timed ? (
                /*
                  בתרגיל זמן הסטופר הוא המסלול הראשי: מודדים על המסך במקום
                  לנחש מול שעון, והוא רושם את הסט בעצמו בעצירה. האריח שמעליו
                  נשאר למי שמדד בדרך אחרת ומקליד תוצאה.
                */
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    audio.keepAlive()
                    setHoldOpen(true)
                  }}
                  className="flex h-full w-full items-center justify-center gap-2 rounded-xl border border-flame-500/40 bg-flame-500/10 text-[0.8125rem] font-extrabold text-flame-300 active:bg-flame-500/20"
                >
                  <Timer size={16} aria-hidden="true" />
                  מדוד עם סטופר — היעד {formatClock(item.targetReps.min)}
                </button>
              ) : chips.length > 0 ? (
                <ValueChips chips={chips} />
              ) : (
                /*
                  תרגיל בלי היסטוריה, בלי המלצה ובלי משקל זריעה — כלומר כל
                  תרגיל בהתקנה טרייה. אין מה להציע, ולכן במקום פס ריק בגובה 38
                  יושב כאן המשפט שאומר מה כן אפשר לעשות. שורת "אין נתונים
                  קודמים" תיארה היעדר; זו מצביעה על פעולה.
                */
                <p className="flex h-full items-center justify-center text-[0.71875rem] font-medium text-bone-500">
                  אפשר להקליד את המשקל ישירות בשדה
                </p>
              )}
            </div>

            {/* הפעולה הראשית. כפתור אחד, ענק, במקום קבוע בכל תרגיל */}
            {/*
              משקל 0 חוסם את הכפתור בדיוק כמו 0 חזרות.

              בלי זה, תרגיל בלי היסטוריה ובלי משקל זריעה נפתח על 0 והכפתור
              הראשי פעיל — כלומר הלחיצה הכי סבירה בעולם רושמת "סט עבודה של
              0 ק״ג", ומאותו רגע ההמלצה וההיסטוריה מדברות על אפס.
            */}
            <button
              type="button"
              disabled={busy || entry.reps <= 0 || zeroWeight}
              onClick={() => void commitSet('work', entry.weightKg, entry.reps)}
              className="btn-flame flex flex-1 items-center justify-center rounded-[18px] text-[1.375rem] font-black [-webkit-touch-callout:none] disabled:opacity-40 disabled:shadow-none disabled:[filter:none] disabled:[transform:none]"
            >
              {heroLabel}
            </button>
          </div>
        )}
      </div>

      {/* 5 — דגשים · הערה · חימום. פס אחד בגובה 40, שלושתם מכווצים */}
      <div className="mt-[9px] flex gap-2">
        {exercise.cues.length > 0 && (
          <button
            type="button"
            onClick={() => setCuesOpen((v) => !v)}
            aria-expanded={cuesOpen}
            className="relative flex h-10 flex-1 items-center justify-between gap-2 rounded-[13px] border border-ink-800 bg-ink-900 px-3 text-start after:absolute after:inset-x-0 after:-inset-y-[2px] after:content-[''] active:border-ink-600"
          >
            <span className="text-[0.78125rem] font-bold text-bone-300">
              דגשי ביצוע · {exercise.cues.length}
            </span>
            <span className="shrink-0 text-[0.6875rem] font-semibold text-bone-500">
              {cuesOpen ? 'סגור' : 'פתח'}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setNoteDraft(exercise.personalNote ?? '')
            setNoteOpen(true)
          }}
          className={`relative flex h-10 items-center justify-center rounded-[13px] border px-2 text-[0.71875rem] font-semibold after:absolute after:inset-x-0 after:-inset-y-[2px] after:content-[''] ${
            exercise.cues.length > 0 ? 'w-24 shrink-0' : 'flex-1'
          } ${
            exercise.personalNote
              ? 'border-flame-500/25 bg-flame-500/[0.06] text-bone-100'
              : 'border-dashed border-ink-700 text-bone-500'
          }`}
        >
          <span className="truncate">{exercise.personalNote || 'הערה'}</span>
        </button>
        {/*
          חימום בלחיצה אחת. הכפתור רושם את השלב הבא ברמפה ישירות — הוא לא
          ממלא שדות שצריך לאשר — ולכן שם נגיש מלא: הכיתוב "חימום" לבדו לא
          אומר כמה, וזה בדיוק מה שצריך לדעת לפני שלוחצים.
        */}
        {warmupNext && (
          <button
            type="button"
            disabled={busy}
            aria-label={`סט חימום ${formatWeight(warmupNext.weightKg, exercise.weightMode)} × ${
              timed ? formatClock(warmupNext.reps) : warmupNext.reps
            }`}
            onClick={() => {
              if (warmupDone + 1 >= warmupPlan.length) void markWarmupOffered(item.key)
              void commitSet('warmup', warmupNext.weightKg, warmupNext.reps)
            }}
            className="relative flex h-10 w-[52px] shrink-0 items-center justify-center rounded-[13px] border border-warmup-400/30 bg-warmup-400/[0.07] text-[0.6875rem] font-extrabold text-warmup-400 after:absolute after:inset-x-0 after:-inset-y-[2px] after:content-[''] disabled:opacity-40"
          >
            חימום
          </button>
        )}
      </div>

      {/*
        הרשימה דוחפת את התור למטה, וזה מותר: זו פעולה מכוונת של המשתמש על
        מסך שנגלל, ולא מקטע שיושב שם בכל תרגיל בלי שביקשו אותו.
      */}
      {cuesOpen && exercise.cues.length > 0 && (
        <ul className="animate-fade mt-[9px] flex flex-col gap-2 px-1">
          {exercise.cues.map((cue) => (
            <li key={cue} className="flex items-start gap-[9px]">
              <span className="mt-1.5 size-[5px] shrink-0 rounded-full bg-flame-500" />
              <span className="text-[0.78125rem] leading-[1.45] text-bone-400">{cue}</span>
            </li>
          ))}
        </ul>
      )}

      {/*
        הכרטיס הכחול הפרוש נשאר רק לפני הסט הראשון של תרגיל שיש לו רמפה —
        שם הנימוק באמת נקרא ("רמפת חימום לרגליים, שלב 1 מתוך 3"). מרגע שיש
        סט על השעון הוא מתכווץ לשבב שבפס למעלה, שנשאר זמין עד סוף התרגיל.
      */}
      {warmupSuggestion && !item.warmupOffered && sets.length === 0 && (
        <div className="mt-[9px] rounded-[13px] border border-dashed border-warmup-400/45 bg-warmup-400/[0.06] p-3">
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

      {/* דירוג שכבר ניתן — הדרך לתקן אותו בדיעבד */}
      {rating && (
        <button
          type="button"
          onClick={onOpenRating}
          className="mt-[9px] flex h-10 w-full items-center justify-center gap-2 rounded-[13px] border border-ink-700 bg-ink-900/60 px-3 text-[0.78125rem] font-bold text-bone-300"
        >
          הרגיש {formatRatingText(rating.rating, rating.rir)}
        </button>
      )}

      <ExerciseActionsSheet
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        exerciseName={exercise.name}
        restSeconds={item.restSeconds}
        canSkip={sets.length === 0}
        onDefer={() => void deferItem(item.key)}
        onSubstitute={onOpenSubstitute}
        onFinishExercise={onFinishExercise}
        onSkip={onSkip}
        onRest={(next) => void setItemRest(item.key, next)}
      />

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

      {/* הסטים המלאים — תיקון, הפיכה לחימום ומחיקה, הרחק מהכפתור הכתום */}
      <BottomSheet open={logOpen} onClose={() => setLogOpen(false)} title="הסטים שתועדו">
        <ul className="flex flex-col gap-1.5 pt-1 pb-4">
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
      </BottomSheet>

      {/*
        עורך הסט הבודד נפתח *מעל* רשימת הסטים ולא במקומה. שני פורטלים,
        והאחרון ב-DOM הוא שלמעלה — סגירתו מחזירה לרשימה שממנה נפתח.
      */}
      <BottomSheet open={editing !== null} onClose={() => setEditing(null)} title="עריכת סט">
        {editing && (
          <SetEditor
            key={editing.logId}
            set={editing}
            exercise={exercise}
            plates={settings.plates}
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
            // הסטופר נסגר לפני הרישום: commitSet יכול לפתוח את מסך המנוחה,
            // ושני פורטלים על אותו z-index נלחמים זה בזה
            setHoldOpen(false)
            void commitSet('work', entry.weightKg, elapsed)
          }}
        />
      )}
    </article>
  )
}
