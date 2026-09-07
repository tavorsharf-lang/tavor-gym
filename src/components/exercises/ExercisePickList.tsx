import type { JSX } from 'react'
import type { CatalogEntry } from '@/db/catalog'
import { EQUIPMENT_LABELS } from '@/db/types'
import type { WeightRecommendation } from '@/domain/recommendation'
import { formatKg, formatSetShort } from '@/domain/units'
import { ExerciseThumb } from '@/components/media/ExerciseThumb'

/**
 * רשימת התרגילים של שריר אחד — הפאזה השנייה של בחירת תרגיל.
 *
 * **לחיצה על שורה מתחילה מיד.** אין מסך אישור, ואין הגדרת סטים או חזרות לפני;
 * שניהם מכווננים על הכרטיס עצמו. כל מה שהשורה צריכה לעשות הוא לתת את המידע
 * שבגללו בוחרים דווקא בה.
 *
 * המידע הזה הוא בדיוק שדה אחד: **מה עשיתי בו פעם קודמת**. ולתרגיל שאין לו
 * היסטוריה — `ראשון · נקבע בסיס היום` ולא "אין נתונים": השורה הראשונה מתארת
 * הזדמנות, השנייה מתארת חוסר.
 *
 * השורה היא `CatalogEntry` ולא `Exercise`, וזה מה שמאפשר לרשימה להציג גם את
 * המאגר הלימודי במצב "הכל": לרשומת מאגר אין כרטיס, אין ציוד ואין היסטוריה —
 * היא מקבלת אותם ברגע הבחירה (`ensureTrainable`), ועד אז היא שורה כמו כולן.
 */

export interface PickRow {
  entry: CatalogEntry
  /** מה שנרשם בפעם האחרונה. null = אין היסטוריה, וזו שורת "ראשון" */
  previous: { weightKg: number; reps: number } | null
  /** ההצעה של המנוע. null כשאין ממה להמליץ */
  recommendation: WeightRecommendation | null
  /**
   * כבר בתור של האימון הפתוח.
   *
   * מושבתת ולא מוסתרת: שורה שנעלמת מהרשימה נקראת כ"התרגיל איננו" ואז מחפשים
   * אותה שוב, בזמן ש"כבר באימון" היא בדיוק התשובה שבאו לחפש. סבב שני על אותו
   * תרגיל הוא עוד סט באותה שורה, ולא שורה שנייה בתור.
   */
  inWorkout: boolean
  /**
   * האחוז על תת-השריר שהרשימה ממוינת לפיו — שלושה מצבים, כמו בשני המסכים
   * האחרים: `undefined` = אין עמודה, `null` = אין נתון על הכרטיס, מספר = האחוז.
   * מוצג במקום שבב ההמלצה: כשהאחוז הוא מה שקובע את הסדר, הוא גם מה שמסבירו.
   */
  pct?: number | null
}

/**
 * השבב בקצה השורה.
 *
 * המקור הוא `recommendWeight` ולא חישוב שני — הוא כבר יודע על הפסקות, על
 * דירוגים ועל חזרות מתחת לרצפת הטווח, וכל ניסיון לשחזר אותו כאן היה נותן
 * מספר אחר מזה שהכרטיס יציע רגע אחר כך.
 */
function chipFor(row: PickRow): { label: string; up: boolean } | null {
  const { previous, recommendation, entry } = row
  const exercise = entry.exercise
  if (!exercise || !previous || !recommendation || recommendation.weightKg === null) return null
  if (exercise.weightMode === 'bodyweight') return null
  const delta = recommendation.weightKg - previous.weightKg
  if (delta <= 0) return { label: 'אותו משקל', up: false }
  return { label: `+${formatKg(delta)} מומלץ`, up: true }
}

export function ExercisePickList({
  rows,
  onPick,
  onGallery,
}: {
  rows: readonly PickRow[]
  onPick: (entry: CatalogEntry) => void
  /** הריבוע פותח את כרטיס השרירים ואת סרטוני ההסבר */
  onGallery?: (entry: CatalogEntry) => void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-[7px]">
      {rows.map((row) => {
        const { entry, previous, inWorkout } = row
        const exercise = entry.exercise
        const chip = chipFor(row)
        /*
          רשומה שאינה בתרגילים שלי — מהמאגר, או כזו שהוצאה. הבחירה בה תחזיר
          אותה פנימה, ולכן היא נראית קצת שקטה יותר אבל לא מושבתת.
        */
        const outside = entry.state !== 'mine'
        return (
          <div
            key={entry.id}
            className={`flex h-[70px] w-full items-stretch rounded-2xl border bg-linear-to-b from-ink-850 to-ink-900 ${
              inWorkout ? 'border-ink-800 opacity-55' : 'border-ink-800'
            }`}
          >
            {/*
              הריבוע הוא כפתור **אח** ולא ילד: כפתור בתוך כפתור אינו HTML חוקי
              ו-iOS מפעיל את שניהם בלחיצה אחת.
              המזהים לפני שאר ה-props — הרגקס של workoutVideos.test נעצר ב-'>'.
            */}
            <span className="flex shrink-0 items-center ps-3">
              <ExerciseThumb
                exerciseId={exercise?.id ?? entry.id}
                libraryId={exercise?.libraryId ?? entry.library?.id}
                size="card"
                onOpen={onGallery ? () => onGallery(entry) : undefined}
              />
            </span>

            <button
              type="button"
              disabled={inWorkout}
              onClick={() => onPick(entry)}
              className="flex min-w-0 flex-1 items-center gap-[11px] rounded-s-2xl px-3 text-start active:border-ink-600 disabled:active:bg-transparent"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.90625rem] leading-tight font-extrabold text-bone-100">
                  {entry.name}
                </span>
                <span className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="shrink-0 text-[0.65625rem] font-medium text-bone-500">
                    {exercise ? EQUIPMENT_LABELS[exercise.equipment] : 'מהמאגר'}
                  </span>
                  <span className="shrink-0 text-ink-600" aria-hidden="true">
                    |
                  </span>
                  {inWorkout ? (
                    <span className="min-w-0 truncate text-[0.6875rem] font-bold text-bone-400">
                      כבר באימון
                    </span>
                  ) : previous && exercise ? (
                    <span
                      dir="ltr"
                      className="tnum min-w-0 truncate text-[0.6875rem] font-bold text-bone-300"
                    >
                      קודם{' '}
                      {formatSetShort(
                        previous.weightKg,
                        previous.reps,
                        exercise.weightMode,
                        exercise.metric
                      )}
                    </span>
                  ) : outside ? (
                    /*
                      שורה שאינה בתרגילים שלי אומרת מה תעשה הלחיצה, ולא "אין
                      נתונים": ההוספה היא התוצאה, וכדאי לדעת עליה מראש.
                    */
                    <span className="min-w-0 truncate text-[0.6875rem] font-bold text-bone-400">
                      נוסף לתרגילים שלי
                    </span>
                  ) : (
                    <span className="min-w-0 truncate text-[0.6875rem] font-bold text-flame-300">
                      ראשון · נקבע בסיס היום
                    </span>
                  )}
                </span>
              </span>

              {row.pct !== undefined ? (
                <span className="shrink-0 text-end">
                  {row.pct === null ? (
                    <span className="text-[0.65625rem] font-semibold text-bone-500">אין נתון</span>
                  ) : (
                    <span className="tnum text-sm font-extrabold text-flame-400">{row.pct}%</span>
                  )}
                </span>
              ) : chip ? (
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
          </div>
        )
      })}
    </div>
  )
}
