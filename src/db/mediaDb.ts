import Dexie, { type Table } from 'dexie'
import type { PlayableVideo, VideoAsset } from './types'
import { VIDEO_MANIFEST, type BundledVideo } from './videoManifest'
import { LIBRARY_CATALOG, LIBRARY_MANIFEST } from './libraryManifest'
import { hideVideo, loadHiddenVideoIds, notifyVideosChanged } from './hiddenVideos'
import {
  forgetVideoPrefs,
  isGroupContext,
  loadVideoPrefs,
  type VideoPrefs,
} from './videoPrefs'

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

/**
 * מנרמל את ה-origin של נכסים ששוחזרו מגיבוי לפני שהייבוא הכיר את 'library'.
 *
 * הייבוא שיטח כל origin שאינו 'bundled' ל-'imported', ולכן מכשיר שכבר שחזר
 * גיבוי מדיה מחזיק את סרטוני המאגר תחת ערך שגוי: המונה במסך הסרטונים מציג
 * "מותקנים 0", ההתקנה מדלגת עליהם, וכפתור המחיקה לא מופיע — מאות מגה-בייט
 * תקועים בלי שום מסלול ניהול. המזהה הוא הנתיב, ולכן הוא מספיק כדי לתקן.
 *
 * מחזיר כמה רשומות תוקנו. לא מפיל את עליית האפליקציה בשום מקרה.
 */
export async function repairAssetOrigins(): Promise<number> {
  try {
    const wrong = await mediaDb.videos.where('origin').notEqual('library').toArray()
    const fixes = wrong.filter((v) => v.id.startsWith('bundled:videos/lib/'))
    if (!fixes.length) return 0
    await mediaDb.videos.bulkPut(fixes.map((v) => ({ ...v, origin: 'library' as const })))
    return fixes.length
  } catch {
    return 0
  }
}

/** ה-URL המלא של נכס מצורף, כולל ה-base של האפליקציה */
export function assetUrl(relativePath: string): string {
  return `${import.meta.env.BASE_URL}${relativePath}`
}

/** נושאי הסרטונים של תרגיל במאגר, מקבילים למניפסט שלו */
const LIBRARY_TOPICS = new Map(
  LIBRARY_CATALOG.map((e) => [e.id, e.videos.map((v) => v.topic)])
)

/**
 * אינדקס גלובלי: מזהה נכס ← הקליפ שלו והכותרת הטבעית שלו.
 *
 * קיים בשביל שיוך-מחדש: סרטון שהועבר לתרגיל אחר (או למדף קבוצה) צריך להישלף
 * לפי המזהה בלבד, בלי לדעת באיזה מניפסט ובאיזה תרגיל הוא נולד. הכותרת
 * הטבעית נוסעת איתו — נושא של סרטון מאגר נשאר הנושא שלו גם אחרי מעבר.
 */
interface IndexedClip {
  clip: BundledVideo
  /** נושא לסרטון מאגר, null להדגמה (שתקבל מספור לפי מיקומה החדש) */
  topic: string | null
  /** התרגיל שהסרטון נולד תחתיו במניפסט — לפני העברות מותאמות */
  homeId: string
}

let clipIndex: Map<string, IndexedClip> | null = null

/** בונה את האינדקס בפעם הראשונה שצריך אותו, ומחזיר אותו */
function indexOfClips(): Map<string, IndexedClip> {
  if (!clipIndex) {
    clipIndex = new Map()
    for (const [exerciseId, list] of Object.entries(VIDEO_MANIFEST)) {
      for (const clip of list) {
        clipIndex.set(bundledId(clip.src), { clip, topic: null, homeId: exerciseId })
      }
    }
    for (const [libId, list] of Object.entries(LIBRARY_MANIFEST)) {
      const topics = LIBRARY_TOPICS.get(libId) ?? []
      list.forEach((clip, i) => {
        clipIndex!.set(bundledId(clip.src), {
          clip,
          topic: topics[i] ?? null,
          homeId: libId,
        })
      })
    }
  }
  return clipIndex
}

/** מיוצא בשביל מדפי הקבוצות: לבדוק סינכרונית אם מזהה שיוך עדיין חי */
export function clipById(assetId: string): IndexedClip | null {
  return indexOfClips().get(assetId) ?? null
}

