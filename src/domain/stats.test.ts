import { describe, expect, it } from 'vitest'
import type { Exercise, MuscleGroup, Session, SetLog, SetType, WeightMode } from '@/db/types'
import { MUSCLE_GROUPS, MUSCLE_GROUP_ORDER } from '@/db/types'
import { startOfWeek, toISODate } from '@/lib/dates'
import {
  compareWeeks,
  emptyGroupVolumes,
  exerciseTrend,
  weeklyBreakdown,
  type WeeklyBreakdown,
} from './stats'

const NOW = new Date(2026, 7, 5, 12, 0, 0).getTime() // רביעי, 5.8.26
const THIS_WEEK = startOfWeek(NOW) // ראשון 2.8.26

function ex(id: string, muscleGroup: MuscleGroup, weightMode: WeightMode): Exercise {
  return {
    id,
    name: id,
    muscleGroup,
    subTarget: '',
    equipment: weightMode === 'bodyweight' ? 'bodyweight' : 'machine',
    weightMode,
    weightIncrementKg: 2.5,
    defaultRestSeconds: 90,
    targetSets: 3,
    targetReps: { min: 8, max: 12 },
    cues: [],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: null,
    isActive: true,
    order: 0,
    createdAt: 0,
    updatedAt: 0,
  }
}

const BENCH = ex('bench', 'chest', 'perSide')
const ROW = ex('row', 'back', 'total')
const SQUAT = ex('squat', 'legs', 'total')
const DIPS = ex('dips', 'chest', 'bodyweight')
const EXERCISES = [BENCH, ROW, SQUAT, DIPS]

