import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronUp, ListPlus, Trash2 } from 'lucide-react'
import { db } from '@/db/db'
import { activateRoutines, getAllExercises, getBlocks, getRoutines } from '@/db/queries'
import type { Exercise, MuscleGroup, PlanItem, RoutineId } from '@/db/types'
import { MUSCLE_GROUPS, MUSCLE_GROUP_ORDER } from '@/db/types'
import { countLabel, countMax, countStep, formatClock, formatRepRange } from '@/domain/units'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { BottomSheet, Button, EmptyState, toast } from '@/components/ui'
import { SettingNumber } from '@/components/settings/SettingRow'
import { normalize } from '@/lib/text'

/**
 * עורך התוכניות והבלוקים.
 *
 * כאן אין כפתור שמירה: כל שינוי נכתב מיד. סדר התרגילים הוא הדבר שנוגעים בו
 * הכי הרבה, ולכן החיצים יושבים בשורה עצמה ולא מוסתרים מאחורי פתיחה.
 */

function IconButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-12 shrink-0 items-center justify-center rounded-xl text-bone-400 transition-colors active:bg-ink-800 disabled:opacity-25"
    >
      {children}
    </button>
  )
}

export function PlanEditorScreen(): JSX.Element {
  const routines = useLiveQuery(() => getRoutines(), [])
  const blocks = useLiveQuery(() => getBlocks(), [])
  const exercises = useLiveQuery(() => getAllExercises(true), [], [])

  const [selectedId, setSelectedId] = useState('F1')
  const [openId, setOpenId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [nameDraft, setNameDraft] = useState('')
  const [subtitleDraft, setSubtitleDraft] = useState('')

  const loaded = routines !== undefined && blocks !== undefined
  const routine = (routines ?? []).find((r) => r.id === selectedId) ?? null
  const block = (blocks ?? []).find((b) => b.id === selectedId) ?? null
  const items = routine?.items ?? block?.items ?? []

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  // שדות השם נטענים מהמסד רק בהחלפת לשונית — ולא בכל כתיבה, אחרת הקלדה
  // באמצע שמירה הייתה נדרסת. הרף מחזיק את הערך הטרי בלי להיכנס לתלויות.
  const metaRef = useRef({ name: '', subtitle: '' })
  metaRef.current = {
    name: routine?.name ?? block?.name ?? '',
    subtitle: routine?.subtitle ?? '',
  }
  useEffect(() => {
    setNameDraft(metaRef.current.name)
    setSubtitleDraft(metaRef.current.subtitle)
    setOpenId(null)
  }, [selectedId, loaded])

  const persistItems = async (next: PlanItem[]): Promise<void> => {
    const ordered = next.map((item, index) => ({ ...item, order: index }))
    try {
      if (routine) await db.routines.put({ ...routine, items: ordered })
      else if (block) await db.blocks.put({ ...block, items: ordered })
    } catch {
      toast('השינוי לא נשמר', { tone: 'warn' })
    }
  }

  const persistMeta = async (name: string, subtitle: string): Promise<void> => {
    try {
      if (routine) await db.routines.put({ ...routine, name, subtitle })
      else if (block) await db.blocks.put({ ...block, name })
    } catch {
      toast('השינוי לא נשמר', { tone: 'warn' })
    }
  }

  const moveItem = (index: number, dir: -1 | 1): void => {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    void persistItems(next)
  }

  const updateItem = (index: number, part: Partial<PlanItem>): void => {
    void persistItems(items.map((item, i) => (i === index ? { ...item, ...part } : item)))
  }

  const removeItem = (index: number): void => {
    const removed = items[index]
    const name = exerciseById.get(removed.exerciseId)?.name ?? 'התרגיל'
    void persistItems(items.filter((_, i) => i !== index))
    toast(`${name} הוסר`, {
      actionLabel: 'בטל',
      // פעולה הפוכה ולא שחזור צילום-מצב: הטוסט נשאר על המסך, ובינתיים אפשר
      // לערוך סטים או מנוחה של תרגיל אחר. החזרת רשימה שמורה הייתה מוחקת בשקט
      // בדיוק את העריכות האלה.
      onAction: () => void restoreItem(removed, index),
    })
  }

  /** מכניס פריט שהוסר חזרה למקומו, על גבי המצב העדכני שבמסד */
  const restoreItem = async (item: PlanItem, index: number): Promise<void> => {
    try {
      const current = routine
        ? (await db.routines.get(routine.id))?.items
        : block
          ? (await db.blocks.get(block.id))?.items
          : undefined
      if (!current) return
      // אם התוכנית השתנתה מאז, המיקום המקורי כבר לא בהכרח קיים
      const at = Math.min(Math.max(index, 0), current.length)
      const next = [...current.slice(0, at), item, ...current.slice(at)]
      await persistItems(next)
    } catch {
      toast('לא הצלחתי להחזיר את התרגיל', { tone: 'warn' })
    }
  }

  const addExercise = (exercise: Exercise): void => {
    const item: PlanItem = {
      exerciseId: exercise.id,
      order: items.length,
      targetSets: exercise.targetSets,
      targetReps: { ...exercise.targetReps },
      restSeconds: exercise.defaultRestSeconds,
      startWeightKg: null,
    }
    void persistItems([...items, item])
    setPickerOpen(false)
    setPickerQuery('')
    toast(`${exercise.name} נוסף`)
  }

  const pickerGroups = useMemo(() => {
    const q = normalize(pickerQuery)
    const byGroup = new Map<MuscleGroup, Exercise[]>()
    for (const ex of exercises) {
      if (!ex.isActive) continue
      const hit =
        !q ||
        normalize(ex.name).includes(q) ||
        normalize(ex.nameEn ?? '').includes(q) ||
        normalize(ex.subTarget).includes(q)
      if (!hit) continue
      const list = byGroup.get(ex.muscleGroup)
      if (list) list.push(ex)
      else byGroup.set(ex.muscleGroup, [ex])
    }
    return MUSCLE_GROUP_ORDER.filter((g) => byGroup.has(g)).map((group) => ({
      group,
      list: byGroup.get(group) ?? [],
    }))
  }, [exercises, pickerQuery])

  const tabs = [
    // אות בודדת לפיצול, שם מלא לפול-באדי — "F1" לא אומר כלום בעברית
    ...(routines ?? []).map((r) => ({
      id: r.id as string,
      label: r.id.length === 1 ? r.id : r.name,
      dim: !r.isActive,
    })),
    ...(blocks ?? []).map((b) => ({ id: b.id, label: b.name, dim: false })),
  ]

  const fullBodyActive = (routines ?? []).some((r) => r.id === 'F1' && r.isActive)

  const switchProgram = async (ids: RoutineId[], label: string): Promise<void> => {
    await activateRoutines(ids)
    setSelectedId(ids[0])
    toast(`${label} — זו התוכנית שתוצע במסך הבית`, { tone: 'success' })
  }

  return (
    <Screen dock={false}>
      <ScreenHeader title="תוכניות ובלוקים" subtitle="מה נכנס לכל אימון ובאיזה סדר" />

      {/*
        שתי שיטות אימון שונות לא יכולות להתערבב בהצעה של "מה מתאמנים היום",
        ולכן פעילה תמיד קבוצה אחת. הכבויה נשארת במסד עם כל ההיסטוריה שלה.
      */}
      <section className="card mb-4 p-3">
        <p className="meta mb-2 px-1">התוכנית הפעילה</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={fullBodyActive}
            onClick={() => void switchProgram(['F1', 'F2'], 'פול באדי')}
            className={[
              'flex min-h-16 flex-col items-center justify-center rounded-card border px-3 text-center transition-colors',
              fullBodyActive
                ? 'border-flame-500/50 bg-flame-500/12 text-flame-300'
                : 'border-ink-700 bg-ink-850 text-bone-400 active:bg-ink-800',
            ].join(' ')}
          >
            <span className="text-sm font-extrabold">פול באדי</span>
            <span className="mt-0.5 text-[0.6875rem] font-medium opacity-75">
              חזרה הדרגתית · 2 אימונים
            </span>
          </button>
          <button
            type="button"
            aria-pressed={!fullBodyActive}
            onClick={() => void switchProgram(['A', 'B', 'C'], 'פיצול A/B/C')}
            className={[
              'flex min-h-16 flex-col items-center justify-center rounded-card border px-3 text-center transition-colors',
              !fullBodyActive
                ? 'border-flame-500/50 bg-flame-500/12 text-flame-300'
                : 'border-ink-700 bg-ink-850 text-bone-400 active:bg-ink-800',
            ].join(' ')}
          >
            <span className="text-sm font-extrabold">פיצול A/B/C</span>
            <span className="mt-0.5 text-[0.6875rem] font-medium opacity-75">
              התוכנית המלאה · 3 אימונים
            </span>
          </button>
        </div>
      </section>

      <div className="scroll-touch -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={selectedId === tab.id}
            onClick={() => setSelectedId(tab.id)}
            className={[
              'flex min-h-12 shrink-0 items-center rounded-pill border px-5 text-sm font-extrabold transition-colors',
              selectedId === tab.id
                ? 'border-flame-500/50 bg-flame-500/12 text-flame-300'
                : 'border-ink-700 bg-ink-850 text-bone-400 active:bg-ink-800',
              tab.dim && selectedId !== tab.id ? 'opacity-45' : '',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!loaded ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <div className="card h-24 animate-pulse opacity-40" />
          <div className="card h-64 animate-pulse opacity-40" />
        </div>
      ) : !routine && !block ? (
        <EmptyState title="לא מצאתי את התוכנית הזו" hint="בחר לשונית אחרת מלמעלה." />
      ) : (
        <>
          <div className="card mb-4 divide-y divide-ink-800/70 overflow-hidden">
            <div className="px-4 py-3">
              <label htmlFor="plan-name" className="meta mb-2 block">
                שם
              </label>
              <input
                id="plan-name"
                type="text"
                value={nameDraft}
                onChange={(e) => {
                  setNameDraft(e.target.value)
                  void persistMeta(e.target.value, subtitleDraft)
                }}
                className="h-12 w-full rounded-xl border border-ink-700 bg-ink-850 px-4 text-bone-50 focus:border-flame-500/50 focus:outline-none"
              />
            </div>
            {routine ? (
              <div className="px-4 py-3">
                <label htmlFor="plan-subtitle" className="meta mb-2 block">
                  כותרת משנה
                </label>
                <input
                  id="plan-subtitle"
                  type="text"
                  value={subtitleDraft}
                  onChange={(e) => {
                    setSubtitleDraft(e.target.value)
                    void persistMeta(nameDraft, e.target.value)
                  }}
                  placeholder="חזה ויד אחורית"
                  className="h-12 w-full rounded-xl border border-ink-700 bg-ink-850 px-4 text-bone-50 placeholder:text-bone-600 focus:border-flame-500/50 focus:outline-none"
                />
              </div>
            ) : null}
          </div>

          <div className="card mb-4 overflow-hidden">
            {items.length === 0 ? (
              <EmptyState
                title="אין כאן עדיין תרגילים"
                hint="הוסף תרגיל אחד, והאימון הזה כבר יידע להתחיל."
              />
            ) : (
              <ul className="divide-y divide-ink-800/70">
                {items.map((item, index) => {
                  const exercise = exerciseById.get(item.exerciseId)
                  const open = openId === item.exerciseId
                  return (
                    <li key={`${item.exerciseId}-${index}`}>
                      <div className="flex items-center gap-0.5 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => setOpenId(open ? null : item.exerciseId)}
                          aria-expanded={open}
                          className="flex min-h-14 min-w-0 flex-1 flex-col justify-center rounded-xl px-2 text-start active:bg-ink-800/60"
                        >
                          <span className="truncate text-sm font-bold text-bone-50">
                            {exercise?.name ?? 'תרגיל שנמחק'}
                          </span>
                          <span className="meta tnum mt-1">
                            {item.targetSets} × {formatRepRange(item.targetReps, exercise?.metric)} ·{' '}
                            {formatClock(item.restSeconds)}
                          </span>
                        </button>
                        <IconButton
                          label={`העלה את ${exercise?.name ?? 'התרגיל'}`}
                          disabled={index === 0}
                          onClick={() => moveItem(index, -1)}
                        >
                          <ChevronUp size={20} />
                        </IconButton>
                        <IconButton
                          label={`הורד את ${exercise?.name ?? 'התרגיל'}`}
                          disabled={index === items.length - 1}
                          onClick={() => moveItem(index, 1)}
                        >
                          <ChevronDown size={20} />
                        </IconButton>
                        {/* בלי שאלת אישור — הטוסט עם "בטל" הוא הרשת, והוא נשאר עד שנוגעים בו */}
                        <IconButton
                          label={`הסר את ${exercise?.name ?? 'התרגיל'} מהתוכנית`}
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 size={18} className="text-hard-400" />
                        </IconButton>
                      </div>

                      {open ? (
                        <div className="animate-rise px-4 pt-1 pb-4">
                          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                            <SettingNumber
                              compact
                              label="סטים"
                              value={item.targetSets}
                              onChange={(v) => updateItem(index, { targetSets: v })}
                              step={1}
                              min={1}
                              max={10}
                            />
                            <SettingNumber
                              compact
                              label="מנוחה"
                              value={item.restSeconds}
                              onChange={(v) => updateItem(index, { restSeconds: v })}
                              step={15}
                              min={0}
                              max={600}
                              format={formatClock}
                            />
<SettingNumber
                              compact
                              label={`${countLabel(exercise?.metric)} — מ`}
                              value={item.targetReps.min}
                              onChange={(v) =>
                                updateItem(index, {
                                  targetReps: { min: v, max: Math.max(v, item.targetReps.max) },
                                })
                              }
                              step={countStep(exercise?.metric)}
                              min={1}
                              max={countMax(exercise?.metric)}
                              format={exercise?.metric === 'seconds' ? formatClock : undefined}
                            />
                            <SettingNumber
                              compact
                              label={`${countLabel(exercise?.metric)} — עד`}
                              value={item.targetReps.max}
                              onChange={(v) =>
                                updateItem(index, {
                                  targetReps: { min: Math.min(v, item.targetReps.min), max: v },
                                })
                              }
                              step={countStep(exercise?.metric)}
                              min={1}
                              max={countMax(exercise?.metric)}
                              format={exercise?.metric === 'seconds' ? formatClock : undefined}
                            />
                          </div>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <Button
            variant="ghost"
            size="md"
            fullWidth
            icon={<ListPlus size={18} />}
            onClick={() => {
              setPickerQuery('')
              setPickerOpen(true)
            }}
          >
            הוסף תרגיל
          </Button>
        </>
      )}

      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="הוסף תרגיל">
        <div className="sticky top-0 z-10 -mx-5 bg-ink-900 px-5 pb-3">
          <input
            type="text"
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
            placeholder="חפש תרגיל"
            aria-label="חיפוש תרגיל"
            className="h-12 w-full rounded-2xl border border-ink-700 bg-ink-850 px-4 text-bone-50 placeholder:text-bone-600 focus:border-flame-500/50 focus:outline-none"
          />
        </div>

        {pickerGroups.length === 0 ? (
          <EmptyState title="אין תרגיל פעיל בשם הזה" hint="אפשר להוסיף אותו בקטלוג התרגילים." />
        ) : (
          pickerGroups.map(({ group, list }) => (
            <div key={group} className="mt-3">
              <p className="meta mb-1 px-2">{MUSCLE_GROUPS[group].label}</p>
              <div className="flex flex-col">
                {list.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => addExercise(ex)}
                    className="flex min-h-14 items-center gap-2 rounded-xl px-2 py-1 text-start active:bg-ink-800"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-bone-50">
                        {ex.name}
                      </span>
                      <span className="block truncate text-xs text-bone-500">{ex.subTarget}</span>
                    </span>
                    {items.some((i) => i.exerciseId === ex.id) ? (
                      <span className="meta shrink-0">כבר בתוכנית</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </BottomSheet>
    </Screen>
  )
}
