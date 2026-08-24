import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, EyeOff, Pencil } from 'lucide-react'
import { db } from '@/db/db'
import { addFromLibrary } from '@/db/catalog'
import type { CatalogEntry } from '@/db/catalog'
import { entryHiddenIds, hideExercise, unhideExercises } from '@/db/hiddenExercises'
import { countLabel, countMax, countStep, formatClock } from '@/domain/units'
import { useBasket } from '@/state/builderBasket'
import { BottomSheet, Button, toast } from '@/components/ui'
import { SettingNumber } from '@/components/settings/SettingRow'

/**
 * עריכה מהירה של תרגיל, בלי לעזוב את המסך שממנו באו.
 *
 * נולד בבונה — מי שמתאמן דרכו צריך לשנות שם, סטים או מנוחה בין בחירה לבחירה,
 * והעורך המלא הוא ארבעה מסכים משם. הרכיב כתוב מול CatalogEntry ולא מול מסך
 * מסוים, כדי שמסך התרגילים יוכל לאמץ אותו אחר-כך בלי שינוי.
 *
 * מה שבכוונה לא כאן, וחי רק בעורך המלא:
 *   • אופן משקל — השדה היחיד שמשנה למפרע את חשבון הנפח, וחייב לעבור דרך
 *     saveAndRepairHistory. גיליון שהיה חושף אותו בלי המסלול הזה היה משאיר
 *     סיכומי אימונים ושיאים לא נכונים.
 *   • קבוצת שריר — מצמידה ניקוי של השרירים המשניים.
 *   • פלטות ומדרגת משקל — ולידציה צמודה (מדרגה 0 מחלקת ב-0 בהמלצות).
 *
 * שינוי שם לעומת זאת בטוח לגמרי: שום טבלה לא משכפלת את השם, וההיסטוריה
 * והשיאים ממופתחים ב-id. הכתיבה — update חלקי על שמירה מפורשת, לעולם לא
 * put של אובייקט שנקרא קודם ולעולם לא תוך הקלדה.
 */

export interface QuickEditSheetProps {
  entry: CatalogEntry | null
  onClose: () => void
  /** אחרי הסתרה מוצלחת — המסך מרענן את הרשימה שלו */
  onHidden?: () => void
}