function session(id: string, month: number, day: number, finished = true): Session {
  const started = new Date(2026, month - 1, day, 10, 0, 0).getTime()
  return {
    id,
    routineId: 'A',
    blockIds: [],
    date: toISODate(started),
    startedAt: started,
    endedAt: finished ? started + 3600_000 : 0,
    durationSeconds: finished ? 3600 : 0,
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

let setSeq = 0

function log(
  sessionId: string,
  exerciseId: string,
  type: SetType,
  weightKg: number,
  reps: number
): SetLog {
  setSeq += 1
  return {
    id: setSeq,
    sessionId,
    exerciseId,
    setIndex: 0,
    type,
    weightKg,
    reps,
    completedAt: setSeq * 60_000,
  }
}

describe('emptyGroupVolumes', () => {
  it('מחזיר את כל קבוצות השריר באפס, בסדר התצוגה', () => {
    const groups = emptyGroupVolumes()
    expect(groups.map((g) => g.group)).toEqual(MUSCLE_GROUP_ORDER)
    expect(groups[0].label).toBe(MUSCLE_GROUPS.chest.label)
    expect(groups.every((g) => g.volumeKg === 0 && g.workSets === 0 && g.sessions === 0)).toBe(true)
  })
})

describe('weeklyBreakdown', () => {
  const s1 = session('s1', 8, 3)
  const s2 = session('s2', 8, 5)
  const sOpen = session('s-open', 8, 4, false)
  const sLastWeek = session('s-old', 7, 28)

  const sets: SetLog[] = [
    log('s1', 'bench', 'warmup', 20, 10), // חימום — לא נספר
    log('s1', 'bench', 'work', 20, 10), // 20×2×10 = 400
    log('s1', 'bench', 'work', 20, 8), // 20×2×8  = 320
    log('s1', 'row', 'work', 50, 10), // 500
    log('s1', 'squat', 'work', 100, 5), // 500
    log('s2', 'bench', 'work', 22.5, 10), // 22.5×2×10 = 450
    log('s-open', 'row', 'work', 999, 10), // אימון פתוח — מחוץ לחשבון
    log('s-old', 'row', 'work', 60, 10), // שבוע קודם
  ]

  const week = weeklyBreakdown([s1, s2, sOpen, sLastWeek], sets, EXERCISES, NOW)
  const byGroup = new Map(week.byGroup.map((g) => [g.group, g]))

  it('מיישר את תחילת השבוע ליום ראשון', () => {
    expect(week.weekStart).toBe(THIS_WEEK)
  })

  it('מכפיל perSide בדיוק פעם אחת ולא סופר חימומים', () => {
    const chest = byGroup.get('chest')
    expect(chest?.volumeKg).toBe(1170) // 400 + 320 + 450
    expect(chest?.workSets).toBe(3) // בלי החימום
    expect(chest?.sessions).toBe(2)
  })

  it('מסכם את כל השבוע', () => {
    expect(week.totalVolumeKg).toBe(2170) // 1170 + 500 + 500
    expect(week.totalWorkSets).toBe(5)
  })

  it('מתעלם מאימון שלא נסגר ומאימון של שבוע אחר', () => {
    expect(byGroup.get('back')?.volumeKg).toBe(500)
    expect(byGroup.get('back')?.workSets).toBe(1)
  })

  it('כל קבוצה מופיעה, גם באפס', () => {
    expect(week.byGroup.map((g) => g.group)).toEqual(MUSCLE_GROUP_ORDER)
    expect(byGroup.get('shoulders')).toMatchObject({ volumeKg: 0, workSets: 0, sessions: 0 })
  })

  it('משקל גוף לא מוסיף נפח אבל כן נספר כסט עבודה', () => {
    const only = weeklyBreakdown([s1], [log('s1', 'dips', 'work', 0, 12)], EXERCISES, NOW)
    const chest = only.byGroup.find((g) => g.group === 'chest')
    expect(chest?.volumeKg).toBe(0)
    expect(chest?.workSets).toBe(1)
    expect(chest?.sessions).toBe(1)
  })

  it('שבוע בלי אימונים מחזיר אפסים', () => {
    const empty = weeklyBreakdown([], [], EXERCISES, NOW)
    expect(empty.totalVolumeKg).toBe(0)
    expect(empty.byGroup).toHaveLength(MUSCLE_GROUP_ORDER.length)
  })
})

/** בונה פירוק שבועי ידני, כדי לבדוק את ההשוואה בנפרד מהאיסוף */
function breakdown(entries: Partial<Record<MuscleGroup, [number, number]>>): WeeklyBreakdown {
  const byGroup = emptyGroupVolumes().map((g) => {
    const e = entries[g.group]
    return e ? { ...g, volumeKg: e[0], workSets: e[1], sessions: 1 } : g
  })
  return {
    weekStart: THIS_WEEK,
    totalVolumeKg: byGroup.reduce((sum, g) => sum + g.volumeKg, 0),
    totalWorkSets: byGroup.reduce((sum, g) => sum + g.workSets, 0),
    byGroup,
  }
}

describe('compareWeeks', () => {
  const current = breakdown({ chest: [1000, 4], legs: [500, 2], biceps: [300, 3], abs: [200, 2] })
  const previous = breakdown({ chest: [1000, 4], back: [800, 4], legs: [1000, 4], biceps: [800, 4] })
  const result = new Map(compareWeeks(current, previous).map((c) => [c.group, c]))

  it('מחזיר את כל הקבוצות בסדר התצוגה', () => {
    expect(compareWeeks(current, previous).map((c) => c.group)).toEqual(MUSCLE_GROUP_ORDER)
  })

  it('אותו נפח — בלי שינוי ובלי הזנחה', () => {
    expect(result.get('chest')).toMatchObject({ current: 1000, previous: 1000, deltaPct: 0, neglected: false })
  })

  it('אפס סטים השבוע = מוזנח', () => {
    expect(result.get('back')).toMatchObject({ currentSets: 0, deltaPct: -100, neglected: true })
  })

  it('צניחה מתחת ל-60% מהשבוע הקודם = מוזנח', () => {
    expect(result.get('legs')).toMatchObject({ deltaPct: -50, neglected: true })
  })

  it('ירידה מתונה עדיין לא הזנחה', () => {
    // 300 מתוך 800 היה 37.5% — לכן בודקים ירידה של 25% בלבד
    const mild = compareWeeks(breakdown({ biceps: [600, 3] }), breakdown({ biceps: [800, 4] }))
    const biceps = mild.find((c) => c.group === 'biceps')
    expect(biceps?.deltaPct).toBe(-25)
    expect(biceps?.neglected).toBe(false)
  })

  it('בלי שבוע קודם אין אחוז שינוי', () => {
    expect(result.get('abs')).toMatchObject({ previous: 0, deltaPct: null, neglected: false })
  })

  it('קבוצה שלא נגעו בה בשני השבועות מסומנת כמוזנחת', () => {
    expect(result.get('calves')).toMatchObject({ current: 0, previous: 0, deltaPct: null, neglected: true })
  })

  it('אפשר להגביל לקבוצות מסוימות', () => {
    const only = compareWeeks(current, previous, ['chest', 'legs'])
    expect(only.map((c) => c.group)).toEqual(['chest', 'legs'])
  })
})

describe('exerciseTrend', () => {
  const sA = session('a', 8, 1)
  const sB = session('b', 8, 3)
  const sC = session('c', 8, 5)
  const sOpen = session('d', 8, 6, false)

  const sets: SetLog[] = [
    log('a', 'bench', 'work', 20, 10),
    log('a', 'bench', 'work', 20, 8),
    log('a', 'row', 'work', 60, 10), // תרגיל אחר
    log('b', 'bench', 'warmup', 15, 12), // רק חימום — האימון מדולג
    log('c', 'bench', 'work', 22.5, 8),
    log('c', 'bench', 'work', 22.5, 8),
    log('c', 'bench', 'work', 25, 5),
    log('d', 'bench', 'work', 30, 10), // אימון שלא נסגר
  ]

  it('ממוין מהישן לחדש גם כשהאימונים מגיעים הפוך', () => {
    const trend = exerciseTrend(BENCH, [sC, sOpen, sB, sA], sets)
    expect(trend.map((p) => p.date)).toEqual(['2026-08-01', '2026-08-05'])
    expect(trend[0].timestamp).toBeLessThan(trend[1].timestamp)
  })

  it('מחשב משקל עבודה, נפח וחזרות בסט הכבד', () => {
    const trend = exerciseTrend(BENCH, [sA, sB, sC, sOpen], sets)
    expect(trend[0]).toMatchObject({ workingWeightKg: 20, volumeKg: 720, topSetReps: 10 })
    // 22.5 חוזר פעמיים ולכן הוא משקל העבודה, אבל הסט הכבד הוא 25
    expect(trend[1]).toMatchObject({ workingWeightKg: 22.5, volumeKg: 970, topSetReps: 5 })
  })

  it('תרגיל בלי היסטוריה מחזיר רשימה ריקה', () => {
    expect(exerciseTrend(SQUAT, [sA, sB, sC], sets)).toEqual([])
  })

  it('משקל גוף — בלי משקל עבודה ובלי נפח, אבל עם חזרות', () => {
    const bwSets = [log('a', 'dips', 'work', 0, 12), log('a', 'dips', 'work', 0, 9)]
    const trend = exerciseTrend(DIPS, [sA], bwSets)
    expect(trend).toHaveLength(1)
    expect(trend[0]).toMatchObject({ workingWeightKg: null, volumeKg: 0, topSetReps: 12 })
  })
})
