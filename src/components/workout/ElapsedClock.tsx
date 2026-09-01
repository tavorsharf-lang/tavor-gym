import type { JSX } from 'react'
import { useNow } from '@/hooks/useNow'
import { formatClock } from '@/domain/units'

/**
 * כמה זמן עבר מתחילת האימון.
 *
 * שלוש החלטות:
 *   • רכיב נפרד בכוונה — הטיק של כל שנייה מרנדר מחדש את הכיתוב הזה בלבד,
 *     ולא את כרטיס התרגיל, את התור ואת פס ההתקדמות מסביבו.
 *   • הזמן מחושב מ-`startedAt` בכל רינדור ולא נצבר מטיקים. iOS מקפיא
 *     אינטרוולים ברקע, ו-`useNow` מיישר מחדש ברגע החזרה לאפליקציה — אימון
 *     שהטלפון ננעל באמצעו מראה את הזמן הנכון, לא את הזמן שהמסך היה דלוק.
 *   • אין כאן `<button>`: זה מד ולא פעולה. בכותרת האימון הוא יושב צמוד לכפתור
 *     אייקון, ומראה של כפתור היה מזמין לחיצה שלא עושה כלום.
 *
 * הנקודה הירוקה במקום אייקון שעון: היא אומרת "רץ עכשיו" ולא "זמן", וזו
 * ההבחנה שמפרידה אותו משעון המנוחה שיכול לחיות לידו על אותו מסך.
 */
export function ElapsedClock({
  startedAt,
  className = '',
  label = 'זמן מתחילת האימון',
}: {
  startedAt: number
  className?: string
  /**
   * שם נגיש חלופי. בזמן מנוחה שני שעונים חיים על המסך יחד — זה שבכותרת
   * וזה שמעל שכבת המנוחה — ושני `timer` באותו שם הם עמימות אמיתית, גם
   * לקורא מסך וגם לכל שאילתת בדיקה שמחפשת אחד מהם.
   */
  label?: string
}): JSX.Element {
  const now = useNow(1000)
  return (
    <div
      role="timer"
      aria-label={label}
      className={`flex h-7 shrink-0 items-center gap-1.5 rounded-pill border border-ink-700 bg-ink-900 px-[11px] ${className}`}
    >
      <span className="size-[5px] shrink-0 rounded-full bg-pr-400" aria-hidden="true" />
      <span dir="ltr" className="tnum text-[0.78125rem] leading-none font-bold text-bone-300">
        {formatClock(Math.max(0, (now - startedAt) / 1000))}
      </span>
    </div>
  )
}
