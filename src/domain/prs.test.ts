import { describe, expect, it } from 'vitest'
import type { Exercise, PersonalRecord, PrKind, SetLog } from '@/db/types'
import { detectSetPrs, detectVolumePr, prHeadline, prLabel, rebuildPrs } from './prs'

function makeExercise(patch: Partial<Exercise> = {}): Exercise {
  return {
    id: 'press',
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
    seedWeightKg: null,
    isActive: true,
    order: 0,
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  }
}

function makeSet(patch: Partial<SetLog> = {}): SetLog {
  return {
    sessionId: 's1',
    exerciseId: 'press',
    setIndex: 0,
    type: 'work',
    weightKg: 40,
    reps: 10,
    completedAt: 1000,
    ...patch,
  }
}

function makePr(kind: PrKind, value: number, patch: Partial<PersonalRecord> = {}): PersonalRecord {
  return {
    exerciseId: 'press',
    kind,
    value,
    weightKg: null,
    reps: null,
    sessionId: 's0',
    achievedAt: 1,
    ...patch,
  }
}

const press = makeExercise()
const pullup = makeExercise({ id: 'pullup', name: 'מתח', weightMode: 'bodyweight' })
const dbPress = makeExercise({ id: 'db-press', name: 'לחיצה חופשי', weightMode: 'perSide' })

describe('detectSetPrs', () => {
  it('סט חימום לא שובר שיא לעולם', () => {
    const heavy = makeSet({ type: 'warmup', weightKg: 200, reps: 20 })
    expect(detectSetPrs(press, heavy, [])).toEqual([])
    expect(detectSetPrs(press, heavy, [makePr('maxWeight', 40)])).toEqual([])
    expect(detectSetPrs(pullup, { ...heavy, weightKg: 0 }, [])).toEqual([])
  })

  it('סט העבודה הראשון בתרגיל הוא שיא', () => {
    const events = detectSetPrs(press, makeSet({ weightKg: 40, reps: 10 }), [])
    expect(events.map((e) => e.kind)).toEqual(['maxWeight', 'repsAtMaxWeight'])
    expect(events[0]).toMatchObject({ exerciseId: 'press', value: 40, previous: null, reps: 10 })
    expect(events[1]).toMatchObject({ value: 10, previous: null, weightKg: 40 })
  })

  it('משקל כבד יותר שובר את שיא המשקל ומאפס את מונה החזרות', () => {
    const existing = [
      makePr('maxWeight', 40, { weightKg: 40, reps: 10 }),
      makePr('repsAtMaxWeight', 10, { weightKg: 40, reps: 10 }),
    ]
    const events = detectSetPrs(press, makeSet({ weightKg: 45, reps: 6 }), existing)
    expect(events.map((e) => e.kind)).toEqual(['maxWeight', 'repsAtMaxWeight'])
    expect(events[0]).toMatchObject({ value: 45, previous: 40 })
    // פחות חזרות אבל במשקל חדש — נרשם, כי אין מה להשוות למשקל הקודם
    expect(events[1]).toMatchObject({ value: 6, previous: 10, weightKg: 45 })
  })

  it('אותו משקל ויותר חזרות — שיא חזרות בלבד', () => {
    const existing = [
      makePr('maxWeight', 40, { weightKg: 40, reps: 8 }),
      makePr('repsAtMaxWeight', 8, { weightKg: 40, reps: 8 }),
    ]
    const events = detectSetPrs(press, makeSet({ weightKg: 40, reps: 10 }), existing)
    expect(events.map((e) => e.kind)).toEqual(['repsAtMaxWeight'])
    expect(events[0]).toMatchObject({ value: 10, previous: 8 })
  })

  it('אותו משקל ופחות חזרות — אין שיא', () => {
    const existing = [
      makePr('maxWeight', 40, { weightKg: 40, reps: 10 }),
      makePr('repsAtMaxWeight', 10, { weightKg: 40, reps: 10 }),
    ]
    expect(detectSetPrs(press, makeSet({ weightKg: 40, reps: 6 }), existing)).toEqual([])
    expect(detectSetPrs(press, makeSet({ weightKg: 35, reps: 20 }), existing)).toEqual([])
  })

  it('משקל גוף — רק שיא חזרות', () => {
    const first = detectSetPrs(pullup, makeSet({ exerciseId: 'pullup', weightKg: 0, reps: 12 }), [])
    expect(first.map((e) => e.kind)).toEqual(['maxReps'])
    expect(first[0]).toMatchObject({ value: 12, previous: null, weightKg: null })

    const existing = [makePr('maxReps', 12, { exerciseId: 'pullup', reps: 12 })]
    expect(detectSetPrs(pullup, makeSet({ exerciseId: 'pullup', weightKg: 0, reps: 12 }), existing)).toEqual([])
    const better = detectSetPrs(pullup, makeSet({ exerciseId: 'pullup', weightKg: 0, reps: 13 }), existing)
    expect(better.map((e) => e.kind)).toEqual(['maxReps'])
  })

  it('perSide מושווה כמו שרשום על המכונה, בלי הכפלה', () => {
    const existing = [
      makePr('maxWeight', 25, { exerciseId: 'db-press', weightKg: 25, reps: 8 }),
      makePr('repsAtMaxWeight', 8, { exerciseId: 'db-press', weightKg: 25, reps: 8 }),
    ]
    const events = detectSetPrs(dbPress, makeSet({ exerciseId: 'db-press', weightKg: 26, reps: 8 }), existing)
    expect(events[0]).toMatchObject({ kind: 'maxWeight', value: 26, previous: 25 })
    // 26 ולא 52 — ההכפלה קיימת רק בנפח
    expect(events[0].value).toBe(26)
  })
})

