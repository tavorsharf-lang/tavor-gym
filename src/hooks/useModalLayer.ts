import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { lockBodyScroll } from '@/lib/scrollLock'

/**
 * המעטפת של שכבה מודאלית: נעילת גלילה, Escape, כליאת פוקוס והחזרתו.
 *
 * זה היה כתוב פעם אחת בתוך `BottomSheet`, ו-`RestOverlay` — השכבה שנפתחת הכי
 * הרבה באפליקציה — הצהיר `role="dialog" aria-modal="true"` בלי אף אחד
 * מהארבעה. כלומר ההצהרה הייתה שקר: ‏Tab המשיך לטייל במסך האימון שמאחורי
 * השכבה, ו-VoiceOver הלך אחריו.
 *
 * החילוץ הוא לכאן ולא לקומפוננטה עוטפת בכוונה: לשתי השכבות יש DOM שונה
 * לגמרי (גיליון שנשען לתחתית מול מסך מלא), ומה שמשותף להן הוא ההתנהגות.
 */
export interface ModalLayerOptions {
  /** האלמנט שנושא `aria-modal` — הוא שנספר מול פורטלים אחים */
  root: RefObject<HTMLElement | null>
  /**
   * האזור שבתוכו הפוקוס נכלא. ברירת המחדל היא `root` עצמו, וזה הנכון לשכבה
   * שהיא מסך מלא; לגיליון זה הפאנל ולא ה-backdrop שמעליו.
   */
  panel?: RefObject<HTMLElement | null>
  onClose: () => void
}

/**
 * בורר האלמנטים שאפשר להגיע אליהם ב-Tab.
 *
 * בלי מסנן `offsetParent !== null` שנפוץ בפתרונות כאלה: הוא נשען על פריסה,
 * מחזיר null לכל אלמנט בתוך אב `fixed`, ולכן היה משתנה לפי הקשר במקום לפי
 * נראות. הבורר עצמו כבר מוציא disabled, hidden ו-tabindex="-1" — וזה מה
 * שבאמת קובע אם אפשר להגיע לאלמנט ב-Tab.
 */
const FOCUSABLE =
  'a[href]:not([hidden]), button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])'

export function useModalLayer(open: boolean, opts: ModalLayerOptions): void {
  const { root, panel, onClose } = opts

  // onClose נשמר ב-ref כדי שהאפקט ייקבע רק לפי open. פונקציה חדשה בכל רינדור
  // הייתה מבטלת ומחזירה את נעילת הגלילה שוב ושוב.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const trapIn = panel ?? root

    // ספירת עומק ולא שמירת previous מקומית — הנגן נפתח כ-portal אח מעל
    // הגיליון, ושני נועלים שכל אחד שומר לעצמו נועלים את הדף לצמיתות
    const unlockScroll = lockBodyScroll()
    const returnTo = document.activeElement as HTMLElement | null

    const focusables = (): HTMLElement[] => [
      ...(trapIn.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
    ]

    /*
      השכבה לא לוכדת פוקוס כשמשהו נפתח מעליה.

      נגן הסרטונים נפתח כ-portal אח *בזמן* שגיליון ההחלפה עדיין פתוח. בלי
      הבדיקה הזו, Shift+Tab בתוך הנגן היה חוטף את הפוקוס בחזרה לגיליון שמתחתיו
      — כלומר הכליאה שנועדה למנוע דליפה הייתה יוצרת מלכודת. פורטלים נדחפים
      ל-body לפי סדר הפתיחה, ולכן האחרון ב-DOM הוא זה שלמעלה.
    */
    const isTopmost = (): boolean => {
      const modals = [...document.querySelectorAll('[aria-modal="true"]')]
      return modals.length === 0 || modals[modals.length - 1] === root.current
    }

    const onKey = (e: KeyboardEvent) => {
      if (!isTopmost()) return
      if (e.key === 'Escape') {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      // פוקוס שאינו בתוך הפאנל — בדרך כלל <body> אחרי נגיעה באזור לא ממוקד —
      // חייב להיתפס בשני הכיוונים. בלי זה Tab היה מעביר אותו לאלמנט הראשון
      // במסמך, כלומר לתוכן שמאחורי השכבה.
      const outside = !trapIn.current?.contains(active)
      if (e.shiftKey && (outside || active === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (outside || active === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    // הפוקוס נכנס פנימה, ובסגירה חוזר למה שפתח — אחרת הוא נופל לתחילת הדף
    const enter = window.setTimeout(() => {
      if (trapIn.current?.contains(document.activeElement)) return
      ;(focusables()[0] ?? trapIn.current)?.focus()
    }, 0)

    return () => {
      window.clearTimeout(enter)
      unlockScroll()
      document.removeEventListener('keydown', onKey)
      returnTo?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}
