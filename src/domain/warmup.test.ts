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
  const EMPTY_CASES: { name: string; ctx: WarmupContext }[] = [
    { name: 'ההגדרה כבויה', ctx: makeContext({ enabled: false }) },
    {
      name: 'תרגיל משקל גוף',
      ctx: makeContext({
        exercise: makeExercise({ weightMode: 'bodyweight', weightIncrementKg: 0 }),
      }),
    },
    { name: 'אין משקל עבודה ידוע', ctx: makeContext({ plannedWeightKg: null }) },
    { name: 'משקל עבודה אפס', ctx: makeContext({ plannedWeightKg: 0 }) },
  ]

  for (const c of EMPTY_CASES) {
    it(c.name, () => {
      expect(suggestWarmup(c.ctx)).toEqual([])
    })
  }

  it('קבוצת שריר אחרת שכבר נגענו בה לא חוסמת', () => {
    const ctx = makeContext({ touchedGroups: new Set<MuscleGroup>(['back', 'biceps']) })
    expect(suggestWarmup(ctx).length).toBeGreaterThan(0)
  })
})

/**
 * התרגיל השני באותה קבוצת שריר. השריר כבר חם — מה שלא מוכר הוא המכונה, ולכן
 * ההצעה לא נעלמת אלא מתכווצת לסט הכרות אחד וקל.
 */
describe('suggestWarmup — סט הכרות כשהשריר כבר חומם', () => {
  const warm = makeContext({ touchedGroups: new Set<MuscleGroup>(['chest']) })

  it('סט אחד, לא רמפה ולא ריק', () => {
    expect(suggestWarmup(warm).length).toBe(1)
  })

  it('40% מ-60 מתעגל למטה לקפיצה של 2.5', () => {
    const [s] = suggestWarmup(warm)
    expect(s.weightKg).toBe(22.5) // 24 → 22.5
  })

  it('קל מהחימום המלא של אותו תרגיל', () => {
    // מול תרגיל שאינו מקבל רמפה, כדי שההשוואה תהיה סט מול סט
    const [primer] = suggestWarmup(lightContext({ touchedGroups: new Set<MuscleGroup>(['shoulders']) }))
    const [full] = suggestWarmup(lightContext())
    expect(primer.weightKg).toBeLessThan(full.weightKg)
    expect(primer.reps).toBeLessThan(full.reps)
  })

  it('אחוז חימום נמוך מ-40 בהגדרות גובר — ההכרות לא כבדה מהחימום', () => {
    const [primer] = suggestWarmup(makeContext({ ...warm, percent: 40, plannedWeightKg: 100 }))
    const [full] = suggestWarmup(makeContext({ percent: 40, plannedWeightKg: 100 }))
    expect(primer.weightKg).toBeLessThanOrEqual(full.weightKg)
  })

  it('הנימוק אומר שזו המכונה ולא השריר', () => {
    const [s] = suggestWarmup(warm)
    expect(s.reason).toContain('מכונה')
    expect(s.reason).toContain('חזה')
  })

  it('חזרות מוגבלות לתקרה של 10 ולרצפה של 6', () => {
    const many = suggestWarmup(
      makeContext({ ...warm, exercise: makeExercise({ targetReps: { min: 12, max: 20 } }) })
    )
    expect(many[0].reps).toBe(10)
    const few = suggestWarmup(
      makeContext({ ...warm, exercise: makeExercise({ targetReps: { min: 3, max: 5 } }) })
    )
    expect(few[0].reps).toBe(6)
  })

  it('תרגיל כבד שהיה מקבל רמפה מקבל סט הכרות אחד', () => {
    const plan = suggestWarmup(
      makeContext({
        exercise: makeExercise({ muscleGroup: 'legs', weightIncrementKg: 5 }),
        touchedGroups: new Set<MuscleGroup>(['legs']),
        plannedWeightKg: 160,
      })
    )
    expect(plan.length).toBe(1)
    expect(plan[0].weightKg).toBe(60) // 40% מ-160
  })

  it('משקל גוף עדיין בלי הצעה, גם כשהשריר חם', () => {
    expect(
      suggestWarmup(
        makeContext({
          exercise: makeExercise({ weightMode: 'bodyweight', weightIncrementKg: 0 }),
          touchedGroups: new Set<MuscleGroup>(['chest']),
        })
      )
    ).toEqual([])
  })
})

/** תרגיל שאינו כבד מספיק לרמפה — סט אחד, כמו שהיה תמיד */
function lightContext(over: Partial<WarmupContext> = {}): WarmupContext {
  return makeContext({ exercise: makeExercise({ muscleGroup: 'shoulders' }), ...over })
}

