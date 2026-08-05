import { Flame } from 'lucide-react'
import type { JSX } from 'react'
import type { Session } from '@/db/types'
import { computeStreak } from '@/domain/streak'
import { useNow } from '@/hooks/useNow'
import { formatDateShort } from '@/lib/dates'

/**
 * שורת הרצף במסך הבית — כמה שבועות ברציפות עמדתי ביעד, איפה אני השבוע,
 * ושמונה השבועות האחרונים כעמודות. הכל בכרטיס אחד, בגובה שורה.
 */

export interface StreakRowProps {
  sessions: Session[]
  goal: number
}

function streakText(weeks: number): string {
  if (weeks <= 0) return 'אין רצף עדיין'
  if (weeks === 1) return 'רצף: שבוע'
  if (weeks === 2) return 'רצף: שבועיים'
  return `רצף: ${weeks} שבועות`
}

export function StreakRow({ sessions, goal }: StreakRowProps): JSX.Element {
  // דקה מספיקה — הרצף משתנה בגבול שבוע, לא בגבול שנייה
  const now = useNow(60_000)
  const streak = computeStreak(sessions, goal, now)
  const alive = streak.streakWeeks > 0
  const lastIndex = streak.recentWeeks.length - 1

  return (
    <div className="card flex items-center gap-3 p-3">
      <div
        className={[
          'flex size-11 shrink-0 items-center justify-center rounded-full',
          alive ? 'bg-flame-500/12' : 'bg-ink-800',
        ].join(' ')}
      >
        <Flame size={22} className={alive ? 'text-flame-400' : 'text-bone-600'} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-bone-50">{streakText(streak.streakWeeks)}</p>
        <p className="meta mt-0.5">
          השבוע:{' '}
          <span dir="ltr" className="tnum">
            {streak.thisWeekCount}/{streak.goal}
          </span>
          {streak.remainingThisWeek > 0 ? ` · עוד ${streak.remainingThisWeek} לסגירת השבוע` : ' · השבוע נסגר'}
        </p>
      </div>

      {/* מהישן לחדש: ב-RTL הזמן זורם שמאלה, ולכן השבוע הנוכחי הוא העמודה השמאלית */}
      <div className="flex shrink-0 items-center gap-1.5">
        {streak.recentWeeks.map((week, i) => (
          <span
            key={week.weekStart}
            title={`השבוע של ${formatDateShort(week.weekStart)} — ${week.count} אימונים`}
            className={[
              'h-6 w-1.5 rounded-pill',
              week.met ? 'bg-flame-500' : 'bg-ink-700',
              i === lastIndex ? 'ring-1 ring-flame-400/70' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </div>
    </div>
  )
}
