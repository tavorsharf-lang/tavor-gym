import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { INCLINE_HAMMER_CURL_ID, db } from '@/db/db'
import { SEED_EXERCISES } from '@/db/seed'
import { LIBRARY_CATALOG } from '@/db/libraryManifest'
import type { Exercise, SettingsRow } from '@/db/types'
import { DEFAULT_SETTINGS } from '@/db/seed'

/**
 * מיגרציה 15 — "כפיפת פטיש בשיפוע" נכנסת לקטלוג של מכשיר קיים.
 *
 * הזריעה מכסה התקנה חדשה בלבד, ולכן בלי המיגרציה התרגיל היה קיים בקוד ולא
 * אצל מי שכבר מתאמן. מה שנבדק כאן הוא בדיוק מה שיישבר בשקט: שהשורה נוספת,
 * שהיא נושאת את הקישור למאגר (ומשם היא מקבלת את הסרטון), ושהיא לא נוספת
 * פעמיים למי שכבר עבר את המיגרציה.
 */

const V14_STORES = {
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

/** הקטלוג כפי שהוא שוכב על מכשיר ותיק: בלי הרשומה החדשה */
function legacyExercises(): Exercise[] {
  return SEED_EXERCISES.filter((e) => e.id !== INCLINE_HAMMER_CURL_ID)
}

async function seedV14(exercises: Exercise[]): Promise<void> {
  const old = new Dexie('tavor-gym')
  old.version(14).stores(V14_STORES)
  await old.open()
  await old.table<Exercise, string>('exercises').bulkPut(exercises)
  await old.table<SettingsRow, string>('settings').put({ key: 'app', value: DEFAULT_SETTINGS })
  old.close()
}

describe('מיגרציה 15 — כפיפת פטיש בשיפוע', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
  })

  it('מוסיפה את התרגיל לקטלוג קיים, עם הקישור למאגר', async () => {
    const before = legacyExercises()
    await seedV14(before)

    await db.open()

    const added = await db.exercises.get(INCLINE_HAMMER_CURL_ID)
    expect(added).toBeTruthy()
    expect(added?.muscleGroup).toBe('biceps')
    expect(added?.isActive).toBe(true)
    // הקישור הוא מה שמביא איתו את הסרטון — בלעדיו זו שורה בלי שום מדיה
    expect(added?.libraryId).toBe('lib-incline_hammer_curl')
    expect(LIBRARY_CATALOG.some((l) => l.id === added?.libraryId)).toBe(true)
    // בסוף הסדר, כדי לא לדחוף אף תרגיל קיים ממקומו בקבוצה שלו
    const maxBefore = before.reduce((m, e) => Math.max(m, e.order), -1)
    expect(added?.order).toBe(maxBefore + 1)
    expect(await db.exercises.count()).toBe(before.length + 1)
  })

  it('לא מוסיפה פעמיים כשהיא רצה על מסד שכבר עבר אותה', async () => {
    await seedV14(legacyExercises())
    await db.open()
    const first = await db.exercises.get(INCLINE_HAMMER_CURL_ID)
    await db.close()

    await db.open()

    expect(await db.exercises.count()).toBe(SEED_EXERCISES.length)
    // ובלי לדרוס: החותמת של הרשומה הקיימת נשארת כמו שהייתה
    expect((await db.exercises.get(INCLINE_HAMMER_CURL_ID))?.createdAt).toBe(first?.createdAt)
  })

  it('מסד חדש נזרע איתו מלכתחילה', async () => {
    await db.open()

    expect(await db.exercises.get(INCLINE_HAMMER_CURL_ID)).toBeTruthy()
    /*
      ובלי משקל זריעה, בדיוק כמו בזריעה עצמה: השיפוע חלש מהישיבה במידה שאי
      אפשר לנחש, ומספר שגוי כאן הופך להמלצה הראשונה שהמנוע ייתן.
    */
    expect((await db.exercises.get(INCLINE_HAMMER_CURL_ID))?.seedWeightKg).toBeNull()
  })
})