/**
 * כל הסרטונים המצורפים שהמשתמש עדיין רואה, עם התרגיל שהם מוצגים תחתיו.
 *
 * קיים בשביל איתור הכפילויות, שצריך מבט אחד על *כל* המאגר ולא על הקשר אחד.
 * שני הסינונים הכרחיים: סרטון שנמחק לא אמור להיות מוצע למחיקה שוב, וסרטון
 * שהועבר צריך להופיע תחת התרגיל שהמשתמש רואה אותו בו — אחרת ההצעה מדברת על
 * מקום שכבר לא קיים.
 */
export function allVisibleClips(
  hidden: ReadonlySet<string>,
  prefs?: VideoPrefs | null
): { id: string; clip: BundledVideo; topic: string | null; ownerId: string }[] {
  const moves = prefs?.moves ?? {}
  const out: { id: string; clip: BundledVideo; topic: string | null; ownerId: string }[] = []
  for (const [id, indexed] of indexOfClips()) {
    if (hidden.has(id)) continue
    out.push({
      id,
      clip: indexed.clip,
      topic: indexed.topic,
      ownerId: moves[id] ?? indexed.homeId,
    })
  }
  return out
}

/**
 * ממיין רשימה לפי סדר מותאם. מזהה שלא ברשימת הסדר נכנס אחרי הממוינים,
 * בסדר ברירת המחדל שלו — המיון יציב, ולכן "לא סידרתי" לא משנה כלום.
 */
function applyOrder<T>(list: T[], idOf: (item: T) => string, order: readonly string[]): T[] {
  if (!order.length) return list
  const rank = new Map(order.map((id, i) => [id, i]))
  return list
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const ra = rank.get(idOf(a.item)) ?? order.length + a.i
      const rb = rank.get(idOf(b.item)) ?? order.length + b.i
      return ra - rb
    })
    .map(({ item }) => item)
}

/*
  אין כאן נפילה לאחור ל-LIBRARY_LINKS בכוונה.

  הקישור חי על רשומת התרגיל (`Exercise.libraryId`) ונזרע משם, ולכן כל קורא שיש
  לו את הרשומה כבר מחזיק אותו. נפילה לאחור הייתה הופכת את הצירוף לבלתי ניתן
  לכיבוי — ומסך הסרטונים, שמנהל רק את ההדגמות של התוכנית, לא היה יכול לבקש
  לספור אותן בלבד.
*/

/**
 * כל הסרטונים המצורפים של תרגיל.
 *
 * לתרגיל בתוכנית זה ההדגמות שלו ואחריהן כל סרטוני ההסבר של המקבילה שלו במאגר.
 * ההדגמות ראשונות בכוונה: הן תבור מבצע את התרגיל על המכונה שלו, וזה מה שהוא בא
 * לראות באמצע סט. ההסברים הם עומק שמגיע אחריו.
 *
 * שני המניפסטים חולקים מבנה ומרחב מזהים זר — מזהי המאגר תמיד בתחילית `lib-` —
 * ולכן איחוד ביניהם לא יכול להתנגש, וכל מה שמעל עובד על שניהם בלי שינוי.
 */
interface LabelledClip {
  clip: BundledVideo
  label: string
}

/**
 * המקור היחיד לזוג (סרטון, כותרת).
 *
 * שתי הפונקציות הציבוריות נגזרות מכאן ולא מחשבות כל אחת בנפרד, כי הן חייבות
 * להישאר מיושרות באינדקס: `loadVideosFor` מצמיד את הכותרת ה-i לסרטון ה-i,
 * וכל סינון שקורה רק באחת מהן היה מדביק לסרטון אחד את הכותרת של אחר.
 */