describe('suggestWarmup — סט אחד לתרגיל שאינו כבד', () => {
  it('55% מ-60 מתעגל למטה לקפיצה של 2.5', () => {
    const [s, ...rest] = suggestWarmup(lightContext())
    expect(rest).toEqual([])
    expect(s.weightKg).toBe(32.5) // 33 → 32.5
    expect(s.reps).toBe(12)
    expect(s.reason).toContain('לכתפיים')
    expect(s.reason).toContain('55%')
  })

  it('לא יורדים מתחת לקפיצה אחת', () => {
    const [s] = suggestWarmup(lightContext({ plannedWeightKg: 2.5, percent: 10 }))
    expect(s.weightKg).toBe(2.5)
  })

  it('חזרות מוגבלות לתקרה של 15', () => {
    const [s] = suggestWarmup(
      lightContext({
        exercise: makeExercise({ muscleGroup: 'shoulders', targetReps: { min: 12, max: 20 } }),
      })
    )
    expect(s.reps).toBe(15)
  })

  it('חזרות מוגבלות לרצפה של 8', () => {
    const [s] = suggestWarmup(
      lightContext({
        exercise: makeExercise({ muscleGroup: 'shoulders', targetReps: { min: 3, max: 5 } }),
      })
    )
    expect(s.reps).toBe(8)
  })

  it('perSide — המשקל נשאר ביחידות המכונה', () => {
    const [s] = suggestWarmup(
      makeContext({
        exercise: makeExercise({ muscleGroup: 'back', weightMode: 'perSide' }),
        plannedWeightKg: 22.5,
      })
    )
    expect(s.weightKg).toBe(10) // 12.375 → 10 כלפי מטה על רשת 2.5
    expect(s.reason).toContain('לגב')
  })

  it('תרגיל כבד בקבוצה קטנה עדיין מקבל סט אחד', () => {
    const plan = suggestWarmup(
      makeContext({
        exercise: makeExercise({ muscleGroup: 'abs', weightIncrementKg: 5 }),
        plannedWeightKg: 180,
      })
    )
    expect(plan.length).toBe(1)
  })

  it('כבלים לא מקבלים רמפה', () => {
    const plan = suggestWarmup(
      makeContext({
        exercise: makeExercise({ muscleGroup: 'back', equipment: 'cables', weightIncrementKg: 5 }),
        plannedWeightKg: 150,
      })
    )
    expect(plan.length).toBe(1)
  })
})

/**
 * לחיצת רגליים ב-160: קפיצה מסט חימום בודד ישר למשקל העבודה דלה מקצועית —
 * מה שצריך הכנה שם הוא המפרק ומערכת העצבים, לא השריר.
 */
describe('suggestWarmup — רמפה לתרגיל מורכב כבד', () => {
  const legPress = makeContext({
    exercise: makeExercise({ muscleGroup: 'legs', weightIncrementKg: 5 }),
    plannedWeightKg: 160,
  })

  it('שלושה סטים עולים במשקל ויורדים בחזרות', () => {
    const plan = suggestWarmup(legPress)
    // 40/60/80 אחוז מ-160, כל אחד מעוגל כלפי מטה לרשת של 5
    expect(plan.map((s) => s.weightKg)).toEqual([60, 95, 125])
    expect(plan.map((s) => s.reps)).toEqual([10, 6, 3])
  })

  it('כל שלב כבד מקודמו, והאחרון עדיין קל ממשקל העבודה', () => {
    const plan = suggestWarmup(legPress)
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].weightKg).toBeGreaterThan(plan[i - 1].weightKg)
    }
    expect(plan[plan.length - 1].weightKg).toBeLessThan(160)
  })

  it('הנימוק של הראשון מסביר שזו רמפה ולאיזה שריר', () => {
    const plan = suggestWarmup(legPress)
    expect(plan[0].reason).toContain('רמפ')
    expect(plan[0].reason).toContain('לרגליים')
  })

  it('ציוד עם קפיצה גסה לא מייצר שני שלבים באותו משקל', () => {
    const plan = suggestWarmup(
      makeContext({
        exercise: makeExercise({ muscleGroup: 'legs', weightIncrementKg: 20 }),
        plannedWeightKg: 400,
      })
    )
    expect(new Set(plan.map((s) => s.weightKg)).size).toBe(plan.length)
  })
})

describe('groupsTouchedFrom', () => {
  const GROUP_OF: Record<string, MuscleGroup> = {
    'bench-press': 'chest',
    'lat-pulldown': 'back',
    'db-curl': 'biceps',
  }
  const groupOf = (id: string): MuscleGroup | undefined => GROUP_OF[id]

  it('אוסף את הקבוצות של הסטים שתועדו, בלי כפילות', () => {
    const sets = [
      { exerciseId: 'bench-press' },
      { exerciseId: 'bench-press' },
      { exerciseId: 'lat-pulldown' },
    ]
    expect(groupsTouchedFrom(sets, groupOf)).toEqual(new Set(['chest', 'back']))
  })

  it('מתעלם מתרגיל שאינו בקטלוג', () => {
    expect(groupsTouchedFrom([{ exerciseId: 'אין-כזה' }], groupOf)).toEqual(new Set())
  })

  it('בלי סטים — קבוצה ריקה', () => {
    expect(groupsTouchedFrom([], groupOf)).toEqual(new Set())
  })
})
