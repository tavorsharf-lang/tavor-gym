import { describe, expect, it } from 'vitest'
import type { Exercise, SetLog, SetType, WeightMode } from '@/db/types'
import {
  setVolume,
  summarize,
  topWorkWeight,
  weightModeLookup,
  workSets,
  workingWeight,
} from '@/domain/volume'

/**
 * הקובץ הזה מחזיק את שני האינווריאנטים המרכזיים של האפליקציה, ועד היום הם
 * נבדקו רק בעקיפין — דרך בדיקת flow אחת ודרך stats:
 *
 *   1. ‏perSide מוכפל בשתיים *רק* כאן. בכל מסך אחר המספר הוא מה שרשום על
 *      המכונה, וכפילות של ההכפלה הזו הייתה מנפחת כל נפח וכל שיא.
 *   2. סט חימום שווה אפס. הוא נשמר ומוצג, אבל לא נספר בשום מקום.
 *
 * הבטחה שנשענת על מוסכמה בלבד היא הבטחה עד לרפקטור הבא.
 */

function set(over: Partial<SetLog> & { weightKg: number; reps: number }): SetLog {
  return {
    sessionId: 's',
    exerciseId: 'ex',
    setIndex: 0,
    type: 'work' as SetType,
    completedAt: 0,
    ...over,
  }
}

describe('setVolume', () => {
  it('total — משקל כפול חזרות', () => {
    expect(setVolume(set({ weightKg: 60, reps: 10 }), 'total')).toBe(600)
  })

  it('perSide — מוכפל בשתיים, וזו הנקודה היחידה שזה קורה בה', () => {
    expect(setVolume(set({ weightKg: 22.5, reps: 10 }), 'perSide')).toBe(450)
  })

  it('משקל גוף — אפס נפח, כי אין משקל חיצוני למדוד', () => {
    expect(setVolume(set({ weightKg: 0, reps: 30 }), 'bodyweight')).toBe(0)
  })

  it('סט חימום שווה אפס בכל מצב משקל', () => {
    for (const mode of ['total', 'perSide', 'bodyweight'] as WeightMode[]) {
      expect(setVolume(set({ weightKg: 60, reps: 10, type: 'warmup' }), mode)).toBe(0)
    }
  })

  it('מנקה שגיאות נקודה צפה', () => {
    expect(setVolume(set({ weightKg: 22.5, reps: 3 }), 'perSide')).toBe(135)
    expect(setVolume(set({ weightKg: 1.25, reps: 7 }), 'total')).toBe(8.75)
  })
})

describe('summarize', () => {
  const modeOf = (): WeightMode => 'total'

  it('סופר סטים, חזרות ונפח בנפרד לעבודה ולחימום', () => {
    const totals = summarize(
      [
        set({ weightKg: 40, reps: 12, type: 'warmup' }),
        set({ weightKg: 60, reps: 10 }),
        set({ weightKg: 60, reps: 8 }),
      ],
      modeOf
    )
    expect(totals.totalSets).toBe(3)
    expect(totals.warmupSets).toBe(1)
    expect(totals.workSets).toBe(2)
    // החזרות של החימום לא נספרות, וגם לא הנפח שלו
    expect(totals.workReps).toBe(18)
    expect(totals.volumeKg).toBe(1080)
  })

  it('רשימה ריקה מחזירה אפסים ולא NaN', () => {
    const totals = summarize([], modeOf)
    expect(totals).toEqual({
      volumeKg: 0,
      totalSets: 0,
      workSets: 0,
      warmupSets: 0,
      workReps: 0,
    })
  })

  it('תערובת מצבי משקל — כל תרגיל לפי שלו', () => {
    const lookup = (id: string): WeightMode | undefined =>
      id === 'per' ? 'perSide' : id === 'body' ? 'bodyweight' : 'total'
    const totals = summarize(
      [
        set({ exerciseId: 'tot', weightKg: 50, reps: 10 }),
        set({ exerciseId: 'per', weightKg: 20, reps: 10 }),
        set({ exerciseId: 'body', weightKg: 0, reps: 20 }),
      ],
      lookup
    )
    // 500 + 400 + 0
    expect(totals.volumeKg).toBe(900)
    expect(totals.workReps).toBe(40)
  })

  it('תרגיל שנמחק מהקטלוג נספר כ-total ולא נעלם', () => {
    const totals = summarize([set({ exerciseId: 'gone', weightKg: 30, reps: 10 })], () => undefined)
    expect(totals.volumeKg).toBe(300)
    expect(totals.workSets).toBe(1)
  })
})

