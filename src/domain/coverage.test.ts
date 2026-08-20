import { describe, expect, it } from 'vitest'
import type { Exercise, MuscleGroup, Session, SetLog } from '@/db/types'
import { MS_DAY } from '@/lib/dates'
import { coverageText, liveCoverageInput, muscleCoverage, uncoveredGroups } from './coverage'

const NOW = new Date(2026, 7, 19, 18, 0, 0).getTime() // רביעי, 19.8.26

function exercise(id: string, muscleGroup: MuscleGroup, secondary?: MuscleGroup[]): Exercise {
  return {
    id,
    name: id,
    muscleGroup,
    secondaryMuscles: secondary,
    subTarget: '',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 120,
    targetSets: 2,
    targetReps: { min: 8, max: 12 },
    cues: [],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: null,
    isActive: true,
    order: 0,
    createdAt: 0,
    updatedAt: 0,
  }
}

const EXERCISES = [
  exercise('row', 'back', ['biceps', 'forearms']),
  exercise('pulldown', 'back', ['biceps']),
  exercise('curl', 'biceps'),
  exercise('press', 'chest', ['triceps']),
  exercise('squat', 'legs'),
]

let counter = 0

/** אימון שהתחיל לפני `daysAgo` ימים, עם הסטים שלו */
function session(
  daysAgo: number,
  entries: [exerciseId: string, sets: number][],
  opts: { workSets?: number; endedAt?: number } = {}
): { session: Session; sets: SetLog[] } {
  counter += 1
  const id = `s${counter}`
  const startedAt = NOW - daysAgo * MS_DAY
  const sets: SetLog[] = []
  for (const [exerciseId, count] of entries) {
    for (let i = 0; i < count; i++) {
      sets.push({
        sessionId: id,
        exerciseId,
        setIndex: i,
        type: 'work',
        weightKg: 40,
        reps: 10,
        completedAt: startedAt + i * 60_000,
      })
    }
  }
  return {
    session: {
      id,
      routineId: null,
      blockIds: [],
      date: '2026-08-19',
      startedAt,
      endedAt: opts.endedAt ?? startedAt + 3600_000,
      durationSeconds: 3600,
      plannedOrder: [],
      actualOrder: [],
      substitutions: [],
      skippedExerciseIds: [],
      exerciseIds: entries.map(([id]) => id),
      notes: '',
      totalVolumeKg: 0,
      totalSets: sets.length,
      totalWorkSets: opts.workSets ?? sets.length,
    },
    sets,
  }
}

function run(
  parts: ReturnType<typeof session>[],
  windowDays = 4,
  exercises: readonly Exercise[] = EXERCISES
) {
  const rows = muscleCoverage(
    exercises,
    parts.map((p) => p.session),
    parts.flatMap((p) => p.sets),
    NOW,
    windowDays
  )
  return new Map(rows.map((r) => [r.group, r]))
}

describe('muscleCoverage', () => {
  it('מחזיר את כל תשע הקבוצות גם כשאין שום נתון', () => {
    const rows = muscleCoverage(EXERCISES, [], [], NOW, 4)
    expect(rows).toHaveLength(9)
    expect(rows.every((r) => r.uncovered && r.neverDone)).toBe(true)
  })

  it('סופר תרגילים שונים וסטים לשריר הראשי', () => {
    const back = run([session(1, [['row', 3], ['pulldown', 2]])]).get('back')
    expect(back?.exercises).toBe(2)
    expect(back?.sets).toBe(5)
    expect(back?.uncovered).toBe(false)
  })

  it('סופר עבודה עקיפה בנפרד ולא מערבב אותה בישירה', () => {
    const map = run([session(1, [['row', 3]])])
    expect(map.get('back')?.sets).toBe(3)
    expect(map.get('biceps')?.sets).toBe(0)
    expect(map.get('biceps')?.indirectSets).toBe(3)
    expect(map.get('biceps')?.indirectExercises).toBe(1)
    // יד קדמית שקיבלה רק עבודה עקיפה עדיין נחשבת "לא כוסתה"
    expect(map.get('biceps')?.uncovered).toBe(true)
  })

  it('לא זוקף לשריר הראשי גם דרך התגיות המשניות', () => {
    const selfTagged = [exercise('row', 'back', ['back', 'biceps'])]
    const map = run([session(1, [['row', 4]])], 4, selfTagged)
    expect(map.get('back')?.sets).toBe(4)
    expect(map.get('back')?.indirectSets).toBe(0)
  })

  it('חלון של 4 ימים הוא היום ושלושת הימים שלפניו', () => {
    const inside = run([session(3, [['squat', 2]])]).get('legs')
    expect(inside?.sets).toBe(2)

    const outside = run([session(4, [['squat', 2]])]).get('legs')
    expect(outside?.sets).toBe(0)
    // הוא עדיין יודע *מתי* זה קרה — רק לא נספר בחלון
    expect(outside?.daysSince).toBe(4)
    expect(outside?.neverDone).toBe(false)
  })

  it('מכבד חלון שהמשתמש הגדיל', () => {
    expect(run([session(6, [['squat', 2]])], 7).get('legs')?.sets).toBe(2)
    expect(run([session(7, [['squat', 2]])], 7).get('legs')?.sets).toBe(0)
  })

  it('מתעלם מאימון שלא נסגר ומאימון בלי סטי עבודה', () => {
    expect(run([session(1, [['squat', 3]], { endedAt: 0 })]).get('legs')?.sets).toBe(0)
    expect(run([session(1, [['squat', 3]], { workSets: 0 })]).get('legs')?.sets).toBe(0)
  })

  it('לא סופר סטי חימום', () => {
    const part = session(1, [['squat', 2]])
    part.sets[0].type = 'warmup'
    expect(run([part]).get('legs')?.sets).toBe(1)
  })

  it('מדלג על סטים של תרגיל שכבר לא קיים בקטלוג', () => {
    const part = session(1, [['deleted-exercise', 5]])
    const rows = muscleCoverage(EXERCISES, [part.session], part.sets, NOW, 4)
    expect(rows.every((r) => r.sets === 0)).toBe(true)
  })

  it('מודד ותק לפי תחילת האימון, כך שאימון שחצה חצות לא מתפצל', () => {
    // אימון שהתחיל אתמול ב-23:30 ונמשך לתוך היום
    const startedAt = NOW - 1 * MS_DAY
    const part = session(1, [['squat', 2]])
    part.sets[1].completedAt = startedAt + 5 * 3600_000
    expect(run([part]).get('legs')?.sets).toBe(2)
  })

  it('ממיין מהמוזנח ביותר, ובתיקו לפי גודל השריר', () => {
    const legs = session(1, [['squat', 2]])
    const chest = session(10, [['press', 2]])
    const rows = muscleCoverage(
      EXERCISES,
      [legs.session, chest.session],
      [...legs.sets, ...chest.sets],
      NOW,
      4
    )
    // מה שלא נמצא בכלל בטווח קודם לכל מה שכן, והטרי ביותר אחרון
    expect(rows[0].neverDone).toBe(true)
    expect(rows.at(-1)?.group).toBe('legs')
    expect(rows.at(-2)?.group).toBe('chest')
    // תיקו בין קבוצות שלא בוצעו נשבר לפי MUSCLE_GROUP_BY_SIZE
    const never = rows.filter((r) => r.neverDone).map((r) => r.group)
    expect(never.indexOf('back')).toBeLessThan(never.indexOf('abs'))
  })

  it('שומר את התאריך האחרון גם כשהוא הרבה מחוץ לחלון', () => {
    const legs = run([session(40, [['squat', 3]])]).get('legs')
    expect(legs?.daysSince).toBe(40)
    expect(legs?.uncovered).toBe(true)
    expect(legs?.neverDone).toBe(false)
  })
})

