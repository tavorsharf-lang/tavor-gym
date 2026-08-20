import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Clock, Flame, SkipForward, TriangleAlert } from 'lucide-react'
import { BottomSheet, Button, toast } from '@/components/ui'
import type { Exercise, QueueItem } from '@/db/types'
import { useWorkout } from '@/state/activeWorkoutStore'

/**
 * סיום אימון.
 *
 * האפליקציה לא נותנת לסגור אימון בשקט כשנשארו תרגילים בלי אף סט. במיוחד לא
 * כשהם נדחו כי המתקן היה תפוס — אלה בדיוק אלה שהתכוונת לחזור אליהם.
 *
 * אימון שאין בו אף סט בכלל מקבל טיפול שלישי: הוא לא מסתיים אלא מתבטל. סגירה
 * שלו כאימון הייתה יוצרת שורה ריקה בהיסטוריה, מקדמת את הרצף השבועי, ומאפסת
 * את שעון ההזנחה — כלומר משנה את ההצעה של מחר על סמך משהו שלא קרה.
 */

interface FinishSheetProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  openItems: QueueItem[]
  /** תרגילים שדולגו במפורש — מוצגים כמידע, לא כאזהרה: ההחלטה כבר התקבלה */
  skippedItems: QueueItem[]
  exercisesById: Record<string, Exercise>
}

/** "3 תרגילים נשארו בלי אף סט" · "תרגיל אחד נשאר בלי אף סט" */
function leftoverLine(count: number): string {
  return count === 1 ? 'תרגיל אחד נשאר בלי אף סט' : `${count} תרגילים נשארו בלי אף סט`
}

function NameRow({ name, deferred }: { name: string; deferred: boolean }): JSX.Element {
  return (
    <li className="flex items-center gap-2 py-1.5">
      {deferred ? (
        <Clock size={14} className="shrink-0 text-flame-300" aria-hidden="true" />
      ) : (
        <span
          className="size-1.5 shrink-0 rounded-full bg-bone-600"
          aria-hidden="true"
        />
      )}
      <span className="min-w-0 truncate text-sm font-semibold text-bone-200">{name}</span>
    </li>
  )
}

