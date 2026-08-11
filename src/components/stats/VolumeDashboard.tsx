import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, Flame, Minus } from 'lucide-react'
import { getAllExercises, getSessionsSince, hasAnyFinishedSession } from '@/db/queries'
import type { GroupVolume, WeeklyBreakdown } from '@/domain/stats'
import { compareWeeks, emptyGroupVolumes, weeklyBreakdown } from '@/domain/stats'
import { formatVolume } from '@/domain/units'
import { MS_DAY, startOfWeek } from '@/lib/dates'
import { EmptyState } from '@/components/ui'
import { GroupBarChart, TrendChart } from '@/components/charts/lazy'

/**
 * לוח הנפח השבועי.
 *
 * המטרה היחידה שלו: לתפוס קבוצת שריר שנשמטה. לכן הרשימה מציגה את *כל*
 * הקבוצות, גם את אלה שעומדות על אפס — קבוצה שנעלמת מהמסך היא בדיוק זו
 * שממשיכים לשכוח.
 */

type RangeKey = 'this' | 'last' | 'four'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'this', label: 'השבוע' },
  { key: 'last', label: 'שבוע שעבר' },
  { key: 'four', label: '4 שבועות' },
]

/** אינדקסים בתוך שרשרת השבועות (0 = הישן ביותר, 7 = השבוע הנוכחי) */
const RANGE_WEEKS: Record<RangeKey, { current: number[]; previous: number[] }> = {
  this: { current: [7], previous: [6] },
  last: { current: [6], previous: [5] },
  four: { current: [4, 5, 6, 7], previous: [0, 1, 2, 3] },
}

const COPY: Record<RangeKey, { noun: string; versus: string; sparkTitle: string }> = {
  this: { noun: 'השבוע', versus: 'מול שבוע שעבר', sparkTitle: 'נפח שבועי — 8 שבועות אחרונים' },
  last: {
    noun: 'בשבוע שעבר',
    versus: 'מול השבוע שלפניו',
    sparkTitle: 'נפח שבועי — 8 שבועות אחרונים',
  },
  four: {
    noun: 'ב-4 השבועות האחרונים',
    versus: 'מול 4 השבועות שלפני',
    sparkTitle: 'נפח שבועי — 8 שבועות אחרונים',
  },
}

const WEEKS_BACK = 8

/** תחילת השבוע הבא. +8 ימים ואז יישור, כדי ששעון קיץ לא יזיז את הגבול. */
function nextWeekStart(weekStart: number): number {
  return startOfWeek(weekStart + 8 * MS_DAY)
}

/** תחילת השבוע הקודם. −2 ימים בדיוק מאותה סיבה — יום אחד עלול לא לחצות את הגבול. */
function previousWeekStart(weekStart: number): number {
  return startOfWeek(weekStart - 2 * MS_DAY)
}

/** שרשרת תחילות שבוע, מהישן לחדש */
function weekChain(latest: number, count: number): number[] {
  const out: number[] = []
  let cur = latest
  for (let i = 0; i < count; i += 1) {
    out.unshift(cur)
    cur = previousWeekStart(cur)
  }
  return out
}

/** "5.8" — תווית קצרה מספיק לשמונה נקודות על ציר אחד */
function weekLabel(weekStart: number): string {
  const d = new Date(weekStart)
  return `${d.getDate()}.${d.getMonth() + 1}`
}

/** מאחד כמה שבועות לטווח אחד, בלי לגעת בחישוב הנפח עצמו */
function mergeWeeks(weeks: readonly WeeklyBreakdown[]): WeeklyBreakdown {
  if (weeks.length === 1) return weeks[0]
  const byGroup: GroupVolume[] = emptyGroupVolumes()
  const indexOf = new Map(byGroup.map((g, i) => [g.group, i]))
  let totalVolumeKg = 0
  let totalWorkSets = 0
  for (const week of weeks) {
    totalVolumeKg += week.totalVolumeKg
    totalWorkSets += week.totalWorkSets
    for (const g of week.byGroup) {
      const i = indexOf.get(g.group)
      if (i === undefined) continue
      byGroup[i].volumeKg += g.volumeKg
      byGroup[i].workSets += g.workSets
      byGroup[i].sessions += g.sessions
    }
  }
  return {
    weekStart: weeks[weeks.length - 1].weekStart,
    totalVolumeKg,
    totalWorkSets,
    byGroup,
  }
}

