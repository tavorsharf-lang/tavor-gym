import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { DEFAULT_SETTINGS, SEED_EXERCISES } from '@/db/seed'
import type { AppSettings, Exercise, MuscleGroup, SettingsRow } from '@/db/types'

/**
 * מיגרציה 9 — "שוק" מפסיקה להיות קבוצת שריר ומתאחדת לתוך "רגליים".
 *
 * כמו מיגרציות 5 ו-7, זה קוד שרץ פעם אחת על הנתונים האמיתיים ואי אפשר להריץ
 * שוב, ולכן הוא נבדק מול מסד גרסה 8 אמיתי שמחזיק את המחרוזת הישנה. הכשל
 * שהיא מונעת גס: `MUSCLE_GROUPS['calves']` כבר לא קיים, ולכן תרגיל ששרד עם
 * הקבוצה הישנה מפיל כל מסך שקורא `MUSCLE_GROUPS[e.muscleGroup].label` —
 * וזו קריאה שחוזרת בשמונה מסכים.
 *
 * הזריעה כבר מכילה את התוצאה, ולכן היא לא נבדקת כאן: התרגילים נכתבים במפורש
 * עם `'calves'` כמו שהם היו על המכשיר לפני העדכון.
 */

/** הסכמה כפי שהייתה מגרסה 4 ועד 8 — אף מיגרציה בדרך לא שינתה אינדקסים */
const V8_STORES = {
  exercises: 'id, muscleGroup, isActive, order, libraryId',
  routines: 'id, order',
  blocks: 'id, order',
  sessions: 'id, date, startedAt, routineId, *exerciseIds, *blockIds',
  setLogs: '++id, sessionId, exerciseId, [sessionId+exerciseId], [exerciseId+completedAt]',
  ratings: '++id, sessionId, exerciseId, [sessionId+exerciseId]',
  prs: '[exerciseId+kind], exerciseId',
  bodyWeights: '++id, &date',
  settings: '&key',
  activeWorkout: '&id',
}

/**
 * הקבוצה שכבר לא קיימת בטיפוס — ככה היא שכבה על הדיסק.
 * ההמרה היא בדיוק הנקודה: המיגרציה מטפלת בערך שהטיפוס כבר לא מכיר.
 */
const CALVES = 'calves' as unknown as MuscleGroup

const template = SEED_EXERCISES.find((e) => e.id === 'calf-raise') as Exercise

function legacy(over: Partial<Exercise>): Exercise {
  return { ...template, ...over }
}

/** הקטלוג כפי שהוא שכב על המכשיר בגרסה 8 */
function legacyExercises(): Exercise[] {
  return [
    // התרגיל היחיד בקטלוג שהיה תחת "שוק"
    legacy({ id: 'calf-raise', muscleGroup: CALVES, secondaryMuscles: [] }),
    // סקוואט מהמאגר: זיכה גם רגליים (ראשי) וגם שוק (משני)
    legacy({
      id: 'lib-barbell_squat',
      muscleGroup: 'legs',
      secondaryMuscles: ['back', 'abs', CALVES],
    }),
    // תרגיל שהמשתמש יצר בעצמו תחת "שוק", עם רגליים כמשני
    legacy({ id: 'my-calf', muscleGroup: CALVES, secondaryMuscles: ['legs', 'abs'] }),
    // ביקורת: תרגיל שאין לו שום קשר לשוק — אסור לגעת בו
    legacy({ id: 'lat-pulldown', muscleGroup: 'back', secondaryMuscles: ['biceps', 'forearms'] }),
  ]
}

function legacySettings(): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    videoMoves: { 'a-calf': 'group:calves', 'a-leg': 'group:legs', 'a-own': 'calf-raise' },
    videoOrder: { 'group:calves': ['a-calf', 'a-leg'], 'group:legs': ['a-leg', 'a-quad'] },
  }
}

async function seedV8(): Promise<void> {
  const old = new Dexie('tavor-gym')
  old.version(8).stores(V8_STORES)
  await old.open()
  await old.table<Exercise, string>('exercises').bulkPut(legacyExercises())
  await old.table<SettingsRow, string>('settings').put({ key: 'app', value: legacySettings() })
  old.close()
}

describe('מיגרציה 9 — שוק מתאחדת לתוך רגליים', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
  })

  it('כל תרגיל שהיה בשוק עובר לרגליים, והמיקוד נשמר', async () => {
    await seedV8()
    await db.open()

    const calfRaise = await db.exercises.get('calf-raise')
    expect(calfRaise?.muscleGroup).toBe('legs')
    // ‏subTarget הוא מה שממשיך להבדיל את התרגיל בתוך רגליים — הוא לא נגע
    expect(calfRaise?.subTarget).toBe('שוק — תאומים')

    const mine = await db.exercises.get('my-calf')
    expect(mine?.muscleGroup).toBe('legs')
  })

  it('זיכוי משני לשוק נמחק ולא מומר — אחרת אותו סט נספר פעמיים', async () => {
    await seedV8()
    await db.open()

    // הסקוואט כבר ראשי ברגליים; להמיר calves→legs כאן היה מציג עבודה עקיפה
    // על שריר שקיבל סט ישיר באותו תרגיל בדיוק
    expect((await db.exercises.get('lib-barbell_squat'))?.secondaryMuscles).toEqual(['back', 'abs'])
    // התרגיל שעבר מ-שוק לרגליים: 'legs' היה המשני שלו והוא עכשיו הראשי
    expect((await db.exercises.get('my-calf'))?.secondaryMuscles).toEqual(['abs'])
    // ביקורת: מי שלא נגע בשוק חוזר בדיוק כמו שהיה
    expect((await db.exercises.get('lat-pulldown'))?.secondaryMuscles).toEqual([
      'biceps',
      'forearms',
    ])
  })

  it('מדף הסרטונים של שוק מתמזג לתוך מדף הרגליים בלי כפילויות', async () => {
    await seedV8()
    await db.open()

    const settings = (await db.settings.get('app'))?.value as AppSettings
    // סרטון ששויך למדף שוק היה נעלם מהאפליקציה בלי שנמחק
    expect(settings.videoMoves['a-calf']).toBe('group:legs')
    // שיוכים אחרים לא נגעים
    expect(settings.videoMoves['a-leg']).toBe('group:legs')
    expect(settings.videoMoves['a-own']).toBe('calf-raise')

    expect(settings.videoOrder['group:calves']).toBeUndefined()
    // סדר הרגליים הקיים ראשון, ואז מה שהגיע משוק — בלי לכפול את 'a-leg'
    expect(settings.videoOrder['group:legs']).toEqual(['a-leg', 'a-quad', 'a-calf'])
  })

  it('ריצה על מסד שכבר אחרי האיחוד לא נוגעת בכלום', async () => {
    await db.open()
    await db.exercises.put(
      legacy({ id: 'calf-raise', muscleGroup: 'legs', secondaryMuscles: ['abs'] })
    )
    await db.settings.put({
      key: 'app',
      value: { ...DEFAULT_SETTINGS, videoOrder: { 'group:legs': ['a-leg'] } },
    })
    db.close()

    await db.open()
    expect((await db.exercises.get('calf-raise'))?.secondaryMuscles).toEqual(['abs'])
    const settings = (await db.settings.get('app'))?.value as AppSettings
    expect(settings.videoOrder).toEqual({ 'group:legs': ['a-leg'] })
  })
})
