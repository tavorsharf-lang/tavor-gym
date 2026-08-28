import { db, mergeSettings, saveSettings } from '@/db/db'
import { mediaDb } from '@/db/mediaDb'
import type {
  AppSettings,
  Block,
  BodyWeightEntry,
  Exercise,
  ExerciseRating,
  PersonalRecord,
  PlanItem,
  RepRange,
  Routine,
  Session,
  SetLog,
  VideoAsset,
} from '@/db/types'
import { withLibraryLink } from '@/db/libraryLinks'
import { withSecondaryMuscles } from '@/db/muscleTags'
import { mergeCalfShelves, withoutCalves } from '@/db/calfMerge'
import { withInclineBench, withV10Fields } from '@/db/catalogV10'
import { PLANK_RANGE } from '@/db/seed'
import { invalidateHiddenVideos } from '@/db/hiddenVideos'
import { invalidateHiddenExercises } from '@/db/hiddenExercises'
import { invalidateVideoPrefs } from '@/db/videoPrefs'
import { rebuildPrs } from '@/domain/prs'
import { toISODate } from '@/lib/dates'

/**
 * גיבוי ושחזור.
 *
 * שני קבצים נפרדים בכוונה: הנתונים הם JSON קטן שאפשר לשלוח בוואטסאפ, והמדיה
 * היא ZIP כבד שנשמר לקבצים. ייבוא נתונים לעולם לא נוגע במסד המדיה, כדי
 * ששחזור על מכשיר חדש לא ימחק סרטונים שכבר הותקנו.
 */

/**
 * גרסה 2 — סולם הדירוג עבר מ-3 דרגות ל-5 (מיגרציית מסד 7).
 *
 * זו לא תוספת שדה אלא שינוי *משמעות* של ערכים קיימים: דירוג 3 בקובץ ישן הוא
 * "קשה", ובסולם החדש 3 הוא "בינוני". בלי העלאת הגרסה אין שום דרך להבחין בין
 * קובץ ישן לחדש — הערכים 1–3 חוקיים בשניהם — וייבוא היה מזייף בשקט את כל
 * הדירוגים ואת המלצות המשקל שנשענות עליהם. קובץ עם schemaVersion 1 מובטח
 * שנוצא בסולם הישן, והייבוא מתרגם אותו (ראה importData).
 */
export const BACKUP_SCHEMA_VERSION = 2

const JSON_MIME = 'application/json'
const ZIP_MIME = 'application/zip'
const MANIFEST_NAME = 'manifest.json'

export interface BackupData {
  schemaVersion: number
  exportedAt: number
  app: 'tavor-gym'
  exercises: Exercise[]
  routines: Routine[]
  blocks: Block[]
  sessions: Session[]
  setLogs: SetLog[]
  ratings: ExerciseRating[]
  prs: PersonalRecord[]
  bodyWeights: BodyWeightEntry[]
  settings: AppSettings
}

/** 'tavor-gym-נתונים-2026-08-05.json' · 'tavor-gym-סרטונים-2026-08-05.zip' */
/**
 * מכמה ימים בלי גיבוי מזכירים.
 *
 * יושב כאן ולא במסך הגיבוי כי שני מסכים שואלים את אותה שאלה — הבית ומסך
 * הסיכום — ושני מספרים שונים היו אומרים למשתמש שני דברים סותרים.
 */
export const STALE_BACKUP_DAYS = 30

/** מעל זה הניסוח מוקשח: חצי שנה בלי גיבוי היא לא "כדאי", היא סיכון */
export const URGENT_BACKUP_DAYS = 90

export function backupFilename(now: number, kind: 'data' | 'media'): string {
  const label = kind === 'data' ? 'נתונים' : 'סרטונים'
  const ext = kind === 'data' ? 'json' : 'zip'
  return `tavor-gym-${label}-${toISODate(now)}.${ext}`
}

// ─── ייצוא נתונים ──────────────────────────────────────────────────────────

export async function exportData(): Promise<Blob> {
  const [exercises, routines, blocks, sessions, setLogs, ratings, prs, bodyWeights, settingsRow] =
    await Promise.all([
      db.exercises.toArray(),
      db.routines.toArray(),
      db.blocks.toArray(),
      db.sessions.toArray(),
      db.setLogs.toArray(),
      db.ratings.toArray(),
      db.prs.toArray(),
      db.bodyWeights.toArray(),
      db.settings.get('app'),
    ])

  const payload: BackupData = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: Date.now(),
    app: 'tavor-gym',
    exercises,
    routines,
    blocks,
    sessions,
    setLogs,
    ratings,
    prs,
    bodyWeights,
    settings: mergeSettings(settingsRow?.value),
  }
  return new Blob([JSON.stringify(payload)], { type: JSON_MIME })
}

