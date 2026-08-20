import Dexie from 'dexie'
import { db } from '@/db/db'
import type {
  Block,
  BodyWeightEntry,
  Exercise,
  ExerciseRating,
  PersonalRecord,
  PlanItem,
  Routine,
  RoutineId,
  Session,
  SetLog,
} from '@/db/types'
import type { ExerciseSessionSummary } from '@/domain/recommendation'
import { workingWeight } from '@/domain/volume'
import { normalize } from '@/lib/text'

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
    const summary = lastPerformedFrom(sets)
    if (summary) out.set(exerciseId, summary)
  }
  return out
}

/**
 * אותו חישוב, על סטים של תרגיל אחד שכבר נשלפו.
 *
 * מסך התרגיל קרא ל-`getLastPerformedMap` — סריקה של *כל* טבלת הסטים — רק כדי
 * לשלוף ממנה שורה אחת, בתוך useLiveQuery שרץ מחדש על כל כתיבה. אחרי שלוש שנות
 * אימון זו סריקה של אלפי רשומות בכל פתיחת מסך, וכל המידע ממילא כבר ביד.
 */
export function lastPerformedFrom(sets: readonly SetLog[]): LastPerformed | null {
  const work = sets.filter((s) => s.type === 'work')
  if (!work.length) return null
  const latest = work.reduce((a, b) => (b.completedAt > a.completedAt ? b : a))
  // רק הסטים מאותו אימון — "כמה אני עושה" זה המשקל של הפעם האחרונה, לא שיא
  const sameSession = work.filter((s) => s.sessionId === latest.sessionId)
  const weightKg = workingWeight(sameSession) ?? latest.weightKg
  const atWeight = sameSession.filter((s) => s.weightKg === weightKg)
  return {
    weightKg,
    reps: atWeight.length ? Math.max(...atWeight.map((s) => s.reps)) : latest.reps,
    at: latest.completedAt,
    sets: sameSession.length,
  }
}

// ─── תוכניות ובלוקים ───────────────────────────────────────────────────────

/** כל התוכניות, כולל כבויות. למסך העריכה. */
export async function getRoutines(): Promise<Routine[]> {
  return db.routines.orderBy('order').toArray()
}

