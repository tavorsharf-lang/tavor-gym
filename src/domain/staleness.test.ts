import { describe, expect, it } from 'vitest'
import type { Block, Routine, RoutineId, Session } from '@/db/types'
import { MS_DAY } from '@/lib/dates'
import {
  blockStatuses,
  routineStatuses,
  stalenessText,
  suggestBlocks,
  suggestRoutine,
} from './staleness'

const NOW = new Date(2026, 7, 5, 12, 0, 0).getTime() // רביעי, 5.8.26

const ROUTINES: Routine[] = [
  { id: 'A', name: 'אימון A', subtitle: 'חזה', order: 0, items: [] },
  { id: 'B', name: 'אימון B', subtitle: 'גב', order: 1, items: [] },
  { id: 'C', name: 'אימון C', subtitle: 'רגליים', order: 2, items: [] },
]

const BLOCKS: Block[] = [
  { id: 'shoulders', name: 'כתפיים', order: 0, items: [] },
  { id: 'forearms', name: 'אמות', order: 1, items: [] },
  { id: 'abs', name: 'בטן', order: 2, items: [] },
]

let counter = 0

/** אימון שהסתיים לפני `daysAgo` ימים */
function done(routineId: RoutineId | null, daysAgo: number, blockIds: string[] = []): Session {
  const at = NOW - daysAgo * MS_DAY
  counter += 1
  return {
    id: `s${counter}`,
    routineId,
    blockIds,
    date: '2026-08-01',
    startedAt: at - 3600_000,
    endedAt: at,
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
  }
}

/** אימון שנפתח ולא נסגר */
function unfinished(routineId: RoutineId | null, daysAgo: number, blockIds: string[] = []): Session {
  return { ...done(routineId, daysAgo, blockIds), endedAt: 0, durationSeconds: 0 }
}

describe('routineStatuses', () => {
  it('ממיין לפי order ומחשב ימים מהאימון האחרון', () => {
    const statuses = routineStatuses(
      [ROUTINES[2], ROUTINES[0], ROUTINES[1]],
      [done('A', 2), done('A', 9), done('B', 4)],
      NOW
    )
    expect(statuses.map((s) => s.routineId)).toEqual(['A', 'B', 'C'])
    expect(statuses[0].daysSince).toBe(2) // האחרון קובע, לא הישן
    expect(statuses[0].neverDone).toBe(false)
    expect(statuses[1].daysSince).toBe(4)
    expect(statuses[2].lastDoneAt).toBeNull()
    expect(statuses[2].neverDone).toBe(true)
  })

  it('מתעלם מאימונים שלא נסגרו', () => {
    const statuses = routineStatuses(ROUTINES, [unfinished('C', 1)], NOW)
    expect(statuses[2].neverDone).toBe(true)
    expect(statuses[2].daysSince).toBeNull()
  })

  it('מתעלם מאימון בלי תוכנית', () => {
    const statuses = routineStatuses(ROUTINES, [done(null, 1)], NOW)
    expect(statuses.every((s) => s.neverDone)).toBe(true)
  })
})

describe('suggestRoutine', () => {
  it('אימון שמעולם לא בוצע גובר על אימון ישן מאוד', () => {
    const statuses = routineStatuses(ROUTINES, [done('A', 30), done('B', 2)], NOW)
    expect(suggestRoutine(statuses)).toBe('C')
  })

  it('בלי אף אימון — בוחר A', () => {
    expect(suggestRoutine(routineStatuses(ROUTINES, [], NOW))).toBe('A')
  })

  it('שובר תיקו בסדר A→B→C', () => {
    const same = routineStatuses(ROUTINES, [done('A', 5), done('B', 5), done('C', 5)], NOW)
    expect(suggestRoutine(same)).toBe('A')

    // גם כששניים מעולם לא בוצעו — הראשון בסדר מנצח
    const twoNew = routineStatuses(ROUTINES, [done('A', 1)], NOW)
    expect(suggestRoutine(twoNew)).toBe('B')

    // וגם כשהרשימה מגיעה בסדר הפוך
    const reversed = routineStatuses([ROUTINES[2], ROUTINES[1], ROUTINES[0]], [], NOW)
    expect(suggestRoutine([...reversed].reverse())).toBe('A')
  })

  it('בוחר את מי שהכי הרבה זמן לא בוצע', () => {
    const statuses = routineStatuses(ROUTINES, [done('A', 2), done('B', 9), done('C', 1)], NOW)
    expect(suggestRoutine(statuses)).toBe('B')
  })

  it('רשימה ריקה מחזירה null', () => {
    expect(suggestRoutine([])).toBeNull()
  })
})

