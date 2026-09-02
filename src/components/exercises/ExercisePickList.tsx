import type { JSX } from 'react'
import type { Exercise } from '@/db/types'
import { EQUIPMENT_LABELS } from '@/db/types'
import type { WeightRecommendation } from '@/domain/recommendation'
import { formatKg, formatSetShort } from '@/domain/units'
import { ExerciseThumb } from '@/components/media/ExerciseThumb'

/**
 * רשימת התרגילים של שריר אחד — הפאזה השנייה של אימון חופשי.
 *
 * **לחיצה על שורה מתחילה מיד.** אין מסך אישור, ואין הגדרת סטים או חזרות לפני;
 * שניהם מכווננים על הכרטיס עצמו, ובאימון חופשי הם ממילא ברירות מחדל. כל מה
 * שהשורה צריכה לעשות הוא לתת את המידע שבגללו בוחרים דווקא בה.
 *
 * המידע הזה הוא בדיוק שדה אחד: **מה עשיתי בו פעם קודמת**. ולתרגיל שאין לו
 * היסטוריה — `ראשון · נקבע בסיס היום` ולא "אין נתונים": השורה הראשונה מתארת
 * הזדמנות, השנייה מתארת חוסר.
 */

export interface PickRow {
  exercise: Exercise
  /** מה שנרשם בפעם האחרונה. null = אין היסטוריה, וזו שורת "ראשון" */
  previous: { weightKg: number; reps: number } | null
  /** ההצעה של המנוע. null כשאין ממה להמליץ */
  recommendation: WeightRecommendation | null
}

/**
 * השבב בקצה השורה.
 *
 * המקור הוא `recommendWeight` ולא חישוב שני — הוא כבר יודע על הפסקות, על
 * דירוגים ועל חזרות מתחת לרצפת הטווח, וכל ניסיון לשחזר אותו כאן היה נותן
 * מספר אחר מזה שהכרטיס יציע רגע אחר כך.
 */
function chipFor(row: PickRow): { label: string; up: boolean } | null {
  const { previous, recommendation, exercise } = row
  if (!previous || !recommendation || recommendation.weightKg === null) return null
  if (exercise.weightMode === 'bodyweight') return null
  const delta = recommendation.weightKg - previous.weightKg
  if (delta <= 0) return { label: 'אותו משקל', up: false }
  return { label: `+${formatKg(delta)} מומלץ`, up: true }
}

export function ExercisePickList({
  rows,
  onPick,
}: {
  rows: readonly PickRow[]
  onPick: (exercise: Exercise) => void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-[7px]">
      {rows.map((row) => {
        const { exercise, previous } = row
        const chip = chipFor(row)
        return (
          <button
            key={exercise.id}
            type="button"
            onClick={() => onPick(exercise)}
            className="flex h-[70px] w-full items-center gap-[11px] rounded-2xl border border-ink-800 bg-linear-to-b from-ink-850 to-ink-900 px-3 text-start active:border-ink-600"
          >
            <ExerciseThumb exerciseId={exercise.id} libraryId={exercise.libraryId} size="card" />

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.90625rem] leading-tight font-extrabold text-bone-100">
                {exercise.name}
              </span>
              <span className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap">
                <span className="shrink-0 text-[0.65625rem] font-medium text-bone-500">
                  {EQUIPMENT_LABELS[exercise.equipment]}
                </span>
                <span className="shrink-0 text-ink-600" aria-hidden="true">
                  |
                </span>
                {previous ? (
                  <span dir="ltr" className="tnum min-w-0 truncate text-[0.6875rem] font-bold text-bone-300">
                    קודם{' '}
                    {formatSetShort(
                      previous.weightKg,
                      previous.reps,
                      exercise.weightMode,
                      exercise.metric
                    )}
                  </span>
                ) : (
                  <span className="min-w-0 truncate text-[0.6875rem] font-bold text-flame-300">
                    ראשון · נקבע בסיס היום
                  </span>
                )}
              </span>
            </span>

            {chip ? (
              <span
                className={`tnum shrink-0 rounded-[9px] px-2.5 py-1.5 text-[0.65625rem] font-extrabold ${
                  chip.up
                    ? 'border border-flame-700 bg-flame-500/12 text-flame-300'
                    : 'border border-ink-700 bg-ink-900 text-bone-400'
                }`}
              >
                {chip.label}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
