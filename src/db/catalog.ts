import { db } from './db'
import { LIBRARY_CATALOG } from './libraryManifest'
import type { LibraryExercise } from './libraryManifest'
import { getAllExercises } from './queries'
import { withSecondaryMuscles } from './muscleTags'
import { loadHiddenExerciseIds, unhideExercises } from './hiddenExercises'
import { loadMuscleFixes } from './muscleFixes'
import { DEFAULT_REST_SECONDS, DEFAULT_TARGET_SETS } from './seed'
import type { Exercise, MuscleGroup, Routine } from './types'
import { newId } from '@/domain/units'

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
  state: EntryState
}

/**
 * ארבעת המצבים של שורה ברשימה המאוחדת. נגזר, לא נשמר.
 *
 * ‏`removedOwn` הוא הצלע שקל לפספס: 14 מתוך 28 תרגילי הזריעה אין להם מקבילה
 * במאגר (`UNLINKED_NOTES`), וגם כל תרגיל שהמשתמש יצר בעצמו. הם לא יכולים
 * "לחזור למאגר" כי אין להם מאגר לחזור אליו — ולכן מצב "הכל" מרנדר את
 * `getCatalogEntries()` המלא ולא את `LIBRARY_CATALOG`. אחרת הוצאת שכיבות
 * סמיכה הייתה מוחקת אותן מהאפליקציה.
 */
export type EntryState = 'mine' | 'removed' | 'removedOwn' | 'library'

function entryState(exercise: Exercise | null, library: LibraryExercise | null): EntryState {
  if (!exercise) return 'library'
  if (exercise.isActive) return 'mine'
  return library ? 'removed' : 'removedOwn'
}

/** האם השורה נמצאת ב"התרגילים שלי" */
export function isMine(entry: CatalogEntry): boolean {
  return entry.state === 'mine'
}

const BY_LIB_ID = new Map(LIBRARY_CATALOG.map((e) => [e.id, e]))

/** בונה רשומה מאוחדת מתרגיל בקטלוג, עם חומר הלימוד שקשור אליו אם יש */
function fromExercise(exercise: Exercise): CatalogEntry {
  const library = exercise.libraryId ? (BY_LIB_ID.get(exercise.libraryId) ?? null) : null
  return {
    id: exercise.id,
    name: exercise.name,
    // מחרוזת ריקה היא "אין שם אנגלי" בקטלוג. כאן זה null, כדי שהמסך יבדוק דבר אחד.
    nameEn: exercise.nameEn?.trim() || null,
    muscleGroup: exercise.muscleGroup,
    exercise,
    library,
    state: entryState(exercise, library),
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
    state: 'library',
  }
}

/**
 * כל התרגילים, משני המקורות, בלי כפילויות.
 *
 * תרגיל מקושר מופיע פעם אחת בלבד ותחת מזהה הקטלוג שלו — הוא המזהה שההיסטוריה,
 * השיאים והסרטונים תלויים בו, ולכן הוא שמנצח. כרגע: 28 בקטלוג ‎+ 62 במאגר
 * פחות 14 מקושרים = 76 רשומות.
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

/**
 * הסדר במצב "הכל" — אלפביתי, בלי שום תלות בחברות.
 *
 * זו החלטה מכוונת ולא עצלות. `useLiveQuery` מריץ מחדש את הרשימה בכל כתיבה
 * למסד, ומיון שתלוי ב"שלי קודם" היה מזיז את השורה מתחת לאצבע ברגע שלוחצים
 * להוספה — כלומר הלחיצה השנייה ברצף נוחתת על תרגיל אחר. כאן השורות נעולות
 * במקומן וההוספה משנה רק את האייקון ואת העמעום.
 *
 * ‏`compareEntries` נשאר בשימוש במצב "שלי", שם הסדר הוא סדר התוכנית.
 */
export function compareByName(a: CatalogEntry, b: CatalogEntry): number {
  return a.name.localeCompare(b.name, 'he') || a.id.localeCompare(b.id)
}

// ─── כתיבה ─────────────────────────────────────────────────────────────────

