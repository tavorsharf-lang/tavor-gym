import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady } from '@/db/db'
import type { Block, Exercise, Routine, Session, SetLog } from '@/db/types'
import {
  addBodyWeight,
  getBodyWeights,
  getExerciseHistory,
  getFinishedSessions,
  getLastPerformance,
  getSetsForExercise,
  getSubstituteCandidates,
  searchSessions,
} from '@/db/queries'

// תאריכים קבועים — הבדיקות לא תלויות בשעון
const DAY = 86_400_000
const T1 = new Date(2026, 7, 1, 18, 0).getTime()
const T2 = new Date(2026, 7, 3, 18, 0).getTime()
const T3 = new Date(2026, 7, 5, 18, 0).getTime()

function exercise(over: Partial<Exercise> & Pick<Exercise, 'id' | 'name'>): Exercise {
  return {
    nameEn: '',
    muscleGroup: 'chest',
    subTarget: 'חזה עליון',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 90,
    targetSets: 3,
    targetReps: { min: 8, max: 12 },
    cues: [],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 40,
    isActive: true,
    order: 0,
    createdAt: T1,
    updatedAt: T1,
    ...over,
  }
}

function session(over: Partial<Session> & Pick<Session, 'id' | 'startedAt'>): Session {
  return {
    routineId: 'A',
    blockIds: [],
    date: '2026-08-01',
    endedAt: over.startedAt + 3600_000,
    durationSeconds: 3600,
    plannedOrder: [],
    actualOrder: [],
    substitutions: [],
    skippedExerciseIds: [],
    exerciseIds: [],
    notes: '',
    totalVolumeKg: 0,
    totalSets: 0,
    totalWorkSets: 0,
    ...over,
  }
}

function set(sessionId: string, exerciseId: string, i: number, at: number): SetLog {
  return {
    sessionId,
    exerciseId,
    setIndex: i,
    type: 'work',
    weightKg: 40 + i * 2.5,
    reps: 10,
    completedAt: at + i * 60_000,
  }
}

const EXERCISES: Exercise[] = [
  exercise({ id: 'press', name: 'לחיצת חזה', subTarget: 'חזה עליון', order: 0 }),
  exercise({ id: 'fly', name: 'פרפר', subTarget: 'חזה תחתון', order: 1 }),
  exercise({ id: 'incline', name: 'לחיצה בשיפוע', subTarget: 'חזה עליון', order: 2 }),
  exercise({ id: 'old-press', name: 'לחיצה ישנה', subTarget: 'חזה עליון', order: 3, isActive: false }),
  exercise({ id: 'row', name: 'חתירה', muscleGroup: 'back', subTarget: 'לטיסימוס', order: 4 }),
]

const ROUTINES: Routine[] = [
  { id: 'A', name: 'אימון A', subtitle: 'חזה ויד אחורית', order: 0, items: [] },
  { id: 'B', name: 'אימון B', subtitle: 'גב ויד קדמית', order: 1, items: [] },
]

const BLOCKS: Block[] = [{ id: 'abs', name: 'בטן', order: 2, items: [] }]

// s1 ו-s2 נסגרו, s3 עדיין בתהליך — הוא זה שמוודא שאימון פתוח לא דולף לתוצאות
const SESSIONS: Session[] = [
  session({
    id: 's1',
    startedAt: T1,
    date: '2026-08-01',
    routineId: 'A',
    blockIds: ['abs'],
    exerciseIds: ['press', 'row'],
  }),
  session({ id: 's2', startedAt: T2, date: '2026-08-03', routineId: 'B', exerciseIds: ['press'] }),
  session({
    id: 's3',
    startedAt: T3,
    date: '2026-08-05',
    routineId: 'A',
    endedAt: 0,
    exerciseIds: ['press'],
  }),
]

beforeEach(async () => {
  await ensureReady()
  await db.transaction(
    'rw',
    [db.exercises, db.routines, db.blocks, db.sessions, db.setLogs, db.ratings, db.bodyWeights],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.routines.clear(),
        db.blocks.clear(),
        db.sessions.clear(),
        db.setLogs.clear(),
        db.ratings.clear(),
        db.bodyWeights.clear(),
      ])
      await db.exercises.bulkPut(EXERCISES)
      await db.routines.bulkPut(ROUTINES)
      await db.blocks.bulkPut(BLOCKS)
      await db.sessions.bulkPut(SESSIONS)
      await db.setLogs.bulkAdd([
        set('s1', 'press', 0, T1),
        set('s1', 'press', 1, T1),
        set('s1', 'row', 0, T1),
        set('s2', 'press', 0, T2),
        set('s3', 'press', 0, T3),
      ])
      await db.ratings.bulkAdd([
        { sessionId: 's1', exerciseId: 'press', rating: 3, rir: 0, createdAt: T1 },
        { sessionId: 's2', exerciseId: 'press', rating: 1, rir: 3, createdAt: T2 },
      ])
    }
  )
})

