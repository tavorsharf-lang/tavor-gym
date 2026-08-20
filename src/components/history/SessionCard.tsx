import { ChevronLeft, Dumbbell, NotebookPen } from 'lucide-react'
import type { JSX } from 'react'
import type { Session } from '@/db/types'
import { formatDuration, formatVolume } from '@/domain/units'
import { formatDateShort, formatRelativeDay } from '@/lib/dates'

/**
 * שורת אימון בהיסטוריה.
 * כל הכרטיס הוא יעד מגע אחד — באמצע גלילה אף אחד לא מכוון לקישור קטן.
 */

export interface SessionCardProps {
  session: Session
  routineName: string
  blockNames: string[]
  onTap: () => void
}

export function SessionCard({
  session,
  routineName,
  blockNames,
  onTap,
}: SessionCardProps): JSX.Element {
  const exerciseCount = new Set(session.actualOrder).size

  return (
    <button
      type="button"
      onClick={onTap}
      className="card flex w-full items-center gap-3 p-3 text-start transition-transform active:scale-[0.985]"
    >
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-full border border-flame-500/30 bg-flame-500/10 text-xl font-extrabold text-flame-400"
      >
        {/*
          רק מזהה קצר נכנס לעיגול. אימון שהמשתמש בנה ושמר נושא מזהה ארוך
          ('W-…'), והדפסה שלו כאן הייתה גולשת מהעיגול ומכערת כל שורה בהיסטוריה.
          המשקולת היא ברירת המחדל, והשם המלא ממילא מופיע לידה.
        */}
        {session.routineId && session.routineId.length <= 2 ? (
          session.routineId
        ) : (
          <Dumbbell size={20} strokeWidth={2.2} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="truncate text-base font-extrabold text-bone-50">{routineName}</span>
          {exerciseCount > 0 && (
            <span className="shrink-0 text-xs text-bone-500">{exerciseCount} תרגילים</span>
          )}
        </span>

        {blockNames.length > 0 && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {blockNames.map((name) => (
              <span
                key={name}
                className="rounded-pill border border-ink-700 bg-ink-800 px-2 py-0.5 text-[0.6875rem] font-semibold text-bone-400"
              >
                {name}
              </span>
            ))}
          </span>
        )}

        <span className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[0.6875rem] text-bone-500">
          <span className="font-semibold text-bone-400">{formatRelativeDay(session.startedAt)}</span>
          <span aria-hidden="true">·</span>
          <span className="tnum" dir="ltr">
            {formatDateShort(session.startedAt)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(session.durationSeconds)}</span>
          <span aria-hidden="true">·</span>
          <span className="tnum font-semibold text-flame-400/90">
            {formatVolume(session.totalVolumeKg)}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tnum">{session.totalSets} סטים</span>
        </span>

        {/*
          רמז להערה. בלעדיו תוצאת חיפוש שהגיעה מהערה נראית כמו תוצאה שגויה —
          שום דבר בכרטיס לא מסביר למה היא עלתה.
        */}
        {session.notes.trim() ? (
          <span className="mt-1.5 flex items-start gap-1.5 text-[0.6875rem] leading-snug text-bone-500">
            <NotebookPen size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2 min-w-0">{session.notes.trim()}</span>
          </span>
        ) : null}
      </span>

      <ChevronLeft size={18} className="shrink-0 text-bone-600" aria-hidden="true" />
    </button>
  )
}
