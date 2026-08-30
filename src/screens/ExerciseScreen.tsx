import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft,
  Dumbbell,
  Film,
  GraduationCap,
  Minus,
  Play,
  SearchX,
  SquarePen,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import type { JSX, ReactNode } from 'react'
import type {
  Exercise,
  PersonalRecord,
  PlayableVideo,
  PrKind,
  Rating,
  Rir,
  SetLog,
} from '@/db/types'
import {
  EQUIPMENT_LABELS,
  RATING_LABELS,
  RATING_TONES,
  RIR_LABELS,
  WEIGHT_MODE_LABELS,
} from '@/db/types'
import {
  getAllExercises,
  getExercise,
  getExerciseHistory,
  lastPerformedFrom,
  getPlanItemFor,
  getPrsForExercise,
  getSetsForExercise,
  searchSessions,
} from '@/db/queries'
import { loadVideosFor, releaseVideos } from '@/db/mediaDb'
import { videoMismatchNote } from '@/db/videoIssues'
import { libraryExercise } from '@/db/libraryLinks'
import { prLabel } from '@/domain/prs'
import { recommendWeight } from '@/domain/recommendation'
import type { ExerciseSessionSummary } from '@/domain/recommendation'
import { exerciseTrend } from '@/domain/stats'
import {
  countLabel,
  formatClock,
  formatKg,
  formatRepRange,
  formatSetShort,
  formatVolume,
  formatWeight,
} from '@/domain/units'
import { distinguisher, duplicateNames } from '@/domain/naming'
import { summarize } from '@/domain/volume'
import { formatDateShort, formatRelativeDay } from '@/lib/dates'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { EmptyState } from '@/components/ui'
import { VideoPlayer } from '@/components/media/VideoPlayer'
import { imagesFor } from '@/db/exerciseImages'
import { subOfExercise, useMuscleFixes } from '@/db/muscleFixes'
import { muscleCardFor } from '@/db/muscleCards'
import { MuscleCardSheet } from '@/components/exercises/MuscleCardSheet'
import { assetUrl } from '@/db/mediaDb'
import { TrendChart } from '@/components/charts/lazy'

/**
 * מסך התרגיל — כל מה שידוע על תרגיל אחד במקום אחד:
 * הדגמה, דגשי ביצוע, שיאים, מה להרים היום, וההיסטוריה המלאה.
 */

/** מספיק גדול כדי לכסות כל היסטוריה סבירה, בלי לשלוף הכל בלי גבול */
const HISTORY_LIMIT = 200

/**
 * כמה שורות היסטוריה מרונדרות לפני "הצג הכל".
 *
 * השליפה נשארת מלאה — הגרפים והשיאים צריכים אותה — אבל ה-DOM לא: תרגיל ותיק
 * ייצר עד 200 שורות שכל אחת מרנדרת שבבי סטים, מאות אלמנטים מתחת לקפל, בזמן
 * שנכנסים למסך בשביל "כמה אני עושה בזה" שנמצא למעלה.
 */
const HISTORY_PAGE = 15

const PR_ORDER: PrKind[] = ['maxWeight', 'repsAtMaxWeight', 'maxReps', 'maxSessionVolume']

const RECOMMENDATION_TONE = {
  up: 'text-flame-400',
  steady: 'text-bone-50',
  down: 'text-hard-400',
  neutral: 'text-bone-400',
} as const

