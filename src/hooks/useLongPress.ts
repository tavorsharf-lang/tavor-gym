import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react'

/**
 * לחיצה ארוכה על שורה, בלי לגעת במה שהלחיצה הרגילה עושה.
 *
 * נולד בשביל תיקון שיוך השריר ברשימת התרגילים — פעולה נדירה ומכוונת ("טעיתי,
 * זה לא יושב שם"), שגם צריכה להיות זמינה על *כל* שורה וגם לא מצדיקה אייקון
 * שלישי בכל שורה. לשורה כבר יש שני יעדי מגע (הריבוע לגלריה, הגוף למסך
 * התרגיל), ושלישי היה מכווץ את שניהם.
 *
 * שלוש נקודות שכל אחת מהן היא באג אמיתי שהיה קורה בלעדיה:
 *
 *  1. **תזוזה מבטלת.** אצבע שמתחילה על שורה וגוללת היא גלילה, לא לחיצה
 *     ארוכה. בלי הסף ברשימה גוללת כל גלילה איטית הייתה פותחת גיליון.
 *  2. **ה-click שאחרי מבוטל.** אחרי שהלחיצה הארוכה ירתה, ה-pointerup מייצר
 *     click רגיל — כלומר הגיליון היה נפתח *ומיד* מתחתיו המסך מנווט.
 *  3. **תפריט ההקשר מנוטרל.** באייפון לחיצה ארוכה מרימה את תפריט הבחירה של
 *     הדפדפן מעל הגיליון. `onContextMenu` גם משמש כמסלול העכבר (קליק ימני).
 *
 * הטיימר מנוקה גם בפירוק הרכיב: שורה שנעלמת באמצע לחיצה (חיפוש שהוקלד,
 * מתג שהוחלף) הייתה מפעילה את הפעולה על שורה שכבר לא על המסך.
 */

/** כמה זמן להחזיק, וכמה פיקסלים מותר לזוז — שניהם ערכי מגע מקובלים */
const HOLD_MS = 450
const SLOP_PX = 10

export interface LongPressHandlers {
  onClick: (e: ReactMouseEvent) => void
  onPointerDown: (e: ReactPointerEvent) => void
  onPointerMove: (e: ReactPointerEvent) => void
  onPointerUp: () => void
  onPointerCancel: () => void
  onPointerLeave: () => void
  onContextMenu: (e: ReactMouseEvent) => void
}

export function useLongPress(
  onClick: () => void,
  onLongPress: () => void
): LongPressHandlers {
  const timer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const cancel = useCallback((): void => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    start.current = null
  }, [])

  useEffect(() => cancel, [cancel])

  const fire = useCallback((): void => {
    fired.current = true
    cancel()
    onLongPress()
  }, [cancel, onLongPress])

  return {
    onPointerDown: (e) => {
      fired.current = false
      // עכבר ימני לא פותח לחיצה ארוכה — הוא כבר מטופל ב-onContextMenu
      if (e.button !== 0) return
      start.current = { x: e.clientX, y: e.clientY }
      timer.current = window.setTimeout(fire, HOLD_MS)
    },
    onPointerMove: (e) => {
      const from = start.current
      if (!from) return
      if (Math.abs(e.clientX - from.x) > SLOP_PX || Math.abs(e.clientY - from.y) > SLOP_PX) {
        cancel()
      }
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu: (e) => {
      e.preventDefault()
      // קליק ימני בדפדפן שולחני הוא המסלול המקביל, ובמגע זה בדיוק הרגע
      // שבו הלחיצה הארוכה כבר ירתה — ואז אין מה לירות שוב
      if (!fired.current) fire()
    },
    onClick: (e) => {
      if (!fired.current) {
        onClick()
        return
      }
      e.preventDefault()
      e.stopPropagation()
      fired.current = false
    },
  }
}
