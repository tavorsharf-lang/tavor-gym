import type { ActiveWorkout, Exercise, MuscleGroup, Session, SetLog } from '@/db/types'
import { MUSCLE_GROUPS, MUSCLE_GROUP_BY_SIZE } from '@/db/types'
import { MS_DAY, daysSince, startOfDay, toISODate } from '@/lib/dates'

/**
 * כיסוי השרירים — "על מה לא עבדתי לאחרונה".
 *
 * זו השאלה שבניית האימון קיימת בשבילה, והיא לא אותה שאלה שלוח הנפח עונה
 * עליה: הלוח מודד *כמה* עבדתי על שריר בשבוע קלנדרי, וכאן מודדים *מתי* נגעתי
 * בו לאחרונה ובכמה תרגילים — בחלון מתגלגל שנגמר היום.
 *
 * שלושה כללים שחוזרים בכל הקובץ, וכולם נועדו לכך שהמספרים כאן יסכימו עם מה
 * שכתוב במסך הבית ובלוח הנפח:
 *   1. רק אימון שנסגר ויש בו סט עבודה אחד לפחות נחשב — אותו כלל בדיוק כמו
 *      ב-`staleness.ts` וב-`streak.ts`. בלי זה "סיים בכל זאת" על אימון ריק
 *      היה מסמן שריר ככוסה.
 *   2. רק סטי עבודה. חימום נשמר ומוצג, ולא נספר בשום מדד.
 *   3. גבולות יום מקומיים ולא 24 שעות. חלון של ארבעה ימים הוא היום ושלושת
 *      הימים שלפניו, ולכן `daysSince(...) <= windowDays - 1`. חיסור של
 *      `4 * MS_DAY` היה נופל שעה מהמקום במעבר שעון קיץ ומייצר מספר שסותר
 *      את "לפני 3 ימים" שכתוב באותו מסך.
 *
 * העבודה העקיפה (`Exercise.secondaryMuscles`) נספרת בנפרד ולא מתערבבת בישירה.
 * חתירה עובדת יד קדמית ולכן חשוב לדעת שהיא קיבלה משהו — אבל היא לא "אימנתי
 * יד קדמית", ומספר אחד שמאחד את השניים היה מסתיר בדיוק את ההבדל שבגללו
 * נכנסים למסך.
 */

/**
 * כמה אחורה נשלפים אימונים כדי לענות על "מתי לאחרונה".
 *
 * החלון עצמו הוא ארבעה ימים, אבל שריר מוזנח הוא בדיוק זה שלא נגעו בו הרבה
 * לפני כן, ובלי טווח רחב יותר כל שריר שלא אומן השבוע היה נראה זהה. ארבעה
 * חודשים הם שאילתה מאונדקסת אחת על טבלה של מאות שורות, ומעבר להם ההבדל בין
 * "לפני חצי שנה" ל"מעולם" כבר לא משנה החלטה.
 */
export const COVERAGE_LOOKBACK_DAYS = 120

/** מאיזו חותמת זמן לשלוף אימונים למסך הכיסוי */
export function coverageLookbackFrom(now: number): number {
  return startOfDay(now) - (COVERAGE_LOOKBACK_DAYS - 1) * MS_DAY
}

export interface MuscleCoverage {
  group: MuscleGroup
  label: string
  /** תרגילים *שונים* שבוצעו על השריר בחלון, ישירות */
  exercises: number
  /** סטי עבודה ישירים בחלון */
  sets: number
  /** סטי עבודה שנזקפו לשריר בעקיפין בחלון (חתירה → יד קדמית) */
  indirectSets: number
  /** תרגילים שונים שנזקפו בעקיפין בחלון */
  indirectExercises: number
  /** הסט הישיר האחרון, בתוך טווח החיפוש. null = לא נמצא בטווח */
  lastDirectAt: number | null
  daysSince: number | null
  /** לא נמצא סט ישיר בכל טווח החיפוש — לאו דווקא "מעולם", אבל מזמן */
  neverDone: boolean
  /** אף סט ישיר בחלון — זה מה שהצבע במסך מסמן */
  uncovered: boolean
}

/** התגיות של תרגיל, בלי השריר הראשי שלו — שלא ייספר פעמיים */
function secondariesOf(exercise: Exercise): MuscleGroup[] {
  const tags = exercise.secondaryMuscles ?? []
  return tags.filter((m) => m !== exercise.muscleGroup)
}

/**
 * כיסוי לכל תשע הקבוצות, המוזנחת ביותר קודם.
 *
 * כל הקבוצות מוחזרות גם באפס. זה אותו עיקרון שמנחה את לוח הנפח: קבוצה שנעלמת
 * מהמסך היא בדיוק זו שממשיכים לשכוח.
 *
 * @param sessions אימונים בטווח החיפוש (`coverageLookbackFrom`), אחרי סינון endedAt
 * @param sets     הסטים של אותם אימונים
 * @param windowDays גודל חלון הכיסוי בימים. 4 = היום ושלושת הימים שלפניו.
 */
