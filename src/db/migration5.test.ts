import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import {
  DEFAULT_REPS,
  DEFAULT_REST_SECONDS,
  DEFAULT_TARGET_SETS,
  SEED_BLOCKS,
  SEED_EXERCISES,
  SEED_ROUTINES,
} from '@/db/seed'
import type {
  ActiveWorkout,
  AppSettings,
  Block,
  Exercise,
  Routine,
  SettingsRow,
} from '@/db/types'

/**
 * מיגרציה 5 היא הקוד היחיד באפליקציה שרץ פעם אחת על הנתונים האמיתיים של תבור
 * ואי אפשר להריץ שוב. לכן היא נבדקת מול מסד גרסה 4 אמיתי — עם *הנתונים הישנים*
 * ולא עם הזריעה החדשה, שכבר מכילה את התוצאה ולכן לא הייתה בודקת כלום.
 */

/** סכמת גרסה 4 — זו שהייתה במכשיר לפני השינוי */
const V4_STORES = {
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

/** הקטלוג כפי שהוא נראה לפני המיגרציה: 3–4 סטים, מנוחה מגוונת, פלאנק בחזרות */
function asVersion4(exercise: Exercise): Exercise {
  const copy: Exercise = {
    ...exercise,
    targetSets: 4,
    defaultRestSeconds: 90,
  }
  delete copy.metric
  if (copy.id === 'abs') {
    copy.name = 'פלאנק'
    copy.targetReps = { min: 12, max: 20 }
    copy.cues = [
      'מרפקים מתחת לכתפיים, אמות על הרצפה',
      'גוף בקו ישר מהעקב עד הראש — אגן לא נופל ולא מתרומם',
      'בטן ועכוז נעולים, נשימה רגילה',
      'החזרות כאן הן שניות — לספור זמן ולא תנועות',
    ]
  }
  if (copy.id === 'pushup') {
    copy.name = 'שכיבות סמיכה (חימום)'
    copy.nameEn = 'Push-Up (Warm-Up)'
    copy.subTarget = 'חימום — חזה, טריצפס, כתף קדמית'
  }
  return copy
}

/** תוכנית כפי שהייתה: שכיבות סמיכה בראש, סטים ומנוחה מגוונים */
function routineAsVersion4(routine: Routine): Routine {
  const items = routine.items.map((it, i) => ({
    ...it,
    order: i + 1,
    targetSets: 3,
    restSeconds: 90,
    // הפלאנק היה טווח חזרות לפני המיגרציה. בלי זה הבדיקה על פריטי התוכנית
    // הייתה עוברת גם אילו המיגרציה לא נגעה בהם בכלל.
    targetReps: it.exerciseId === 'abs' ? { min: 12, max: 20 } : it.targetReps,
  }))
  const withPushup =
    routine.id === 'F1' || routine.id === 'F2'
      ? [
          {
            exerciseId: 'pushup',
            order: 0,
            targetSets: 2,
            targetReps: { min: 12, max: 20 },
            restSeconds: 45,
            startWeightKg: null,
          },
          ...items,
        ]
      : items
  return { ...routine, items: withPushup }
}

const LEGACY_SETTINGS = {
  defaultRestSeconds: 90,
  soundEnabled: true,
  soundVolume: 0.8,
  wakeLockEnabled: true,
  weeklyGoal: 3,
  blockStaleDays: 7,
  plates: { barWeightKg: 20, perSideKg: [20, 15, 10, 5, 2.5, 1.25] },
  askRir: true,
  confettiEnabled: true,
  autoWarmup: true,
  warmupPercent: 55,
  lastBackupAt: null,
  videosInstalledAt: null,
  storagePromptSeenAt: null,
} as unknown as AppSettings

async function seedVersion4(): Promise<void> {
  const legacy = new Dexie('tavor-gym')
  legacy.version(4).stores(V4_STORES)
  await legacy.open()
  await legacy.table<Exercise, string>('exercises').bulkPut(SEED_EXERCISES.map(asVersion4))
  await legacy.table<Routine, string>('routines').bulkPut(SEED_ROUTINES.map(routineAsVersion4))
  await legacy.table<Block, string>('blocks').bulkPut(
    SEED_BLOCKS.map((b) => ({
      ...b,
      items: b.items.map((it) => ({
        ...it,
        targetSets: 3,
        restSeconds: 60,
        targetReps: it.exerciseId === 'abs' ? { min: 12, max: 20 } : it.targetReps,
      })),
    }))
  )
  await legacy
    .table<SettingsRow, string>('settings')
    .put({ key: 'app', value: LEGACY_SETTINGS })
  legacy.close()
}

/** סכמת גרסה 1 — מכשיר שלא נפתח מאז ההתקנה הראשונה */
const V1_STORES = { ...V4_STORES, exercises: 'id, muscleGroup, isActive, order' }

/**
 * מכשיר שקופץ מגרסה 1 ישר ל-5 בפתיחה אחת מריץ את כל המיגרציות בזו אחר זו.
 * זה התרחיש המסוכן ביותר, כי `was` של דור 5 הוא *התוצאה* של דור 3 ולא השם
 * המקורי — טעות בשרשור הזה הייתה משאירה מכשיר ותיק עם שמות ישנים בשקט.
 */
describe('שרשרת מיגרציות מגרסה 1 עד 5', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
  })

  it('שני דורות התיקונים מצטרפים לתוצאה הנכונה', async () => {
    const legacy = new Dexie('tavor-gym')
    legacy.version(1).stores(V1_STORES)
    await legacy.open()

    const original = SEED_EXERCISES.map((e) => {
      const copy = asVersion4(e)
      // השמות כפי שהיו בגרסה 1, לפני תיקוני הקטלוג של גרסה 3
      if (copy.id === 'pushup') copy.name = 'שכיבות סמיכה — חימום'
      if (copy.id === 'abs') {
        copy.name = 'בטן'
        copy.cues = [
          'לגלגל את עמוד השדרה, לא למשוך מהצוואר',
          'לנשוף בכיווץ',
          'לרדת לאט — לא להיעזר בתנופה',
        ]
      }
      delete copy.libraryId
      return copy
    })
    await legacy.table<Exercise, string>('exercises').bulkPut(original)
    await legacy
      .table<SettingsRow, string>('settings')
      .put({ key: 'app', value: LEGACY_SETTINGS })
    legacy.close()

    await db.open()

    // דור 3 תיקן "שכיבות סמיכה — חימום" ל-"(חימום)", ודור 5 הוריד את הסוגריים
    const pushup = await db.exercises.get('pushup')
    expect(pushup?.name).toBe('שכיבות סמיכה')
    expect(pushup?.nameEn).toBe('Push-Up')

    // דור 3 החליף "בטן" ב-"פלאנק", דור 5 הפך אותו למדידה בזמן
    const plank = await db.exercises.get('abs')
    expect(plank?.name).toBe('פלאנק')
    expect(plank?.metric).toBe('seconds')
    expect(plank?.targetReps).toEqual({ min: 75, max: 75 })

    // גרסה 2 שתלה את תוכניות הפול-באדי, וגרסה 4 את הקישור למאגר
    const f1 = await db.routines.get('F1')
    expect(f1?.items.some((it) => it.exerciseId === 'pushup')).toBe(false)
    expect((await db.exercises.get('leg-press'))?.libraryId).toBe('lib-leg_press')

    const row = await db.settings.get('app')
    expect(row?.value.defaultReps).toBe(DEFAULT_REPS)
  })
})

