import { useState } from 'react'
import type { JSX } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Check } from 'lucide-react'
import type { Equipment } from '@/db/types'
import { EQUIPMENT_LABELS } from '@/db/types'
import { SORT_HINTS, SORT_LABELS } from '@/domain/exerciseSort'
import type { SortKey, SortState } from '@/domain/exerciseSort'
import { BottomSheet } from '@/components/ui'

/**
 * המיון והסינון של רשימות התרגילים — כפתור אחד בכותרת, ותפריט שנפתח ממנו.
 *
 * הצורה הראשונה כאן הייתה שורת צ׳יפים קבועה מתחת לסינון השרירים, בנימוק
 * שהחלפת מיון צריכה לעלות לחיצה אחת. הנימוק נכון והמחיר היה גבוה ממנו: על
 * מסך טלפון כבר יושבים מעליה מתג שלי/הכל, שדה חיפוש ושורת שרירים דו-שלבית,
 * ושורה רביעית קבועה דחפה את התרגיל הראשון מתחת לקו. המיון הוא החלטה שנעשית
 * פעם בכמה דקות, והרשימה היא מה שמסתכלים עליו כל הזמן.
 *
 * לכן: כפתור בשורה העליונה, עם נקודה כתומה כשמשהו פעיל — כדי שרשימה ממוינת
 * או מסוננת לעולם לא תיראה כמו רשימה רגילה שחסרים בה תרגילים.
 */
