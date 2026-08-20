import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Plus, Search, X } from 'lucide-react'
import { getCatalogEntries } from '@/db/catalog'
import type { CatalogEntry } from '@/db/catalog'
import { getLastPerformedMap } from '@/db/queries'
import type { Exercise, MuscleGroup } from '@/db/types'
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, MUSCLE_GROUP_BY_SIZE } from '@/db/types'
import { distinguisher, duplicateNames } from '@/domain/naming'
import { LAYOFF_DAYS } from '@/domain/recommendation'
import { formatSetShort } from '@/domain/units'
import { daysSince, formatRelativeDay } from '@/lib/dates'
import { normalize } from '@/lib/text'
import { useNow } from '@/hooks/useNow'
import { useBasket } from '@/state/builderBasket'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { EmptyState } from '@/components/ui'
import { VideoThumb } from '@/components/media/VideoThumb'
import { BasketBar } from '@/components/builder/BasketBar'

/**
 * בניית אימון — התרגילים של שריר אחד.
 *
 * הסדר הוא לב המסך: מה שלא בוצע מעולם קודם, ואחריו מהישן לחדש. זו בדיוק
 * הסיבה שנכנסים לכאן — לתפוס את התרגיל שנשכח — והמיון עושה את העבודה במקום
 * לדרוש סריקה של הרשימה.
 *
 * הרשימה כוללת גם את תרגילי המאגר שאין להם עדיין כרטיס. הם מסומנים, ובחירה
 * שלהם יוצרת להם כרטיס בשליחה (`ensureTrainable`) ולא כאן — כך לחיצה על שורה
 * לא כותבת למסד, והסל נשאר הפיך עד הרגע האחרון.
 */

function isMuscleGroup(value: string | undefined): value is MuscleGroup {
  return value !== undefined && (MUSCLE_GROUP_BY_SIZE as string[]).includes(value)
}

/** מה שממיין: מעולם קודם, אחר כך מהישן לחדש */
function stalenessOf(entry: CatalogEntry, lastAt: ReadonlyMap<string, number>): number {
  const at = entry.exercise ? lastAt.get(entry.exercise.id) : undefined
  return at ?? -Infinity
}