describe('blockStatuses', () => {
  it('הסף עצמו כבר נחשב מוזנח', () => {
    const statuses = blockStatuses(
      BLOCKS,
      [done('A', 7, ['shoulders']), done('B', 6, ['forearms'])],
      NOW,
      7
    )
    const [shoulders, forearms, abs] = statuses
    expect(shoulders.daysSince).toBe(7)
    expect(shoulders.stale).toBe(true) // בדיוק על הגבול
    expect(forearms.daysSince).toBe(6)
    expect(forearms.stale).toBe(false) // יום אחד לפני
    expect(abs.neverDone).toBe(true)
    expect(abs.stale).toBe(true)
  })

  it('מתעלם מאימונים שלא נסגרו', () => {
    const statuses = blockStatuses(BLOCKS, [unfinished('A', 0, ['abs'])], NOW, 7)
    expect(statuses[2].neverDone).toBe(true)
  })

  it('ממיין לפי order', () => {
    const statuses = blockStatuses([BLOCKS[2], BLOCKS[0], BLOCKS[1]], [], NOW, 7)
    expect(statuses.map((s) => s.blockId)).toEqual(['shoulders', 'forearms', 'abs'])
  })
})

describe('suggestBlocks', () => {
  it('רק מוזנחים, המוזנח ביותר קודם', () => {
    const statuses = blockStatuses(
      BLOCKS,
      [done('A', 3, ['shoulders']), done('B', 12, ['forearms']), done('C', 8, ['abs'])],
      NOW,
      7
    )
    expect(suggestBlocks(statuses)).toEqual(['forearms', 'abs'])
  })

  it('מה שמעולם לא בוצע קודם לכל ותק', () => {
    const statuses = blockStatuses(BLOCKS, [done('A', 40, ['shoulders'])], NOW, 7)
    // אמות ובטן מעולם לא בוצעו — הן קודמות, ובתיקו נשמר סדר הבלוקים
    expect(suggestBlocks(statuses)).toEqual(['forearms', 'abs', 'shoulders'])
  })

  it('כשהכל טרי מחזיר רשימה ריקה', () => {
    const statuses = blockStatuses(
      BLOCKS,
      [done('A', 1, ['shoulders', 'forearms', 'abs'])],
      NOW,
      7
    )
    expect(suggestBlocks(statuses)).toEqual([])
  })
})

describe('stalenessText', () => {
  const textFor = (sessions: Session[], id: RoutineId): string => {
    const statuses = routineStatuses(ROUTINES, sessions, NOW)
    const status = statuses.find((s) => s.routineId === id)
    if (!status) throw new Error('missing status')
    return stalenessText(status)
  }

  it('אימון שמעולם לא בוצע', () => {
    expect(textFor([], 'C')).toBe('עוד לא עשית את אימון C')
  })

  it('אימון ישן', () => {
    expect(textFor([done('B', 9)], 'B')).toBe('לא עשית אימון B כבר 9 ימים')
  })

  it('יומיים', () => {
    expect(textFor([done('B', 2)], 'B')).toBe('לא עשית אימון B כבר יומיים')
  })

  it('היום ואתמול', () => {
    expect(textFor([done('A', 0)], 'A')).toBe('עשית אימון A היום')
    expect(textFor([done('A', 1)], 'A')).toBe('עשית אימון A אתמול')
  })
})
