import { useEffect, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Clock,
  Dumbbell,
  History,
  Minus,
  ShieldAlert,
  Shuffle,
  SkipForward,
  StickyNote,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { getSettings } from '@/db/db'
import { ensurePersisted } from '@/hooks/useStorageStatus'
import { backupNow, STALE_BACKUP_DAYS, URGENT_BACKUP_DAYS } from '@/db/backup'
import {
  getAllExercises,
  getAllPrs,
  getBlocks,
  getFinishedSessions,
  getRatingsForSession,
  getRoutines,
  getSession,
  getSetsForSession,
} from '@/db/queries'
import type {
  Exercise,
  ExerciseMetric,
  ExerciseRating,
  MuscleGroup,
  PersonalRecord,
  Session,
  SetLog,
  Substitution,
  WeightMode,
} from '@/db/types'
import { MUSCLE_GROUPS, RATING_LABELS, RATING_TONES, RIR_LABELS } from '@/db/types'
import {
  formatClock,
  formatDuration,
  formatSetShort,
  formatVolume,
  formatWeight,
} from '@/domain/units'
import { summarize, weightModeLookup, workSets, workingWeight } from '@/domain/volume'
import { pacingSummary } from '@/domain/pacing'
import type { PrEvent } from '@/domain/prs'
import { prHeadline, prLabel } from '@/domain/prs'
import { formatDateLong, formatTime, daysSince } from '@/lib/dates'
import { Button, EmptyState, fireConfetti, toast } from '@/components/ui'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'

/**
 * מסך הסיכום — הפרס על האימון שנגמר.
 * כל המספרים כאן נגזרים מהסטים עצמם ולא מהשדות המדונרמלים, כדי שהמסך יישאר
 * נכון גם אם הסטים נערכו אחרי הסיום.
 */

// ─── עזרי ניסוח ────────────────────────────────────────────────────────────

/** "10 חזרות" · "2:30" בתרגיל שנמדד בזמן — סכום שניות ולא ספירת תנועות */
function repsText(n: number, metric?: ExerciseMetric): string {
  if (metric === 'seconds') return formatClock(n)
  return n === 1 ? 'חזרה אחת' : `${n} חזרות`
}

function setsText(n: number): string {
  return n === 1 ? 'סט אחד' : `${n} סטים`
}

/** מפריד "12.4 טון" ל-"12.4" + "טון" כדי שרק המספר יקבל את הגופן הענק */
function splitValue(text: string): { head: string; tail: string } {
  const m = /^([\d.,]+)\s*(.*)$/.exec(text)
  return m ? { head: m[1], tail: m[2] } : { head: text, tail: '' }
}

const SUB_REASONS: Record<Substitution['reason'], string> = {
  occupied: 'המתקן היה תפוס',
  choice: 'בחירה שלך',
}

/** רשימת סטי עבודה קצרה: "60×10, 60×9" */
function setListText(
  sets: readonly SetLog[],
  mode: WeightMode,
  metric?: ExerciseMetric
): string {
  return sets.map((s) => formatSetShort(s.weightKg, s.reps, mode, metric)).join(', ')
}

/**
 * ההשוואה לפעם הקודמת. מדברת על מה שבאמת השתנה: קודם המשקל, אחר כך סך
 * החזרות, ורק אם מספר הסטים שונה גם עליו.
 */
function comparisonText(
  mode: WeightMode,
  current: readonly SetLog[],
  previous: readonly SetLog[],
  metric?: ExerciseMetric
): string | null {
  if (!current.length || !previous.length) return null

  const curReps = current.reduce((n, s) => n + s.reps, 0)
  const prevReps = previous.reduce((n, s) => n + s.reps, 0)
  const repsDiff = curReps - prevReps
  const setsDiff = current.length - previous.length

  const parts: string[] = []
  let changed = false

  if (mode !== 'bodyweight') {
    const curW = workingWeight(current)
    const prevW = workingWeight(previous)
    if (curW !== null && prevW !== null) {
      if (Math.abs(curW - prevW) < 0.001) {
        parts.push('אותו משקל')
      } else {
        changed = true
        parts.push(
          curW > prevW
            ? `עלית ל-${formatWeight(curW, mode)}`
            : `ירדת ל-${formatWeight(curW, mode)}`
        )
      }
    }
  }

  if (repsDiff > 0) {
    changed = true
    parts.push(`${repsText(repsDiff, metric)} יותר`)
  } else if (repsDiff < 0) {
    changed = true
    parts.push(`${repsText(-repsDiff, metric)} פחות`)
  } else {
    parts.push(metric === 'seconds' ? 'אותו זמן' : 'אותו מספר חזרות')
  }

  if (setsDiff !== 0) {
    changed = true
    parts.push(setsDiff > 0 ? `${setsText(setsDiff)} יותר` : `${setsText(-setsDiff)} פחות`)
  }

  return changed ? parts.join(', ') : 'בדיוק כמו בפעם הקודמת'
}

function groupByExercise(list: readonly SetLog[]): Map<string, SetLog[]> {
  const map = new Map<string, SetLog[]>()
  for (const s of list) {
    const arr = map.get(s.exerciseId)
    if (arr) arr.push(s)
    else map.set(s.exerciseId, [s])
  }
  return map
}

// ─── טעינה ─────────────────────────────────────────────────────────────────

interface SummaryData {
  session: Session
  sets: SetLog[]
  ratings: ExerciseRating[]
  exercises: Exercise[]
  sessionPrs: PersonalRecord[]
  routineName: string | null
  blockNames: string[]
  previous: { session: Session; sets: SetLog[] } | null
}

// ─── רכיבים קטנים ──────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  sub,
  children,
}: {
  label: string
  value: string
  sub?: string
  children?: ReactNode
}): JSX.Element {
  const { head, tail } = splitValue(value)
  const numeric = /^\d/.test(head)
  return (
    <div className="card flex flex-col gap-1.5 p-4">
      <p className="meta">{label}</p>
      <p className="flex items-baseline gap-1.5">
        <span
          dir={numeric ? 'ltr' : undefined}
          className={
            numeric
              ? 'numeral-hero text-3xl text-bone-50'
              : 'text-xl leading-tight font-extrabold text-bone-50'
          }
        >
          {head}
        </span>
        {tail ? <span className="text-sm font-semibold text-bone-400">{tail}</span> : null}
      </p>
      {sub ? <p className="truncate text-xs text-bone-500">{sub}</p> : null}
      {children}
    </div>
  )
}

