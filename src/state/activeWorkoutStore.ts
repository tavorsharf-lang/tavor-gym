import { create } from 'zustand'
import { db, getSettings } from '@/db/db'
import type {
  ActiveWorkout,
  Block,
  DraftSet,
  Exercise,
  MuscleGroup,
  PersonalRecord,
  PlanItem,
  QueueItem,
  Rating,
  Rir,
  RoutineId,
  Session,
  SetLog,
  SetType,
  Substitution,
} from '@/db/types'
import { newId } from '@/domain/units'
import { summarize, weightModeLookup } from '@/domain/volume'
import { detectSetPrs, detectVolumePr, rebuildPrs, type PrEvent } from '@/domain/prs'
import { todayISO } from '@/lib/dates'

/**
 * מצב האימון הפעיל.
 *
 * ארכיטקטורה, ולמה דווקא ככה:
 *   • Zustand הוא מקור האמת בזיכרון. אחרי כל פעולה כותבים את כל המצב לשורה
 *     אחת ב-activeWorkout. זו ההתאוששות מקריסה — הטלפון יכול למות באמצע סט
 *     והכל יחזור.
 *   • הסטים נכתבים ל-setLogs *מיד*, לא בסיום האימון. הטבלה היא האמת העמידה;
 *     setsByKey הוא רק מראה מהירה לתצוגה.
 *   • אסור להאזין לטבלת activeWorkout עם useLiveQuery — היא נכתבת אחרי כל
 *     נגיעה, וזה היה מרנדר מחדש את מסך האימון כל הזמן.
 */

// ─── עזרים ─────────────────────────────────────────────────────────────────

function itemFromPlan(
  planItem: PlanItem,
  source: 'routine' | 'block',
  sourceId: string
): QueueItem {
  return {
    key: newId('q'),
    exerciseId: planItem.exerciseId,
    plannedExerciseId: planItem.exerciseId,
    source,
    sourceId,
    targetSets: planItem.targetSets,
    targetReps: { ...planItem.targetReps },
    restSeconds: planItem.restSeconds,
    startWeightKg: planItem.startWeightKg ?? null,
    status: 'pending',
    warmupOffered: false,
  }
}

/** התרגיל הבא שעוד לא נסגר, בהעדפה לפריטים שלא נדחו */
function nextOpenKey(queue: readonly QueueItem[], afterKey: string | null): string | null {
  const start = afterKey ? queue.findIndex((q) => q.key === afterKey) + 1 : 0
  for (let i = start; i < queue.length; i++) {
    if (queue[i].status === 'pending' || queue[i].status === 'deferred') return queue[i].key
  }
  // סיבוב שני מההתחלה — תופס תרגילים שדולגו וחזרו לתור
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].status === 'pending' || queue[i].status === 'deferred') return queue[i].key
  }
  return null
}

// ─── ה-store ───────────────────────────────────────────────────────────────

interface WorkoutState {
  workout: ActiveWorkout | null
  /** קטלוג התרגילים של האימון הנוכחי — כדי לא לשאול את ה-DB בכל רינדור */
  exercisesById: Record<string, Exercise>
  /** מטמון שיאים, כדי לזהות שיא ברגע שהסט נסגר */
  prCache: PersonalRecord[]
  /** שיאים חדשים שממתינים לחגיגה. ה-UI מרוקן אותם */
  pendingPrEvents: PrEvent[]
  hydrated: boolean

  // מחזור חיים
  hydrate: () => Promise<void>
  start: (routineId: RoutineId | null, blockIds: string[]) => Promise<void>
  discard: () => Promise<void>
  finish: () => Promise<string | null>

  // תיעוד
  logSet: (key: string, type: SetType, weightKg: number, reps: number) => Promise<void>
  updateSet: (key: string, logId: number, weightKg: number, reps: number) => Promise<void>
  toggleSetType: (key: string, logId: number) => Promise<void>
  removeSet: (key: string, logId: number) => Promise<void>
  rate: (key: string, rating: Rating, rir: Rir | null) => Promise<void>
  markWarmupOffered: (key: string) => Promise<void>
  /** שינוי היעד של התרגיל תוך כדי אימון — נשאר בתור ולא נוגע בתוכנית הקבועה */
  setTargetSets: (key: string, targetSets: number) => Promise<void>
  setItemRest: (key: string, seconds: number) => Promise<void>

