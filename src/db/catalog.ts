import { db } from './db'
import { LIBRARY_CATALOG } from './libraryManifest'
import type { LibraryExercise } from './libraryManifest'
import { getAllExercises } from './queries'
import type { Exercise, MuscleGroup } from './types'

/**
 * הקטלוג המאוחד — שכבת קריאה אחת מעל שני המקורות.
 *
 * עד כאן היו באפליקציה שני קטלוגים שפוצלו לפי *מקור*: מה שתבור יצר מול מה
 * שיוצר התוכן יצר. זו הבחנה שמעניינת את מי שבנה את האפליקציה ולא את מי
 * שמשתמש בה. הפיצול שכן מעניין הוא לפי *תפקיד* — מה אני מרים מול מה קיים —
 * והשני איננו קטלוג נפרד אלא תכונה של תרגיל.
 *
 * ‏CatalogEntry הוא הביטוי של זה: שני הצדדים יכולים להיות null, ולכן כל קוד
 * שנוגע בנתוני אימון חייב לטפל בהיעדרם. זו בדיוק הסיבה שלא ייבאנו את 62
 * תרגילי המאגר לטבלת exercises — ל-Exercise יש כ-18 שדות חובה (weightMode,
 * weightIncrementKg, usesPlates, barWeightKg) שחסרי משמעות לרשומת לימוד,
 * ולמלא אותם בברירות מחדל היה משתיק את הטיפוסים בדיוק במקום שבו צריך שיצעקו.
 *
 * חשוב לא פחות מה *לא* עובר דרך כאן: getAllExercises, getSubstituteCandidates,
 * הנפח, השיאים וההמלצות ממשיכים לקרוא ישירות מ-Dexie. האיחוד הוא לעיון בלבד,
 * ולכן תרגיל לימוד לא יכול להגיע לבחירת תרגיל באימון או לסטטיסטיקה.
 */

/**
 * תרגיל אחד ברשימה המאוחדת, משני הצדדים שלו.
 *
 * השדות המשותפים למעלה הם רק אלה שקיימים לשני הסוגים — זהות וקבוצת שריר.
 * כל השאר (מיקוד, ציוד, אופן משקל) חי בתוך `exercise`, כי רק שם יש לו משמעות.
 */
export interface CatalogEntry {
  /** מזהה הקטלוג כשיש תרגיל, אחרת מזהה המאגר. זהו המזהה הקנוני לניווט. */
  id: string
  name: string
  nameEn: string | null
  muscleGroup: MuscleGroup
  /** התרגיל בקטלוג — קיים רק אם מתאמנים בו */
  exercise: Exercise | null
  /** חומר הלימוד — קיים רק אם יש עליו סרטוני הסבר */
  library: LibraryExercise | null
}

const BY_LIB_ID = new Map(LIBRARY_CATALOG.map((e) => [e.id, e]))

/** בונה רשומה מאוחדת מתרגיל בקטלוג, עם חומר הלימוד שקשור אליו אם יש */
function fromExercise(exercise: Exercise): CatalogEntry {
  return {
    id: exercise.id,
    name: exercise.name,
    // מחרוזת ריקה היא "אין שם אנגלי" בקטלוג. כאן זה null, כדי שהמסך יבדוק דבר אחד.
    nameEn: exercise.nameEn?.trim() || null,
    muscleGroup: exercise.muscleGroup,
    exercise,
    library: exercise.libraryId ? (BY_LIB_ID.get(exercise.libraryId) ?? null) : null,
  }
}

/** בונה רשומה מאוחדת מתרגיל מאגר שאין לו מקבילה בקטלוג */
function fromLibrary(library: LibraryExercise): CatalogEntry {
  return {
    id: library.id,
    name: library.nameHe,
    nameEn: library.nameEn,
    muscleGroup: library.muscleGroup,
    exercise: null,
    library,
  }
}

/**
 * כל התרגילים, משני המקורות, בלי כפילויות.
 *
 * תרגיל מקושר מופיע פעם אחת בלבד ותחת מזהה הקטלוג שלו — הוא המזהה שההיסטוריה,
 * השיאים והסרטונים תלויים בו, ולכן הוא שמנצח. כרגע: 28 בקטלוג ‎+ 62 במאגר
 * פחות 12 מקושרים = 78 רשומות.
 *
 * כולל גם תרגילים כבויים. הרשימה היא מסך עיון, ותרגיל כבוי הוא עדיין משהו
 * שהמשתמש רוצה למצוא — הוא יורד למטה בסדר ולא נעלם.
 */
export async function getCatalogEntries(): Promise<CatalogEntry[]> {
  const exercises = await getAllExercises(true)

  const linked = new Set<string>()
  for (const ex of exercises) {
    if (ex.libraryId && BY_LIB_ID.has(ex.libraryId)) linked.add(ex.libraryId)
  }

  return [
    ...exercises.map(fromExercise),
    ...LIBRARY_CATALOG.filter((lib) => !linked.has(lib.id)).map(fromLibrary),
  ].sort(compareEntries)
}

/**
 * רשומה אחת לפי מזהה, בין אם הוא של הקטלוג ובין אם הוא של המאגר.
 *
 * מזהה מאגר של תרגיל מקושר מחזיר את הרשומה הקנונית — התרגיל בקטלוג, עם
 * חומר הלימוד בתוכו. זה מה שמאפשר לכתובות הישנות של ‎/library/:id להמשיך
 * לעבוד בלי להוביל לעותק שני של אותו תרגיל.
 */
export async function getCatalogEntry(id: string): Promise<CatalogEntry | null> {
  const own = await db.exercises.get(id)
  if (own) return fromExercise(own)

  const library = BY_LIB_ID.get(id)
  if (!library) return null

  const linkedTo = await db.exercises.where('libraryId').equals(id).first()
  return linkedTo ? fromExercise(linkedTo) : fromLibrary(library)
}

/**
 * הסדר בתוך קבוצת שריר.
 *
 * שלי קודם — "כמה הרמתי" היא השאלה שבשבילה נכנסים לרשימה, וחומר הלימוד הוא
 * מה שמחפשים אחריה. בתוך כל צד נשמר הסדר שהיה נכון במסך שממנו הוא הגיע.
 */
export function compareEntries(a: CatalogEntry, b: CatalogEntry): number {
  if (!a.exercise !== !b.exercise) return a.exercise ? -1 : 1

  if (a.exercise && b.exercise) {
    // תרגיל כבוי יורד לתחתית הקבוצה במקום להיעלם
    return (
      Number(b.exercise.isActive) - Number(a.exercise.isActive) ||
      a.exercise.order - b.exercise.order
    )
  }

  // לימוד בלבד: הכי הרבה חומר קודם — שם גם התרגילים המרכזיים
  const av = a.library?.totalAvailable ?? 0
  const bv = b.library?.totalAvailable ?? 0
  return bv - av || a.name.localeCompare(b.name, 'he')
}