/** שבב ההשוואה שמתחת לאריח הנפח */
function DeltaChip({ percent }: { percent: number }): JSX.Element {
  const tone =
    percent > 0 ? 'text-pr-400' : percent < 0 ? 'text-hard-400' : 'text-bone-500'
  const Icon = percent > 0 ? TrendingUp : percent < 0 ? TrendingDown : Minus
  const sign = percent > 0 ? '+' : percent < 0 ? '−' : ''
  return (
    <p className={`mt-0.5 flex items-center gap-1 text-xs font-bold ${tone}`}>
      <Icon size={13} className="shrink-0" />
      <span className="tnum" dir="ltr">
        {sign}
        {Math.abs(percent)}%
      </span>
      <span className="font-medium">מהפעם הקודמת</span>
    </p>
  )
}

function SetChip({
  set,
  mode,
  metric,
}: {
  set: SetLog
  mode: WeightMode
  metric?: ExerciseMetric
}): JSX.Element {
  const warmup = set.type === 'warmup'
  return (
    <span
      dir={mode === 'bodyweight' ? undefined : 'ltr'}
      className={`tnum rounded-lg border px-2 py-1 text-sm font-bold ${
        warmup
          ? 'border-warmup-400/25 bg-warmup-400/10 text-warmup-400'
          : 'border-ink-700 bg-ink-800 text-bone-200'
      }`}
    >
      {formatSetShort(set.weightKg, set.reps, mode, metric)}
    </span>
  )
}

