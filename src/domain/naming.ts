import type { Exercise } from '@/db/types'
import { formatWeight } from './units'

/**
 * מה מבדיל בין שני תרגילים שנקראים אותו דבר.
 *
 * בקטלוג יש זוגות שנושאים בכוונה שם זהה: שתי חתירות במכונה שנבדלות רק במשקל,
 * ושתי לחיצות חזה במכונה על מכונות שונות. הם לא מאוחדים — הם באמת שני
 * תרגילים, עם היסטוריה נפרדת וסרטון נפרד — ולכן הרשימות צריכות דרך להראות
 * מי מי בלי להמציא להם שמות מלאכותיים.
 *
 * המבדיל הוא המשקל, והוא מופיע רק כשיש התנגשות. תרגיל עם שם ייחודי לא מקבל
 * תגית מיותרת, ושינוי שם בעריכה מכבה את התגית מעצמו.
 */

/** השמות שיותר מתרגיל אחד נושא. השוואה על השם כפי שהוא, כולל רווחים. */
export function duplicateNames(exercises: readonly Exercise[]): Set<string> {
  const seen = new Set<string>()
  const twice = new Set<string>()
  for (const ex of exercises) {
    if (seen.has(ex.name)) twice.add(ex.name)
    else seen.add(ex.name)
  }
  return twice
}

/**
 * התוספת שמבדילה את התרגיל מהתרגיל השני שנקרא כמוהו — או null כשאין צורך
 * בה, ובמצב הנדיר שגם המשקל זהה ואין מה להוסיף.
 */
export function distinguisher(exercise: Exercise, duplicates: ReadonlySet<string>): string | null {
  if (!duplicates.has(exercise.name)) return null
  if (exercise.seedWeightKg === null || exercise.weightMode === 'bodyweight') return null
  return formatWeight(exercise.seedWeightKg, exercise.weightMode)
}

/** שורת המשנה של תרגיל ברשימה: מיקוד, ציוד, ומבדיל כשצריך */
export function metaLine(
  exercise: Exercise,
  equipmentLabel: string,
  duplicates: ReadonlySet<string>
): string {
  const extra = distinguisher(exercise, duplicates)
  return [exercise.subTarget, equipmentLabel, extra].filter(Boolean).join(' · ')
}