// ─── ייבוא נתונים ──────────────────────────────────────────────────────────

/** התוויות שמופיעות בהודעת שגיאה ובסיכום הייבוא — ולכן בעברית */
const TABLE_LABELS = {
  exercises: 'תרגילים',
  routines: 'תוכניות',
  blocks: 'בלוקים',
  sessions: 'אימונים',
  setLogs: 'סטים',
  ratings: 'דירוגים',
  prs: 'שיאים',
  bodyWeights: 'שקילות',
} as const

type TableKey = keyof typeof TABLE_LABELS

export type ImportResult =
  | { ok: true; counts: Record<string, number> }
  | { ok: false; error: string }

/**
 * מחליף את *כל* הנתונים בתוכן הגיבוי.
 *
 * השיאים שבקובץ נטענים כנקודת פתיחה אבל מיד נדרסים בחישוב מחדש מהסטים —
 * גיבוי ישן יכול להכיל שיא שכבר לא נכון, והסטים הם מקור האמת היחיד.
 * מסד המדיה לא נוגע כאן בכוונה.
 */
export async function importData(file: File | Blob): Promise<ImportResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    return { ok: false, error: 'הקובץ אינו JSON תקין' }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'הקובץ אינו גיבוי תקין' }
  }
  const data = parsed as Partial<BackupData>
  if (data.app !== 'tavor-gym') {
    return { ok: false, error: 'הקובץ אינו גיבוי של אימוני כושר' }
  }
  /*
    גיבוי מפורמט עתידי לא נכנס. התרחיש אמיתי: התקנה מחדש שבה ה-Service Worker
    מגיש גרסה ישנה, ואז ייבוא של קובץ שנוצר בגרסה חדשה היה דורס את המסד בנתונים
    שהאפליקציה לא יודעת לקרוא נכון — בלי שום הודעה.
  */
  if (typeof data.schemaVersion === 'number' && data.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'הגיבוי נוצר בגרסה חדשה יותר של האפליקציה — עדכן אותה קודם',
    }
  }
  for (const key of Object.keys(TABLE_LABELS) as TableKey[]) {
    if (!Array.isArray(data[key])) {
      return { ok: false, error: `הגיבוי פגום — חסר החלק "${TABLE_LABELS[key]}"` }
    }
  }

  /*
    גיבוי שנוצר לפני גרסה 4 לא מכיר את הקישור למאגר. בלי השתילה כאן, שחזור
    היה מוחק את הקישורים במקום להשאיר אותם כמו שהיו לפני הייבוא.

    ‏`withoutCalves` באותו רצף ומאותה סיבה, רק חמור יותר: גיבוי מלפני גרסה 9
    מחזיק תרגילים עם `muscleGroup: 'calves'` — קבוצה שכבר אין לה תווית. בלי
    ההמרה כאן שחזור היה מחזיר אותם למסד, וכל מסך שקורא
    `MUSCLE_GROUPS[e.muscleGroup].label` היה קורס עליהם.
  */
  const exercises = withInclineBench(
    (data.exercises ?? [])
      .map(withLibraryLink)
      .map(withTimedMetric)
      .map(withSecondaryMuscles)
      .map(withoutCalves)
      .map(withV10Fields)
  )
  /*
    רק פריטי התוכנית של תרגילים שהגיעו מהקובץ *בלי* metric מתוקנים.

    בלי התנאי הזה כל ייבוא היה כותב את היעד המקורי לכל פריט פלאנק — כלומר
    שחזור של גיבוי עדכני היה מוחק יעד שהמשתמש קבע בעצמו בעורך התוכניות
    (75 במקום 90), ומשאיר את הקטלוג והתוכנית סותרים זה את זה. תיקון-קדימה
    אמור לגעת רק במה שבאמת ישן.
  */
  const legacyTimed = new Set(
    (data.exercises ?? []).filter((e) => TIMED_SEED[e.id] && !e.metric).map((e) => e.id)
  )
  /*
    ‏`kind` נשתל בכל תוכנית שמגיעה בלי השדה.

    אותה סיבה בדיוק כמו ב-`withLibraryLink`: מיגרציה 8 לא תרוץ שוב על מסד
    שכבר בגרסה 8, ולכן שחזור גיבוי שנוצר לפניה היה מחזיר את חמש התוכניות
    הקבועות בלי `kind` — ואז הן נעלמות משני הצדדים (לא "קבועות" ולא "שמורות")
    ומתג התוכניות מפסיק לעבוד בשקט. אימון שמור בגיבוי כבר נושא 'custom'.
  */
  const routines = (data.routines ?? [])
    .map((r) => withTimedPlanItems(r, legacyTimed))
    .map((r) => (r.kind === 'custom' ? r : { ...r, kind: 'program' as const }))
  const blocks = (data.blocks ?? []).map((b) => withTimedPlanItems(b, legacyTimed))
  /*
    סטים בלי סשן לא נכנסים.

    גיבוי שנוצר באמצע אימון פתוח מכיל את הסטים שלו — הם נכתבים ל-setLogs מיד —
    אבל לא את שורת ה-session שלהם, שנכתבת רק ב-finish. בשחזור הם היו הופכים
    ליתומים קבועים: נספרים ב"משקל אחרון", בגרפים ובבניית השיאים, אבל בלתי
    נראים בהיסטוריה ולכן בלתי ניתנים למחיקה. הסינון כאן מנקה בדרך אגב גם
    יתומים שכבר יושבים בגיבויים ישנים.
  */
  let rebuiltPrCount = 0
  const sessionIds = new Set((data.sessions ?? []).map((s) => s.id))
  const setLogs = (data.setLogs ?? []).filter((s) => sessionIds.has(s.sessionId))

  /*
    דירוגים מקובץ ישן עולים לאמצע הסולם החדש — אותה המרה כמו מיגרציה 7.

    קובץ schemaVersion 1 נוצא כשהסולם היה 1–3, והערכים חוקיים גם בסולם 1–5 —
    ולכן בלי ההמרה "קשה" ישן (3) היה נקרא "בינוני", ומנוע ההמלצות היה מעלה
    משקל אחרי אימון שדורג קשה. שדה חסר נחשב 1: כל קובץ לפני הגרסה הזו ישן.
  */
  const ratings =
    (data.schemaVersion ?? 1) < 2
      ? (data.ratings ?? []).map((r) =>
          r.rating <= 3 ? { ...r, rating: (r.rating + 1) as ExerciseRating['rating'] } : r
        )
      : (data.ratings ?? [])

  try {
    await db.transaction(
      'rw',
      [
        db.exercises,
        db.routines,
        db.blocks,
        db.sessions,
        db.setLogs,
        db.ratings,
        db.prs,
        db.bodyWeights,
        db.settings,
        db.activeWorkout,
      ],
      async () => {
        await Promise.all([
          db.exercises.clear(),
          db.routines.clear(),
          db.blocks.clear(),
          db.sessions.clear(),
          db.setLogs.clear(),
          db.ratings.clear(),
          db.prs.clear(),
          db.bodyWeights.clear(),
          // אימון פעיל מצביע על סשן שכבר לא קיים אחרי החלפת הנתונים
          db.activeWorkout.clear(),
        ])
        await db.exercises.bulkPut(exercises)
        await db.routines.bulkPut(routines)
        await db.blocks.bulkPut(blocks)
        await db.sessions.bulkPut(data.sessions ?? [])
        await db.setLogs.bulkPut(setLogs)
        await db.ratings.bulkPut(ratings)
        await db.bodyWeights.bulkPut(data.bodyWeights ?? [])
        // אותו תיקון-קדימה כמו בתרגילים: מדף `group:calves` בגיבוי ישן מתמזג
        // לתוך מדף הרגליים, אחרת סרטון ששויך אליו חוזר למסד ולא מוצג בשום מקום
        await db.settings.put({
          key: 'app',
          value: mergeCalfShelves(mergeSettings(data.settings)),
        })
        /*
          השיאים נבנים מהסטים ולא נכתבים מהקובץ.

          כתיבה של data.prs לפני החישוב נראתה זהירה, אבל הדריסה עובדת לפי
          [exerciseId+kind]: שיא בקובץ שה-rebuild לא מייצר לו מקבילה — תרגיל
          שהסטים שלו לא בגיבוי, או קובץ ערוך — היה שורד כשיא רפאים שמדכא קונפטי
          של שיאים אמיתיים. הסטים הם מקור האמת היחיד, וזה מה שהופך את זה לאמת.
        */
        const rebuilt = rebuildPrs(exercises, setLogs)
        rebuiltPrCount = rebuilt.length
        await db.prs.bulkPut(rebuilt)
      }
    )
  } catch (err) {
    return { ok: false, error: `הייבוא נכשל — ${errorText(err)}` }
  }

  // ההגדרות הוחלפו, ואיתן רשימת הסרטונים שנמחקו והעדפות הסדר — המטמונים שבזיכרון כבר לא נכונים
  invalidateHiddenVideos()
  invalidateHiddenExercises()
  invalidateVideoPrefs()

  /*
    הסיכום מדווח על מה שנכתב למסד, לא על מה שהיה בקובץ. שני החלקים נחתכו בדרך:
    סטים בלי סשן סוננו, והשיאים נבנו מחדש מהסטים במקום להיכתב מהקובץ. דיווח
    לפי הקובץ היה מבטיח מספרים שלא קיימים במסד.
  */
  const written: Partial<Record<TableKey, number>> = {
    exercises: exercises.length,
    routines: routines.length,
    blocks: blocks.length,
    setLogs: setLogs.length,
    prs: rebuiltPrCount,
  }
  const counts: Record<string, number> = {}
  for (const key of Object.keys(TABLE_LABELS) as TableKey[]) {
    counts[TABLE_LABELS[key]] = written[key] ?? (data[key] as unknown[]).length
  }
  return { ok: true, counts }
}