export function muscleCoverage(
  exercises: readonly Exercise[],
  sessions: readonly Session[],
  sets: readonly SetLog[],
  now: number,
  windowDays: number
): MuscleCoverage[] {
  const byId = new Map(exercises.map((e) => [e.id, e]))

  // רק אימונים שסגורים ויש בהם עבודה. אותו כלל כמו במסך הבית.
  const counted = new Map<string, Session>()
  for (const s of sessions) {
    if (s.endedAt <= 0 || s.totalWorkSets <= 0) continue
    counted.set(s.id, s)
  }

  const span = Math.max(1, Math.round(windowDays))
  const direct = new Map<MuscleGroup, { sets: number; exercises: Set<string> }>()
  const indirect = new Map<MuscleGroup, { sets: number; exercises: Set<string> }>()
  const lastAt = new Map<MuscleGroup, number>()

  const bucket = (
    map: Map<MuscleGroup, { sets: number; exercises: Set<string> }>,
    group: MuscleGroup
  ) => {
    const found = map.get(group)
    if (found) return found
    const fresh = { sets: 0, exercises: new Set<string>() }
    map.set(group, fresh)
    return fresh
  }

  for (const set of sets) {
    if (set.type !== 'work') continue
    const session = counted.get(set.sessionId)
    if (!session) continue
    // תרגיל שנמחק מהקטלוג — הסטים שלו נשארים, ואי אפשר לשייך אותם לשריר
    const exercise = byId.get(set.exerciseId)
    if (!exercise) continue

    /*
      החלון נמדד לפי תחילת האימון ולא לפי חותמת הסט.

      אימון שנמשך מעבר לחצות היה מתפצל בין שני ימים, וחצי מהסטים שלו היו
      נופלים מהחלון בזמן שהאימון עצמו נחשב "היום". `Session.date` נגזר גם
      הוא מ-`startedAt`, ולכן זו אותה הגדרת יום שההיסטוריה מציגה.
    */
    const age = daysSince(session.startedAt, now)
    const inWindow = age >= 0 && age <= span - 1

    /*
      "מתי לאחרונה" נמדד גם הוא לפי תחילת האימון, ולא לפי חותמת הסט.

      אחרת שני המספרים באותה שורה נגזרים משתי הגדרות יום שונות: אימון שהתחיל
      אתמול ב-23:40 ונמשך אחרי חצות היה נספר בחלון כ"אתמול" ובו-זמנית מוצג
      כ"היום". ההיסטוריה כבר מתארכת אימון לפי `startedAt`, וזו ההגדרה שנבחרה.
    */
    const primary = exercise.muscleGroup
    const prev = lastAt.get(primary)
    if (prev === undefined || session.startedAt > prev) lastAt.set(primary, session.startedAt)

    if (!inWindow) continue

    const d = bucket(direct, primary)
    d.sets += 1
    d.exercises.add(exercise.id)

    for (const group of secondariesOf(exercise)) {
      const i = bucket(indirect, group)
      i.sets += 1
      i.exercises.add(exercise.id)
    }
  }

  const rows: MuscleCoverage[] = MUSCLE_GROUP_BY_SIZE.map((group) => {
    const d = direct.get(group)
    const i = indirect.get(group)
    const lastDirectAt = lastAt.get(group) ?? null
    return {
      group,
      label: MUSCLE_GROUPS[group].label,
      exercises: d?.exercises.size ?? 0,
      sets: d?.sets ?? 0,
      indirectSets: i?.sets ?? 0,
      indirectExercises: i?.exercises.size ?? 0,
      lastDirectAt,
      daysSince: lastDirectAt === null ? null : daysSince(lastDirectAt, now),
      neverDone: lastDirectAt === null,
      uncovered: (d?.sets ?? 0) === 0,
    }
  })

  return rows.sort((a, b) => neglectRank(b) - neglectRank(a) || sizeRank(a) - sizeRank(b))
}

/**
 * ככל שגדול יותר — מוזנח יותר.
 *
 * ‏MAX_SAFE_INTEGER ולא Infinity, כי המשווה מחסר ערכים ו-Infinity פחות
 * Infinity הוא NaN — שהיה הורס את המיון. אותו שיקול בדיוק כמו ב-
 * `blockNeglectRank`.
 */
function neglectRank(row: MuscleCoverage): number {
  return row.neverDone ? Number.MAX_SAFE_INTEGER : (row.daysSince ?? 0)
}

/** שובר שוויון: שריר גדול קודם — הוא זה שדורש את האנרגיה שיש בתחילת אימון */
function sizeRank(row: MuscleCoverage): number {
  return MUSCLE_GROUP_BY_SIZE.indexOf(row.group)
}