describe('liveCoverageInput', () => {
  const workout = (
    setsByKey: Record<string, { type: 'work' | 'warmup' }[]>,
    exerciseIds: string[]
  ) =>
    ({
      id: 'current' as const,
      sessionId: 'live',
      routineId: null,
      blockIds: [],
      startedAt: NOW - 3600_000,
      queue: exerciseIds.map((exerciseId, i) => ({
        key: `q${i}`,
        exerciseId,
        plannedExerciseId: exerciseId,
        source: 'builder' as const,
        sourceId: '',
        targetSets: 2,
        targetReps: { min: 8, max: 12 },
        restSeconds: 120,
        startWeightKg: null,
        status: 'active' as const,
        warmupOffered: false,
      })),
      currentKey: 'q0',
      setsByKey: Object.fromEntries(
        Object.entries(setsByKey).map(([key, list]) => [
          key,
          list.map((s, i) => ({
            logId: i,
            type: s.type,
            weightKg: 100,
            reps: 10,
            completedAt: NOW - 600_000,
          })),
        ])
      ),
      ratingsByKey: {},
      substitutions: [],
      restEndsAt: null,
      restTotalSeconds: 120,
      restForKey: null,
      notes: '',
      lastSavedAt: NOW,
    }) as never

  it('מחזיר ריק כשאין אימון', () => {
    expect(liveCoverageInput(null, NOW)).toEqual({ sessions: [], sets: [] })
  })

  it('מחזיר ריק כשיש רק סטי חימום', () => {
    const w = workout({ q0: [{ type: 'warmup' }] }, ['squat'])
    expect(liveCoverageInput(w, NOW).sessions).toHaveLength(0)
  })

  it('הסטים של האימון שרץ נספרים בכיסוי לפני הסיום', () => {
    const w = workout({ q0: [{ type: 'work' }, { type: 'work' }] }, ['squat'])
    const live = liveCoverageInput(w, NOW)
    const rows = muscleCoverage(EXERCISES, live.sessions, live.sets, NOW, 4)
    const legs = rows.find((r) => r.group === 'legs')
    expect(legs?.sets).toBe(2)
    expect(legs?.uncovered).toBe(false)
  })

  it('לא ממציא סטים לתרגילים שלא נגעו בהם', () => {
    const w = workout({ q0: [{ type: 'work' }] }, ['squat', 'row'])
    const live = liveCoverageInput(w, NOW)
    const rows = muscleCoverage(EXERCISES, live.sessions, live.sets, NOW, 4)
    expect(rows.find((r) => r.group === 'back')?.sets).toBe(0)
  })
})

describe('uncoveredGroups', () => {
  it('מחזיר רק את מי שלא קיבל סט ישיר בחלון', () => {
    const rows = muscleCoverage(
      EXERCISES,
      [session(1, [['squat', 2]]).session],
      session(1, [['squat', 2]]).sets.map((s) => ({ ...s, sessionId: 's-x' })),
      NOW,
      4
    )
    expect(uncoveredGroups(rows)).toHaveLength(9)
  })
})

describe('coverageText', () => {
  const row = (sets: number, exercises: number) => ({
    group: 'back' as const,
    label: 'גב',
    exercises,
    sets,
    indirectSets: 0,
    indirectExercises: 0,
    lastDirectAt: null,
    daysSince: null,
    neverDone: true,
    uncovered: sets === 0,
  })

  it('מנסח יחיד ורבים', () => {
    expect(coverageText(row(0, 0))).toBe('לא נגעת')
    expect(coverageText(row(3, 1))).toBe('תרגיל אחד · 3 סטים')
    expect(coverageText(row(11, 3))).toBe('3 תרגילים · 11 סטים')
  })
})
