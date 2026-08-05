import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check } from 'lucide-react'
import { getSettings } from '@/db/db'
import { getBlocks, getFinishedSessions, getRoutines } from '@/db/queries'
import type { PlanItem, RoutineId } from '@/db/types'
import { blockStatuses, routineStatuses, suggestBlocks, suggestRoutine } from '@/domain/staleness'
import { formatDuration } from '@/domain/units'
import { formatDayCount } from '@/lib/dates'
import { useAudioCue } from '@/hooks/useAudioCue'
import { useNow } from '@/hooks/useNow'
import { useWorkout } from '@/state/activeWorkoutStore'
import { BottomSheet, Button, toast } from '@/components/ui'

/**
 * גיליון פתיחת האימון — התוכנית והבלוקים הנלווים.
 *
 * ההצעה מחושבת מהזנחה (staleness) ומוצגת כברירת מחדל: בחירה מפורשת של
 * המשתמש דורסת אותה, ולכן היא נשמרת כ"override" ולא כמצב מלא. כך ההצעה
 * ממשיכה להתעדכן כשהנתונים נטענים, בלי לדרוס בחירה שכבר נעשתה.
 */

export interface StartWorkoutSheetProps {
  open: boolean
  onClose: () => void
  initialRoutineId?: RoutineId | null
}

/** אומדן זמן: כל סט הוא מנוחה + כ-40 שניות ביצוע */
const SET_WORK_SECONDS = 40

function estimateSeconds(items: readonly PlanItem[]): number {
  return items.reduce((sum, it) => sum + it.targetSets * (it.restSeconds + SET_WORK_SECONDS), 0)
}

export function StartWorkoutSheet({
  open,
  onClose,
  initialRoutineId = null,
}: StartWorkoutSheetProps): JSX.Element {
  const navigate = useNavigate()
  const now = useNow()

  const routines = useLiveQuery(() => getRoutines(), [])
  const blocks = useLiveQuery(() => getBlocks(), [])
  const sessions = useLiveQuery(() => getFinishedSessions(), [])
  const settings = useLiveQuery(() => getSettings(), [])

  const { unlock } = useAudioCue(settings?.soundEnabled ?? true, settings?.soundVolume ?? 0.8)

  const [routineOverride, setRoutineOverride] = useState<RoutineId | null>(null)
  const [blocksOverride, setBlocksOverride] = useState<string[] | null>(null)
  const [starting, setStarting] = useState(false)

  // סגירה מאפסת את הבחירה — פתיחה הבאה מתחילה שוב מההצעה
  useEffect(() => {
    if (open) return
    setRoutineOverride(null)
    setBlocksOverride(null)
    setStarting(false)
  }, [open])

  const rStatuses = routineStatuses(routines ?? [], sessions ?? [], now)
  const bStatuses = blockStatuses(blocks ?? [], sessions ?? [], now, settings?.blockStaleDays ?? 7)

  const selectedRoutine = routineOverride ?? initialRoutineId ?? suggestRoutine(rStatuses)
  const selectedBlocks = blocksOverride ?? suggestBlocks(bStatuses)

  const routine = (routines ?? []).find((r) => r.id === selectedRoutine) ?? null
  // סדר הבלוקים נקבע מהקטלוג ולא מסדר הלחיצות
  const chosenBlocks = (blocks ?? []).filter((b) => selectedBlocks.includes(b.id))

  const planItems: PlanItem[] = [...(routine?.items ?? []), ...chosenBlocks.flatMap((b) => b.items)]
  const totalSeconds = estimateSeconds(planItems)

  const toggleBlock = (id: string) => {
    setBlocksOverride(
      selectedBlocks.includes(id)
        ? selectedBlocks.filter((b) => b !== id)
        : [...selectedBlocks, id]
    )
  }

  const handleStart = async () => {
    // הלחיצה הזו היא ההזדמנות היחידה לפתוח את האודיו ב-iOS: אחרי await
    // המחווה כבר "נצרכה" וספארי יסרב. חייב להיות ראשון בפונקציה.
    unlock()
    setStarting(true)
    try {
      await useWorkout.getState().start(selectedRoutine, chosenBlocks.map((b) => b.id))
      onClose()
      navigate('/workout')
    } catch {
      setStarting(false)
      toast('לא הצלחתי להתחיל את האימון', { tone: 'warn' })
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="מה מתאמנים היום">
      <div role="radiogroup" aria-label="תוכנית האימון" className="flex flex-col gap-2">
        {rStatuses.map((status) => {
          const item = (routines ?? []).find((r) => r.id === status.routineId)
          const selected = status.routineId === selectedRoutine
          return (
            <button
              key={status.routineId}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setRoutineOverride(status.routineId)}
              className={[
                'card relative flex min-h-18 w-full items-center gap-3 p-4 text-start',
                selected ? 'card-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[
                  'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                  selected ? 'border-flame-400 bg-flame-500 text-ink-950' : 'border-ink-600',
                ].join(' ')}
                aria-hidden="true"
              >
                {selected ? <Check size={15} strokeWidth={3.5} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-extrabold text-bone-50">
                  {item?.name ?? status.name}
                </span>
                <span className="block truncate text-sm text-bone-400">{item?.subtitle}</span>
              </span>
              <span className="meta tnum shrink-0">
                {status.neverDone ? 'עוד לא בוצע' : formatDayCount(status.daysSince ?? 0)}
              </span>
            </button>
          )
        })}
      </div>

      <p className="meta mt-6 mb-2">בלוקים נלווים</p>
      <div className="flex flex-col gap-2">
        {bStatuses.map((status) => {
          const block = (blocks ?? []).find((b) => b.id === status.blockId)
          const checked = selectedBlocks.includes(status.blockId)
          const why = status.neverDone
            ? 'עוד לא עשית את זה'
            : `לא עשית כבר ${formatDayCount(status.daysSince ?? 0)}`
          return (
            <button
              key={status.blockId}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggleBlock(status.blockId)}
              className={[
                'card relative flex min-h-16 w-full items-center gap-3 p-4 text-start',
                checked ? 'card-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[
                  'flex size-6 shrink-0 items-center justify-center rounded-md border-2',
                  checked ? 'border-flame-400 bg-flame-500 text-ink-950' : 'border-ink-600',
                ].join(' ')}
                aria-hidden="true"
              >
                {checked ? <Check size={15} strokeWidth={3.5} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold text-bone-50">
                  {block?.name ?? status.blockId}
                </span>
                <span className="block truncate text-xs text-bone-500">
                  <span className="tnum">{block?.items.length ?? 0}</span> תרגילים ·{' '}
                  {status.neverDone ? 'עוד לא בוצע' : formatDayCount(status.daysSince ?? 0)}
                </span>
              </span>
              {status.stale ? (
                <span className="shrink-0 rounded-pill bg-flame-500/12 px-2.5 py-1 text-[0.6875rem] font-semibold text-flame-300">
                  {why}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-5 border-t border-ink-800 bg-ink-900/95 px-5 pt-3 pb-safe backdrop-blur-xl">
        <p className="mb-2 text-center text-sm text-bone-400">
          <span className="tnum font-bold text-bone-200">{planItems.length}</span> תרגילים · בערך{' '}
          <span className="tnum font-bold text-bone-200">{formatDuration(totalSeconds)}</span>
        </p>
        <Button
          variant="flame"
          size="hero"
          fullWidth
          loading={starting}
          disabled={planItems.length === 0}
          onClick={() => void handleStart()}
          style={{ minHeight: '4.25rem' }}
        >
          התחל
        </Button>
      </div>
    </BottomSheet>
  )
}