/**
 * תרגילים שנמדדים בזמן, ומה היעד שלהם.
 *
 * גיבוי שנוצר לפני גרסה 5 מחזיק את הפלאנק כטווח *חזרות* ובלי `metric`. בלי
 * התיקון כאן, שחזור שלו במכשיר מעודכן היה מחזיר אותו למצב הישן לצמיתות —
 * גרסת ה-Dexie כבר 5, ולכן המיגרציה שמתקנת את זה לא תרוץ שוב לעולם. זה בדיוק
 * הדפוס של `withLibraryLink` שכבר קיים כאן, רק לגרסה הבאה.
 */
const TIMED_SEED: Record<string, RepRange> = { abs: PLANK_RANGE }

function withTimedMetric(exercise: Exercise): Exercise {
  const range = TIMED_SEED[exercise.id]
  if (!range || exercise.metric) return exercise
  return { ...exercise, metric: 'seconds', targetReps: { ...range } }
}

function withTimedPlanItems<T extends { items: PlanItem[] }>(
  plan: T,
  legacyIds: ReadonlySet<string>
): T {
  if (legacyIds.size === 0 || !plan.items?.some((it) => legacyIds.has(it.exerciseId))) return plan
  return {
    ...plan,
    items: plan.items.map((it) =>
      legacyIds.has(it.exerciseId) ? { ...it, targetReps: { ...TIMED_SEED[it.exerciseId] } } : it
    ),
  }
}

