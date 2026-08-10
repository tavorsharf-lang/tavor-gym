import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, JSX } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, ChevronDown, ChevronUp, Circle, Clock, Flame, Plus, X } from 'lucide-react'
import { BottomSheet, EmptyState, toast } from '@/components/ui'
import { MUSCLE_GROUPS, MUSCLE_GROUP_ORDER } from '@/db/types'
import type { Exercise, ExerciseMetric, MuscleGroup, QueueItem } from '@/db/types'
import { formatRepRange } from '@/domain/units'
import { distinguisher, duplicateNames } from '@/domain/naming'
import { useWorkout } from '@/state/activeWorkoutStore'

/**
 * סדר האימון.
 *
 * גרירה במגע היא לא אמינה בחדר כושר — יד מיוזעת, טלפון על ספסל, גלילה
 * שנלחמת בגרירה. לכן לכל שורה יש גם חיצים למעלה/למטה: הגרירה היא הדרך
 * המהירה, החיצים הם הדרך שתמיד עובדת.
 */

interface QueueSheetProps {
  open: boolean
  onClose: () => void
}

const STATUS_GLYPH: Record<QueueItem['status'], JSX.Element> = {
  active: <Flame size={14} className="text-flame-400" aria-label="התרגיל הנוכחי" />,
  done: <Check size={14} className="text-bone-400" aria-label="הושלם" />,
  deferred: <Clock size={14} className="text-flame-300" aria-label="ממתין — המתקן היה תפוס" />,
  pending: <Circle size={12} className="text-bone-600" aria-label="ממתין" />,
}

function QueueRow({
  item,
  index,
  total,
  name,
  metric,
  apart,
  setCount,
  onMove,
}: {
  item: QueueItem
  index: number
  total: number
  name: string
  /** במה נמדד התרגיל — כדי שפלאנק יוצג כשעון ולא כטווח חזרות */
  metric?: ExerciseMetric
  /** המשקל שמבדיל בין שני תרגילים בעלי אותו שם — null כשהשם ייחודי */
  apart: string | null
  setCount: number
  onMove: (to: number) => void
}): JSX.Element {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        'card flex items-center gap-2 p-2',
        isDragging ? 'z-10 opacity-90 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.9)]' : '',
        item.status === 'done' ? 'opacity-55' : '',
      ].join(' ')}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`גרור לשינוי מקום: ${name}`}
        className="knurl no-touch-scroll h-12 w-7 shrink-0 rounded-lg border border-ink-700 bg-ink-850"
        {...attributes}
        {...listeners}
      />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm leading-tight font-bold text-bone-50">
          <span className="shrink-0">{STATUS_GLYPH[item.status]}</span>
          <span className="min-w-0 truncate">{name}</span>
        </p>
        <p className="meta mt-1">
          <span dir="ltr" className="tnum">
            {item.targetSets}×{formatRepRange(item.targetReps, metric)}
          </span>
          {' · '}
          {setCount > 0 ? `${setCount} סטים בוצעו` : 'עוד לא התחיל'}
          {apart ? ` · ${apart}` : ''}
        </p>
      </div>

      <div className="flex shrink-0">
        <button
          type="button"
          onClick={() => onMove(index - 1)}
          disabled={index === 0}
          aria-label={`הזז למעלה: ${name}`}
          className="flex size-12 items-center justify-center rounded-xl text-bone-400 active:bg-ink-800 disabled:opacity-25"
        >
          <ChevronUp size={20} />
        </button>
        <button
          type="button"
          onClick={() => onMove(index + 1)}
          disabled={index === total - 1}
          aria-label={`הזז למטה: ${name}`}
          className="flex size-12 items-center justify-center rounded-xl text-bone-400 active:bg-ink-800 disabled:opacity-25"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </li>
  )
}

