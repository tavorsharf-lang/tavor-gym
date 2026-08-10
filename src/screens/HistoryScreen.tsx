import { useEffect, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ListFilter, Search, SearchX, X } from 'lucide-react'
import { getAllExercises, getBlocks, getRoutines, searchSessions } from '@/db/queries'
import type { Exercise, MuscleGroup, RoutineId, Session } from '@/db/types'
import { MUSCLE_GROUPS, MUSCLE_GROUP_ORDER } from '@/db/types'
import { formatVolume } from '@/domain/units'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { BottomSheet, EmptyState } from '@/components/ui'
import { SessionCard } from '@/components/history/SessionCard'

/**
 * היסטוריית האימונים.
 *
 * שלוש שכבות סינון שמצטברות: טקסט חופשי, שבב תוכנית/בלוק, ותרגיל בודד.
 * הכל נפתר ב-searchSessions דרך האינדקסים — המסך לא נוגע ב-setLogs.
 */

/** גובה כותרת המסך: safe-area + ריפוד + כפתור 44px */
const HEADER_BOTTOM = 'calc(var(--safe-t) + 4.25rem)'
/** תחתית שורת החיפוש הנעוצה — משם מתחילות כותרות החודשים */
const SEARCH_BOTTOM = 'calc(var(--safe-t) + 8rem)'

