import Dexie from 'dexie'
import { db } from '@/db/db'
import type {
  Block,
  BodyWeightEntry,
  Exercise,
  ExerciseRating,
  MuscleGroup,
  PersonalRecord,
  PlanItem,
  Routine,
  RoutineId,
  Session,
  SetLog,
} from '@/db/types'
import type { ExerciseSessionSummary } from '@/domain/recommendation'
import { workingWeight } from '@/domain/volume'

/**
 * כל הקריאות מהמסד, במקום אחד.
 *
 * שני כללים שחוזרים כאן: משתמשים באינדקסים שהוגדרו ב-db.ts ולא סורקים
 * טבלאות, ובפרט לא נוגעים ב-setLogs כשמסננים היסטוריה — בשביל זה קיימים
 * האינדקסים ה-multiEntry על sessions.
 */

// ─── קטלוג ─────────────────────────────────────────────────────────────────

export async function getAllExercises(includeInactive = false): Promise<Exercise[]> {
  const all = await db.exercises.orderBy('order').toArray()
  return includeInactive ? all : all.filter((e) => e.isActive)
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id)
}

export async function getExercisesByGroup(
  group: MuscleGroup,
  includeInactive = false
): Promise<Exercise[]> {
  const all = await db.exercises.where('muscleGroup').equals(group).toArray()
  const visible = includeInactive ? all : all.filter((e) => e.isActive)
  return visible.sort((a, b) => a.order - b.order)
}

/**
 * מועמדים להחלפה — "המתקן תפוס".
 * קודם תרגילים שמכוונים לאותו מיקוד בדיוק, כי הם התחליף הקרוב ביותר,
 * ואחר כך שאר קבוצת השריר.
 */
export async function getSubstituteCandidates(exercise: Exercise): Promise<Exercise[]> {
  const sameGroup = await db.exercises.where('muscleGroup').equals(exercise.muscleGroup).toArray()
  return sameGroup
    .filter((e) => e.isActive && e.id !== exercise.id)
    .sort((a, b) => {
      const rank = (e: Exercise) => (e.subTarget === exercise.subTarget ? 0 : 1)
      return rank(a) - rank(b) || a.order - b.order
    })
}

/** מה שהורמת לאחרונה בתרגיל — המספר שעונה על "כמה אני עושה בזה" */
export interface LastPerformed {
  weightKg: number
  reps: number
  at: number
  sets: number
}

/**
 * המשקל האחרון של *כל* התרגילים, בסריקה אחת.
 *
 * ספריית התרגילים צריכה את המספר הזה לכל שורה, ושאילתה נפרדת לכל תרגיל הייתה
 * עשרות הלוך-ושוב. נפח הנתונים של משתמש יחיד קטן מספיק כדי לסרוק פעם אחת.
 */
export async function getLastPerformedMap(): Promise<Map<string, LastPerformed>> {
  const byExercise = new Map<string, SetLog[]>()
  await db.setLogs.each((s) => {
    if (s.type !== 'work') return
    const list = byExercise.get(s.exerciseId)
    if (list) list.push(s)
    else byExercise.set(s.exerciseId, [s])
  })

  const out = new Map<string, LastPerformed>()
  for (const [exerciseId, sets] of byExercise) {
    const latest = sets.reduce((a, b) => (b.completedAt > a.completedAt ? b : a))
    // רק הסטים מאותו אימון — "כמה אני עושה" זה המשקל של הפעם האחרונה, לא שיא
    const sameSession = sets.filter((s) => s.sessionId === latest.sessionId)
    const weightKg = workingWeight(sameSession) ?? latest.weightKg
    const atWeight = sameSession.filter((s) => s.weightKg === weightKg)
    out.set(exerciseId, {
      weightKg,
      reps: atWeight.length ? Math.max(...atWeight.map((s) => s.reps)) : latest.reps,
      at: latest.completedAt,
      sets: sameSession.length,
    })
  }
  return out
}

// ─── תוכניות ובלוקים ───────────────────────────────────────────────────────

/** כל התוכניות, כולל כבויות. למסך העריכה. */
export async function getRoutines(): Promise<Routine[]> {
  return db.routines.orderBy('order').toArray()
}

/**
 * רק התוכניות שפעילות עכשיו — זה מה שמסך הבית ובחירת האימון עובדים איתו.
 * בלי הסינון הזה, "מה מתאמנים היום" היה מערבב פול-באדי עם פיצול.
 */
/**
 * פריט התוכנית הפעילה שמתאר את התרגיל הזה, אם הוא נמצא באחת מהן.
 *
 * מסך התרגיל מציג "המלצה להיום" ו"היעד", ובלי זה הוא מדד אותם מול הטווח
 * שבקטלוג בזמן שכרטיס האימון מודד מול הטווח שבתוכנית — שני מסכים שאומרים
 * דברים שונים על אותם נתונים. הבלוקים נכללים כי גם הם מגדירים יעד לתרגיל.
 */
