import type { JSX } from 'react'
import { useRestTimer } from '@/hooks/useRestTimer'
import { formatClock } from '@/domain/units'

/**
 * המנוחה, בתוך הכרטיס.
 *
 * עד כאן כל סט פתח מסך מלא. זה נכון לדקה של הפסקה אמיתית ולא נכון לארבעים
 * וחמש שניות בין סט לסט: המסך שקפץ הסתיר את הכרטיס, את התור ואת הכותרת, ואז
 * נסגר — שלוש תמונות שונות לאותה שנייה. כאן המנוחה יושבת **באותם 196 פיקסלים
 * שבהם יושב הכפתור הכתום**, ולכן שום דבר על המסך לא זז כשהיא נכנסת ויוצאת.
 *
 * המסך המלא לא נמחק: לחיצה על המספר פותחת אותו, על אותו טיימר בדיוק — אותה
 * חותמת `restEndsAt` מהחנות, לא ספירה שנייה. סגירתו חוזרת לכאן והספירה ממשיכה
 * רצוף, כי מעולם לא היו שתיים.
 *
 * הצליל וההבזק **אינם כאן**. `RestOverlay` הוא הבעלים היחיד שלהם — הוא נשאר
 * מורכב גם כשהוא מכווץ בדיוק בשביל זה — ושני בעלים לאותו צפצוף היו מייצרים
 * שני צפצופים בכל מנוחה שבה שתי השכבות חיות יחד.
 */
export function InlineRest({
  endsAt,
  totalSeconds,
  nextTitle,
  nextName,
  nextLine,
  onOpenFull,
  onAdd30,
  onReady,
}: {
  endsAt: number | null
  totalSeconds: number
  /** "הסט הבא" כשנשאר סט בתרגיל הזה, "התרגיל הבא" כשהיעד הושלם */
  nextTitle: string
  nextName: string
  /** "62.5 ק״ג × 10" — מה שהולך להירשם */
  nextLine: string
  onOpenFull: () => void
  onAdd30: () => void
  /** מסיים את המנוחה וחוזר לכפתור הכתום */
  onReady: () => void
}): JSX.Element {
  // בלי onFinish: הבעלות על הצליל ועל ההבזק היא של `RestOverlay` בלבד
  const timer = useRestTimer(endsAt, totalSeconds, () => {})
  const clock = formatClock(timer.remainingSeconds)
  const urgent = timer.active && timer.remainingSeconds <= 3

  return (
    <div className="animate-fade absolute inset-0 flex flex-col justify-between rounded-[18px] border border-flame-500/30 bg-ink-900 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_srgb,var(--color-flame-500)_14%,transparent),transparent_70%)] px-3.5 py-3">
      <div className="flex items-end justify-between gap-2.5">
        {/*
          כל הבלוק הוא הכפתור למסך המלא, ולא אייקון קטן לידו: המספר הוא הדבר
          היחיד שמסתכלים עליו בזמן מנוחה, ולכן הוא גם המקום שהאצבע הולכת אליו.
        */}
        <button
          type="button"
          onClick={onOpenFull}
          className="min-w-0 text-start"
          aria-label={`מנוחה, נותרו ${clock} — פתח את מסך המנוחה המלא`}
        >
          <span className="block text-[0.625rem] leading-none font-bold tracking-[0.14em] text-bone-500">
            מנוחה · גע למסך מלא
          </span>
          <span
            dir="ltr"
            aria-hidden="true"
            className={`mt-2 inline-block border-b border-dashed border-ink-600 text-[2.875rem] leading-none font-extrabold tracking-[-0.05em] tabular-nums ${
              urgent ? 'animate-heat text-flame-400' : 'text-bone-50'
            }`}
          >
            {clock}
          </span>
        </button>

        <div className="min-w-0 text-end">
          <p className="text-[0.625rem] leading-none font-bold tracking-[0.1em] text-bone-500">
            {nextTitle}
          </p>
          <p className="mt-1.5 truncate text-sm leading-tight font-extrabold text-flame-300">
            {nextName}
          </p>
          <p dir="ltr" className="tnum mt-1 text-xs leading-none font-bold text-bone-500">
            {nextLine}
          </p>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-[3px] bg-ink-700">
        <div
          className="h-full rounded-[3px] bg-linear-to-l from-flame-500 to-flame-300 transition-[width] duration-300"
          style={{ width: `${Math.round(timer.progress * 100)}%` }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAdd30}
          className="btn-ghost flex h-[50px] flex-1 items-center justify-center rounded-[15px] text-[0.84375rem] font-bold"
        >
          +30 שניות
        </button>
        <button
          type="button"
          onClick={onReady}
          className="btn-flame flex h-[50px] flex-[1.2] items-center justify-center rounded-[15px] text-[0.90625rem]"
        >
          אני מוכן — {nextTitle === 'התרגיל הבא' ? 'לתרגיל הבא' : 'לסט הבא'}
        </button>
      </div>
    </div>
  )
}
