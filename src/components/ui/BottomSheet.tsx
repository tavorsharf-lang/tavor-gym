import { useEffect, useId, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalLayer } from '@/hooks/useModalLayer'

/**
 * גיליון תחתון — בורר תרגיל, מחשבון פלטות, עריכת סט.
 *
 * נפתח מלמטה כי שם היד. נטען דרך portal ל-body כדי לא לרשת overflow או
 * transform מהמסך שמתחתיו, מה שהיה שובר את ה-fixed באייפון.
 *
 * **סגירה בהחלקה מלמעלה למטה.** הידית שבראש הגיליון הייתה קישוט: היא נראית
 * כמו ידית גרירה בכל אפליקציה אחרת, והאצבע ניסתה למשוך אותה ולא קרה כלום.
 * עכשיו הגרירה אמיתית, והיא מה שמחזיר מבורר התרגילים אל מסך האימון שמתחתיו
 * בלי לחפש כפתור.
 */

/**
 * משך הכניסה והיציאה, ובדיוק כמה זמן הגיליון נשאר ב-DOM אחרי שנסגר.
 *
 * הכניסה הייתה `@keyframes`, ובזה היו שני באגים. הראשון: אנימציה גוברת על
 * סטייל אינליין בקסקייד, ולכן גרירה שהתחילה בתוך 280ms הראשונים נבלעה —
 * האצבע זזה והגיליון לא. השני: יציאה לא הייתה בכלל. הגיליון עלה ב-280ms
 * ונעלם בפריים אחד, וגרוע מכך דווקא במסלול שהקובץ הזה השקיע בו — גוררים
 * אותו 95 פיקסלים, משחררים, והוא מפסיק להתקיים במקום להמשיך לשפה שממנה בא.
 *
 * טרנזישן במקום קיפריימים פותר את שניהם: הוא מכוון מחדש מהמצב הנוכחי במקום
 * להתחיל מאפס, ולכן הוא גם מפסיק להילחם בגרירה וגם יודע לצאת מאיפה שהאצבע
 * עזבה.
 */
const SHEET_MS = 280

