import Dexie, { type Table } from 'dexie'
import type {
  ActiveWorkout,
  AppSettings,
  BodyWeightEntry,
  Block,
  Exercise,
  ExerciseRating,
  PersonalRecord,
  Routine,
  Session,
  SetLog,
  SettingsRow,
} from './types'
import { DEFAULT_SETTINGS, SEED_BLOCKS, SEED_EXERCISES, SEED_ROUTINES } from './seed'
import { applyCatalogFix } from './catalogFix'
import { withLibraryLink } from './libraryLinks'

/**
 * מסד הנתונים המובנה.
 *
 * הסרטונים יושבים ב-DB נפרד (mediaDb.ts) בכוונה: כתיבה של Blob של כמה
 * מגה-בייט לא מעירה שום liveQuery כאן, ייצוא נתונים לא גורר וידאו בזיכרון,
 * ומיגרציית סכמה לא נוגעת במדיה.
 */
class GymDatabase extends Dexie {
  exercises!: Table<Exercise, string>
  routines!: Table<Routine, string>
  blocks!: Table<Block, string>
  sessions!: Table<Session, string>
  setLogs!: Table<SetLog, number>
  ratings!: Table<ExerciseRating, number>
  prs!: Table<PersonalRecord, [string, string]>
  bodyWeights!: Table<BodyWeightEntry, number>
  settings!: Table<SettingsRow, string>
  activeWorkout!: Table<ActiveWorkout, string>

  constructor() {
    super('tavor-gym')

    this.version(1).stores({
      exercises: 'id, muscleGroup, isActive, order',
      routines: 'id, order',
      blocks: 'id, order',
      // המערכים עם * הם multiEntry — הם מה שמאפשר סינון היסטוריה לפי
      // תרגיל או בלוק בלי לסרוק את כל הסטים.
      sessions: 'id, date, startedAt, routineId, *exerciseIds, *blockIds',
      setLogs: '++id, sessionId, exerciseId, [sessionId+exerciseId], [exerciseId+completedAt]',
      ratings: '++id, sessionId, exerciseId, [sessionId+exerciseId]',
      prs: '[exerciseId+kind], exerciseId',
      bodyWeights: '++id, &date',
      settings: '&key',
      activeWorkout: '&id',
    })

    /**
     * גרסה 2 — תוכניות פול-באדי לחזרה הדרגתית.
     *
     * מוסיפה שתי תוכניות חדשות, ומכבה את הפיצול A/B/C. זו החלטה מכוונת ולא
     * מחיקה: התוכניות נשארות במסד על כל ההיסטוריה שלהן, ומסך התוכניות מחזיר
     * אותן בלחיצה אחת. תוכנית כבויה לא מוצעת במסך הבית ולא מופיעה בבחירה,
     * כדי ששתי שיטות אימון שונות לא יתערבבו בהצעה של "מה מתאמנים היום".
     */
    this.version(2)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table<Routine, string>('routines')
        const existing = await table.toArray()

        for (const routine of existing) {
          await table.put({
            ...routine,
            isActive: false,
            suggestBlocks: routine.suggestBlocks ?? true,
            order: routine.order + 2,
            items: routine.items.map((it) => ({ ...it, startWeightKg: it.startWeightKg ?? null })),
          })
        }
        for (const fresh of SEED_ROUTINES) {
          if (fresh.id === 'F1' || fresh.id === 'F2') await table.put(fresh)
        }

        // הבלוקים לא משתנים, רק מקבלים את השדה החדש
        const blocks = tx.table<Block, string>('blocks')
        for (const block of await blocks.toArray()) {
          await blocks.put({
            ...block,
            items: block.items.map((it) => ({ ...it, startWeightKg: it.startWeightKg ?? null })),
          })
        }
      })

    /**
     * גרסה 3 — שמות התרגילים המתוקנים.
     *
     * הזריעה מרימה קטלוג רק בהתקנה ראשונה, ולכן שינוי ב-seed.ts לבדו לא היה
     * מגיע למכשיר שכבר מותקן. כאן זה מגיע — אבל רק לתרגילים שהמשתמש לא ערך
     * בעצמו, לפי השם הישן (`was`). המזהים לא נגעים: הם המפתח לכל ההיסטוריה,
     * לשיאים ולסרטונים.
     */
    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table<Exercise, string>('exercises')
        for (const exercise of await table.toArray()) {
          const fixed = applyCatalogFix(exercise)
          if (fixed) await table.put(fixed)
        }
      })

    /**
     * גרסה 4 — הקישור למאגר הלימודי עובר להיות נתון.
     *
     * עד כאן הקישור בין תרגיל בקטלוג לתרגיל במאגר חי רק ב-LIBRARY_LINKS,
     * טבלה בקוד שמישהו צריך לערוך. משם והלאה הוא שדה על התרגיל: כך אפשר
     * לאחד את שני הקטלוגים למסך אחד, וכך הוספת תרגיל מהמאגר לקטלוג יוצרת את
     * הקישור בעצמה במקום לדרוש שינוי קוד.
     *
     * המיגרציה שותלת את 12 הקישורים הקיימים ולא נוגעת ברשומה שכבר נושאת
     * קישור. libraryId נכנס גם לאינדקס — הוא מפתח חיפוש: מסך התרגיל המאוחד
     * מגיע ממזהה מאגר וצריך למצוא ממנו את התרגיל הקנוני.
     */
    this.version(4)
      .stores({ exercises: 'id, muscleGroup, isActive, order, libraryId' })
      .upgrade(async (tx) => {
        const table = tx.table<Exercise, string>('exercises')
        for (const exercise of await table.toArray()) {
          const linked = withLibraryLink(exercise)
          if (linked !== exercise) await table.put(linked)
        }
      })

    // רץ פעם אחת בלבד, בפתיחה הראשונה של המסד
    this.on('populate', async () => {
      await this.exercises.bulkAdd(SEED_EXERCISES)
      await this.routines.bulkAdd(SEED_ROUTINES)
      await this.blocks.bulkAdd(SEED_BLOCKS)
      await this.settings.add({ key: 'app', value: DEFAULT_SETTINGS })
    })
  }
}

