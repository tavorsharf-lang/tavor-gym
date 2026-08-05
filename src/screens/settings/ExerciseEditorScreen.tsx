import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react'
import { db } from '@/db/db'
import { getBlocks, getExercise, getRoutines } from '@/db/queries'
import type { Equipment, Exercise, MuscleGroup, WeightMode } from '@/db/types'
import {
  EQUIPMENT_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_ORDER,
  WEIGHT_MODE_LABELS,
} from '@/db/types'
import { formatClock, formatKg } from '@/domain/units'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { BottomSheet, Button, EmptyState, toast } from '@/components/ui'
import { SettingNumber, SettingToggle } from '@/components/settings/SettingRow'

/**
 * עריכת תרגיל.
 *
 * העריכה נעשית על עותק בזיכרון ונשמרת בלחיצה אחת — לא כמו בהגדרות. תרגיל
 * הוא רשומה שההיסטוריה תלויה בה, ושמירה חלקית באמצע הקלדה של שם היא בדיוק
 * מה שלא רוצים.
 */

/** הקפיצות הנפוצות במכונות ובמשקולות */
const INCREMENTS = [0.5, 1, 1.25, 2, 2.5, 5, 10]

const MUSCLE_OPTIONS = MUSCLE_GROUP_ORDER.map((g) => ({ value: g, label: MUSCLE_GROUPS[g].label }))

const EQUIPMENT_OPTIONS = (Object.keys(EQUIPMENT_LABELS) as Equipment[]).map((k) => ({
  value: k,
  label: EQUIPMENT_LABELS[k],
}))

const WEIGHT_MODE_OPTIONS = (Object.keys(WEIGHT_MODE_LABELS) as WeightMode[]).map((k) => ({
  value: k,
  label: WEIGHT_MODE_LABELS[k],
}))

