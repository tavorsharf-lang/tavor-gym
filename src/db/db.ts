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
