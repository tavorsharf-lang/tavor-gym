import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady, getSettings } from './db/db'
import {
  addFromLibrary,
  ensureTrainable,
  findPlanUsage,
  getCatalogEntries,
} from './db/catalog'
import { LIBRARY_CATALOG } from './db/libraryManifest'
import {
  activateRoutines,
  getActiveRoutines,
  getCustomRoutines,
  getRoutines,
  getSessionsSince,
  nextRoutineOrder,
} from './db/queries'
import type { Routine } from './db/types'
import { coverageLookbackFrom, muscleCoverage } from './domain/coverage'
import { routineStatuses, suggestRoutine } from './domain/staleness'
import { SECONDARY_MUSCLES } from './db/muscleTags'
import { useWorkout } from './state/activeWorkoutStore'

/**
 * בניית אימון — הזרימה מקצה לקצה, בלי ה-UI.
 *
 * מה שנבדק כאן הוא בדיוק מה שבדיקות היחידה של `coverage.ts` לא יכולות לתפוס:
 * שהחיבור בין הסל, הקטלוג המאוחד, ה-store והמסד באמת עובד — שתרגיל מהמאגר
 * הופך למשהו שאפשר לתעד בו סטים, שאימון שמור לא חוטף את ההצעה היומית, ושהוא
 * שורד את מתג התוכניות.
 */

async function resetAll(): Promise<void> {
  useWorkout.setState({
    workout: null,
    exercisesById: {},
    prCache: [],
    pendingPrEvents: [],
    hydrated: false,
  })
  await db.delete()
  await db.open()
  await ensureReady()
}

/** אימון שמור, כמו שגיליון הסל בונה אותו */
async function saveCustom(name: string, exerciseIds: string[]): Promise<Routine> {
  const routine: Routine = {
    id: `W-${name}`,
    kind: 'custom',
    name,
    subtitle: '',
    order: await nextRoutineOrder(),
    isActive: true,
    suggestBlocks: false,
    items: exerciseIds.map((exerciseId, order) => ({
      exerciseId,
      order,
      targetSets: 2,
      targetReps: { min: 8, max: 12 },
      restSeconds: 120,
      startWeightKg: null,
    })),
  }
  await db.routines.put(routine)
  return routine
}

describe('מיגרציה 8 — השדות שהפיצ׳ר עומד עליהם', () => {
  beforeEach(resetAll)

  it('כל תוכנית שנזרעה היא תוכנית קבועה', async () => {
    const routines = await getRoutines()
    expect(routines.length).toBeGreaterThan(0)
    expect(routines.every((r) => r.kind === 'program')).toBe(true)
  })

  it('תרגילי הזריעה נושאים את התיוג המשני שלהם', async () => {
    const row = await db.exercises.get('lat-pulldown')
    expect(row?.secondaryMuscles).toEqual(SECONDARY_MUSCLES['lat-pulldown'])
    // וגם השריר הראשי לעולם לא בתוך המשניים
    const all = await db.exercises.toArray()
    for (const ex of all) {
      expect(ex.secondaryMuscles ?? []).not.toContain(ex.muscleGroup)
    }
  })

  it('חלון הכיסוי מגיע עם ברירת מחדל', async () => {
    expect((await getSettings()).coverageWindowDays).toBe(4)
  })
})

