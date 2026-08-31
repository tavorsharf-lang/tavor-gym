import type { JSX } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS } from '@/db/types'

/**
 * שורת הסינון של הרשימות — שתי רמות, שורה אחת.
 *
 * עד כאן השורה הזו הציגה את **כל** תת-השרירים של כל הגוף זה לצד זה: "חזה
 * אמצעי 12", "רחב גבי 11", "ארבע-ראשי 9"... שלושים ומשהו צ׳יפים בשורה גוללת
 * אחת, בלי שום סדר שאפשר לחזות. כדי להגיע לתת-שריר של הרגליים היה צריך לגלול
 * דרך תת-השרירים של הגב ושל החזה, וזה בדיוק ההפך מניווט.
 *
 * הרמה הראשונה היא שמונה קבוצות השריר בסדר הקבוע שלהן — מהגדול לקטן, אותו
 * סדר שבו הרשימה עצמה מסודרת — ולחיצה על קבוצה נכנסת אל תת-השרירים שלה
 * *בלבד*. כלומר במקום שלושים צ׳יפים שטוחים יש שמונה, וכל אחד פותח שלושה או
 * ארבעה. הדרך לתרגיל תמיד באותו אורך ותמיד באותו כיוון.
 *
 * הרכיב אחד לשלושת המסכים — רשימת התרגילים, בורר התרגילים בגיליון, ומסך
 * השריר בבונה — כי זו אותה שאלה ואותה תשובה. במסך השריר הקבוצה כבר נבחרה
 * בניווט, ולכן `fixed` מסתיר את הרמה הראשונה ואת החזרה אליה: שם היא הייתה
 * מבטיחה מעבר לקבוצה אחרת שהמסך הזה לא יכול לעשות.
 *
 * מה שהשורה **לא** עושה: היא לא מסננת את עצמה. גם אחרי בחירה כל האחיות של
 * הבחירה נשארות על המסך, אחרת מעבר מ"חזה עליון" ל"חזה אמצעי" היה דורש איפוס
 * קודם. הסינון חל על הרשימה שמתחת ולא על הפקדים.
 */

export interface MuscleFilterSub {
  sub: string
  count: number
}

export interface MuscleFilterOption {
  group: MuscleGroup
  /** כמה תרגילים בקבוצה כולה — כולל אלה שאין להם תת-שריר */
  count: number
  /** תת-השרירים שיש להם תרגילים כרגע. "אחר" אינו ביניהם — הוא שארית ולא קטגוריה. */
  subs: readonly MuscleFilterSub[]
}

/** null בשני השדות = בלי סינון. `sub` תמיד שייך ל-`group`. */
export interface MuscleFilter {
  group: MuscleGroup | null
  sub: string | null
}

export const NO_MUSCLE_FILTER: MuscleFilter = { group: null, sub: null }

/**
 * הסינון האפקטיבי — מה שבאמת אפשר להחיל על הרשימה הנוכחית.
 *
 * הבחירה נשמרת ב-state של המסך, אבל הרשימה שמתחתיה זזה: חיפוש שהוקלד, מעבר
 * בין "שלי" ל"הכל", או תיקון שיוך שהזיז תרגיל לקבוצה אחרת. בלי השער הזה
 * בחירה שנשארה תלויה על קבוצה שהתרוקנה הייתה מרוקנת את המסך בלי להסביר למה —
 * הרשימה מלאה, הסינון מכוון לכלום, ואין אפילו צ׳יפ לחוץ שמראה מה קרה.
 *
 * לכן: קבוצה שאינה ברשימה חוזרת ל"הכל", ותת-שריר שנעלם חוזר לקבוצה שלו.
 */
export function resolveMuscleFilter(
  options: readonly MuscleFilterOption[],
  value: MuscleFilter
): MuscleFilter {
  if (!value.group) return NO_MUSCLE_FILTER
  const option = options.find((o) => o.group === value.group)
  if (!option) return NO_MUSCLE_FILTER
  const sub = value.sub && option.subs.some((s) => s.sub === value.sub) ? value.sub : null
  return { group: option.group, sub }
}

const CHIP =
  'flex min-h-9 shrink-0 items-center gap-1.5 rounded-pill border px-3 text-xs font-bold transition-colors'
const ON = 'border-flame-500 bg-flame-500 text-ink-950'
const OFF = 'border-ink-700 bg-ink-900/70 text-bone-300 active:bg-ink-800'

