import { useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, ChevronUp, ListPlus, Play, Save, Trash2, X } from 'lucide-react'
import { db, getSettings } from '@/db/db'
import { ensureTrainable } from '@/db/catalog'
import { getActiveRoutines, getBlocks, nextRoutineOrder } from '@/db/queries'
import type { Block, PlanItem, Routine } from '@/db/types'
import { MUSCLE_GROUPS } from '@/db/types'
import { newId } from '@/domain/units'
import { countMasculine } from '@/lib/text'
import { useAudioCue } from '@/hooks/useAudioCue'
import { useWorkout } from '@/state/activeWorkoutStore'
import { useBasket } from '@/state/builderBasket'
import type { BasketItem } from '@/state/builderBasket'
import { BottomSheet, Button, IconButton, toast } from '@/components/ui'

/**
 * הסל של בניית האימון — פס צף בתחתית, וגיליון היעדים שנפתח ממנו.
 *
 * ארבעת היעדים הם ארבע כוונות שונות, וההפרדה ביניהן היא כל העניין:
 *   • לאימון שרץ / אימון חדש — "היום". לא נוגע בשום תוכנית שמורה.
 *   • שמירה כאימון — "זה משהו שאחזור אליו".
 *   • הוספה לתוכנית — "זה שייך לתוכנית הקבועה מעכשיו".
 * הקיר בין "להיום" ל"לתוכנית" קיים כבר בכל האפליקציה (שינוי יעד באמצע אימון
 * לא נכתב לתוכנית), והגיליון הזה שומר עליו.
 */

/**
 * ממש את כל מה שבסל לתרגילים אמיתיים, בסדר שנבחר.
 *
 * שתי סיבות שהתוצאה יכולה להיות קצרה מהסל, ושתיהן אמיתיות: תרגיל שנמחק
 * מהקטלוג מאז שנבחר (`ensureTrainable` מחזיר null), ושני מזהים שונים בסל
 * שמתמפים לאותו תרגיל — שורת מאגר שנבחרה, ואחריה אותו תרגיל אחרי שקיבל
 * כרטיס. בלי הדה-דופליקציה כאן, שמירה כאימון הייתה כותבת שני פריטי תוכנית
 * זהים. הקורא בודק את האורך ומחליט מה לומר.
 */
async function materialize(items: readonly BasketItem[]): Promise<string[]> {
  const ids: string[] = []
  const seen = new Set<string>()
  for (const item of items) {
    const exercise = await ensureTrainable(item.id)
    if (!exercise || seen.has(exercise.id)) continue
    seen.add(exercise.id)
    ids.push(exercise.id)
  }
  return ids
}

/** פריט תוכנית מברירות המחדל של התרגיל — אותו חישוב כמו בעורך התוכניות */
async function planItemsFor(exerciseIds: readonly string[], startOrder: number): Promise<PlanItem[]> {
  const rows = await db.exercises.bulkGet([...exerciseIds])
  return rows
    .filter((ex): ex is NonNullable<typeof ex> => ex !== undefined)
    .map((ex, i) => ({
      exerciseId: ex.id,
      order: startOrder + i,
      targetSets: ex.targetSets,
      targetReps: { ...ex.targetReps },
      restSeconds: ex.defaultRestSeconds,
      startWeightKg: null,
    }))
}

