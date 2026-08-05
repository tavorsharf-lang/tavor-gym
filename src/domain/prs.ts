import type { Exercise, PersonalRecord, PrKind, SetLog } from '@/db/types'
import { formatVolume, formatWeight, round2 } from './units'
import { setVolume, summarize, weightModeLookup } from './volume'

/**
 * זיהוי שיאים אישיים.
 *
 * שני כללים שחוזרים בכל הקובץ:
 *   1. סטי חימום לא שוברים שיאים. אף פעם.
 *   2. המשקל מושווה בדיוק כמו שהוא רשום על המכונה — perSide לא מוכפל כאן.
 *      ההכפלה קיימת רק בחישוב הנפח, ולכן הנפח מגיע מ-volume.ts ולא מחושב כאן.
 */

const EPS = 1e-6

function near(a: number, b: number): boolean {
  return Math.abs(a - b) < EPS
}

/** "חזרה אחת" · "10 חזרות" */
function repsText(n: number): string {
  return n === 1 ? 'חזרה אחת' : `${n} חזרות`
}

export interface PrCandidate {
  kind: PrKind
  value: number
  weightKg: number | null
  reps: number | null
}

export interface PrEvent {
  exerciseId: string
  kind: PrKind
  value: number
  previous: number | null
  weightKg: number | null
  reps: number | null
}

const PR_LABELS: Record<PrKind, string> = {
  maxWeight: 'שיא משקל',
  repsAtMaxWeight: 'שיא חזרות במשקל השיא',
  maxReps: 'שיא חזרות',
  maxSessionVolume: 'שיא נפח באימון',
}

export function prLabel(kind: PrKind): string {
  return PR_LABELS[kind]
}

export function prHeadline(exercise: Exercise, event: PrEvent): string {
  switch (event.kind) {
    case 'maxWeight':
      return `שיא חדש — ${formatWeight(event.value, exercise.weightMode)}`
    case 'repsAtMaxWeight':
      return `שיא חדש — ${repsText(event.value)} ב-${formatWeight(event.weightKg, exercise.weightMode)}`
    case 'maxReps':
      return `שיא חדש — ${repsText(event.value)}`
    case 'maxSessionVolume':
      return `שיא חדש — ${formatVolume(event.value)} באימון`
  }
}

// ─── שיאים של סט בודד ──────────────────────────────────────────────────────

/**
 * מה הסט הזה *מנסה* לשבור, לפני השוואה מול הקיים.
 * @param currentMaxWeight שיא המשקל הנוכחי בתרגיל, null כשאין עדיין
 */
function candidatesFor(
  exercise: Exercise,
  set: Pick<SetLog, 'type' | 'weightKg' | 'reps'>,
  currentMaxWeight: number | null
): PrCandidate[] {
  if (exercise.weightMode === 'bodyweight') {
    // בלי משקל חיצוני נשארות רק החזרות
    return set.reps > 0 ? [{ kind: 'maxReps', value: set.reps, weightKg: null, reps: set.reps }] : []
  }

  const out: PrCandidate[] = []
  const isNewMax = set.weightKg > 0 && (currentMaxWeight === null || set.weightKg > currentMaxWeight + EPS)
  if (isNewMax) {
    out.push({ kind: 'maxWeight', value: set.weightKg, weightKg: set.weightKg, reps: set.reps })
  }
  const atMax = currentMaxWeight !== null && near(set.weightKg, currentMaxWeight)
  if (set.reps > 0 && (isNewMax || atMax)) {
    out.push({ kind: 'repsAtMaxWeight', value: set.reps, weightKg: set.weightKg, reps: set.reps })
  }
  return out
}

/** מזהה שיאים שסט עבודה בודד שבר. סטי חימום תמיד מחזירים []. */
export function detectSetPrs(
  exercise: Exercise,
  set: Pick<SetLog, 'type' | 'weightKg' | 'reps'>,
  existing: readonly PersonalRecord[]
): PrEvent[] {
  if (set.type !== 'work') return []

  const prevOf = (kind: PrKind): number | null => existing.find((r) => r.kind === kind)?.value ?? null
  const currentMaxWeight = prevOf('maxWeight')

  const events: PrEvent[] = []
  for (const c of candidatesFor(exercise, set, currentMaxWeight)) {
    const previous = prevOf(c.kind)
    // שיא משקל חדש מאפס את מונה החזרות: החזרות הקודמות היו במשקל אחר ולא
    // ניתנות להשוואה, ולכן הסט הזה נרשם גם אם מספר החזרות שלו נמוך יותר.
    const seedsReps = c.kind === 'repsAtMaxWeight' && events.some((e) => e.kind === 'maxWeight')
    const beats = seedsReps || (previous === null ? c.value > 0 : c.value > previous + EPS)
    if (beats) {
      events.push({
        exerciseId: exercise.id,
        kind: c.kind,
        value: c.value,
        previous,
        weightKg: c.weightKg,
        reps: c.reps,
      })
    }
  }
  return events
}

