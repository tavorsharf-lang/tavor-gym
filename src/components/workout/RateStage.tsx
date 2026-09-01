import type { JSX } from 'react'
import { RATING_LABELS, RIR_LABELS } from '@/db/types'
import type { Rating, Rir } from '@/db/types'

/**
 * "איך היה?" — בסוף כל תרגיל, **באותה במה שבה יושבת המנוחה**.
 *
 * זו אותה שאלה שהייתה בגיליון התחתון, ובכוונה לא במקום אחר על המסך: אחרי
 * הסט האחרון יש בדיוק שני דברים שיכולים לקרות — לנוח או לסכם — ושניהם
 * מתרחשים באותם 196 פיקסלים. גיליון שנפתח מלמטה היה מסתיר את הכרטיס שאותו
 * הוא מסכם, וזה בדיוק הרגע שבו רוצים לראות אותו.
 *
 * ה"רמזים" הארוכים ("בקושי הרגשתי — אפשר לקפוץ") לא נכנסים לכאן. הם נשארים
 * ב-`RatingSheet`, שהוא עדיין המסלול לתיקון דירוג בדיעבד — שם יש מקום לקרוא,
 * וכאן צריך לענות בלי להסתכל.
 */

interface Choice {
  value: Rating
  /** צבע הספרה, המסגרת והמד — טוקן אחד שכל השלושה נגזרים ממנו */
  color: string
}

/** אותם חמישה בדיוק כמו ב-`RatingSheet`, ובאותו סדר */
const CHOICES: Choice[] = [
  { value: 1, color: 'var(--color-pr-400)' },
  { value: 2, color: 'var(--color-pr-400)' },
  { value: 3, color: 'var(--color-bone-200)' },
  { value: 4, color: 'var(--color-flame-300)' },
  { value: 5, color: 'var(--color-hard-400)' },
]

const RIR_VALUES: Rir[] = [0, 1, 2, 3, 4]

/** מסגרת אחת לשני השלבים — הם מחליפים זה את זה בלי שהקופסה תזוז */
function Panel({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="animate-fade absolute inset-0 flex flex-col justify-between rounded-[18px] border border-ink-700 bg-ink-900 p-3">
      {children}
    </div>
  )
}

export function RateStage({
  exerciseName,
  selected,
  onPick,
}: {
  exerciseName: string
  selected: Rating | null
  onPick: (rating: Rating) => void
}): JSX.Element {
  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="shrink-0 text-sm font-extrabold text-bone-50">איך היה?</h3>
        <p className="truncate text-[0.65625rem] font-medium text-bone-500">
          {exerciseName} · התרגיל הושלם
        </p>
      </div>

      <div className="flex gap-1.5">
        {CHOICES.map((choice) => {
          const picked = selected === choice.value
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={picked}
              aria-label={RATING_LABELS[choice.value]}
              onClick={() => onPick(choice.value)}
              // ‏currentColor הוא הציר: הספרה, המסגרת הנבחרת והמד כולם נגזרים
              // ממנו, ולכן יש כאן משתנה צבע אחד לכל אפשרות ולא שלושה
              style={{ color: choice.color }}
              className={`flex h-26 flex-1 flex-col items-center justify-center gap-[7px] rounded-[14px] border px-1 transition-colors ${
                picked ? 'border-current bg-current/15' : 'border-bone-50/10 bg-ink-900'
              }`}
            >
              <span aria-hidden="true" className="tnum text-[1.375rem] leading-none font-extrabold">
                {choice.value}
              </span>
              <span
                aria-hidden="true"
                className="text-[0.625rem] leading-tight font-bold text-balance"
              >
                {RATING_LABELS[choice.value]}
              </span>
              {/* מד שקורא את עוצמת המאמץ בלי לקרוא מילה */}
              <span
                aria-hidden="true"
                className="h-[3px] w-[26px] overflow-hidden rounded-sm bg-current opacity-25"
              >
                <span
                  className="block h-full rounded-sm bg-current"
                  style={{ width: `${(choice.value / 5) * 100}%` }}
                />
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-center text-[0.625rem] leading-none font-normal text-bone-500">
        נשמר על התרגיל · אפשר לכבות &quot;קושי&quot; בראש המסך
      </p>
    </Panel>
  )
}

export function RirStage({
  onPick,
  onSkip,
}: {
  onPick: (rir: Rir) => void
  onSkip: () => void
}): JSX.Element {
  return (
    <Panel>
      <div>
        <h3 className="text-sm font-extrabold text-bone-50">רוצה לדייק? כמה חזרות נשארו לך</h3>
        <p className="mt-1.5 text-[0.65625rem] font-medium text-bone-500">
          אופציונלי — &quot;דלג&quot; שומר את הדירוג כמו שהוא
        </p>
      </div>

      <div className="flex gap-1.5">
        {RIR_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            dir="ltr"
            aria-label={value === 0 ? 'כשל — לא נשארו חזרות' : `נשארו ${RIR_LABELS[value]}`}
            onClick={() => onPick(value)}
            className="tnum flex h-14 flex-1 items-center justify-center rounded-[14px] border border-ink-700 bg-ink-850 text-[0.9375rem] font-extrabold text-bone-200 active:border-flame-500"
          >
            {RIR_LABELS[value]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="btn-ghost flex h-11 items-center justify-center rounded-[14px] text-[0.8125rem] font-bold"
      >
        דלג
      </button>
    </Panel>
  )
}
