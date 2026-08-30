import { useEffect, useState, useSyncExternalStore } from 'react'
import { db, getSettings, mutateSettings } from './db'
import { entryHiddenIds } from './hiddenExercises'
import { secondaryFor, subTargetFor } from './subTargets'
import type { CatalogEntry } from './catalog'
import type { Exercise, MuscleFix, MuscleGroup } from './types'

/**
 * תיקון שיוך השריר — "התרגיל הזה לא יושב שם".
 *
 * שני הדברים שהמסך מציג על כל שורה נגזרים ולא נכתבו בשום מקום שאפשר לערוך:
 *
 *  1. **קבוצת השריר** של שורת מאגר מגיעה מ-`LIBRARY_CATALOG` המג׳ונרט.
 *  2. **ראש השריר** (הכותרת: "חזה עליון", "תלת-ראשי — ראש ארוך") נגזר
 *     מכרטיס השרירים — השריר בעל האחוז הגבוה ביותר מתוך קבוצת התרגיל.
 *
 * שניהם נכונים ברוב המכריע ושגויים בקומץ, וזה בדיוק הקומץ שאין עליו מה
 * לעשות: הכרטיס הוא תמונה מיובאת, והמניפסט נדרס בייבוא הבא. השכבה כאן היא
 * המקום שבו ההכרעה של המשתמש חיה מעליהם.
 *
 * **מה נכתב לאן**, וזו כל ההבחנה שהקובץ הזה נושא:
 *
 *   • קבוצה של שורה שיש לה כרטיס בקטלוג → נכתבת ל-`Exercise.muscleGroup`
 *     ולא לכאן. זה מה שהנפח, החימום ומועמדי ההחלפה קוראים, ותיקון שהיה רק
 *     מזיז את השורה ברשימה היה משאיר את שאר האפליקציה סותרת אותה.
 *   • קבוצה של שורת מאגר בלי כרטיס → לכאן. אין לה רשומה לכתוב אליה.
 *   • ראש שריר → תמיד לכאן. אין לו מקום כתיבה בכלל, ולכן זו השכבה היחידה.
 *
 * המבנה — מטמון בזיכרון עם מנוי — מועתק מ-hiddenExercises ומ-videoPrefs:
 * הצרכנים הם רינדור של רשימות, והתשובה חייבת להיות זמינה סינכרונית. הכתיבות
 * עוברות ב-`mutateSettings` (קרא-שנה-כתוב בתוך התור), והפרסום נגזר מתוצאת
 * הכתיבה ולא מהמצב שנקרא לפניה — שני הלקחים ממרוצי videoPrefs.
 */

export type MuscleFixes = Readonly<Record<string, MuscleFix>>

const EMPTY: MuscleFixes = {}

let cache: MuscleFixes | null = null
let inflight: Promise<MuscleFixes> | null = null
let version = 0
const listeners = new Set<() => void>()

function publish(next: MuscleFixes): void {
  cache = next
  version += 1
  for (const listener of listeners) listener()
}

/** התיקונים כפי שהם כרגע בזיכרון, בלי להמתין. null = עוד לא נטענו. */
export function peekMuscleFixes(): MuscleFixes | null {
  return cache
}

/** קריאה אסינכרונית עם מטמון. שתי קריאות במקביל חולקות את אותה הבטחה. */
export async function loadMuscleFixes(): Promise<MuscleFixes> {
  if (cache) return cache
  inflight ??= getSettings()
    .then((s) => {
      const next = s.muscleFixes ?? {}
      // מפרסם ולא רק שומר, מאותה סיבה כמו ב-videoPrefs: רשימה שרונדרה לפני
      // שהמטמון היה חם הייתה נשארת עם הכותרת הישנה עד ניווט
      publish(next)
      return next
    })
    .catch(() => EMPTY)
    .finally(() => {
      inflight = null
    })
  return inflight
}

// ─── קריאה ─────────────────────────────────────────────────────────────────