describe('detectVolumePr', () => {
  it('סופר רק סטי עבודה', () => {
    const sets = [
      makeSet({ type: 'warmup', weightKg: 100, reps: 10, completedAt: 1000 }),
      makeSet({ weightKg: 50, reps: 10, completedAt: 2000 }),
    ]
    const event = detectVolumePr(press, sets, [])
    expect(event).toMatchObject({ kind: 'maxSessionVolume', value: 500, previous: null })
  })

  it('מכפיל perSide בשתיים דרך חישוב הנפח המרכזי', () => {
    const sets = [makeSet({ exerciseId: 'db-press', weightKg: 25, reps: 10 })]
    expect(detectVolumePr(dbPress, sets, [])?.value).toBe(500)
  })

  it('מתעלם מסטים של תרגילים אחרים', () => {
    const sets = [makeSet({ exerciseId: 'other', weightKg: 999, reps: 10 }), makeSet({ weightKg: 50, reps: 10 })]
    expect(detectVolumePr(press, sets, [])?.value).toBe(500)
  })

  it('לא שיא כשהנפח לא עולה על הקיים', () => {
    const sets = [makeSet({ weightKg: 50, reps: 10 })]
    expect(detectVolumePr(press, sets, [makePr('maxSessionVolume', 500)])).toBeNull()
    expect(detectVolumePr(press, sets, [makePr('maxSessionVolume', 400)])?.value).toBe(500)
  })

  it('משקל גוף לא מייצר שיא נפח', () => {
    const sets = [makeSet({ exerciseId: 'pullup', weightKg: 0, reps: 20 })]
    expect(detectVolumePr(pullup, sets, [])).toBeNull()
  })
})

