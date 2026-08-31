import { useState } from 'react'
import type { JSX } from 'react'
import { ArrowDown, ArrowUp, Dumbbell, X } from 'lucide-react'
import type { Equipment } from '@/db/types'
import { EQUIPMENT_LABELS } from '@/db/types'
import { SORT_HINTS, SORT_LABELS } from '@/domain/exerciseSort'
import type { SortKey, SortState } from '@/domain/exerciseSort'
import { BottomSheet } from '@/components/ui'

/**
 * שורת המיון והסינון של רשימות התרגילים — אותה שורה בבונה ובמסך התרגילים.
 *
 * שלוש החלטות:
 *
 *   1. **המיונים הם צ׳יפים ולא גיליון.** החלפת מיון היא לחיצה אחת: זו לא
 *      הגדרה שקובעים פעם אחת אלא שאלה שמתחלפת תוך כדי — "מה עובד הכי חזק"
 *      ואז "ומה מזה לא עשיתי מזמן". גיליון היה עולה שתי לחיצות בכל פעם.
 *   2. **לחיצה על מיון פעיל הופכת את הכיוון.** "מה עשיתי לאחרונה" ו"מה
 *      הזנחתי" הן אותה שאלה משני צדדים, ושני צ׳יפים נפרדים לשתיהן היו
 *      מכפילים את השורה. החץ על הצ׳יפ הוא מה שאומר לאן היא מצביעה עכשיו.
 *   3. **הציוד כן בגיליון.** הוא ארבע אפשרויות שנבחרות ביחד, זו בחירה
 *      שנשארת לאורך כל הגלישה, והיא נעשית לפני הרשימה ולא בתוכה.
 */
export function ListSortBar({
  sort,
  onSort,
  equipment,
  onEquipment,
  hiddenNoEquipment = 0,
}: {
  sort: SortState
  onSort: (next: SortState) => void
  equipment: ReadonlySet<Equipment>
  onEquipment: (next: ReadonlySet<Equipment>) => void
  /** כמה שורות נעלמו רק כי אין להן סיווג ציוד — נאמר, לא מוסתר */
  hiddenNoEquipment?: number
}): JSX.Element {
  const [sheet, setSheet] = useState(false)

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

  return (
    <>
      <div className="mb-3 flex items-center gap-1.5">
        <div
          role="group"
          aria-label="מיון הרשימה"
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
        >
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
                  'flex min-h-10 shrink-0 items-center gap-1 rounded-pill border px-3 text-xs font-bold transition-colors',
                  on
                    ? 'border-flame-500/40 bg-flame-500/12 text-flame-300'
                    : 'border-ink-700 bg-ink-900/60 text-bone-400 active:bg-ink-800',
                ].join(' ')}
              >
                {SORT_LABELS[key]}
                {/* החץ רק על הפעיל, ורק כשיש לכיוון משמעות */}
                {on && key !== 'default' ? (
                  sort.desc ? (
                    <ArrowDown size={12} aria-hidden="true" />
                  ) : (
                    <ArrowUp size={12} aria-hidden="true" />
                  )
                ) : null}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setSheet(true)}
          aria-label={
            equipment.size > 0
              ? `סינון ציוד — ${[...equipment].map((e) => EQUIPMENT_LABELS[e]).join(', ')}`
              : 'סינון לפי ציוד'
          }
          className={[
            'flex min-h-10 shrink-0 items-center gap-1 rounded-pill border px-3 text-xs font-bold transition-colors',
            equipment.size > 0
              ? 'border-flame-500/40 bg-flame-500/12 text-flame-300'
              : 'border-ink-700 bg-ink-900/60 text-bone-400 active:bg-ink-800',
          ].join(' ')}
        >
          <Dumbbell size={14} />
          {equipment.size > 0 ? <span className="tnum">{equipment.size}</span> : 'ציוד'}
        </button>
      </div>

      {/*
        השורה שאומרת מה נעלם. רשומת מאגר שעוד לא נוספה לתרגילים שלי אין לה
        סיווג ציוד בכלל — הוא נקבע בהוספה — ולכן מסנן ציוד מפיל אותה. בלי
        המשפט הזה היא פשוט הייתה נעלמת, וזה נקרא כמו באג.
      */}
      {hiddenNoEquipment > 0 ? (
        <p className="meta mb-3 px-1">
          {hiddenNoEquipment} רשומות מאגר אינן מוצגות — אין להן עדיין סיווג ציוד
        </p>
      ) : null}

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="סינון לפי ציוד">
        <div className="space-y-2">
          {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((value) => {
            const on = equipment.has(value)
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => toggleEquipment(value)}
                className={[
                  'flex min-h-13 w-full items-center justify-between rounded-card border px-4 text-sm font-bold transition-colors',
                  on
                    ? 'border-flame-500/40 bg-flame-500/12 text-flame-300'
                    : 'border-ink-700 bg-ink-900/60 text-bone-300 active:bg-ink-800',
                ].join(' ')}
              >
                {EQUIPMENT_LABELS[value]}
                {on ? <X size={16} aria-hidden="true" /> : null}
              </button>
            )
          })}

          {equipment.size > 0 ? (
            <button
              type="button"
              onClick={() => onEquipment(new Set())}
              className="btn-ghost flex min-h-13 w-full items-center justify-center rounded-card text-sm font-bold"
            >
              בלי סינון ציוד
            </button>
          ) : null}
        </div>
      </BottomSheet>
    </>
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
 * ההצדקה למתג ולא להחלפה: שתי השאלות אמיתיות. "מה יש לי לארבע-ראשי" היא
 * שאלת בניית אימון, ו"מי בכלל מעמיס ארבע-ראשי" היא שאלת תכנון שבוע.
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
