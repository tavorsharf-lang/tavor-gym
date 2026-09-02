import { db } from './db'
import { nextRoutineOrder } from './queries'
import { MUSCLE_GROUPS } from './types'
import type { Exercise, MuscleGroup, PlanItem, Routine, SetLog } from './types'
import { newId } from '@/domain/units'

/**
 * אימון חופשי שהופך לתוכנית.
 *
 * זו התשובה ל"שוכח מה עשיתי פעם קודמת", והיא לא עוד מסך אלא הסרה של מסך: מי
 * שאילתר הרכב שעבד לו לא צריך לבנות אותו שוב בעורך התוכניות — הוא כבר קיים,
 * והוא בדיוק מה שקרה בפועל. `targetSets` הוא מה שבוצע, לא מה שתוכנן.
 *
 * **אין עורך באמצע.** התוכנית נשמרת ומופיעה במסך הראשי; מי שרוצה לשנות אותה
 * מקבל את `PlanEditorScreen` שכבר קיים, ומי שלא — התחיל לתעד ולא נדרש לשום דבר.
 */

/** רק סטי עבודה, מקובצים לפי תרגיל, בסדר הביצוע */
function workByExercise(sets: readonly SetLog[]): Map<string, SetLog[]> {
  const out = new Map<string, SetLog[]>()
  for (const set of sets) {
    if (set.type !== 'work') continue
    const list = out.get(set.exerciseId)
    if (list) list.push(set)
    else out.set(set.exerciseId, [set])
  }
  return out
}

/**
 * השם: שתי הקבוצות עם הכי הרבה סטי עבודה, מחוברות ב-"ו".
 *
 * שתיים ולא כולן — "גב וכתפיים ויד קדמית ובטן" הוא לא שם אלא רשימה, ואת
 * הפירוט המלא ממילא רואים בתוכנית עצמה. קבוצה אחת בלבד מקבלת שם יחיד.
 */
export function routineNameFor(
  sets: readonly SetLog[],
  exercises: readonly Exercise[],
  taken: readonly string[] = []
): string {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const count = new Map<MuscleGroup, number>()
  for (const [exerciseId, list] of workByExercise(sets)) {
    const group = byId.get(exerciseId)?.muscleGroup
    if (!group) continue
    count.set(group, (count.get(group) ?? 0) + list.length)
  }

  const top = [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([group]) => MUSCLE_GROUPS[group].label)

  const base = top.length === 0 ? 'אימון חופשי' : top.join(' ו')
  if (!taken.includes(base)) return base

  // שם תפוס מקבל מספר, ולא נדרס: שתי תוכניות באותו שם הן בדיוק המצב שבו
  // אי אפשר לדעת איזו מהן נבחרה במסך הראשי
  for (let n = 2; ; n++) {
    const candidate = `${base} ${n}`
    if (!taken.includes(candidate)) return candidate
  }
}

/**
 * פריטי התוכנית — מה שבוצע בפועל.
 *
 * טווח החזרות נבנה *סביב* מה שנעשה ולא מועתק ממנו: מי שעשה 8 ו-10 מקבל 8–10,
 * ומי שעשה 10 בדיוק מקבל טווח של אחד למטה ואחד למעלה. טווח שהוא מספר בודד
 * היה הופך כל סט שלא נחת עליו לחריגה.
 */
export function planItemsFromSets(
  sets: readonly SetLog[],
  exercises: readonly Exercise[],
  order: readonly string[],
  defaultReps: number
): PlanItem[] {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const grouped = workByExercise(sets)
  const ids = [...new Set([...order, ...grouped.keys()])].filter((id) => grouped.has(id))

  return ids.map((exerciseId, index) => {
    const own = grouped.get(exerciseId) ?? []
    const exercise = byId.get(exerciseId)
    const reps = own.map((s) => s.reps).filter((n) => n > 0)
    const min = reps.length ? Math.min(...reps) : defaultReps
    const max = reps.length ? Math.max(...reps) : defaultReps
    const heaviest = own.reduce((best, s) => (s.weightKg > best ? s.weightKg : best), 0)

    return {
      exerciseId,
      order: index,
      targetSets: own.length,
      targetReps: min === max ? { min: Math.max(1, min - 1), max: max + 1 } : { min, max },
      restSeconds: exercise?.defaultRestSeconds ?? 120,
      // המשקל שהורם היום הוא נקודת הפתיחה של הפעם הבאה — זו כל ההבטחה
      startWeightKg: heaviest > 0 ? heaviest : null,
    }
  })
}

/** יוצר את התוכנית ושומר אותה. מחזיר אותה כדי שהקורא יוכל להודיע בשמה. */
export async function saveSessionAsRoutine(
  sets: readonly SetLog[],
  exercises: readonly Exercise[],
  actualOrder: readonly string[],
  defaultReps: number
): Promise<Routine> {
  const existing = await db.routines.toArray()
  const items = planItemsFromSets(sets, exercises, actualOrder, defaultReps)
  const name = routineNameFor(
    sets,
    exercises,
    existing.map((r) => r.name)
  )
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const groups = [
    ...new Set(items.map((i) => byId.get(i.exerciseId)?.muscleGroup).filter(Boolean)),
  ] as MuscleGroup[]

  const routine: Routine = {
    id: newId('W-'),
    kind: 'custom',
    name,
    subtitle: groups.map((g) => MUSCLE_GROUPS[g].short).join(' · '),
    // חובה ומספרי: `orderBy('order')` הוא סריקת אינדקס, ושורה בלי הערך הזה
    // פשוט לא תופיע באף מסך
    order: await nextRoutineOrder(),
    isActive: true,
    suggestBlocks: false,
    items,
  }
  await db.routines.put(routine)
  return routine
}

/**
 * "אל תציק": ההרכב שכבר נדחה פעם אחת.
 *
 * ‏localStorage ולא הגדרה במסד, ובכוונה: זו העדפת תצוגה חולפת שאין שום ערך
 * בשחזור שלה מגיבוי, והכנסה שלה לסכמה הייתה מוסיפה שדה שצריך למגרר לנצח.
 * המפתח הוא ההרכב עצמו — אימון אחר עם אותם תרגילים בדיוק הוא אותה הצעה.
 */
const DISMISS_KEY = 'tavor-gym:routine-offer-dismissed'

function compositionKey(exerciseIds: readonly string[]): string {
  return [...exerciseIds].sort().join('|')
}

export function offerDismissed(exerciseIds: readonly string[]): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    return (JSON.parse(raw) as string[]).includes(compositionKey(exerciseIds))
  } catch {
    // אחסון חסום או פגום — עדיף להציע פעם נוספת מאשר להיעלם
    return false
  }
}

export function dismissOffer(exerciseIds: readonly string[]): void {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    const list = raw ? (JSON.parse(raw) as string[]) : []
    const key = compositionKey(exerciseIds)
    if (!list.includes(key)) list.push(key)
    // תקרה: הרשימה הזו לא אמורה לגדול בלי סוף על מכשיר שמתאמן שנים
    localStorage.setItem(DISMISS_KEY, JSON.stringify(list.slice(-40)))
  } catch {
    // אין אחסון — ההצעה תופיע שוב, וזה הכשל הנכון
  }
}