  // ניווט ותור
  setCurrent: (key: string) => Promise<void>
  completeCurrent: () => Promise<void>
  deferItem: (key: string) => Promise<void>
  substitute: (key: string, newExerciseId: string, reason: Substitution['reason']) => Promise<void>
  reorder: (fromIndex: number, toIndex: number) => Promise<void>
  addExercise: (exerciseId: string) => Promise<void>

  // מנוחה
  startRest: (key: string, seconds: number) => Promise<void>
  adjustRest: (deltaSeconds: number) => Promise<void>
  stopRest: () => Promise<void>

  setNotes: (notes: string) => Promise<void>
  drainPrEvents: () => PrEvent[]
}

/** כותב את המצב לדיסק. נקרא אחרי כל מוטציה. */
async function persist(w: ActiveWorkout): Promise<void> {
  await db.activeWorkout.put({ ...w, lastSavedAt: Date.now() })
}

/**
 * מחשב מחדש את השיאים של תרגיל מתוך כל הסטים שלו, ומחליף את הרשומות במסד.
 *
 * למה זה קיים: השיא נכתב ברגע שהסט נסגר, כדי שהקונפטי יעוף בזמן אמת. אבל סט
 * אפשר לתקן, למחוק, להפוך לחימום, ואימון שלם אפשר לבטל — ואז השיא שנרשם כבר
 * לא מייצג שום דבר שקרה. כאן setLogs חוזר להיות מקור האמת היחיד.
 *
 * מחזיר את הרשומות המעודכנות כדי שהקורא יוכל לרענן את המטמון.
 */
async function reconcilePrsFor(
  exerciseIds: readonly string[],
  exercisesById: Record<string, Exercise>
): Promise<PersonalRecord[]> {
  const unique = [...new Set(exerciseIds)].filter((id) => exercisesById[id])
  if (!unique.length) return []

  const rebuilt: PersonalRecord[] = []
  for (const id of unique) {
    const sets = await db.setLogs.where('exerciseId').equals(id).toArray()
    rebuilt.push(...rebuildPrs([exercisesById[id]], sets))
  }

  await db.transaction('rw', db.prs, async () => {
    // מוחקים את כל השיאים הישנים של התרגילים האלה לפני הכתיבה, אחרת סוג שיא
    // שכבר לא קיים (למשל repsAtMaxWeight אחרי שהסט היחיד נמחק) היה שורד
    for (const id of unique) await db.prs.where('exerciseId').equals(id).delete()
    if (rebuilt.length) await db.prs.bulkPut(rebuilt)
  })

  return rebuilt
}

