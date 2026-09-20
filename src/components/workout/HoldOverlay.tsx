import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { useStopwatch } from '@/hooks/useStopwatch'
import { useModalLayer } from '@/hooks/useModalLayer'
import type { AudioCue } from '@/hooks/useAudioCue'
import { formatClock } from '@/domain/units'

/**
 * סטופר לתרגיל זמן (פלאנק) — מסך מלא, כמו טיימר המנוחה ומאותן סיבות:
 * מסתכלים עליו מרחוק, באמצע מאמץ, ולפעמים בכלל לא.
 *
 * שלוש החלטות:
 *   1. הספירה עולה ולא יורדת, וממשיכה גם אחרי היעד. היעד הוא רף, לא תקרה —
 *      מי שמחזיק 1:30 כשהיעד 1:15 רוצה שה-1:30 הוא מה שיירשם.
 *   2. ביעד יש צליל והבזק, בדיוק כמו בסוף מנוחה — מתג ההשתקה של האייפון
 *      משתיק WebAudio, וההבזק הוא מה שנשאר.
 *   3. "עצור" לא שומר מיד אלא מציג את התוצאה עם אישור: יד שרועדת אחרי
 *      פלאנק לוחצת גם בטעות, ותיעוד שגוי גרוע מלחיצה נוספת.
 */
/**
 * הילת הרקע בשני הגוונים. קבועי מודול, כדי שהמחרוזת לא תיבנה מחדש בכל טיק
 * של הסטופר — האטימות היא מה שמשתנה, וזה כל מה שצריך לנסוע.
 */
const GLOW_FLAME =
  'radial-gradient(90% 55% at 50% 42%, var(--color-flame-500), transparent 70%)'
const GLOW_PR = 'radial-gradient(90% 55% at 50% 42%, var(--color-pr-400), transparent 70%)'

export function HoldOverlay({
  open,
  targetSeconds,
  exerciseName,
  audio,
  onSave,
  onClose,
}: {
  open: boolean
  targetSeconds: number
  exerciseName: string
  audio: AudioCue
  /** נקרא עם מספר השניות שנמדדו, אחרי אישור המשתמש */
  onSave: (elapsedSeconds: number) => void
  onClose: () => void
}): JSX.Element | null {
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  /** התוצאה אחרי עצירה. null = עדיין רץ (או עוד לא התחיל) */
  const [result, setResult] = useState<number | null>(null)

  const watch = useStopwatch(targetSeconds, () => {
    audio.beep('done')
    setFlash(true)
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(false), 1500)
  })

  // התחלה אוטומטית בפתיחה: הכפתור שפתח את המסך הוא כבר "התחל"
  const { start, reset } = watch
  useEffect(() => {
    if (!open) return
    setResult(null)
    start()
    // ההקשר של האודיו נפתח/מתעורר במחוות הפתיחה — כדי שהצפצוף ביעד יעבוד
    audio.keepAlive()
    return () => {
      reset()
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
    }
    // audio יציב לאורך המסך; פתיחה מחדש היא הטריגר היחיד שרוצים
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, start, reset])

  /*
    אותה מעטפת של `BottomSheet` ושל `RestOverlay`: השכבה הזאת הצהירה
    ‏`aria-modal` בלי שם נגיש, בלי Escape, בלי כליאת פוקוס ובלי נעילת גלילה —
    וזה קורה בזמן שפלאנק רץ.
  */
  useModalLayer(open, { root: rootRef, onClose })

  if (!open) return null

  const shown = result ?? watch.elapsedSeconds
  const over = watch.reachedTarget || (result !== null && result >= targetSeconds)

  const ringSize = 280
  const radius = 128
  const circumference = 2 * Math.PI * radius
  // הטבעת נגזרת מהערך המוצג ולא מהסטופר: אחרי "עצור" הסטופר מתאפס,
  // והטבעת צריכה להקפיא את התמונה של התוצאה — לא להתרוקן מתחת למספר
  const progress = targetSeconds > 0 ? Math.min(1, shown / targetSeconds) : 0
  const drained = circumference * (1 - progress)

  const stopNow = (): void => {
    const elapsed = watch.stop()
    setResult(elapsed)
  }

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col animate-fade"
      role="dialog"
      aria-modal="true"
      aria-label={`סטופר — ${exerciseName}`}
    >
      {/* שכבה סטטית לבלר, ושכבה נפרדת להילה — ראה ההנמקה ב-RestOverlay */}
      <div className="absolute inset-0 bg-ink-950/97 backdrop-blur-xl" />
      <div
        className="absolute inset-0 transition-opacity duration-300 ease-linear"
        style={{
          backgroundImage: over ? GLOW_PR : GLOW_FLAME,
          opacity: 0.06 + 0.14 * progress,
        }}
      />
      {flash && <div className="pointer-events-none absolute inset-0 animate-flash bg-flame-500" />}

      <div className="relative flex flex-1 flex-col items-center justify-center px-6">
        <p className="meta mb-2 uppercase">{exerciseName}</p>
        <p className="mb-6 text-sm font-semibold text-bone-400">
          {over ? 'עברת את היעד — כל שנייה נספרת' : `היעד ${formatClock(targetSeconds)}`}
        </p>

        {/*
          ‏280 פיקסלים קשיחים בתוך `px-6` גלשו ב-8 פיקסלים על מסך ברוחב 320 —
          כלומר בתצוגה מוגדלת. `viewBox` שומר על כל החישובים ביחידות המקוריות
          ונותן לקופסה להתכווץ, בדיוק כמו שהטבעת ב-`RestOverlay` כבר עושה.
        */}
        <div className="relative aspect-square w-full max-w-[280px]">
          <svg viewBox={`0 0 ${ringSize} ${ringSize}`} className="h-full w-full -rotate-90">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="var(--color-ink-800)"
              strokeWidth={6}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke={over ? 'var(--color-pr-400)' : 'var(--color-flame-500)'}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={drained}
              style={{
                filter: `drop-shadow(0 0 8px color-mix(in srgb, var(${
                  over ? '--color-pr-400' : '--color-flame-500'
                }) 65%, transparent))`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              dir="ltr"
              className={`numeral-hero tabular-nums text-[5.5rem] ${
                over ? 'text-pr-400' : 'text-bone-50'
              }`}
            >
              {formatClock(shown)}
            </span>
          </div>
        </div>
      </div>

      <div className="relative px-5 pb-safe">
        {result === null ? (
          <div className="mx-auto flex max-w-md flex-col gap-2">
            <button
              onClick={stopNow}
              className="btn-flame flex h-16 w-full items-center justify-center gap-2 rounded-card text-xl font-extrabold"
            >
              עצור
            </button>
            <button
              onClick={onClose}
              className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-card text-sm font-bold text-bone-500 active:bg-ink-800"
            >
              <X size={16} />
              בטל בלי לתעד
            </button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col gap-2">
            <button
              onClick={() => onSave(Math.max(1, result))}
              className="btn-flame flex h-16 w-full items-center justify-center gap-2 rounded-card text-xl font-extrabold"
            >
              <Check size={22} strokeWidth={3} />
              <span>
                שמור סט —{' '}
                <span dir="ltr" className="tabular-nums">
                  {formatClock(result)}
                </span>
              </span>
            </button>
            <button
              onClick={onClose}
              className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-card text-sm font-bold text-bone-500 active:bg-ink-800"
            >
              <X size={16} />
              בטל בלי לתעד
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