export function FinishSheet({
  open,
  onClose,
  onConfirm,
  openItems,
  skippedItems,
  exercisesById,
}: FinishSheetProps): JSX.Element {
  const setNotes = useWorkout((s) => s.setNotes)
  const storedNotes = useWorkout((s) => s.workout?.notes ?? '')
  const [notes, setLocalNotes] = useState(storedNotes)

  // מסתנכרן רק בפתיחה. סנכרון על כל שינוי בחנות היה מוחק תווים שנכתבו
  // בזמן שהכתיבה הקודמת עוד הייתה בהשהיה — ולכן הערך נקרא דרך ref.
  const storedRef = useRef(storedNotes)
  useEffect(() => {
    storedRef.current = storedNotes
  })
  useEffect(() => {
    if (open) setLocalNotes(storedRef.current)
  }, [open])

  // כתיבה מושהית — בלי זה כל תו היה מפעיל שמירה של כל מצב האימון למסד
  useEffect(() => {
    if (!open || notes === storedNotes) return
    const timer = window.setTimeout(() => void setNotes(notes), 400)
    return () => window.clearTimeout(timer)
  }, [open, notes, storedNotes, setNotes])

  /** מוודא שהמילים האחרונות נשמרות גם אם ההשהיה עוד לא הספיקה */
  function flush(): void {
    if (notes !== storedNotes) void setNotes(notes)
  }

  function close(): void {
    flush()
    onClose()
  }

  function confirm(): void {
    flush()
    onConfirm()
  }

  const logged = useWorkout((s) =>
    s.workout ? Object.values(s.workout.setsByKey).reduce((n, list) => n + list.length, 0) : 0
  )
  const discard = useWorkout((s) => s.discard)

  /**
   * הביטול נסגר רק אחרי שהמחיקה הצליחה.
   *
   * קודם הגיליון נסגר מיד, ולכן טרנזקציה שנכשלה הייתה משאירה את האימון במסד
   * בזמן שהמסך כבר הראה שהוא בוטל — והסט הבא היה נרשם לאימון "שלא קיים".
   */
  async function discardAndClose(): Promise<void> {
    try {
      await discard()
      onClose()
    } catch {
      toast('ביטול האימון נכשל — האימון עדיין פתוח')
    }
  }

  const deferred = openItems.filter((q) => q.status === 'deferred')
  const pending = openItems.filter((q) => q.status !== 'deferred')
  const nameOf = (item: QueueItem): string => exercisesById[item.exerciseId]?.name ?? 'תרגיל'

  /** שקט ואינפורמטיבי — דילוג מפורש הוא החלטה שהתקבלה, לא בעיה לתקן */
  const skippedNote = skippedItems.length ? (
    <div className="card mt-3 p-4">
      <h3 className="meta mb-1 flex items-center gap-1.5">
        <SkipForward size={12} aria-hidden="true" />
        דילגת עליהם היום — לא יתועדו
      </h3>
      <ul>
        {skippedItems.map((item) => (
          <li key={item.key} className="py-1 text-sm font-semibold text-bone-400">
            {nameOf(item)}
          </li>
        ))}
      </ul>
    </div>
  ) : null

  const notesField = (
    <div className="mt-6">
      <label htmlFor="finish-notes" className="meta mb-2 block">
        הערות לאימון
      </label>
      <textarea
        id="finish-notes"
        value={notes}
        onChange={(e) => setLocalNotes(e.target.value)}
        rows={3}
        placeholder="משהו שכדאי לזכור מהאימון הזה?"
        className="w-full resize-none rounded-2xl border border-ink-700 bg-ink-850 p-3 leading-relaxed text-bone-50 placeholder:text-bone-500 focus:border-flame-500/50 focus:outline-none"
      />
    </div>
  )

  if (logged === 0) {
    return (
      <BottomSheet open={open} onClose={close} title="לבטל את האימון?">
        <div className="pb-4">
          <div className="card flex items-center gap-3 p-4">
            <TriangleAlert size={22} className="shrink-0 text-hard-400" aria-hidden="true" />
            <div>
              <p className="text-base font-extrabold text-bone-50">לא נרשם אף סט</p>
              <p className="text-sm text-bone-400">
                אין מה לשמור בהיסטוריה. ביטול לא ייספר ברצף ולא ישנה את ההצעה למחר.
              </p>
            </div>
          </div>

          <Button
            variant="danger"
            size="hero"
            fullWidth
            className="mt-6"
            onClick={() => void discardAndClose()}
          >
            בטל את האימון
          </Button>
          <Button variant="ghost" size="lg" fullWidth className="mt-2" onClick={close}>
            חזור לאימון
          </Button>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={open} onClose={close} title="לסיים את האימון?">
      {openItems.length === 0 ? (
        <div className="pb-4">
          <div className="card flex items-center gap-3 p-4">
            <Flame size={22} className="shrink-0 text-flame-400" aria-hidden="true" />
            <div>
              <p className="text-base font-extrabold text-bone-50">עשית הכל</p>
              <p className="text-sm text-bone-400">כל תרגיל בתור קיבל את הסטים שלו.</p>
            </div>
          </div>

          {skippedNote}

          {notesField}

          <Button variant="flame" size="hero" fullWidth className="mt-6" onClick={confirm}>
            סיים אימון
          </Button>
        </div>
      ) : (
        <div className="pb-4">
          <div className="card border-flame-400/30 p-4">
            <p className="flex items-center gap-2 text-base font-extrabold text-flame-400">
              <TriangleAlert size={18} className="shrink-0" aria-hidden="true" />
              {leftoverLine(openItems.length)}
            </p>

            {deferred.length ? (
              <div className="mt-3">
                <h3 className="meta mb-1">המתקן היה תפוס — התכוונת לחזור</h3>
                <ul>
                  {deferred.map((item) => (
                    <NameRow key={item.key} name={nameOf(item)} deferred />
                  ))}
                </ul>
              </div>
            ) : null}

            {pending.length ? (
              <div className="mt-3">
                <h3 className="meta mb-1">עוד לא הגעת אליהם</h3>
                <ul>
                  {pending.map((item) => (
                    <NameRow key={item.key} name={nameOf(item)} deferred={false} />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {skippedNote}

          {notesField}

          <div className="mt-6 flex flex-col gap-3">
            <Button variant="ghost" size="lg" fullWidth onClick={close}>
              חזור אליהם
            </Button>
            <Button variant="danger" size="lg" fullWidth onClick={confirm}>
              סיים בכל זאת
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