/** תזכורת הגיבוי, עם ייצוא במקום. מוצגת רק כשבאמת עבר מספיק זמן. */
function BackupNudge(): JSX.Element | null {
  const settings = useLiveQuery(() => getSettings(), [])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (!settings || done) return null
  const last = settings.lastBackupAt
  const days = last === null ? null : daysSince(last)
  if (days !== null && days < STALE_BACKUP_DAYS) return null

  const urgent = days === null || days >= URGENT_BACKUP_DAYS
  const line =
    days === null
      ? 'עוד לא גיבית אף פעם. הנתונים קיימים רק על המכשיר הזה.'
      : `עברו ${days} ימים מהגיבוי האחרון.`

  const run = async (): Promise<void> => {
    setBusy(true)
    try {
      const how = await backupNow()
      if (how === 'cancelled') {
        toast('הייצוא בוטל')
        return
      }
      setDone(true)
      toast('הגיבוי נשמר', { tone: 'success' })
    } catch {
      toast('הייצוא נכשל', { tone: 'warn' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className={`card mt-3 flex items-center gap-3 p-4 ${
        urgent ? 'border-hard-400/35 bg-hard-400/[0.07]' : ''
      }`}
    >
      <ShieldAlert
        size={20}
        className={`shrink-0 ${urgent ? 'text-hard-400' : 'text-flame-400'}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-bone-50">{line}</p>
        <p className="meta mt-0.5">{urgent ? 'זה הזמן. זה לוקח שנייה.' : 'שווה לגבות עכשיו.'}</p>
      </div>
      <Button size="md" variant={urgent ? 'danger' : 'ghost'} loading={busy} onClick={() => void run()}>
        גבה
      </Button>
    </section>
  )
}

// ─── המסך ──────────────────────────────────────────────────────────────────

export function SummaryScreen(): JSX.Element {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [confettiEnabled, setConfettiEnabled] = useState(false)
  const firedRef = useRef(false)

  const data = useLiveQuery<SummaryData | null>(async () => {
    if (!sessionId) return null
    const session = await getSession(sessionId)
    if (!session) return null

    const [sets, ratings, exercises, prs, routines, blocks, finished] = await Promise.all([
      getSetsForSession(session.id),
      getRatingsForSession(session.id),
      getAllExercises(true),
      getAllPrs(),
      getRoutines(),
      getBlocks(),
      getFinishedSessions(),
    ])

    // getFinishedSessions מוחזר מהחדש לישן, ולכן הראשון שמתאים הוא הקודם
    const prevSession =
      session.routineId === null
        ? null
        : (finished.find(
            (s) => s.id !== session.id && s.routineId === session.routineId && s.startedAt < session.startedAt
          ) ?? null)
    const prevSets = prevSession ? await getSetsForSession(prevSession.id) : []

    return {
      session,
      sets,
      ratings,
      exercises,
      sessionPrs: prs.filter((p) => p.sessionId === session.id),
      routineName: routines.find((r) => r.id === session.routineId)?.name ?? null,
      blockNames: session.blockIds
        .map((id) => blocks.find((b) => b.id === id)?.name)
        .filter((n): n is string => n !== undefined),
      previous: prevSession ? { session: prevSession, sets: prevSets } : null,
    }
  }, [sessionId])

  useEffect(() => {
    void getSettings().then((s) => setConfettiEnabled(s.confettiEnabled))
  }, [])

  /*
    אחסון קבוע, אחרי אימון שנסגר.

    זו ההגנה היחידה מפני ספארי שמפנה מקום ומוחק את כל ההיסטוריה, והיא הייתה
    חבויה ככפתור בתחתית מסך ההגדרות — מי שלא גלל לשם מעולם לא ביקש אותה.
    ב-PWA מותקן הבקשה מאושרת בשקט, ולכן אין כאן שום הפרעה למשתמש.
  */
  useEffect(() => {
    void ensurePersisted()
  }, [])

  useEffect(() => {
    if (firedRef.current) return
    if (!confettiEnabled || !data || data.sessionPrs.length === 0) return
    firedRef.current = true // StrictMode מריץ אפקטים פעמיים — הדגל מונע ירי כפול
    fireConfetti('big')
  }, [confettiEnabled, data])

  const goHome = () => navigate('/', { replace: true })

  if (data === undefined) {
    return (
      <Screen dock={false}>
        <ScreenHeader title="סיכום האימון" onBack={goHome} />
        <div className="mt-10 flex justify-center">
          <div className="size-10 animate-pulse rounded-full bg-flame-500/25" />
        </div>
      </Screen>
    )
  }

  if (data === null) {
    return (
      <Screen dock={false}>
        <ScreenHeader title="סיכום האימון" onBack={goHome} />
        <EmptyState
          icon={<Dumbbell />}
          title="לא מצאתי את האימון הזה"
          hint="אולי הוא נמחק, או שהקישור ישן. אפשר לחזור הביתה ולהתחיל חדש."
          action={
            <Button variant="flame" size="md" onClick={goHome}>
              חזרה לדף הבית
            </Button>
          }
        />
      </Screen>
    )
  }

  const { session, sets, ratings, exercises, sessionPrs, routineName, blockNames, previous } = data

  const modeOf = weightModeLookup(exercises)
  const exerciseById = new Map(exercises.map((e) => [e.id, e]))
  const ratingByExercise = new Map(ratings.map((r) => [r.exerciseId, r]))
  const setsByExercise = groupByExercise(sets)
  const prevSetsByExercise = groupByExercise(previous?.sets ?? [])

  // סדר התצוגה הוא סדר הביצוע בפועל; תרגיל עם סטים שאיכשהו חסר בסדר נדחף לסוף
  const ordered = [...new Set([...session.actualOrder, ...setsByExercise.keys()])].filter((id) =>
    setsByExercise.has(id)
  )

  const totals = summarize(sets, modeOf)
  const pacing = pacingSummary(sets)
  const prevTotals = previous ? summarize(previous.sets, modeOf) : null
  const deltaPercent =
    prevTotals && prevTotals.volumeKg > 0
      ? Math.round(((totals.volumeKg - prevTotals.volumeKg) / prevTotals.volumeKg) * 100)
      : null

  const groupsText = [
    ...new Set(
      ordered
        .map((id) => exerciseById.get(id)?.muscleGroup)
        .filter((g): g is MuscleGroup => g !== undefined)
    ),
  ]
    .map((g) => MUSCLE_GROUPS[g].short)
    .join(' · ')

  const prCountByExercise = new Map<string, number>()
  for (const pr of sessionPrs) {
    prCountByExercise.set(pr.exerciseId, (prCountByExercise.get(pr.exerciseId) ?? 0) + 1)
  }

  const title = routineName ?? 'אימון חופשי'
  const subtitleParts = blockNames.length ? [`+ ${blockNames.join(' · ')}`] : []

  return (
    <Screen dock={false}>
      <ScreenHeader title="סיכום האימון" onBack={goHome} />

      {/* ── כותרת חגיגית ── */}
      <section className="card animate-rise relative overflow-hidden px-5 py-6 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-20 h-36 bg-[radial-gradient(60%_100%_at_50%_100%,color-mix(in_srgb,var(--color-flame-500)_30%,transparent),transparent_72%)]"
        />
        <div className="relative">
          <p className="meta">{formatDateLong(session.startedAt)}</p>
          <h2 className="mt-2 text-2xl font-extrabold text-bone-50">{title}</h2>
          {subtitleParts.length ? (
            <p className="mt-1 text-sm text-flame-300">{subtitleParts.join(' ')}</p>
          ) : null}

          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-bone-400">
            <Clock size={14} className="shrink-0 text-bone-500" />
            <span className="tnum" dir="ltr">
              {formatTime(session.startedAt)} — {formatTime(session.endedAt)}
            </span>
          </p>

          {sessionPrs.length ? (
            <p className="animate-stamp mt-4 inline-flex items-center gap-2 rounded-pill border border-pr-400/35 bg-pr-400/10 px-4 py-2 text-base font-extrabold text-pr-400">
              <Trophy size={18} className="shrink-0" />
              שיא אישי חדש
            </p>
          ) : null}
        </div>
      </section>

      {/*
        ── תזכורת גיבוי ──

        אין שרת, אין ענן ואין Push — הנתונים קיימים רק על המכשיר הזה, והרגע
        היחיד עם תשומת לב מובטחת הוא סיום אימון. התזכורת בבית קטנה, ניתנת
        להסתרה, ולא מסלימה: אחרי חצי שנה היא נראית כמו אחרי 31 יום.
      */}
      <BackupNudge />

      {/* ── ארבעת המספרים הגדולים ── */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatTile label="משך" value={formatDuration(session.durationSeconds)} />
        <StatTile label="נפח" value={formatVolume(totals.volumeKg)}>
          {deltaPercent !== null ? <DeltaChip percent={deltaPercent} /> : null}
        </StatTile>
        <StatTile
          label="סטים"
          value={String(totals.workSets)}
          sub={
            totals.warmupSets
              ? `${totals.totalSets} כולל ${setsText(totals.warmupSets)} חימום`
              : 'כולם סטי עבודה'
          }
        />
        <StatTile label="תרגילים" value={String(ordered.length)} sub={groupsText || undefined} />
      </div>

      {/*
        ── הקצב ──

        המספר הזה היה במסד מהיום הראשון ומעולם לא הוצג: לכל סט יש חותמת סיום.
        הוא הנתון היחיד שממשיך להיאסף גם כשטיימר המנוחה כבוי, ולכן דווקא מי
        שמודד מנוחה בשעון מקבל כאן את מה שהמסך לא הראה לו תוך כדי.

        "בין סטים" ולא "מנוחה", כי ההפרש כולל גם את הסט עצמו — ראה domain/pacing.
      */}
      {pacing.medianSeconds !== null ? (
        <section className="mt-3">
          <div className="card flex items-center gap-3 p-4">
            <Timer size={18} className="shrink-0 text-bone-500" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm text-bone-300">
              <span className="font-bold text-bone-50">זמן בין סטים של אותו תרגיל</span>
              <span className="text-bone-500"> · חציון של {pacing.sampleCount} זוגות</span>
            </p>
            <span dir="ltr" className="tnum shrink-0 text-lg font-extrabold text-bone-50">
              {formatClock(pacing.medianSeconds)}
            </span>
          </div>
          {pacing.breakCount > 0 ? (
            <p className="meta mt-1.5 px-1">
              {pacing.breakCount === 1 ? 'הפסקה אחת ארוכה לא נספרה' : `${pacing.breakCount} הפסקות ארוכות לא נספרו`}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* ── שיאים ── */}
      {sessionPrs.length ? (
        <section className="mt-6">
          <h3 className="meta mb-2">שיאים שנשברו</h3>
          <ul className="flex flex-col gap-2">
            {sessionPrs.map((pr) => {
              const ex = exerciseById.get(pr.exerciseId)
              const event: PrEvent = {
                exerciseId: pr.exerciseId,
                kind: pr.kind,
                value: pr.value,
                previous: null,
                weightKg: pr.weightKg,
                reps: pr.reps,
              }
              return (
                <li
                  key={`${pr.exerciseId}-${pr.kind}`}
                  className="card animate-rise flex items-center gap-3 border-pr-400/25 p-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pr-400/12 text-pr-400">
                    <Trophy size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-bone-50">
                      {ex?.name ?? 'תרגיל שהוסר'}
                    </p>
                    <p className="truncate text-sm text-pr-400">
                      {ex ? prHeadline(ex, event) : prLabel(pr.kind)}
                    </p>
                  </div>
                  <span className="meta shrink-0">{prLabel(pr.kind, ex?.metric)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {/* ── פירוט לפי תרגיל ── */}
      <section className="mt-6">
        <h3 className="meta mb-2">מה עשית</h3>
        {ordered.length === 0 ? (
          <EmptyState
            icon={<Dumbbell />}
            title="לא נרשם אף סט באימון הזה"
            hint="קורה. הפעם הבאה תיספר."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {ordered.map((id) => {
              const ex = exerciseById.get(id)
              const mode: WeightMode = ex?.weightMode ?? 'total'
              const metric = ex?.metric
              const all = setsByExercise.get(id) ?? []
              const work = workSets(all)
              const warmups = all.length - work.length
              const reps = work.reduce((n, s) => n + s.reps, 0)
              const volume = summarize(all, modeOf).volumeKg
              const rating = ratingByExercise.get(id)
              const prCount = prCountByExercise.get(id) ?? 0

              const prevWork = workSets(prevSetsByExercise.get(id) ?? [])
              const comparison = comparisonText(mode, work, prevWork, metric)

              const totalsLine = [
                setsText(work.length),
                repsText(reps, metric),
                volume > 0 ? formatVolume(volume) : null,
              ]
                .filter((p): p is string => p !== null)
                .join(' · ')

              return (
                <li key={id} className="card animate-rise p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-base font-bold text-bone-50">
                        {prCount > 0 ? (
                          <Trophy size={15} className="shrink-0 text-pr-400" />
                        ) : null}
                        <span className="truncate">{ex?.name ?? 'תרגיל שהוסר'}</span>
                      </p>
                      {ex ? <p className="meta mt-0.5">{ex.subTarget}</p> : null}
                    </div>
                    {rating ? (
                      <span
                        className={`shrink-0 rounded-pill border px-2.5 py-1 text-xs font-bold ${RATING_TONES[rating.rating]}`}
                      >
                        {RATING_LABELS[rating.rating]}
                        {rating.rir !== null ? ` · ${RIR_LABELS[rating.rir]}` : ''}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {all.map((s, i) => (
                      <SetChip key={s.id ?? `${id}-${i}`} set={s} mode={mode} metric={metric} />
                    ))}
                  </div>

                  <p className="mt-2.5 text-xs text-bone-400">
                    {totalsLine}
                    {warmups > 0 ? (
                      <span className="text-warmup-400"> · {setsText(warmups)} חימום, לא נספרו</span>
                    ) : null}
                  </p>

                  {comparison ? (
                    <p className="mt-2 border-t border-ink-800 pt-2 text-xs leading-relaxed text-bone-500">
                      פעם קודמת:{' '}
                      <span
                        className="tnum text-bone-400"
                        dir={mode === 'bodyweight' ? undefined : 'ltr'}
                      >
                        {setListText(prevWork, mode, metric)}
                      </span>
                      {' · '}
                      <span className="font-semibold text-bone-200">הפעם {comparison}</span>
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── החלפות ודילוגים ── */}
      {session.substitutions.length > 0 || session.skippedExerciseIds.length > 0 ? (
        <section className="mt-6">
          <h3 className="meta mb-2">שינויים מהתוכנית</h3>
          <ul className="card flex flex-col divide-y divide-ink-800 p-1">
            {session.substitutions.map((sub) => (
              <li
                key={`${sub.plannedExerciseId}-${sub.actualExerciseId}`}
                className="flex items-center gap-3 px-3 py-3"
              >
                <Shuffle size={16} className="shrink-0 text-flame-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-bone-200">
                    <span className="text-bone-500">החלפת: </span>
                    {exerciseById.get(sub.plannedExerciseId)?.name ?? sub.plannedExerciseId}
                    {' ← '}
                    <span className="font-bold text-bone-50">
                      {exerciseById.get(sub.actualExerciseId)?.name ?? sub.actualExerciseId}
                    </span>
                  </p>
                  <p className="meta mt-0.5">{SUB_REASONS[sub.reason]}</p>
                </div>
              </li>
            ))}
            {session.skippedExerciseIds.map((id) => (
              <li key={`skip-${id}`} className="flex items-center gap-3 px-3 py-3">
                <SkipForward size={16} className="shrink-0 text-bone-500" />
                <p className="min-w-0 flex-1 truncate text-sm text-bone-200">
                  <span className="text-bone-500">לא הספקת: </span>
                  {exerciseById.get(id)?.name ?? id}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── הערות ── */}
      {session.notes.trim() ? (
        <section className="mt-6">
          <h3 className="meta mb-2">הערות</h3>
          <div className="card flex gap-3 p-4">
            <StickyNote size={16} className="mt-0.5 shrink-0 text-bone-500" />
            <p className="min-w-0 flex-1 text-sm leading-relaxed whitespace-pre-wrap text-bone-200">
              {session.notes.trim()}
            </p>
          </div>
        </section>
      ) : null}

      {/* ── סיום ── */}
      <div className="mt-8 flex flex-col items-center gap-1">
        <Button variant="flame" size="hero" fullWidth onClick={goHome}>
          סיימנו
        </Button>
        <Link
          to={`/history/${session.id}`}
          className="mt-1 flex min-h-12 items-center justify-center gap-2 px-4 text-sm font-semibold text-bone-500 active:text-bone-200"
        >
          <History size={15} />
          צפה בהיסטוריה
        </Link>
      </div>
    </Screen>
  )
}
