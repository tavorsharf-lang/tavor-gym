import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, TimerOff, X } from 'lucide-react'
import { useRestTimer } from '@/hooks/useRestTimer'
import type { AudioCue } from '@/hooks/useAudioCue'
import { formatClock } from '@/domain/units'
import { ElapsedClock } from './ElapsedClock'

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
  onDisable,
  nextLabel,
  onAddExercise,
  startedAt,
}: {
  endsAt: number | null
  totalSeconds: number
  audio: AudioCue
  onAdjust: (deltaSeconds: number) => void
  onSkip: () => void
  /**
   * כיבוי טיימר המנוחה מכאן והלאה — לא רק דילוג על המנוחה הזו.
   * למי שמתעד מנוחה בשעון: המסך הזה מיותר, והכפתור בראש המסך מכבה אותו
   * לכל האימון. ההדלקה חזרה ממסך האימון או מההגדרות.
   */
  onDisable: () => void
  /** מה מחכה אחרי המנוחה, למשל "סט 3 מתוך 4" */
  nextLabel?: string
  /**
   * פותח את בורר התרגילים מתוך המנוחה.
   *
   * המנוחה היא הדקה היחידה באימון שבה יש ידיים פנויות וראש פנוי, וזה בדיוק
   * הזמן שבו מחליטים מה הלאה. עד כאן המסך הזה חסם את כל הכותרת, ולכן הוספת
   * תרגיל דרשה קודם לדלג על הטיימר — כלומר לוותר על המנוחה כדי לתכנן אותה.
   *
   * הגיליון נפתח *מעל* המסך הזה ולא במקומו: שני פורטלים, והאחרון ב-DOM הוא
   * שלמעלה. הספירה ממשיכה מתחתיו, וסגירת הגיליון מחזירה אליה.
   */
  onAddExercise?: () => void
  /**
   * תחילת האימון, כדי ששעון האימון ימשיך להיראות גם מכאן.
   *
   * המסך הזה חוסם את כותרת האימון לגמרי, ומנוחה היא בדיוק הרגע שבו שואלים
   * "כמה זמן אני כבר פה". בלי זה השעון היחיד שרואים בזמן מנוחה הוא הספירה
   * לאחור — ושני מספרים שונים עדיף להם לחיות במקומות שונים על המסך.
   */
  startedAt: number
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
          // הגוון מהטוקן ולא כליטרל: שינוי צבע המבטא לא אמור להשאיר את
          // מסך המנוחה — המסך הכי כתום באפליקציה — על הגוון הישן
          backgroundImage: `radial-gradient(90% 55% at 50% 42%, color-mix(in srgb, var(--color-flame-500) ${
            (0.06 + 0.16 * timer.progress) * 100
          }%, transparent), transparent 70%)`,
        }}
      />
      {flash && (
        <div className="pointer-events-none absolute inset-0 animate-flash bg-flame-500" />
      )}

      {/*
        שעון האימון בראש, וכיבוי הטיימר מתחתיו — הרחק מכפתורי הפעולה שבתחתית,
        כי לחיצה עליו היא החלטה ולא רפלקס.
      */}
      <div
        className="relative flex flex-col items-center gap-2"
        style={{ paddingTop: 'calc(var(--safe-t) + 0.75rem)' }}
      >
        <ElapsedClock
          startedAt={startedAt}
          className="min-h-9"
          label="זמן מתחילת האימון, בזמן מנוחה"
        />
        <button
          onClick={onDisable}
          className="flex min-h-11 items-center gap-2 rounded-pill border border-ink-700 bg-ink-900/70 px-4 text-xs font-bold text-bone-400 active:bg-ink-800"
        >
          <TimerOff size={14} />
          אני עם שעון — כבה את טיימר המנוחה
        </button>
      </div>

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
              style={{
                filter:
                  'drop-shadow(0 0 8px color-mix(in srgb, var(--color-flame-500) 65%, transparent))',
              }}
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

        {/*
          באמצע המסך ולא בשורת הפעולות שבתחתית: שם יושבים ‎±15 ו"דלג", שלושתם
          רפלקס של אמצע סט. זו החלטה שקטה יותר ולכן היא רחוקה מהאגודל.
        */}
        {onAddExercise ? (
          <button
            onClick={onAddExercise}
            /*
              תווית מפורשת ושונה מזו של הכפתור בכותרת האימון. שני כפתורים
              באותו שם נגיש שיכולים להיות על המסך יחד הם עמימות אמיתית — גם
              לקורא מסך, וגם לכל שאילתת בדיקה שמחפשת אחד מהם לפי שם.
            */
            aria-label="הוסף תרגיל לאימון בזמן המנוחה"
            className={`flex min-h-12 items-center gap-2 rounded-pill border border-ink-700 bg-ink-900/70 px-4 text-sm font-bold text-bone-300 active:bg-ink-800 ${
              nextLabel ? 'mt-5' : 'mt-8'
            }`}
          >
            <Plus size={16} />
            הוסף תרגיל
          </button>
        ) : null}
      </div>

      <div className="relative px-5 pb-safe">
        {/*
          dir="ltr" בכוונה: מינוס בצד השמאלי הפיזי ופלוס בימני, בדיוק כמו
          ה-Stepper של המשקל. האצבע עוברת ישירות מהאחד לשני באמצע אימון,
          ושיקוף היה גורם להוריד זמן במקום להוסיף.
        */}
        <div dir="ltr" className="mx-auto flex max-w-md items-stretch gap-3">
          <button
            onClick={() => onAdjust(-15)}
            aria-label="הפחת 15 שניות"
            className="btn-ghost flex h-16 flex-1 items-center justify-center gap-1.5 rounded-card text-base font-bold"
          >
            <Minus size={18} />
            15
          </button>
          <button
            onClick={onSkip}
            aria-label="דלג על המנוחה"
            className="btn-flame flex h-16 flex-[1.4] items-center justify-center gap-2 rounded-card text-lg"
          >
            <X size={20} />
            דלג
          </button>
          <button
            onClick={() => onAdjust(15)}
            aria-label="הוסף 15 שניות"
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
