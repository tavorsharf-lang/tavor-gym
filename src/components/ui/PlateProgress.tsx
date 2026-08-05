import type { JSX } from 'react'

/**
 * מד ההתקדמות של הסטים — מחסנית פלטות.
 *
 * כל סט הוא מקטע. סט עבודה נדלק בכתום, סט חימום בכחול דהוי ("לא נספר"),
 * ומה שנשאר הוא ברזל כהה. קריא בחצי שנייה בלי לספור מספרים.
 */

export type PlateSegState = 'empty' | 'work' | 'warmup'

export interface PlateProgressProps {
  /** כמה סטים מתוכננים */
  total: number
  /** מצב הסטים שכבר בוצעו, לפי סדר */
  states: PlateSegState[]
  className?: string
}

export function PlateProgress({ total, states, className }: PlateProgressProps): JSX.Element {
  // סט מעבר לתכנון עדיין צריך מקטע משלו — הרשימה לא מתקצרת אף פעם
  const count = Math.max(total, states.length, 0)
  const done = states.filter((s) => s !== 'empty').length

  return (
    <div
      className={['flex w-full items-center gap-[3px]', className ?? ''].filter(Boolean).join(' ')}
      role="img"
      aria-label={`${done} מתוך ${count} סטים`}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="plate-seg flex-1" data-state={states[i] ?? 'empty'} />
      ))}
    </div>
  )
}