/** מזהה שיא נפח לתרגיל אחד באימון אחד */
export function detectVolumePr(
  exercise: Exercise,
  sessionSets: readonly SetLog[],
  existing: readonly PersonalRecord[]
): PrEvent | null {
  const mine = sessionSets.filter((s) => s.exerciseId === exercise.id)
  if (mine.length === 0) return null

  const { volumeKg } = summarize(mine, weightModeLookup([exercise]))
  if (volumeKg <= 0) return null

  const previous = existing.find((r) => r.kind === 'maxSessionVolume')?.value ?? null
  if (previous !== null && volumeKg <= previous + EPS) return null

  return {
    exerciseId: exercise.id,
    kind: 'maxSessionVolume',
    value: volumeKg,
    previous,
    weightKg: null,
    reps: null,
  }
}

// ─── בנייה מחדש מכל ההיסטוריה ──────────────────────────────────────────────

interface SessionVolume {
  volumeKg: number
  /** רגע הסט האחרון באימון — הרגע שבו הנפח הושלם */
  achievedAt: number
}

interface ExerciseAcc {
  maxWeight: SetLog | null
  repsAtMaxWeight: SetLog | null
  maxReps: SetLog | null
  volumes: Map<string, SessionVolume>
}

function emptyAcc(): ExerciseAcc {
  return { maxWeight: null, repsAtMaxWeight: null, maxReps: null, volumes: new Map() }
}

function record(exerciseId: string, kind: PrKind, value: number, set: SetLog, weighted: boolean): PersonalRecord {
  return {
    exerciseId,
    kind,
    value,
    weightKg: weighted ? set.weightKg : null,
    reps: set.reps,
    sessionId: set.sessionId,
    achievedAt: set.completedAt,
  }
}

/**
 * בנייה מלאה של טבלת השיאים מכל ההיסטוריה — משמש אחרי ייבוא גיבוי.
 *
 * מעבר יחיד וללא מיון: כל השוואה מכריעה תיקו לטובת החותמת המוקדמת, ולכן
 * התוצאה זהה בלי קשר לסדר שבו הסטים מגיעים.
 */
export function rebuildPrs(
  exercises: readonly Exercise[],
  sets: readonly SetLog[]
): PersonalRecord[] {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const accs = new Map<string, ExerciseAcc>()

  for (const s of sets) {
    if (s.type !== 'work') continue
    const ex = byId.get(s.exerciseId)
    if (!ex) continue

    let acc = accs.get(s.exerciseId)
    if (!acc) {
      acc = emptyAcc()
      accs.set(s.exerciseId, acc)
    }

    if (ex.weightMode === 'bodyweight') {
      const best = acc.maxReps
      if (
        s.reps > 0 &&
        (best === null || s.reps > best.reps || (s.reps === best.reps && s.completedAt < best.completedAt))
      ) {
        acc.maxReps = s
      }
      continue
    }

    if (s.weightKg > 0) {
      const top = acc.maxWeight
      if (top === null || s.weightKg > top.weightKg + EPS) {
        acc.maxWeight = s
        acc.repsAtMaxWeight = s.reps > 0 ? s : null
      } else if (near(s.weightKg, top.weightKg)) {
        if (s.completedAt < top.completedAt) acc.maxWeight = s
        const best = acc.repsAtMaxWeight
        if (
          s.reps > 0 &&
          (best === null || s.reps > best.reps || (s.reps === best.reps && s.completedAt < best.completedAt))
        ) {
          acc.repsAtMaxWeight = s
        }
      }
    }

    const v = setVolume(s, ex.weightMode)
    if (v > 0) {
      const cur = acc.volumes.get(s.sessionId)
      if (cur) {
        cur.volumeKg = round2(cur.volumeKg + v)
        cur.achievedAt = Math.max(cur.achievedAt, s.completedAt)
      } else {
        acc.volumes.set(s.sessionId, { volumeKg: v, achievedAt: s.completedAt })
      }
    }
  }

  const out: PersonalRecord[] = []
  for (const ex of exercises) {
    const acc = accs.get(ex.id)
    if (!acc) continue

    if (acc.maxWeight) out.push(record(ex.id, 'maxWeight', acc.maxWeight.weightKg, acc.maxWeight, true))
    if (acc.repsAtMaxWeight) {
      out.push(record(ex.id, 'repsAtMaxWeight', acc.repsAtMaxWeight.reps, acc.repsAtMaxWeight, true))
    }
    if (acc.maxReps) out.push(record(ex.id, 'maxReps', acc.maxReps.reps, acc.maxReps, false))

    let bestSession: string | null = null
    let best: SessionVolume | null = null
    for (const [sessionId, v] of acc.volumes) {
      if (
        best === null ||
        v.volumeKg > best.volumeKg + EPS ||
        (near(v.volumeKg, best.volumeKg) && v.achievedAt < best.achievedAt)
      ) {
        best = v
        bestSession = sessionId
      }
    }
    if (best && bestSession !== null && best.volumeKg > 0) {
      out.push({
        exerciseId: ex.id,
        kind: 'maxSessionVolume',
        value: best.volumeKg,
        weightKg: null,
        reps: null,
        sessionId: bestSession,
        achievedAt: best.achievedAt,
      })
    }
  }
  return out
}
