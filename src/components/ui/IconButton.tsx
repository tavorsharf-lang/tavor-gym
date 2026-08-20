import type { JSX, ReactNode } from 'react'

/**
 * כפתור אייקון — פעולה משנית שיושבת בקצה של שורה.
 *
 * היה משוכפל מילה במילה בעורך התרגיל ובעורך התוכניות, וברשימה המאוחדת הוא
 * מרונדר עשרות פעמים — שלוש סיבות טובות שיהיה רכיב אחד.
 *
 * ‏48px גם כאן, כמו ב-`Button`: הלחיצה קורית ביד אחת ובאמצע סט.
 *
 * `label` הוא חובה ולא רשות. ברשימה של 76 שורות "הוסף" לבדו לא אומר לקורא
 * מסך דבר — התווית חייבת לשאת את שם התרגיל.
 */

export interface IconButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  /** מדגיש פעולה הרסנית באדום */
  danger?: boolean
  /** מסמן שהפעולה כבר בוצעה — כתום, כמו הפעולה הראשית */
  active?: boolean
  /**
   * מסגרת במנוחה, לא רק בלחיצה.
   *
   * בשורה של פקדים (עורך התרגיל, עורך התוכניות) ההקשר מספיק והאייקון עומד
   * בפני עצמו. פקד *בודד* בקצה שורה בלי מסגרת נקרא כתו ולא ככפתור — מקף בודד
   * ליד שורת תרגיל לא נראה לחיץ בכלל.
   */
  outlined?: boolean
  children: ReactNode
}

export function IconButton({
  label,
  onClick,
  disabled = false,
  danger = false,
  active = false,
  outlined = false,
  children,
}: IconButtonProps): JSX.Element {
  const tone = danger
    ? 'text-hard-400 active:bg-hard-400/12'
    : active
      ? 'border border-flame-500/45 bg-flame-500/12 text-flame-300 active:bg-flame-500/20'
      : outlined
        ? 'border border-ink-600 bg-ink-850 text-bone-300 active:bg-ink-800'
        : 'text-bone-400 active:bg-ink-800'

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-25',
        tone,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
