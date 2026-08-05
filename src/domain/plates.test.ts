import { describe, expect, it } from 'vitest'
import type { Exercise, PlateSettings } from '@/db/types'
import { calcPlates } from './plates'

type PlateExercise = Pick<Exercise, 'weightMode' | 'usesPlates' | 'barWeightKg'>

/** סט הפלטות של חדר הכושר, כמו בברירת המחדל */
const GYM: PlateSettings = { barWeightKg: 20, perSideKg: [20, 15, 10, 5, 2.5, 1.25] }

/** מכונת פלטות שהמספר עליה כבר לכל צד */
const perSideMachine: PlateExercise = { weightMode: 'perSide', usesPlates: true, barWeightKg: null }
/** מוט אולימפי 20 ק״ג */
const bar20: PlateExercise = { weightMode: 'total', usesPlates: true, barWeightKg: 20 }
/** מזחלת שהתצוגה שלה סופרת רק פלטות */
const sled0: PlateExercise = { weightMode: 'total', usesPlates: true, barWeightKg: 0 }
/** תרגיל שלא הגדיר משקל בסיס — נופל להגדרות */
const barFromSettings: PlateExercise = { weightMode: 'total', usesPlates: true, barWeightKg: null }

describe('calcPlates — מצב perSide', () => {
  it('מפרק את המספר כמו שהוא, בלי להחסיר מוט ובלי לחלק', () => {
    const r = calcPlates(25, perSideMachine, GYM)
    expect(r).not.toBeNull()
    expect(r?.perSideKg).toBe(25)
    expect(r?.plates).toEqual([20, 5])
    expect(r?.exact).toBe(true)
    expect(r?.text).toBe('לכל צד: 20 + 5')
    expect(r?.error).toBeNull()
  })

  it('מחזיר null כשהתרגיל לא משתמש בפלטות', () => {
    expect(calcPlates(25, { ...perSideMachine, usesPlates: false }, GYM)).toBeNull()
  })

  it('מחזיר null לתרגיל משקל גוף', () => {
    expect(calcPlates(0, { weightMode: 'bodyweight', usesPlates: true, barWeightKg: null }, GYM)).toBeNull()
  })
})

describe('calcPlates — מצב total', () => {
  it('מחסיר מוט 20 ומחלק לשניים', () => {
    const r = calcPlates(60, bar20, GYM)
    expect(r?.perSideKg).toBe(20)
    expect(r?.plates).toEqual([20])
    expect(r?.exact).toBe(true)
    expect(r?.text).toBe('לכל צד: 20')
  })

  it('מזחלת עם משקל בסיס 0 — כל המספר הוא פלטות', () => {
    const r = calcPlates(160, sled0, GYM)
    expect(r?.perSideKg).toBe(80)
    expect(r?.plates).toEqual([20, 20, 20, 20])
    expect(r?.grouped).toEqual([{ kg: 20, count: 4 }])
    expect(r?.text).toBe('לכל צד: 4×20')
  })

  it('נופל למוט מההגדרות כשלתרגיל אין משקל בסיס', () => {
    const r = calcPlates(60, barFromSettings, GYM)
    expect(r?.perSideKg).toBe(20)
    expect(r?.exact).toBe(true)
  })

  it('משקל מתחת למוט הריק מחזיר שגיאה', () => {
    const r = calcPlates(15, barFromSettings, GYM)
    expect(r?.error).toBe('המשקל קטן מהמוט הריק')
    expect(r?.text).toBe('המשקל קטן מהמוט הריק')
    expect(r?.plates).toEqual([])
    expect(r?.exact).toBe(false)
  })

  it('משקל המוט בדיוק — מוט ריק בלי פלטות', () => {
    const r = calcPlates(20, bar20, GYM)
    expect(r?.perSideKg).toBe(0)
    expect(r?.plates).toEqual([])
    expect(r?.exact).toBe(true)
    expect(r?.text).toBe('מוט ריק, בלי פלטות')
    expect(r?.nearestBelowKg).toBeNull()
    expect(r?.nearestAboveKg).toBeNull()
  })
})

describe('calcPlates — משקל שאי אפשר להרכיב בדיוק', () => {
  it('מחזיר את הקרוב מלמטה ומלמעלה', () => {
    const r = calcPlates(26, perSideMachine, GYM)
    expect(r?.exact).toBe(false)
    expect(r?.perSideKg).toBe(26)
    expect(r?.plates).toEqual([20, 5])
    expect(r?.nearestBelowKg).toBe(25)
    expect(r?.nearestAboveKg).toBe(26.25)
    expect(r?.text).toBe('לכל צד: 20 + 5 (הכי קרוב: 25)')
  })

  it('משקל קטן מהפלטה הקטנה ביותר', () => {
    const r = calcPlates(1, perSideMachine, GYM)
    expect(r?.plates).toEqual([])
    expect(r?.exact).toBe(false)
    expect(r?.nearestBelowKg).toBe(0)
    expect(r?.nearestAboveKg).toBe(1.25)
    expect(r?.text).toBe('בלי פלטות (הכי קרוב: 0)')
  })
})

describe('calcPlates — סטים חלקיים של פלטות', () => {
  it('חדר עם 25 ו-5 בלבד', () => {
    const only25and5: PlateSettings = { barWeightKg: 20, perSideKg: [5, 25] }
    const exact = calcPlates(80, bar20, only25and5)
    expect(exact?.perSideKg).toBe(30)
    expect(exact?.plates).toEqual([25, 5])
    expect(exact?.exact).toBe(true)
    expect(exact?.text).toBe('לכל צד: 25 + 5')

    const inexact = calcPlates(74, bar20, only25and5)
    expect(inexact?.perSideKg).toBe(27)
    expect(inexact?.plates).toEqual([25])
    expect(inexact?.nearestBelowKg).toBe(25)
    expect(inexact?.nearestAboveKg).toBe(30)
    expect(inexact?.text).toBe('לכל צד: 25 (הכי קרוב: 25)')
  })

  it('מתעלם מערכים לא חיוביים ומכפילויות ברשימת הפלטות', () => {
    const messy: PlateSettings = { barWeightKg: 20, perSideKg: [10, 0, 10, -5, 20] }
    const r = calcPlates(80, bar20, messy)
    expect(r?.plates).toEqual([20, 10])
    expect(r?.exact).toBe(true)
  })

  it('בלי פלטות מוגדרות מחזיר שגיאה', () => {
    const r = calcPlates(60, bar20, { barWeightKg: 20, perSideKg: [] })
    expect(r?.error).toBe('לא הוגדרו פלטות בהגדרות')
  })
})

describe('calcPlates — טקסט לתצוגה', () => {
  it('מקבץ פלטות חוזרות ומשאיר בודדות כמו שהן', () => {
    const r = calcPlates(105, bar20, GYM)
    expect(r?.perSideKg).toBe(42.5)
    expect(r?.grouped).toEqual([
      { kg: 20, count: 2 },
      { kg: 2.5, count: 1 },
    ])
    expect(r?.text).toBe('לכל צד: 2×20 + 2.5')
    expect(r?.exact).toBe(true)
  })

  it('שומר על סדר יורד גם כשהרשימה בהגדרות מעורבבת', () => {
    const shuffled: PlateSettings = { barWeightKg: 20, perSideKg: [2.5, 20, 1.25, 10, 15, 5] }
    const r = calcPlates(32.5, perSideMachine, shuffled)
    expect(r?.plates).toEqual([20, 10, 2.5])
    expect(r?.text).toBe('לכל צד: 20 + 10 + 2.5')
  })
})
