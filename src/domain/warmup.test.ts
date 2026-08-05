import { describe, expect, it } from 'vitest'
import type { Exercise, MuscleGroup } from '@/db/types'
import { groupsTouchedFrom, suggestWarmup, type WarmupContext } from '@/domain/warmup'

function makeExercise(over: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex',
    name: 'לחיצת חזה',
    muscleGroup: 'chest',
    subTarget: 'חזה',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 90,
    targetSets: 3,
    targetReps: { min: 8, max: 12 },
    cues: [],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 60,
    isActive: true,
    order: 1,
    createdAt: 0,
    updatedAt: 0,
    ...over,
  }
}

function makeContext(over: Partial<WarmupContext> = {}): WarmupContext {
  return {
    exercise: makeExercise(),
    touchedGroups: new Set<MuscleGroup>(),
    plannedWeightKg: 60,
    enabled: true,
    percent: 55,
    ...over,
  }
}

describe('suggestWarmup — מתי לא מציעים', () => {
  const NULL_CASES: { name: string; ctx: WarmupContext }[] = [
    { name: 'ההגדרה כבויה', ctx: makeContext({ enabled: false }) },
    {
      name: 'כבר עבדנו על קבוצת השריר הזו באימון',
      ctx: makeContext({ touchedGroups: new Set<MuscleGroup>(['chest']) }),
    },
    {
      name: 'תרגיל משקל גוף',
      ctx: makeContext({
        exercise: makeExercise({ weightMode: 'bodyweight', weightIncrementKg: 0 }),
      }),
    },
    { name: 'אין משקל עבודה ידוע', ctx: makeContext({ plannedWeightKg: null }) },
    { name: 'משקל עבודה אפס', ctx: makeContext({ plannedWeightKg: 0 }) },
  ]

  for (const c of NULL_CASES) {
    it(c.name, () => {
      expect(suggestWarmup(c.ctx)).toBeNull()
    })
  }

  it('קבוצת שריר אחרת שכבר נגענו בה לא חוסמת', () => {
    const ctx = makeContext({ touchedGroups: new Set<MuscleGroup>(['back', 'biceps']) })
    expect(suggestWarmup(ctx)).not.toBeNull()
  })
})

describe('suggestWarmup — ההצעה עצמה', () => {
  it('55% מ-60 מתעגל למטה לקפיצה של 2.5', () => {
    const s = suggestWarmup(makeContext())
    expect(s).not.toBeNull()
    expect(s?.weightKg).toBe(32.5) // 33 → 32.5
    expect(s?.reps).toBe(12)
    expect(s?.reason).toContain('לחזה')
    expect(s?.reason).toContain('55%')
  })

  it('לא יורדים מתחת לקפיצה אחת', () => {
    const s = suggestWarmup(makeContext({ plannedWeightKg: 2.5, percent: 10 }))
    expect(s?.weightKg).toBe(2.5)
  })

  it('חזרות מוגבלות לתקרה של 15', () => {
    const s = suggestWarmup(
      makeContext({ exercise: makeExercise({ targetReps: { min: 12, max: 20 } }) })
    )
    expect(s?.reps).toBe(15)
  })

  it('חזרות מוגבלות לרצפה של 8', () => {
    const s = suggestWarmup(
      makeContext({ exercise: makeExercise({ targetReps: { min: 3, max: 5 } }) })
    )
    expect(s?.reps).toBe(8)
  })

  it('perSide — המשקל נשאר ביחידות המכונה', () => {
    const s = suggestWarmup(
      makeContext({
        exercise: makeExercise({ muscleGroup: 'back', weightMode: 'perSide' }),
        plannedWeightKg: 22.5,
      })
    )
    expect(s?.weightKg).toBe(10) // 12.375 → 10 כלפי מטה על רשת 2.5
    expect(s?.reason).toContain('לגב')
  })

  it('קפיצות של 5 ק״ג נוחתות על הרשת', () => {
    const s = suggestWarmup(
      makeContext({
        exercise: makeExercise({ weightIncrementKg: 5 }),
        plannedWeightKg: 100,
      })
    )
    expect(s?.weightKg).toBe(55)
  })
})

describe('groupsTouchedFrom', () => {
  const GROUP_OF: Record<string, MuscleGroup> = {
    'bench-press': 'chest',
    'lat-pulldown': 'back',
    'db-curl': 'biceps',
  }
  const lookup = (id: string): MuscleGroup | undefined => GROUP_OF[id]

  it('אוסף קבוצות ייחודיות ומתעלם ממזהים לא מוכרים', () => {
    const sets = [
      { exerciseId: 'bench-press' },
      { exerciseId: 'bench-press' },
      { exerciseId: 'db-curl' },
      { exerciseId: 'unknown-exercise' },
    ]
    expect(groupsTouchedFrom(sets, lookup)).toEqual(new Set<MuscleGroup>(['chest', 'biceps']))
  })

  it('רשימה ריקה מחזירה קבוצה ריקה', () => {
    expect(groupsTouchedFrom([], lookup).size).toBe(0)
  })
})