export function BasketBar(): JSX.Element | null {
  const navigate = useNavigate()
  const items = useBasket((s) => s.items)
  const remove = useBasket((s) => s.remove)
  const move = useBasket((s) => s.move)
  const clear = useBasket((s) => s.clear)

  const workout = useWorkout((s) => s.workout)
  const settings = useLiveQuery(() => getSettings(), [])
  const { unlock } = useAudioCue(settings?.soundEnabled ?? true, settings?.soundVolume ?? 0.8)

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const [pickingPlan, setPickingPlan] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  if (items.length === 0) return null

  const groups = [...new Set(items.map((i) => i.muscleGroup))]
  const openSetCount = workout
    ? Object.values(workout.setsByKey).reduce((n, sets) => n + sets.length, 0)
    : 0

  const finish = (message: string, goToWorkout: boolean): void => {
    clear()
    setOpen(false)
    setNaming(false)
    setPickingPlan(false)
    setConfirmDiscard(false)
    toast(message, { tone: 'success' })
    if (goToWorkout) navigate('/workout')
  }

  const guard = async (work: () => Promise<void>): Promise<void> => {
    if (busy) return
    setBusy(true)
    try {
      await work()
    } catch {
      toast('משהו השתבש — כלום לא נשמר', { tone: 'warn' })
    } finally {
      setBusy(false)
    }
  }

  /** לאימון שרץ: התרגילים נכנסים לסוף התור ומתועדים כמו כל תרגיל אחר */
  const addToOpen = (): void => {
    void guard(async () => {
      const ids = await materialize(items)
      let added = 0
      for (const id of ids) {
        if (await useWorkout.getState().addExercise(id)) added += 1
      }
      if (added === 0) {
        toast('לא הצלחתי להוסיף את התרגילים', { tone: 'warn' })
        return
      }
      finish(
        added === 1 ? 'התרגיל נוסף לאימון' : `${countMasculine(added)} תרגילים נוספו לאימון`,
        true
      )
    })
  }

  const startNow = (): void => {
    // האימון הפתוח נמחק ב-start, ולכן שואלים לפני — כמו בגיליון פתיחת האימון
    if (workout && !confirmDiscard) {
      setConfirmDiscard(true)
      return
    }
    /*
      שחרור האודיו חייב להיות המשפט הראשון.
      אחרי await המחווה של הלחיצה כבר נצרכה, וספארי מסרב לפתוח קול —
      כלומר טיימר המנוחה היה שותק לאורך כל האימון.
    */
    unlock()
    void guard(async () => {
      const ids = await materialize(items)
      if (!ids.length) {
        toast('לא הצלחתי להתחיל את האימון', { tone: 'warn' })
        return
      }
      await useWorkout.getState().startWithItems(ids)
      finish('האימון התחיל', true)
    })
  }

  const saveAsRoutine = (): void => {
    const trimmed = name.trim()
    if (!trimmed) return
    void guard(async () => {
      const ids = await materialize(items)
      /*
        אותו שער בדיוק כמו בשני היעדים האחרים.
        בלעדיו שמירה של סל שכל תרגיליו נמחקו בינתיים הייתה כותבת תוכנית
        ריקה, מנקה את הסל, ומכריזה "נשמר" — שקר משולש בלחיצה אחת.
      */
      if (!ids.length) {
        toast('התרגילים שבסל כבר לא קיימים — לא נשמר', { tone: 'warn' })
        return
      }
      const routine: Routine = {
        id: newId('W-'),
        kind: 'custom',
        name: trimmed,
        subtitle: groups.map((g) => MUSCLE_GROUPS[g].short).join(' · '),
        // חובה ומספרי: `orderBy('order')` הוא סריקת אינדקס, ושורה בלי הערך
        // הזה פשוט לא תופיע באף מסך
        order: await nextRoutineOrder(),
        isActive: true,
        suggestBlocks: false,
        items: await planItemsFor(ids, 0),
      }
      await db.routines.put(routine)
      setName('')
      finish(`${trimmed} נשמר`, false)
    })
  }

  const addToPlan = (plan: Routine | Block, kind: 'routine' | 'block'): void => {
    void guard(async () => {
      const ids = await materialize(items)
      const already = new Set(plan.items.map((i) => i.exerciseId))
      const fresh = ids.filter((id) => !already.has(id))
      if (!fresh.length) {
        toast('כל התרגילים כבר בתוכנית')
        return
      }
      const items_ = [...plan.items, ...(await planItemsFor(fresh, plan.items.length))]
      if (kind === 'routine') await db.routines.put({ ...(plan as Routine), items: items_ })
      else await db.blocks.put({ ...(plan as Block), items: items_ })
      finish(
        `${
          fresh.length === 1 ? 'תרגיל נוסף' : `${countMasculine(fresh.length)} תרגילים נוספו`
        } ל${plan.name}`,
        false
      )
    })
  }

  return (
    <>
      {/*
        מרווח בזרימת המסמך בגובה הפס הצף.

        הפס הוא fixed ולכן הוא לא תופס מקום, ובלי המרווח הזה הוא יושב על השורה
        האחרונה ברשימה — כלומר התרגיל האחרון בכל קבוצת שריר הוא היחיד שאי אפשר
        לבחור. `Screen dock={false}` מרפד רק את השוליים הבטוחים של המכשיר.
      */}
      <div aria-hidden="true" style={{ height: 'calc(var(--safe-b) + 4.75rem)' }} />

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-950/95 px-4 backdrop-blur-xl"
        style={{ paddingBottom: 'calc(var(--safe-b) + 0.75rem)', paddingTop: '0.75rem' }}
      >
        <div className="mx-auto flex w-full max-w-lg items-center gap-2">
          {/*
            תווית מפורשת ולא צירוף התוכן. קורא מסך היה שומע כאן את המספר, את
            הכותרת ואת רשימת השרירים כמשפט אחד רצוף — ולא את מה שהכפתור עושה.
          */}
          <button
            type="button"
            aria-label={`פתח את האימון שבניתי — ${items.length} תרגילים`}
            onClick={() => setOpen(true)}
            className="flex min-h-13 min-w-0 flex-1 items-center gap-3 rounded-card border border-flame-500/40 bg-flame-500/12 px-4 text-start"
          >
            <span className="numeral-hero shrink-0 text-2xl text-flame-300">{items.length}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-bone-50">
                {items.length === 1 ? 'תרגיל באימון' : 'תרגילים באימון'}
              </span>
              <span className="meta block truncate">
                {groups.map((g) => MUSCLE_GROUPS[g].short).join(' · ')}
              </span>
            </span>
            <ChevronUp size={18} className="shrink-0 text-flame-300" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/*
        סגירה מנטרלת את האישור ההרסני ומחזירה את הגיליון לתפריט הראשי.
        בלי זה "כן — 3 סטים יימחקו" נשאר דרוך אחרי סגירה, והפתיחה הבאה מציגה
        כפתור אדום שלחיצה אחת עליו מוחקת אימון — בלי שנשאלה שאלה.
      */}
      <BottomSheet
        open={open}
        onClose={() => {
          setOpen(false)
          setConfirmDiscard(false)
          setNaming(false)
          setPickingPlan(false)
        }}
        title="האימון שבניתי"
      >
        <ol className="mb-5 flex flex-col gap-1">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-1 rounded-card bg-ink-900 p-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-bone-50">{item.name}</span>
                <span className="meta block">
                  {MUSCLE_GROUPS[item.muscleGroup].label}
                  {item.needsCatalogEntry ? ' · מהמאגר' : ''}
                </span>
              </span>
              <IconButton
                label={`הזז את ${item.name} למעלה`}
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
              >
                <ArrowUp size={16} />
              </IconButton>
              <IconButton
                label={`הזז את ${item.name} למטה`}
                disabled={i === items.length - 1}
                onClick={() => move(i, i + 1)}
              >
                <ArrowDown size={16} />
              </IconButton>
              <IconButton label={`הסר את ${item.name}`} onClick={() => remove(item.id)}>
                <X size={16} />
              </IconButton>
            </li>
          ))}
        </ol>

        {naming ? (
          <div className="mb-2 flex flex-col gap-3">
            <label className="meta" htmlFor="builder-name">
              איך לקרוא לאימון הזה
            </label>
            <input
              id="builder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="אימון השלמות"
              autoFocus
              className="h-13 w-full rounded-card border border-ink-700 bg-ink-900/70 px-4 text-bone-50 outline-none placeholder:text-bone-500 focus:border-flame-500/60"
            />
            <Button
              variant="flame"
              size="lg"
              fullWidth
              disabled={busy || !name.trim()}
              onClick={saveAsRoutine}
            >
              שמור
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={() => setNaming(false)}>
              חזרה
            </Button>
          </div>
        ) : pickingPlan ? (
          <PlanPicker busy={busy} onPick={addToPlan} onCancel={() => setPickingPlan(false)} />
        ) : (
          <div className="mb-2 flex flex-col gap-2">
            {workout ? (
              <>
                <Button
                  variant="flame"
                  size="lg"
                  fullWidth
                  disabled={busy}
                  icon={<ListPlus size={20} />}
                  onClick={addToOpen}
                >
                  הוסף לאימון שרץ
                </Button>
                <Button
                  variant={confirmDiscard ? 'danger' : 'ghost'}
                  size="lg"
                  fullWidth
                  disabled={busy}
                  onClick={startNow}
                >
                  {confirmDiscard
                    ? openSetCount > 0
                      ? `כן — ${countMasculine(openSetCount)} סטים יימחקו`
                      : 'כן, התחל אימון חדש'
                    : 'התחל אימון חדש במקום'}
                </Button>
              </>
            ) : (
              <Button
                variant="flame"
                size="lg"
                fullWidth
                disabled={busy}
                icon={<Play size={20} />}
                onClick={startNow}
              >
                התחל את האימון עכשיו
              </Button>
            )}

            <Button
              variant="quiet"
              size="lg"
              fullWidth
              disabled={busy}
              icon={<Save size={18} />}
              onClick={() => setNaming(true)}
            >
              שמור כאימון לפעם הבאה
            </Button>
            <Button
              variant="quiet"
              size="lg"
              fullWidth
              disabled={busy}
              icon={<ListPlus size={18} />}
              onClick={() => setPickingPlan(true)}
            >
              הוסף לתוכנית קיימת
            </Button>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              disabled={busy}
              icon={<Trash2 size={18} />}
              onClick={() => {
                clear()
                setOpen(false)
              }}
            >
              רוקן את הסל
            </Button>
          </div>
        )}
      </BottomSheet>
    </>
  )
}

