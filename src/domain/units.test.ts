import { describe, expect, it } from 'vitest'
import { PLANK_RANGE } from '@/db/seed'
import {
  countLabel,
  countMax,
  countStep,
  formatClock,
  formatDuration,
  formatKg,
  formatRepRange,
  formatSetShort,
  formatVolume,
  repMarks,
  roundToIncrement,
  round2,
  weightStep,
} from './units'

describe('roundToIncrement', () => {
  it('מעגל למכפלה הקרובה', () => {
    expect(roundToIncrement(61, 2.5)).toBe(60)
    expect(roundToIncrement(61.5, 2.5)).toBe(62.5)
  })

  it('מכבד כיוון מפורש', () => {
    expect(roundToIncrement(61, 2.5, 'down')).toBe(60)
    expect(roundToIncrement(61, 2.5, 'up')).toBe(62.5)
  })

  /** ה-epsilon קיים בדיוק בשביל זה: 0.1+0.2 מייצר 7.500000000000001 */
  it('ערך שכבר על הרשת לא זז בגלל נקודה צפה', () => {
    expect(roundToIncrement(7.5, 2.5, 'up')).toBe(7.5)
    expect(roundToIncrement(7.5, 2.5, 'down')).toBe(7.5)
    expect(roundToIncrement(0.1 + 0.2, 0.3, 'up')).toBe(0.3)
  })

  it('קפיצה אפס מחזירה את הערך כמו שהוא', () => {
    expect(roundToIncrement(61.234, 0)).toBe(61.23)
  })
})

describe('round2', () => {
  it('מנקה שגיאות נקודה צפה', () => {
    expect(round2(22.500000000000004)).toBe(22.5)
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })
})

describe('formatKg', () => {
  it('בלי אפסים מיותרים, ובלי לאבד דיוק', () => {
    expect(formatKg(60)).toBe('60')
    expect(formatKg(22.5)).toBe('22.5')
    expect(formatKg(1.25)).toBe('1.25')
  })
})

describe('formatClock', () => {
  it('דקות ושניות, עם ריפוד', () => {
    expect(formatClock(75)).toBe('1:15')
    expect(formatClock(62)).toBe('1:02')
    expect(formatClock(0)).toBe('0:00')
  })

  it('מגלגל לשעות', () => {
    expect(formatClock(3750)).toBe('1:02:30')
  })

  it('לא מייצר מספר שלילי', () => {
    expect(formatClock(-5)).toBe('0:00')
  })
})

describe('formatDuration', () => {
  it('דקות בלבד מתחת לשעה', () => {
    expect(formatDuration(58 * 60)).toBe('58 דקות')
  })

  it('שעה ושעתיים בעברית תקינה', () => {
    expect(formatDuration(60 * 60)).toBe('שעה')
    expect(formatDuration(120 * 60)).toBe('שעתיים')
    expect(formatDuration(180 * 60)).toBe('3 שעות')
  })

  it('שעה ועוד דקות', () => {
    expect(formatDuration(72 * 60)).toBe('שעה ו-12 דקות')
  })
})

describe('formatVolume', () => {
  it('עובר לטון מעל הסף', () => {
    expect(formatVolume(9999)).toContain('ק״ג')
    expect(formatVolume(12500)).toBe('12.5 טון')
    expect(formatVolume(10000)).toBe('10.0 טון')
  })
})

describe('weightStep', () => {
  it('משקל גוף לא קופץ בכלל', () => {
    expect(weightStep({ weightMode: 'bodyweight', weightIncrementKg: 5 })).toBe(0)
  })

  it('נופל ל-2.5 כשלא הוגדרה קפיצה', () => {
    expect(weightStep({ weightMode: 'total', weightIncrementKg: 0 })).toBe(2.5)
    expect(weightStep({ weightMode: 'total', weightIncrementKg: 5 })).toBe(5)
  })
})

/**
 * תרגיל שנמדד בזמן. הערך נשמר באותו שדה כמו חזרות, ולכן כל ההבדל הוא בתצוגה —
 * וזה בדיוק מה שנבדק כאן.
 */