/*
  שלוש הפעולות של הרשימה המאוחדת.

  `isActive` הוא "האם התרגיל בתרגילים שלי". זו לא סמנטיקה חדשה: כל חמשת
  המקומות שבהם הדגל משנה התנהגות — בניית תור האימון, מועמדי החלפה, בורר
  התוכניות, ההוספה באמצע אימון וברירת המחדל של `getAllExercises` — כבר עושים
  בדיוק את מה ש"הוצאתי אותו" צריך לעשות. מה שהיה חסר הוא רק המקום שבו מציירים
  את השורה, וזה מה שהמסך המאוחד מספק.

  שום פעולה כאן לא מוחקת דבר: סטים, דירוגים, שיאים, `sessions.exerciseIds`,
  פריטי תוכנית והסרטונים במסד המדיה נשארים במקומם בדיוק.
*/

/**
 * מוציא תרגיל מ"התרגילים שלי".
 *
 * ‏`update` ולא `put` — כתיבה חלקית שדקסי עושה read-modify-write, ולכן היא לא
 * יכולה להחזיר לאחור עריכת קטלוג שקרתה במקביל (החשש שמתועד ב-`saveNote`).
 */
export async function removeFromMine(id: string): Promise<void> {
  await db.exercises.update(id, { isActive: false, updatedAt: Date.now() })
}

/**
 * שינוי שם לתרגיל בקטלוג.
 *
 * ‏`update` חלקי ולא `put` של אובייקט שנקרא קודם, מאותה סיבה כמו ב-
 * `removeFromMine`: כתיבה מלאה יכולה להחזיר לאחור עריכה מקבילה של אותה שורה.
 *
 * בטוח לגמרי מבחינת נתונים — שום טבלה לא משכפלת את השם, וההיסטוריה, השיאים
 * והסרטונים ממופתחים ב-`id`. מה שכן צריך רענון הוא סל הבונה, שמחזיק תצלום
 * שם, והקוראים מטפלים בו (`renameItem`).
 */
export async function renameExercise(id: string, name: string): Promise<void> {
  await db.exercises.update(id, { name, updatedAt: Date.now() })
}

/**
 * מחזיר תרגיל שהוצא.
 *
 * ‏`order` לא נגעים בו בכוונה — התרגיל חוזר בדיוק למקום שבו היה בקבוצת השריר
 * שלו, וזה מה שהופך את ההחזרה ל"כאילו כלום לא קרה".
 */
export async function restoreToMine(id: string): Promise<void> {
  await db.exercises.update(id, { isActive: true, updatedAt: Date.now() })
}

/** מה קרה בפועל בהוספה — המסך צריך לדעת כדי לנסח את הטוסט */
export type AddOutcome = 'created' | 'restored' | 'already'

/**
 * מוסיף תרגיל מהמאגר לקטלוג, או מחזיר אותו אם הוא כבר היה שם.
 *
 * ברירות המחדל שמרניות בכוונה: מכונה, משקל כולל, בלי פלטות ובלי משקל זריעה.
 * המשתמש יראה את המספרים שלו כבר בסט הראשון — עדיף לנחש מעט מלנחש הרבה ולא נכון.
 *
 * הקדם-בדיקה על `libraryId` היא מה שמונע כפילות: האינדקס אינו ייחודי, וכפתור
 * הוספה שהבליח על תרגיל שכבר קיים הוא בדיוק הבאג שהוליד את שער `linkKnown`
 * במסך תרגיל המאגר.
 */
export async function addFromLibrary(
  lib: LibraryExercise
): Promise<{ exercise: Exercise; outcome: AddOutcome }> {
  const existing = await db.exercises.where('libraryId').equals(lib.id).first()
  if (existing) {
    if (existing.isActive) {
      await unhideIfHidden([existing.id, lib.id])
      return { exercise: existing, outcome: 'already' }
    }
    await restoreToMine(existing.id)
    await unhideIfHidden([existing.id, lib.id])
    return { exercise: { ...existing, isActive: true }, outcome: 'restored' }
  }

  /*
    תיקון שיוך שנשמר על שורת המאגר עובר לכרטיס שנוצר ממנה.

    בלי זה הוא היה מתאדה בשקט ברגע ההוספה: `groupOf` נותן לכרטיס לגבור על
    שכבת התיקונים — הרשומה היא האמת ברגע שהיא קיימת — ולכן קבוצה שהמשתמש
    תיקן ידנית הייתה חוזרת למה שכתוב במניפסט. הראש נשאר בשכבה (אין לו מקום
    כתיבה), ורק נכתב גם כמיקוד החופשי כדי שהשורה תציג תשובה אחת.
  */
  const fix = (await loadMuscleFixes())[lib.id]
  const created = await blankExercise({
    name: lib.nameHe,
    nameEn: lib.nameEn,
    muscleGroup: fix?.group ?? lib.muscleGroup,
    subTarget: fix?.sub ?? '',
    libraryId: lib.id,
  })
  // add ולא put: התנגשות מזהה חייבת לזרוק ולא לדרוס תרגיל קיים בשקט
  await db.exercises.add(created)
  await unhideIfHidden([created.id, lib.id])
  return { exercise: created, outcome: 'created' }
}