function Stat({ value, label }: { value: string; label: string }): JSX.Element {
  return (
    <div className="card flex flex-col items-center justify-center gap-1.5 px-2 py-3">
      <span className="numeral-hero tnum text-xl text-bone-50">{value}</span>
      <span className="meta">{label}</span>
    </div>
  )
}

function DeltaChip({ deltaPct, hasCurrent }: { deltaPct: number | null; hasCurrent: boolean }): JSX.Element {
  if (deltaPct === null) {
    return (
      <span className="rounded-pill border border-ink-700 px-2 py-0.5 text-[11px] font-bold text-bone-600">
        {hasCurrent ? 'חדש' : '—'}
      </span>
    )
  }
  const rounded = Math.round(deltaPct)
  const flat = rounded === 0
  const up = rounded > 0
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown
  return (
    <span
      className={[
        'flex items-center gap-0.5 rounded-pill px-2 py-0.5 text-[11px] font-bold',
        flat
          ? 'bg-ink-800 text-bone-500'
          : up
            ? 'bg-flame-500/12 text-flame-300'
            : 'bg-ink-800 text-bone-400',
      ].join(' ')}
    >
      <Icon size={12} strokeWidth={3} aria-hidden="true" />
      <span dir="ltr" className="tnum">
        {Math.abs(rounded)}%
      </span>
    </span>
  )
}