function Card({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="mb-5">
      <h2 className="meta mb-2 px-1">{title}</h2>
      <div className="card divide-y divide-ink-800/70 overflow-hidden">{children}</div>
    </section>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  ltr = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ltr?: boolean
}): JSX.Element {
  const id = useId()
  return (
    <div className="px-4 py-3">
      <label htmlFor={id} className="meta mb-2 block">
        {label}
      </label>
      <input
        id={id}
        type="text"
        dir={ltr ? 'ltr' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-ink-700 bg-ink-850 px-4 text-bone-50 placeholder:text-bone-600 focus:border-flame-500/50 focus:outline-none"
      />
    </div>
  )
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  note,
}: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  note?: string
}): JSX.Element {
  return (
    <div className="px-4 py-3">
      <p className="meta mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={[
              'flex min-h-12 items-center rounded-pill border px-4 text-sm font-bold transition-colors',
              value === o.value
                ? 'border-flame-500/50 bg-flame-500/12 text-flame-300'
                : 'border-ink-700 bg-ink-850 text-bone-400 active:bg-ink-800',
            ].join(' ')}
          >
            {o.label}
          </button>
        ))}
      </div>
      {note ? <p className="mt-2.5 text-xs leading-relaxed text-bone-500">{note}</p> : null}
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled = false,
  danger = false,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-25',
        danger ? 'text-hard-400 active:bg-hard-400/12' : 'text-bone-400 active:bg-ink-800',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function ExerciseEditorScreen(): JSX.Element {
  const navigate = useNavigate()
  const { exerciseId = '' } = useParams<{ exerciseId: string }>()

  const [draft, setDraft] = useState<Exercise | null>(null)
  const [saved, setSaved] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [focusLastCue, setFocusLastCue] = useState(false)
  const cueRefs = useRef<(HTMLInputElement | null)[]>([])

  const routines = useLiveQuery(() => getRoutines(), [], [])
  const blocks = useLiveQuery(() => getBlocks(), [], [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      const [exercise, count] = await Promise.all([
        getExercise(exerciseId),
        db.sessions.where('exerciseIds').equals(exerciseId).count(),
      ])
      if (cancelled) return
      setDraft(exercise ?? null)
      setSaved(exercise ? JSON.stringify(exercise) : '')
      setSessionCount(count)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [exerciseId])

  const cueCount = draft?.cues.length ?? 0
  useEffect(() => {
    if (!focusLastCue) return
    setFocusLastCue(false)
    cueRefs.current[cueCount - 1]?.focus()
  }, [focusLastCue, cueCount])

  const usedIn = useMemo(() => {
    const names: string[] = []
    for (const r of routines) {
      if (r.items.some((i) => i.exerciseId === exerciseId)) names.push(r.name)
    }
    for (const b of blocks) {
      if (b.items.some((i) => i.exerciseId === exerciseId)) names.push(b.name)
    }
    return names
  }, [routines, blocks, exerciseId])

  const dirty = draft !== null && JSON.stringify(draft) !== saved

  const patch = (part: Partial<Exercise>): void => {
    setDraft((current) => (current ? { ...current, ...part } : current))
  }

  const patchCues = (next: string[]): void => patch({ cues: next })

  const moveCue = (index: number, dir: -1 | 1): void => {
    if (!draft) return
    const target = index + dir
    if (target < 0 || target >= draft.cues.length) return
    const next = [...draft.cues]
    ;[next[index], next[target]] = [next[target], next[index]]
    patchCues(next)
  }

  const handleBack = (): void => {
    if (!dirty) {
      navigate(-1)
      return
    }
    toast('יש שינויים שלא נשמרו', {
      tone: 'warn',
      actionLabel: 'צא בלי לשמור',
      onAction: () => navigate(-1),
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!draft) return
    const name = draft.name.trim()
    if (!name) {
      toast('צריך לתת לתרגיל שם', { tone: 'warn' })
      return
    }
    const clean: Exercise = {
      ...draft,
      name,
      nameEn: draft.nameEn?.trim() ?? '',
      subTarget: draft.subTarget.trim(),
      cues: draft.cues.map((c) => c.trim()).filter(Boolean),
      barWeightKg: draft.usesPlates ? (draft.barWeightKg ?? 0) : null,
      updatedAt: Date.now(),
    }
    try {
      await db.exercises.put(clean)
      toast('התרגיל נשמר', { tone: 'success' })
      navigate(-1)
    } catch {
      toast('השמירה נכשלה', { tone: 'warn' })
    }
  }

  const handleDeleteTap = (): void => {
    if (usedIn.length > 0) {
      toast(`התרגיל נמצא בשימוש: ${usedIn.join(' · ')}. אפשר לכבות אותו במקום למחוק`, {
        tone: 'warn',
        actionLabel: 'כבה',
        onAction: () => patch({ isActive: false }),
      })
      return
    }
    setDeleteOpen(true)
  }

  const handleDelete = async (): Promise<void> => {
    try {
      await db.exercises.delete(exerciseId)
      setDeleteOpen(false)
      toast('התרגיל נמחק')
      navigate('/settings/exercises', { replace: true })
    } catch {
      toast('המחיקה נכשלה', { tone: 'warn' })
    }
  }

  if (loading) {
    return (
      <Screen dock={false}>
        <ScreenHeader title="תרגיל" />
        <div className="flex flex-col gap-3" aria-hidden="true">
          <div className="card h-40 animate-pulse opacity-40" />
          <div className="card h-32 animate-pulse opacity-40" />
        </div>
      </Screen>
    )
  }

  if (!draft) {
    return (
      <Screen dock={false}>
        <ScreenHeader title="תרגיל" />
        <EmptyState
          title="התרגיל הזה כבר לא קיים"
          hint="אולי נמחק מהקטלוג. חזור אחורה ובחר תרגיל אחר."
          action={
            <Button variant="ghost" onClick={() => navigate('/settings/exercises', { replace: true })}>
              לקטלוג
            </Button>
          }
        />
      </Screen>
    )
  }

  const bodyweight = draft.weightMode === 'bodyweight'
  const increments = INCREMENTS.includes(draft.weightIncrementKg)
    ? INCREMENTS
    : [...INCREMENTS, draft.weightIncrementKg].sort((a, b) => a - b)

  return (
    <Screen dock={false}>
      <ScreenHeader title={draft.name || 'תרגיל'} subtitle="עריכת תרגיל" onBack={handleBack} />

      <Card title="פרטים">
        <TextField
          label="שם"
          value={draft.name}
          onChange={(v) => patch({ name: v })}
          placeholder="לחיצת חזה חופשי"
        />
        <TextField
          label="שם באנגלית"
          value={draft.nameEn ?? ''}
          onChange={(v) => patch({ nameEn: v })}
          placeholder="Dumbbell Bench Press"
          ltr
        />
        <Segmented<MuscleGroup>
          label="קבוצת שריר"
          value={draft.muscleGroup}
          options={MUSCLE_OPTIONS}
          onChange={(v) => patch({ muscleGroup: v })}
        />
        <TextField
          label="מיקוד"
          value={draft.subTarget}
          onChange={(v) => patch({ subTarget: v })}
          placeholder="חזה עליון"
        />
        <Segmented<Equipment>
          label="ציוד"
          value={draft.equipment}
          options={EQUIPMENT_OPTIONS}
          onChange={(v) => patch({ equipment: v })}
        />
      </Card>

      <Card title="משקל">
        <Segmented<WeightMode>
          label="אופן המשקל"
          value={draft.weightMode}
          options={WEIGHT_MODE_OPTIONS}
          onChange={(v) => patch({ weightMode: v })}
          note="״כל צד״ — המספר שרשום על המכונה או על המשקולת הוא לצד אחד. רושמים אותו בדיוק כך, וההכפלה קורית רק בחישוב הנפח."
        />

        {!bodyweight ? (
          <div className="px-4 py-3">
            <p className="meta mb-2">קפיצת משקל</p>
            <div className="flex flex-wrap gap-2">
              {increments.map((inc) => (
                <button
                  key={inc}
                  type="button"
                  aria-pressed={draft.weightIncrementKg === inc}
                  onClick={() => patch({ weightIncrementKg: inc })}
                  className={[
                    'tnum flex min-h-12 min-w-14 items-center justify-center rounded-pill border px-3 text-sm font-extrabold transition-colors',
                    draft.weightIncrementKg === inc
                      ? 'border-flame-500/50 bg-flame-500/12 text-flame-300'
                      : 'border-ink-700 bg-ink-850 text-bone-400 active:bg-ink-800',
                  ].join(' ')}
                >
                  {formatKg(inc)}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-bone-500">
              הקפיצה הקטנה ביותר שאפשר להוסיף במתקן הזה.
            </p>
          </div>
        ) : null}

        {!bodyweight ? (
          <SettingNumber
            label="משקל התחלתי"
            description="בשימוש רק עד שיש היסטוריה. 0 = בלי הצעה"
            value={draft.seedWeightKg ?? 0}
            onChange={(v) => patch({ seedWeightKg: v > 0 ? v : null })}
            step={draft.weightIncrementKg > 0 ? draft.weightIncrementKg : 2.5}
            min={0}
            max={400}
            format={(v) => (v > 0 ? `${formatKg(v)} ק״ג` : '—')}
          />
        ) : null}

        <SettingToggle
          label="מוט או מכונת פלטות"
          description="מפעיל את מחשבון הפלטות באימון"
          checked={draft.usesPlates}
          onChange={(v) => patch({ usesPlates: v, barWeightKg: v ? (draft.barWeightKg ?? 20) : null })}
        />

        {draft.usesPlates ? (
          <SettingNumber
            label="משקל המוט"
            description="0 מתאים למזחלת של לחיצת רגליים, שאין לה משקל בסיס"
            value={draft.barWeightKg ?? 0}
            onChange={(v) => patch({ barWeightKg: v })}
            step={2.5}
            min={0}
            max={40}
            format={(v) => `${formatKg(v)} ק״ג`}
          />
        ) : null}
      </Card>

      <Card title="ברירות מחדל">
        <SettingNumber
          label="מנוחה"
          value={draft.defaultRestSeconds}
          onChange={(v) => patch({ defaultRestSeconds: v })}
          step={15}
          min={0}
          max={600}
          format={formatClock}
        />
        <SettingNumber
          label="סטים"
          value={draft.targetSets}
          onChange={(v) => patch({ targetSets: v })}
          step={1}
          min={1}
          max={10}
        />
        <div className="grid grid-cols-2 gap-3 px-4 py-3">
          <SettingNumber
            compact
            label="חזרות — מ"
            value={draft.targetReps.min}
            onChange={(v) =>
              patch({ targetReps: { min: v, max: Math.max(v, draft.targetReps.max) } })
            }
            step={1}
            min={1}
            max={50}
          />
          <SettingNumber
            compact
            label="חזרות — עד"
            value={draft.targetReps.max}
            onChange={(v) =>
              patch({ targetReps: { min: Math.min(v, draft.targetReps.min), max: v } })
            }
            step={1}
            min={1}
            max={50}
          />
        </div>
      </Card>

      <section className="mb-5">
        <h2 className="meta mb-2 px-1">דגשי ביצוע</h2>
        <div className="card p-4">
          <p className="mb-3 text-xs leading-relaxed text-bone-500">
            שורה לכל דגש. הם מופיעים בכרטיס התרגיל באמצע האימון, ולכן כדאי שיהיו קצרים.
          </p>

          {draft.cues.length === 0 ? (
            <p className="mb-3 text-sm text-bone-400">עוד אין דגשים לתרגיל הזה.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {draft.cues.map((cue, index) => (
                <li key={index} className="flex items-center gap-1">
                  <input
                    ref={(el) => {
                      cueRefs.current[index] = el
                    }}
                    type="text"
                    value={cue}
                    onChange={(e) =>
                      patchCues(draft.cues.map((c, i) => (i === index ? e.target.value : c)))
                    }
                    placeholder={`דגש ${index + 1}`}
                    aria-label={`דגש ${index + 1}`}
                    enterKeyHint="done"
                    className="h-12 min-w-0 flex-1 rounded-xl border border-ink-700 bg-ink-850 px-3 text-bone-50 placeholder:text-bone-600 focus:border-flame-500/50 focus:outline-none"
                  />
                  <IconButton
                    label={`העלה דגש ${index + 1}`}
                    disabled={index === 0}
                    onClick={() => moveCue(index, -1)}
                  >
                    <ChevronUp size={20} />
                  </IconButton>
                  <IconButton
                    label={`הורד דגש ${index + 1}`}
                    disabled={index === draft.cues.length - 1}
                    onClick={() => moveCue(index, 1)}
                  >
                    <ChevronDown size={20} />
                  </IconButton>
                  <IconButton
                    label={`מחק דגש ${index + 1}`}
                    danger
                    onClick={() => patchCues(draft.cues.filter((_, i) => i !== index))}
                  >
                    <X size={20} />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}

          <Button
            variant="ghost"
            size="sm"
            fullWidth
            icon={<Plus size={16} strokeWidth={3} />}
            onClick={() => {
              patchCues([...draft.cues, ''])
              setFocusLastCue(true)
            }}
          >
            הוסף דגש
          </Button>
        </div>
      </section>

      <section className="mb-5">
        <div className="card divide-y divide-ink-800/70 overflow-hidden">
          <SettingToggle
            label="פעיל"
            description="תרגיל כבוי לא מוצע באימון ולא נכנס לתוכניות, אבל ההיסטוריה שלו נשמרת"
            checked={draft.isActive}
            onChange={(v) => patch({ isActive: v })}
          />
          <div className="p-4">
            <Button
              variant="danger"
              size="md"
              fullWidth
              icon={<Trash2 size={18} />}
              onClick={handleDeleteTap}
            >
              מחק תרגיל
            </Button>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 -mx-4 border-t border-ink-800/70 bg-ink-950/90 px-4 pt-3 pb-safe backdrop-blur-xl">
        <Button
          variant="flame"
          size="lg"
          fullWidth
          disabled={!dirty}
          onClick={() => void handleSave()}
        >
          {dirty ? 'שמור' : 'הכל שמור'}
        </Button>
      </div>

      <BottomSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="למחוק את התרגיל?">
        <p className="text-sm leading-relaxed text-bone-400">
          {sessionCount > 0
            ? `לתרגיל הזה יש היסטוריה של ${sessionCount} אימונים. המחיקה לא תמחק את הסטים, אבל הם יאבדו את השם שלהם.`
            : 'לתרגיל הזה עוד אין היסטוריה, והוא לא מופיע באף תוכנית.'}
        </p>
        <div className="mt-5 mb-2 flex flex-col gap-2">
          <Button variant="danger" size="lg" fullWidth onClick={() => void handleDelete()}>
            כן, מחק
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => setDeleteOpen(false)}>
            השאר
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  )
}
