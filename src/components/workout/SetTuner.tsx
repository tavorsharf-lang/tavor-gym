import type { JSX } from 'react'

/**
 * "כמה סטים היום" — היעד של התרגיל הזה באימון הזה בלבד.
 *
 * הוא לא פאנל נוסף אלא **מחליף את שורת השבבים באותם 38 פיקסלים**, ולכן
 * פתיחתו לא מזיזה שום דבר על המסך: הכפתור הכתום נשאר בדיוק איפה שהאצבע
 * השאירה אותו. זו הסיבה שהוא נראה כמו שורת שבבים ולא כמו טופס.
 *
 * מנוחה לא נמצאת כאן. היא מכוונת ב-+30 בזמן המנוחה עצמה, בגיליון הפעולות של
 * התרגיל, ובהגדרות — שלושתם רגעים שבהם באמת שואלים "כמה לנוח", ואף אחד מהם
 * אינו הרגע שלפני הסט.
 */
export function SetTuner({
  targetSets,
  doneWorkSets,
  onPick,
}: {
  targetSets: number
  /** אי אפשר לרדת מתחת למה שכבר בוצע — זה היה מוחק סטים מהמסך */
  doneWorkSets: number
  onPick: (next: number) => void
}): JSX.Element {
  // חמישה בדרך כלל, ויותר רק כשהיעד עצמו כבר גבוה מזה. אריח flex-1 מתכווץ
  // יפה; יעד שנעלם מהשורה שהוא היעד שלה הוא באג.
  const count = Math.max(5, targetSets, doneWorkSets)
  const floor = Math.max(1, doneWorkSets)

  return (
    <div className="flex h-full items-stretch gap-1.5">
      <span className="flex w-14 shrink-0 items-center text-[0.625rem] leading-tight font-bold tracking-[0.06em] text-bone-500">
        כמה סטים היום
      </span>
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
        const selected = n === targetSets
        const locked = n < floor
        return (
          <button
            key={n}
            type="button"
            disabled={locked}
            aria-pressed={selected}
            aria-label={`${n} סטים`}
            onClick={() => onPick(n)}
            className={`tnum relative flex flex-1 items-center justify-center rounded-[11px] border text-sm font-extrabold transition-colors after:absolute after:inset-x-0 after:-inset-y-[3px] after:content-[''] ${
              selected
                ? 'border-flame-500 bg-flame-500/15 text-bone-50'
                : 'border-ink-700 bg-ink-900 text-bone-300'
            } ${locked ? 'opacity-35' : ''}`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
