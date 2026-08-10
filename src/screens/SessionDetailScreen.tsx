import { useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeftRight, ChevronLeft, SkipForward, Star, StickyNote, Trash2 } from 'lucide-react'
import { db } from '@/db/db'
import {
  getAllExercises,
  getAllPrs,
  getBlocks,
  getRatingsForSession,
  getRoutines,
  getSession,
  getSetsForSession,
} from '@/db/queries'
import type {
  Exercise,
  ExerciseMetric,
  ExerciseRating,
  PersonalRecord,
  PrKind,
  Rating,
  Rir,
  Session,
  SetLog,
  WeightMode,
} from '@/db/types'
import { RATING_LABELS, RATING_TONES, RIR_LABELS } from '@/db/types'
import { formatDuration, formatSetShort, formatVolume } from '@/domain/units'
import { summarize, weightModeLookup } from '@/domain/volume'
import { prLabel, rebuildPrs } from '@/domain/prs'
import { formatDateLong, formatTime } from '@/lib/dates'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { BottomSheet, Button, EmptyState, toast } from '@/components/ui'

/**
 * הרשומה המלאה של אימון אחד — כל סט, כל דירוג, כל שינוי.
 * זה המסך שאליו חוזרים כדי לענות על "מה עשיתי בפעם שעברה", ולכן הוא צפוף
 * בכוונה: שום מספר לא מוסתר מאחורי הרחבה.
 */

const EPS = 1e-6

interface Detail {
  session: Session
  sets: SetLog[]
  ratings: ExerciseRating[]
  exercises: Exercise[]
  /** רק שיאים שנקבעו באימון הזה */
  prs: PersonalRecord[]
  routineName: string
  blockNames: string[]
}

interface SetRow {
  key: string
  ordinal: number
  set: SetLog
  prKinds: PrKind[]
}

interface ExerciseBlock {
  key: string
  exerciseId: string
  name: string
  subTitle: string
  exists: boolean
  weightMode: WeightMode
  /** חסר = חזרות. פלאנק מוצג בשניות. */
  metric?: ExerciseMetric
  warmups: SetRow[]
  work: SetRow[]
  volumeKg: number
  rating: ExerciseRating | null
  volumePr: boolean
}

/** "בינוני · RIR 2" · "קשה · כשל" */
function ratingText(rating: Rating, rir: Rir | null): string {
  const base = RATING_LABELS[rating]
  if (rir === null) return base
  return rir === 0 ? `${base} · כשל` : `${base} · RIR ${RIR_LABELS[rir]}`
}

function Stat({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-1 py-3">
      <span className="tnum text-center text-base leading-none font-extrabold text-bone-50">
        {children}
      </span>
      <span className="meta">{label}</span>
    </div>
  )
}

