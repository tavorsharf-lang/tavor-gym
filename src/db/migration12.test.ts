import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { LIBRARY_CATALOG } from '@/db/libraryManifest'
import { SEED_EXERCISES } from '@/db/seed'
import type { Exercise } from '@/db/types'

/**
 * מיגרציה 12 — "הרמת עקבים" מקבלת את דף המאגר שלה.
 *
 * `lib-calf_raise` נפתח באודיט המאגר מקליפ שישב תחת לחיצת רגליים, ולכן
 * `LIBRARY_LINKS` מכיר קישור שלא היה קיים כשהמסד נזרע. מה שנבדק כאן הוא בדיוק
 * מה שמסוכן בקישור מאוחר: שהוא לא ידרוס קישור שהמשתמש קבע בעצמו.
 */
const V11_STORES = {
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

const template = SEED_EXERCISES.find((e) => e.id === 'calf-raise') as Exercise

async function seedV11(over: Partial<Exercise> = {}): Promise<void> {
  const old = new Dexie('tavor-gym')
  old.version(11).stores(V11_STORES)
  await old.open()
  const { libraryId: _drop, ...withoutLink } = { ...template }
  await old.table<Exercise, string>('exercises').bulkPut([{ ...withoutLink, ...over } as Exercise])
  old.close()
}

describe('מיגרציה 12 — קישור הרמת העקבים למאגר', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
  })

  it('שותלת את הקישור על רשומה שעלתה בלעדיו', async () => {
    await seedV11()
    await db.open()
    expect((await db.exercises.get('calf-raise'))?.libraryId).toBe('lib-calf_raise')
  })

  it('לא דורסת קישור שכבר יושב על הרשומה', async () => {
    await seedV11({ libraryId: 'lib-leg_press' })
    await db.open()
    expect((await db.exercises.get('calf-raise'))?.libraryId).toBe('lib-leg_press')
  })

  it('היעד קיים במאגר ומחזיק סרטון', () => {
    const target = LIBRARY_CATALOG.find((e) => e.id === 'lib-calf_raise')
    expect(target?.muscleGroup).toBe('legs')
    expect(target?.videos.length).toBeGreaterThan(0)
  })
})