describe('אימון שמור', () => {
  beforeEach(resetAll)

  it('לא מופיע ברשימת התוכניות הקבועות ולא חוטף את ההצעה היומית', async () => {
    const before = suggestRoutine(routineStatuses(await getActiveRoutines(), [], Date.now()))
    await saveCustom('השלמות', ['leg-press'])

    const programs = await getActiveRoutines()
    expect(programs.some((r) => r.kind === 'custom')).toBe(false)
    // "מעולם לא בוצע" גובר על כל ותק — בלי הסינון האימון השמור היה מנצח כאן
    expect(suggestRoutine(routineStatuses(programs, [], Date.now()))).toBe(before)

    const customs = await getCustomRoutines()
    expect(customs.map((r) => r.name)).toEqual(['השלמות'])
  })

  it('שורד מעבר בין פול-באדי לפיצול', async () => {
    await saveCustom('השלמות', ['leg-press'])
    await activateRoutines(['A', 'B', 'C'])

    const customs = await getCustomRoutines()
    expect(customs).toHaveLength(1)
    expect(customs[0].isActive).toBe(true)

    // ובכל זאת המתג באמת החליף את התוכניות הקבועות
    const programs = await getActiveRoutines()
    expect(programs.map((r) => r.id).sort()).toEqual(['A', 'B', 'C'])
  })

  it('מקבל סדר תצוגה מספרי, אחרת הוא נעלם מהאינדקס', async () => {
    const saved = await saveCustom('השלמות', ['leg-press'])
    expect(typeof saved.order).toBe('number')
    expect((await getRoutines()).some((r) => r.id === saved.id)).toBe(true)
  })

  it('נפתח כאימון רגיל דרך start, עם התור שנשמר בו', async () => {
    const saved = await saveCustom('השלמות', ['leg-press', 'lat-pulldown'])
    await useWorkout.getState().start(saved.id, [])

    const workout = useWorkout.getState().workout
    expect(workout?.routineId).toBe(saved.id)
    expect(workout?.queue.map((q) => q.exerciseId)).toEqual(['leg-press', 'lat-pulldown'])
    expect(workout?.currentKey).toBe(workout?.queue[0].key)
  })

  it('מחיקה רכה מסתירה אותו אבל שומרת את השם להיסטוריה', async () => {
    const saved = await saveCustom('השלמות', ['leg-press'])
    await db.routines.put({ ...saved, isActive: false })

    expect(await getCustomRoutines()).toHaveLength(0)
    // השורה נשארת, ולכן אימון שבוצע לפיה עדיין יודע איך הוא נקרא
    expect((await getRoutines()).find((r) => r.id === saved.id)?.name).toBe('השלמות')
  })
})

