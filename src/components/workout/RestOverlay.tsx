import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, X } from 'lucide-react'
import { useRestTimer } from '@/hooks/useRestTimer'
import type { AudioCue } from '@/hooks/useAudioCue'
import { formatClock } from '@/domain/units'

/**
 * טיימר המנוחה.
 *
 * שלוש החלטות שמחזיקות את זה באוויר בחדר כושר אמיתי:
 *   1. הספירה מחושבת מול חותמת זמן סיום, לא מצבירת טיקים — המסך יכול לכבות,
 *      האפליקציה יכולה לרדת לרקע, והמספר עדיין יהיה נכון.
 *   2. בסיום יש גם צליל וגם הבזק כתום על כל המסך. מתג ההשתקה הפיזי של האייפון
 *      משתיק WebAudio, וההבזק הוא מה שנשאר כשזה קורה.
 *   3. הכפתורים גדולים ומעוגנים לתחתית — האגודל מגיע אליהם בלי להסתכל.
 */
export function RestOverlay({
  endsAt,
  totalSeconds,
  audio,
  onAdjust,
  onSkip,
  nextLabel,
}: {
  endsAt: number | null
  totalSeconds: number
  audio: AudioCue
  onAdjust: (deltaSeconds: number) => void
  onSkip: () => void
  /** מה מחכה אחרי המנוחה, למשל "סט 3 מתוך 4" */
  nextLabel?: string
}) {
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef<number | null>(null)

  const timer = useRestTimer(endsAt, totalSeconds, () => {
    // מנוחה שהסתיימה לפני יותר מדקה כבר לא רלוונטית — לא מצפצפים על היסטוריה
    if (endsAt !== null && Date.now() - endsAt > 60_000) return
    audio.beep('done')
    setFlash(true)
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(false), 1500)
  })

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
    }
  }, [])

  // שלוש השניות האחרונות מקבלות פעימה — התראה מקדימה בלי צליל
  const urgent = timer.active && timer.remainingSeconds <= 3 && timer.remainingSeconds > 0

  if (!timer.active && !flash) return null

  const ringSize = 280
  const radius = 128
  const circumference = 2 * Math.PI * radius
  const drained = circumference * Math.min(1, timer.progress)

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col animate-fade" role="dialog" aria-modal="true">
      {/* רקע: שחור עמוק עם הילת חום שמתחזקת ככל שנשאר פחות זמן */}
      <div
        className="absolute inset-0 bg-ink-950/97 backdrop-blur-xl transition-[background] duration-1000"
        style={{
          backgroundImage: `radial-gradient(90% 55% at 50% 42%, rgba(255,106,0,${
            0.06 + 0.16 * timer.progress
          }), transparent 70%)`,
        }}
      />
      {flash && (
        <div className="pointer-events-none absolute inset-0 animate-flash bg-flame-500" />
      )}

      <div className="relative flex flex-1 flex-col items-center justify-center px-6">
        <p className="meta mb-6 uppercase">מנוחה</p>

        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="-rotate-90">
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
              stroke="var(--color-flame-500)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={drained}
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,106,0,.65))' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              dir="ltr"
              className={`numeral-hero tabular-nums text-[5.5rem] ${
                urgent ? 'animate-heat text-flame-400' : 'text-bone-50'
              }`}
            >
              {formatClock(timer.remainingSeconds)}
            </span>
          </div>
        </div>

        {nextLabel && <p className="mt-8 text-sm font-semibold text-bone-400">{nextLabel}</p>}
      </div>

      <div className="relative px-5 pb-safe">
        <div className="mx-auto flex max-w-md items-stretch gap-3">
          <button
            onClick={() => onAdjust(-15)}
            className="btn-ghost flex h-16 flex-1 items-center justify-center gap-1.5 rounded-card text-base font-bold"
          >
            <Minus size={18} />
            15
          </button>
          <button
            onClick={onSkip}
            className="btn-flame flex h-16 flex-[1.4] items-center justify-center gap-2 rounded-card text-lg"
          >
            <X size={20} />
            דלג
          </button>
          <button
            onClick={() => onAdjust(15)}
            className="btn-ghost flex h-16 flex-1 items-center justify-center gap-1.5 rounded-card text-base font-bold"
          >
            <Plus size={18} />
            15
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