/**
 * ה-origin של נכס שמיובא מגיבוי.
 *
 * שלושת הערכים חוקיים ומשמעותיים, ו-'library' הוא הקריטי: המונים במסך
 * הסרטונים, כפתור "התקן את המאגר" וכפתור המחיקה כולם מסננים לפיו. שיטוח שלו
 * ל-'imported' הותיר מאות מגה-בייט במסד שהמסך מדווח עליהם "מותקנים 0",
 * שההתקנה מדלגת עליהם, ושאין להם שום מסלול מחיקה ב-UI.
 *
 * המזהה גובר על המניפסט כשהוא חד-משמעי — הוא הנתיב של הנכס, ולכן הוא נכון גם
 * בגיבוי שנוצר לפני ש-'library' היה קיים.
 */
function importedOrigin(v: { id: string; origin?: string }): VideoAsset['origin'] {
  if (v.id.startsWith('bundled:videos/lib/')) return 'library'
  if (v.id.startsWith('bundled:')) return 'bundled'
  if (v.origin === 'bundled' || v.origin === 'library' || v.origin === 'imported') return v.origin
  return 'imported'
}

function errorText(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'שגיאה לא צפויה'
}

// ─── ייצוא מדיה ────────────────────────────────────────────────────────────

interface MediaManifestEntry {
  id: string
  exerciseId: string
  origin: VideoAsset['origin']
  label: string
  durationSec: number
  sizeBytes: number
  width: number
  height: number
  hasThumbnail: boolean
  /** שם הקובץ בתוך ה-ZIP — כדי שהייבוא לא יצטרך לשחזר את ניקוי המזהה */
  file: string
  thumb: string | null
}

