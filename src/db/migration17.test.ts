import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { EZ_BAR_CURL_ID, db } from '@/db/db'
import { DEFAULT_SETTINGS, SEED_EXERCISES } from '@/db/seed'
import { LIBRARY_CATALOG, LIBRARY_MANIFEST } from '@/db/libraryManifest'
import type { Exercise, SettingsRow } from '@/db/types'

/**
 * מיגרציה 17 — "כפיפת מרפקים עם מוט דבליו" נכנסת לקטלוג של מכשיר קיים.
 *
 * אותה צורה כמו מיגרציה 15. מה שנבדק כאן ואינו חוזר על עצמו: שהרשומה במאגר
 * באמת מחזיקה את הקליפ שיצא מ"כפיפת מרפקים במוט", ושהמוט הישר לא נשאר איתו
 * גם — קליפ שיושב בשתי רשומות מוצג פעמיים ונספר פעמיים.
 */

const V16_STORES = {
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
  return SEED_EXERCISES.filter((e) => e.id !== EZ_BAR_CURL_ID)
}

async function seedV16(exercises: Exercise[]): Promise<void> {
  const old = new Dexie('tavor-gym')
  old.version(16).stores(V16_STORES)
  await old.open()
  await old.table<Exercise, string>('exercises').bulkPut(exercises)
  await old.table<SettingsRow, string>('settings').put({ key: 'app', value: DEFAULT_SETTINGS })
  old.close()
}

const CLIP = 'https://www.tiktok.com/@deltabolic/video/7245075772501658886'

describe('מיגרציה 17 — כפיפת מרפקים עם מוט דבליו', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
  })

  it('מוסיפה את התרגיל לקטלוג קיים, עם הקישור למאגר', async () => {
    const before = legacyExercises()
    await seedV16(before)

    await db.open()

    const added = await db.exercises.get(EZ_BAR_CURL_ID)
    expect(added).toBeTruthy()
    expect(added?.name).toBe('כפיפת מרפקים עם מוט דבליו')
    expect(added?.muscleGroup).toBe('biceps')
    expect(added?.isActive).toBe(true)
    expect(added?.libraryId).toBe('lib-ez_bar_curl')
    expect(added?.order).toBe(before.reduce((m, e) => Math.max(m, e.order), -1) + 1)
    expect(await db.exercises.count()).toBe(before.length + 1)
  })

  it('לא מוסיפה פעמיים כשהיא רצה על מסד שכבר עבר אותה', async () => {
    await seedV16(legacyExercises())
    await db.open()
    const first = await db.exercises.get(EZ_BAR_CURL_ID)
    await db.close()

    await db.open()

    expect(await db.exercises.count()).toBe(SEED_EXERCISES.length)
    expect((await db.exercises.get(EZ_BAR_CURL_ID))?.createdAt).toBe(first?.createdAt)
  })

  it('מסד חדש נזרע איתו מלכתחילה, ובלי משקל זריעה', async () => {
    await db.open()

    const added = await db.exercises.get(EZ_BAR_CURL_ID)
    expect(added).toBeTruthy()
    expect(added?.seedWeightKg).toBeNull()
  })
})

/**
 * הקליפ שיצא מ"כפיפת מרפקים במוט".
 *
 * ‏URL ולא שם קובץ: שם הקובץ נשאר `dumbbell_curl-14` — הוא המפתח של הסרטון
 * ב-DB המדיה על המכשיר, ומעבר בין רשומות לא משנה אותו. זה גם למה ההעברה לא
 * מאלצת הורדה מחדש של שום דבר.
 */
describe('הקליפ של מוט הדבליו', () => {
  it('יושב ברשומה אחת בלבד, וזו רשומת מוט הדבליו', () => {
    const holders = LIBRARY_CATALOG.filter((l) => l.videos.some((v) => v.url === CLIP))
    expect(holders.map((l) => l.id)).toEqual(['lib-ez_bar_curl'])
  })

  it('הרשומה שממנה הוא יצא נשארה מלאה ועם ספירה מעודכנת', () => {
    const barbell = LIBRARY_CATALOG.find((l) => l.id === 'lib-barbell_curl')
    expect(barbell?.videos.length).toBe(7)
    expect(barbell?.totalAvailable).toBe(7)
    expect(LIBRARY_MANIFEST['lib-barbell_curl']).toHaveLength(7)
  })

  it('הקובץ עצמו עבר ולא שוכפל', () => {
    const src = 'videos/lib/dumbbell_curl-14.mp4'
    const holders = Object.entries(LIBRARY_MANIFEST)
      .filter(([, clips]) => clips.some((c) => c.src === src))
      .map(([id]) => id)
    expect(holders).toEqual(['lib-ez_bar_curl'])
  })
})
