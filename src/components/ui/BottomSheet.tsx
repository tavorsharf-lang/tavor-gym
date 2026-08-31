import { useEffect, useId, useRef } from 'react'
import type { JSX, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScroll } from '@/lib/scrollLock'

/**
 * גיליון תחתון — בורר תרגיל, מחשבון פלטות, עריכת סט.
 *
 * נפתח מלמטה כי שם היד. נטען דרך portal ל-body כדי לא לרשת overflow או
 * transform מהמסך שמתחתיו, מה שהיה שובר את ה-fixed באייפון.
 */

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** גובה מרבי באחוזי גובה חלון דינמי */
  maxHeightVh?: number
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeightVh = 85,
}: BottomSheetProps): JSX.Element | null {
  const titleId = useId()

  // onClose נשמר ב-ref כדי שנעילת הגלילה תיקבע רק לפי open. פונקציה חדשה
  // בכל רינדור הייתה מבטלת ומחזירה את הנעילה שוב ושוב.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // ספירת עומק ולא שמירת previous מקומית — הנגן נפתח כ-portal אח מעל
    // הגיליון, ושני נועלים שכל אחד שומר לעצמו נועלים את הדף לצמיתות
    const unlockScroll = lockBodyScroll()
    const returnTo = document.activeElement as HTMLElement | null

    /*
      כליאת פוקוס.

      הגיליון כבר הצהיר role="dialog" ו-aria-modal, אבל Tab המשיך לטייל בתוכן
      שמאחורי ה-backdrop — כלומר ההצהרה הייתה שקר. באפליקציית מגע של משתמש
      יחיד זה לא כואב יומיומית, אבל ברגע ש-VoiceOver מופעל המודל דולף.

      בלי מסנן `offsetParent !== null` שנפוץ בפתרונות כאלה: הוא נשען על פריסה,
      מחזיר null לכל אלמנט בתוך אב `fixed`, ולכן היה משתנה לפי הקשר במקום לפי
      נראות. הבורר עצמו כבר מוציא disabled, hidden ו-tabindex="-1" — וזה מה
      שבאמת קובע אם אפשר להגיע לאלמנט ב-Tab.
    */
    const focusables = (): HTMLElement[] => [
      ...(panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href]:not([hidden]), button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])'
      ) ?? []),
    ]

    /*
      הגיליון לא לוכד פוקוס כשמשהו נפתח מעליו.

      נגן הסרטונים נפתח כ-portal אח *בזמן* שגיליון ההחלפה עדיין פתוח. בלי
      הבדיקה הזו, Shift+Tab בתוך הנגן היה חוטף את הפוקוס בחזרה לגיליון שמתחתיו
      — כלומר הכליאה שנועדה למנוע דליפה הייתה יוצרת מלכודת. פורטלים נדחפים
      ל-body לפי סדר הפתיחה, ולכן האחרון ב-DOM הוא זה שלמעלה.
    */
    const isTopmost = (): boolean => {
      const modals = [...document.querySelectorAll('[aria-modal="true"]')]
      return modals.length === 0 || modals[modals.length - 1] === rootRef.current
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
      // במסמך, כלומר לתוכן שמאחורי ה-backdrop.
      const outside = !panelRef.current?.contains(active)
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
      if (panelRef.current?.contains(document.activeElement)) return
      ;(focusables()[0] ?? panelRef.current)?.focus()
    }, 0)

    return () => {
      window.clearTimeout(enter)
      unlockScroll()
      document.removeEventListener('keydown', onKey)
      returnTo?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-x-0 top-0 z-50 flex h-[100dvh] items-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'חלון'}
    >
      <div
        className="animate-fade absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => closeRef.current()}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="animate-sheet relative flex w-full flex-col overflow-hidden rounded-t-[1.5rem] border-t border-ink-700 bg-ink-900 shadow-[0_-14px_44px_-14px_rgba(0,0,0,0.85)] focus:outline-none"
        style={{ maxHeight: `${maxHeightVh}dvh` }}
      >
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="knurl h-1.5 w-12 rounded-full bg-ink-800" />
        </div>

        {title ? (
          <h2 id={titleId} className="shrink-0 px-5 pt-1 pb-3 text-lg font-extrabold text-bone-50">
            {title}
          </h2>
        ) : null}

        <div className="scroll-touch min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-safe">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
