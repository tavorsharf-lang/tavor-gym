import type { JSX } from 'react'
import { RotateCcw } from 'lucide-react'
import type { Exercise, PlateSettings } from '@/db/types'
import { formatKg, round2 } from '@/domain/units'

/**
 * "מה העמסתי" — שורת פלטות לתרגיל שמעמיסים בו משקל ביד.
 *
 * ההבחנה מול שדה המשקל הרגיל היא הבחנה של החדר, לא של הקוד: במכונת פינים
 * מסתכלים על המדבקה ומקלידים מספר, ובמוט או במזחלת סופרים פלטות בזמן שמעמיסים.
 * ניסיון לתאר את השני בעזרת כפתורי +/- של 2.5 ק״ג הוא בדיוק החיכוך שהשורה
 * הזאת מסלקת: לוחצים על "20" בכל פעם שמניחים פלטה של 20.
 *
 * מה שהכפתור מוסיף למספר תלוי במצב המשקל, וזו הנקודה היחידה בקוד שבה זה
 * קורה: ב-perSide המספר *כבר* לכל צד ולכן פלטה מוסיפה את עצמה, ובמצב total
 * המספר הוא כולל ולכן פלטה אחת בכל צד מוסיפה פעמיים. שני המצבים ממשיכים
 * להציג בדיוק את מה שכתוב על המכונה.
 */
export function PlateChips({
  exercise,
  plates,
  onAdd,
  onReset,
}: {
  exercise: Exercise
  plates: PlateSettings
  onAdd: (deltaKg: number) => void
  onReset: () => void
}): JSX.Element | null {
  if (!exercise.usesPlates || exercise.weightMode === 'bodyweight') return null

  const perSide = exercise.weightMode === 'perSide'
  const sizes = [...new Set(plates.perSideKg.filter((p) => Number.isFinite(p) && p > 0))].sort(
    (a, b) => b - a
  )
  if (sizes.length === 0) return null

  // הנקודה שאליה "אפס" מחזיר: המוט הריק במצב total, ואפס במצב per-side
  const baseKg = perSide ? 0 : (exercise.barWeightKg ?? plates.barWeightKg)

  return (
    <div className="mt-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="meta">הוסף פלטה לכל צד</span>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[0.6875rem] font-bold text-bone-500 active:text-flame-400"
        >
          <RotateCcw size={11} aria-hidden="true" />
          {baseKg > 0 ? 'מוט ריק' : 'אפס'}
        </button>
      </div>
      {/* dir=ltr: הפלטות מסודרות מהכבדה לקלה כמו שמעמיסים אותן על המוט */}
      <div dir="ltr" className="mt-1.5 flex flex-wrap gap-1.5">
        {sizes.map((kg) => (
          <button
            key={kg}
            type="button"
            onClick={() => onAdd(round2(perSide ? kg : kg * 2))}
            aria-label={`הוסף פלטה של ${formatKg(kg)} קילו לכל צד`}
            className="tnum btn-ghost flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-extrabold"
          >
            {formatKg(kg)}
          </button>
        ))}
      </div>
    </div>
  )
}
