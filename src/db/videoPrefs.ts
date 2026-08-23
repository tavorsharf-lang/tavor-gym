import { useEffect, useState, useSyncExternalStore } from 'react'
import { getSettings, mutateSettings } from './db'
import type { MuscleGroup } from './types'

/**
 * העדפות תצוגה של סרטונים: סדר מותאם ושיוך-מחדש.
 *
 * אותו רציונל כמו hiddenVideos ומאותן סיבות: המניפסטים מג'ונרטים מסקריפט,
 * ה-Blob-ים נמחקים ומותקנים מחדש, וההחלטות "הסרטון הזה ראשון" ו"הסרטון הזה
 * שייך לתרגיל אחר" חייבות לחיות מעליהם — ב-AppSettings, ששורד הכל ונכנס
 * לגיבוי בלי שורת קוד נוספת.
 *
 * שיוך (move) הוא ממזהה נכס אל יעד: מזהה תרגיל, מזהה תרגיל מאגר, או
 * `group:<שריר>` — מדף הסרטונים של קבוצת שריר שלמה. סדר (order) נשמר לכל
 * הקשר תצוגה בנפרד, כרשימת מזהי נכסים.
 *
 * מזהים מתים (סרטון שנעלם בייבוא מחודש) נסבלים בשקט בכל הצרכנים — רשומה
 * שמצביעה לשום מקום פשוט לא מיושמת.
 */

export interface VideoPrefs {
  moves: Record<string, string>
  order: Record<string, string[]>
}

const EMPTY: VideoPrefs = { moves: {}, order: {} }

let cache: VideoPrefs | null = null
let inflight: Promise<VideoPrefs> | null = null
let version = 0
const listeners = new Set<() => void>()

function publish(next: VideoPrefs): void {
  cache = next
  version += 1
  for (const listener of listeners) listener()
}

/** ההעדפות כפי שהן כרגע בזיכרון, בלי להמתין. null = עוד לא נטענו. */
export function peekVideoPrefs(): VideoPrefs | null {
  return cache
}

/** קריאה אסינכרונית עם מטמון. שתי קריאות במקביל חולקות את אותה הבטחה. */
export async function loadVideoPrefs(): Promise<VideoPrefs> {
  if (cache) return cache
  inflight ??= getSettings()
    .then((s) => {
      const next: VideoPrefs = { moves: s.videoMoves ?? {}, order: s.videoOrder ?? {} }
      /*
        המילוי הראשון *מפרסם* ולא רק שומר. רכיבים שהציצו לפני שהמטמון היה חם
        (התמונות הממוזערות בקימה קרה) רינדרו לפי סדר המניפסט, ובלי ההערה
        למאזינים הם היו נשארים ככה עד ניווט — הסדר המותאם והעברות היו נראים
        כאילו נמחקו בכל פתיחה של האפליקציה.
      */
      publish(next)
      return next
    })
    .catch(() => EMPTY)
    .finally(() => {
      inflight = null
    })
  return inflight
}

/**
 * כותב העדפות ומפרסם את מה שבאמת נשמר.
 *
 * שתי נקודות שכל ארבעת המשנים כאן דרכו:
 *
 *  1. **קריאה וכתיבה בתוך אותו תור.** קודם כל אחד מהם קרא את ההעדפות, בנה
 *     אובייקט שלם, וכתב אותו — ולכן שתי פעולות מהירות ברצף (שתי העברות
 *     בפאנל הניהול, שתי הקשות חצים) חישבו שתיהן מאותו מצב, והשנייה דרסה את
 *     הראשונה. `mutateSettings` נועל את שתיהן יחד.
 *  2. **הפרסום מגיע מהתוצאה ולא מהקריאה שלפניה.** קודם פורסם `current`
 *     הישן ממוזג עם השדה החדש, כלומר המטמון בזיכרון יכול היה להחזיק ערך
 *     ישן בשדה *השני* — סדר שנשמר בעוד פעולה נעלם מהמסך עד רענון.
 */
async function writePrefs(
  change: (current: VideoPrefs) => Partial<Pick<VideoPrefs, 'moves' | 'order'>> | null
): Promise<void> {
  let touched = false
  const saved = await mutateSettings((settings) => {
    const currentPrefs: VideoPrefs = {
      moves: settings.videoMoves ?? {},
      order: settings.videoOrder ?? {},
    }
    const patch = change(currentPrefs)
    if (!patch) return {}
    touched = true
    return {
      ...(patch.moves ? { videoMoves: patch.moves } : {}),
      ...(patch.order ? { videoOrder: patch.order } : {}),
    }
  })
  if (touched) publish({ moves: saved.videoMoves ?? {}, order: saved.videoOrder ?? {} })
}