/**
 * בחירת התוכנית שאליה מוסיפים.
 *
 * רק התוכניות *הפעילות* ‏— הוספה לתוכנית שכבויה כרגע היא כתיבה למקום שהמשתמש
 * לא יראה, והבלוקים תמיד זמינים כי הם נלווים לכל תוכנית.
 */
function PlanPicker({
  busy,
  onPick,
  onCancel,
}: {
  busy: boolean
  onPick: (plan: Routine | Block, kind: 'routine' | 'block') => void
  onCancel: () => void
}): JSX.Element {
  const routines = useLiveQuery(() => getActiveRoutines(), [])
  const blocks = useLiveQuery(() => getBlocks(), [])

  return (
    <div className="mb-2 flex flex-col gap-2">
      {(routines ?? []).map((routine) => (
        <button
          key={routine.id}
          type="button"
          disabled={busy}
          onClick={() => onPick(routine, 'routine')}
          className="card flex min-h-14 items-center gap-3 p-3 text-start active:bg-ink-800 disabled:opacity-50"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-bone-50">{routine.name}</span>
            <span className="meta block truncate">
              {routine.subtitle} · {routine.items.length} תרגילים
            </span>
          </span>
        </button>
      ))}
      {(blocks ?? []).map((block) => (
        <button
          key={block.id}
          type="button"
          disabled={busy}
          onClick={() => onPick(block, 'block')}
          className="card flex min-h-14 items-center gap-3 p-3 text-start active:bg-ink-800 disabled:opacity-50"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-bone-50">
              בלוק {block.name}
            </span>
            <span className="meta block">{block.items.length} תרגילים</span>
          </span>
        </button>
      ))}
      <Button variant="ghost" size="lg" fullWidth onClick={onCancel}>
        חזרה
      </Button>
    </div>
  )
}
