import { describe, expect, it } from 'vitest'
import { SKIP_STREAK_THRESHOLD, shouldSuggestRemoval, skipStreak } from '@/domain/skipStreak'
import type { Session } from '@/db/types'

/**
 * אימון מינימלי. `planned` הוא מי שהיה בתוכנית, `skipped` מי שדולג במפורש —
 * וכל מי שתוכנן ולא דולג נחשב כמי שבוצע.
 */
function session(
  day: number,
  planned: string[],
  skipped: string[] = [],
  opts: { legacy?: boolean } = {}
): Session {
  const performed = planned.filter((id) => !skipped.includes(id))
  return {
    id: `s${day}`,
    routineId: 'F1',
    blockIds: [],
    date: `2026-08-${String(day).padStart(2, '0')}`,
    startedAt: day * 86_400_000,
    endedAt: day * 86_400_000 + 3_600_000,
    durationSeconds: 3600,
    plannedOrder: planned,
    actualOrder: performed,
    substitutions: [],
    skippedExerciseIds: skipped,
    // גיבוי ישן מגיע בלי השדה בכלל — לא כמערך ריק
    ...(opts.legacy ? {} : { deliberatelySkippedIds: skipped }),
    exerciseIds: performed,
    notes: '',
    totalVolumeKg: 0,
    totalSets: 0,
    totalWorkSets: 0,
  }
}

describe('skipStreak', () => {
  it('אין היסטוריה — אין רצף', () => {
    expect(skipStreak('a', [])).toBe(0)
  })

  it('סופר דילוגים רצופים מהאימון האחרון אחורה', () => {
    const history = [
      session(1, ['a', 'b']),
      session(2, ['a', 'b'], ['a']),
      session(3, ['a', 'b'], ['a']),
    ]
    expect(skipStreak('a', history)).toBe(2)
  })

  it('אימון שבוצע בו התרגיל שובר את הרצף', () => {
    const history = [
      session(1, ['a'], ['a']),
      session(2, ['a'], ['a']),
      session(3, ['a']), // בוצע — הרצף מתאפס
    ]
    expect(skipStreak('a', history)).toBe(0)
  })

  it('הסדר במערך לא משנה — הפונקציה ממיינת לפי זמן', () => {
    const history = [
      session(3, ['a'], ['a']),
      session(1, ['a']),
      session(2, ['a'], ['a']),
    ]
    expect(skipStreak('a', history)).toBe(2)
  })

  it('אימון שהתרגיל לא תוכנן בו מדולג בספירה ולא מאפס אותה', () => {
    // הדפוס של פיצול A/B/C: יום רגליים באמצע לא אומר כלום על תרגיל חזה
    const history = [
      session(1, ['a'], ['a']),
      session(2, ['other']),
      session(3, ['a'], ['a']),
    ]
    expect(skipStreak('a', history)).toBe(2)
  })

  it('"לא הספקתי" אינו דילוג — אימון שנקטע לא נספר לרעת התרגיל', () => {
    // התרגיל בתוכנית ובלי סטים, אבל לא נלחץ עליו "דלג"
    const cut: Session = {
      ...session(2, ['a', 'b']),
      actualOrder: ['b'],
      exerciseIds: ['b'],
      skippedExerciseIds: ['a'],
      deliberatelySkippedIds: [],
    }
    expect(skipStreak('a', [session(1, ['a'], ['a']), cut])).toBe(0)
  })

  it('אימון ישן בלי השדה נקרא כ"לא דולג" ולא מפיל את החישוב', () => {
    const history = [session(1, ['a'], ['a'], { legacy: true })]
    expect(skipStreak('a', history)).toBe(0)
  })

  it('תרגיל אחר לא מזיז את הרצף', () => {
    const history = [session(1, ['a', 'b'], ['b']), session(2, ['a', 'b'], ['b'])]
    expect(skipStreak('a', history)).toBe(0)
    expect(skipStreak('b', history)).toBe(2)
  })
})

describe('החלפות', () => {
  /** אימון שבו שורת התוכנית הוחלפה במחליף, והמחליף דולג */
  function substituted(day: number, planned: string, actual: string): Session {
    return {
      ...session(day, [planned], []),
      plannedOrder: [planned],
      actualOrder: [],
      exerciseIds: [],
      substitutions: [{ plannedExerciseId: planned, actualExerciseId: actual, reason: 'occupied' }],
      skippedExerciseIds: [actual],
      deliberatelySkippedIds: [actual],
    }
  }

  it('הרצף נצבר על שורת התוכנית ולא על המחליף', () => {
    // "המתקן תפוס → מחליף → מדלג", שבוע אחרי שבוע: השורה היא זו שלא נעשית
    const history = [substituted(1, 'bench', 'fly'), substituted(2, 'bench', 'fly')]
    expect(skipStreak('bench', history)).toBe(2)
  })

  it('המחליף עצמו לא נצבר — הוצאה שלו הייתה מוחקת אותו מיום אחר בפיצול', () => {
    const history = [substituted(1, 'bench', 'fly'), substituted(2, 'bench', 'fly')]
    expect(skipStreak('fly', history)).toBe(0)
  })
})

describe('shouldSuggestRemoval', () => {
  it('מציע בדיוק בדילוג השלישי', () => {
    const two = [session(1, ['a'], ['a']), session(2, ['a'], ['a'])]
    expect(skipStreak('a', two)).toBe(SKIP_STREAK_THRESHOLD - 1)
    expect(shouldSuggestRemoval('a', two)).toBe(true)
  })

  it('לא מציע בדילוג הראשון והשני', () => {
    expect(shouldSuggestRemoval('a', [])).toBe(false)
    expect(shouldSuggestRemoval('a', [session(1, ['a'], ['a'])])).toBe(false)
  })

  it('לא מציע שוב ושוב אחרי שהמשתמש בחר להשאיר', () => {
    // ארבעה דילוגים קודמים — נשאלנו כבר, ואמרנו להשאיר
    const four = [1, 2, 3, 4].map((d) => session(d, ['a'], ['a']))
    expect(shouldSuggestRemoval('a', four)).toBe(false)
  })
})
