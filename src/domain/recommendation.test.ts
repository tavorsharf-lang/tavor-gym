import { describe, expect, it } from 'vitest'
import type { Exercise, Rating, Rir, SetLog, SetType } from '@/db/types'
import {
  lastSessionSetsText,
  recommendWeight,
  type ExerciseSessionSummary,
  type WeightRecommendation,
} from '@/domain/recommendation'

// ─── פיקסטורות ─────────────────────────────────────────────────────────────

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

/** [משקל, חזרות] או [משקל, חזרות, סוג] */
type SetSpec = [number, number] | [number, number, SetType]

function makeSession(
  id: string,
  startedAt: number,
  specs: SetSpec[],
  rating: { rating: Rating; rir: Rir | null } | null = null
): ExerciseSessionSummary {
  const sets: SetLog[] = specs.map(([weightKg, reps, type], i) => ({
    sessionId: id,
    exerciseId: 'ex',
    setIndex: i,
    type: type ?? 'work',
    weightKg,
    reps,
    completedAt: startedAt + i * 60_000,
  }))
  return { sessionId: id, date: '2026-08-01', startedAt, sets, rating }
}

const rate = (rating: Rating, rir: Rir | null = null) => ({ rating, rir })

// ─── טבלת המקרים ───────────────────────────────────────────────────────────

interface Case {
  name: string
  exercise: Exercise
  history: ExerciseSessionSummary[]
  expected: Pick<WeightRecommendation, 'action' | 'weightKg' | 'tone'>
  reasonIncludes?: string[]
}

const TOP_SETS: SetSpec[] = [
  [60, 12],
  [60, 12],
  [60, 12],
]