export function BuilderMuscleScreen(): JSX.Element {
  const { muscleGroup } = useParams<{ muscleGroup: string }>()
  const now = useNow()
  const [query, setQuery] = useState('')

  const entries = useLiveQuery(() => getCatalogEntries(), [], [] as CatalogEntry[])
  // פעם אחת לרשימה — הפונקציה סורקת את כל טבלת הסטים
  const lastPerformed = useLiveQuery(() => getLastPerformedMap(), [], new Map())

  const items = useBasket((s) => s.items)
  const toggle = useBasket((s) => s.toggle)

  const group = isMuscleGroup(muscleGroup) ? muscleGroup : null

  const catalogExercises = useMemo(
    () => entries.map((e) => e.exercise).filter((e): e is Exercise => e !== null),
    [entries]
  )
  const duplicates = useMemo(() => duplicateNames(catalogExercises), [catalogExercises])

  const list = useMemo(() => {
    if (!group) return []
    const q = normalize(query)
    const lastAt = new Map([...lastPerformed].map(([id, l]) => [id, l.at]))
    return entries
      .filter((e) => e.muscleGroup === group)
      .filter(
        (e) =>
          !q ||
          normalize(e.name).includes(q) ||
          normalize(e.nameEn ?? '').includes(q) ||
          normalize(e.exercise?.subTarget ?? '').includes(q)
      )
      .sort(
        (a, b) =>
          stalenessOf(a, lastAt) - stalenessOf(b, lastAt) || a.name.localeCompare(b.name, 'he')
      )
  }, [entries, group, lastPerformed, query])

  if (!group) return <Navigate to="/builder" replace />

  const selected = new Set(items.map((i) => i.id))

  return (
    <Screen dock={false}>
      <ScreenHeader
        title={MUSCLE_GROUPS[group].label}
        subtitle="הכי מזמן שלא עשית — למעלה"
        fallback="/builder"
      />

      <div className="relative mb-5">
        <Search
          size={18}
          className="pointer-events-none absolute inset-y-0 my-auto text-bone-600"
          style={{ insetInlineStart: '0.875rem' }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`חיפוש בתרגילי ${MUSCLE_GROUPS[group].label}`}
          aria-label="חיפוש תרגיל"
          className="h-13 w-full rounded-card border border-ink-700 bg-ink-900/70 pe-4 ps-11 text-bone-50 outline-none transition-colors placeholder:text-bone-500 focus:border-flame-500/60"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="נקה חיפוש"
            className="absolute inset-y-0 my-auto flex size-11 items-center justify-center rounded-full text-bone-500 active:bg-ink-800"
            style={{ insetInlineEnd: '0.5rem' }}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="לא נמצא תרגיל"
          hint={
            query
              ? `אין תרגיל ל${MUSCLE_GROUPS[group].label} שמתאים ל"${query}".`
              : `אין עדיין תרגילים ל${MUSCLE_GROUPS[group].label}. אפשר להוסיף במסך התרגילים.`
          }
        />
      ) : (
        <ul className="card divide-y divide-ink-800/70 overflow-hidden">
          {list.map((entry) => (
            <li key={entry.id}>
              <ExerciseRow
                entry={entry}
                duplicates={duplicates}
                last={entry.exercise ? lastPerformed.get(entry.exercise.id) : undefined}
                now={now}
                picked={selected.has(entry.id)}
                onToggle={() =>
                  toggle({
                    id: entry.id,
                    name: entry.name,
                    muscleGroup: entry.muscleGroup,
                    needsCatalogEntry: entry.exercise === null,
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}

      <BasketBar />
    </Screen>
  )
}

/**
 * שורת תרגיל.
 *
 * כל השורה היא כפתור הבחירה — לא כפתור נפרד בקצה. הבחירה היא הפעולה היחידה
 * שעושים כאן, ושורה שלוחצים עליה כדי לנווט הייתה מכריחה לכוון לריבוע קטן
 * ביד אחת בזמן שהשנייה מחזיקה משקולת.
 *
 * תג "הפסקה ארוכה" מופיע מעל שלושה שבועות, כי בדיוק מהשלב הזה מנוע ההמלצות
 * מתחיל להוריד את משקל הפתיחה. המסך הזה מכוון מטבעו לתרגילים הישנים ביותר,
 * ולכן זה המקום שבו האזהרה הזו הכי נדרשת.
 */
function ExerciseRow({
  entry,
  duplicates,
  last,
  now,
  picked,
  onToggle,
}: {
  entry: CatalogEntry
  duplicates: ReadonlySet<string>
  last: { weightKg: number; reps: number; at: number; sets: number } | undefined
  now: number
  picked: boolean
  onToggle: () => void
}): JSX.Element {
  const ex = entry.exercise
  const apart = ex ? distinguisher(ex, duplicates) : null
  const layoff = last !== undefined && daysSince(last.at, now) >= LAYOFF_DAYS

  return (
    <button
      type="button"
      aria-pressed={picked}
      onClick={onToggle}
      className={[
        'flex w-full items-center gap-3 p-3 text-start transition-colors',
        picked ? 'bg-flame-500/10' : 'active:bg-ink-800',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors',
          picked
            ? 'border-flame-500/50 bg-flame-500/20 text-flame-300'
            : 'border-ink-700 text-bone-600',
        ].join(' ')}
      >
        {picked ? <Check size={16} /> : <Plus size={16} />}
      </span>

      <VideoThumb exerciseId={ex?.id ?? entry.id} libraryId={ex?.libraryId} size="sm" />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-bold text-bone-50">{entry.name}</span>
        <span className="meta mt-0.5 flex items-baseline gap-1.5">
          {apart ? <span className="shrink-0 font-bold text-bone-400">{apart}</span> : null}
          <span className="truncate">
            {ex
              ? `${ex.subTarget} · ${EQUIPMENT_LABELS[ex.equipment]}`
              : `${entry.library?.videos.length ?? 0} סרטוני הסבר · מהמאגר`}
          </span>
        </span>
      </span>

      <span className="shrink-0 text-end">
        {ex ? (
          last ? (
            <>
              <span dir="ltr" className="tnum block text-sm font-extrabold text-bone-200">
                {formatSetShort(last.weightKg, last.reps, ex.weightMode, ex.metric)}
              </span>
              <span
                className={['meta mt-0.5 block', layoff ? 'text-flame-300' : ''].join(' ')}
              >
                {formatRelativeDay(last.at, now)}
              </span>
            </>
          ) : (
            <span className="text-xs font-bold text-flame-300">עוד לא בוצע</span>
          )
        ) : (
          <span className="meta">חדש</span>
        )}
      </span>
    </button>
  )
}
