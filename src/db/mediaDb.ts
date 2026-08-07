import Dexie, { type Table } from 'dexie'
import type { PlayableVideo, VideoAsset } from './types'
import { VIDEO_MANIFEST, type BundledVideo } from './videoManifest'
import { LIBRARY_MANIFEST } from './libraryManifest'

/**
 * מסד המדיה — סרטוני הדגמה בלבד, כ-Blob.
 *
 * למה נפרד מהנתונים: כתיבת Blob של מגה-בייטים לא מעירה liveQuery על טבלאות
 * הנתונים, ייצוא הנתונים לא נאלץ לגרור וידאו, ומדידת האחסון מפורקת לשני מספרים
 * שאפשר להציג בנפרד.
 */
class MediaDatabase extends Dexie {
  videos!: Table<VideoAsset, string>

  constructor() {
    super('tavor-gym-media')
    this.version(1).stores({
      videos: 'id, exerciseId, origin',
    })
  }
}

export const mediaDb = new MediaDatabase()

/** מזהה יציב לסרטון מצורף — כדי שהתקנה חוזרת לא תיצור כפילויות */
export function bundledId(src: string): string {
  return `bundled:${src}`
}

/**
 * סרטונים מצורפים שהתוכן שלהם התחלף מתחת לאותו שם קובץ.
 *
 * הסרטונים של כפיפת ופשיטת ברכיים היו מוצמדים הפוך והוחלפו ביניהם. המזהה של
 * נכס מצורף הוא הנתיב שלו, ולכן מכשיר שכבר התקין אותם היה ממשיך לנגן את
 * הבייטים הישנים לנצח — ההתקנה מדלגת על מה שכבר קיים. מוחקים אותם פעם אחת:
 * מקוון הם ינוגנו מיד מהרשת, ומסך הסרטונים יציג שחסרים שניים להתקנה חוזרת.
 */
const REPLACED_BUNDLED: readonly string[] = [
  'videos/leg-curl-01.mp4',
  'videos/leg-extension-01.mp4',
]

/** עולה ב-1 בכל פעם שמוסיפים כאן קבצים, כדי שהניקוי ירוץ שוב פעם אחת */
const REPAIR_KEY = 'tavor-gym:media-repair:1'

/**
 * מוחק פעם אחת את הנכסים שהוחלפו. מחזיר כמה נמחקו.
 * לא מפיל את עליית האפליקציה בשום מקרה — זה תיקון, לא תנאי לפתיחה.
 */
export async function repairReplacedBundled(): Promise<number> {
  try {
    if (localStorage.getItem(REPAIR_KEY)) return 0
  } catch {
    // אחסון חסום (גלישה פרטית) — עדיף לנקות בכל עלייה מאשר לא לנקות בכלל
  }
  try {
    const ids = REPLACED_BUNDLED.map(bundledId)
    const removed = await mediaDb.videos.where('id').anyOf(ids).delete()
    try {
      localStorage.setItem(REPAIR_KEY, '1')
    } catch {
      // אין איפה לסמן — הניקוי פשוט יחזור בפעם הבאה, והוא זול וחסין להרצה כפולה
    }
    return removed
  } catch {
    return 0
  }
}

/** ה-URL המלא של נכס מצורף, כולל ה-base של האפליקציה */
export function assetUrl(relativePath: string): string {
  return `${import.meta.env.BASE_URL}${relativePath}`
}

/**
 * הסרטונים המצורפים של תרגיל — מהתוכנית או מהמאגר הלימודי.
 *
 * שני המניפסטים חולקים מבנה ומרחב מזהים זר: מזהי המאגר תמיד בתחילית `lib-`,
 * ולכן חיפוש בשניהם לא יכול להתנגש. בזכות זה כל מה שמעל — הנגן, ההתקנה
 * ל-IndexedDB, שחרור ה-objectURL — עובד על המאגר בלי שינוי.
 */
export function bundledVideosFor(exerciseId: string): BundledVideo[] {
  return VIDEO_MANIFEST[exerciseId] ?? LIBRARY_MANIFEST[exerciseId] ?? []
}

/**
 * כל הסרטונים של תרגיל, מוכנים לנגן.
 *
 * סדר העדיפויות: אם הסרטון המצורף כבר הותקן למכשיר — מנגנים את ה-Blob
 * המקומי (עובד אופליין). אחרת מנגנים מהרשת. סרטונים שהמשתמש ייבא בעצמו
 * מגיעים אחרי המצורפים.
 *
 * חשוב: מי שקורא לפונקציה חייב לקרוא ל-releaseVideos בסיום, אחרת
 * ה-objectURL-ים דולפים.
 */
export async function loadVideosFor(exerciseId: string): Promise<PlayableVideo[]> {
  const local = await mediaDb.videos.where('exerciseId').equals(exerciseId).toArray()
  const localById = new Map(local.map((v) => [v.id, v]))
  const out: PlayableVideo[] = []

  bundledVideosFor(exerciseId).forEach((b, i) => {
    const id = bundledId(b.src)
    const cached = localById.get(id)
    if (cached) {
      localById.delete(id)
      out.push({
        id,
        label: `הדגמה ${i + 1}`,
        url: URL.createObjectURL(cached.blob),
        posterUrl: cached.thumbnailBlob ? URL.createObjectURL(cached.thumbnailBlob) : assetUrl(b.poster),
        durationSec: cached.durationSec,
        sizeBytes: cached.sizeBytes,
        isLocal: true,
      })
    } else {
      out.push({
        id,
        label: `הדגמה ${i + 1}`,
        url: assetUrl(b.src),
        posterUrl: assetUrl(b.poster),
        durationSec: b.durationSec,
        sizeBytes: b.sizeBytes,
        isLocal: false,
      })
    }
  })

  for (const v of localById.values()) {
    out.push({
      id: v.id,
      label: v.label || 'סרטון שלי',
      url: URL.createObjectURL(v.blob),
      posterUrl: v.thumbnailBlob ? URL.createObjectURL(v.thumbnailBlob) : null,
      durationSec: v.durationSec,
      sizeBytes: v.sizeBytes,
      isLocal: true,
    })
  }

  return out
}

/** התמונה הממוזערת הראשונה של תרגיל, לתצוגה במסך האימון */
export async function loadThumbnailFor(exerciseId: string): Promise<string | null> {
  const bundled = bundledVideosFor(exerciseId)
  if (bundled.length) {
    const cached = await mediaDb.videos.get(bundledId(bundled[0].src))
    if (cached?.thumbnailBlob) return URL.createObjectURL(cached.thumbnailBlob)
    return assetUrl(bundled[0].poster)
  }
  const own = await mediaDb.videos.where('exerciseId').equals(exerciseId).first()
  if (own?.thumbnailBlob) return URL.createObjectURL(own.thumbnailBlob)
  return null
}

/** משחרר objectURL-ים שנוצרו ב-loadVideosFor */
export function releaseVideos(videos: readonly PlayableVideo[]): void {
  for (const v of videos) {
    if (v.url.startsWith('blob:')) URL.revokeObjectURL(v.url)
    if (v.posterUrl?.startsWith('blob:')) URL.revokeObjectURL(v.posterUrl)
  }
}

/** כמה מקום תופסים הסרטונים המותקנים */
export async function mediaUsage(): Promise<{ count: number; bytes: number }> {
  let bytes = 0
  let count = 0
  await mediaDb.videos.each((v) => {
    bytes += v.sizeBytes
    count += 1
  })
  return { count, bytes }
}