/**
 * הוספה מפורשת של תרגיל מוסתר היא בקשה לראות אותו — אותה סמנטיקה כמו
 * ההחזרה השקטה של תרגיל שהוצא מ"שלי" (isActive) שכבר נעולה בטסט הזרימה.
 *
 * הבדיקה לפני הכתיבה אינה קישוט: `materialize` רץ בלולאה על כל הסל, וכתיבת
 * mutateSettings לכל פריט כשאף אחד לא מוסתר הייתה תור של כתיבות ריקות.
 */
async function unhideIfHidden(ids: readonly string[]): Promise<void> {
  const hidden = await loadHiddenExerciseIds()
  if (ids.some((id) => hidden.has(id))) await unhideExercises(ids)
}

/**
 * שלד תרגיל חדש עם ברירות מחדל שמרניות — מכונה, משקל כולל, בלי פלטות ובלי
 * משקל זריעה. עדיף לנחש מעט מלנחש הרבה ולא נכון: המשתמש יראה את המספרים שלו
 * כבר בסט הראשון, והעורך פתוח לו מיד.
 *
 * לא כותב למסד — הקורא מחליט בין `add` ל-`put`.
 */
async function blankExercise(
  seed: Pick<Exercise, 'name'> & Partial<Exercise>
): Promise<Exercise> {
  const now = Date.now()
  const maxOrder = (await db.exercises.toArray()).reduce((m, e) => Math.max(m, e.order), -1)
  /*
    התיוג המשני מוחל כאן ולא בקוראים.

    זה מסלול היצירה *היחיד* של תרגיל בזמן ריצה, ושלושת המסלולים האחרים
    שכותבים שורת תרגיל כבר מתייגים אותה (זריעה, מיגרציה 8, ייבוא גיבוי).
    בלי השורה כאן, תרגיל שנוצר מהמאגר היה נשאר בלי תגיות לתמיד — מיגרציה 8
    כבר רצה על המכשיר ולא תרוץ שוב — ומסך הכיסוי היה מציג לו "+0 עקיף"
    ומדרג את השרירים שהוא כן מעמיס כמוזנחים. גרוע מכך, ייצוא ושחזור *היו*
    מתקנים אותו, כך שאותו תרגיל היה מדווח מספרים שונים לפני ואחרי גיבוי.
  */
  return withSecondaryMuscles({
    id: newId('ex-'),
    nameEn: '',
    muscleGroup: 'chest',
    subTarget: '',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 2.5,
    defaultRestSeconds: DEFAULT_REST_SECONDS,
    targetSets: DEFAULT_TARGET_SETS,
    targetReps: { min: 8, max: 12 },
    cues: [],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: null,
    isActive: true,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
    ...seed,
  })
}

/**
 * תרגיל חדש מאפס — כזה שאינו מהמאגר.
 *
 * זה המסלול היחיד ליצור תרגיל כמו 14 התרגילים שאין להם מקבילה במאגר: כפיפת
 * פטיש, לחיצת שוק, מקבילים. עד כאן הוא היה קבור בהגדרות ← קטלוג התרגילים,
 * מסך שלא היה אלא עותק שלישי של אותה רשימה.
 *
 * הרשומה נשמרת ריקה ומיד נפתח העורך — שם נותנים לה שם, שריר וציוד.
 */
export async function createBlankExercise(): Promise<Exercise> {
  const created = await blankExercise({ name: 'תרגיל חדש' })
  await db.exercises.add(created)
  return created
}