const CASES: Case[] = [
  {
    name: 'אין היסטוריה — מציע את משקל הזריעה',
    exercise: makeExercise(),
    history: [],
    expected: { action: 'none', weightKg: 60, tone: 'neutral' },
    reasonIncludes: ['60', 'משקל ההתחלה'],
  },
  {
    name: 'אין היסטוריה ואין משקל זריעה',
    exercise: makeExercise({ seedWeightKg: null }),
    history: [],
    expected: { action: 'none', weightKg: null, tone: 'neutral' },
  },
  {
    name: 'תרגיל משקל גוף — אין המלצת משקל',
    exercise: makeExercise({ weightMode: 'bodyweight', weightIncrementKg: 0, seedWeightKg: null }),
    history: [makeSession('s1', 1000, [[0, 15]], rate(1))],
    expected: { action: 'none', weightKg: null, tone: 'neutral' },
    reasonIncludes: ['משקל גוף'],
  },
  {
    name: 'ראש הטווח בדירוג קל — עולים קפיצה אחת',
    exercise: makeExercise(),
    history: [makeSession('s1', 1000, TOP_SETS, rate(1))],
    expected: { action: 'increase', weightKg: 62.5, tone: 'up' },
    reasonIncludes: ['62.5', 'קל'],
  },
  {
    name: 'ראש הטווח בדירוג בינוני — עולים קפיצה אחת',
    exercise: makeExercise(),
    history: [makeSession('s1', 1000, TOP_SETS, rate(2))],
    expected: { action: 'increase', weightKg: 62.5, tone: 'up' },
    reasonIncludes: ['בינוני', '62.5'],
  },
  {
    name: 'ראש הטווח בלי דירוג בכלל — עדיין עולים',
    exercise: makeExercise(),
    history: [makeSession('s1', 1000, TOP_SETS, null)],
    expected: { action: 'increase', weightKg: 62.5, tone: 'up' },
    reasonIncludes: ['ראש הטווח'],
  },
  {
    name: 'ראש הטווח אבל היה קשה — נשארים',
    exercise: makeExercise(),
    history: [makeSession('s1', 1000, TOP_SETS, rate(3))],
    expected: { action: 'hold', weightKg: 60, tone: 'steady' },
    reasonIncludes: ['קשה', '60'],
  },
  {
    name: 'דירוג קל אבל RIR 0 — הכשל גובר, נשארים',
    exercise: makeExercise(),
    history: [makeSession('s1', 1000, TOP_SETS, rate(1, 0))],
    expected: { action: 'hold', weightKg: 60, tone: 'steady' },
    reasonIncludes: ['ראש הטווח'],
  },
  {
    name: 'קל עם RIR 3 — קפיצה כפולה',
    exercise: makeExercise(),
    history: [makeSession('s1', 1000, TOP_SETS, rate(1, 3))],
    expected: { action: 'increase', weightKg: 65, tone: 'up' },
    reasonIncludes: ['קל מדי', '3', '65'],
  },
  {
    name: 'קל עם RIR 4 — גם כן קפיצה כפולה',
    exercise: makeExercise(),
    history: [makeSession('s1', 1000, TOP_SETS, rate(1, 4))],
    expected: { action: 'increase', weightKg: 65, tone: 'up' },
    reasonIncludes: ['קל מדי', '4'],
  },
  {
    name: 'קל עם RIR 2 — קפיצה רגילה בלבד',
    exercise: makeExercise(),
    history: [makeSession('s1', 1000, TOP_SETS, rate(1, 2))],
    expected: { action: 'increase', weightKg: 62.5, tone: 'up' },
  },
  {
    name: 'נפילה אחת מתחת לטווח — נשארים על אותו משקל',
    exercise: makeExercise(),
    history: [
      makeSession(
        's2',
        2000,
        [
          [60, 9],
          [60, 8],
          [60, 6],
        ],
        rate(3)
      ),
      makeSession('s1', 1000, TOP_SETS, rate(2)),
    ],
    expected: { action: 'hold', weightKg: 60, tone: 'steady' },
    reasonIncludes: ['6', '8', '60'],
  },
  {
    name: 'שתי נפילות ברצף — יורדים 10% ומעגלים למטה',
    exercise: makeExercise(),
    history: [
      makeSession(
        's2',
        2000,
        [
          [60, 7],
          [60, 6],
        ],
        rate(3)
      ),
      makeSession(
        's1',
        1000,
        [
          [60, 8],
          [60, 7],
        ],
        rate(3)
      ),
    ],
    expected: { action: 'decrease', weightKg: 52.5, tone: 'down' },
    reasonIncludes: ['52.5', 'ברצף'],
  },
  {
    name: 'בתוך הטווח — צוברים חזרות לפני משקל',
    exercise: makeExercise(),
    history: [
      makeSession(
        's1',
        1000,
        [
          [60, 10],
          [60, 10],
          [60, 9],
        ],
        rate(2)
      ),
    ],
    expected: { action: 'hold', weightKg: 60, tone: 'steady' },
    reasonIncludes: ['10', '12'],
  },
  {
    name: 'אימון עם סטי חימום בלבד מדולג לגמרי',
    exercise: makeExercise(),
    history: [
      makeSession('s2', 2000, [[35, 12, 'warmup']], rate(3)),
      makeSession('s1', 1000, TOP_SETS, rate(2)),
    ],
    expected: { action: 'increase', weightKg: 62.5, tone: 'up' },
  },
  {
    name: 'כל ההיסטוריה חימום — כאילו אין היסטוריה',
    exercise: makeExercise(),
    history: [makeSession('s1', 1000, [[35, 12, 'warmup']], rate(1))],
    expected: { action: 'none', weightKg: 60, tone: 'neutral' },
  },
  {
    name: 'perSide — המשקל המוצע נשאר ביחידות המכונה',
    exercise: makeExercise({ weightMode: 'perSide', seedWeightKg: 22.5 }),
    history: [
      makeSession(
        's1',
        1000,
        [
          [22.5, 12],
          [22.5, 12],
        ],
        rate(2)
      ),
    ],
    expected: { action: 'increase', weightKg: 25, tone: 'up' },
    reasonIncludes: ['25 ק״ג כל צד'],
  },
  {
    name: 'משקל שלא על הרשת — התוצאה נוחתת על קפיצה אמיתית',
    exercise: makeExercise(),
    history: [
      makeSession(
        's1',
        1000,
        [
          [61, 12],
          [61, 12],
        ],
        rate(1, 3)
      ),
    ],
    expected: { action: 'increase', weightKg: 65, tone: 'up' },
  },
  {
    name: 'קפיצות של 5 ק״ג — ירידה מתעגלת לרשת של 5',
    exercise: makeExercise({ weightIncrementKg: 5, targetReps: { min: 6, max: 10 } }),
    history: [
      makeSession('s2', 2000, [[100, 5]], rate(3)),
      makeSession('s1', 1000, [[100, 5]], rate(3)),
    ],
    expected: { action: 'decrease', weightKg: 90, tone: 'down' },
  },
]

