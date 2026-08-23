import { useEffect, useState, useSyncExternalStore } from 'react'
import { getSettings, mutateSettings, saveSettings } from './db'

/**
 * סרטונים שהמשתמש מחק.
 *
 * למה מנגנון ולא מחיקה פשוטה: רוב הסרטונים באפליקציה *מצורפים* אליה — הם
 * יושבים ב-`public/videos` ומגיעים עם כל פריסה. מחיקת ה-Blob המקומי לבדה
 * הייתה מפנה מקום אבל לא מסלקת את הסרטון: בפתיחה הבאה הוא היה נטען שוב
 * מהרשת, וההתקנה הבאה הייתה מחזירה אותו למכשיר. ההחלטה "לא רוצה לראות את
 * הסרטון הזה" חייבת להישמר בנפרד מהבייטים.
 *
 * הרשימה חיה ב-AppSettings ולכן נכנסת לגיבוי הנתונים בלי שורת קוד נוספת.
 *
 * המודול מחזיק מטמון בזיכרון עם מנוי, כי הצרכנים שלו הם רינדור: התמונה
 * הממוזערת בכרטיס התרגיל צריכה להיעלם באותו רגע שבו נמחק הסרטון האחרון, בלי
 * לרענן מסך ובלי ש-liveQuery יעבור על טבלת מדיה שהיא בכלל במסד אחר.
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
 * הרשימה כפי שהיא כרגע בזיכרון, בלי להמתין. null = עוד לא נטענה.
 *
 * קיים בשביל רינדור סינכרוני: `VideoThumb` מציג את הפוסטר מהמניפסט מיד, ובלי
 * הצצה כזו הוא היה מבליח לרגע סרטון שנמחק לפני שהקריאה האסינכרונית מתקנת.
 */
export function peekHiddenVideoIds(): ReadonlySet<string> | null {
  return cache
}

/** קריאה אסינכרונית עם מטמון. שתי קריאות במקביל חולקות את אותה הבטחה. */
export async function loadHiddenVideoIds(): Promise<ReadonlySet<string>> {
  if (cache) return cache
  inflight ??= getSettings()
    .then((s) => {
      const next = new Set(s.hiddenVideoIds ?? [])
      cache = next
      return next as ReadonlySet<string>
    })
    .catch(() => new Set<string>() as ReadonlySet<string>)
    .finally(() => {
      inflight = null
    })
  return inflight
}

/**
 * מוחק סרטון: מסיר את ה-Blob המקומי אם הותקן, ומסמן שלא להציג אותו שוב.
 *
 * מקבל את פונקציית המחיקה מבחוץ כדי שהמודול הזה לא יצטרך להכיר את מסד המדיה —
 * שני המסדים נשארים בלתי תלויים, וזה מה שמאפשר לבדוק את הלוגיקה כאן בלי מדיה.
 */
export async function hideVideo(
  id: string,
  removeLocal: (id: string) => Promise<void>
): Promise<void> {
  await removeLocal(id).catch(() => {
    // הנכס לא היה מותקן, או שמסד המדיה לא זמין. ההסתרה חשובה יותר.
  })
  /*
    הקריאה והכתיבה בתוך אותו תור.

    בעבר זה היה קרא-שנה-כתוב פתוח: שתי מחיקות מהירות ברצף (רשימת הכפילויות
    היא בדיוק זרימה כזו) קראו שתיהן את אותה רשימה, וכל אחת כתבה אותה בתוספת
    המזהה שלה — הראשונה נעלמה, והסרטון חזר להופיע. `mutateSettings` נועל את
    שתי הפעולות יחד ולכן התוצאה נכונה בכל תזמון.
  */
  let next: string[] | null = null
  await mutateSettings((settings) => {
    const ids = settings.hiddenVideoIds ?? []
    if (ids.includes(id)) return {}
    next = [...ids, id]
    return { hiddenVideoIds: next }
  })
  if (next) publish(new Set(next))
}

/** מחזיר את כל הסרטונים שהוסתרו. משמש את מסך הסרטונים בהגדרות. */
export async function restoreHiddenVideos(): Promise<number> {
  const current = await loadHiddenVideoIds()
  if (current.size === 0) return 0
  await saveSettings({ hiddenVideoIds: [] })
  publish(new Set())
  return current.size
}

/**
 * מודיע שרשימת הסרטונים השתנתה בלי שההסתרה השתנתה — למשל מחיקה של סרטון
 * מיובא, שנעלם מהמסד לתמיד ולכן אין מה לזכור עליו.
 */
export function notifyVideosChanged(): void {
  version += 1
  for (const listener of listeners) listener()
}

/** מאפס את המטמון — אחרי ייבוא גיבוי או איפוס מסד, שבהם ההגדרות הוחלפו */
export function invalidateHiddenVideos(): void {
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

/**
 * מספר שמשתנה בכל מחיקה או שחזור. רכיב שתלוי בסרטונים מכניס אותו לרשימת
 * התלויות של ה-effect שלו, וכך נטען מחדש בדיוק ברגע הנכון.
 */
export function useHiddenVideosVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => 0
  )
}

/** הרשימה עצמה, למסך שצריך לספור או להציג אותה. ריקה עד שהקריאה חוזרת. */
export function useHiddenVideoIds(): ReadonlySet<string> {
  const version = useHiddenVideosVersion()
  const [ids, setIds] = useState<ReadonlySet<string>>(() => cache ?? new Set())

  useEffect(() => {
    let cancelled = false
    void loadHiddenVideoIds().then((next) => {
      if (!cancelled) setIds(next)
    })
    return () => {
      cancelled = true
    }
  }, [version])

  return ids
}