describe('הסל — מתרגיל בקטלוג המאוחד לאימון', () => {
  beforeEach(resetAll)

  it('ensureTrainable מחזיר תרגיל קיים כמו שהוא', async () => {
    const found = await ensureTrainable('leg-press')
    expect(found?.id).toBe('leg-press')
    expect(await db.exercises.count()).toBe(28)
  })

  it('ensureTrainable מחזיר תרגיל שהוצא מהתרגילים שלי', async () => {
    await db.exercises.update('leg-press', { isActive: false })
    const restored = await ensureTrainable('leg-press')
    expect(restored?.isActive).toBe(true)
    expect((await db.exercises.get('leg-press'))?.isActive).toBe(true)
  })

  it('ensureTrainable יוצר כרטיס לתרגיל מאגר, ופעם אחת בלבד', async () => {
    const lib = LIBRARY_CATALOG.find((l) => !l.id.includes('push_up'))!
    const created = await ensureTrainable(lib.id)
    expect(created?.libraryId).toBe(lib.id)
    expect(created?.name).toBe(lib.nameHe)

    const again = await ensureTrainable(lib.id)
    expect(again?.id).toBe(created?.id)
    expect(await db.exercises.where('libraryId').equals(lib.id).count()).toBe(1)
  })

  it('ensureTrainable מחזיר null למזהה שלא קיים בשום צד', async () => {
    expect(await ensureTrainable('אין-כזה')).toBeNull()
  })

  it('תרגיל שנוצר מהמאגר נושא את התיוג המשני שלו', async () => {
    const lib = LIBRARY_CATALOG.find((l) => (SECONDARY_MUSCLES[l.id] ?? []).length > 0)!
    const created = await ensureTrainable(lib.id)
    /*
      זו הייתה נקודת היצירה היחידה שלא תייגה. המיגרציה כבר רצה על המכשיר
      ולא תרוץ שוב, ולכן תרגיל כזה היה נשאר בלי עבודה עקיפה לתמיד — ומסך
      הכיסוי היה מדרג את השרירים שהוא כן מעמיס כמוזנחים.
    */
    expect(created?.secondaryMuscles).toEqual(SECONDARY_MUSCLES[lib.id])
    expect((await db.exercises.get(created!.id))?.secondaryMuscles).toEqual(
      SECONDARY_MUSCLES[lib.id]
    )
  })

  it('אימון שמור שנמחק לא נחשב "שימוש" וחוסם הסרת תרגיל', async () => {
    const saved = await saveCustom('השלמות', ['leg-press'])
    expect((await findPlanUsage('leg-press')).some((u) => u.id === saved.id)).toBe(true)

    await db.routines.put({ ...saved, isActive: false })
    // האימון נעלם מכל מסך, ולכן חסימה בשמו היא שגיאה שאי אפשר לפעול לפיה
    expect((await findPlanUsage('leg-press')).some((u) => u.id === saved.id)).toBe(false)
    // ותוכנית קבועה כבויה כן ממשיכה להיחשב — שם הדגל אומר משהו אחר
    expect((await findPlanUsage('pushup')).some((u) => u.id === 'A')).toBe(true)
  })

  it('startWithItems פותח אימון חופשי עם תרגיל פעיל', async () => {
    await useWorkout.getState().startWithItems(['leg-press', 'lat-pulldown'])
    const w = useWorkout.getState().workout

    expect(w?.routineId).toBeNull()
    expect(w?.queue.map((q) => q.exerciseId)).toEqual(['leg-press', 'lat-pulldown'])
    expect(w?.queue[0].status).toBe('active')
    expect(w?.currentKey).toBe(w?.queue[0].key)
    // התרגילים לא הגיעו מתוכנית, והמקור אומר את זה
    expect(w?.queue.every((q) => q.source === 'builder')).toBe(true)
    // והמצב נשמר לדיסק, כדי שקריסה לא תמחק את האימון
    expect((await db.activeWorkout.get('current'))?.queue).toHaveLength(2)
  })

  it('startWithItems מסנן כפילויות ותרגילים שהוצאו', async () => {
    await db.exercises.update('lat-pulldown', { isActive: false })
    await useWorkout.getState().startWithItems(['leg-press', 'leg-press', 'lat-pulldown'])
    expect(useWorkout.getState().workout?.queue.map((q) => q.exerciseId)).toEqual(['leg-press'])
  })

  it('addExercise מוצא תרגיל שנוצר אחרי תחילת האימון', async () => {
    await useWorkout.getState().start('F1', [])
    // תרגיל מאגר שהתווסף לקטלוג באמצע האימון — לא קיים בתצלום שבזיכרון
    const lib = LIBRARY_CATALOG[0]
    const { exercise } = await addFromLibrary(lib)

    const added = await useWorkout.getState().addExercise(exercise.id)
    expect(added).toBe(true)
    expect(useWorkout.getState().workout?.queue.at(-1)?.exerciseId).toBe(exercise.id)
  })

  it('addExercise מדווח על כישלון במקום להוסיף בשקט כלום', async () => {
    await useWorkout.getState().start('F1', [])
    expect(await useWorkout.getState().addExercise('אין-כזה')).toBe(false)
  })

  it('addExercise מפעיל את התרגיל כשהתור היה ריק', async () => {
    await useWorkout.getState().startWithItems([])
    expect(useWorkout.getState().workout?.currentKey).toBeNull()

    await useWorkout.getState().addExercise('leg-press')
    const w = useWorkout.getState().workout
    expect(w?.currentKey).toBe(w?.queue[0].key)
    expect(w?.queue[0].status).toBe('active')
  })

  it('אימון שנבנה נכתב להיסטוריה ומזין את חישוב הכיסוי', async () => {
    await useWorkout.getState().startWithItems(['leg-press'])
    const key = useWorkout.getState().workout!.currentKey!
    await useWorkout.getState().logSet(key, 'work', 100, 10)
    const sessionId = await useWorkout.getState().finish()
    expect(sessionId).not.toBeNull()

    const now = Date.now()
    const history = await getSessionsSince(coverageLookbackFrom(now))
    const rows = muscleCoverage(await db.exercises.toArray(), history.sessions, history.sets, now, 4)
    const legs = rows.find((r) => r.group === 'legs')
    expect(legs?.sets).toBe(1)
    expect(legs?.exercises).toBe(1)
    expect(legs?.uncovered).toBe(false)
  })
})

describe('הקטלוג המאוחד מזין את מסך השריר', () => {
  beforeEach(resetAll)

  it('לכל קבוצת שריר יש תרגילים משני המקורות, בלי כפילות', async () => {
    const entries = await getCatalogEntries()
    const ids = entries.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    // גם תרגילים שלי וגם תרגילי מאגר שאין להם כרטיס
    expect(entries.some((e) => e.exercise !== null)).toBe(true)
    expect(entries.some((e) => e.exercise === null)).toBe(true)
  })
})
