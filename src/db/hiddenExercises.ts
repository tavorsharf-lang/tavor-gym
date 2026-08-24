import { useEffect, useState, useSyncExternalStore } from 'react'
import { getSettings, mutateSettings } from './db'
import type { CatalogEntry } from './catalog'

/**
 * תרגילים שהוסתרו מבניית האימון.
 *
 * "לעולם לא אעשה את זה" — אין מכונה כזו בחדר, או שהתרגיל פשוט לא רלוונטי.
 * ההסתרה היא דגל תצוגה טהור של רשימות הבונה בלבד: היא לא נוגעת ב-isActive,
 * לא בתוכניות, לא בתור האימון ולא בסטטיסטיקה, ומסך התרגילים ("הכל") ממשיך
 * להציג הכל — הוא עוגן הניהול שלא משקר.
 *
 * למה מנגנון נפרד ולא הוצאה מ"שלי": ההסתרה חלה גם על תרגילי מאגר שמעולם לא
 * קיבלו כרטיס — אין להם רשומה במסד ואין להם isActive להפוך. הרשימה חיה
 * ב-AppSettings כמו hiddenVideoIds ומאותן סיבות: המניפסטים מג'ונרטים,
 * וההחלטה חייבת לשרוד עדכון גרסה ולהיכנס לגיבוי בחינם.
 *
 * המבנה — מטמון בזיכרון עם מנוי — מועתק מ-hiddenVideos.ts: הצרכנים הם
 * רינדור, והרשימה צריכה להיות זמינה סינכרונית בלי שאילתה לכל מסך.
 * הכתיבות עוברות דרך mutateSettings (קרא-שנה-כתוב בתוך התור), והפרסום נגזר
 * מתוצאת הכתיבה ולא מהמצב שנקרא לפניה — שני הלקחים ממרוצי videoPrefs.
 */

let cache: ReadonlySet<string> | null = null
let inflight: Promise<ReadonlySet<string>> | null = null
let version = 0
const listeners = new Set<() => void>()

function publish(next: ReadonlySet<string>): void {
  cache = next
  version += 1
  for (const listener of listeners) listener()
}

/**
 * זהות ההסתרה של שורה — כל המזהים שהיא מוכרת בהם.
 *
 * המזהה הקנוני של שורה מקושרת *מתחלף*: שורת מאגר שנבחרה ואחר-כך קיבלה כרטיס
 * עוברת מ-lib-id ל-ex-id, ומחיקת הכרטיס מחזירה אותה. הסתרה ששמרה מזהה אחד
 * הייתה מתאדה בהיפוך. לכן שומרים ובודקים את השלישייה המלאה.
 */
export function entryHiddenIds(entry: CatalogEntry): string[] {
  return [...new Set([entry.id, entry.exercise?.libraryId, entry.library?.id].filter(
    (id): id is string => typeof id === 'string'
  ))]
}

/** האם השורה מוסתרת — נבדק מול כל שלושת המזהים */
export function isEntryHidden(entry: CatalogEntry, hidden: ReadonlySet<string>): boolean {
  return entryHiddenIds(entry).some((id) => hidden.has(id))
}

/**
 * הרשימה כפי שהיא כרגע בזיכרון, בלי להמתין. null = עוד לא נטענה.
 * ‏App.tsx מחמם אותה ב-boot לצד hiddenVideoIds, מאותה סיבה — בלי החימום
 * הרינדור הראשון של רשימה היה מציג שורות מוסתרות ומעלים אותן פריים אחר-כך.
 */
export function peekHiddenExerciseIds(): ReadonlySet<string> | null {
  return cache
}

/** קריאה אסינכרונית עם מטמון. שתי קריאות במקביל חולקות את אותה הבטחה. */
export async function loadHiddenExerciseIds(): Promise<ReadonlySet<string>> {
  if (cache) return cache
  inflight ??= getSettings()
    .then((s) => {
      const next = new Set(s.hiddenExerciseIds ?? [])
      cache = next
      return next as ReadonlySet<string>
    })
    .catch(() => new Set<string>() as ReadonlySet<string>)
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** מסתיר תרגיל — כל מזהי הזהות שלו נכנסים יחד */
export async function hideExercise(ids: readonly string[]): Promise<void> {
  const saved = await mutateSettings((s) => {
    const set = new Set(s.hiddenExerciseIds ?? [])
    for (const id of ids) set.add(id)
    return { hiddenExerciseIds: [...set] }
  })
  publish(new Set(saved.hiddenExerciseIds))
}

/**
 * מחזיר תרגיל שהוסתר.
 *
 * נקרא גם מ"הוסף וערוך" ומשליחת הסל (דרך catalog.ts): הוספה מפורשת של
 * תרגיל מוסתר היא בקשה לראות אותו — אותה סמנטיקה כמו החזרת תרגיל שהוצא.
 */
export async function unhideExercises(ids: readonly string[]): Promise<void> {
  const saved = await mutateSettings((s) => {
    const set = new Set(s.hiddenExerciseIds ?? [])
    for (const id of ids) set.delete(id)
    return { hiddenExerciseIds: [...set] }
  })
  publish(new Set(saved.hiddenExerciseIds))
}

/** מאפס את המטמון — אחרי ייבוא גיבוי או איפוס מסד, שבהם ההגדרות הוחלפו */
export function invalidateHiddenExercises(): void {
  cache = null
  inflight = null
  version += 1
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** מספר שמשתנה בכל הסתרה/החזרה — לרשימת התלויות של effect שתלוי ברשימה */
export function useHiddenExercisesVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => 0
  )
}

/**
 * הרשימה עצמה. null עד שהקריאה הראשונה חוזרת — הצרכן מתייחס לזה כטעינה
 * (רשימה ריקה), כדי ששורה מוסתרת לעולם לא תבליח.
 */
export function useHiddenExerciseIds(): ReadonlySet<string> | null {
  const v = useHiddenExercisesVersion()
  const [ids, setIds] = useState<ReadonlySet<string> | null>(() => cache)

  useEffect(() => {
    let cancelled = false
    void loadHiddenExerciseIds().then((next) => {
      if (!cancelled) setIds(next)
    })
    return () => {
      cancelled = true
    }
  }, [v])

  return ids
}