export function QuickEditSheet({ entry, onClose, onHidden }: QuickEditSheetProps): JSX.Element {
  const navigate = useNavigate()
  const renameInBasket = useBasket((s) => s.renameItem)

  const ex = entry?.exercise ?? null

  // טיוטה מקומית שמאופסת בכל פתיחה — שמירה חלקית באמצע הקלדה היא בדיוק מה שלא רוצים
  const [name, setName] = useState('')
  const [targetSets, setTargetSets] = useState(2)
  const [reps, setReps] = useState({ min: 8, max: 12 })
  const [rest, setRest] = useState(120)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!ex) return
    setName(ex.name)
    setTargetSets(ex.targetSets)
    setReps({ ...ex.targetReps })
    setRest(ex.defaultRestSeconds)
  }, [ex])

  const dirty =
    ex !== null &&
    (name !== ex.name ||
      targetSets !== ex.targetSets ||
      reps.min !== ex.targetReps.min ||
      reps.max !== ex.targetReps.max ||
      rest !== ex.defaultRestSeconds)

  const save = async (): Promise<void> => {
    if (!ex) return
    const clean = name.trim()
    if (!clean) {
      toast('צריך לתת לתרגיל שם', { tone: 'warn' })
      return
    }
    try {
      await db.exercises.update(ex.id, {
        name: clean,
        targetSets,
        targetReps: { ...reps },
        defaultRestSeconds: rest,
        updatedAt: Date.now(),
      })
      // הסל שומר תצלום שם — בלי הרענון הגלולה הייתה מציגה את השם הישן
      renameInBasket(ex.id, clean)
      toast('התרגיל נשמר', { tone: 'success' })
      onClose()
    } catch {
      toast('השמירה נכשלה', { tone: 'warn' })
    }
  }

  const hide = async (): Promise<void> => {
    if (!entry) return
    const ids = entryHiddenIds(entry)
    try {
      await hideExercise(ids)
      onClose()
      onHidden?.()
      toast(`${entry.name} הוסתר מבניית האימון`, {
        actionLabel: 'בטל',
        onAction: () => void unhideExercises(ids),
      })
    } catch {
      toast('לא הצלחתי להסתיר', { tone: 'warn' })
    }
  }

  /**
   * "הוסף וערוך" לשורת מאגר: אי אפשר לערוך מניפסט מיוצר, אז קודם נוצר כרטיס
   * (עם שער הכפילות של addFromLibrary) ואז נפתח העורך המלא. שער busy נגד
   * לחיצה כפולה — הבאג שהוליד את linkKnown במסך תרגיל המאגר.
   */
  const addAndEdit = async (): Promise<void> => {
    if (!entry?.library || busy) return
    setBusy(true)
    try {
      const { exercise } = await addFromLibrary(entry.library)
      navigate(`/settings/exercises/${exercise.id}`)
    } catch {
      toast('לא הצלחתי להוסיף את התרגיל', { tone: 'warn' })
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={entry !== null} onClose={onClose} title={entry?.name ?? ''}>
      {ex ? (
        <div key={ex.id} className="flex flex-col gap-1">
          <label className="mb-2 block">
            <span className="meta mb-1.5 block">שם התרגיל</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full rounded-xl border border-ink-700 bg-ink-850 px-4 text-bone-50 placeholder:text-bone-500 focus:border-flame-500/50 focus:outline-none"
            />
          </label>

          <SettingNumber compact label="סטים" value={targetSets} onChange={setTargetSets} step={1} min={1} max={10} />
          <SettingNumber
            compact
            label={`${countLabel(ex.metric)} — מ`}
            value={reps.min}
            onChange={(v) => setReps((r) => ({ min: v, max: Math.max(v, r.max) }))}
            step={countStep(ex.metric)}
            min={1}
            max={countMax(ex.metric)}
            format={ex.metric === 'seconds' ? formatClock : undefined}
          />
          <SettingNumber
            compact
            label={`${countLabel(ex.metric)} — עד`}
            value={reps.max}
            onChange={(v) => setReps((r) => ({ min: Math.min(v, r.min), max: v }))}
            step={countStep(ex.metric)}
            min={1}
            max={countMax(ex.metric)}
            format={ex.metric === 'seconds' ? formatClock : undefined}
          />
          <SettingNumber compact label="מנוחה" value={rest} onChange={setRest} step={15} min={15} max={600} format={formatClock} />

          <Button size="lg" fullWidth className="mt-3" disabled={!dirty} onClick={() => void save()}>
            שמור
          </Button>

          <button
            type="button"
            onClick={() => navigate(`/settings/exercises/${ex.id}`)}
            className="mt-1 flex min-h-12 w-full items-center justify-between rounded-xl px-2 text-sm font-bold text-bone-300 active:bg-ink-800"
          >
            <span className="flex items-center gap-2">
              <Pencil size={16} className="text-bone-500" />
              העורך המלא — ציוד, משקל ודגשים
            </span>
            <ChevronLeft size={16} className="text-bone-600" />
          </button>
        </div>
      ) : entry ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-bone-400">
            תרגיל מהמאגר — עריכה תיצור לו כרטיס בתרגילים שלך, עם המשקלים וההיסטוריה.
          </p>
          <Button size="lg" fullWidth loading={busy} onClick={() => void addAndEdit()}>
            הוסף וערוך
          </Button>
        </div>
      ) : null}

      {entry ? (
        <button
          type="button"
          onClick={() => void hide()}
          className="mt-2 mb-1 flex min-h-12 w-full items-center gap-2 rounded-xl px-2 text-sm font-bold text-hard-400 active:bg-hard-400/12"
        >
          <EyeOff size={16} />
          הסתר מבניית האימון
        </button>
      ) : null}
    </BottomSheet>
  )
}
