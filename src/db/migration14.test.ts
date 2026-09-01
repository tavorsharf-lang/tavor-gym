import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, getSettings } from '@/db/db'
import { DEFAULT_SETS, DEFAULT_SETTINGS, SEED_EXERCISES } from '@/db/seed'
import type { AppSettings, Exercise, SettingsRow } from '@/db/types'

/**
 * מיגרציה 14 — "סטים ברירת מחדל" נכנסת לשורת ההגדרות.
 *
 * ‏`mergeSettings` היה גורם לבדיקה דרך `getSettings` לעבור גם אילו המיגרציה
 * לא הייתה קיימת בכלל — הוא משלים כל שדה חסר בקריאה. לכן הטענה המרכזית כאן
 * נקראת ישירות מהטבלה: מה שנכתב לדיסק הוא מה שנכנס לגיבוי, וזה מה שמפריד
 * בין הגדרה שנשמרת לבין ברירת מחדל שנולדת מחדש בכל פתיחה.
 */

const V13_STORES = {
  exercises: 'id, muscleGroup, isActive, order, libraryId',
  routines: 'id, order',
  blocks: 'id, order',
  sessions: 'id, date, startedAt, routineId, *exerciseIds, *blockIds',
  setLogs: '++id, sessionId, exerciseId, [sessionId+exerciseId], [exerciseId+completedAt]',
  ratings: '++id, sessionId, exerciseId, [sessionId+exerciseId]',
  prs: '[exerciseId+kind], exerciseId',
  bodyWeights: '++id, &date',
  settings: '&key',
  activeWorkout: '&id',
}

/** ההגדרות כפי שהן שוכבות על מכשיר ותיק: בלי `defaultSets` */
function legacySettings(patch: Partial<AppSettings> = {}): AppSettings {
  const value = { ...DEFAULT_SETTINGS, ...patch } as Partial<AppSettings>
  delete value.defaultSets
  return value as AppSettings
}

async function seedV13(settings: AppSettings): Promise<void> {
  const old = new Dexie('tavor-gym')
  old.version(13).stores(V13_STORES)
  await old.open()
  await old.table<Exercise, string>('exercises').bulkPut(SEED_EXERCISES)
  await old.table<SettingsRow, string>('settings').put({ key: 'app', value: settings })
  old.close()
}

describe('מיגרציה 14 — סטים ברירת מחדל', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
  })

  it('משלימה את השדה החסר בשורת ההגדרות עצמה', async () => {
    await seedV13(legacySettings())

    await db.open()

    const row = await db.settings.get('app')
    expect(row?.value.defaultSets).toBe(DEFAULT_SETS)
    expect(await getSettings()).toMatchObject({ defaultSets: DEFAULT_SETS })
  })

  it('לא דורסת ערך שהמשתמש כבר בחר', async () => {
    await seedV13({ ...legacySettings(), defaultSets: 5 })

    await db.open()

    expect((await db.settings.get('app'))?.value.defaultSets).toBe(5)
  })

  it('לא נוגעת בשאר ההגדרות', async () => {
    await seedV13(legacySettings({ defaultRestSeconds: 75, askRir: false }))

    await db.open()

    const row = await db.settings.get('app')
    expect(row?.value.defaultRestSeconds).toBe(75)
    expect(row?.value.askRir).toBe(false)
  })

  it('מסד חדש נזרע עם הערך מלכתחילה', async () => {
    await db.open()

    expect((await db.settings.get('app'))?.value.defaultSets).toBe(DEFAULT_SETS)
  })
})