// ─── חלקים קטנים ───────────────────────────────────────────────────────────

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="animate-rise">
      <div className="mb-2.5 flex items-center gap-2">
        <h2 className="meta">{title}</h2>
        {action ? <div className="ms-auto">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

function RatingChip({ rating, rir }: { rating: Rating; rir: Rir | null }): JSX.Element {
  const extra = rir === null ? '' : rir === 0 ? ' · כשל' : ` · נשארו ${RIR_LABELS[rir]}`
  return (
    <span className={`rounded-pill border px-2.5 py-1 text-[11px] font-bold ${RATING_TONES[rating]}`}>
      {RATING_LABELS[rating]}
      {extra}
    </span>
  )
}

/**
 * אזהרה על סרטון שמראה תרגיל אחר. הסרטון נשאר — הוא עדיין הדגמה של משהו,
 * והחלפה תגיע כשיצולם סרטון חדש — אבל אסור שילמדו ממנו את התרגיל הלא נכון.
 */
function VideoMismatchNote({ note }: { note: string }): JSX.Element {
  return (
    <p className="mt-2 flex items-start gap-2 rounded-xl border border-warmup-400/25 bg-warmup-400/10 px-3 py-2 text-xs leading-relaxed text-warmup-400">
      <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-bold">הסרטון לא תואם לתרגיל.</span> {note}
      </span>
    </p>
  )
}

/** שורת הדגמות. loadVideosFor מייצר objectURL-ים ולכן חייבים לשחרר אותם ביציאה. */
function MediaRow({
  exerciseId,
  libraryId,
  onOpen,
}: {
  exerciseId: string
  libraryId?: string
  onOpen: () => void
}): JSX.Element {
  const [videos, setVideos] = useState<PlayableVideo[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let created: PlayableVideo[] = []
    let cancelled = false
    setLoaded(false)
    loadVideosFor(exerciseId, libraryId).then((list) => {
      if (cancelled) {
        releaseVideos(list)
        return
      }
      created = list
      setVideos(list)
      setLoaded(true)
    })
    return () => {
      cancelled = true
      releaseVideos(created)
      setVideos([])
    }
  }, [exerciseId, libraryId])

  if (!loaded) return <div className="h-24 rounded-card bg-ink-900/60" />

  /*
    שלושה תרגילים בתוכנית מעולם לא צולמו. זה מצב ריק מסודר ולא תקלה: התרגיל
    קיים, מתאמנים בו, ופשוט אין לו עדיין הדגמה.
  */
  if (videos.length === 0) {
    return (
      <div className="card flex items-center gap-3 p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-bone-600">
          <Film size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-bone-300">אין סרטון עדיין</span>
          <span className="meta mt-0.5 block">
            אפשר לצרף אחד בהגדרות ← סרטונים ואחסון
          </span>
        </span>
      </div>
    )
  }

  return (
    <div className="scroll-touch -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {videos.map((v) => (
        <button
          key={v.id}
          onClick={onOpen}
          aria-label={`נגן ${v.label}`}
          className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-ink-700 transition-transform active:scale-95"
        >
          {v.posterUrl ? (
            <img src={v.posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-ink-850 text-bone-600">
              <Film size={20} />
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-ink-950/30">
            <Play size={18} className="text-bone-50 drop-shadow" fill="currentColor" />
          </span>
        </button>
      ))}
    </div>
  )
}

/**
 * תווית ומספר. שניהם מיושרים לקצה ההתחלה, גם כשהערך רץ LTR.
 *
 * בלי `text-end` הערך נצמד שמאלה תחת dir=ltr בזמן שהתווית מעליו צמודה ימינה,
 * והזוג מתנתק ויזואלית בגריד של "היעד". ה-dir נשאר כי הוא מה שמונע מ-"3 × 8–12"
 * להתהפך — אבל הוא רץ בלבד, לא יישור.
 */
function Fact({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <p className="meta">{label}</p>
      <p className="tnum mt-1 text-end text-sm font-bold text-bone-100" dir="ltr">
        {value}
      </p>
    </div>
  )
}

/** הטקסט של שיא אחד, לפי הסוג שלו */
function prValueText(pr: PersonalRecord, exercise: Exercise): string {
  switch (pr.kind) {
    case 'maxWeight':
      return formatWeight(pr.value, exercise.weightMode)
    case 'repsAtMaxWeight':
    case 'maxReps':
      return exercise.metric === 'seconds' ? formatClock(pr.value) : `${pr.value} חזרות`
    case 'maxSessionVolume':
      return formatVolume(pr.value)
  }
}