function buildBlocks(detail: Detail): ExerciseBlock[] {
  const { session, sets, ratings, exercises, prs } = detail
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const modeOf = weightModeLookup(exercises)
  const ratingOf = new Map(ratings.map((r) => [r.exerciseId, r]))

  const setsOf = new Map<string, SetLog[]>()
  for (const s of sets) {
    const list = setsOf.get(s.exerciseId)
    if (list) list.push(s)
    else setsOf.set(s.exerciseId, [s])
  }

  const order = [...new Set(session.actualOrder)]
  // ביטוח: תרגיל שיש לו סטים אבל נעדר מהסדר עדיין חייב להופיע
  for (const id of setsOf.keys()) if (!order.includes(id)) order.push(id)

  return order.map((exerciseId, index) => {
    const exercise = byId.get(exerciseId)
    const weightMode = exercise?.weightMode ?? 'total'
    const metric = exercise?.metric
    // מיון לפי זמן הביצוע בלבד. setIndex ממוספר לכל פריט בתור בנפרד, ולכן
    // תרגיל שהופיע פעמיים באימון (אחרי החלפה, או שנוסף שוב מהתור) מייצר שתי
    // סדרות 0,1,2 — ומיון לפיו היה משזר אותן לסדר שלא קרה מעולם.
    const mine = (setsOf.get(exerciseId) ?? [])
      .slice()
      .sort((a, b) => a.completedAt - b.completedAt)

    const stars = new Map<SetLog, PrKind[]>()
    let volumePr = false
    for (const pr of prs) {
      if (pr.exerciseId !== exerciseId) continue
      if (pr.kind === 'maxSessionVolume') {
        volumePr = true
        continue
      }
      const match = mine.find(
        (s) =>
          s.type === 'work' &&
          (pr.weightKg === null || Math.abs(s.weightKg - pr.weightKg) < EPS) &&
          (pr.reps === null || s.reps === pr.reps)
      )
      if (!match) continue
      const list = stars.get(match)
      if (list) list.push(pr.kind)
      else stars.set(match, [pr.kind])
    }

    const toRow = (list: SetLog[]): SetRow[] =>
      list.map((set, i) => ({
        key: `${exerciseId}-${set.id ?? set.setIndex}-${i}`,
        ordinal: i + 1,
        set,
        prKinds: stars.get(set) ?? [],
      }))

    const { volumeKg } = summarize(mine, modeOf)

    return {
      key: `${exerciseId}-${index}`,
      exerciseId,
      name: exercise?.name ?? 'תרגיל שהוסר מהקטלוג',
      subTitle: [exercise?.subTarget, weightMode === 'perSide' ? 'כל צד' : null]
        .filter(Boolean)
        .join(' · '),
      exists: exercise !== undefined,
      weightMode,
      metric,
      warmups: toRow(mine.filter((s) => s.type === 'warmup')),
      work: toRow(mine.filter((s) => s.type === 'work')),
      volumeKg,
      rating: ratingOf.get(exerciseId) ?? null,
      volumePr,
    }
  })
}