export function SortMenuButton({
  sort,
  onSort,
  equipment,
  onEquipment,
}: {
  sort: SortState
  onSort: (next: SortState) => void
  equipment: ReadonlySet<Equipment>
  onEquipment: (next: ReadonlySet<Equipment>) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const active = sort.key !== 'default' || equipment.size > 0

  const pick = (key: SortKey): void => {
    // אותו מיון פעמיים = הפוך כיוון. מיון חדש נפתח תמיד ביורד, כי זו השאלה
    // הראשונה בכל אחד מהם: הגבוה, הממוקד, והאחרון.
    onSort(key === sort.key ? { key, desc: !sort.desc } : { key, desc: true })
  }

  const toggleEquipment = (value: Equipment): void => {
    const next = new Set(equipment)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onEquipment(next)
  }

  const keys: SortKey[] = ['default', 'pct', 'focus', 'recent']

  /* מה שהכפתור מספר בלי לפתוח אותו — לקורא מסך, ולמי שחוזר למסך אחרי שעה */
  const summary = [
    sort.key === 'default' ? null : SORT_LABELS[sort.key],
    equipment.size > 0 ? [...equipment].map((e) => EQUIPMENT_LABELS[e]).join(', ') : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={summary ? `מיון וסינון — ${summary}` : 'מיון וסינון'}
        className={[
          'relative flex size-11 shrink-0 items-center justify-center rounded-full transition-colors',
          active ? 'text-flame-400 active:bg-ink-800' : 'text-bone-400 active:bg-ink-800',
        ].join(' ')}
      >
        <ArrowUpDown size={20} />
        {active ? (
          <span
            aria-hidden="true"
            className="absolute end-1.5 top-1.5 size-2 rounded-full bg-flame-500"
          />
        ) : null}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="מיון וסינון">
        <div className="space-y-5">
          <section>
            <h3 className="meta mb-2 px-1">לפי מה לסדר</h3>
            <div className="space-y-2">
              {keys.map((key) => {
                const on = sort.key === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${SORT_LABELS[key]} — ${SORT_HINTS[key]}${
                      on ? (sort.desc ? ', מהגבוה לנמוך' : ', מהנמוך לגבוה') : ''
                    }`}
                    onClick={() => pick(key)}
                    className={[
                      'flex min-h-14 w-full items-center gap-3 rounded-card border px-4 text-start transition-colors',
                      on
                        ? 'border-flame-500/40 bg-flame-500/12'
                        : 'border-ink-700 bg-ink-900/60 active:bg-ink-800',
                    ].join(' ')}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={[
                          'block text-sm font-bold',
                          on ? 'text-flame-300' : 'text-bone-200',
                        ].join(' ')}
                      >
                        {SORT_LABELS[key]}
                      </span>
                      <span className="meta mt-0.5 block truncate">{SORT_HINTS[key]}</span>
                    </span>

                    {/*
                      החץ על הפעיל הוא גם מצב וגם הזמנה: לחיצה נוספת עליו
                      הופכת את הכיוון, ובלי הסימן אי אפשר לנחש שזה אפשרי.
                      ל"רגיל" אין כיוון להפוך — הוא הסדר של המסך.
                    */}
                    {on ? (
                      key === 'default' ? (
                        <Check size={18} className="shrink-0 text-flame-400" aria-hidden="true" />
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 text-[0.6875rem] font-bold text-flame-400">
                          {sort.desc ? 'מהגבוה' : 'מהנמוך'}
                          {sort.desc ? (
                            <ArrowDown size={14} aria-hidden="true" />
                          ) : (
                            <ArrowUp size={14} aria-hidden="true" />
                          )}
                        </span>
                      )
                    ) : null}
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className="meta mb-2 px-1">רק ציוד מסוים</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((value) => {
                const on = equipment.has(value)
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleEquipment(value)}
                    className={[
                      'flex min-h-13 items-center justify-center rounded-card border px-3 text-center text-xs font-bold transition-colors',
                      on
                        ? 'border-flame-500/40 bg-flame-500/12 text-flame-300'
                        : 'border-ink-700 bg-ink-900/60 text-bone-300 active:bg-ink-800',
                    ].join(' ')}
                  >
                    {EQUIPMENT_LABELS[value]}
                  </button>
                )
              })}
            </div>
            {equipment.size > 0 ? (
              <button
                type="button"
                onClick={() => onEquipment(new Set())}
                className="btn-ghost mt-2 flex min-h-12 w-full items-center justify-center rounded-card text-sm font-bold"
              >
                בלי סינון ציוד
              </button>
            ) : null}
          </section>
        </div>
      </BottomSheet>
    </>
  )
}

/**
 * השורה שאומרת מה נעלם בגלל מסנן הציוד.
 *
 * רשומת מאגר שעוד לא נוספה לתרגילים שלי אין לה סיווג ציוד בכלל — הוא נקבע
 * בהוספה — ולכן מסנן ציוד מפיל אותה. היא יושבת ליד הרשימה ולא בתוך התפריט,
 * כי היא מסבירה שורות חסרות במקום שבו הן חסרות.
 */
export function EquipmentNote({ count }: { count: number }): JSX.Element | null {
  if (count <= 0) return null
  return (
    <p className="meta mb-3 px-1">{count} רשומות מאגר אינן מוצגות — אין להן עדיין סיווג ציוד</p>
  )
}

/**
 * המתג של "עד כמה לפרוש" — נראה רק כשנבחר תת-שריר.
 *
 * זו האפשרות השנייה מהשתיים שתבור ביקש. "ראשי בלבד" הוא המסך שהיה כאן תמיד:
 * תרגילים שהשריר הזה הוא הראש שלהם, מקובצים תחת הכותרת שלו. "כל מי שנוגע"
 * שובר את הקיבוץ ומראה את כל מי שהכרטיס שלו מזכיר את השריר בכלל — כולל
 * סקוואט, שהכותרת שלו היא עכוז והוא עדיין 45% ארבע-ראשי.
 *
 * הוא נשאר בשורה ולא עבר לתפריט המיון, בניגוד לכל השאר: הוא מופיע רק אחרי
 * בחירת תת-שריר, והמספר שעליו — "עוד שבעה נוגעים" — הוא מה שמזמין ללחוץ.
 * בתוך תפריט הוא היה יכולת שאיש לא היה מגלה.
 */
export function SubScopeToggle({
  sub,
  scope,
  onScope,
  primaryCount,
  touchingCount,
}: {
  sub: string
  scope: 'primary' | 'touching'
  onScope: (next: 'primary' | 'touching') => void
  primaryCount: number
  touchingCount: number
}): JSX.Element {
  const options = [
    { key: 'primary' as const, label: `${sub} כראשי`, count: primaryCount },
    { key: 'touching' as const, label: 'כל מי שנוגע', count: touchingCount },
  ]

  return (
    <div
      role="group"
      aria-label={`כמה רחב להציג עבור ${sub}`}
      className="mb-3 flex gap-1 rounded-pill border border-ink-700 bg-ink-900 p-1"
    >
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={scope === option.key}
          onClick={() => onScope(option.key)}
          className={[
            'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-pill text-xs font-bold transition-colors',
            scope === option.key
              ? 'border border-flame-500/40 bg-flame-500/12 text-flame-300'
              : 'text-bone-400 active:bg-ink-800',
          ].join(' ')}
        >
          <span className="truncate">{option.label}</span>
          <span className="tnum shrink-0 opacity-70">{option.count}</span>
        </button>
      ))}
    </div>
  )
}
