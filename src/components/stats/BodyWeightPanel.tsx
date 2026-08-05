import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Scale, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import type { BodyWeightEntry } from '@/db/types'
import { addBodyWeight, deleteBodyWeight, getBodyWeights } from '@/db/queries'
import { formatKg } from '@/domain/units'
import { MS_DAY, formatDateShort, formatRelativeDay, parseISODate, todayISO } from '@/lib/dates'
import { Button, EmptyState, Stepper, toast } from '@/components/ui'
import { TrendChart } from '@/components/charts/lazy'

/**
 * משקל גוף — שקילה אחת ביום, מגמה לאורך זמן.
 *
 * המחיקה לא שואלת "האם אתה בטוח" אלא נותנת ביטול בטוסט: לחיצה אחת פחות
 * בכל מחיקה מכוונת, ובלי סיכון במחיקה בטעות.
 */

/** כמה ימים אחורה נחשבים "חודש" להשוואה */
const MONTH_DAYS = 30
/** נקודת פתיחה כשעוד לא נשקלת אף פעם */
const FALLBACK_KG = 80
const RECENT_LIMIT = 10

interface Change {
  deltaKg: number
  /** "בחודש" או "מאז 5.8.26" */
  suffix: string
}

/** השינוי מול השקילה שקרובה לחודש אחורה; בלי כזו — מול השקילה הראשונה */
function monthChange(entries: readonly BodyWeightEntry[]): Change | null {
  if (entries.length < 2) return null
  const latest = entries[entries.length - 1]
  const latestTs = parseISODate(latest.date)
  const monthAgo = entries.filter((e) => parseISODate(e.date) <= latestTs - MONTH_DAYS * MS_DAY).at(-1)
  const reference = monthAgo ?? entries[0]
  if (reference === latest) return null
  return {
    deltaKg: latest.weightKg - reference.weightKg,
    suffix: monthAgo ? 'בחודש' : `מאז ${formatDateShort(parseISODate(reference.date))}`,
  }
}

function DeltaText({ deltaKg, suffix }: Change): JSX.Element {
  const flat = Math.abs(deltaKg) < 0.05
  const Icon = flat ? Scale : deltaKg > 0 ? TrendingUp : TrendingDown
  return (
    <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-bone-400">
      <Icon size={15} className="text-bone-500" aria-hidden="true" />
      {flat ? (
        <span>ללא שינוי {suffix}</span>
      ) : (
        <>
          <span dir="ltr" className="tnum">
            {deltaKg > 0 ? '+' : '−'}
            {formatKg(Math.abs(deltaKg))}
          </span>
          <span>ק״ג {suffix}</span>
        </>
      )}
    </p>
  )
}

export function BodyWeightPanel(): JSX.Element {
  const entries = useLiveQuery(() => getBodyWeights(), [])
  const [draft, setDraft] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const latest = entries && entries.length > 0 ? entries[entries.length - 1] : null
  const value = draft ?? latest?.weightKg ?? FALLBACK_KG

  const points = useMemo(
    () =>
      (entries ?? []).map((e) => ({
        label: formatDateShort(parseISODate(e.date)),
        value: e.weightKg,
      })),
    [entries]
  )

  /** מהחדש לישן, עם השינוי מול השקילה שלפניה */
  const recent = useMemo(() => {
    const list = entries ?? []
    return list
      .map((entry, i) => ({
        entry,
        deltaKg: i > 0 ? entry.weightKg - list[i - 1].weightKg : null,
      }))
      .reverse()
      .slice(0, RECENT_LIMIT)
  }, [entries])

  const save = async () => {
    setSaving(true)
    try {
      await addBodyWeight(todayISO(), value)
      toast(`נשמר: ${formatKg(value)} ק״ג`, { tone: 'success' })
    } catch {
      toast('השמירה נכשלה, נסה שוב', { tone: 'warn' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (entry: BodyWeightEntry) => {
    if (entry.id === undefined) return
    await deleteBodyWeight(entry.id)
    toast(`נמחקה השקילה של ${formatDateShort(parseISODate(entry.date))}`, {
      actionLabel: 'ביטול',
      onAction: () => {
        void addBodyWeight(entry.date, entry.weightKg, entry.note)
      },
    })
  }

  if (entries === undefined) {
    return <div className="card h-64 animate-pulse opacity-50" aria-hidden="true" />
  }

  const change = monthChange(entries)

  return (
    <section>
      <h2 className="meta mb-2">משקל גוף</h2>

      <div className="card mb-3 p-4">
        {latest ? (
          <>
            <div className="flex items-baseline gap-2">
              <span dir="ltr" className="numeral-hero tnum text-[3.25rem] text-bone-50">
                {formatKg(latest.weightKg)}
              </span>
              <span className="text-base font-bold text-bone-500">ק״ג</span>
            </div>
            <p className="meta mt-3">
              נשקלת {formatRelativeDay(parseISODate(latest.date))} ·{' '}
              {formatDateShort(parseISODate(latest.date))}
            </p>
            {change ? <DeltaText {...change} /> : null}
          </>
        ) : (
          <EmptyState
            icon={<Scale />}
            title="עוד לא נשקלת"
            hint="שקילה אחת בשבוע, אותו בוקר, לפני האוכל — זה כל מה שצריך כדי לראות מגמה אמיתית."
          />
        )}

        <div className="mt-5 border-t border-ink-800 pt-4">
          <Stepper
            value={value}
            onChange={setDraft}
            step={0.1}
            decimals={1}
            min={30}
            max={250}
            label="משקל גוף"
            suffix="ק״ג"
          />
          <Button
            variant="flame"
            size="lg"
            fullWidth
            className="mt-3"
            loading={saving}
            icon={<Check size={20} strokeWidth={3} />}
            onClick={() => void save()}
          >
            שמור להיום
          </Button>
        </div>
      </div>

      {points.length >= 2 ? (
        <div className="card mb-3 p-4">
          <h3 className="meta mb-3">מגמה</h3>
          <TrendChart points={points} unit="ק״ג" height={160} />
        </div>
      ) : null}

      {recent.length > 0 ? (
        <div className="card p-4">
          <h3 className="meta mb-1">שקילות אחרונות</h3>
          <ul className="flex flex-col">
            {recent.map(({ entry, deltaKg }) => (
              <li
                key={entry.id ?? entry.date}
                className="flex items-center gap-3 border-b border-ink-800/70 last:border-0"
              >
                <span dir="ltr" className="tnum w-16 text-end text-xs text-bone-500">
                  {formatDateShort(parseISODate(entry.date))}
                </span>
                <span dir="ltr" className="tnum text-base font-extrabold text-bone-50">
                  {formatKg(entry.weightKg)}
                </span>
                {deltaKg !== null && Math.abs(deltaKg) >= 0.05 ? (
                  <span dir="ltr" className="tnum text-xs font-semibold text-bone-500">
                    {deltaKg > 0 ? '+' : '−'}
                    {formatKg(Math.abs(deltaKg))}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => void remove(entry)}
                  aria-label={`מחק שקילה מ-${formatDateShort(parseISODate(entry.date))}`}
                  className="ms-auto flex size-12 shrink-0 items-center justify-center rounded-xl text-bone-600 active:bg-ink-800 active:text-hard-400"
                >
                  <Trash2 size={17} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
