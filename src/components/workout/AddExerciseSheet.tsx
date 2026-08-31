import { useMemo } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, LayoutGrid } from 'lucide-react'
import { getSettings } from '@/db/db'
import { ensureTrainable } from '@/db/catalog'
import type { CatalogEntry } from '@/db/catalog'
import { getSessionsSince } from '@/db/queries'
import type { MuscleGroup } from '@/db/types'
import { coverageLookbackFrom, coverageText, liveCoverageInput, muscleCoverage } from '@/domain/coverage'
import { toast } from '@/components/ui'
import { ExercisePickerSheet } from '@/components/exercises/ExercisePickerSheet'
import { useWorkout } from '@/state/activeWorkoutStore'

/**
 * "הוסף תרגיל" מתוך אימון שרץ.
 *
 * זה מה שהופך את מסך האימון למקום שאפשר גם *לבנות* בו ולא רק לתעד: התרגיל
 * שהתפנה במקרה, המכונה שהייתה תפוסה וכעת פנויה, או פשוט "בא לי עוד משהו לגב"
 * — כל אלה קורים באמצע האימון, ועד כאן התשובה היחידה הייתה רשימה שטוחה של
 * התרגילים שכבר בקטלוג, בלי חיפוש ובלי תמונה.
 *
 * הבורר עצמו ניטרלי; מה שמוסיף כאן הוא שלושת הדברים שרק האימון החי יודע:
 *   • כיסוי השרירים כולל הסטים שתועדו בדקות האחרונות (`liveCoverageInput`) —
 *     בלעדיו הכותרת "גב · לא נגעת" הייתה יושבת מעל חתירה שנעשתה לפני רגע.
 *   • המימוש: שורת מאגר הופכת לתרגיל אמיתי לפני שהיא נכנסת לתור.
 *   • "התחל עכשיו" — התרגיל נכנס לסוף התור, וזו הדרך לקפוץ אליו מיד.
 */
export function AddExerciseSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}): JSX.Element {
  const navigate = useNavigate()
  const workout = useWorkout((s) => s.workout)
  const exercisesById = useWorkout((s) => s.exercisesById)

  const settings = useLiveQuery(() => getSettings(), [])
  /*
    שאילתת ההיסטוריה נפתחת רק עם הגיליון — היא סורקת חלון של שבועות, ואין לה
    מה לרוץ ברקע של מסך שכל תפקידו הוא הסט הבא.
  */
  const history = useLiveQuery(
    () =>
      open
        ? getSessionsSince(coverageLookbackFrom(Date.now()))
        : Promise.resolve({ sessions: [], sets: [] }),
    [open]
  )

  const coverageByGroup = useMemo(() => {
    const now = Date.now()
    const live = liveCoverageInput(workout, now)
    const rows = muscleCoverage(
      Object.values(exercisesById),
      [...(history?.sessions ?? []), ...live.sessions],
      [...(history?.sets ?? []), ...live.sets],
      now,
      settings?.coverageWindowDays ?? 4
    )
    return new Map(rows.map((r) => [r.group, r]))
  }, [exercisesById, history, settings, workout])

  const inTarget = useMemo(
    () => new Set((workout?.queue ?? []).map((q) => q.exerciseId)),
    [workout]
  )

  const handlePick = async (entry: CatalogEntry): Promise<void> => {
    /*
      המימוש קורה כאן ולא בבורר. `ensureTrainable` הוא הנקודה שבה שורה
      ברשימה המאוחדת הופכת למשהו שאפשר לתעד בו סטים: תרגיל פעיל חוזר כמו
      שהוא, תרגיל שהוצא מ"שלי" חוזר פנימה, ומזהה מאגר מקבל כרטיס. הוספה
      מפורשת באמצע אימון היא בדיוק הבקשה לכל שלושת אלה.
    */
    let exercise
    try {
      exercise = await ensureTrainable(entry.id)
    } catch {
      exercise = null
    }
    if (!exercise) {
      toast('לא הצלחתי להוסיף את התרגיל', { tone: 'warn' })
      return
    }

    const outcome = await useWorkout.getState().addExercise(exercise.id)
    /*
      השורה כבר מושבתת בבורר, ולכן זו רשת ולא מסלול: הכפילות יכולה להיכנס
      בחלון שבין הרינדור להוספה — פס הסל שהוסיף את אותו תרגיל, או שורת מאגר
      שקיבלה כרטיס בדיוק עכשיו ולכן טרם סומנה ✓.
    */
    if (outcome === 'duplicate') {
      toast(`${exercise.name} כבר באימון — אפשר להוסיף לו עוד סט`)
      return
    }
    if (outcome === 'failed') {
      toast('לא הצלחתי להוסיף את התרגיל', { tone: 'warn' })
      return
    }

    // התרגיל נדחף לסוף התור, ולכן זה המפתח שלו. נלקח אחרי ההוספה ולא לפניה.
    const key = useWorkout.getState().workout?.queue.at(-1)?.key ?? null
    toast(`${exercise.name} נוסף לאימון`, {
      tone: 'success',
      actionLabel: 'התחל עכשיו',
      onAction: () => {
        if (key) void useWorkout.getState().setCurrent(key)
        onClose()
      },
    })
  }

  return (
    <ExercisePickerSheet
      open={open}
      onClose={onClose}
      title="הוסף תרגיל לאימון"
      inTarget={inTarget}
      onPick={handlePick}
      groupNote={(group: MuscleGroup) => {
        const cover = coverageByGroup.get(group)
        if (!cover) return null
        return (
          <span className={cover.uncovered ? 'text-flame-300' : ''}>{coverageText(cover)}</span>
        )
      }}
      footer={
        /*
          הדלת לבונה המלא. הוא נותן את מה שגיליון לא יכול — מפת הגוף, הסל,
          וההצעה האוטומטית — והאימון ממשיך לרוץ מתחתיו: "הוסף לאימון שרץ"
          בפס הסל מחזיר לכאן עם התרגילים שנבחרו.
        */
        <button
          type="button"
          onClick={() => {
            onClose()
            navigate('/builder')
          }}
          className="flex min-h-14 w-full items-center gap-3 rounded-card border border-ink-700 bg-ink-950/60 px-4 text-start active:bg-ink-800"
        >
          <LayoutGrid size={18} className="shrink-0 text-bone-400" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-bone-100">בניית אימון מלאה</span>
            <span className="meta block">מפת גוף, כיסוי שרירים וסל — האימון ממשיך לרוץ</span>
          </span>
          <ChevronLeft size={16} className="shrink-0 text-bone-600" aria-hidden="true" />
        </button>
      }
    />
  )
}