describe('recommendWeight', () => {
  for (const c of CASES) {
    it(c.name, () => {
      const result = recommendWeight(c.exercise, c.history)
      expect(result.action).toBe(c.expected.action)
      expect(result.weightKg).toBe(c.expected.weightKg)
      expect(result.tone).toBe(c.expected.tone)
      for (const needle of c.reasonIncludes ?? []) {
        expect(result.reason).toContain(needle)
      }
    })
  }

  it('כל הנימוקים בעברית, משפט אחד, בלי סימני קריאה', () => {
    for (const c of CASES) {
      const { reason } = recommendWeight(c.exercise, c.history)
      expect(reason.length).toBeGreaterThan(10)
      expect(reason).not.toContain('!')
      // משפט אחד — בלי נקודה חוצצת ובלי שורה שנייה (נקודה עשרונית מותרת)
      expect(reason).not.toContain('. ')
      expect(reason).not.toContain('\n')
    }
  })

  it('כל משקל מוצע יושב על מכפלה של הקפיצה', () => {
    for (const c of CASES) {
      const { weightKg } = recommendWeight(c.exercise, c.history)
      const inc = c.exercise.weightIncrementKg
      if (weightKg === null || inc <= 0) continue
      expect(Math.round((weightKg / inc) * 1000) % 1000).toBe(0)
    }
  })

  it('לא משנה את הקלט', () => {
    const exercise = makeExercise()
    const history = [makeSession('s1', 1000, TOP_SETS, rate(2))]
    const snapshot = JSON.stringify(history)
    recommendWeight(exercise, history)
    expect(JSON.stringify(history)).toBe(snapshot)
    expect(history[0].sets).toHaveLength(3)
  })

  it('היסטוריה שהגיעה בסדר הפוך עדיין מזהה את האימון האחרון', () => {
    const exercise = makeExercise()
    const older = makeSession('s1', 1000, TOP_SETS, rate(2))
    const newer = makeSession(
      's2',
      2000,
      [
        [60, 9],
        [60, 9],
      ],
      rate(2)
    )
    expect(recommendWeight(exercise, [older, newer]).action).toBe('hold')
  })
})

describe('lastSessionSetsText', () => {
  it('מציג רק סטי עבודה לפי סדר הביצוע', () => {
    const s = makeSession('s1', 1000, [
      [35, 12, 'warmup'],
      [60, 10],
      [60, 9],
      [55, 8],
    ])
    expect(lastSessionSetsText(s, 'total')).toBe('60×10 · 60×9 · 55×8')
  })

  it('משקל גוף — רק חזרות', () => {
    const s = makeSession('s1', 1000, [
      [0, 15],
      [0, 12],
    ])
    expect(lastSessionSetsText(s, 'bodyweight')).toBe('15 חזרות · 12 חזרות')
  })

  it('perSide מוצג כמו שהוא, בלי הכפלה', () => {
    const s = makeSession('s1', 1000, [[22.5, 10]])
    expect(lastSessionSetsText(s, 'perSide')).toBe('22.5×10')
  })
})