export function SessionDetailScreen(): JSX.Element {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const detail = useLiveQuery<Detail | null>(async () => {
    if (!sessionId) return null
    const session = await getSession(sessionId)
    if (!session) return null
    const [sets, ratings, exercises, allPrs, routines, blocks] = await Promise.all([
      getSetsForSession(sessionId),
      getRatingsForSession(sessionId),
      getAllExercises(true),
      getAllPrs(),
      getRoutines(),
      getBlocks(),
    ])
    const blockById = new Map(blocks.map((b) => [b.id, b.name]))
    return {
      session,
      sets,
      ratings,
      exercises,
      prs: allPrs.filter((p) => p.sessionId === session.id),
      routineName:
        (session.routineId ? routines.find((r) => r.id === session.routineId)?.name : undefined) ??
        'אימון חופשי',
      blockNames: session.blockIds.map((id) => blockById.get(id) ?? id),
    }
  }, [sessionId])

  const blocks = useMemo(() => (detail ? buildBlocks(detail) : []), [detail])
  const exerciseNames = useMemo(
    () => new Map((detail?.exercises ?? []).map((e) => [e.id, e.name])),
    [detail]
  )

  async function handleDelete(): Promise<void> {
    if (!sessionId) return
    setDeleting(true)
    setConfirmOpen(false)
    try {
      await db.transaction('rw', db.sessions, db.setLogs, db.ratings, db.prs, db.exercises, async () => {
        await db.setLogs.where('sessionId').equals(sessionId).delete()
        await db.ratings.where('sessionId').equals(sessionId).delete()
        await db.sessions.delete(sessionId)
        // בונים את טבלת השיאים מחדש ממה שנשאר, כדי ששיא לא יצביע על אימון מחוק
        const [allExercises, allSets] = await Promise.all([
          db.exercises.toArray(),
          db.setLogs.toArray(),
        ])
        const fresh = rebuildPrs(allExercises, allSets)
        await db.prs.clear()
        if (fresh.length > 0) await db.prs.bulkPut(fresh)
      })
      toast('האימון נמחק', { tone: 'warn' })
      navigate('/history', { replace: true })
    } catch {
      setDeleting(false)
      toast('לא הצלחתי למחוק את האימון')
    }
  }

  if (detail === undefined || deleting) {
    return (
      <Screen dock={false}>
        <ScreenHeader title="אימון" />
        <div className="flex flex-col gap-3" aria-hidden="true">
          <div className="card h-20 animate-pulse opacity-40" />
          <div className="card h-40 animate-pulse opacity-40" />
        </div>
      </Screen>
    )
  }

  if (detail === null) {
    return (
      <Screen dock={false}>
        <ScreenHeader title="אימון" />
        <EmptyState
          title="האימון הזה כבר לא כאן"
          hint="אולי נמחק, אולי הקישור ישן. ההיסטוריה המלאה מחכה במסך הקודם."
          action={
            <Button variant="ghost" onClick={() => navigate('/history', { replace: true })}>
              לרשימת האימונים
            </Button>
          }
        />
      </Screen>
    )
  }

  const { session, routineName, blockNames } = detail
  const changed = session.substitutions.length > 0 || session.skippedExerciseIds.length > 0
  const nameOf = (id: string): string => exerciseNames.get(id) ?? 'תרגיל שהוסר'

  return (
    <Screen dock={false}>
      <ScreenHeader
        title={routineName}
        subtitle={formatDateLong(session.startedAt)}
        fallback="/history"
      />

      {blockNames.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {blockNames.map((name) => (
            <span
              key={name}
              className="rounded-pill border border-ink-700 bg-ink-800 px-2.5 py-1 text-xs font-semibold text-bone-400"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="card animate-rise mb-4 grid grid-cols-4 [&>*+*]:border-s [&>*+*]:border-ink-800">
        <Stat label="משך">{formatDuration(session.durationSeconds)}</Stat>
        <Stat label="נפח">{formatVolume(session.totalVolumeKg)}</Stat>
        <Stat label="סטי עבודה">{session.totalWorkSets}</Stat>
        <Stat label="שעות">
          <span dir="ltr">
            {session.endedAt > 0
              ? `${formatTime(session.startedAt)}–${formatTime(session.endedAt)}`
              : formatTime(session.startedAt)}
          </span>
        </Stat>
      </div>

      <div className="flex flex-col gap-3">
        {blocks.map((block) => (
          <section key={block.key} className="card p-3.5">
            <button
              type="button"
              disabled={!block.exists}
              onClick={() => navigate(`/exercise/${block.exerciseId}`)}
              className="flex w-full items-center gap-2 text-start disabled:opacity-70"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-extrabold text-bone-50">
                  {block.name}
                </span>
                {block.subTitle && (
                  <span className="block truncate text-xs text-bone-500">{block.subTitle}</span>
                )}
              </span>
              {block.exists && (
                <ChevronLeft size={18} className="shrink-0 text-bone-600" aria-hidden="true" />
              )}
            </button>

            {block.warmups.length + block.work.length === 0 ? (
              <p className="mt-2 text-xs text-bone-600">לא נרשם כאן אף סט</p>
            ) : (
              <div className="mt-2.5">
                {block.warmups.length > 0 && (
                  <ul className="flex flex-col">
                    {block.warmups.map((row) => (
                      <li key={row.key} className="flex items-center gap-3 py-1.5 text-warmup-400">
                        <span className="tnum flex size-6 shrink-0 items-center justify-center rounded-md border border-warmup-400/25 bg-warmup-400/10 text-[0.6875rem] font-bold">
                          {row.ordinal}
                        </span>
                        <span
                          className="tnum text-[0.9375rem] font-semibold"
                          dir={block.weightMode === 'bodyweight' ? undefined : 'ltr'}
                        >
                          {formatSetShort(row.set.weightKg, row.set.reps, block.weightMode, block.metric)}
                        </span>
                        <span className="ms-auto rounded-pill border border-warmup-400/25 bg-warmup-400/10 px-2 py-0.5 text-[0.625rem] font-bold">
                          חימום
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {block.warmups.length > 0 && block.work.length > 0 && (
                  <div className="my-1.5 h-px bg-ink-800" aria-hidden="true" />
                )}

                {block.work.length > 0 && (
                  <ul className="flex flex-col">
                    {block.work.map((row) => (
                      <li key={row.key} className="flex items-center gap-3 py-1.5">
                        <span className="tnum flex size-6 shrink-0 items-center justify-center rounded-md bg-ink-800 text-[0.6875rem] font-bold text-bone-500">
                          {row.ordinal}
                        </span>
                        <span
                          className="tnum text-[0.9375rem] font-bold text-bone-50"
                          dir={block.weightMode === 'bodyweight' ? undefined : 'ltr'}
                        >
                          {formatSetShort(row.set.weightKg, row.set.reps, block.weightMode, block.metric)}
                        </span>
                        {row.prKinds.length > 0 && (
                          <span className="animate-stamp ms-auto flex items-center gap-1 text-pr-400">
                            <Star size={13} fill="currentColor" aria-hidden="true" />
                            <span className="text-[0.6875rem] font-bold">
                              {prLabel(row.prKinds[0], block.metric)}
                            </span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-ink-800 pt-2.5">
              <span className="tnum text-xs text-bone-500">
                נפח {formatVolume(block.volumeKg)}
              </span>
              {block.rating && (
                <span
                  className={[
                    'rounded-pill border px-2.5 py-0.5 text-[0.6875rem] font-bold',
                    RATING_TONES[block.rating.rating],
                  ].join(' ')}
                >
                  {ratingText(block.rating.rating, block.rating.rir)}
                </span>
              )}
              {block.volumePr && (
                <span className="flex items-center gap-1 rounded-pill border border-pr-400/35 bg-pr-400/10 px-2.5 py-0.5 text-[0.6875rem] font-bold text-pr-400">
                  <Star size={11} fill="currentColor" aria-hidden="true" />
                  שיא נפח
                </span>
              )}
            </div>
          </section>
        ))}
      </div>

      {changed && (
        <section className="card mt-4 p-3.5">
          <h2 className="mb-2.5 text-sm font-extrabold text-bone-200">מה השתנה</h2>
          <ul className="flex flex-col gap-2.5">
            {session.substitutions.map((sub) => (
              <li
                key={`${sub.plannedExerciseId}-${sub.actualExerciseId}`}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-bone-400"
              >
                <ArrowLeftRight
                  size={15}
                  className="mt-1 shrink-0 text-flame-400"
                  aria-hidden="true"
                />
                <span>
                  במקום <span className="font-bold text-bone-200">{nameOf(sub.plannedExerciseId)}</span>{' '}
                  עשית <span className="font-bold text-bone-200">{nameOf(sub.actualExerciseId)}</span>
                  <span className="text-bone-500">
                    {sub.reason === 'occupied' ? ' — המתקן היה תפוס' : ' — בחירה שלך'}
                  </span>
                </span>
              </li>
            ))}
            {session.skippedExerciseIds.map((id) => (
              <li key={id} className="flex items-start gap-2.5 text-sm leading-relaxed text-bone-400">
                <SkipForward size={15} className="mt-1 shrink-0 text-bone-600" aria-hidden="true" />
                <span>
                  דילגת על <span className="font-bold text-bone-200">{nameOf(id)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {session.notes.trim().length > 0 && (
        <section className="card mt-4 p-3.5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-bone-200">
            <StickyNote size={15} className="text-flame-400" aria-hidden="true" />
            הערות
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-bone-300">
            {session.notes}
          </p>
        </section>
      )}

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="mx-auto mt-8 flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-hard-400/80 active:bg-hard-400/10"
      >
        <Trash2 size={16} aria-hidden="true" />
        מחק אימון
      </button>

      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="למחוק את האימון?">
        <p className="pb-4 text-sm leading-relaxed text-bone-400">
          כל הסטים והדירוגים של {formatDateLong(session.startedAt)} יימחקו מהמכשיר. השיאים יחושבו
          מחדש מכל מה שנשאר, כדי שהם יישארו נכונים. אין דרך לבטל.
        </p>
        <div className="flex flex-col gap-2 pb-2">
          <Button variant="danger" size="lg" fullWidth onClick={() => void handleDelete()}>
            כן, מחק את האימון
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => setConfirmOpen(false)}>
            השאר אותו
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  )
}