function normalize(text: string): string {
  return text.toLowerCase().replace(/[״׳"']/g, '').trim()
}

function countText(n: number, one: string, many: string): string {
  return n === 1 ? one : `${n} ${many}`
}

function monthKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}`
}

/** "אוגוסט 2026" */
function monthLabel(ts: number): string {
  const d = new Date(ts)
  return `${new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(d)} ${d.getFullYear()}`
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'flex min-h-12 shrink-0 items-center gap-1.5 rounded-pill border px-4 text-sm font-bold whitespace-nowrap transition-colors',
        active
          ? 'border-flame-500/45 bg-flame-500/12 text-flame-300'
          : 'border-ink-700 bg-ink-850 text-bone-400 active:bg-ink-800',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function HistoryScreen(): JSX.Element {
  const navigate = useNavigate()

  const [rawQuery, setRawQuery] = useState('')
  const [query, setQuery] = useState('')
  const [routineId, setRoutineId] = useState<RoutineId | null>(null)
  const [blockId, setBlockId] = useState<string | null>(null)
  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')

  // השהיה קצרה כדי שכל הקשה לא תריץ שאילתה חדשה על כל האימונים
  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(rawQuery), 200)
    return () => window.clearTimeout(handle)
  }, [rawQuery])

  const routines = useLiveQuery(() => getRoutines(), [], [])
  const blocks = useLiveQuery(() => getBlocks(), [], [])
  const exercises = useLiveQuery(() => getAllExercises(), [], [])

  const sessions = useLiveQuery<Session[] | undefined>(
    () => searchSessions({ routineId, blockId, exerciseId, query }),
    [routineId, blockId, exerciseId, query]
  )

  const routineNames = useMemo(() => new Map(routines.map((r) => [r.id, r.name])), [routines])
  const blockNames = useMemo(() => new Map(blocks.map((b) => [b.id, b.name])), [blocks])
  const selectedExercise = exercises.find((e) => e.id === exerciseId) ?? null

  const months = useMemo(() => {
    const out: { key: string; label: string; items: Session[] }[] = []
    for (const s of sessions ?? []) {
      const key = monthKey(s.startedAt)
      const last = out[out.length - 1]
      if (last && last.key === key) last.items.push(s)
      else out.push({ key, label: monthLabel(s.startedAt), items: [s] })
    }
    return out
  }, [sessions])

  const totals = useMemo(() => {
    let sets = 0
    let volume = 0
    for (const s of sessions ?? []) {
      sets += s.totalSets
      volume += s.totalVolumeKg
    }
    return { sets, volume }
  }, [sessions])

  const pickerGroups = useMemo(() => {
    const q = normalize(pickerQuery)
    const byGroup = new Map<MuscleGroup, Exercise[]>()
    for (const ex of exercises) {
      const hit =
        !q ||
        normalize(ex.name).includes(q) ||
        normalize(ex.nameEn ?? '').includes(q) ||
        normalize(ex.subTarget).includes(q)
      if (!hit) continue
      const list = byGroup.get(ex.muscleGroup)
      if (list) list.push(ex)
      else byGroup.set(ex.muscleGroup, [ex])
    }
    return MUSCLE_GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
      group: g,
      items: byGroup.get(g) ?? [],
    }))
  }, [exercises, pickerQuery])

  const hasChipFilter = routineId !== null || blockId !== null || exerciseId !== null
  const isFiltered = hasChipFilter || query.trim().length > 0
  const loading = sessions === undefined

  const openPicker = () => {
    setPickerQuery('')
    setPickerOpen(true)
  }

  return (
    <Screen>
      <ScreenHeader title="היסטוריה" />

      <div
        className="sticky z-20 -mx-4 bg-ink-950/95 px-4 pb-3 backdrop-blur-xl"
        style={{ top: HEADER_BOTTOM }}
      >
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-bone-600"
            aria-hidden="true"
          />
          <input
            type="text"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="חפש תרגיל, תוכנית או בלוק"
            aria-label="חיפוש באימונים"
            enterKeyHint="search"
            className="h-12 w-full rounded-2xl border border-ink-700 bg-ink-850 ps-10 pe-11 text-bone-50 placeholder:text-bone-600 focus:border-flame-500/50 focus:outline-none"
          />
          {rawQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setRawQuery('')}
              aria-label="נקה חיפוש"
              className="absolute end-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-bone-500 active:bg-ink-800"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="scroll-touch -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip
          active={!hasChipFilter}
          onClick={() => {
            setRoutineId(null)
            setBlockId(null)
            setExerciseId(null)
          }}
        >
          הכל
        </Chip>

        {routines.map((r) => (
          <Chip
            key={r.id}
            active={routineId === r.id}
            onClick={() => setRoutineId(routineId === r.id ? null : r.id)}
          >
            {r.name}
          </Chip>
        ))}

        {blocks.map((b) => (
          <Chip
            key={b.id}
            active={blockId === b.id}
            onClick={() => setBlockId(blockId === b.id ? null : b.id)}
          >
            {b.name}
          </Chip>
        ))}

        {selectedExercise ? (
          <div className="flex min-h-12 shrink-0 items-center rounded-pill border border-flame-500/45 bg-flame-500/12 ps-4 pe-1 text-flame-300">
            <button
              type="button"
              onClick={openPicker}
              className="text-sm font-bold whitespace-nowrap"
            >
              {selectedExercise.name}
            </button>
            <button
              type="button"
              onClick={() => setExerciseId(null)}
              aria-label={`הסר סינון לפי ${selectedExercise.name}`}
              className="ms-1 flex size-10 items-center justify-center rounded-full active:bg-flame-500/20"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <Chip active={exerciseId !== null} onClick={openPicker}>
            <ListFilter size={16} aria-hidden="true" />
            לפי תרגיל
          </Chip>
        )}
      </div>

      {!loading && (sessions?.length ?? 0) > 0 && (
        <p className="mb-3 text-xs text-bone-500">
          <span className="tnum font-semibold text-bone-400">
            {countText(sessions?.length ?? 0, 'אימון אחד', 'אימונים')}
          </span>
          <span aria-hidden="true"> · </span>
          <span className="tnum">{countText(totals.sets, 'סט אחד', 'סטים')}</span>
          <span aria-hidden="true"> · </span>
          <span className="tnum">{formatVolume(totals.volume)}</span>
        </p>
      )}

      {loading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-[5.5rem] animate-pulse opacity-40" />
          ))}
        </div>
      ) : months.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title={isFiltered ? 'אין אימון שתואם את הסינון' : 'עוד אין כאן היסטוריה'}
          hint={
            isFiltered
              ? 'נסה לוותר על אחד השבבים, או לחפש מילה קצרה יותר.'
              : 'האימון הראשון שתסגור ינחת כאן — עם כל סט, כל משקל וכל דירוג.'
          }
        />
      ) : (
        months.map((month) => (
          <section key={month.key}>
            <h2
              className="sticky z-10 -mx-4 flex items-center gap-3 bg-ink-950/95 px-4 py-2 backdrop-blur-xl"
              style={{ top: SEARCH_BOTTOM }}
            >
              <span className="meta text-bone-400">{month.label}</span>
              <span className="h-px flex-1 bg-ink-800" aria-hidden="true" />
              <span className="meta tnum">{month.items.length}</span>
            </h2>
            <div className="mb-2 flex flex-col gap-2">
              {month.items.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  routineName={
                    (s.routineId ? routineNames.get(s.routineId) : undefined) ?? 'אימון חופשי'
                  }
                  blockNames={s.blockIds.map((id) => blockNames.get(id) ?? id)}
                  onTap={() => navigate(`/history/${s.id}`)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="סינון לפי תרגיל">
        <div className="sticky top-0 z-10 -mx-5 bg-ink-900 px-5 pb-3">
          <input
            type="text"
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
            placeholder="חפש תרגיל"
            aria-label="חיפוש תרגיל"
            className="h-12 w-full rounded-2xl border border-ink-700 bg-ink-850 px-4 text-bone-50 placeholder:text-bone-600 focus:border-flame-500/50 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setExerciseId(null)
            setPickerOpen(false)
          }}
          className="flex min-h-12 w-full items-center justify-between rounded-xl px-2 text-start text-sm font-bold text-bone-200 active:bg-ink-800"
        >
          כל התרגילים
          {exerciseId === null && <Check size={18} className="text-flame-400" />}
        </button>

        {pickerGroups.length === 0 ? (
          <EmptyState title="אין תרגיל בשם הזה" hint="נסה שם חלקי, או את השם באנגלית." />
        ) : (
          pickerGroups.map(({ group, items }) => (
            <div key={group} className="mt-3">
              <p className="meta mb-1 px-2">{MUSCLE_GROUPS[group].label}</p>
              <div className="flex flex-col">
                {items.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setExerciseId(ex.id)
                      setPickerOpen(false)
                    }}
                    className="flex min-h-12 items-center gap-2 rounded-xl px-2 py-1 text-start active:bg-ink-800"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-bone-50">
                        {ex.name}
                      </span>
                      <span className="block truncate text-xs text-bone-500">{ex.subTarget}</span>
                    </span>
                    {exerciseId === ex.id && (
                      <Check size={18} className="shrink-0 text-flame-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </BottomSheet>
    </Screen>
  )
}