export const db = new GymDatabase()

// ─── הגדרות ────────────────────────────────────────────────────────────────

/**
 * קורא הגדרות ומשלים שדות חסרים מברירות המחדל. זה מה שמאפשר להוסיף הגדרה
 * חדשה בלי מיגרציה — משתמש ותיק פשוט מקבל את ברירת המחדל שלה.
 */
export async function getSettings(): Promise<AppSettings> {
  const row = await db.settings.get('app')
  return mergeSettings(row?.value)
}

export function mergeSettings(stored: Partial<AppSettings> | undefined): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(stored ?? {}),
    plates: { ...DEFAULT_SETTINGS.plates, ...(stored?.plates ?? {}) },
  }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = mergeSettings({ ...(await getSettings()), ...patch })
  await db.settings.put({ key: 'app', value: next })
  return next
}

/** מבטיח שהמסד נפתח והזריעה הושלמה */
export async function ensureReady(): Promise<void> {
  if (!db.isOpen()) await db.open()
  // ביטוח: אם הזריעה נכשלה באמצע בעבר, משלימים כאן
  if ((await db.exercises.count()) === 0) {
    await db.transaction('rw', db.exercises, db.routines, db.blocks, db.settings, async () => {
      await db.exercises.bulkPut(SEED_EXERCISES)
      await db.routines.bulkPut(SEED_ROUTINES)
      await db.blocks.bulkPut(SEED_BLOCKS)
      if (!(await db.settings.get('app'))) {
        await db.settings.put({ key: 'app', value: DEFAULT_SETTINGS })
      }
    })
  }
}

/** מוחק הכל ומחזיר לזריעה. משמש בייבוא גיבוי ובאיפוס יזום. */
export async function resetDatabase(): Promise<void> {
  await db.delete()
  await db.open()
  await ensureReady()
}
