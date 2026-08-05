import { describe, expect, it } from 'vitest'
import type { Session } from '@/db/types'
import { startOfWeek, toISODate } from '@/lib/dates'
import { computeStreak } from './streak'

const NOW = new Date(2026, 7, 5, 12, 0, 0).getTime() // רביעי, 5.8.26

let counter = 0

/** אימון שהסתיים ביום ובשעה שנתנו */
function at(month: number, day: number, hour = 10): Session {
  const started = new Date(2026, month - 1, day, hour, 0, 0).getTime()
  counter += 1
  return {
    id: `s${counter}`,
    routineId: 'A',
    blockIds: [],
    date: toISODate(started),
    startedAt: started,
    endedAt: started + 3600_000,
    durationSeconds: 3600,
    plannedOrder: [],
    actualOrder: [],
    substitutions: [],
    skippedExerciseIds: [],
    exerciseIds: [],
    notes: '',
    totalVolumeKg: 0,
    totalSets: 0,
    totalWorkSets: 0,
  }
}

/** n אימונים באותו שבוע, בימים עוקבים החל מ-day */
function week(month: number, day: number, n: number): Session[] {
  return Array.from({ length: n }, (_, i) => at(month, day + i))
}

const CURRENT = startOfWeek(NOW) // ראשון 2.8.26

describe('computeStreak', () => {
  it('סופר את השבוע הנוכחי רק כשהיעד הושג', () => {
    const previous = week(7, 26, 3) // 26–28.7
    const partial = computeStreak([...previous, ...week(8, 2, 1)], 3, NOW)
    expect(partial.thisWeekCount).toBe(1)
    expect(partial.remainingThisWeek).toBe(2)
    expect(partial.streakWeeks).toBe(1) // רק השבוע הקודם

    const full = computeStreak([...previous, ...week(8, 2, 3)], 3, NOW)
    expect(full.thisWeekCount).toBe(3)
    expect(full.remainingThisWeek).toBe(0)
    expect(full.streakWeeks).toBe(2)
  })

  it('חור באמצע מאפס את הרצף', () => {
    const sessions = [
      ...week(8, 2, 3), // השבוע
      ...week(7, 26, 3), // שבוע שעבר
      // 19–25.7 ריק
      ...week(7, 12, 3),
      ...week(7, 5, 3),
    ]
    const info = computeStreak(sessions, 3, NOW)
    expect(info.streakWeeks).toBe(2)
  })

  it('שבוע שלא הגיע ליעד עוצר את הספירה', () => {
    const sessions = [...week(8, 2, 3), ...week(7, 26, 2), ...week(7, 19, 3)]
    expect(computeStreak(sessions, 3, NOW).streakWeeks).toBe(1)
  })

  it('גבול השבוע הוא שבת→ראשון', () => {
    // שבת 1.8 בערב שייך לשבוע הקודם, ראשון 2.8 בחצות ורבע לשבוע הנוכחי
    const info = computeStreak([at(8, 1, 23), at(8, 2, 0)], 1, NOW)
    expect(info.thisWeekCount).toBe(1)
    const weeks = info.recentWeeks
    expect(weeks[weeks.length - 1].weekStart).toBe(CURRENT)
    expect(weeks[weeks.length - 1].count).toBe(1)
    expect(weeks[weeks.length - 2].count).toBe(1) // השבת נספרה בשבוע הקודם
    expect(info.streakWeeks).toBe(2)
  })

  it('מתעלם מאימונים שלא נסגרו', () => {
    const open: Session = { ...at(8, 3), endedAt: 0, durationSeconds: 0 }
    const info = computeStreak([at(8, 2), open], 2, NOW)
    expect(info.thisWeekCount).toBe(1)
    expect(info.streakWeeks).toBe(0)
    expect(info.remainingThisWeek).toBe(1)
  })

  it('יעד 0 או שלילי מטופל כ-1', () => {
    const info = computeStreak([...week(8, 2, 1), ...week(7, 26, 1)], 0, NOW)
    expect(info.goal).toBe(1)
    expect(info.streakWeeks).toBe(2)
    expect(info.remainingThisWeek).toBe(0)
  })

  it('בלי אימונים בכלל', () => {
    const info = computeStreak([], 3, NOW)
    expect(info.streakWeeks).toBe(0)
    expect(info.thisWeekCount).toBe(0)
    expect(info.remainingThisWeek).toBe(3)
    expect(info.recentWeeks).toHaveLength(8)
    expect(info.recentWeeks.every((w) => w.count === 0 && !w.met)).toBe(true)
  })

  it('recentWeeks מסודר מהישן לחדש ומסמן עמידה ביעד', () => {
    const info = computeStreak([...week(8, 2, 2), ...week(7, 26, 1)], 2, NOW)
    expect(info.recentWeeks).toHaveLength(8)
    const starts = info.recentWeeks.map((w) => w.weekStart)
    expect([...starts].sort((a, b) => a - b)).toEqual(starts)
    expect(starts[starts.length - 1]).toBe(CURRENT)
    expect(info.recentWeeks[7]).toMatchObject({ count: 2, met: true })
    expect(info.recentWeeks[6]).toMatchObject({ count: 1, met: false })
    expect(info.recentWeeks[5]).toMatchObject({ count: 0, met: false })
  })
})
