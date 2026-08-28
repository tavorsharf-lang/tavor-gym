import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { SEED_EXERCISES } from '@/db/seed'
import type { Exercise } from '@/db/types'

/**
 * מיגרציה 11 — הדגש של הרמת הכתפיים מיושר מול הסרטון.
 *
 * הדגש הישן ביקש למשוך "ישר למעלה", וזה בדיוק מה שהסרטון מסמן כ-"DON'T DO
 * THIS" מעל עמידה זקופה. שינוי טקסט בלבד, ולכן מה שנבדק כאן הוא בעיקר שהוא
 * *לא* חל על מי שערך את הדגשים בעצמו.
 */
const V10_STORES = {
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

const template = SEED_EXERCISES.find((e) => e.id === 'shrugs') as Exercise

const OLD_CUES = [
  'למשוך ישר למעלה לכיוון האוזניים',
  'לא לסובב את הכתפיים במעגל',
  'לעצור שנייה למעלה',
  'ידיים רק מחזיקות — לא מכופפות',
]

async function seedV10(over: Partial<Exercise> = {}): Promise<void> {
  const old = new Dexie('tavor-gym')
  old.version(10).stores(V10_STORES)
  await old.open()
  await old
    .table<Exercise, string>('exercises')
    .bulkPut([{ ...template, cues: [...OLD_CUES], ...over }])
  old.close()
}

describe('מיגרציה 11 — דגש הרמת הכתפיים', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
  })

  it('מחליף את הדגש שסתר את הסרטון', async () => {
    await seedV10()
    await db.open()
    const shrugs = await db.exercises.get('shrugs')
    expect(shrugs?.cues[0]).toBe(
      'הטיה קלה קדימה מהירך, ולסחוט את הכתפיים למעלה ואחורה — לא ישר למעלה בעמידה זקופה'
    )
    // שאר הדגשים לא נגעו
    expect(shrugs?.cues.slice(1)).toEqual(OLD_CUES.slice(1))
  })

  it('לא נוגע בדגשים שהמשתמש ערך בעצמו', async () => {
    await seedV10({ cues: ['הדגש שלי'] })
    await db.open()
    expect((await db.exercises.get('shrugs'))?.cues).toEqual(['הדגש שלי'])
  })

  it('לא נוגע בתרגיל ששמו נערך', async () => {
    await seedV10({ name: 'השרגים שלי' })
    await db.open()
    const shrugs = await db.exercises.get('shrugs')
    expect(shrugs?.name).toBe('השרגים שלי')
    expect(shrugs?.cues[0]).toBe(OLD_CUES[0])
  })
})