/**
 * האימון שרץ עכשיו, בצורה ש-`muscleCoverage` יודע לקרוא.
 *
 * למה זה נחוץ: שורת ה-session נכתבת רק בסיום, ולכן `getSessionsSince` עיוור
 * לאימון שבאמצע. בבורר "הוסף תרגיל" שבתוך האימון זה נקרא כשקר גלוי — השורה
 * מציגה שהרגע עשית לחיצת רגליים, והכותרת שמעליה אומרת שלא נגעת ברגליים היום.
 *
 * מה שנבנה כאן הוא לא זיוף אלא תיאור נאמן: אימון פתוח *הוא* אימון, וה-endedAt
 * הסינתטי קיים רק כדי לעבור את אותו שער שכל אימון גמור עובר.
 *
 * מחזיר קלט ריק כשאין עדיין סט עבודה — אימון שרק נפתח לא כיסה שום דבר.
 */
export function liveCoverageInput(
  workout: ActiveWorkout | null,
  now: number
): { sessions: Session[]; sets: SetLog[] } {
  const empty = { sessions: [], sets: [] }
  if (!workout) return empty

  const sets: SetLog[] = []
  for (const item of workout.queue) {
    for (const draft of workout.setsByKey[item.key] ?? []) {
      sets.push({
        sessionId: workout.sessionId,
        exerciseId: item.exerciseId,
        setIndex: 0,
        type: draft.type,
        weightKg: draft.weightKg,
        reps: draft.reps,
        completedAt: draft.completedAt,
      })
    }
  }

  const workSets = sets.filter((s) => s.type === 'work').length
  if (!workSets) return empty

  return {
    sessions: [
      {
        id: workout.sessionId,
        routineId: workout.routineId,
        blockIds: [...workout.blockIds],
        date: toISODate(workout.startedAt),
        startedAt: workout.startedAt,
        endedAt: now,
        durationSeconds: Math.max(0, Math.round((now - workout.startedAt) / 1000)),
        plannedOrder: [],
        actualOrder: [],
        substitutions: [],
        skippedExerciseIds: [],
        exerciseIds: [...new Set(sets.map((s) => s.exerciseId))],
        notes: '',
        totalVolumeKg: 0,
        totalSets: sets.length,
        totalWorkSets: workSets,
      },
    ],
    sets,
  }
}

/**
 * מציע אימון שלם: השרירים המוזנחים ביותר, ולכל אחד התרגיל שהכי מזמן לא בוצע.
 *
 * זו מטרת הפיצ׳ר כולו בפונקציה אחת, ולכן היא בוחרת לרוחב ולא לעומק — תרגיל
 * אחד לכל שריר לפני שחוזרים לשריר שכבר נבחר. אימון שכולו גב הוא בדיוק מה
 * שהמסך הזה קיים כדי למנוע.
 *
 * @param lastPerformedAt מתי בוצע כל תרגיל לאחרונה. חסר = מעולם, והוא הראשון בתור.
 * @param excludeIds תרגילים שהוסתרו מהבונה — ההצעה לא יכולה להכניס לסל שורה
 *   שהמשתמש לא רואה. נבדק גם מול libraryId, כי ההסתרה שומרת שלישיית זהות.
 */
export function suggestWorkout(
  rows: readonly MuscleCoverage[],
  exercises: readonly Exercise[],
  lastPerformedAt: ReadonlyMap<string, number>,
  count: number,
  excludeIds?: ReadonlySet<string>
): Exercise[] {
  const byGroup = new Map<MuscleGroup, Exercise[]>()
  for (const ex of exercises) {
    if (!ex.isActive) continue
    if (excludeIds?.has(ex.id) || (ex.libraryId && excludeIds?.has(ex.libraryId))) continue
    const list = byGroup.get(ex.muscleGroup)
    if (list) list.push(ex)
    else byGroup.set(ex.muscleGroup, [ex])
  }

  // הכי מזמן קודם; מה שלא בוצע מעולם לפני הכל
  const staleFirst = (a: Exercise, b: Exercise): number =>
    (lastPerformedAt.get(a.id) ?? -Infinity) - (lastPerformedAt.get(b.id) ?? -Infinity) ||
    a.order - b.order
  for (const list of byGroup.values()) list.sort(staleFirst)

  const picked: Exercise[] = []
  const taken = new Set<string>()
  // סיבובים על הקבוצות לפי סדר ההזנחה — בסיבוב הראשון תרגיל אחד לכל שריר
  for (let round = 0; picked.length < count && round < 4; round++) {
    let addedThisRound = false
    for (const row of rows) {
      if (picked.length >= count) break
      const next = (byGroup.get(row.group) ?? []).find((e) => !taken.has(e.id))
      if (!next) continue
      taken.add(next.id)
      picked.push(next)
      addedThisRound = true
    }
    if (!addedThisRound) break
  }
  return picked
}

/** הקבוצות שלא קיבלו ולו סט עבודה ישיר אחד בחלון, המוזנחת קודם */
export function uncoveredGroups(rows: readonly MuscleCoverage[]): MuscleCoverage[] {
  return rows.filter((r) => r.uncovered)
}

/** "3 תרגילים · 11 סטים" · "לא נגעת" */
export function coverageText(row: MuscleCoverage): string {
  if (row.sets === 0) return 'לא נגעת'
  const exercises = row.exercises === 1 ? 'תרגיל אחד' : `${row.exercises} תרגילים`
  return `${exercises} · ${row.sets} סטים`
}