describe('getSubstituteCandidates', () => {
  it('מחזיר קודם את אותו מיקוד, ומדלג על עצמו ועל תרגילים כבויים', async () => {
    const press = await db.exercises.get('press')
    expect(press).toBeDefined()
    const candidates = await getSubstituteCandidates(press as Exercise)
    expect(candidates.map((e) => e.id)).toEqual(['incline', 'fly'])
  })
})

describe('searchSessions', () => {
  it('מסנן לפי תוכנית ומשמיט אימון שלא נסגר', async () => {
    const found = await searchSessions({ routineId: 'A' })
    expect(found.map((s) => s.id)).toEqual(['s1'])
  })

  it('מסנן לפי תרגיל ולפי בלוק', async () => {
    expect((await searchSessions({ exerciseId: 'row' })).map((s) => s.id)).toEqual(['s1'])
    expect((await searchSessions({ blockId: 'abs' })).map((s) => s.id)).toEqual(['s1'])
  })

  it('טקסט חופשי מוצא לפי שם תרגיל, מהחדש לישן', async () => {
    const found = await searchSessions({ query: 'לחיצת' })
    expect(found.map((s) => s.id)).toEqual(['s2', 's1'])
  })

  it('טקסט חופשי מוצא גם לפי שם תוכנית', async () => {
    expect((await searchSessions({ query: 'אימון b' })).map((s) => s.id)).toEqual(['s2'])
  })

  it('סינונים מצטברים', async () => {
    expect((await searchSessions({ routineId: 'B', exerciseId: 'press' })).map((s) => s.id)).toEqual(['s2'])
    expect(await searchSessions({ routineId: 'B', exerciseId: 'row' })).toEqual([])
  })

  it('בלי סינון מחזיר את כל האימונים שנסגרו', async () => {
    expect((await searchSessions({})).map((s) => s.id)).toEqual(['s2', 's1'])
  })
})

describe('getExerciseHistory', () => {
  it('מהחדש לישן, עם הסטים והדירוג של כל אימון', async () => {
    const history = await getExerciseHistory('press')
    expect(history.map((h) => h.sessionId)).toEqual(['s2', 's1'])
    expect(history[0].rating).toEqual({ rating: 1, rir: 3 })
    expect(history[1].rating).toEqual({ rating: 3, rir: 0 })
    expect(history[0].sets).toHaveLength(1)
    expect(history[1].sets).toHaveLength(2)
    expect(history[1].sets[0].setIndex).toBe(0)
  })

  it('מכבד את מגבלת מספר האימונים', async () => {
    expect(await getExerciseHistory('press', 1)).toHaveLength(1)
  })
})

describe('getLastPerformance', () => {
  it('מתעלם מאימון שעדיין בתהליך', async () => {
    const last = await getLastPerformance('press')
    expect(last?.sessionId).toBe('s2')
  })

  it('מחזיר null כשאין היסטוריה', async () => {
    expect(await getLastPerformance('fly')).toBeNull()
  })
})

describe('getFinishedSessions ו-getSetsForExercise', () => {
  it('מחזירים מהחדש לישן', async () => {
    expect((await getFinishedSessions()).map((s) => s.id)).toEqual(['s2', 's1'])
    const sets = await getSetsForExercise('press', 2)
    expect(sets.map((s) => s.sessionId)).toEqual(['s3', 's2'])
  })
})

describe('addBodyWeight', () => {
  it('דורס שקילה קיימת באותו תאריך ושומר סדר כרונולוגי', async () => {
    await addBodyWeight('2026-08-01', 80)
    await addBodyWeight('2026-08-03', 80.4, 'בוקר')
    await addBodyWeight('2026-08-01', 81.2, 'אחרי ארוחה')

    const all = await getBodyWeights()
    expect(all.map((b) => b.date)).toEqual(['2026-08-01', '2026-08-03'])
    expect(all[0].weightKg).toBe(81.2)
    expect(all[0].note).toBe('אחרי ארוחה')
    expect(all[1].note).toBe('בוקר')
  })

  it('שומר את ההערה הקיימת כשלא נמסרת חדשה', async () => {
    await addBodyWeight('2026-08-04', 80, 'אחרי אימון')
    await addBodyWeight('2026-08-04', 79.5)
    const [entry] = await getBodyWeights()
    expect(entry.weightKg).toBe(79.5)
    expect(entry.note).toBe('אחרי אימון')
    expect(entry.createdAt).toBeLessThanOrEqual(Date.now() + DAY)
  })
})