/** הראשון מבין מזהי הזהות שיש לו תיקון. null = אין תיקון לשורה הזו. */
function pick(fixes: MuscleFixes, ids: readonly (string | undefined)[]): MuscleFix | null {
  for (const id of ids) {
    if (!id) continue
    const fix = fixes[id]
    if (fix) return fix
  }
  return null
}

/** התיקון של שורה ברשימה המאוחדת, אם יש */
export function fixForEntry(entry: CatalogEntry, fixes: MuscleFixes): MuscleFix | null {
  return pick(fixes, entryHiddenIds(entry))
}

/** התיקון של תרגיל בקטלוג — למסכים שמחזיקים `Exercise` ולא שורת קטלוג */
export function fixForExercise(exercise: Exercise, fixes: MuscleFixes): MuscleFix | null {
  return pick(fixes, [exercise.id, exercise.libraryId])
}

/**
 * קבוצת השריר של שורה, אחרי תיקון.
 *
 * כרטיס בקטלוג תמיד גובר על השכבה: `Exercise.muscleGroup` הוא האמת, ותיקון
 * שנשמר בזמן שהשורה עוד הייתה שורת מאגר לא אמור לדרוס את מה שנכתב לרשומה
 * מאז — בעורך המלא, למשל.
 */
export function groupOf(entry: CatalogEntry, fixes: MuscleFixes): MuscleGroup {
  if (entry.exercise) return entry.exercise.muscleGroup
  return fixForEntry(entry, fixes)?.group ?? entry.muscleGroup
}

/**
 * ראש השריר של שורה: התיקון אם יש, ואחרת מה שנגזר מכרטיס השרירים.
 * null = אין לתרגיל כרטיס עם אחוזים, והמסכים מפילים אותו ל"אחר".
 */
export function subOf(
  entry: CatalogEntry,
  group: MuscleGroup,
  fixes: MuscleFixes
): string | null {
  return (
    fixForEntry(entry, fixes)?.sub ??
    subTargetFor(entry.exercise?.id ?? entry.id, group, entry.exercise?.libraryId)
  )
}

/** אותו דבר לתרגיל בקטלוג */
export function subOfExercise(exercise: Exercise, fixes: MuscleFixes): string | null {
  return (
    fixForExercise(exercise, fixes)?.sub ??
    subTargetFor(exercise.id, exercise.muscleGroup, exercise.libraryId)
  )
}

/**
 * מה עוד עובד בתרגיל — בלי הראש שמוצג ככותרת.
 *
 * ‏`secondaryFor` מסנן את הראש ה*נגזר*, ולכן שורה מתוקנת הייתה מציגה את
 * הכותרת הישנה כתגית לצד החדשה. הסינון כאן הוא מול הראש שבאמת מוצג.
 */
export function secondaryOf(
  entry: CatalogEntry,
  group: MuscleGroup,
  sub: string | null
): readonly { he: string; pct: number }[] {
  const list = secondaryFor(entry.exercise?.id ?? entry.id, group, entry.exercise?.libraryId)
  return sub ? list.filter((m) => m.he !== sub) : list
}

// ─── כתיבה ─────────────────────────────────────────────────────────────────

export interface MuscleFixInput {
  group: MuscleGroup
  /** null = לא לתקן את הראש, להשאיר את מה שנגזר מהכרטיס */
  sub: string | null
}

/**
 * שומר תיקון שיוך לשורה אחת.
 *
 * שתי כתיבות ולא אחת, לפי החלוקה שבראש הקובץ: הרשומה בקטלוג (כשיש) והשכבה
 * בהגדרות. הן לא חופפות — מה שנכתב לרשומה *לא* נשמר גם בשכבה, אחרת שינוי
 * עתידי בעורך המלא היה נדרס בחזרה בכל רינדור.
 *
 * תיקון שמסכים עם מה שממילא נגזר נמחק ולא נשמר: שכבה שמחזיקה את התשובה
 * הנכונה כערך קפוא הייתה מקפיאה גם כרטיס שיוחלף מחר.
 */