/** כמה צריך למשוך כדי לסגור — או כמה מהר, למי שרק מנפנף */
const CLOSE_DISTANCE_PX = 96
const FLICK_DISTANCE_PX = 32
const FLICK_SPEED_PX_MS = 0.5

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

  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  /*
    ── גרירה לסגירה ──

    הידית והכותרת הן שטח הגרירה, ולא כל הגיליון. זו לא התפשרות אלא הכרח:
    ‏`touch-action` נקרא פעם אחת בתחילת המחווה, ולכן אי אפשר "להשתלט" על נגיעה
    שכבר התחילה לגלול. שטח גרירה שכולל את התוכן היה דורש `touch-action: none`
    עליו — כלומר לבטל את הגלילה בבורר שיש בו מאה שורות.

    ‏`dragY` הוא state ולא ref כי הוא מצויר, אבל נקודת ההתחלה היא ref: בין
    ‏pointerdown ל-pointerup יש רינדורים, וכל אחד מהם היה מאפס אותה.
  */
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragFrom = useRef<{ y: number; at: number } | null>(null)

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>): void => {
    // תפיסת המצביע: גם אם האצבע יוצאת מהידית, ה-pointerup עדיין מגיע לכאן
    e.currentTarget.setPointerCapture(e.pointerId)
    dragFrom.current = { y: e.clientY, at: e.timeStamp }
    setDragging(true)
    setDragY(0)
  }

  const onDragMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    const from = dragFrom.current
    if (!from) return
    // רק כלפי מטה. משיכה למעלה לא "מותחת" את הגיליון — היא פשוט לא עושה כלום.
    setDragY(Math.max(0, e.clientY - from.y))
  }

  const onDragEnd = (e: React.PointerEvent<HTMLDivElement>): void => {
    const from = dragFrom.current
    if (!from) return
    dragFrom.current = null
    setDragging(false)
    const dy = Math.max(0, e.clientY - from.y)
    const dt = Math.max(1, e.timeStamp - from.at)
    /*
      שני מסלולים לסגירה, ומי שרק מנפנף צריך את השני: משיכה ארוכה סוגרת לפי
      מרחק, ותנועה קצרה ומהירה סוגרת לפי מהירות. בלי הענף השני נפנוף טבעי של
      שלושים פיקסלים היה מחזיר את הגיליון למקומו, וזה נקרא "לא הגיב".
    */
    const flick = dy > FLICK_DISTANCE_PX && dy / dt > FLICK_SPEED_PX_MS
    if (dy > CLOSE_DISTANCE_PX || flick) {
      onClose()
      return
    }
    setDragY(0)
  }

  // גיליון שנפתח מחדש חייב להתחיל מאפס, אחרת הוא עולה כבר מוזז
  useEffect(() => {
    if (open) return
    dragFrom.current = null
    setDragging(false)
    setDragY(0)
  }, [open])

  /*
    שני מצבים ולא אחד: `present` הוא "קיים ב-DOM" ו-`shown` הוא "במצב הפתוח".
    הפער ביניהם הוא כל היציאה — הגיליון כבר לא פתוח, אבל הוא עדיין מצויר
    ומחליק החוצה.

    ‏`requestAnimationFrame` בכניסה הוא הכרח ולא זהירות: בלי פריים אחד בין
    ההרכבה לבין `shown`, הדפדפן מאחד את שני המצבים לחישוב סגנון אחד ואין מה
    לעבור בינו לבין עצמו — הגיליון פשוט מופיע במקומו.
  */
  const [present, setPresent] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (open) {
      setPresent(true)
      const frame = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(frame)
    }
    setShown(false)
    const id = window.setTimeout(() => setPresent(false), SHEET_MS)
    return () => window.clearTimeout(id)
  }, [open])

  /*
    נעילת הגלילה, Escape, כליאת הפוקוס והחזרתו יושבות ב-`useModalLayer`.
    הן היו כתובות כאן, ו-`RestOverlay` הצהיר `aria-modal` בלי אף אחת מהן —
    החילוץ הוא מה שנתן לו אותן בלי להעתיק אותן.
  */
  useModalLayer(open, { root: rootRef, panel: panelRef, onClose })

  if (!present) return null

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-x-0 top-0 z-50 flex h-[100dvh] items-end"
      /*
        הסמנטיקה נגזרת מ-`open` ולא מ-`shown`, וזה לא קיצור: `shown` מתעדכן
        בפריים שאחרי ההרכבה, ולכן קשירה אליו הייתה מסתירה את הגיליון מעץ
        הנגישות בדיוק ברגע שבו הוא נפתח.

        מה שכן נגזר מהיציאה: בזמנה הגיליון כבר לא מודאל. הוא נשאר מצויר עוד
        ‏280ms, ובחלון הזה `isTopmost` של שכבה אחרת הייתה סופרת אותו כעליון
        וחוסמת לעצמה את הפוקוס.
      */
      role={open ? 'dialog' : undefined}
      aria-modal={open ? true : undefined}
      aria-hidden={open ? undefined : true}
      aria-labelledby={open && title ? titleId : undefined}
      aria-label={open && !title ? 'חלון' : undefined}
    >
      {/*
        ‏`pointer-events-none` בזמן היציאה הוא לא ניקיון: ה-backdrop שקוף אבל
        עדיין פרוס על כל המסך, ובלעדיו הוא היה בולע נגיעות 280ms אחרי שהגיליון
        נסגר. תחת "הפחתת תנועה" המעבר מסתיים מיד וההמתנה נשארת — כלומר שם זה
        היה מורגש במיוחד.
      */}
      <div
        className={`absolute inset-0 bg-ink-950/70 backdrop-blur-sm transition-opacity duration-[280ms] ease-swift ${
          shown ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={() => onClose()}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative flex w-full flex-col overflow-hidden rounded-t-[1.5rem] border-t border-ink-700 bg-ink-900 shadow-[0_-14px_44px_-14px_rgba(0,0,0,0.85)] focus:outline-none ${
          dragging ? '' : 'transition-transform duration-[280ms] ease-swift'
        }`}
        style={{
          maxHeight: `${maxHeightVh}dvh`,
          /*
            ‏`100%` הוא גובה הגיליון עצמו ולא מספר קשיח, ולכן אותו ערך נכון
            לגיליון של שתי שורות ולגיליון של 85dvh. כשהוא נסגר אחרי גרירה
            הטרנזישן מכוון מהמיקום שהאצבע עזבה אל השפה, במקום לקפוץ.
          */
          transform: shown ? `translateY(${dragY}px)` : 'translateY(100%)',
        }}
      >
        {/*
          שטח הגרירה: הידית והכותרת יחד. `touch-action: none` חייב לשבת כאן
          ולא על הפאנל — עליו הוא היה מבטל את הגלילה של התוכן.
        */}
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onLostPointerCapture={onDragEnd}
          /*
            ‏min-h-11 הוא הרצפה ולא העיצוב: עם כותרת האזור ממילא גבוה ממנה,
            ובגיליון בלי כותרת הידית לבדה הייתה שטח גרירה של 22 פיקסלים.
          */
          className="no-touch-scroll min-h-11 shrink-0 cursor-grab active:cursor-grabbing"
        >
          <div className="flex justify-center pt-3 pb-1">
            <div
              className={`knurl h-1.5 w-12 rounded-full transition-colors ${
                dragging ? 'bg-ink-600' : 'bg-ink-800'
              }`}
            />
          </div>

          {title ? (
            <h2 id={titleId} className="px-5 pt-1 pb-3 text-lg font-extrabold text-bone-50">
              {title}
            </h2>
          ) : null}
        </div>

        <div className="scroll-touch min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-safe">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
