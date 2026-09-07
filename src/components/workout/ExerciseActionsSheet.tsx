import type { JSX, ReactNode } from 'react'
import { Check, Clock, Minus, Plus, Repeat, SkipForward, Timer } from 'lucide-react'
import { BottomSheet } from '@/components/ui'
import { formatClock } from '@/domain/units'
import { SetTuner } from './SetTuner'

/**
 * גיליון הפעולות של התרגיל — מה שהיה ארבעה כפתורים רבועים בתחתית הכרטיס.
 *
 * הם ירדו משם כי הם עלו לכרטיס 120 פיקסלים קבועים כדי לענות על שאלות שנשאלות
 * פעם באימון: המכונה תפוסה, התרגיל לא מתאים היום, סיימתי מוקדם. הכפתור הכתום
 * הוא מה שצריך להיות בטווח האגודל, והשאר יושב מאחורי ⋯ אחד.
 *
 * המנוחה של התרגיל נכנסה לכאן מאותה סיבה: היא ירדה משורת הכוונון שעל הכרטיס
 * (שם היא גזלה חצי שורה בכל תרגיל), והרגע שבו באמת משנים אותה — "המכונה הזו
 * מרסקת אותי, אני צריך יותר" — הוא רגע של החלטה ולא של אמצע סט.
 */

function Row({
  icon,
  label,
  hint,
  tone = 'quiet',
  onClick,
}: {
  icon: ReactNode
  label: string
  hint?: string
  tone?: 'quiet' | 'done'
  onClick: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-ghost flex min-h-14 w-full items-center gap-3 rounded-card px-4 text-start"
    >
      <span className={`shrink-0 ${tone === 'done' ? 'text-pr-400' : 'text-bone-400'}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-bold text-bone-100">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[0.6875rem] font-medium text-bone-500">{hint}</span>
        ) : null}
      </span>
    </button>
  )
}

export function ExerciseActionsSheet({
  open,
  onClose,
  exerciseName,
  restSeconds,
  targetSets,
  doneWorkSets,
  /** דילוג קיים רק לפני הסט הראשון — אחרי שיש סטים הסגירה היא "סיים תרגיל" */
  canSkip,
  onDefer,
  onSubstitute,
  onFinishExercise,
  onSkip,
  onRest,
  onTargetSets,
}: {
  open: boolean
  onClose: () => void
  exerciseName: string
  restSeconds: number
  targetSets: number
  doneWorkSets: number
  canSkip: boolean
  onDefer: () => void
  onSubstitute: () => void
  onFinishExercise: () => void
  onSkip: () => void
  onRest: (seconds: number) => void
  /** בחירת יעד שכבר הושג סוגרת את התרגיל — הכרטיס הוא שמחליט, לא הגיליון */
  onTargetSets: (next: number) => void
}): JSX.Element {
  /** סוגר את הגיליון לפני שהפעולה משנה את המסך שמתחתיו */
  const run = (action: () => void) => () => {
    onClose()
    action()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={exerciseName}>
      <div className="flex flex-col gap-2 pt-1 pb-4">
        {/*
          "כמה סטים היום" — כאן ולא רק על הכרטיס, וזו לא כפילות.

          על הכרטיס השורה הזו חיה בבמה, והבמה תפוסה ברגע שמתחילה מנוחה או
          שאלון קושי. אבל בדיוק אז השאלה נשאלת: תכננתי שניים, עשיתי אחד, ואני
          רוצה לסגור. הגיליון פתוח מכל מצב, ולכן היעד נגיש מכל מצב.

          בחירת מספר שכבר בוצע היא "סיימתי כאן" — הכרטיס סוגר את התרגיל.
        */}
        <div className="rounded-card border border-ink-700 bg-ink-900/60 px-3 py-2.5">
          <div className="h-11">
            <SetTuner
              targetSets={targetSets}
              doneWorkSets={doneWorkSets}
              onPick={(next) => {
                if (next <= doneWorkSets) onClose()
                onTargetSets(next)
              }}
            />
          </div>
          <p className="mt-2 text-[0.6875rem] font-medium text-bone-500">
            {doneWorkSets > 0
              ? `תיעדת ${doneWorkSets === 1 ? 'סט אחד' : `${doneWorkSets} סטים`} — בחירה בו סוגרת את התרגיל`
              : 'רק לאימון הזה — התוכנית לא משתנה'}
          </p>
        </div>

        <Row
          icon={<Clock size={18} className="text-flame-400" />}
          label="המתקן תפוס"
          hint="התרגיל יורד שורה אחת בתור וממתין"
          onClick={run(onDefer)}
        />
        <Row
          icon={<Repeat size={18} />}
          label="החלף תרגיל"
          hint="משהו אחר לאותו שריר, עם אותו יעד"
          onClick={run(onSubstitute)}
        />
        <Row
          icon={<Check size={18} />}
          tone="done"
          label="סיים תרגיל"
          hint="סוגר אותו ופותח את הבא בתור"
          onClick={run(onFinishExercise)}
        />
        {canSkip && (
          <Row
            icon={<SkipForward size={18} />}
            label="דלג היום"
            hint="לא עושה את זה הפעם"
            onClick={run(onSkip)}
          />
        )}

        {/*
          מנוחה לתרגיל הזה בלבד — לא להגדרות ולא לתוכנית. dir=ltr על צמד
          הכפתורים בלבד, כמו בכל פקד אחר: מינוס משמאל ופלוס מימין.
        */}
        <div className="mt-1 flex items-center gap-3 rounded-card border border-ink-700 bg-ink-900/60 px-3 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[0.9375rem] font-bold text-bone-100">
              <Timer size={15} className="shrink-0 text-bone-500" aria-hidden="true" />
              מנוחה לתרגיל הזה
            </span>
            <span className="mt-0.5 block text-[0.6875rem] font-medium text-bone-500">
              רק לאימון הזה — התוכנית לא משתנה
            </span>
          </span>
          <span dir="ltr" className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="פחות 15 שניות מנוחה"
              disabled={restSeconds <= 0}
              onClick={() => onRest(restSeconds - 15)}
              className="btn-ghost flex size-11 items-center justify-center rounded-xl disabled:opacity-30"
            >
              <Minus size={16} strokeWidth={3} />
            </button>
            <span
              dir="ltr"
              className="tnum w-12 text-center text-sm font-extrabold text-bone-100"
            >
              {restSeconds > 0 ? formatClock(restSeconds) : '—'}
            </span>
            <button
              type="button"
              aria-label="עוד 15 שניות מנוחה"
              onClick={() => onRest(restSeconds + 15)}
              className="btn-ghost flex size-11 items-center justify-center rounded-xl"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </span>
        </div>
      </div>
    </BottomSheet>
  )
}
