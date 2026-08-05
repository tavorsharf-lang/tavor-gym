import type { Exercise, MuscleGroup, Session, SetLog } from '@/db/types'
import { MUSCLE_GROUPS, MUSCLE_GROUP_ORDER } from '@/db/types'
import { MS_DAY, startOfWeek } from '@/lib/dates'
import { round2 } from './units'
import { summarize, weightModeLookup, workSets, workingWeight } from './volume'

/**
 * לוח הנפח השבועי וגרפי ההתקדמות.
 *
 * שום חישוב נפח לא נעשה כאן — הכל עובר דרך setVolume/summarize, שהם המקום
 * היחיד שיודע על חימומים ועל perSide.
 */

export interface GroupVolume {
  group: MuscleGroup
  label: string
  volumeKg: number
  workSets: number
  sessions: number
}

export interface WeeklyBreakdown {
  weekStart: number
  totalVolumeKg: number
  totalWorkSets: number
  byGroup: GroupVolume[]
}

export interface GroupComparison {
  group: MuscleGroup
  label: string
  current: number
  previous: number
  deltaPct: number | null
  currentSets: number
  neglected: boolean
}

export interface TrendPoint {
  date: string
  timestamp: number
  workingWeightKg: number | null
  volumeKg: number
  topSetReps: number | null
}

/** מתחת לאחוז הזה מהשבוע הקודם — הקבוצה מסומנת כמוזנחת */
const NEGLECT_RATIO = 0.6

/** כל קבוצת שריר מופיעה גם באפס — זו כל המטרה של הלוח */
export function emptyGroupVolumes(): GroupVolume[] {
  return MUSCLE_GROUP_ORDER.map((group) => ({
    group,
    label: MUSCLE_GROUPS[group].label,
    volumeKg: 0,
    workSets: 0,
    sessions: 0,
  }))
}

/**
 * תחילת השבוע הבא. +8 ימים ואז יישור לשבוע, כדי שמעבר שעון קיץ (±שעה)
 * לא יזיז את הגבול ליום הלא נכון.
 */
function nextWeekStart(weekStart: number): number {
  return startOfWeek(weekStart + 8 * MS_DAY)
}

export function weeklyBreakdown(
  sessions: readonly Session[],
  sets: readonly SetLog[],
  exercises: readonly Exercise[],
  weekStart: number
): WeeklyBreakdown {
  const start = startOfWeek(weekStart)
  const end = nextWeekStart(start)

  const inWeek = new Set<string>()
  for (const s of sessions) {
    if (s.endedAt <= 0) continue
    if (s.startedAt >= start && s.startedAt < end) inWeek.add(s.id)
  }

  const groupOf = new Map(exercises.map((e) => [e.id, e.muscleGroup]))
  const modeOf = weightModeLookup(exercises)
  const weekSets = sets.filter((s) => inWeek.has(s.sessionId))
  const totals = summarize(weekSets, modeOf)

  const setsByGroup = new Map<MuscleGroup, SetLog[]>()
  const sessionsByGroup = new Map<MuscleGroup, Set<string>>()
  for (const s of weekSets) {
    const group = groupOf.get(s.exerciseId)
    // תרגיל שנמחק מהקטלוג — הסטים שלו נשארים בהיסטוריה אבל אין להם קבוצה
    if (group === undefined) continue
    const bucket = setsByGroup.get(group)
    if (bucket) bucket.push(s)
    else setsByGroup.set(group, [s])
    // אימון "נגע" בקבוצה רק אם היה בו סט עבודה, לא רק חימום
    if (s.type === 'work') {
      const seen = sessionsByGroup.get(group)
      if (seen) seen.add(s.sessionId)
      else sessionsByGroup.set(group, new Set([s.sessionId]))
    }
  }

  const byGroup = emptyGroupVolumes().map((base) => {
    const groupSets = setsByGroup.get(base.group)
    if (!groupSets) return base
    const t = summarize(groupSets, modeOf)
    return {
      ...base,
      volumeKg: t.volumeKg,
      workSets: t.workSets,
      sessions: sessionsByGroup.get(base.group)?.size ?? 0,
    }
  })

  return {
    weekStart: start,
    totalVolumeKg: totals.volumeKg,
    totalWorkSets: totals.workSets,
    byGroup,
  }
}

/** השבוע הנוכחי מול הקודם לכל קבוצת שריר, ומי מוזנחת */
export function compareWeeks(
  current: WeeklyBreakdown,
  previous: WeeklyBreakdown,
  allGroups: readonly MuscleGroup[] = MUSCLE_GROUP_ORDER
): GroupComparison[] {
  const cur = new Map(current.byGroup.map((g) => [g.group, g]))
  const prev = new Map(previous.byGroup.map((g) => [g.group, g]))

  return allGroups.map((group) => {
    const c = cur.get(group)
    const p = prev.get(group)
    const currentVolume = c?.volumeKg ?? 0
    const previousVolume = p?.volumeKg ?? 0
    const currentSets = c?.workSets ?? 0
    return {
      group,
      label: MUSCLE_GROUPS[group].label,
      current: currentVolume,
      previous: previousVolume,
      // בלי שבוע קודם אין ממה לחשב אחוז — null ולא 0, שלא ייראה כמו "ללא שינוי"
      deltaPct:
        previousVolume > 0 ? round2(((currentVolume - previousVolume) / previousVolume) * 100) : null,
      currentSets,
      neglected: currentSets === 0 || (previousVolume > 0 && currentVolume < previousVolume * NEGLECT_RATIO),
    }
  })
}

/** החזרות בסט הכבד ביותר; בתיקו במשקל — הסט עם יותר חזרות */
function topSetReps(sets: readonly SetLog[]): number | null {
  let best: SetLog | null = null
  for (const s of sets) {
    if (
      best === null ||
      s.weightKg > best.weightKg ||
      (s.weightKg === best.weightKg && s.reps > best.reps)
    ) {
      best = s
    }
  }
  return best === null ? null : best.reps
}

/** סדרת נקודות לגרפים במסך התרגיל, מהישן לחדש */
export function exerciseTrend(
  exercise: Exercise,
  sessions: readonly Session[],
  sets: readonly SetLog[]
): TrendPoint[] {
  const bySession = new Map<string, SetLog[]>()
  for (const s of sets) {
    if (s.exerciseId !== exercise.id) continue
    const bucket = bySession.get(s.sessionId)
    if (bucket) bucket.push(s)
    else bySession.set(s.sessionId, [s])
  }

  const modeOf = () => exercise.weightMode
  const points: TrendPoint[] = []
  for (const session of sessions) {
    if (session.endedAt <= 0) continue
    const own = bySession.get(session.id)
    if (!own) continue
    const work = workSets(own)
    // אימון שהיה בו רק חימום לא מספר כלום על התקדמות
    if (work.length === 0) continue
    const t = summarize(own, modeOf)
    points.push({
      date: session.date,
      timestamp: session.startedAt,
      workingWeightKg: exercise.weightMode === 'bodyweight' ? null : workingWeight(own),
      volumeKg: t.volumeKg,
      topSetReps: topSetReps(work),
    })
  }
  return points.sort((a, b) => a.timestamp - b.timestamp)
}
