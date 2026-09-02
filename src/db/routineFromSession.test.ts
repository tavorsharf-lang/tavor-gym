import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady } from '@/db/db'
import {
  planItemsFromSets,
  routineNameFor,
  saveSessionAsRoutine,
} from '@/db/routineFromSession'
import { getAllExercises } from '@/db/queries'
import type { Exercise, SetLog } from '@/db/types'

/**
 * אימון חופשי שהופך לתוכנית.
 *
 * מה שנעול כאן הוא ההבטחה שהכפתור נותן: `targetSets` הוא **מה שבוצע** ולא מה
 * שתוכנן, והמשקל שהורם היום הוא נקודת הפתיחה של הפעם הבאה. תוכנית שנשמרת עם
 * מספרים אחרים מאלה שקרו היא בדיוק ההפתעה שהמסלול הזה בא למנוע.
 */

let exercises: Exercise[] = []

async function reset(): Promise<void> {
  await db.close()
  await db.delete()
  await db.open()
  await ensureReady()
  exercises = await getAllExercises(true)
}

let nextId = 1
const seen = new Map<string, number>()

function set(
  exerciseId: string,
  weightKg: number,
  reps: number,
  type: SetLog['type'] = 'work'
): SetLog {
  const index = (seen.get(exerciseId) ?? 0) + 1
  seen.set(exerciseId, index)
  return {
    id: nextId++,
    sessionId: 's1',
    exerciseId,
    setIndex: index,
    type,
    weightKg,
    reps,
    completedAt: Date.now() + nextId,
  }
}

describe('תוכנית מתוך אימון חופשי', () => {
  beforeEach(async () => {
    seen.clear()
    await reset()
  })

  it('השם נגזר משתי הקבוצות עם הכי הרבה סטים', () => {
    const sets = [
      // גב — שלושה סטים
      set('lat-pulldown', 45, 10),
      set('lat-pulldown', 45, 9),
      set('seated-row-heavy', 60, 10),
      // כתפיים — שניים
      set('machine-shoulder-press', 30, 10),
      set('machine-shoulder-press', 30, 9),
      // רגליים — אחד, ולכן מחוץ לשם
      set('leg-press', 100, 10),
    ]
    expect(routineNameFor(sets, exercises)).toBe('גב וכתפיים')
  })

  it('שם תפוס מקבל מספר במקום לדרוס', () => {
    const sets = [set('lat-pulldown', 45, 10), set('machine-shoulder-press', 30, 10)]
    const name = routineNameFor(sets, exercises)
    expect(routineNameFor(sets, exercises, [name])).toBe(`${name} 2`)
    expect(routineNameFor(sets, exercises, [name, `${name} 2`])).toBe(`${name} 3`)
  })

  it('הפריטים נושאים את מה שבוצע בפועל, ואת המשקל הכבד כנקודת פתיחה', () => {
    const sets = [
      set('lat-pulldown', 45, 10),
      set('lat-pulldown', 50, 8),
      // חימום אינו סט עבודה, ולכן אינו נספר וגם אינו קובע משקל התחלה
      set('lat-pulldown', 20, 12, 'warmup'),
    ]
    const [item] = planItemsFromSets(sets, exercises, ['lat-pulldown'], 6)

    expect(item.targetSets).toBe(2)
    expect(item.startWeightKg).toBe(50)
    // טווח סביב מה שבוצע — 8 ו-10
    expect(item.targetReps).toEqual({ min: 8, max: 10 })
  })

  it('חזרות זהות מקבלות טווח סביבן ולא מספר בודד', () => {
    const sets = [set('lat-pulldown', 45, 10), set('lat-pulldown', 45, 10)]
    const [item] = planItemsFromSets(sets, exercises, ['lat-pulldown'], 6)

    /*
      טווח שהוא מספר אחד היה הופך כל סט שלא נחת עליו בדיוק לחריגה — כלומר
      את רוב הסטים באימון הבא.
    */
    expect(item.targetReps).toEqual({ min: 9, max: 11 })
  })

  it('השמירה יוצרת תוכנית פעילה שמופיעה במסך הראשי', async () => {
    const sets = [
      set('lat-pulldown', 45, 10),
      set('lat-pulldown', 45, 9),
      set('machine-shoulder-press', 30, 10),
    ]
    const before = (await db.routines.toArray()).length

    const routine = await saveSessionAsRoutine(
      sets,
      exercises,
      ['lat-pulldown', 'machine-shoulder-press'],
      6
    )

    expect((await db.routines.toArray()).length).toBe(before + 1)
    const saved = await db.routines.get(routine.id)
    expect(saved?.isActive).toBe(true)
    expect(saved?.kind).toBe('custom')
    // ‏`order` מספרי חובה: בלעדיו השורה פשוט לא תופיע בשום מסך
    expect(typeof saved?.order).toBe('number')
    expect(saved?.items.map((i) => i.exerciseId)).toEqual(['lat-pulldown', 'machine-shoulder-press'])
    expect(saved?.items[0].targetSets).toBe(2)
  })
})