export function QueueSheet({ open, onClose }: QueueSheetProps): JSX.Element {
  const workout = useWorkout((s) => s.workout)
  const exercisesById = useWorkout((s) => s.exercisesById)
  const reorder = useWorkout((s) => s.reorder)
  const addExercise = useWorkout((s) => s.addExercise)

  const [picking, setPicking] = useState(false)

  useEffect(() => {
    if (open) setPicking(false)
  }, [open])

  // מרחק/השהיה לפני שהגרירה נתפסת — בלי זה כל ניסיון גלילה היה מזיז תרגיל
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const queue = useMemo(() => workout?.queue ?? [], [workout])

  // שני תרגילים בקטלוג נושאים בכוונה אותו שם — בתור הם חייבים להיראות שונים
  const duplicates = useMemo(() => duplicateNames(Object.values(exercisesById)), [exercisesById])

  const catalog = useMemo(() => {
    const active = Object.values(exercisesById).filter((e) => e.isActive)
    const groups: { group: MuscleGroup; items: Exercise[] }[] = []
    for (const group of MUSCLE_GROUP_ORDER) {
      const items = active.filter((e) => e.muscleGroup === group).sort((a, b) => a.order - b.order)
      if (items.length) groups.push({ group, items })
    }
    return groups
  }, [exercisesById])

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = queue.findIndex((q) => q.key === active.id)
    const to = queue.findIndex((q) => q.key === over.id)
    if (from < 0 || to < 0) return
    void reorder(from, to)
  }

  function move(from: number, to: number): void {
    if (to < 0 || to >= queue.length) return
    void reorder(from, to)
  }

  function add(ex: Exercise): void {
    void addExercise(ex.id)
    setPicking(false)
    toast(`${ex.name} נוסף לסוף התור`)
  }

  const inQueue = new Set(queue.map((q) => q.exerciseId))

  return (
    <BottomSheet open={open} onClose={onClose} title="סדר האימון">
      {!workout ? (
        <EmptyState title="אין אימון פעיל" hint="התחל אימון ותוכל לסדר כאן את התרגילים." />
      ) : picking ? (
        <div className="animate-rise pb-4">
          <button
            type="button"
            onClick={() => setPicking(false)}
            className="btn-ghost mb-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold"
          >
            <X size={16} />
            חזרה לסדר האימון
          </button>

          <div className="flex flex-col gap-5">
            {catalog.map(({ group, items }) => (
              <section key={group}>
                <h3 className="meta mb-2">{MUSCLE_GROUPS[group].label}</h3>
                <ul className="flex flex-col gap-2">
                  {items.map((ex) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        onClick={() => add(ex)}
                        className="card flex min-h-14 w-full items-center gap-3 px-3 text-start active:bg-ink-800"
                      >
                        <Plus size={16} className="shrink-0 text-flame-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-bone-50">
                            {ex.name}
                          </span>
                          <span className="meta">{ex.subTarget}</span>
                        </span>
                        {inQueue.has(ex.id) ? (
                          <span className="meta shrink-0">כבר בתור</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="pb-4">
          {queue.length === 0 ? (
            <EmptyState
              title="התור ריק"
              hint="הוסף תרגיל ותתחיל מאיפה שבא לך."
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={queue.map((q) => q.key)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-2">
                  {queue.map((item, index) => (
                    <QueueRow
                      key={item.key}
                      item={item}
                      index={index}
                      total={queue.length}
                      name={exercisesById[item.exerciseId]?.name ?? 'תרגיל'}
                      metric={exercisesById[item.exerciseId]?.metric}
                      apart={
                        exercisesById[item.exerciseId]
                          ? distinguisher(exercisesById[item.exerciseId], duplicates)
                          : null
                      }
                      setCount={workout.setsByKey[item.key]?.length ?? 0}
                      onMove={(to) => move(index, to)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          <button
            type="button"
            onClick={() => setPicking(true)}
            className="btn-ghost mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold"
          >
            <Plus size={18} />
            הוסף תרגיל
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
