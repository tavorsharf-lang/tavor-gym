import { describe, expect, it } from 'vitest'
import type { ActiveWorkout, DraftSet } from '@/db/types'
import { STALE_AFTER_MS, lastSetAt, staleWorkout } from './staleWorkout'

const HOUR = 3_600_000
const START = new Date(2026, 7, 16, 15, 24, 0).getTime() // 16.8.26, 15:24

function draft(completedAt: number): DraftSet {
  return { logId: 1, type: 'work', weightKg: 60, reps: 8, completedAt }
}

function workout(sets: Record<string, DraftSet[]>, startedAt = START): ActiveWorkout {
  return {
    id: 'current',
    sessionId: 's1',
    routineId: 'F1',
    blockIds: [],
    startedAt,
    queue: [],
    currentKey: null,
    setsByKey: sets,
    ratingsByKey: {},
    substitutions: [],
    restEndsAt: null,
    restTotalSeconds: 0,
    restForKey: null,
    notes: '',
    lastSavedAt: startedAt,
  }
}

describe('אימון שנשכח פתוח', () => {
  it('הסט האחרון הוא המאוחר מכולם, ולא האחרון שנכתב', () => {
    // שני תרגילים במקביל: מי שחזר לתרגיל קודם כתב סט מוקדם אחרי סט מאוחר
    const w = workout({
      a: [draft(START + HOUR), draft(START + 2 * HOUR)],
      b: [draft(START + 90 * 60_000)],
    })
    expect(lastSetAt(w)).toBe(START + 2 * HOUR)
  })

  it('אימון בלי סטים מחזיר null', () => {
    expect(lastSetAt(workout({}))).toBeNull()
    expect(lastSetAt(workout({ a: [] }))).toBeNull()
  })

  it('אימון שהסט האחרון בו טרי הוא חי', () => {
    const w = workout({ a: [draft(START + HOUR)] })
    expect(staleWorkout(w, START + HOUR + 10 * 60_000).state).toBe('live')
  })

  it('הפסקה ארוכה באמצע אימון עדיין חיה — הסף הוא ארבע שעות', () => {
    const w = workout({ a: [draft(START)] })
    // בדיוק על הסף: עדיין חי. השאלה נשאלת רק מעבר לו
    expect(staleWorkout(w, START + STALE_AFTER_MS).state).toBe('live')
    expect(staleWorkout(w, START + STALE_AFTER_MS + 1).state).toBe('abandoned')
  })

  it('אימון שנשכח מציע להיסגר על הסט האחרון ולא על עכשיו', () => {
    const last = START + 70 * 60_000 // 16:34
    const w = workout({ a: [draft(START + 5 * 60_000)], b: [draft(last)] })
    // הפתיחה הבאה למחרת, בדיוק כמו באימון האמיתי היחיד שיש במסד
    const verdict = staleWorkout(w, last + 23 * HOUR)
    expect(verdict).toEqual({ state: 'abandoned', lastSetAt: last })
  })

  it('אימון שנפתח ולא נרשם בו כלום הוא מקרה נפרד, ונמדד מהפתיחה', () => {
    const w = workout({})
    expect(staleWorkout(w, START + HOUR).state).toBe('live')
    expect(staleWorkout(w, START + 5 * HOUR)).toEqual({ state: 'empty', startedAt: START })
  })

  it('שעון שזז אחורה לא מייצר משך שלילי', () => {
    /*
      הסט נרשם לפני שהאימון "התחיל" — מה שקורה כשאזור הזמן או שעון המכשיר
      זזים בין הסט לפתיחה הבאה. סגירה על הערך החשוף הייתה כותבת
      durationSeconds שלילי לתוך הנפח השבועי ולגרפים.
    */
    const w = workout({ a: [draft(START - HOUR)] })
    const verdict = staleWorkout(w, START + 10 * HOUR)
    expect(verdict).toEqual({ state: 'abandoned', lastSetAt: START })
  })
})