describe('weightModeLookup', () => {
  it('מחזיר את המצב של התרגיל, ו-undefined למי שאינו בקטלוג', () => {
    const exercises = [
      { id: 'a', weightMode: 'perSide' },
      { id: 'b', weightMode: 'bodyweight' },
    ] as Exercise[]
    const lookup = weightModeLookup(exercises)
    expect(lookup('a')).toBe('perSide')
    expect(lookup('b')).toBe('bodyweight')
    expect(lookup('אין-כזה')).toBeUndefined()
  })
})

describe('workSets', () => {
  it('מסנן חימום וממיין לפי סדר הביצוע', () => {
    const rows = [
      set({ weightKg: 60, reps: 8, completedAt: 300 }),
      set({ weightKg: 40, reps: 12, type: 'warmup', completedAt: 100 }),
      set({ weightKg: 60, reps: 10, completedAt: 200 }),
    ]
    expect(workSets(rows).map((s) => s.completedAt)).toEqual([200, 300])
  })
})

describe('topWorkWeight', () => {
  it('הכבד ביותר בסטי עבודה, ביחידות המכונה', () => {
    expect(
      topWorkWeight([
        set({ weightKg: 60, reps: 10 }),
        set({ weightKg: 70, reps: 3 }),
        set({ weightKg: 80, reps: 12, type: 'warmup' }),
      ])
    ).toBe(70)
  })

  it('בלי סטי עבודה — null', () => {
    expect(topWorkWeight([set({ weightKg: 40, reps: 12, type: 'warmup' })])).toBeNull()
    expect(topWorkWeight([])).toBeNull()
  })
})

/**
 * "משקל העבודה" הוא מה שהמנוע מודד מולו, ולכן הוא חייב להיות עמיד לסט יחיד
 * חריג — ניסיון שיא או דרופסט. זו הסיבה שהוא השכיח ולא המקסימלי.
 */
describe('workingWeight', () => {
  it('המשקל השכיח, לא הכבד ביותר', () => {
    expect(
      workingWeight([
        set({ weightKg: 60, reps: 12 }),
        set({ weightKg: 60, reps: 12 }),
        set({ weightKg: 60, reps: 10 }),
        set({ weightKg: 80, reps: 2 }),
      ])
    ).toBe(60)
  })

  it('בתיקו — הכבד יותר', () => {
    expect(
      workingWeight([
        set({ weightKg: 50, reps: 10 }),
        set({ weightKg: 60, reps: 10 }),
      ])
    ).toBe(60)
  })

  it('מתעלם מחימום', () => {
    expect(
      workingWeight([
        set({ weightKg: 20, reps: 15, type: 'warmup' }),
        set({ weightKg: 20, reps: 15, type: 'warmup' }),
        set({ weightKg: 60, reps: 10 }),
      ])
    ).toBe(60)
  })

  it('בלי סטי עבודה — null', () => {
    expect(workingWeight([])).toBeNull()
    expect(workingWeight([set({ weightKg: 40, reps: 12, type: 'warmup' })])).toBeNull()
  })

  it('סט אחד — הוא עצמו', () => {
    expect(workingWeight([set({ weightKg: 47.5, reps: 9 })])).toBe(47.5)
  })
})
