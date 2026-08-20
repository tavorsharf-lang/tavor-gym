import type { JSX } from 'react'
import { Check, Clock, SkipForward } from 'lucide-react'
import type { Exercise, QueueItem } from '@/db/types'
import { formatRepRange } from '@/domain/units'

/**
 * תרגיל מכווץ בתור. שורה אחת, שטח לחיצה של 60 פיקסל — נגיעה אחת מעבירה
 * את האימון לתרגיל הזה.
 *
 * הדילוג יושב כלחצן נפרד בקצה השורה ולא בתוכה: העטיפה היא div ולא button,
 * כי כפתור בתוך כפתור הוא HTML לא חוקי ו-iOS מפעיל את שניהם יחד.
 */
export function QueueRow({
  item,
  exercise,
  apart,
  setCount,
  summary,
  onTap,
  onSkip,
}: {
  item: QueueItem
  exercise: Exercise
  /** המשקל שמבדיל בין שני תרגילים בעלי אותו שם — null כשהשם ייחודי */
  apart: string | null
  setCount: number
  /** "4 סטים · 25×10" — ריק כשעוד לא בוצע כלום */
  /** מפורק לשני חלקים כדי שכל אחד יקבל את כיוון הכתיבה הנכון */
  summary: { count: number; top: string } | null
  onTap: () => void
  /** "לא עושה את זה היום" — מוצג רק על תרגיל שעוד לא התחיל */
  onSkip: () => void
}): JSX.Element {
  const done = item.status === 'done'
  const deferred = item.status === 'deferred'
  const skipped = item.status === 'skipped'
  const skippable = !done && !skipped && setCount === 0

  const frame = deferred
    ? 'border-dashed border-flame-500/45 bg-flame-500/[0.04]'
    : done
      ? 'border-ink-800 bg-ink-900/40'
      : skipped
        ? 'border-dashed border-ink-700 bg-ink-900/30'
        : 'border-ink-800 bg-ink-900/60'

  return (
    <div
      className={`flex min-h-[60px] w-full items-stretch rounded-card border transition-colors ${frame} ${
        done || skipped ? 'opacity-55' : ''
      }`}
    >
      <button
        type="button"
        onClick={onTap}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-s-card px-3 py-2 text-start active:bg-ink-800"
      >
        <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
          {done ? (
            <Check size={20} strokeWidth={3} className="text-pr-400" />
          ) : deferred ? (
            <Clock size={18} strokeWidth={2.5} className="text-flame-400" />
          ) : skipped ? (
            <SkipForward size={18} strokeWidth={2.5} className="text-bone-500" />
          ) : (
            <span className="size-3.5 rounded-full border-2 border-ink-600" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-bold text-bone-100">
            {exercise.name}
          </span>
          {deferred ? (
            <span className="mt-0.5 block truncate text-[0.6875rem] font-semibold text-flame-400">
              ממתין — המתקן היה תפוס
            </span>
          ) : skipped ? (
            <span className="mt-0.5 block truncate text-[0.6875rem] font-semibold text-bone-500">
              דילגת היום — לחיצה מחזירה אותו
            </span>
          ) : apart ? (
            // שתי שורות באותו שם בתור הן טעות שמחכה לקרות — המשקל מפריד ביניהן
            <span className="mt-0.5 block truncate text-[0.6875rem] font-semibold text-bone-500">
              {apart}
            </span>
          ) : null}
        </span>

        {/*
          הסיכום מגיע כ-"4 סטים · 25×10". המילה עברית והמספרים לא, ובריצה אחת
          של RTL הזוג משקל×חזרות מתהפך ו-25×10 נקרא כ-10×25 — שני מספרים סבירים
          לגמרי, ולכן טעות שקטה. לכן כל חלק מקבל את הכיוון שלו.
        */}
        <span className="shrink-0 text-xs font-semibold text-bone-500">
          {summary ? (
            <>
              <span>{summary.count} סטים · </span>
              <span dir="ltr" className="tnum inline-block">
                {summary.top}
              </span>
            </>
          ) : skipped ? null : (
            <span dir="ltr" className="tnum inline-block">
              {item.targetSets}×{formatRepRange(item.targetReps, exercise.metric)}
            </span>
          )}
        </span>

        {/* קורא מסך: מספר הסטים כבר מגולם בסיכום, אבל שורה בלי סיכום צריכה אותו */}
        {!summary && setCount > 0 && <span className="sr-only">{setCount} סטים</span>}
      </button>

      {skippable && (
        <button
          type="button"
          onClick={onSkip}
          aria-label={`דלג היום על ${exercise.name}`}
          className="flex w-12 shrink-0 items-center justify-center rounded-e-card border-s border-ink-800/70 text-bone-600 active:bg-ink-800 active:text-bone-300"
        >
          <SkipForward size={16} />
        </button>
      )}
    </div>
  )
}
