import { describe, expect, it } from 'vitest'
import { pacingFor, pacingSummary, setGaps } from '@/domain/pacing'
import type { SetLog } from '@/db/types'

/** סט מינימלי — רק מה שהחישוב קורא */
function set(exerciseId: string, minute: number, type: SetLog['type'] = 'work'): SetLog {
  return {
    sessionId: 's1',
    exerciseId,
    setIndex: 0,
    type,
    weightKg: 60,
    reps: 10,
    completedAt: minute * 60_000,
  }
}

describe('setGaps', () => {
  it('מודד הפרשים בין סטים עוקבים של אותו תרגיל', () => {
    const sets = [set('a', 0), set('a', 2), set('a', 5)]
    expect(setGaps(sets)).toEqual([120, 180])
  })

  it('לא מודד את המעבר בין תרגילים — זו הליכה ולא קצב', () => {
    // שני תרגילים, סט אחד לכל אחד: אין שום זוג בתוך תרגיל
    expect(setGaps([set('a', 0), set('b', 4)])).toEqual([])
  })

  it('סופרסט נמדד כשני רצפים נפרדים', () => {
    // a,b,a,b לסירוגין — הקצב של כל תרגיל נמדד בנפרד
    const sets = [set('a', 0), set('b', 1), set('a', 3), set('b', 4)]
    expect(setGaps(sets).sort((x, y) => x - y)).toEqual([180, 180])
  })

  it('סטים שהגיעו בסדר מעורבב ממוינים לפי הזמן', () => {
    const sets = [set('a', 5), set('a', 0), set('a', 2)]
    expect(setGaps(sets)).toEqual([120, 180])
  })

  it('חותמות זהות לא מייצרות הפרש אפס', () => {
    expect(setGaps([set('a', 3), set('a', 3)])).toEqual([])
  })

  it('חזרה לתרגיל אחרי שעזבנו אותו לא נספרת כקצב', () => {
    // "המתקן תפוס" → שני תרגילים אחרים → חוזרים. ההפרש מודד המתנה, לא קצב
    const sets = [
      set('a', 0),
      set('a', 2),
      set('b', 4),
      set('b', 6),
      set('c', 8),
      set('c', 10),
      set('a', 25),
    ]
    // רק הזוגות הצמודים בכל תרגיל, בלי הקפיצה של 15 דקות חזרה ל-a
    expect(setGaps(sets)).toEqual([120, 120, 120])
  })

  it('טרי-סט עדיין נחשב רצף', () => {
    const sets = [set('a', 0), set('b', 1), set('c', 2), set('a', 3)]
    expect(setGaps(sets)).toEqual([180])
  })

  it('סטי חימום נספרים — המנוחה אחריהם היא מנוחה אמיתית', () => {
    const sets = [set('a', 0, 'warmup'), set('a', 1)]
    expect(setGaps(sets)).toEqual([60])
  })
})

describe('pacingSummary', () => {
  it('מחזיר חציון ולא ממוצע — מתקן תפוס לא מזיז את המספר', () => {
    // 60, 60, 600 — ממוצע 240, חציון 60
    const sets = [set('a', 0), set('a', 1), set('a', 2), set('a', 12)]
    const p = pacingSummary(sets)
    expect(p.medianSeconds).toBe(60)
    expect(p.sampleCount).toBe(3)
  })

  it('חציון של מספר זוגי של דגימות הוא ממוצע השניים באמצע', () => {
    const sets = [set('a', 0), set('a', 1), set('a', 3)]
    expect(pacingSummary(sets).medianSeconds).toBe(90)
  })

  it('חזרה לתרגיל לא מדווחת כ"הפסקה ארוכה" — היא בכלל לא נמדדת', () => {
    /*
      זו הייתה אמירה שקרית למשתמש: מי שהתאמן ברצף וחזר לתרגיל שהמתקן שלו
      היה תפוס ראה "הפסקה אחת ארוכה לא נספרה".
    */
    const sets = [set('a', 0), set('a', 1), set('b', 3), set('b', 5), set('c', 7), set('a', 30)]
    const p = pacingSummary(sets)
    expect(p.breakCount).toBe(0)
    expect(p.medianSeconds).toBe(90)
  })

  it('הפסקה ארוכה מסוננת ונספרת בנפרד', () => {
    // הפרש של 20 דקות הוא הפסקה, לא קצב
    const sets = [set('a', 0), set('a', 1), set('a', 21)]
    const p = pacingSummary(sets)
    expect(p.medianSeconds).toBe(60)
    expect(p.sampleCount).toBe(1)
    expect(p.breakCount).toBe(1)
  })

  it('אימון בלי אף זוג סטים מחזיר null ולא אפס', () => {
    // אפס היה נקרא "מנוחה של אפס שניות" — היעדר נתון הוא לא נתון
    const p = pacingSummary([set('a', 0)])
    expect(p.medianSeconds).toBeNull()
    expect(p.sampleCount).toBe(0)
  })

  it('אימון ריק לא מפיל את החישוב', () => {
    expect(pacingSummary([]).medianSeconds).toBeNull()
  })
})

describe('pacingFor', () => {
  it('מודד תרגיל אחד בלבד', () => {
    const sets = [set('a', 0), set('a', 2), set('b', 3), set('b', 9)]
    expect(pacingFor(sets, 'a').medianSeconds).toBe(120)
    expect(pacingFor(sets, 'b').medianSeconds).toBe(360)
  })
})
