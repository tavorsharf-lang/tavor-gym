import type { JSX } from 'react'
import { Check, Clock, SkipForward } from 'lucide-react'
import type { Exercise, QueueItem } from '@/db/types'
import { formatRepRange } from '@/domain/units'
import { ExerciseThumb } from '@/components/media/ExerciseThumb'

/** "סט אחד" ולא "1 סטים" — שורה בתור נסרקת בעין ושגיאת מספר נתקעת בה */
function setsLabel(n: number): string {
  return n === 1 ? 'סט אחד' : `${n} סטים`
}

/**
 * תרגיל מכווץ בתור — "הבאים בתור", מתחת לכרטיס הפעיל.
 *
 * מאז שהכרטיס הפעיל נכנס למסך אחד, הרשימה הזאת **נראית באמת** ולא רק קיימת
 * מתחת לקו הקיפול, והיא מחליפה את גיליון התור כמסלול הראשי: נגיעה בשורה
 * מעבירה את האימון לתרגיל הזה, בלי לפתוח כלום.
 *
 * הדילוג יושב כלחצן נפרד בקצה השורה ולא בתוכה: העטיפה היא div ולא button,
 * כי כפתור בתוך כפתור הוא HTML לא חוקי ו-iOS מפעיל את שניהם יחד.
 *
 * שורה שהושלמה מתכווצת עוד — 44 במקום 48, מסגרת מקווקוות ובלי תמונה. היא
 * כבר לא החלטה, היא רשומה.
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
  const closed = done || skipped
  const skippable = !done && !skipped && setCount === 0

  if (closed) {
    return (
      <button
        type="button"
        onClick={onTap}
        className="flex h-11 w-full items-center gap-2.5 rounded-[14px] border border-dashed border-ink-700 px-[11px] text-start active:bg-ink-900"
      >
        <span
          className={`flex size-[22px] shrink-0 items-center justify-center rounded-full ${
            done ? 'bg-pr-400/10' : 'bg-ink-800'
          }`}
          aria-hidden="true"
        >
          {done ? (
            <Check size={13} strokeWidth={3} className="text-pr-400" />
          ) : (
            <SkipForward size={12} strokeWidth={2.5} className="text-bone-500" />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold text-bone-500">
          {exercise.name} · {done ? 'הושלם' : 'דילגת היום'}
        </span>
        <span className="shrink-0 text-[0.6875rem] font-semibold text-bone-500">
          {summary ? setsLabel(summary.count) : done ? '' : 'לחיצה מחזירה'}
        </span>
      </button>
    )
  }

  return (
    <div
      className={`flex h-12 w-full items-stretch rounded-[14px] border bg-linear-to-b from-ink-850 to-ink-900 transition-colors ${
        deferred ? 'border-dashed border-flame-500/45' : 'border-ink-800'
      }`}
    >
      <button
        type="button"
        onClick={onTap}
        className="flex min-w-0 flex-1 items-center gap-[11px] rounded-s-[14px] ps-[11px] pe-2 text-start active:bg-ink-800"
      >
        <ExerciseThumb exerciseId={exercise.id} libraryId={exercise.libraryId} size="row" />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] leading-tight font-bold text-bone-200">
            {exercise.name}
          </span>
          <span className="mt-[3px] block truncate text-[0.625rem] leading-none font-medium text-bone-500">
            {deferred
              ? 'ממתין — המתקן היה תפוס'
              : // שתי שורות באותו שם בתור הן טעות שמחכה לקרות — המשקל מפריד ביניהן
                (apart ?? exercise.subTarget)}
          </span>
        </span>

        {/*
          הסיכום מגיע כ-"4 סטים · 25×10". המילה עברית והמספרים לא, ובריצה אחת
          של RTL הזוג משקל×חזרות מתהפך ו-25×10 נקרא כ-10×25 — שני מספרים סבירים
          לגמרי, ולכן טעות שקטה. לכן כל חלק מקבל את הכיוון שלו.
        */}
        <span className="tnum shrink-0 text-[0.71875rem] font-bold text-bone-500">
          {summary ? (
            <>
              <span>{setsLabel(summary.count)} · </span>
              <span dir="ltr" className="inline-block">
                {summary.top}
              </span>
            </>
          ) : (
            <span dir="ltr" className="inline-block">
              {item.targetSets}×{formatRepRange(item.targetReps, exercise.metric)}
            </span>
          )}
        </span>

        {deferred ? (
          <Clock size={15} strokeWidth={2.5} className="shrink-0 text-flame-400" aria-hidden="true" />
        ) : (
          <span
            className="size-[22px] shrink-0 rounded-full border border-ink-700"
            aria-hidden="true"
          />
        )}

        {/* קורא מסך: מספר הסטים כבר מגולם בסיכום, אבל שורה בלי סיכום צריכה אותו */}
        {!summary && setCount > 0 && <span className="sr-only">{setCount} סטים</span>}
      </button>

      {skippable && (
        <button
          type="button"
          onClick={onSkip}
          aria-label={`דלג היום על ${exercise.name}`}
          className="flex w-11 shrink-0 items-center justify-center rounded-e-[14px] border-s border-ink-800/70 text-bone-600 active:bg-ink-800 active:text-bone-300"
        >
          <SkipForward size={15} />
        </button>
      )}
    </div>
  )
}