interface MediaManifest {
  app: 'tavor-gym'
  schemaVersion: number
  exportedAt: number
  videos: MediaManifestEntry[]
}

/** מזהים כמו 'bundled:videos/x.mp4' הופכים לשם קובץ חוקי בכל מערכת קבצים */
function safeName(id: string): string {
  const clean = id
    .replace(/\.(mp4|mov|m4v)$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
  return clean || 'video'
}

/**
 * ZIP ללא דחיסה (client-zip לא דוחס בכלל) — וידאו כבר דחוס, וקידוד מחדש היה
 * רק שורף סוללה. הייבוא מסתמך על כך שכל הרשומות שמורות STORED.
 */
export async function exportMedia(
  onProgress?: (done: number, total: number) => void
): Promise<Blob> {
  const { downloadZip } = await import('client-zip')
  const assets = await mediaDb.videos.toArray()
  const total = assets.length
  onProgress?.(0, total)

  const used = new Set<string>()
  const entries: MediaManifestEntry[] = assets.map((a) => {
    let base = safeName(a.id)
    while (used.has(base)) base = `${base}_1`
    used.add(base)
    return {
      id: a.id,
      exerciseId: a.exerciseId,
      origin: a.origin,
      label: a.label,
      durationSec: a.durationSec,
      sizeBytes: a.sizeBytes,
      width: a.width,
      height: a.height,
      hasThumbnail: a.thumbnailBlob !== null,
      file: `${base}.mp4`,
      thumb: a.thumbnailBlob ? `${base}.jpg` : null,
    }
  })

  const manifest: MediaManifest = {
    app: 'tavor-gym',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: Date.now(),
    videos: entries,
  }

  async function* files() {
    yield { name: MANIFEST_NAME, input: JSON.stringify(manifest, null, 2), lastModified: new Date() }
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i]
      const meta = entries[i]
      const at = new Date(asset.createdAt)
      yield { name: meta.file, input: asset.blob, lastModified: at }
      if (asset.thumbnailBlob && meta.thumb) {
        yield { name: meta.thumb, input: asset.thumbnailBlob, lastModified: at }
      }
      onProgress?.(i + 1, total)
    }
  }

  const blob = await downloadZip(files()).blob()
  return blob.type === ZIP_MIME ? blob : new Blob([blob], { type: ZIP_MIME })
}

// ─── קריאת ZIP ─────────────────────────────────────────────────────────────

const SIG_LOCAL = 0x04034b50
const SIG_CENTRAL = 0x02014b50
const SIG_EOCD = 0x06054b50
const SIG_EOCD64 = 0x06064b50
const SIG_EOCD64_LOCATOR = 0x07064b50
const U32_MAX = 0xffffffff

async function viewOf(blob: Blob, start: number, end: number): Promise<DataView> {
  return new DataView(await blob.slice(start, end).arrayBuffer())
}

function mimeFor(name: string): string {
  if (name.endsWith('.mp4')) return 'video/mp4'
  if (name.endsWith('.jpg')) return 'image/jpeg'
  if (name.endsWith('.json')) return JSON_MIME
  return 'application/octet-stream'
}

/**
 * קורא ZIP של רשומות STORED בלבד, ישירות מה-Blob.
 *
 * למה ידנית ולא ספרייה: אין דחיסה בקבצים שאנחנו מייצרים, אז כל מה שצריך זה
 * לקרוא את הספרייה המרכזית ולחתוך Blob-ים לפי היסט — בלי לטעון גיגה-בייט
 * של וידאו לזיכרון ובלי תלות נוספת בחבילה.
 */