/** תוכנית אחת לפי מזהה, קבועה או שמורה */
export async function getRoutine(id: RoutineId): Promise<Routine | undefined> {
  return db.routines.get(id)
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

/**
 * התוכניות הקבועות שפעילות עכשיו — פול-באדי *או* הפיצול, לא שתיהן.
 *
 * האימונים השמורים מסוננים החוצה כאן, וזה הגידור המרכזי של כל הפיצ׳ר: הם
 * תמיד `isActive`, ולכן בלי הסינון אימון שמור חדש היה נכנס לרשת התוכניות
 * במסך הבית, לגיליון הפתיחה, ול-`suggestRoutine` — שם "מעולם לא בוצע" גובר
 * על כל ותק, כלומר הוא היה חוטף את ההצעה היומית מיד עם השמירה.
 *
 * הבדיקה היא `kind !== 'custom'` ולא `=== 'program'` בכוונה: שורה משחזור
 * גיבוי ישן מגיעה בלי `kind`, וברירת המחדל שלה חייבת להיות "תוכנית קבועה".
 *
 * ביטוח הנפילה-לאחור ("אם כובו כולן, עדיף להציע הכל") מחושב בתוך המחיצה של
 * התוכניות הקבועות בלבד. לפני כן הוא היה נשבר ברגע שקיים אימון שמור אחד:
 * הוא תמיד פעיל, ולכן `active.length > 0` היה מתקיים לנצח והביטוח לא היה
 * נכנס לפעולה אף פעם.
 */
export async function getActiveRoutines(): Promise<Routine[]> {
  const all = (await db.routines.orderBy('order').toArray()).filter((r) => r.kind !== 'custom')
  const active = all.filter((r) => r.isActive)
  return active.length > 0 ? active : all
}

/**
 * האימונים שהמשתמש בנה ושמר.
 *
 * ל-`isActive` יש כאן משמעות שונה מזו שיש לו בתוכנית קבועה: שם הוא "התוכנית
 * הפעילה כרגע" ומתחלף במתג, וכאן הוא "לא נמחק". מחיקה של אימון שמור היא רכה
 * בכוונה — מחיקת השורה הייתה מייתמת את השם של כל אימון בהיסטוריה שבוצע לפיו,
 * והם היו הופכים ל"אימון חופשי" למפרע.
 */
export async function getCustomRoutines(): Promise<Routine[]> {
  return (await db.routines.orderBy('order').toArray()).filter(
    (r) => r.kind === 'custom' && r.isActive
  )
}

/**
 * מפעיל קבוצת תוכניות אחת ומכבה את השאר, בפעולה אחת.
 * אימונים שמורים לא נוגעים — מעבר בין פול-באדי לפיצול הוא החלטה על התוכניות
 * הקבועות, ואין שום סיבה שהוא יכבה אימון שהמשתמש בנה בעצמו.
 */
export async function activateRoutines(ids: readonly RoutineId[]): Promise<void> {
  const wanted = new Set<string>(ids)
  await db.transaction('rw', db.routines, async () => {
    for (const routine of await db.routines.toArray()) {
      if (routine.kind === 'custom') continue
      const next = wanted.has(routine.id)
      if (routine.isActive !== next) await db.routines.put({ ...routine, isActive: next })
    }
  })
}

/**
 * המספר הבא בסדר התצוגה של התוכניות.
 *
 * ‏`db.routines.orderBy('order')` הוא סריקת אינדקס, ודקסי משמיטה ממנה שורה
 * שהמפתח שלה `undefined` — כלומר אימון שמור בלי `order` נשמר בהצלחה ואז
 * פשוט לא מופיע בשום מסך. השדה חובה, ולכן הוא נקבע כאן ולא בקריאה.
 */
export async function nextRoutineOrder(): Promise<number> {
  const all = await db.routines.toArray()
  return all.reduce((max, r) => Math.max(max, r.order ?? 0), -1) + 1
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

/**
 * אימונים שנסגרו מתאריך מסוים והלאה, עם הסטים שלהם — בשאילתה ממוקדת.
 *
 * לוח הנפח מסתכל על שמונה שבועות אחורה, אבל טען את *כל* טבלת הסטים לזיכרון
 * ואת כל האימונים כדי לחשב אותם. אחרי שלוש שנות אימון אלה אלפי רשומות שנקראות
 * בכל כניסה למסך הנתונים, וזה גדל ליניארית לנצח. האינדקס על startedAt כבר קיים.
 */
export async function getSessionsSince(
  from: number
): Promise<{ sessions: Session[]; sets: SetLog[] }> {
  const sessions = (await db.sessions.where('startedAt').aboveOrEqual(from).toArray()).filter(
    (s) => s.endedAt > 0
  )
  if (!sessions.length) return { sessions, sets: [] }
  const sets = await db.setLogs
    .where('sessionId')
    .anyOf(sessions.map((s) => s.id))
    .toArray()
  return { sessions, sets }
}

/**
 * האם קיים ולו אימון אחד בהיסטוריה.
 *
 * `count()` על הטבלה ולא שאילתה על endedAt: השדה הזה אינו מאונדקס, ושורה
 * בטבלת sessions נכתבת ממילא רק ב-finish — אימון פתוח חי ב-activeWorkout
 * בלבד. הפונקציה משמשת רק כדי להחליט אם להראות מצב ריק, ולכן גם אם גיבוי
 * ערוך ידנית היה מכניס שורה חריגה, המחיר הוא לוח שמוצג במקום מסך ריק.
 */
export async function hasAnyFinishedSession(): Promise<boolean> {
  return (await db.sessions.count()) > 0
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

// ─── שיאים ─────────────────────────────────────────────────────────────────

export async function getPrsForExercise(exerciseId: string): Promise<PersonalRecord[]> {
  return db.prs.where('exerciseId').equals(exerciseId).toArray()
}

export async function getAllPrs(): Promise<PersonalRecord[]> {
  return db.prs.toArray()
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

    /*
      גם בהערות האימון.

      הערה היא המקום הטבעי לכתוב "כאב בכתף שמאל בלחיצת כתפיים", ובלי החיפוש
      הזה אין שום דרך למצוא אחר כך את כל הפעמים שזה הוזכר — כלומר ההערות הן
      כתיבה לחור שחור. טבלת sessions קטנה (מאות שורות לשנים של אימון), ולכן
      סריקה שלה זולה, ובניגוד ל-setLogs היא לא גדלה עם כל סט.
    */
    for (const session of await db.sessions.toArray()) {
      if (session.notes && normalize(session.notes).includes(q)) matched.add(session.id)
    }
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