export async function saveMuscleFix(
  entry: CatalogEntry,
  next: MuscleFixInput
): Promise<void> {
  const ex = entry.exercise

  if (ex) {
    const patch: Partial<Exercise> = {}
    if (ex.muscleGroup !== next.group) {
      patch.muscleGroup = next.group
      /*
        שינוי השריר הראשי מנקה אותו מהמשניים באותה פעולה — בדיוק כמו בעורך
        המלא. סט אחד שנספר לאותו שריר גם ישירות וגם בעקיפין הוא הבאג היחיד
        שהשדה הזה מסוגל לייצר, וכאן הוא נסגר בכתיבה ולא בקריאה.
      */
      patch.secondaryMuscles = (ex.secondaryMuscles ?? []).filter((m) => m !== next.group)
    }
    // המיקוד החופשי הוא מה שמודפס בשורה לצד הציוד. תיקון שמזיז את הכותרת
    // ומשאיר אותו על הערך הישן היה מציג שתי תשובות סותרות באותה שורה.
    if (next.sub && ex.subTarget !== next.sub) patch.subTarget = next.sub
    if (Object.keys(patch).length > 0) {
      await db.exercises.update(ex.id, { ...patch, updatedAt: Date.now() })
    }
  }

  const derived = subTargetFor(ex?.id ?? entry.id, next.group, ex?.libraryId)
  const fix: MuscleFix = {}
  if (!ex && next.group !== entry.muscleGroup) fix.group = next.group
  if (next.sub && next.sub !== derived) fix.sub = next.sub

  await writeFix(entryHiddenIds(entry), Object.keys(fix).length > 0 ? fix : null)
}

/**
 * מוחק את התיקון ומחזיר את השורה למה שנגזר.
 *
 * לא נוגע ברשומת התרגיל: קבוצה שנכתבה לכרטיס היא כבר הנתון של התרגיל, ואין
 * "מקור" לחזור אליו. הגיליון אומר את זה במפורש במקום להבטיח החזרה שלא תקרה.
 */
export async function clearMuscleFix(entry: CatalogEntry): Promise<void> {
  await writeFix(entryHiddenIds(entry), null)
}

/** כותב את אותו ערך תחת כל מזהי הזהות, או מוחק את כולם */
async function writeFix(ids: readonly string[], fix: MuscleFix | null): Promise<void> {
  const saved = await mutateSettings((s) => {
    const map = { ...(s.muscleFixes ?? {}) }
    for (const id of ids) {
      if (fix) map[id] = fix
      else delete map[id]
    }
    return { muscleFixes: map }
  })
  publish(saved.muscleFixes)
}

/** מאפס את המטמון — אחרי ייבוא גיבוי או איפוס מסד, שבהם ההגדרות הוחלפו */
export function invalidateMuscleFixes(): void {
  cache = null
  inflight = null
  version += 1
  for (const listener of listeners) listener()
}

// ─── מנוי ──────────────────────────────────────────────────────────────────

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** מספר שמשתנה בכל תיקון — לרשימת התלויות של useMemo שתלוי בשכבה */
export function useMuscleFixesVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => 0
  )
}

/**
 * השכבה עצמה. מפה ריקה עד שהקריאה הראשונה חוזרת — כלומר "אין תיקונים", וזו
 * ברירת המחדל הנכונה: השורה מוצגת לפי מה שנגזר, ולא נעלמת. ‏App.tsx מחמם
 * את המטמון ב-boot כדי שגם ההבלחה הזו לא תקרה.
 */
export function useMuscleFixes(): MuscleFixes {
  const v = useMuscleFixesVersion()
  const [fixes, setFixes] = useState<MuscleFixes>(() => cache ?? EMPTY)

  useEffect(() => {
    let cancelled = false
    void loadMuscleFixes().then((next) => {
      if (!cancelled) setFixes(next)
    })
    return () => {
      cancelled = true
    }
  }, [v])

  return fixes
}