export function VolumeDashboard(): JSX.Element {
  const [range, setRange] = useState<RangeKey>('this')

  const data = useLiveQuery(async () => {
    /*
      רק החלון שמוצג, ולא כל ההיסטוריה.

      הלוח מסתכל שמונה שבועות אחורה, אבל קודם נטענה כל טבלת הסטים לזיכרון —
      אחרי שלוש שנות אימון אלה אלפי רשומות בכל כניסה למסך, וזה גדל ליניארית.
      שבוע נוסף אחורה כי `previousWeekStart` צריך בסיס להשוואה.
    */
    const from = weekChain(startOfWeek(Date.now()), WEEKS_BACK + 1)[0]
    const [{ sessions, sets }, exercises, everTrained] = await Promise.all([
      getSessionsSince(from),
      // כולל תרגילים שהוצאו מהקטלוג — אחרת נפח היסטורי היה נעלם מהקבוצה שלו
      getAllExercises(true),
      /*
        "האם התאמנת אי פעם" הוא לא "האם התאמנת בשמונת השבועות האחרונים".
        מאז שהשאילתה מוגבלת לחלון, מי שחזר אחרי הפסקה של יותר משמונה שבועות
        קיבל "אין עדיין מה למדוד" — בדיוק המשתמש שכל האפליקציה בנויה סביבו.
        count על טבלת האימונים לא קורא רשומות ולכן הוא זול.
      */
      hasAnyFinishedSession(),
    ])
    return { sessions, sets, exercises, everTrained }
  }, [])

  const weeks = useMemo(() => {
    if (!data) return null
    return weekChain(startOfWeek(Date.now()), WEEKS_BACK).map((w) =>
      weeklyBreakdown(data.sessions, data.sets, data.exercises, w)
    )
  }, [data])

  const view = useMemo(() => {
    if (!data || !weeks) return null
    const picks = RANGE_WEEKS[range]
    const current = mergeWeeks(picks.current.map((i) => weeks[i]))
    const previous = mergeWeeks(picks.previous.map((i) => weeks[i]))
    const from = weeks[picks.current[0]].weekStart
    const to = nextWeekStart(weeks[picks.current[picks.current.length - 1]].weekStart)
    /*
      כמה מהחלון המוצג כבר חלף. רק "השבוע" הוא חלקי — כל שאר הטווחים הסתיימו,
      ולכן בהם כל יום כבר נספר. בלי זה כל יום ראשון בבוקר כל תשע הקבוצות היו
      מסומנות "לא עבדת", סימון שתמיד שקרי ולכן מלמד להתעלם.
    */
    const daysIntoWindow =
      range === 'this' ? Math.floor((Date.now() - from) / MS_DAY) + 1 : 7
    return {
      current,
      comparisons: compareWeeks(current, previous, undefined, daysIntoWindow),
      workouts: data.sessions.filter((s) => s.startedAt >= from && s.startedAt < to).length,
      spark: weeks.map((w) => ({ label: weekLabel(w.weekStart), value: w.totalVolumeKg })),
    }
  }, [data, weeks, range])

  if (!view) {
    return (
      <div className="flex flex-col gap-3" aria-hidden="true">
        <div className="card h-14 animate-pulse opacity-50" />
        <div className="card h-20 animate-pulse opacity-50" />
        <div className="card h-64 animate-pulse opacity-50" />
      </div>
    )
  }

  const copy = COPY[range]
  const neglectedCount = view.comparisons.filter((c) => c.neglected).length
  const maxVolume = Math.max(...view.comparisons.map((c) => c.current), 1)
  const hasHistory = data?.everTrained ?? false

  return (
    <section>
      <div
        role="group"
        aria-label="טווח זמן"
        className="mb-4 flex gap-1 rounded-pill border border-ink-700 bg-ink-900 p-1"
      >
        {RANGES.map((r) => {
          const active = r.key === range
          return (
            <button
              key={r.key}
              type="button"
              // aria-pressed ולא role=tab: אין כאן tabpanel ואין ניווט חצים,
              // ולכן סמנטיקת טאבים הייתה מבטיחה לקורא-מסך התנהגות שלא קיימת
              aria-pressed={active}
              onClick={() => setRange(r.key)}
              className={[
                'min-h-12 flex-1 rounded-pill text-sm font-bold transition-colors',
                active
                  ? 'border border-flame-500/40 bg-flame-500/12 text-flame-300'
                  : 'text-bone-400 active:bg-ink-800',
              ].join(' ')}
            >
              {r.label}
            </button>
          )
        })}
      </div>

      {!hasHistory ? (
        <EmptyState
          icon={<Flame />}
          title="אין עדיין מה למדוד"
          hint="אחרי האימון הראשון שתסגור יופיע כאן הנפח לפי קבוצת שריר — ומי נשארה מאחור."
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-2">
            <Stat value={formatVolume(view.current.totalVolumeKg)} label="נפח" />
            <Stat value={String(view.current.totalWorkSets)} label="סטי עבודה" />
            <Stat value={String(view.workouts)} label="אימונים" />
          </div>

          <div className="card mb-5 p-4">
            <h3 className="meta mb-3">נפח לפי קבוצת שריר</h3>
            <GroupBarChart
              bars={view.comparisons.map((c) => ({
                label: c.label,
                current: c.current,
                previous: c.previous,
              }))}
            />
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="meta">כל הקבוצות</h3>
              {neglectedCount > 0 ? (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-flame-400">
                  <span className="size-1.5 rounded-full bg-flame-400" aria-hidden="true" />
                  {neglectedCount === 1 ? 'קבוצה אחת מוזנחת' : `${neglectedCount} קבוצות מוזנחות`}
                </span>
              ) : null}
            </div>

            <ul className="flex flex-col gap-1.5">
              {view.comparisons.map((c, i) => (
                <li
                  key={c.group}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className={[
                    'animate-rise rounded-2xl border p-3',
                    c.neglected
                      ? 'border-flame-400/45 bg-flame-500/[0.06]'
                      : 'border-ink-800 bg-ink-900/60',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-bone-50">
                      {c.label}
                    </span>
                    <span className="meta tnum shrink-0 whitespace-nowrap">
                      {c.currentSets} סטים · {formatVolume(c.current)}
                    </span>
                    <span className="shrink-0">
                      <DeltaChip deltaPct={c.deltaPct} hasCurrent={c.current > 0} />
                    </span>
                  </div>

                  <div className="mt-2.5 h-1 w-full overflow-hidden rounded-pill bg-ink-800">
                    <div
                      className="h-full rounded-pill bg-flame-500"
                      style={{ width: `${Math.round((c.current / maxVolume) * 100)}%` }}
                      aria-hidden="true"
                    />
                  </div>

                  {c.neglected ? (
                    <p className="mt-2 text-xs font-semibold text-flame-400">
                      {c.currentSets === 0
                        ? `לא עבדת ${c.label} ${copy.noun}`
                        : `ירידה חדה ${copy.versus}`}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-4">
            <h3 className="meta mb-3">{copy.sparkTitle}</h3>
            <TrendChart points={view.spark} unit="ק״ג" height={140} />
          </div>
        </>
      )}
    </section>
  )
}