/**
 * מבטיח שיש תרגיל אמיתי מאחורי מזהה מהרשימה המאוחדת, ומחזיר אותו.
 *
 * זו הנקודה שבה שורה במסך בניית האימון הופכת למשהו שאפשר לתעד בו סטים.
 * שלושת המקרים שהיא סוגרת, ובלעדיה כל אחד מהם נכשל אחרת:
 *   • תרגיל פעיל — מוחזר כמו שהוא.
 *   • תרגיל שהוצא מ"התרגילים שלי" — מוחזר, כי הוספה מפורשת שלו לאימון היא
 *     בדיוק הבקשה להחזיר אותו. בלי זה הוא היה מסונן בבניית התור בשקט.
 *   • מזהה מאגר — נוצר לו כרטיס דרך `addFromLibrary`, עם שער הכפילות שלו.
 */
export async function ensureTrainable(id: string): Promise<Exercise | null> {
  const own = await db.exercises.get(id)
  if (own) {
    // שליחה מהסל של תרגיל שהוסתר בינתיים היא בקשה מפורשת לראות אותו
    await unhideIfHidden([own.id, own.libraryId].filter((x): x is string => !!x))
    if (own.isActive) return own
    await restoreToMine(id)
    return { ...own, isActive: true }
  }

  const library = BY_LIB_ID.get(id)
  if (!library) return null
  const { exercise } = await addFromLibrary(library)
  return exercise
}

/**
 * התוכניות והבלוקים שהתרגיל נמצא בהם, לפי שם.
 *
 * כולל תוכניות כבויות במכוון — ההסרה יכולה לערוך גם אותן, ותוכנית שהמשתמש
 * לא מסתכל עליה כרגע היא בדיוק המקום שבו עריכה שקטה הופכת להפתעה.
 *
 * מה שכן מוחרג: אימון שמור שנמחק. אצל תוכנית קבועה `isActive: false` פירושו
 * "כבויה אבל קיימת", ואצל אימון שמור הוא "נמחק" — אותו שדה, שתי משמעויות.
 * בלי ההחרגה, הסרת תרגיל הייתה נחסמת בשם אימון שהמשתמש כבר מחק ולא רואה
 * באף מסך, כלומר שגיאה שאי אפשר לפעול לפיה.
 */
export interface PlanUsage {
  id: string
  name: string
  kind: 'routine' | 'block'
  active: boolean
}

/** תוכנית שעדיין "קיימת" מבחינת המשתמש */
export function isLivePlan(routine: Routine): boolean {
  return routine.kind !== 'custom' || routine.isActive
}

export async function findPlanUsage(exerciseId: string): Promise<PlanUsage[]> {
  const [routines, blocks] = await Promise.all([db.routines.toArray(), db.blocks.toArray()])
  return [
    ...routines
      .filter(isLivePlan)
      .filter((r) => r.items.some((i) => i.exerciseId === exerciseId))
      .map((r) => ({ id: r.id, name: r.name, kind: 'routine' as const, active: r.isActive })),
    ...blocks
      .filter((b) => b.items.some((i) => i.exerciseId === exerciseId))
      .map((b) => ({ id: b.id, name: b.name, kind: 'block' as const, active: true })),
  ]
}

/**
 * מוציא את התרגיל גם מכל התוכניות והבלוקים.
 *
 * הענף היחיד בכל התכנון שאינו הפיך בלחיצה אחת: החזרת התרגיל תחזיר את
 * ההיסטוריה, השיאים והמשקלים — אבל לא את מקומו בתוכנית. לכן הוא לעולם לא
 * ברירת המחדל, ולכן המסך שואל לפני.
 */
export async function detachFromPlans(exerciseId: string): Promise<void> {
  await db.transaction('rw', db.routines, db.blocks, async () => {
    for (const routine of await db.routines.toArray()) {
      if (!routine.items.some((i) => i.exerciseId === exerciseId)) continue
      const items = routine.items
        .filter((i) => i.exerciseId !== exerciseId)
        .map((it, i) => ({ ...it, order: i }))
      await db.routines.put({ ...routine, items })
    }
    for (const block of await db.blocks.toArray()) {
      if (!block.items.some((i) => i.exerciseId === exerciseId)) continue
      const items = block.items
        .filter((i) => i.exerciseId !== exerciseId)
        .map((it, i) => ({ ...it, order: i }))
      await db.blocks.put({ ...block, items })
    }
  })
}