describe('rebuildPrs', () => {
  it('בונה שיאים מהיסטוריה מעורבת', () => {
    const sets: SetLog[] = [
      makeSet({ sessionId: 's1', type: 'warmup', weightKg: 20, reps: 10, completedAt: 1000 }),
      makeSet({ sessionId: 's1', weightKg: 40, reps: 10, completedAt: 2000 }),
      makeSet({ sessionId: 's1', weightKg: 40, reps: 8, completedAt: 3000 }),
      makeSet({ sessionId: 's1', exerciseId: 'pullup', weightKg: 0, reps: 12, completedAt: 4000 }),
      makeSet({ sessionId: 's2', weightKg: 50, reps: 5, completedAt: 10_000 }),
      makeSet({ sessionId: 's2', weightKg: 50, reps: 6, completedAt: 11_000 }),
      makeSet({ sessionId: 's2', exerciseId: 'pullup', weightKg: 0, reps: 10, completedAt: 12_000 }),
      makeSet({ sessionId: 's2', exerciseId: 'לא-בקטלוג', weightKg: 99, reps: 9, completedAt: 13_000 }),
    ]
    const prs = rebuildPrs([press, pullup], sets)

    expect(prs.map((p) => `${p.exerciseId}:${p.kind}`)).toEqual([
      'press:maxWeight',
      'press:repsAtMaxWeight',
      'press:maxSessionVolume',
      'pullup:maxReps',
    ])
    expect(prs[0]).toMatchObject({ value: 50, weightKg: 50, reps: 5, sessionId: 's2', achievedAt: 10_000 })
    expect(prs[1]).toMatchObject({ value: 6, weightKg: 50, achievedAt: 11_000 })
    // s1: 400+320=720 מול s2: 250+300=550 — החימום לא נספר
    expect(prs[2]).toMatchObject({ value: 720, sessionId: 's1', achievedAt: 3000 })
    expect(prs[3]).toMatchObject({ value: 12, weightKg: null, achievedAt: 4000 })
  })

  it('בתיקו נשמרת החותמת המוקדמת, בלי תלות בסדר הקלט', () => {
    const sets: SetLog[] = [
      makeSet({ sessionId: 's9', weightKg: 60, reps: 8, completedAt: 5000 }),
      makeSet({ sessionId: 's8', weightKg: 60, reps: 8, completedAt: 2000 }),
      makeSet({ sessionId: 's7', weightKg: 60, reps: 8, completedAt: 9000 }),
    ]
    const prs = rebuildPrs([press], sets)
    const max = prs.find((p) => p.kind === 'maxWeight')
    const reps = prs.find((p) => p.kind === 'repsAtMaxWeight')
    expect(max).toMatchObject({ value: 60, achievedAt: 2000, sessionId: 's8' })
    expect(reps).toMatchObject({ value: 8, achievedAt: 2000, sessionId: 's8' })

    // אותו קלט בסדר הפוך מחזיר בדיוק אותה תוצאה
    expect(rebuildPrs([press], [...sets].reverse())).toEqual(prs)
  })

  it('בתיקו נפח בין אימונים מנצח האימון המוקדם', () => {
    const sets: SetLog[] = [
      makeSet({ sessionId: 'late', weightKg: 50, reps: 10, completedAt: 9000 }),
      makeSet({ sessionId: 'early', weightKg: 50, reps: 10, completedAt: 1000 }),
    ]
    const volume = rebuildPrs([press], sets).find((p) => p.kind === 'maxSessionVolume')
    expect(volume).toMatchObject({ value: 500, sessionId: 'early', achievedAt: 1000 })
  })

  it('בלי סטים אין שיאים', () => {
    expect(rebuildPrs([press, pullup], [])).toEqual([])
    expect(rebuildPrs([press], [makeSet({ type: 'warmup' })])).toEqual([])
  })
})

describe('טקסטים', () => {
  it('תוויות בעברית לכל סוג שיא', () => {
    expect(prLabel('maxWeight')).toBe('שיא משקל')
    expect(prLabel('maxReps')).toBe('שיא חזרות')
    expect(prLabel('repsAtMaxWeight')).toBe('שיא חזרות במשקל השיא')
    expect(prLabel('maxSessionVolume')).toBe('שיא נפח באימון')
  })

  it('כותרת חגיגה מכבדת את מצב המשקל', () => {
    const events = detectSetPrs(dbPress, makeSet({ exerciseId: 'db-press', weightKg: 25, reps: 10 }), [])
    expect(prHeadline(dbPress, events[0])).toBe('שיא חדש — 25 ק״ג כל צד')
    expect(prHeadline(dbPress, events[1])).toBe('שיא חדש — 10 חזרות ב-25 ק״ג כל צד')

    const bw = detectSetPrs(pullup, makeSet({ exerciseId: 'pullup', weightKg: 0, reps: 1 }), [])
    expect(prHeadline(pullup, bw[0])).toBe('שיא חדש — חזרה אחת')

    const volume = detectVolumePr(press, [makeSet({ weightKg: 50, reps: 10 })], [])
    expect(volume).not.toBeNull()
    if (volume) expect(prHeadline(press, volume)).toBe('שיא חדש — 500 ק״ג באימון')
  })
})