describe('מדידה בזמן מול חזרות', () => {
  it('countLabel ו-countStep', () => {
    expect(countLabel()).toBe('חזרות')
    expect(countLabel('reps')).toBe('חזרות')
    expect(countLabel('seconds')).toBe('זמן')
    expect(countStep('reps')).toBe(1)
    expect(countStep('seconds')).toBe(5)
  })

  /**
   * רגרסיה: עורכי היעד היו חסומים ל-50 בלי קשר ליחידה, ולכן פלאנק של 1:15
   * היה נחתך ל-0:50 בלחיצה אחת על מינוס — בשקט, בלי שום סימן שהיעד השתנה.
   */
  it('התקרה בעורך גדולה מספיק ליעד של תרגיל זמן', () => {
    expect(countMax('reps')).toBe(50)
    expect(countMax('seconds')).toBeGreaterThanOrEqual(PLANK_RANGE.max)
  })

  /**
   * שורת "כמה חזרות עשיתי". שתי דרישות שאסור לוותר על אף אחת מהן: המספר שהשדה
   * *נפתח* עליו חייב להיות על השורה, וגם ראש טווח היעד. חלון רציף אחד סביב 6
   * נתן בעבר את אותם שמונה שבבים בדיוק לכל תרגיל, ועצר ב-12 — כלומר בהרמות צד
   * וזקיפות עגל, שהיעד בהן 12–20, אי אפשר היה לסמן שום מספר בטווח.
   */
  it('שבבי החזרות מכסים גם את היעד וגם את ברירת המחדל', () => {
    // כל טווחי היעד שבתוכניות הפעילות, מול ברירת מחדל של 6
    for (const range of [
      { min: 10, max: 12 },
      { min: 10, max: 15 },
      { min: 12, max: 20 },
      { min: 8, max: 12 },
    ]) {
      const marks = repMarks(range, 6)
      expect(marks).toContain(6)
      expect(marks).toContain(range.min)
      expect(marks).toContain(range.max)
      expect(marks.length).toBeLessThanOrEqual(12)
      // תמיד עולה, בלי כפילויות — השורה נקראת משמאל לימין כמו סרגל
      expect([...marks].sort((a, b) => a - b)).toEqual(marks)
      expect(new Set(marks).size).toBe(marks.length)
    }

    // ברירת מחדל שכבר בתוך הטווח לא מוסיפה שבב, וטווח צר מרופד משני הצדדים
    expect(repMarks({ min: 10, max: 12 }, 10)).toEqual([9, 10, 11, 12, 13])
    // אף פעם לא 0 חזרות, ואף פעם לא שורה בלי סוף
    expect(repMarks({ min: 1, max: 3 }, 1)).toEqual([1, 2, 3, 4])
    const wide = repMarks({ min: 5, max: 30 }, 6)
    expect(wide.length).toBeLessThanOrEqual(12)
    expect(wide).toContain(30)
    expect(wide).toContain(6)
  })

  it('טווח יעד מוצג כשעון', () => {
    expect(formatRepRange({ min: 8, max: 12 })).toBe('8–12')
    expect(formatRepRange({ min: 75, max: 75 }, 'seconds')).toBe('1:15')
    expect(formatRepRange({ min: 60, max: 90 }, 'seconds')).toBe('1:00–1:30')
  })

  it('סט של משקל גוף בזמן מוצג כשעון בלבד', () => {
    expect(formatSetShort(0, 75, 'bodyweight', 'seconds')).toBe('1:15')
  })

  it('סט של משקל גוף בחזרות נשאר כמו שהיה', () => {
    expect(formatSetShort(0, 15, 'bodyweight')).toBe('15 חזרות')
  })

  it('תרגיל זמן עם משקל חיצוני מציג את שניהם', () => {
    expect(formatSetShort(10, 60, 'total', 'seconds')).toBe('10×1:00')
  })

  it('ברירת המחדל היא חזרות, כדי שרשומה ותיקה תישאר תקפה', () => {
    expect(formatSetShort(60, 10, 'total')).toBe('60×10')
    expect(formatSetShort(22.5, 10, 'perSide')).toBe('22.5×10')
  })
})
