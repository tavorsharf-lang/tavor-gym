import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { SEED_EXERCISES, SEED_ROUTINES } from '@/db/seed'
import type { ActiveWorkout, Exercise, ExerciseRating, Routine } from '@/db/types'

/**
 * מיגרציה 7 — סולם הדירוג עובר מ-3 דרגות ל-5.
 *
 * כמו מיגרציה 5, זה קוד שרץ פעם אחת על הנתונים האמיתיים ואי אפשר להריץ שוב,
 * ולכן הוא נבדק מול מסד גרסה 6 אמיתי עם דירוגים בסולם הישן. הטעות שהמיגרציה
 * מונעת: "בינוני" ישן (2) שנקרא כ"קל" חדש היה גורם למנוע ההמלצות להעלות
 * משקל על סמך אימון שדורג אחרת.
 */

/** הסכמה כפי שהייתה מגרסה 4 ועד 6 — אף מיגרציה בדרך לא שינתה אינדקסים */
const V6_STORES = {
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

/** דירוג בסולם הישן: 1 קל · 2 בינוני · 3 קשה */
function legacyRating(
  id: number,
  exerciseId: string,
  rating: 1 | 2 | 3,
  rir: ExerciseRating['rir'] = null
): ExerciseRating {
  return { id, sessionId: 's-legacy', exerciseId, rating, rir, createdAt: 1000 }
}

/** אימון שהיה פתוח כשהעדכון נחת, עם דירוג שכבר נלחץ בסולם הישן */
function legacyActiveWorkout(): ActiveWorkout {
  return {
    id: 'current',
    sessionId: 's-open',
    routineId: 'F1',
    blockIds: [],
    startedAt: 1000,
    queue: [
      {
        key: 'q1',
        exerciseId: 'leg-press',
        plannedExerciseId: 'leg-press',
        source: 'routine',
        sourceId: 'F1',
        targetSets: 2,
        targetReps: { min: 10, max: 15 },
        restSeconds: 120,
        startWeightKg: null,
        status: 'active',
        warmupOffered: false,
      },
    ],
    currentKey: 'q1',
    setsByKey: {},
    ratingsByKey: { q1: { rating: 2, rir: 1 } },
    substitutions: [],
    restEndsAt: null,
    restTotalSeconds: 120,
    restForKey: null,
    notes: '',
    lastSavedAt: 1000,
  }
}

describe('מיגרציה 7 — הדירוגים עולים לאמצע הסולם החדש', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
  })

  it('1→2, 2→3, 3→4 — גם בטבלת הדירוגים וגם באימון פתוח', async () => {
    const legacy = new Dexie('tavor-gym')
    legacy.version(6).stores(V6_STORES)
    await legacy.open()

    await legacy.table<Exercise, string>('exercises').bulkPut(SEED_EXERCISES)
    await legacy.table<Routine, string>('routines').bulkPut(SEED_ROUTINES)
    await legacy.table<ExerciseRating, number>('ratings').bulkPut([
      legacyRating(1, 'leg-press', 1),
      legacyRating(2, 'leg-press', 2, 2),
      legacyRating(3, 'db-bench-press', 3, 0),
    ])
    await legacy.table<ActiveWorkout, string>('activeWorkout').put(legacyActiveWorkout())
    legacy.close()

    await db.open()

    const ratings = (await db.ratings.toArray()).sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    expect(ratings.map((r) => r.rating)).toEqual([2, 3, 4])
    // ה-RIR לא נוגעים בו — הוא באותו סולם לפני ואחרי
    expect(ratings.map((r) => r.rir)).toEqual([null, 2, 0])

    // אימון שהיה פתוח בזמן העדכון: הדירוג שכבר נלחץ מתורגם גם הוא, אחרת
    // finish() היה כותב לטבלה ערך ישן אחרי שהטבלה כבר בסולם החדש
    const open = await db.activeWorkout.get('current')
    expect(open?.ratingsByKey.q1).toEqual({ rating: 3, rir: 1 })
  })

  it('ריצה על מסד בסולם החדש לא נוגעת בכלום', async () => {
    // מסד שנוצר כבר בגרסה הנוכחית — למיגרציה אסור לרוץ עליו בכלל
    await db.open()
    await db.ratings.bulkPut([
      { id: 1, sessionId: 's1', exerciseId: 'leg-press', rating: 5, rir: null, createdAt: 1 },
      { id: 2, sessionId: 's1', exerciseId: 'abs', rating: 1, rir: 3, createdAt: 2 },
    ])
    db.close()

    await db.open()
    const ratings = (await db.ratings.toArray()).sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    expect(ratings.map((r) => r.rating)).toEqual([5, 1])
  })
})