export const useWorkout = create<WorkoutState>((set, get) => {
  /** מחיל שינוי על המצב ושומר אותו. מרכז את ה-persist בנקודה אחת. */
  const mutate = async (fn: (w: ActiveWorkout) => ActiveWorkout): Promise<void> => {
    const current = get().workout
    if (!current) return
    const next = fn(current)
    set({ workout: next })
    await persist(next)
  }

  /** מחשב מחדש שיאים של תרגילים ומסנכרן את המטמון שבזיכרון */
  const reconcile = async (exerciseIds: readonly string[]): Promise<void> => {
    const unique = [...new Set(exerciseIds)]
    if (!unique.length) return
    const rebuilt = await reconcilePrsFor(unique, get().exercisesById)
    const affected = new Set(unique)
    set({
      prCache: [...get().prCache.filter((p) => !affected.has(p.exerciseId)), ...rebuilt],
    })
  }

  /** מונע ריצה כפולה של finish כשלוחצים על "סיים אימון" פעמיים ברצף */
  let finishing: Promise<string | null> | null = null

  return {
    workout: null,
    exercisesById: {},
    prCache: [],
    pendingPrEvents: [],
    hydrated: false,

    async hydrate() {
      const saved = await db.activeWorkout.get('current')
      if (!saved) {
        set({ hydrated: true })
        return
      }
      const [exercises, prs, sets] = await Promise.all([
        db.exercises.toArray(),
        db.prs.toArray(),
        db.setLogs.where('sessionId').equals(saved.sessionId).toArray(),
      ])

      // setLogs הוא האמת. בונים מחדש את המראה מהטבלה, למקרה שהמצב נשמר
      // חלקית לפני קריסה.
      const byKey: Record<string, DraftSet[]> = {}
      const keyOfLog = new Map<number, string>()
      for (const item of saved.queue) {
        for (const d of saved.setsByKey[item.key] ?? []) keyOfLog.set(d.logId, item.key)
      }
      for (const s of sets.sort((a, b) => a.completedAt - b.completedAt)) {
        if (s.id === undefined) continue
        const key =
          keyOfLog.get(s.id) ?? saved.queue.find((q) => q.exerciseId === s.exerciseId)?.key
        if (!key) continue
        ;(byKey[key] ??= []).push({
          logId: s.id,
          type: s.type,
          weightKg: s.weightKg,
          reps: s.reps,
          completedAt: s.completedAt,
        })
      }

      // מנוחה שהדד-ליין שלה עבר מזמן לא אמורה לצוץ בפתיחה מחדש ולצפצף.
      // עד שתי דקות זו עדיין אותה מנוחה שרק ננעל עליה המסך.
      const staleRest = saved.restEndsAt !== null && Date.now() - saved.restEndsAt > 120_000

      set({
        workout: {
          ...saved,
          setsByKey: byKey,
          restEndsAt: staleRest ? null : saved.restEndsAt,
          restForKey: staleRest ? null : saved.restForKey,
        },
        exercisesById: Object.fromEntries(exercises.map((e) => [e.id, e])),
        prCache: prs,
        hydrated: true,
      })
    },

    async start(routineId, blockIds) {
      /*
        אימון פתוח קודם נזרק כמו שצריך לפני שדורסים אותו.

        הסטים נכתבים ל-setLogs מיד, אבל שורת ה-session נכתבת רק ב-finish —
        ולכן דריסה של activeWorkout בלי ניקוי הייתה מותירה סטים בלי סשן: הם
        נספרים ב"משקל אחרון", בגרפים ובבניית השיאים, אבל בלתי נראים בהיסטוריה
        ולכן בלתי ניתנים למחיקה. ה-UI שואל לפני שמגיעים לכאן; זו הרשת שמתחת.
      */
      const open = get().workout
      if (open) await get().discard()

      const [exercises, routines, blocks, prs, settings] = await Promise.all([
        db.exercises.toArray(),
        db.routines.toArray(),
        db.blocks.toArray(),
        db.prs.toArray(),
        getSettings(),
      ])

      const queue: QueueItem[] = []
      const routine = routineId ? routines.find((r) => r.id === routineId) : undefined
      if (routine) {
        for (const it of [...routine.items].sort((a, b) => a.order - b.order)) {
          queue.push(itemFromPlan(it, 'routine', routine.id))
        }
      }
      // תרגיל שכבר נמצא בתוכנית לא נכנס שוב מבלוק נלווה. בפול-באדי, שמכסה
      // ממילא כתפיים ובטן, בלי זה היו מופיעים שני מופעים של אותו תרגיל.
      const already = new Set(queue.map((q) => q.exerciseId))
      const blockById = new Map<string, Block>(blocks.map((b) => [b.id, b]))
      for (const bid of blockIds) {
        const block = blockById.get(bid)
        if (!block) continue
        for (const it of [...block.items].sort((a, b) => a.order - b.order)) {
          if (already.has(it.exerciseId)) continue
          already.add(it.exerciseId)
          queue.push(itemFromPlan(it, 'block', block.id))
        }
      }

      // תרגילים שנמחקו מהקטלוג לא אמורים להופיע בתור
      const active = new Set(exercises.filter((e) => e.isActive).map((e) => e.id))
      const finalQueue = queue.filter((q) => active.has(q.exerciseId))
      if (finalQueue.length) finalQueue[0].status = 'active'

      const workout: ActiveWorkout = {
        id: 'current',
        sessionId: newId('s'),
        routineId,
        blockIds: [...blockIds],
        startedAt: Date.now(),
        queue: finalQueue,
        currentKey: finalQueue[0]?.key ?? null,
        setsByKey: {},
        ratingsByKey: {},
        substitutions: [],
        restEndsAt: null,
        restTotalSeconds: settings.defaultRestSeconds,
        restForKey: null,
        notes: '',
        lastSavedAt: Date.now(),
      }

      set({
        workout,
        exercisesById: Object.fromEntries(exercises.map((e) => [e.id, e])),
        prCache: prs,
        pendingPrEvents: [],
        hydrated: true,
      })
      await persist(workout)
    },

    async discard() {
      const w = get().workout
      if (w) {
        // התרגילים שנגעו בהם — צריך לחשב להם שיאים מחדש *אחרי* שהסטים נמחקו,
        // אחרת שיא מאימון שבוטל היה נשאר כרף להשוואה לנצח.
        // הכל בטרנזקציה אחת: קריסה בין המחיקה לחישוב מחדש הייתה משאירה בדיוק
        // את השיא הזה, וה-reconcile הבא היה רץ רק אם התרגיל ייערך שוב.
        const touched = [...new Set(w.queue.map((q) => q.exerciseId))]
        await db.transaction('rw', db.setLogs, db.prs, db.activeWorkout, async () => {
          await db.setLogs.where('sessionId').equals(w.sessionId).delete()
          await reconcile(touched)
          await db.activeWorkout.delete('current')
        })
        set({ workout: null, pendingPrEvents: [] })
        return
      }
      await db.activeWorkout.delete('current')
      set({ workout: null, pendingPrEvents: [] })
    },

    async finish() {
      // לחיצה כפולה על "סיים אימון" היא רפלקס נורמלי בטלפון. בלי הנעילה הזו
      // הריצה השנייה הייתה מכפילה את כל שורות הדירוג של האימון.
      if (finishing) return finishing

      finishing = (async (): Promise<string | null> => {
        const w = get().workout
        const exercises = get().exercisesById
        if (!w) return null

        const sets = await db.setLogs.where('sessionId').equals(w.sessionId).toArray()
        const modeOf = weightModeLookup(Object.values(exercises))
        const totals = summarize(sets, modeOf)

        // סדר הביצוע בפועל, לפי הסט הראשון של כל תרגיל
        const firstSetAt = new Map<string, number>()
        for (const s of sets) {
          const prev = firstSetAt.get(s.exerciseId)
          if (prev === undefined || s.completedAt < prev) {
            firstSetAt.set(s.exerciseId, s.completedAt)
          }
        }
        const actualOrder = [...firstSetAt.entries()]
          .sort((a, b) => a[1] - b[1])
          .map(([id]) => id)

        const plannedOrder = w.queue.map((q) => q.plannedExerciseId)
        const performed = new Set(actualOrder)
        const skipped = [...new Set(w.queue.map((q) => q.exerciseId))].filter(
          (id) => !performed.has(id)
        )

        const endedAt = Date.now()
        const session: Session = {
          id: w.sessionId,
          routineId: w.routineId,
          blockIds: [...w.blockIds],
          date: todayISO(w.startedAt),
          startedAt: w.startedAt,
          endedAt,
          durationSeconds: Math.round((endedAt - w.startedAt) / 1000),
          plannedOrder,
          actualOrder,
          substitutions: [...w.substitutions],
          skippedExerciseIds: skipped,
          exerciseIds: actualOrder,
          notes: w.notes,
          totalVolumeKg: totals.volumeKg,
          totalSets: totals.totalSets,
          totalWorkSets: totals.workSets,
        }

        // שיאי נפח מחושבים רק עכשיו, כשהאימון סגור
        const volumeEvents: PrEvent[] = []
        const prs = [...get().prCache]
        for (const exId of actualOrder) {
          const ex = exercises[exId]
          if (!ex) continue
          const ev = detectVolumePr(
            ex,
            sets.filter((s) => s.exerciseId === exId),
            prs.filter((p) => p.exerciseId === exId)
          )
          if (ev) volumeEvents.push(ev)
        }

        await db.transaction('rw', db.sessions, db.ratings, db.prs, db.activeWorkout, async () => {
          await db.sessions.put(session)
          // put ולא bulkAdd: ריצה חוזרת של אותו אימון תדרוס במקום לשכפל
          const existing = await db.ratings.where('sessionId').equals(w.sessionId).toArray()
          if (existing.length) {
            await db.ratings.bulkDelete(
              existing.map((r) => r.id).filter((id): id is number => id !== undefined)
            )
          }
          const ratings = Object.entries(w.ratingsByKey).flatMap(([key, r]) => {
            const item = w.queue.find((q) => q.key === key)
            if (!item) return []
            return [
              {
                sessionId: w.sessionId,
                exerciseId: item.exerciseId,
                rating: r.rating,
                rir: r.rir,
                createdAt: endedAt,
              },
            ]
          })
          if (ratings.length) await db.ratings.bulkAdd(ratings)
          for (const ev of volumeEvents) {
            await db.prs.put({
              exerciseId: ev.exerciseId,
              kind: ev.kind,
              value: ev.value,
              weightKg: ev.weightKg,
              reps: ev.reps,
              sessionId: w.sessionId,
              achievedAt: endedAt,
            })
          }
          await db.activeWorkout.delete('current')
        })

        set({ workout: null, pendingPrEvents: [] })
        return session.id
      })()

      try {
        return await finishing
      } finally {
        finishing = null
      }
    },

    async logSet(key, type, weightKg, reps) {
      const w = get().workout
      const item = w?.queue.find((q) => q.key === key)
      if (!w || !item) return
      const ex = get().exercisesById[item.exerciseId]
      if (!ex) return

      const existing = w.setsByKey[key] ?? []
      const completedAt = Date.now()
      const row: SetLog = {
        sessionId: w.sessionId,
        exerciseId: item.exerciseId,
        setIndex: existing.length,
        type,
        weightKg: ex.weightMode === 'bodyweight' ? 0 : weightKg,
        reps,
        completedAt,
      }
      const logId = await db.setLogs.add(row)

      // זיהוי שיא מיד, כדי שהקונפטי יעוף ברגע הנכון
      let events: PrEvent[] = []
      if (type === 'work') {
        events = detectSetPrs(
          ex,
          row,
          get().prCache.filter((p) => p.exerciseId === ex.id)
        )
        if (events.length) {
          const updated = [...get().prCache]
          for (const ev of events) {
            const record: PersonalRecord = {
              exerciseId: ev.exerciseId,
              kind: ev.kind,
              value: ev.value,
              weightKg: ev.weightKg,
              reps: ev.reps,
              sessionId: w.sessionId,
              achievedAt: completedAt,
            }
            const at = updated.findIndex(
              (p) => p.exerciseId === record.exerciseId && p.kind === record.kind
            )
            if (at >= 0) updated[at] = record
            else updated.push(record)
            await db.prs.put(record)
          }
          set({ prCache: updated, pendingPrEvents: [...get().pendingPrEvents, ...events] })
        }
      }

      await mutate((cur) => ({
        ...cur,
        setsByKey: {
          ...cur.setsByKey,
          [key]: [...(cur.setsByKey[key] ?? []), { logId, type, weightKg: row.weightKg, reps, completedAt }],
        },
      }))
    },

    async updateSet(key, logId, weightKg, reps) {
      const exerciseId = get().workout?.queue.find((q) => q.key === key)?.exerciseId
      await db.setLogs.update(logId, { weightKg, reps })
      await mutate((cur) => ({
        ...cur,
        setsByKey: {
          ...cur.setsByKey,
          [key]: (cur.setsByKey[key] ?? []).map((s) =>
            s.logId === logId ? { ...s, weightKg, reps } : s
          ),
        },
      }))
      // תיקון משקל שגוי חייב לבטל את השיא שהוא יצר
      if (exerciseId) await reconcile([exerciseId])
    },

    async toggleSetType(key, logId) {
      const cur = get().workout
      const found = cur?.setsByKey[key]?.find((s) => s.logId === logId)
      if (!found) return
      const exerciseId = cur?.queue.find((q) => q.key === key)?.exerciseId
      const next: SetType = found.type === 'work' ? 'warmup' : 'work'
      await db.setLogs.update(logId, { type: next })
      await mutate((w) => ({
        ...w,
        setsByKey: {
          ...w.setsByKey,
          [key]: (w.setsByKey[key] ?? []).map((s) => (s.logId === logId ? { ...s, type: next } : s)),
        },
      }))
      // סט שהפך לחימום לא רשאי להחזיק שיא — זה האינווריאנט של domain/prs.ts
      if (exerciseId) await reconcile([exerciseId])
    },

    async removeSet(key, logId) {
      const exerciseId = get().workout?.queue.find((q) => q.key === key)?.exerciseId
      // מחיקה, מספור מחדש וחישוב שיאים הם פעולה אחת: קריסה באמצע הייתה
      // משאירה שיא של סט שכבר לא קיים, או מספור עם חור
      await db.transaction('rw', db.setLogs, db.prs, async () => {
        await db.setLogs.delete(logId)
        const remaining = (get().workout?.setsByKey[key] ?? []).filter((s) => s.logId !== logId)
        await Promise.all(remaining.map((s, i) => db.setLogs.update(s.logId, { setIndex: i })))
        if (exerciseId) await reconcile([exerciseId])
      })
      await mutate((w) => ({
        ...w,
        setsByKey: {
          ...w.setsByKey,
          [key]: (w.setsByKey[key] ?? []).filter((s) => s.logId !== logId),
        },
      }))
    },

    async rate(key, rating, rir) {
      await mutate((w) => ({ ...w, ratingsByKey: { ...w.ratingsByKey, [key]: { rating, rir } } }))
    },

    async markWarmupOffered(key) {
      await mutate((w) => ({
        ...w,
        queue: w.queue.map((q) => (q.key === key ? { ...q, warmupOffered: true } : q)),
      }))
    },

    /*
      שני השינויים הבאים חיים בתור בלבד ולא נכתבים לתוכנית.

      "היום אני עושה עוד סט" ו"היום התוכנית שלי היא שלושה סטים" הן שתי כוונות
      שונות, וערבוב ביניהן היה גורם לכל אימון לשכתב בשקט את התוכנית הקבועה.
      השינוי הקבוע נעשה בעורך התוכניות, במקום שבו רואים את כל התוכנית ביחד.
    */
    async setTargetSets(key, targetSets) {
      const next = Math.min(12, Math.max(1, Math.round(targetSets)))
      await mutate((w) => ({
        ...w,
        queue: w.queue.map((q) => (q.key === key ? { ...q, targetSets: next } : q)),
      }))
    },

    async setItemRest(key, seconds) {
      // 0 הוא ערך חוקי ומשמעותו "בלי מנוחה" — סופרסט או תרגיל סיום
      const next = Math.min(600, Math.max(0, Math.round(seconds / 15) * 15))
      await mutate((w) => ({
        ...w,
        queue: w.queue.map((q) => (q.key === key ? { ...q, restSeconds: next } : q)),
      }))
    },

    async setCurrent(key) {
      await mutate((w) => ({
        ...w,
        currentKey: key,
        queue: w.queue.map((q) =>
          q.key === key
            ? { ...q, status: q.status === 'done' ? 'done' : 'active' }
            : q.status === 'active'
              ? { ...q, status: (w.setsByKey[q.key]?.length ?? 0) > 0 ? 'done' : 'pending' }
              : q
        ),
      }))
    },

    async completeCurrent() {
      const w = get().workout
      if (!w || !w.currentKey) return
      const key = w.currentKey
      await mutate((cur) => {
        const queue = cur.queue.map((q) => (q.key === key ? { ...q, status: 'done' as const } : q))
        const next = nextOpenKey(queue, key)
        return {
          ...cur,
          queue: queue.map((q) => (q.key === next ? { ...q, status: 'active' as const } : q)),
          currentKey: next,
        }
      })
    },

    async deferItem(key) {
      await mutate((w) => {
        const idx = w.queue.findIndex((q) => q.key === key)
        if (idx < 0) return w
        const item = { ...w.queue[idx], status: 'deferred' as const }
        // יוצא מהמקום שלו ונדחף לסוף התור, עם סימון שהוא ממתין
        const queue = [...w.queue.slice(0, idx), ...w.queue.slice(idx + 1), item]
        const next = nextOpenKey(queue, null)
        return {
          ...w,
          queue: queue.map((q) =>
            q.key === next && q.status === 'pending' ? { ...q, status: 'active' as const } : q
          ),
          currentKey: next,
        }
      })
    },

    async substitute(key, newExerciseId, reason) {
      const w = get().workout
      const item = w?.queue.find((q) => q.key === key)
      if (!w || !item) return
      const hasSets = (w.setsByKey[key]?.length ?? 0) > 0
      const sub: Substitution = {
        plannedExerciseId: item.plannedExerciseId,
        actualExerciseId: newExerciseId,
        reason,
      }
      const target = get().exercisesById[newExerciseId]

      await mutate((cur) => {
        const idx = cur.queue.findIndex((q) => q.key === key)
        if (idx < 0) return cur

        if (!hasSets) {
          // המקרה הרגיל: מחליפים במקום, התוכנית הקבועה לא משתנה
          const queue = [...cur.queue]
          queue[idx] = {
            ...queue[idx],
            exerciseId: newExerciseId,
            restSeconds: target?.defaultRestSeconds ?? queue[idx].restSeconds,
            targetSets: target?.targetSets ?? queue[idx].targetSets,
            targetReps: target ? { ...target.targetReps } : queue[idx].targetReps,
            warmupOffered: false,
          }
          return { ...cur, queue, substitutions: [...cur.substitutions, sub] }
        }

        // כבר יש סטים: סוגרים את מה שבוצע ומכניסים פריט חדש אחריו,
        // כדי שההיסטוריה תשקף את שני התרגילים.
        const closed: QueueItem = { ...cur.queue[idx], status: 'done' }
        const fresh: QueueItem = {
          key: newId('q'),
          exerciseId: newExerciseId,
          plannedExerciseId: item.plannedExerciseId,
          source: item.source,
          sourceId: item.sourceId,
          targetSets: target?.targetSets ?? item.targetSets,
          targetReps: target ? { ...target.targetReps } : item.targetReps,
          restSeconds: target?.defaultRestSeconds ?? item.restSeconds,
          // תרגיל מחליף לא יורש את משקל ההתחלה של התרגיל שהוחלף
          startWeightKg: null,
          status: 'active',
          warmupOffered: false,
        }
        const queue = [...cur.queue.slice(0, idx), closed, fresh, ...cur.queue.slice(idx + 1)]
        return {
          ...cur,
          queue,
          currentKey: fresh.key,
          substitutions: [...cur.substitutions, sub],
        }
      })
    },

    async reorder(fromIndex, toIndex) {
      await mutate((w) => {
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= w.queue.length ||
          toIndex >= w.queue.length
        ) {
          return w
        }
        const queue = [...w.queue]
        const [moved] = queue.splice(fromIndex, 1)
        queue.splice(toIndex, 0, moved)
        return { ...w, queue }
      })
    },

    async addExercise(exerciseId) {
      const ex = get().exercisesById[exerciseId]
      if (!ex) return
      await mutate((w) => ({
        ...w,
        queue: [
          ...w.queue,
          {
            key: newId('q'),
            exerciseId,
            plannedExerciseId: exerciseId,
            source: 'routine',
            sourceId: w.routineId ?? '',
            targetSets: ex.targetSets,
            targetReps: { ...ex.targetReps },
            restSeconds: ex.defaultRestSeconds,
            startWeightKg: null,
            status: 'pending',
            warmupOffered: false,
          },
        ],
      }))
    },

    async startRest(key, seconds) {
      await mutate((w) => ({
        ...w,
        restEndsAt: Date.now() + seconds * 1000,
        restTotalSeconds: seconds,
        restForKey: key,
      }))
    },

    async adjustRest(deltaSeconds) {
      await mutate((w) => {
        if (!w.restEndsAt) return w
        const endsAt = Math.max(Date.now() + 1000, w.restEndsAt + deltaSeconds * 1000)
        return {
          ...w,
          restEndsAt: endsAt,
          restTotalSeconds: Math.max(5, w.restTotalSeconds + deltaSeconds),
        }
      })
    },

    async stopRest() {
      await mutate((w) => ({ ...w, restEndsAt: null, restForKey: null }))
    },

    async setNotes(notes) {
      await mutate((w) => ({ ...w, notes }))
    },

    drainPrEvents() {
      const events = get().pendingPrEvents
      if (events.length) set({ pendingPrEvents: [] })
      return events
    },
  }
})

// ─── סלקטורים ──────────────────────────────────────────────────────────────

/** קבוצות השריר שכבר נעבדו באימון הזה — הבסיס להצעת סט החימום */
export function touchedGroups(
  workout: ActiveWorkout | null,
  exercisesById: Record<string, Exercise>
): Set<MuscleGroup> {
  const out = new Set<MuscleGroup>()
  if (!workout) return out
  for (const item of workout.queue) {
    if (!(workout.setsByKey[item.key]?.length ?? 0)) continue
    const ex = exercisesById[item.exerciseId]
    if (ex) out.add(ex.muscleGroup)
  }
  return out
}

/** תרגילים שנשארו פתוחים — חוסמים סיום אימון בשקט */
export function openItems(workout: ActiveWorkout | null): QueueItem[] {
  if (!workout) return []
  return workout.queue.filter(
    (q) => q.status !== 'done' && (workout.setsByKey[q.key]?.length ?? 0) === 0
  )
}

export function currentItem(workout: ActiveWorkout | null): QueueItem | null {
  if (!workout?.currentKey) return null
  return workout.queue.find((q) => q.key === workout.currentKey) ?? null
}