/** מזהה ההקשר של מדף קבוצת שריר */
export function groupContextId(group: MuscleGroup): string {
  return `group:${group}`
}

export function isGroupContext(contextId: string): boolean {
  return contextId.startsWith('group:')
}

export function groupOfContext(contextId: string): MuscleGroup | null {
  return isGroupContext(contextId) ? (contextId.slice('group:'.length) as MuscleGroup) : null
}

/**
 * מעביר סרטון ליעד חדש, או מחזיר אותו הביתה (target = null).
 *
 * ההעברה מוסרת גם מרשימות הסדר של ההקשרים האחרים? לא — הסדר סובלני למזהים
 * שכבר לא מוצגים בהקשר, והשארתם שומרת את מקומם אם הסרטון יוחזר.
 */
export async function saveVideoMove(assetId: string, target: string | null): Promise<void> {
  await writePrefs((current) => {
    const moves = { ...current.moves }
    if (target === null) delete moves[assetId]
    else moves[assetId] = target
    return { moves }
  })
}

/** קובע סדר תצוגה מותאם להקשר אחד (תרגיל / תרגיל מאגר / קבוצה) */
export async function saveVideoOrder(contextId: string, assetIds: string[]): Promise<void> {
  await writePrefs((current) => ({ order: { ...current.order, [contextId]: [...assetIds] } }))
}

/**
 * מנקה כל זכר לנכס שנמחק סופית (סרטון מיובא). נכסים מצורפים לא מנוקים —
 * המחיקה שלהם הפיכה (שחזור מוסתרים), וההעדפות צריכות לשרוד אותה.
 */
export async function forgetVideoPrefs(assetId: string): Promise<void> {
  await writePrefs((current) => {
    const hasMove = assetId in current.moves
    const hasOrder = Object.values(current.order).some((ids) => ids.includes(assetId))
    if (!hasMove && !hasOrder) return null
    const moves = { ...current.moves }
    delete moves[assetId]
    const order = Object.fromEntries(
      Object.entries(current.order).map(([ctx, ids]) => [ctx, ids.filter((id) => id !== assetId)])
    )
    return { moves, order }
  })
}

/**
 * מנקה כל שיוך שמצביע אל הקשר שנמחק — נקרא כשתרגיל נמחק מהקטלוג.
 *
 * בלי זה סרטון שהועבר לתרגיל שנמחק היה נעלם מכל האפליקציה לצמיתות: מסונן
 * מהבית שלו (כי יש לו העברה) ומוצג רק בהקשר שאף מסך כבר לא מרנדר. הניקוי
 * מחזיר אותו הביתה, ומוחק גם את רשימת הסדר של ההקשר המת.
 */
export async function forgetMovesTo(contextId: string): Promise<void> {
  await writePrefs((current) => {
    const doomed = Object.entries(current.moves).filter(([, target]) => target === contextId)
    const hasOrder = contextId in current.order
    if (!doomed.length && !hasOrder) return null
    const moves = { ...current.moves }
    for (const [assetId] of doomed) delete moves[assetId]
    const order = { ...current.order }
    delete order[contextId]
    return { moves, order }
  })
}

/** מאפס את המטמון — אחרי ייבוא גיבוי או איפוס מסד, שבהם ההגדרות הוחלפו */
export function invalidateVideoPrefs(): void {
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
 * מספר שמשתנה בכל שינוי העדפות. רכיב שמציג סרטונים מכניס אותו לתלויות
 * ה-effect שלו ונטען מחדש בדיוק ברגע הנכון — כמו useHiddenVideosVersion.
 */
export function useVideoPrefsVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => 0
  )
}

/** ההעדפות עצמן, לרכיב שמרנדר לפיהן. ריקות עד שהקריאה חוזרת. */
export function useVideoPrefs(): VideoPrefs {
  const current = useVideoPrefsVersion()
  const [prefs, setPrefs] = useState<VideoPrefs>(() => cache ?? EMPTY)

  useEffect(() => {
    let cancelled = false
    void loadVideoPrefs().then((next) => {
      if (!cancelled) setPrefs(next)
    })
    return () => {
      cancelled = true
    }
  }, [current])

  return prefs
}
