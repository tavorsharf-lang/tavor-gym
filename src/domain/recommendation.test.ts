import { describe, expect, it } from 'vitest'
import type { Exercise, Rating, Rir, SetLog, SetType } from '@/db/types'
import {
  lastSessionSetsText,
  lastWorkedSession,
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
    name: 'משקל גוף שהגיע לראש הטווח — יעד קונקרטי גבוה יותר',
    exercise: makeExercise({ weightMode: 'bodyweight', weightIncrementKg: 0, seedWeightKg: null }),
    history: [makeSession('s1', 1000, [[0, 15]], rate(1))],
    expected: { action: 'increase', weightKg: null, tone: 'up' },
    reasonIncludes: ['13'],
  },
  {
    name: 'משקל גוף מתחת לראש הטווח — היעד הוא הסט הטוב של הפעם הקודמת',
    exercise: makeExercise({ weightMode: 'bodyweight', weightIncrementKg: 0, seedWeightKg: null }),
    history: [makeSession('s1', 1000, [[0, 9], [0, 7]], rate(2))],
    expected: { action: 'hold', weightKg: null, tone: 'steady' },
    reasonIncludes: ['9'],
  },
  {
    name: 'משקל גוף בלי היסטוריה — היעד הוא תחתית הטווח',
    exercise: makeExercise({ weightMode: 'bodyweight', weightIncrementKg: 0, seedWeightKg: null }),
    history: [],
    expected: { action: 'none', weightKg: null, tone: 'neutral' },
    reasonIncludes: ['8'],
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
    // הנימוק מדבר על הסט החלש (9) ולא על החזק (10): "עשית 10, היעד 12" היה
    // סותר את עצמו כשסט אחר כבר הגיע לראש הטווח
    reasonIncludes: ['9', '12'],
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

describe('טווח החזרות של התוכנית גובר על זה שבקטלוג', () => {
  it('שלושה סטים של 8 בטווח תוכנית 5–8 מזכים בעלייה, למרות שהקטלוג אומר 8–12', () => {
    const exercise = makeExercise({ targetReps: { min: 8, max: 12 }, weightIncrementKg: 5 })
    const history = [
      makeSession(
        's1',
        1000,
        [
          [160, 8],
          [160, 8],
          [160, 8],
        ],
        rate(2)
      ),
    ]

    // בלי הפרמטר — הטווח של הקטלוג, ולכן עדיין לא הגענו לראש
    expect(recommendWeight(exercise, history).action).toBe('hold')

    // עם הטווח שבתוכנית — 8 הוא ראש הטווח, ועולים
    const planned = recommendWeight(exercise, history, { min: 5, max: 8 })
    expect(planned.action).toBe('increase')
    expect(planned.weightKg).toBe(165)
    expect(planned.reason).toContain('8')
  })

  it('lastWorkedSession מדלג על אימון שהיה בו רק חימום', () => {
    const warmupOnly = makeSession('s2', 2000, [])
    warmupOnly.sets = [
      {
        sessionId: 's2',
        exerciseId: 'ex',
        setIndex: 0,
        type: 'warmup',
        weightKg: 30,
        reps: 12,
        completedAt: 2000,
      },
    ]
    const real = makeSession('s1', 1000, [[60, 10]], rate(2))

    expect(lastWorkedSession([warmupOnly, real])?.sessionId).toBe('s1')
    expect(lastWorkedSession([])).toBeNull()
  })
})

const DAY = 86_400_000

/**
 * המנוע היה עיוור לזמן: אימון אחרון מלפני חודשיים טופל בדיוק כמו מלפני יומיים.
 * באפליקציה שכל הרעיון שלה הוא חזרה הדרגתית אחרי הפסקה, זו בדיוק הטעות שהיא
 * באה למנוע — "הגעת לראש הטווח, עולים ל-65" אחרי חופשה.
 */
describe('ריסון אחרי הפסקה', () => {
  const exercise = makeExercise()
  const topSets = makeSession('s1', 1000, TOP_SETS, rate(1))

  it('בלי now המנוע מתנהג כמו קודם', () => {
    expect(recommendWeight(exercise, [topSets]).action).toBe('increase')
  })

  it('שבוע אחרי — עדיין עולים', () => {
    const now = 1000 + 7 * DAY
    expect(recommendWeight(exercise, [topSets], undefined, now).action).toBe('increase')
  })

  it('שלושה שבועות — יורדים מדרגה במקום לעלות', () => {
    const now = 1000 + 22 * DAY
    const r = recommendWeight(exercise, [topSets], undefined, now)
    expect(r.action).toBe('decrease')
    // 60 → 90% → 54 → מעוגל כלפי מטה לקפיצה של 2.5
    expect(r.weightKg).toBe(52.5)
    expect(r.reason).toContain('שבועות')
  })

  it('חודשיים — יורדים הרבה יותר', () => {
    const now = 1000 + 60 * DAY
    const r = recommendWeight(exercise, [topSets], undefined, now)
    expect(r.action).toBe('decrease')
    expect(r.weightKg).toBe(45)
  })

  it('לא יורד מתחת לקפיצה אחת', () => {
    const light = makeExercise({ weightIncrementKg: 5 })
    const session = makeSession('s1', 1000, [[5, 12], [5, 12], [5, 12]], rate(1))
    const r = recommendWeight(light, [session], undefined, 1000 + 90 * DAY)
    expect(r.weightKg).toBe(5)
  })
})

/**
 * האפליקציה עצמה מעודדת ניסיון שיא — היא חוגגת maxWeight בקונפטי באמצע הסט.
 * הסינגל הזה נרשם כסט עבודה (אין סוג אחר), והוא היה מוריד את "הסט הנמוך"
 * מתחת לטווח: המלצת עלייה הפכה להקפאה, ופעמיים ברצף להורדת 10%.
 */
describe('סטים חריגים לא שוברים את ההמלצה', () => {
  const exercise = makeExercise({ targetReps: { min: 8, max: 12 } })

  it('ניסיון שיא כבד בסוף לא מבטל עלייה', () => {
    const session = makeSession(
      's1',
      1000,
      [
        [60, 12],
        [60, 12],
        [60, 12],
        [70, 3],
      ],
      rate(1)
    )
    const r = recommendWeight(exercise, [session])
    expect(r.action).toBe('increase')
  })

  it('דרופסט קל בסוף לא מבטל עלייה', () => {
    const session = makeSession(
      's1',
      1000,
      [
        [60, 12],
        [60, 12],
        [40, 8],
      ],
      rate(1)
    )
    expect(recommendWeight(exercise, [session]).action).toBe('increase')
  })

  it('שני אימונים עם סינגל שיא לא מייצרים הורדת 10%', () => {
    const older = makeSession('s1', 1000, [[60, 12], [60, 12], [80, 2]], rate(1))
    const newer = makeSession('s2', 2000, [[60, 12], [60, 12], [80, 2]], rate(1))
    expect(recommendWeight(exercise, [older, newer]).action).toBe('increase')
  })

  it('נפילה אמיתית במשקל העבודה עדיין נתפסת', () => {
    const session = makeSession('s1', 1000, [[60, 12], [60, 6], [70, 3]], rate(2))
    expect(recommendWeight(exercise, [session]).action).toBe('hold')
  })
})
