import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { JSX } from 'react'
import { newId } from '@/domain/units'

/**
 * טוסטים.
 *
 * חנות זעירה ברמת המודול ולא context — כך אפשר לקרוא ל-toast() גם מקוד שלא
 * רץ בתוך רינדור (שמירה למסד, עדכון service worker, שגיאת ייבוא).
 *
 * הם יושבים למטה אבל *מעל* הסרגל התחתון: הפעולה הראשית לעולם לא מוסתרת.
 */

export type ToastTone = 'info' | 'success' | 'warn'

export interface ToastOptions {
  tone?: ToastTone
  actionLabel?: string
  onAction?: () => void
  durationMs?: number
}

interface ToastItem {
  id: string
  message: string
  tone: ToastTone
  actionLabel?: string
  onAction?: () => void
}

const DEFAULT_DURATION_MS = 4000
/**
 * טוסט עם פעולה חי יותר, אבל לא לנצח.
 *
 * הכלל הקודם היה "עם פעולה — נשאר עד שנוגעים בו", בנימוק ש"בטל" שנעלם אחרי
 * ארבע שניות הוא בדיחה. בפועל זה ייצר את ההפך: מסך האימון נשאר עם כרטיס
 * שמכסה את המשקל ואת החזרות עד שהמשתמש חיפש אותו וסגר אותו ידנית. שבע שניות
 * הן חלון אמיתי ללחוץ "בטל" או "התחל עכשיו", וגם סוף מובטח.
 */
const ACTION_DURATION_MS = 7000
/**
 * אחד. לא שלושה.
 *
 * הערימה נבנתה כדי לא לאבד הודעות, ומה שקרה בפועל הוא שלוש הודעות זהות
 * ("X נוסף לאימון") שמכסות שליש מהמסך אחרי שלוש הוספות ברצף — בדיוק התרחיש
 * הנפוץ. החדש דורס את הקודם: זה מה שהמשתמש הסתכל עליו ממילא.
 */
const MAX_VISIBLE = 1

let items: readonly ToastItem[] = []
const listeners = new Set<() => void>()
const timers = new Map<string, number>()

function publish(next: readonly ToastItem[]): void {
  items = next
  for (const notify of listeners) notify()
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}

function snapshot(): readonly ToastItem[] {
  return items
}

function clearTimer(id: string): void {
  const handle = timers.get(id)
  if (handle !== undefined) {
    window.clearTimeout(handle)
    timers.delete(id)
  }
}

function dismiss(id: string): void {
  clearTimer(id)
  if (!items.some((t) => t.id === id)) return
  publish(items.filter((t) => t.id !== id))
}

export function toast(message: string, opts: ToastOptions = {}): void {
  const item: ToastItem = {
    id: newId('toast-'),
    message,
    tone: opts.tone ?? 'info',
    actionLabel: opts.actionLabel,
    onAction: opts.onAction,
  }
  const all = [...items, item]
  const visible = all.slice(-MAX_VISIBLE)
  for (const dropped of all.slice(0, all.length - visible.length)) clearTimer(dropped.id)
  publish(visible)

  const ms =
    opts.durationMs ??
    (item.actionLabel === undefined ? DEFAULT_DURATION_MS : ACTION_DURATION_MS)
  timers.set(item.id, window.setTimeout(() => dismiss(item.id), ms))
}

const TONES: Record<ToastTone, string> = {
  info: 'border-ink-600 text-bone-200',
  success: 'border-pr-400/35 text-pr-400',
  warn: 'border-flame-400/40 text-flame-400',
}

/**
 * כמה זמן טוסט נשאר מצויר אחרי שהוסר מהחנות, וכמה נמשכת היציאה שלו.
 * שני המספרים חייבים להיות זהים, אחרת הוא נחתך באמצע או נשאר תקוע שקוף.
 */
const EXIT_MS = 260

/** מותקן פעם אחת ב-App */
export function ToastHost(): JSX.Element {
  const list = useSyncExternalStore(subscribe, snapshot, snapshot)

  /*
    טוסט שהוסר מהחנות נשאר מצויר עוד רגע, כדי שיהיה לו במה לצאת.

    קודם הוא נכנס ב-340ms ונעלם בפריים אחד. זה בולט במיוחד כאן, כי
    ‏`MAX_VISIBLE` הוא אחד: טוסט חדש *דורס* את הקודם, ובלי יציאה ההחלפה
    נראתה כמו הבהוב ולא כמו החלפה.

    הטיימרים יושבים ב-ref ולא ב-cleanup של האפקט בכוונה. הרשימה מתחלפת בכל
    טוסט חדש, ו-cleanup היה מבטל את הטיימר של מי שכבר יוצא — כלומר משאיר
    אותו על המסך לנצח.
  */
  const [leaving, setLeaving] = useState<readonly ToastItem[]>([])
  const prev = useRef(list)
  const exitTimers = useRef(new Map<string, number>())

  useEffect(() => {
    const gone = prev.current.filter((p) => !list.some((t) => t.id === p.id))
    prev.current = list
    if (gone.length === 0) return
    setLeaving((cur) => [...cur.filter((t) => !gone.some((g) => g.id === t.id)), ...gone])
    for (const item of gone) {
      const handle = window.setTimeout(() => {
        exitTimers.current.delete(item.id)
        setLeaving((cur) => cur.filter((t) => t.id !== item.id))
      }, EXIT_MS)
      exitTimers.current.set(item.id, handle)
    }
  }, [list])

  useEffect(() => {
    const timers = exitTimers.current
    return () => {
      for (const handle of timers.values()) window.clearTimeout(handle)
    }
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col gap-2 px-4 pb-dock"
      role="status"
      aria-live="polite"
    >
      {[...leaving, ...list].map((t) => {
        const out = leaving.some((l) => l.id === t.id)
        return (
        <div
          key={t.id}
          className={[
            'card flex items-center gap-2 py-1 ps-4 pe-2 backdrop-blur-md',
            'transition-[opacity,transform] duration-[260ms] ease-swift',
            /*
              ‏`animate-rise` יורד ביציאה, וזה מה שמאפשר לטרנזישן לעבוד: הוא
              מוגדר `both`, והמילוי שלו היה גובר על כל טרנזישן. הוא מסתיים
              בדיוק על מצב הבסיס, ולכן הסרתו לא מקפיצה כלום.
            */
            out
              ? 'pointer-events-none translate-y-2 opacity-0'
              : 'animate-rise pointer-events-auto',
            TONES[t.tone],
          ].join(' ')}
          /*
            טוסט שיוצא כבר לא נמצא: המכל הוא `aria-live`, וטוסט שמחליק החוצה
            לא אמור להיות מוכרז שוב, לקבל פוקוס, או להיענות ללחיצה.
          */
          aria-hidden={out || undefined}
          inert={out}
        >
          <button
            type="button"
            title="סגור"
            onClick={() => dismiss(t.id)}
            className="flex min-h-12 flex-1 items-center text-start text-sm leading-snug font-semibold"
          >
            {t.message}
          </button>
          {t.actionLabel !== undefined ? (
            <button
              type="button"
              onClick={() => {
                t.onAction?.()
                dismiss(t.id)
              }}
              className="btn-ghost min-h-12 shrink-0 rounded-xl px-4 text-sm font-extrabold text-flame-400"
            >
              {t.actionLabel}
            </button>
          ) : null}
        </div>
        )
      })}
    </div>
  )
}