function SetChips({ sets, exercise }: { sets: SetLog[]; exercise: Exercise }): JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sets.map((s, i) => (
        <span
          key={s.id ?? `${s.completedAt}-${i}`}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${
            s.type === 'warmup'
              ? 'border-warmup-400/25 bg-warmup-400/10 text-warmup-400'
              : 'border-ink-700 bg-ink-800 text-bone-200'
          }`}
        >
          {s.type === 'warmup' && <span className="text-[9px] font-bold opacity-80">חימום</span>}
          <span dir="ltr" className="tnum">
            {formatSetShort(s.weightKg, s.reps, exercise.weightMode, exercise.metric)}
          </span>
        </span>
      ))}
    </div>
  )
}

function HistoryRow({
  entry,
  exercise,
  onOpen,
}: {
  entry: ExerciseSessionSummary
  exercise: Exercise
  onOpen: () => void
}): JSX.Element {
  const totals = summarize(entry.sets, () => exercise.weightMode)
  return (
    <button
      onClick={onOpen}
      className="card w-full p-3.5 text-start transition-transform active:scale-[0.99]"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-extrabold text-bone-50">{formatRelativeDay(entry.startedAt)}</span>
        <span className="text-xs text-bone-500 tnum" dir="ltr">
          {formatDateShort(entry.startedAt)}
        </span>
        <span className="ms-auto flex items-center gap-2">
          {entry.rating && <RatingChip rating={entry.rating.rating} rir={entry.rating.rir} />}
          <ChevronLeft size={16} className="shrink-0 text-bone-600" />
        </span>
      </div>

      <div className="mt-2.5">
        <SetChips sets={entry.sets} exercise={exercise} />
      </div>

      {totals.volumeKg > 0 && (
        <p className="mt-2.5 text-xs text-bone-500">נפח {formatVolume(totals.volumeKg)}</p>
      )}
    </button>
  )
}

// ─── המסך ──────────────────────────────────────────────────────────────────

/** אילו תרגילים פתחו "הצג את כל ההיסטוריה" — חי ברמת מודול כדי לשרוד ניווט */
const expandedHistory = new Set<string>()

export function ExerciseScreen(): JSX.Element {
  const { exerciseId = '' } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const [playerOpen, setPlayerOpen] = useState(false)
  const [subCardOpen, setSubCardOpen] = useState(false)
  // תיקוני שיוך השריר — כדי שהכרטיס האנטומי כאן יראה את אותו ראש שריר
  // שהשורה יושבת תחתיו ברשימה, ולא את מה שנגזר מהכרטיס לפני התיקון
  const fixes = useMuscleFixes()
  /** נפתח על כרטיס השרירים ולא על ההדגמה */
  const [galleryOnImage, setGalleryOnImage] = useState(false)
  /*
    "הצג הכל" שורד ניווט — משתנה מודול ולא useState בלבד, באותו דפוס של
    historyWindow במסך ההיסטוריה: מי שפתח את כל ההיסטוריה, נכנס לאימון וחזר,
    צריך למצוא מסך באותו גובה — אחרת שחזור הגלילה מכוון ליעד שכבר לא קיים.
  */
  const [showAllHistory, setShowAllHistoryState] = useState(
    () => expandedHistory.has(exerciseId)
  )
  const setShowAllHistory = (open: boolean): void => {
    if (open) expandedHistory.add(exerciseId)
    else expandedHistory.delete(exerciseId)
    setShowAllHistoryState(open)
  }

  // null = התרגיל לא קיים · undefined = עוד נטען
  const data = useLiveQuery(async () => {
    const exercise = await getExercise(exerciseId)
    if (!exercise) return null
    const [prs, history, sessions, sets, planItem] = await Promise.all([
      getPrsForExercise(exerciseId),
      getExerciseHistory(exerciseId, HISTORY_LIMIT),
      searchSessions({ exerciseId }),
      getSetsForExercise(exerciseId),
      getPlanItemFor(exerciseId),
    ])
    return {
      exercise,
      // מהסטים שכבר נשלפו, במקום סריקה של כל טבלת הסטים בשביל שורה אחת
      lastDone: lastPerformedFrom(sets),
      prs,
      history,
      trend: exerciseTrend(exercise, sessions, sets),
      /*
        נמדד מול הטווח שבתוכנית הפעילה, לא מול זה שבקטלוג.

        בתוכניות החזרה הטווחים באמת שונים (‎10–12 מול ‎8–12), ובלי זה המסך הזה
        היה מציג "נשארים" בזמן שכרטיס האימון מציג "יורדים" על אותם נתונים.
        `now` נותן את אותו ריסון אחרי הפסקה שהכרטיס מקבל.
      */
      planItem,
      recommendation: recommendWeight(
        planItem?.startWeightKg == null ? exercise : { ...exercise, seedWeightKg: planItem.startWeightKg },
        history,
        planItem?.targetReps ?? exercise.targetReps,
        Date.now()
      ),
      // יש בקטלוג זוגות שנושאים בכוונה שם זהה — הכותרת צריכה להגיד מי מהם זה
      duplicates: duplicateNames(await getAllExercises(true)),
    }
  }, [exerciseId])

  const weightPoints = useMemo(
    () =>
      (data?.trend ?? []).flatMap((p) =>
        p.workingWeightKg === null
          ? []
          : [{ label: formatDateShort(p.timestamp), value: p.workingWeightKg }]
      ),
    [data]
  )

  const repsPoints = useMemo(
    () =>
      (data?.trend ?? []).flatMap((p) =>
        p.topSetReps === null ? [] : [{ label: formatDateShort(p.timestamp), value: p.topSetReps }]
      ),
    [data]
  )

  const volumePoints = useMemo(
    () =>
      (data?.trend ?? []).map((p) => ({
        label: formatDateShort(p.timestamp),
        value: p.volumeKg,
      })),
    [data]
  )

  if (data === undefined) {
    return (
      <Screen dock={false}>
        <ScreenHeader title="תרגיל" />
        <div className="space-y-3">
          <div className="h-24 rounded-card bg-ink-900/60" />
          <div className="h-32 rounded-card bg-ink-900/60" />
          <div className="h-32 rounded-card bg-ink-900/60" />
        </div>
      </Screen>
    )
  }

  if (data === null) {
    return (
      <Screen dock={false}>
        <ScreenHeader title="תרגיל לא נמצא" />
        <EmptyState
          icon={<SearchX />}
          title="התרגיל הזה כבר לא בקטלוג"
          hint="אולי הוא נמחק. אפשר לחזור אחורה ולבחור תרגיל אחר מהרשימה."
        />
      </Screen>
    )
  }

  const { exercise, prs, history, recommendation, lastDone, duplicates, planItem } = data
  /*
    "היעד" מציג את מה שבאמת מתאמנים לפיו. הקטלוג הוא ברירת המחדל של תרגיל חדש,
    אבל ברגע שהתרגיל נמצא בתוכנית — המספרים שלה הם אלה שרואים באימון.
  */
  const target = {
    sets: planItem?.targetSets ?? exercise.targetSets,
    reps: planItem?.targetReps ?? exercise.targetReps,
    rest: planItem?.restSeconds ?? exercise.defaultRestSeconds,
  }
  const mismatch = videoMismatchNote(exercise.id)
  /*
    הקישור נקרא מהרשומה ולא מהמפה הסטטית. מגרסה 4 `Exercise.libraryId` הוא
    מקור האמת: LIBRARY_LINKS רק זורע אותו בהתקנה, ומכאן והלאה הוא נכתב מהוספת
    תרגיל מהמאגר. קריאה מהמפה הייתה מפספסת כל קישור שנוצר בזמן ריצה, וממשיכה
    להציג קישור שנוקה בעריכה.
  */
  const libraryMatch = exercise.libraryId ? libraryExercise(exercise.libraryId) : null
  const muscleCard = imagesFor(exercise.id, exercise.libraryId)[0] ?? null
  /*
    התת-שריר של התרגיל, והכרטיס שמראה איפה הוא יושב.

    שתי שאלות שונות באותו סקשן: כרטיס התרגיל עונה על "מה עובד כאן ובכמה",
    והכרטיס האנטומי על "איפה זה בגוף ואיפה אמורים להרגיש". השני נגזר מהראשון
    ולכן הוא מתחתיו ולא לצידו.
  */
  const subTarget = subOfExercise(exercise, fixes)
  const subCard = subTarget ? muscleCardFor(subTarget) : null
  const apart = distinguisher(exercise, duplicates)
  const isBodyweight = exercise.weightMode === 'bodyweight'
  const isTimed = exercise.metric === 'seconds'
  const heroUnit = exercise.weightMode === 'perSide' ? 'ק״ג כל צד' : 'ק״ג'
  const sortedPrs = PR_ORDER.flatMap((kind) => prs.filter((p) => p.kind === kind))
  const maxWeightPr = sortedPrs.find((p) => p.kind === 'maxWeight')
  const otherPrs = sortedPrs.filter((p) => p.kind !== 'maxWeight')
  const RecIcon =
    recommendation.tone === 'up' ? TrendingUp : recommendation.tone === 'down' ? TrendingDown : Minus

  return (
    <Screen dock={false}>
      <ScreenHeader
        title={exercise.name}
        subtitle={[exercise.subTarget, EQUIPMENT_LABELS[exercise.equipment], apart]
          .filter(Boolean)
          .join(' · ')}
      />

      {/*
        השם באנגלית מופיע רק כאן ולא ברשימה. הוא מה שמחפשים בו סרטון ברשת
        ומה שכתוב על המדבקה של המכונה, אז הוא צריך להיות זמין — אבל לא להתחרות
        בשם העברי בסריקה של הרשימה.
      */}
      {exercise.nameEn ? (
        <p dir="ltr" className="-mt-2 mb-5 text-end text-sm font-semibold tracking-wide text-bone-500">
          {exercise.nameEn}
        </p>
      ) : null}

      {/* 0 · כמה אני עושה בזה — השאלה שבשבילה נכנסים למסך */}
      {lastDone ? (
        <div className="card animate-rise mb-7 p-4">
          <p className="meta">כמה אני עושה בזה</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span dir="ltr" className="numeral-hero tnum text-4xl text-bone-50">
              {isBodyweight
                ? isTimed
                  ? formatClock(lastDone.reps)
                  : lastDone.reps
                : formatKg(lastDone.weightKg)}
            </span>
            <span className="text-sm font-bold text-bone-400">
              {isBodyweight
                ? isTimed
                  ? 'להחזיק'
                  : 'חזרות'
                : `${exercise.weightMode === 'perSide' ? 'ק״ג כל צד' : 'ק״ג'} × ${
                    isTimed ? formatClock(lastDone.reps) : lastDone.reps
                  }`}
            </span>
          </p>
          <p className="meta mt-2">
            {lastDone.sets} סטים · {formatRelativeDay(lastDone.at)}
          </p>
        </div>
      ) : null}

      <div className="space-y-7">
        {/*
          0 · אילו שרירים עובדים.

          לפני ההדגמה ולא אחריה: הכרטיס עונה על "מה התרגיל הזה עושה", וההדגמה
          על "איך מבצעים אותו". הראשונה היא השאלה שמגיעים איתה למסך של תרגיל
          שלא מכירים.

          התמונה היא כפתור שפותח את אותה גלריה של ההדגמה — הכרטיסים בהתחלה
          והסרטונים אחריהם — ולכן אין כאן מציג שני שצריך לתחזק.
        */}
        {muscleCard ? (
          <Section title="אילו שרירים עובדים">
            <button
              type="button"
              onClick={() => {
                setGalleryOnImage(true)
                setPlayerOpen(true)
              }}
              aria-label={`הגדל — אילו שרירים עובדים ב${exercise.name}`}
              className="card block w-full overflow-hidden bg-bone-50 p-0 active:opacity-90"
            >
              <img
                src={assetUrl(muscleCard.thumb)}
                srcSet={`${assetUrl(muscleCard.thumb)} 200w, ${assetUrl(muscleCard.src)} 1100w`}
                sizes="(max-width: 640px) 100vw, 640px"
                alt=""
                className="block w-full"
                loading="lazy"
              />
            </button>
            {subCard ? (
              <button
                type="button"
                onClick={() => setSubCardOpen(true)}
                className="mt-2 flex min-h-13 w-full items-center gap-3 rounded-card border border-ink-800 bg-ink-900/60 px-3 text-start active:bg-ink-800"
              >
                <img
                  src={assetUrl(subCard.thumb)}
                  alt=""
                  className="size-10 shrink-0 rounded-lg border border-ink-700 bg-bone-50 object-contain"
                  loading="lazy"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-bone-50">{subTarget}</span>
                  <span className="meta mt-0.5 block">איפה השריר הזה יושב</span>
                </span>
                <ChevronLeft size={16} className="shrink-0 text-bone-600" />
              </button>
            ) : null}
          </Section>
        ) : null}

        {/* 1 · הדגמה */}
        <Section title="הדגמה">
          <MediaRow
            exerciseId={exercise.id}
            libraryId={exercise.libraryId}
            onOpen={() => {
              setGalleryOnImage(false)
              setPlayerOpen(true)
            }}
          />
          {mismatch ? <VideoMismatchNote note={mismatch} /> : null}
          {/*
            ההדגמה למעלה היא תבור מבצע את התרגיל. הקישור הזה מוביל להסבר של יוצר
            תוכן על אותו תרגיל — טכניקה וטעויות. שני דברים שונים, ולכן שתי שורות.
          */}
          {libraryMatch ? (
            <Link
              to={`/library/${libraryMatch.id}`}
              className="card mt-2 flex items-center gap-3 p-3 active:bg-ink-800"
            >
              <GraduationCap size={18} className="shrink-0 text-flame-400" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-bone-50">איך מבצעים נכון</span>
                <span className="meta mt-0.5 block">
                  {libraryMatch.videos.length} סרטוני הסבר במאגר
                </span>
              </span>
              <ChevronLeft size={16} className="shrink-0 text-bone-600" />
            </Link>
          ) : null}
        </Section>

        {/* 1.5 · ההערה שלי — מה שאני יודע על המכונה הזו, ולא איך מבצעים */}
        {exercise.personalNote ? (
          <Section title="ההערה שלי">
            <p className="card p-4 text-sm leading-relaxed whitespace-pre-wrap text-bone-100">
              {exercise.personalNote}
            </p>
          </Section>
        ) : null}

        {/* 2 · דגשי ביצוע — כאן הם תמיד פתוחים, זה המקום שבאים אליו ללמוד */}
        <Section
          title="דגשי ביצוע"
          action={
            <Link
              to={`/settings/exercises/${exercise.id}`}
              className="flex min-h-12 items-center gap-1.5 px-2 text-xs font-bold text-flame-400"
            >
              <SquarePen size={14} />
              ערוך
            </Link>
          }
        >
          {exercise.cues.length ? (
            <ul className="card space-y-2.5 p-4">
              {exercise.cues.map((cue) => (
                <li key={cue} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-flame-500 shadow-[0_0_8px_color-mix(in_srgb,var(--color-flame-500)_70%,transparent)]" />
                  <span className="text-sm leading-relaxed text-bone-200">{cue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-bone-500">עוד לא כתבת דגשים לתרגיל הזה</p>
          )}
        </Section>

        {/* 3 · מספרי היעד */}
        <Section title="היעד">
          <div className="card grid grid-cols-2 gap-4 p-4">
            <Fact
              label={`סטים × ${countLabel(exercise.metric)}`}
              value={`${target.sets} × ${formatRepRange(target.reps, exercise.metric)}`}
            />
            <Fact label="מנוחה" value={formatClock(target.rest)} />
            <Fact label="מצב משקל" value={WEIGHT_MODE_LABELS[exercise.weightMode]} />
            <Fact
              label="קפיצת משקל"
              value={isBodyweight ? '—' : `${formatKg(exercise.weightIncrementKg)} ק״ג`}
            />
          </div>
        </Section>

        {history.length === 0 ? (
          <EmptyState
            icon={<Dumbbell />}
            title="עוד לא הרמת את התרגיל הזה"
            hint={recommendation.reason}
          />
        ) : (
          <>
            {/* 4 · שיאים */}
            {sortedPrs.length > 0 && (
              <Section title="שיאים">
                <div className="space-y-3">
                  {maxWeightPr && (
                    <div className="card animate-stamp p-4">
                      <p className="meta">{prLabel(maxWeightPr.kind, exercise.metric)}</p>
                      <p className="mt-2 flex items-baseline gap-2">
                        <span className="numeral-hero text-4xl text-pr-400 tnum" dir="ltr">
                          {formatKg(maxWeightPr.value)}
                        </span>
                        <span className="text-sm font-bold text-pr-400/70">{heroUnit}</span>
                      </p>
                      <p className="mt-2.5 text-xs text-bone-500">
                        נקבע ב-<span dir="ltr" className="tnum">{formatDateShort(maxWeightPr.achievedAt)}</span>
                        {maxWeightPr.reps ? ` · ${maxWeightPr.reps} חזרות` : ''}
                      </p>
                    </div>
                  )}

                  {otherPrs.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {otherPrs.map((pr) => (
                        <div key={pr.kind} className="card p-3.5">
                          <p className="meta">{prLabel(pr.kind, exercise.metric)}</p>
                          <p className="mt-1.5 text-lg font-extrabold text-pr-400">
                            {prValueText(pr, exercise)}
                          </p>
                          {pr.kind === 'repsAtMaxWeight' && pr.weightKg !== null && (
                            <p className="text-xs text-bone-500">
                              ב-{formatWeight(pr.weightKg, exercise.weightMode)}
                            </p>
                          )}
                          <p className="mt-1.5 text-[11px] text-bone-500 tnum" dir="ltr">
                            {formatDateShort(pr.achievedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* 5 · המלצה להיום */}
            <Section title="המלצה להיום">
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-ink-800 ${RECOMMENDATION_TONE[recommendation.tone]}`}>
                    <RecIcon size={20} />
                  </span>
                  {recommendation.weightKg !== null && (
                    <p className="flex items-baseline gap-1.5">
                      <span
                        className={`numeral-hero text-3xl tnum ${RECOMMENDATION_TONE[recommendation.tone]}`}
                        dir="ltr"
                      >
                        {formatKg(recommendation.weightKg)}
                      </span>
                      <span className="text-xs font-bold text-bone-500">{heroUnit}</span>
                    </p>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-bone-300">{recommendation.reason}</p>
              </div>
            </Section>

            {/* 6 · גרפים */}
            <Section title="התקדמות">
              <div className="space-y-3">
                {/* בתרגיל משקל גוף אין משקל ואין נפח — החזרות הן ההתקדמות היחידה */}
                {isBodyweight ? (
                  <div className="card p-3">
                    <p className="mb-1 px-1 text-xs font-bold text-bone-400">
                      {isTimed ? 'זמן החזקה בסט הטוב' : 'חזרות בסט הטוב'}
                    </p>
                    <TrendChart
                      points={repsPoints}
                      unit={isTimed ? 'שניות' : 'חזרות'}
                      color="flame"
                    />
                  </div>
                ) : (
                  <>
                    <div className="card p-3">
                      <p className="mb-1 px-1 text-xs font-bold text-bone-400">משקל עבודה</p>
                      <TrendChart points={weightPoints} unit="ק״ג" color="flame" />
                    </div>
                    <div className="card p-3">
                      <p className="mb-1 px-1 text-xs font-bold text-bone-400">נפח לאימון</p>
                      <TrendChart points={volumePoints} unit="ק״ג" color="pr" />
                    </div>
                  </>
                )}
              </div>
            </Section>

            {/* 7 · היסטוריה מלאה */}
            <Section title="היסטוריה מלאה">
              <div className="space-y-2.5">
                {(showAllHistory ? history : history.slice(0, HISTORY_PAGE)).map((entry) => (
                  <HistoryRow
                    key={entry.sessionId}
                    entry={entry}
                    exercise={exercise}
                    onOpen={() => navigate(`/history/${entry.sessionId}`)}
                  />
                ))}
                {!showAllHistory && history.length > HISTORY_PAGE ? (
                  <button
                    type="button"
                    onClick={() => setShowAllHistory(true)}
                    className="btn-ghost flex min-h-14 w-full items-center justify-center rounded-card text-sm font-bold"
                  >
                    <span className="tnum">הצג את כל {history.length} האימונים</span>
                  </button>
                ) : null}
              </div>
            </Section>
          </>
        )}

        <div className="h-4" />
      </div>

      <VideoPlayer
        exerciseId={exercise.id}
        libraryId={exercise.libraryId}
        exerciseName={exercise.name}
        open={playerOpen}
        startOnImage={galleryOnImage}
        onClose={() => setPlayerOpen(false)}
      />

      <MuscleCardSheet card={subCardOpen ? subCard : null} onClose={() => setSubCardOpen(false)} />
    </Screen>
  )
}