describe('מיגרציה לגרסה 5', () => {
  beforeEach(async () => {
    await db.delete()
    await seedVersion4()
    await db.open()
  })

  it('מיישרת את כל הקטלוג לשני סטים ולשתי דקות מנוחה', async () => {
    const exercises = await db.exercises.toArray()
    expect(exercises.length).toBeGreaterThan(0)
    expect(exercises.every((e) => e.targetSets === DEFAULT_TARGET_SETS)).toBe(true)
    expect(exercises.every((e) => e.defaultRestSeconds === DEFAULT_REST_SECONDS)).toBe(true)
  })

  it('מיישרת גם את התוכניות ואת הבלוקים', async () => {
    const plans = [...(await db.routines.toArray()), ...(await db.blocks.toArray())]
    const items = plans.flatMap((p) => p.items)
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((it) => it.targetSets === DEFAULT_TARGET_SETS)).toBe(true)
    expect(items.every((it) => it.restSeconds === DEFAULT_REST_SECONDS)).toBe(true)
  })

  it('מעבירה את הפלאנק להימדד בזמן, עם יעד של דקה ורבע', async () => {
    const plank = await db.exercises.get('abs')
    expect(plank?.metric).toBe('seconds')
    expect(plank?.targetReps).toEqual({ min: 75, max: 75 })

    // גם פריט התוכנית, אחרת הכרטיס באימון היה מציג טווח חזרות מול שדה זמן
    const absItems = [...(await db.routines.toArray()), ...(await db.blocks.toArray())]
      .flatMap((p) => p.items)
      .filter((it) => it.exerciseId === 'abs')
    expect(absItems.length).toBeGreaterThan(0)
    expect(absItems.every((it) => it.targetReps.min === 75 && it.targetReps.max === 75)).toBe(true)
  })

  it('מוציאה את שכיבות הסמיכה מתוכניות הפול-באדי ומשאירה אותן בקטלוג', async () => {
    for (const id of ['F1', 'F2'] as const) {
      const routine = await db.routines.get(id)
      expect(routine?.items.some((it) => it.exerciseId === 'pushup')).toBe(false)
      // הסדר נשאר רציף מאפס, אחרת עורך התוכניות מציג חורים
      expect(routine?.items.map((it) => it.order)).toEqual(
        routine?.items.map((_, i) => i)
      )
    }

    const pushup = await db.exercises.get('pushup')
    expect(pushup).toBeTruthy()
    expect(pushup?.name).toBe('שכיבות סמיכה')
    expect(pushup?.nameEn).toBe('Push-Up')
  })

  it('לא נוגעת בפיצול הכבוי — שם התרגיל נשאר בתוכנית', async () => {
    const a = await db.routines.get('A')
    expect(a?.items.some((it) => it.exerciseId === 'pushup')).toBe(true)
  })

  /**
   * אימון שהיה פתוח כשהעדכון נחת. `hydrate` משחזרת את התור מהדיסק כמו שהוא,
   * ולכן פריט שנשמר עם טווח חזרות היה מוצג ככה גם אחרי שהקטלוג עבר לשניות —
   * "0:12–0:20 להחזיק", ושדה שנפתח על 12 שניות במקום 75.
   */
  it('מתקנת את היחידה של הפלאנק גם באימון שהיה פתוח', async () => {
    await db.close()
    await db.delete()
    await seedVersion4()

    const legacy = new Dexie('tavor-gym')
    legacy.version(4).stores(V4_STORES)
    await legacy.open()
    await legacy.table<ActiveWorkout, string>('activeWorkout').put({
      id: 'current',
      sessionId: 's-open',
      routineId: 'F1',
      blockIds: [],
      startedAt: 1,
      queue: [
        {
          key: 'q1',
          exerciseId: 'abs',
          plannedExerciseId: 'abs',
          source: 'routine',
          sourceId: 'F1',
          targetSets: 3,
          targetReps: { min: 12, max: 20 },
          restSeconds: 45,
          startWeightKg: null,
          status: 'active',
          warmupOffered: false,
        },
      ],
      currentKey: 'q1',
      setsByKey: {},
      ratingsByKey: {},
      substitutions: [],
      restEndsAt: null,
      restTotalSeconds: 90,
      restForKey: null,
      notes: '',
      lastSavedAt: 1,
    })
    legacy.close()

    await db.open()
    const open = await db.activeWorkout.get('current')
    expect(open?.queue[0].targetReps).toEqual({ min: 75, max: 75 })
    // מספר הסטים והמנוחה נשארים מה שתוכנן — שינוי שלהם באמצע אימון הוא הפתעה
    expect(open?.queue[0].targetSets).toBe(3)
    expect(open?.queue[0].restSeconds).toBe(45)
  })

  it('מעדכנת את ההגדרות הגלובליות, שהשלמה מברירות המחדל לא הייתה נוגעת בהן', async () => {
    const row = await db.settings.get('app')
    expect(row?.value.defaultRestSeconds).toBe(DEFAULT_REST_SECONDS)
    expect(row?.value.defaultReps).toBe(DEFAULT_REPS)
    expect(row?.value.hiddenVideoIds).toEqual([])
  })

  it('לא מוחקת שם שהמשתמש שינה בעצמו', async () => {
    await db.close()
    await db.delete()
    await seedVersion4()

    const legacy = new Dexie('tavor-gym')
    legacy.version(4).stores(V4_STORES)
    await legacy.open()
    await legacy.table<Exercise, string>('exercises').update('pushup', { name: 'השם שלי' })
    legacy.close()

    await db.open()
    const pushup = await db.exercises.get('pushup')
    expect(pushup?.name).toBe('השם שלי')
    // ההתיישרות המספרית כן חלה — היא לא תלויה בשם
    expect(pushup?.targetSets).toBe(DEFAULT_TARGET_SETS)
  })
})