function Chip({
  label,
  count,
  pressed,
  onClick,
  hasMore,
}: {
  label: string
  count?: number
  pressed: boolean
  onClick: () => void
  /** לקבוצה שיש לה תת-שרירים — הצ׳יפ פותח רמה ולא רק מסנן, וזה צריך להיראות */
  hasMore?: boolean
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={[CHIP, pressed ? ON : OFF].join(' ')}
    >
      {label}
      {/*
        רווח ממשי ולא רק `gap`: בלעדיו שם הכפתור שקורא-מסך מקריא הוא "חזה6",
        כי הרווח החזותי הוא CSS ולא טקסט.
      */}
      {count !== undefined ? (
        <>
          {' '}
          <span className="tnum font-semibold opacity-60">{count}</span>
        </>
      ) : null}
      {hasMore ? <ChevronLeft size={12} className="opacity-50" aria-hidden="true" /> : null}
    </button>
  )
}

export function MuscleFilterChips({
  options,
  value,
  onChange,
  fixed = false,
}: {
  options: readonly MuscleFilterOption[]
  /** תמיד הערך שחזר מ-`resolveMuscleFilter`, כדי שהצ׳יפ הלחוץ יהיה זה שפועל */
  value: MuscleFilter
  onChange: (next: MuscleFilter) => void
  /** הקבוצה נקבעה בניווט ולא כאן — מסתיר את רמת הקבוצות ואת החזרה אליה */
  fixed?: boolean
}): JSX.Element | null {
  /* במצב `fixed` הקבוצה היא המסך עצמו, ולכן אין רמה ראשונה ליפול אליה */
  const current = value.group
    ? options.find((o) => o.group === value.group) ?? null
    : fixed
      ? options[0] ?? null
      : null
  /*
    שורה של צ׳יפ אחד היא רעש. מספיק תת-שריר אחד כדי להצדיק אותה — הוא מפריד
    בין השם הזה לבין שאר הקבוצה, וזו הבחנה אמיתית — אבל קבוצה בודדת בלי שום
    תת-שריר לא מציעה כלום.
  */
  const worth = options.length > 1 || (options[0]?.subs.length ?? 0) > 0
  if (!worth) return null

  /*
    שורה גוללת ולא רשת: מספר הצ׳יפים משתנה עם החיפוש, עם המתג ועם הרמה, ורשת
    שמוסיפה שורה מזיזה את כל הרשימה מתחת לאצבע בדיוק כשעומדים ללחוץ.
    ‏‎-mx-4/px-4 כדי שהצ׳יפ האחרון ייגמר בקצה המסך ולא בקצה העמודה.
  */
  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4">
      <div className="flex w-max gap-1.5" role="group" aria-label="סינון לפי שריר">
        {current === null ? (
          <>
            <Chip
              label="כל השרירים"
              pressed
              onClick={() => onChange(NO_MUSCLE_FILTER)}
            />
            {options.map((option) => (
              <Chip
                key={option.group}
                label={MUSCLE_GROUPS[option.group].label}
                count={option.count}
                pressed={false}
                hasMore={option.subs.length > 0}
                onClick={() => onChange({ group: option.group, sub: null })}
              />
            ))}
          </>
        ) : (
          <>
            {/*
              החזרה היא צ׳יפ ולא כפתור נפרד מעל השורה: היא באותו גובה ובאותו
              מקום שבו הייתה האצבע רגע קודם, ולכן "נכנסתי בטעות" נפתר בלחיצה
              שנייה באותה נקודה. השם זהה לצ׳יפ שהיה שם ברמה הראשונה בכוונה —
              זה אותו מקום שחוזרים אליו.
            */}
            {!fixed ? (
              <button
                type="button"
                onClick={() => onChange(NO_MUSCLE_FILTER)}
                className={[CHIP, OFF].join(' ')}
              >
                <ChevronRight size={14} aria-hidden="true" />
                כל השרירים
              </button>
            ) : null}
            <Chip
              label={MUSCLE_GROUPS[current.group].label}
              count={current.count}
              pressed={value.sub === null}
              onClick={() => onChange({ group: current.group, sub: null })}
            />
            {current.subs.map(({ sub, count }) => (
              <Chip
                key={sub}
                label={sub}
                count={count}
                pressed={value.sub === sub}
                // לחיצה על הלחוץ מחזירה לכל הקבוצה — אותה התנהגות שהייתה כאן
                onClick={() =>
                  onChange({ group: current.group, sub: value.sub === sub ? null : sub })
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