async function readStoredZip(file: Blob): Promise<Map<string, Blob>> {
  const tailLength = Math.min(file.size, 0xffff + 22)
  if (tailLength < 22) throw new Error('הקובץ אינו ZIP')
  const tailStart = file.size - tailLength
  const tail = await viewOf(file, tailStart, file.size)

  let eocd = -1
  for (let i = tailLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === SIG_EOCD) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('הקובץ אינו ZIP')

  let count = tail.getUint16(eocd + 10, true)
  let cdSize = tail.getUint32(eocd + 12, true)
  let cdOffset = tail.getUint32(eocd + 16, true)

  // ארכיון ענק — הנתונים האמיתיים יושבים ברשומת ZIP64 שלפני הסוף
  if (count === 0xffff || cdSize === U32_MAX || cdOffset === U32_MAX) {
    const locator = eocd - 20
    if (locator < 0 || tail.getUint32(locator, true) !== SIG_EOCD64_LOCATOR) {
      throw new Error('הארכיון פגום')
    }
    const at = Number(tail.getBigUint64(locator + 8, true))
    const z = await viewOf(file, at, at + 56)
    if (z.getUint32(0, true) !== SIG_EOCD64) throw new Error('הארכיון פגום')
    count = Number(z.getBigUint64(32, true))
    cdSize = Number(z.getBigUint64(40, true))
    cdOffset = Number(z.getBigUint64(48, true))
  }

  const cd = await viewOf(file, cdOffset, cdOffset + cdSize)
  const names = new TextDecoder('utf-8')
  const found = new Map<string, Blob>()
  let p = 0

  for (let i = 0; i < count && p + 46 <= cd.byteLength; i++) {
    if (cd.getUint32(p, true) !== SIG_CENTRAL) throw new Error('הארכיון פגום')
    const method = cd.getUint16(p + 10, true)
    const uncompressed = cd.getUint32(p + 24, true)
    const nameLength = cd.getUint16(p + 28, true)
    const extraLength = cd.getUint16(p + 30, true)
    const commentLength = cd.getUint16(p + 32, true)
    let size = cd.getUint32(p + 20, true)
    let localOffset = cd.getUint32(p + 42, true)
    const name = names.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLength))

    if (size === U32_MAX || localOffset === U32_MAX) {
      let e = p + 46 + nameLength
      const extraEnd = e + extraLength
      while (e + 4 <= extraEnd) {
        const fieldId = cd.getUint16(e, true)
        const fieldLength = cd.getUint16(e + 2, true)
        if (fieldId === 1) {
          // הסדר בתקן קבוע: גודל מקורי, גודל דחוס, היסט
          let f = e + 4
          if (uncompressed === U32_MAX) f += 8
          if (size === U32_MAX) {
            size = Number(cd.getBigUint64(f, true))
            f += 8
          }
          if (localOffset === U32_MAX) localOffset = Number(cd.getBigUint64(f, true))
          break
        }
        e += 4 + fieldLength
      }
    }

    if (method !== 0) throw new Error('הארכיון דחוס ולא נתמך')

    const local = await viewOf(file, localOffset, localOffset + 30)
    if (local.getUint32(0, true) !== SIG_LOCAL) throw new Error('הארכיון פגום')
    const dataStart = localOffset + 30 + local.getUint16(26, true) + local.getUint16(28, true)
    found.set(name, file.slice(dataStart, dataStart + size, mimeFor(name)))

    p += 46 + nameLength + extraLength + commentLength
  }

  return found
}

// ─── ייבוא מדיה ────────────────────────────────────────────────────────────

export type MediaImportResult = { ok: true; count: number } | { ok: false; error: string }

/** מה שקראנו מקובץ חיצוני — רק שלושת השדות ההכרחיים מובטחים */
type ParsedEntry = Partial<MediaManifestEntry> &
  Pick<MediaManifestEntry, 'id' | 'exerciseId' | 'file'>

function isManifestEntry(v: unknown): v is ParsedEntry {
  if (typeof v !== 'object' || v === null) return false
  const e = v as Partial<MediaManifestEntry>
  return typeof e.id === 'string' && typeof e.exerciseId === 'string' && typeof e.file === 'string'
}