export async function getPlanItemFor(exerciseId: string): Promise<PlanItem | null> {
  const [routines, blocks] = await Promise.all([getActiveRoutines(), getBlocks()])
  for (const plan of [...routines, ...blocks]) {
    const item = plan.items.find((i) => i.exerciseId === exerciseId)
    if (item) return item
  }
  return null
}

export async function getActiveRoutines(): Promise<Routine[]> {
  const all = await db.routines.orderBy('order').toArray()
  const active = all.filter((r) => r.isActive)
  // ביטוח: אם כובו כולן בטעות, עדיף להציע הכל מאשר מסך בית ריק
  return active.length > 0 ? active : all
}

/** מפעיל קבוצת תוכניות אחת ומכבה את השאר, בפעולה אחת */
export async function activateRoutines(ids: readonly RoutineId[]): Promise<void> {
  const wanted = new Set<string>(ids)
  await db.transaction('rw', db.routines, async () => {
    for (const routine of await db.routines.toArray()) {
      const next = wanted.has(routine.id)
      if (routine.isActive !== next) await db.routines.put({ ...routine, isActive: next })
    }
  })
}

export async function getBlocks(): Promise<Block[]> {
  return db.blocks.orderBy('order').toArray()
}

// ─── אימונים ───────────────────────────────────────────────────────────────

/** רק אימונים שנסגרו, מהחדש לישן */
export async function getFinishedSessions(limit?: number): Promise<Session[]> {
  const all = await db.sessions.orderBy('startedAt').reverse().toArray()
  const finished = all.filter((s) => s.endedAt > 0)
  return limit === undefined ? finished : finished.slice(0, limit)
}

export async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id)
}

export async function getSetsForSession(sessionId: string): Promise<SetLog[]> {
  const sets = await db.setLogs.where('sessionId').equals(sessionId).toArray()
  return sets.sort((a, b) => a.completedAt - b.completedAt)
}

export async function getRatingsForSession(sessionId: string): Promise<ExerciseRating[]> {
  return db.ratings.where('sessionId').equals(sessionId).toArray()
}

/** הסטים האחרונים של תרגיל, מהחדש לישן (הפוך את המערך לגרף התקדמות) */
export async function getSetsForExercise(exerciseId: string, limit?: number): Promise<SetLog[]> {
  const range = db.setLogs
    .where('[exerciseId+completedAt]')
    .between([exerciseId, Dexie.minKey], [exerciseId, Dexie.maxKey])
    .reverse()
  return limit === undefined ? range.toArray() : range.limit(limit).toArray()
}

/**
 * ההיסטוריה של תרגיל כסיכומים לפי אימון, מהחדש לישן — בדיוק מה שמנוע
 * ההמלצות צורך. אימון שלא נסגר לא נכלל: הוא עדיין בתהליך ואי אפשר ללמוד ממנו.
 */
export async function getExerciseHistory(
  exerciseId: string,
  sessionLimit = 12
): Promise<ExerciseSessionSummary[]> {
  const sessions = (await db.sessions.where('exerciseIds').equals(exerciseId).toArray())
    .filter((s) => s.endedAt > 0)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, sessionLimit)
  if (!sessions.length) return []

  const keys = sessions.map((s) => [s.id, exerciseId])
  const [sets, ratings] = await Promise.all([
    db.setLogs.where('[sessionId+exerciseId]').anyOf(keys).toArray(),
    db.ratings.where('[sessionId+exerciseId]').anyOf(keys).toArray(),
  ])

  const setsBySession = new Map<string, SetLog[]>()
  for (const s of sets) {
    const list = setsBySession.get(s.sessionId)
    if (list) list.push(s)
    else setsBySession.set(s.sessionId, [s])
  }
  const ratingBySession = new Map(ratings.map((r) => [r.sessionId, r]))

  return sessions.map((session) => {
    const own = (setsBySession.get(session.id) ?? []).sort((a, b) => a.completedAt - b.completedAt)
    const rating = ratingBySession.get(session.id)
    return {
      sessionId: session.id,
      date: session.date,
      startedAt: session.startedAt,
      sets: own,
      rating: rating ? { rating: rating.rating, rir: rating.rir } : null,
    }
  })
}

/** הביצוע האחרון בתרגיל, או null אם עוד לא בוצע באף אימון שנסגר */
export async function getLastPerformance(exerciseId: string): Promise<ExerciseSessionSummary | null> {
  const [last] = await getExerciseHistory(exerciseId, 1)
  return last ?? null
}

