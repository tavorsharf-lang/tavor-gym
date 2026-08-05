import { RefreshCw } from 'lucide-react'
import { useSWUpdate } from '@/hooks/useSWUpdate'
import { useWorkout } from '@/state/activeWorkoutStore'

/**
 * הודעת "יש גרסה חדשה".
 *
 * מושתקת לחלוטין כל עוד יש אימון פעיל — טעינה מחדש של הדף באמצע סט היא
 * בדיוק סוג התקלה שהורסת אימון. ברגע שהאימון נסגר ההודעה מופיעה.
 */
export function UpdateBanner() {
  const hasActiveWorkout = useWorkout((s) => s.workout !== null)
  const { updateAvailable, applyUpdate } = useSWUpdate(hasActiveWorkout)

  if (!updateAvailable) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 animate-fade px-3"
      style={{ paddingTop: 'calc(var(--safe-t) + 0.5rem)' }}
    >
      <button
        onClick={applyUpdate}
        className="card mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3 text-start"
      >
        <span className="text-sm font-semibold text-bone-50">
          יש גרסה חדשה של האפליקציה
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-pill bg-flame-500/15 px-3 py-1.5 text-xs font-bold text-flame-400">
          <RefreshCw size={14} />
          עדכן
        </span>
      </button>
    </div>
  )
}