export async function importMedia(
  file: File | Blob,
  onProgress?: (done: number, total: number) => void
): Promise<MediaImportResult> {
  let entries: Map<string, Blob>
  try {
    entries = await readStoredZip(file)
  } catch (err) {
    return { ok: false, error: errorText(err) }
  }

  const manifestBlob = entries.get(MANIFEST_NAME)
  if (!manifestBlob) return { ok: false, error: 'הקובץ אינו גיבוי סרטונים של אימוני כושר' }

  let manifest: { app?: unknown; videos?: unknown; schemaVersion?: unknown }
  try {
    manifest = JSON.parse(await manifestBlob.text()) as {
      app?: unknown
      videos?: unknown
      schemaVersion?: unknown
    }
  } catch {
    return { ok: false, error: 'רשימת הסרטונים בארכיון פגומה' }
  }
  if (manifest.app !== 'tavor-gym' || !Array.isArray(manifest.videos)) {
    return { ok: false, error: 'הקובץ אינו גיבוי סרטונים של אימוני כושר' }
  }

  if (
    typeof manifest.schemaVersion === 'number' &&
    manifest.schemaVersion > BACKUP_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      error: 'גיבוי הסרטונים נוצר בגרסה חדשה יותר של האפליקציה — עדכן אותה קודם',
    }
  }

  const videos = (manifest.videos as unknown[]).filter(isManifestEntry)
  const total = videos.length
  onProgress?.(0, total)

  try {
    let done = 0
    for (const v of videos) {
      const blob = entries.get(v.file)
      if (blob) {
        const thumbnailBlob = v.thumb ? (entries.get(v.thumb) ?? null) : null
        const asset: VideoAsset = {
          id: v.id,
          exerciseId: v.exerciseId,
          origin: importedOrigin(v),
          blob,
          thumbnailBlob,
          label: v.label ?? '',
          durationSec: v.durationSec ?? 0,
          // גודל אמיתי מהארכיון — המספר ב-manifest הוא רק תיעוד
          sizeBytes: blob.size,
          width: v.width ?? 0,
          height: v.height ?? 0,
          createdAt: Date.now(),
        }
        await mediaDb.videos.put(asset)
        done += 1
      }
      onProgress?.(done, total)
    }
    return { ok: true, count: done }
  } catch (err) {
    return { ok: false, error: `ייבוא הסרטונים נכשל — ${errorText(err)}` }
  }
}

// ─── שמירה למכשיר ──────────────────────────────────────────────────────────

/**
 * ביטול של גיליון השיתוף מגיע כ-AbortError — בספארי כ-DOMException, ובחלק
 * מהמנועים כ-Error רגיל. שתי הצורות הן אותו דבר: המשתמש סגר את הגיליון.
 */
function isAbortError(err: unknown): boolean {
  return (err instanceof DOMException || err instanceof Error) && err.name === 'AbortError'
}

/**
 * ב-iOS במצב standalone הורדה דרך <a download> נעלמת בלי עקבות, ולכן קודם
 * מנסים את גיליון השיתוף — משם אפשר לשמור ל"קבצים" או לשלוח לעצמך.
 *
 * שלוש תוצאות, והקורא חייב להבדיל ביניהן:
 * 'shared'     — הקובץ נמסר לגיליון השיתוף.
 * 'downloaded' — נשמר דרך עוגן ההורדה. גם כישלון שיתוף שאינו ביטול נופל לכאן.
 * 'cancelled'  — המשתמש סגר את הגיליון. אין קובץ בשום מקום, ולכן אסור לרשום
 *                שגובה — אבל גם אין טעם להוריד מאחורי גבו.
 */
/**
 * ייצוא הנתונים ושמירתם, כולל סימון תאריך הגיבוי — הזרימה השלמה במקום אחד.
 *
 * מיוצא כי יש לה שני מקורות: מסך הגיבוי, ומסך הסיכום שמציע לגבות מיד אחרי
 * אימון. שכפול שלה היה מסתיים בכך שאחד משני המסלולים שוכח לסמן את התאריך —
 * ואז האזהרה בבית מופיעה על גיבוי שכן נעשה, או נעלמת על גיבוי שלא.
 *
 * מחזיר 'cancelled' כשהמשתמש סגר את גיליון השיתוף: אין קובץ בשום מקום, ולכן
 * גם אין מה לסמן.
 */
export async function backupNow(): Promise<'downloaded' | 'shared' | 'cancelled'> {
  const blob = await exportData()
  const how = await saveBlob(blob, backupFilename(Date.now(), 'data'))
  if (how === 'cancelled') return 'cancelled'
  await saveSettings({ lastBackupAt: Date.now() })
  return how
}

export async function saveBlob(
  blob: Blob,
  filename: string
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: blob.type })
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return 'shared'
    } catch (err) {
      if (isAbortError(err)) return 'cancelled'
      // כל שגיאה אחרת — נופלים לעוגן
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // שחרור מיידי מדי מבטל את ההורדה בחלק מהדפדפנים
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
