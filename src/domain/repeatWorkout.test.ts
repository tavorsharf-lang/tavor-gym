import { describe, expect, it } from 'vitest'
import type { Exercise, Session } from '@/db/types'
import { repeatLast } from './repeatWorkout'

function exercise(id: string, isActive = true): Exercise {
  return {
    id,
    name: id,
    muscleGroup: 'chest',
    subTarget: '',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 120,
    targetSets: 2,
    targetReps: { min: 8, max: 12 },
    cues: [],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: null,
    isActive,
    order: 0,
    createdAt: 0,
    updatedAt: 0,
  }
}

function session(over: Partial<Session> = {}): Session {
  return {
    id: 's1',
    routineId: 'F1',
    blockIds: ['abs'],
    date: '2026-08-16',
    startedAt: 0,
    endedAt: 0,
    durationSeconds: 0,
    plannedOrder: ['leg-press', 'lat-pulldown', 'decline-machine-press', 'leg-curl'],
    actualOrder: ['leg-press', 'lat-pulldown'],
    substitutions: [],
    skippedExerciseIds: ['decline-machine-press', 'leg-curl'],
    exerciseIds: ['leg-press', 'lat-pulldown'],
    notes: '',
    totalVolumeKg: 100,
    totalSets: 4,
    totalWorkSets: 4,
    ...over,
  }
}

const CATALOG = [
  exercise('leg-press'),
  exercise('lat-pulldown'),
  exercise('decline-machine-press'),
  exercise('leg-curl'),
]

describe('חזרה על האימון הקודם', () => {
  it('חוזרת על מה שבוצע ולא על מה שתוכנן', () => {
    const plan = repeatLast(session(), CATALOG)
    // שני התרגילים שדולגו לא חוזרים — חזרה עליהם היא חזרה על מה שוויתרת עליו
    expect(plan?.exerciseIds).toEqual(['leg-press', 'lat-pulldown'])
  })

  it('שומרת על סדר הביצוע בפועל', () => {
    const plan = repeatLast(
      session({ actualOrder: ['abs', 'leg-press', 'lat-pulldown'] }),
      [...CATALOG, exercise('abs')]
    )
    expect(plan?.exerciseIds).toEqual(['abs', 'leg-press', 'lat-pulldown'])
  })

  it('שומרת את התוכנית והבלוקים — חזרה על אימון היא ביצוע שלו', () => {
    const plan = repeatLast(session(), CATALOG)
    expect(plan?.routineId).toBe('F1')
    expect(plan?.blockIds).toEqual(['abs'])
  })

  it('אימון חופשי נשאר חופשי', () => {
    const plan = repeatLast(session({ routineId: null, blockIds: [] }), CATALOG)
    expect(plan?.routineId).toBeNull()
    expect(plan?.blockIds).toEqual([])
  })

  it('תרגיל שהוצא מהקטלוג מאז יורד מהרשימה', () => {
    const catalog = [exercise('leg-press'), exercise('lat-pulldown', false)]
    expect(repeatLast(session(), catalog)?.exerciseIds).toEqual(['leg-press'])
  })

  it('אין על מה לחזור — null ולא רשימה ריקה', () => {
    // אימון שנסגר בלי אף סט: `actualOrder` ריק
    expect(repeatLast(session({ actualOrder: [] }), CATALOG)).toBeNull()
    // כל התרגילים הוצאו מהקטלוג
    expect(repeatLast(session(), [exercise('leg-press', false)])).toBeNull()
    expect(repeatLast(null, CATALOG)).toBeNull()
  })

  it('אותו תרגיל פעמיים בסדר הביצוע נכנס פעם אחת', () => {
    // קורה אחרי החלפה שחוזרת לתרגיל המקורי
    const plan = repeatLast(
      session({ actualOrder: ['leg-press', 'lat-pulldown', 'leg-press'] }),
      CATALOG
    )
    expect(plan?.exerciseIds).toEqual(['leg-press', 'lat-pulldown'])
  })
})