function labelledClips(
  exerciseId: string,
  libraryId?: string,
  hidden?: ReadonlySet<string>,
  prefs?: VideoPrefs | null
): LabelledClip[] {
  const moves = prefs?.moves ?? {}
  const order = prefs?.order?.[exerciseId] ?? []

  /*
    הרשימה הביתית של ההקשר, לפני שיוכים מותאמים. תווית ריקה = הדגמה שתקבל
    מספור לפי מיקומה הסופי; מדף קבוצה מתחיל ריק — כל התוכן שלו מגיע מהעברות.
  */
  let base: LabelledClip[]
  if (isGroupContext(exerciseId)) {
    base = []
  } else {
    const fromLibraryManifest = LIBRARY_MANIFEST[exerciseId]
    if (fromLibraryManifest) {
      // תרגיל מהמאגר עצמו: אין לו הדגמות משלו, רק סרטוני הסבר
      const topics = LIBRARY_TOPICS.get(exerciseId) ?? []
      base = fromLibraryManifest.map((clip, i) => ({ clip, label: topics[i] ?? `הסבר ${i + 1}` }))
    } else {
      const own = VIDEO_MANIFEST[exerciseId] ?? []
      const seen = new Set(own.map((v) => v.src))
      const topics = libraryId ? (LIBRARY_TOPICS.get(libraryId) ?? []) : []
      // הגנה מפני כפילות אם אי פעם יופיע אותו קובץ בשני המניפסטים
      const explainers = (libraryId ? (LIBRARY_MANIFEST[libraryId] ?? []) : [])
        .map((clip, i) => ({ clip, label: topics[i] ?? `הסבר ${i + 1}` }))
        .filter(({ clip }) => !seen.has(clip.src))
      base = [...own.map((clip) => ({ clip, label: '' })), ...explainers]
    }
  }

  // סרטון שהועבר החוצה נעלם מהבית שלו — כולל מהצירוף דרך libraryId
  const stay = base.filter(({ clip }) => {
    const to = moves[bundledId(clip.src)]
    return to === undefined || to === exerciseId
  })

  // סרטונים שהועברו לכאן מהקשרים אחרים. מזהה מת (ייבוא מחודש) מדולג בשקט.
  const present = new Set(stay.map(({ clip }) => clip.src))
  const movedIn: LabelledClip[] = []
  for (const [assetId, target] of Object.entries(moves)) {
    if (target !== exerciseId) continue
    const indexed = clipById(assetId)
    if (!indexed || present.has(indexed.clip.src)) continue
    movedIn.push({ clip: indexed.clip, label: indexed.topic ?? '' })
  }

  const visible = withoutHidden([...stay, ...movedIn], hidden)
  const ordered = applyOrder(visible, ({ clip }) => bundledId(clip.src), order)

  // המספור של ההדגמות נגזר *אחרי* הסינון והמיון: "הדגמה 2" כשאין הדגמה 1
  // היא חור שנראה כמו תקלה, והמספר הוא מיקום ברשימה ולא זהות של הסרטון.
  let demo = 0
  return ordered.map(({ clip, label }) => ({
    clip,
    label: label || `הדגמה ${++demo}`,
  }))
}

function withoutHidden(list: LabelledClip[], hidden?: ReadonlySet<string>): LabelledClip[] {
  if (!hidden?.size) return list
  return list.filter(({ clip }) => !hidden.has(bundledId(clip.src)))
}

export function bundledVideosFor(
  exerciseId: string,
  libraryId?: string,
  /** מזהי נכסים שהמשתמש מחק. ראה db/hiddenVideos.ts */
  hidden?: ReadonlySet<string>,
  /** סדר ושיוך מותאמים. ראה db/videoPrefs.ts */
  prefs?: VideoPrefs | null
): BundledVideo[] {
  return labelledClips(exerciseId, libraryId, hidden, prefs).map(({ clip }) => clip)
}

/**
 * כותרת לכל סרטון, מקבילה ל-`bundledVideosFor` באותם ארגומנטים.
 *
 * הדגמה מקבלת מספר סידורי, כי כולן מראות את אותו דבר. סרטון מהמאגר מקבל את
 * הנושא שלו, כי כל אחד מלמד משהו אחר — ובלי זה רשימה של עשרים סרטונים על אותו
 * תרגיל היא רשימת מספרים שאי אפשר לבחור מתוכה.
 */