// ─── שיאים ─────────────────────────────────────────────────────────────────

export async function getPrsForExercise(exerciseId: string): Promise<PersonalRecord[]> {
  return db.prs.where('exerciseId').equals(exerciseId).toArray()
}

export async function getAllPrs(): Promise<PersonalRecord[]> {
  return db.prs.toArray()
}

export async function putPr(pr: PersonalRecord): Promise<void> {
  await db.prs.put(pr)
}

// ─── משקל גוף ──────────────────────────────────────────────────────────────

/** מהישן לחדש — זה הסדר שהגרף צריך */
export async function getBodyWeights(): Promise<BodyWeightEntry[]> {
  return db.bodyWeights.orderBy('date').toArray()
}

/** שקילה אחת ליום: שקילה חוזרת באותו תאריך דורסת את הקודמת */
export async function addBodyWeight(
  dateISO: string,
  weightKg: number,
  note?: string
): Promise<void> {
  await db.transaction('rw', db.bodyWeights, async () => {
    const existing = await db.bodyWeights.where('date').equals(dateISO).first()
    if (existing?.id !== undefined) {
      await db.bodyWeights.update(existing.id, { weightKg, note: note ?? existing.note })
      return
    }
    await db.bodyWeights.add({ date: dateISO, weightKg, note: note ?? '', createdAt: Date.now() })
  })
}

export async function deleteBodyWeight(id: number): Promise<void> {
  await db.bodyWeights.delete(id)
}

// ─── סינון היסטוריה ────────────────────────────────────────────────────────

export interface HistoryFilter {
  routineId?: RoutineId | null
  blockId?: string | null
  exerciseId?: string | null
  query?: string
}

/** משווה טקסט עברי בלי רגישות לגרשיים טיפוגרפיים או לרישיות באנגלית */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[״׳"']/g, '').trim()
}

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const out = new Set<string>()
  for (const id of a) if (b.has(id)) out.add(id)
  return out
}

/**
 * חיפוש באימונים. כל הסינונים אופציונליים ומצטברים (וגם).
 * הטקסט החופשי נפתר קודם מול הקטלוג — שמות תרגילים, תוכניות ובלוקים —
 * ורק אז מול האימונים דרך האינדקסים, כך ש-setLogs לא נסרק בכלל.
 */
export async function searchSessions(filter: HistoryFilter): Promise<Session[]> {
  const sets: Set<string>[] = []

  if (filter.routineId) {
    sets.push(new Set(await db.sessions.where('routineId').equals(filter.routineId).primaryKeys()))
  }
  if (filter.blockId) {
    sets.push(new Set(await db.sessions.where('blockIds').equals(filter.blockId).primaryKeys()))
  }
  if (filter.exerciseId) {
    sets.push(new Set(await db.sessions.where('exerciseIds').equals(filter.exerciseId).primaryKeys()))
  }

  const q = filter.query ? normalize(filter.query) : ''
  if (q) {
    const [exercises, routines, blocks] = await Promise.all([
      db.exercises.toArray(),
      db.routines.toArray(),
      db.blocks.toArray(),
    ])
    const exerciseIds = exercises
      .filter(
        (e) =>
          normalize(e.name).includes(q) ||
          normalize(e.nameEn ?? '').includes(q) ||
          normalize(e.subTarget).includes(q)
      )
      .map((e) => e.id)
    const routineIds = routines
      .filter((r) => normalize(r.name).includes(q) || normalize(r.subtitle).includes(q))
      .map((r) => r.id)
    const blockIds = blocks.filter((b) => normalize(b.name).includes(q)).map((b) => b.id)

    const matched = new Set<string>()
    const collect = async (keys: string[], index: string) => {
      if (!keys.length) return
      for (const id of await db.sessions.where(index).anyOf(keys).primaryKeys()) matched.add(id)
    }
    await collect(exerciseIds, 'exerciseIds')
    await collect(routineIds, 'routineId')
    await collect(blockIds, 'blockIds')
    sets.push(matched)
  }

  if (!sets.length) return getFinishedSessions()

  const ids = sets.reduce((acc, s) => intersect(acc, s))
  if (!ids.size) return []

  const found = await db.sessions.bulkGet([...ids])
  return found
    .filter((s): s is Session => s !== undefined && s.endedAt > 0)
    .sort((a, b) => b.startedAt - a.startedAt)
}

/** מפת id → שם, כדי שרשימת ההיסטוריה לא תשלוף תרגיל לכל שורה */
export async function getExerciseNames(): Promise<Map<string, string>> {
  const all = await db.exercises.toArray()
  return new Map(all.map((e) => [e.id, e.name]))
}