export function videoLabelsFor(
  exerciseId: string,
  libraryId?: string,
  hidden?: ReadonlySet<string>,
  prefs?: VideoPrefs | null
): string[] {
  return labelledClips(exerciseId, libraryId, hidden, prefs).map(({ label }) => label)
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
export async function loadVideosFor(
  exerciseId: string,
  libraryId?: string
): Promise<PlayableVideo[]> {
  const [hidden, prefs] = await Promise.all([loadHiddenVideoIds(), loadVideoPrefs()])
  const clips = bundledVideosFor(exerciseId, libraryId, hidden, prefs)
  const labels = videoLabelsFor(exerciseId, libraryId, hidden, prefs)

  /*
    החיפוש המקומי לפי מזהה הנכס ולא לפי exerciseId, וזה הכרחי מאז שתרגיל בתוכנית
    מושך גם את סרטוני המאגר: נכס מהמאגר נשמר תחת מזהה התרגיל במאגר, ושאילתה לפי
    מזהה התרגיל בתוכנית לא הייתה מוצאת אותו. התוצאה הייתה סרטון שכבר יושב במכשיר
    ובכל זאת נמשך מהרשת בכל פתיחה — ולא עובד אופליין.
    מזהה הנכס הוא הנתיב שלו, ולכן הוא ייחודי גלובלית ומתאים לחיפוש הזה.
  */
  const ids = clips.map((b) => bundledId(b.src))
  const cachedList = ids.length ? await mediaDb.videos.bulkGet(ids) : []
  const cachedById = new Map(
    cachedList.filter((v): v is VideoAsset => Boolean(v)).map((v) => [v.id, v])
  )

  const out: PlayableVideo[] = clips.map((b, i) => {
    const id = bundledId(b.src)
    const cached = cachedById.get(id)
    const label = labels[i] ?? `הדגמה ${i + 1}`
    if (cached) {
      return {
        id,
        label,
        url: URL.createObjectURL(cached.blob),
        posterUrl: cached.thumbnailBlob
          ? URL.createObjectURL(cached.thumbnailBlob)
          : assetUrl(b.poster),
        durationSec: cached.durationSec,
        sizeBytes: cached.sizeBytes,
        isLocal: true,
      }
    }
    return {
      id,
      label,
      url: assetUrl(b.src),
      posterUrl: assetUrl(b.poster),
      durationSec: b.durationSec,
      sizeBytes: b.sizeBytes,
      isLocal: false,
    }
  })

  /*
    הסרטונים שהמשתמש ייבא בעצמו, אחרי המצורפים.

    הבית של סרטון מיובא הוא ה-exerciseId שנשמר עליו, אבל ההעברה גוברת —
    לשני הכיוונים: מיובא שהועבר החוצה לא מופיע כאן, ומיובא שהועבר לכאן
    (או למדף הקבוצה הזה) מופיע גם אם נשמר תחת תרגיל אחר. הסריקה על כל
    המיובאים ולא בשאילתת אינדקס — מדובר בעשרות בודדות, לא באלפים.
  */
  const imported = await mediaDb.videos.where('origin').equals('imported').toArray()
  for (const v of imported) {
    const home = prefs.moves[v.id] ?? v.exerciseId
    if (home !== exerciseId || hidden.has(v.id)) continue
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

  // הסדר המותאם חל על הרשימה המלאה — מצורפים ומיובאים יחד, כפי שהיא מוצגת
  return applyOrder(out, (v) => v.id, prefs.order[exerciseId] ?? [])
}

/**
 * התמונה הממוזערת הראשונה של תרגיל, לתצוגה במסך האימון.
 *
 * "ראשון" כאן מכבד את הסדר המותאם: המשתמש שקבע איזה סרטון ראשון קבע בזה גם
 * את התמונה על הכרטיס — זו אותה החלטה בדיוק.
 */
export async function loadThumbnailFor(
  exerciseId: string,
  libraryId?: string
): Promise<string | null> {
  const [hidden, prefs] = await Promise.all([loadHiddenVideoIds(), loadVideoPrefs()])
  const bundled = bundledVideosFor(exerciseId, libraryId, hidden, prefs)
  if (bundled.length) {
    const cached = await mediaDb.videos.get(bundledId(bundled[0].src))
    if (cached?.thumbnailBlob) return URL.createObjectURL(cached.thumbnailBlob)
    return assetUrl(bundled[0].poster)
  }
  // תרגיל שכל ההדגמות שלו נמחקו לא חוזר להציג תמונה דרך הדלת האחורית
  const imported = await mediaDb.videos.where('origin').equals('imported').toArray()
  const own = imported.find(
    (v) => (prefs.moves[v.id] ?? v.exerciseId) === exerciseId && !hidden.has(v.id)
  )
  if (own?.thumbnailBlob) return URL.createObjectURL(own.thumbnailBlob)
  return null
}

/**
 * מוחק סרטון מהמכשיר ומסמן שלא להציג אותו שוב.
 *
 * שני הצדדים הכרחיים: מחיקת ה-Blob מפנה מקום, וההסתרה היא מה שמונע מסרטון
 * *מצורף* לחזור מהרשת בפתיחה הבאה או מההתקנה הבאה.
 */
export async function deleteVideo(id: string): Promise<void> {
  /*
    סרטון שהמשתמש ייבא בעצמו נמחק ונגמר: המזהה שלו אקראי, הוא לא קיים בשום
    מניפסט, ושום התקנה לא תיצור אותו מחדש. רישום שלו ברשימת המוסתרים היה
    מוסיף מזהה מת שאי אפשר לשחזר — ומסך הסרטונים היה מבטיח עליו החזרה שלא
    תקרה. רק נכס מצורף צריך זיכרון להחלטה.
  */
  if (!id.startsWith('bundled:')) {
    await mediaDb.videos.delete(id)
    // מזהה מיובא הוא אקראי ולא יחזור לעולם — העדפות שמצביעות עליו הן זבל
    await forgetVideoPrefs(id)
    notifyVideosChanged()
    return
  }
  await hideVideo(id, async (assetId) => {
    await mediaDb.videos.delete(assetId)
  })
}

/**
 * שומר למכשיר סרטון מצורף שנוגן מהרשת.
 *
 * מי שמעיין במאגר בלי ללחוץ "התקן את המאגר" מוריד את אותם בייטים בכל צפייה —
 * GitHub Pages מגיש עם cache-control של דקות. זו לא התקנה מאחורי הגב: יורדים
 * בדיוק מה שהמשתמש ממילא הוריד כדי לצפות, ורק מפסיקים לזרוק את זה. הספירות
 * במסך הסרטונים מתעדכנות מעצמן כי הן סופרות לפי origin.
 *
 * שקט לחלוטין בכישלון — זו אופטימיזציה, לא פעולה שהמשתמש ביקש.
 */
/** הורדות שכבר בדרך — דפדוף הלוך ושוב הפעיל fetch שני על אותם בייטים */
const streaming = new Set<string>()

/**
 * תקציב זמן להורדה ברקע.
 *
 * בלי זה בקשה שנתקעת (רשת של חדר כושר, captive portal) לא נפתרת ולא נדחית,
 * ה-finally לעולם לא רץ, והמזהה נשאר נעול עד רענון הדף — כלומר הנעילה שנועדה
 * למנוע הורדה כפולה הייתה חוסמת *כל* שמירה של הסרטון הזה, לתמיד ובשקט.
 */
const STREAM_TIMEOUT_MS = 60_000

export async function cacheStreamedVideo(assetId: string): Promise<void> {
  if (!assetId.startsWith('bundled:')) return
  if (streaming.has(assetId)) return
  const src = assetId.slice('bundled:'.length)
  streaming.add(assetId)
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), STREAM_TIMEOUT_MS)
  try {
    if (await mediaDb.videos.get(assetId)) return
    const hidden = await loadHiddenVideoIds()
    if (hidden.has(assetId)) return

    const fromLibrary = src.startsWith('videos/lib/')
    const manifest = fromLibrary ? LIBRARY_MANIFEST : VIDEO_MANIFEST
    let clip: BundledVideo | undefined
    let exerciseId = ''
    for (const [id, list] of Object.entries(manifest)) {
      const found = list.find((v) => v.src === src)
      if (found) {
        clip = found
        exerciseId = id
        break
      }
    }
    if (!clip) return

    const [videoRes, posterRes] = await Promise.all([
      fetch(assetUrl(clip.src), { signal: abort.signal }),
      fetch(assetUrl(clip.poster), { signal: abort.signal }).catch(() => null),
    ])
    if (!videoRes.ok) return
    const blob = await videoRes.blob()
    // מרוץ: ההתקנה המלאה או צפייה נוספת יכלו לכתוב בינתיים
    if (await mediaDb.videos.get(assetId)) return

    await mediaDb.videos.put({
      id: assetId,
      exerciseId,
      origin: fromLibrary ? 'library' : 'bundled',
      blob,
      thumbnailBlob: posterRes?.ok ? await posterRes.blob() : null,
      label: '',
      durationSec: clip.durationSec,
      sizeBytes: blob.size,
      width: clip.width,
      height: clip.height,
      createdAt: Date.now(),
    })
  } catch {
    // אין רשת, אין מקום, או שהבקשה בוטלה — הסרטון פשוט יישאר בהזרמה
  } finally {
    clearTimeout(timer)
    streaming.delete(assetId)
  }
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
