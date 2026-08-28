import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady } from '@/db/db'
import {
  addFromLibrary,
  compareByName,
  detachFromPlans,
  findPlanUsage,
  getCatalogEntries,
  getCatalogEntry,
  removeFromMine,
  restoreToMine,
} from '@/db/catalog'
import { LIBRARY_CATALOG } from '@/db/libraryManifest'
import { LIBRARY_LINKS } from '@/db/libraryLinks'
import { SEED_EXERCISES } from '@/db/seed'
import type { Exercise } from '@/db/types'
import { getAllExercises, getSubstituteCandidates } from '@/db/queries'

describe('הקטלוג המאוחד', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureReady()
  })

  it('הזריעה שותלת את הקישורים למאגר על התרגילים בקטלוג', async () => {
    const exercises = await getAllExercises(true)
    const linked = exercises.filter((e) => e.libraryId)

    expect(linked.length).toBe(Object.keys(LIBRARY_LINKS).length)
    expect(exercises.find((e) => e.id === 'leg-press')?.libraryId).toBe('lib-leg_press')
    // תרגיל שאין לו מקבילה במאגר נשאר בלי קישור, ולא עם מחרוזת ריקה
    expect(exercises.find((e) => e.id === 'hammer-curl')?.libraryId).toBeUndefined()
  })

  it('מאחד את שני המקורות בלי כפילות — כל הקטלוג ועוד מה שבמאגר ולא מקושר', async () => {
    const entries = await getCatalogEntries()
    const own = entries.filter((e) => e.exercise)
    const teaching = entries.filter((e) => !e.exercise)

    // נגזר ולא מספר קשיח: כל קישור חדש מקטין את הצד הלימודי באחד, וספירה
    // כתובה ביד הייתה נשברת על כל התאמה שמתווספת — ומלמדת לעדכן מספר במקום
    // לבדוק שהאיחוד עצמו נכון.
    const catalogSize = (await getAllExercises(true)).length
    expect(own.length).toBe(catalogSize)
    expect(entries.length).toBe(
      catalogSize + LIBRARY_CATALOG.length - Object.keys(LIBRARY_LINKS).length
    )
    expect(teaching.length).toBe(LIBRARY_CATALOG.length - Object.keys(LIBRARY_LINKS).length)

    // מזהה מופיע פעם אחת בלבד
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length)
  })

  it('תרגיל מקושר מופיע פעם אחת, תחת מזהה הקטלוג, עם חומר הלימוד בתוכו', async () => {
    const entries = await getCatalogEntries()

    const legPress = entries.find((e) => e.id === 'leg-press')
    expect(legPress?.exercise?.id).toBe('leg-press')
    expect(legPress?.library?.id).toBe('lib-leg_press')

    // המזהה של המאגר לא חוזר כרשומה נפרדת
    expect(entries.some((e) => e.id === 'lib-leg_press')).toBe(false)
  })

  it('רשומת לימוד נושאת חומר בלי נתוני אימון', async () => {
    const entries = await getCatalogEntries()
    const teaching = entries.filter((e) => !e.exercise)

    expect(teaching.every((e) => e.library !== null)).toBe(true)
    expect(teaching.every((e) => e.id.startsWith('lib-'))).toBe(true)
    expect(teaching.every((e) => (e.library?.videos.length ?? 0) > 0)).toBe(true)
  })

  it('שלי קודם לחומר לימוד בסדר הרשימה', async () => {
    const entries = await getCatalogEntries()
    const lastOwn = entries.findLastIndex((e) => e.exercise)
    const firstTeaching = entries.findIndex((e) => !e.exercise)

    expect(lastOwn).toBeLessThan(firstTeaching)
  })

  describe('רשומה בודדת', () => {
    it('מזהה קטלוג מחזיר את התרגיל', async () => {
      const entry = await getCatalogEntry('leg-press')
      expect(entry?.exercise?.name).toBe('לחיצת רגליים')
      expect(entry?.library?.id).toBe('lib-leg_press')
    })

    it('מזהה מאגר של תרגיל מקושר מחזיר את הרשומה הקנונית', async () => {
      const entry = await getCatalogEntry('lib-leg_press')
      // הכתובת הישנה מובילה לתרגיל בקטלוג ולא לעותק שני שלו
      expect(entry?.id).toBe('leg-press')
      expect(entry?.exercise?.id).toBe('leg-press')
    })

    it('מזהה מאגר בלי מקבילה מחזיר רשומת לימוד', async () => {
      const orphan = LIBRARY_CATALOG.find(
        (lib) => !Object.values(LIBRARY_LINKS).includes(lib.id)
      )
      const entry = await getCatalogEntry(orphan!.id)

      expect(entry?.exercise).toBeNull()
      expect(entry?.library?.id).toBe(orphan!.id)
    })

    it('מזהה שלא קיים באף מקור מחזיר null', async () => {
      expect(await getCatalogEntry('lib-אין-כזה')).toBeNull()
    })
  })

  /**
   * ההבטחה שבגללה האיחוד נעשה בשכבת קריאה ולא בטבלה: תרגיל לימוד לא יכול
   * להגיע לשום מקום שמזין אימון או סטטיסטיקה.
   */
  it('חומר לימוד לא נכנס לקטלוג האימון ולא למועמדי החלפה', async () => {
    const exercises = await getAllExercises(true)
    expect(exercises.some((e) => e.id.startsWith('lib-'))).toBe(false)
    expect(exercises.length).toBe(SEED_EXERCISES.length)

    const legPress = exercises.find((e) => e.id === 'leg-press')!
    const candidates = await getSubstituteCandidates(legPress)
    expect(candidates.some((e) => e.id.startsWith('lib-'))).toBe(false)
  })
})

/**
 * שכבת הכתיבה של המסך המאוחד.
 *
 * ‏`isActive` הוא "בתרגילים שלי", והבדיקות כאן נועלות את המשמעות הזו משני
 * הכיוונים: מה שההוצאה *כן* משנה (הדגל, וכל חמשת הצרכנים שתלויים בו) ומה
 * שהיא לעולם לא נוגעת בו (הרשומה, ההיסטוריה, השיאים, פריטי התוכנית).
 */
describe('הוספה והוצאה מהתרגילים שלי', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureReady()
  })

  const lunge = LIBRARY_CATALOG.find((e) => e.id === 'lib-lunge')!

  it('הוצאה משאירה את הרשומה ואת מקומה בסדר, ומחזירה אותה בדיוק לשם', async () => {
    const before = (await db.exercises.get('leg-press'))!
    await removeFromMine('leg-press')

    const out = (await db.exercises.get('leg-press'))!
    expect(out.isActive).toBe(false)
    // הכל חוץ מהדגל ומחותמת הזמן נשאר זהה — זו המשמעות של "ההיסטוריה נשמרת"
    expect({ ...out, isActive: true, updatedAt: 0 }).toEqual({ ...before, updatedAt: 0 })

    // ומיד לא מוצע יותר לאימון
    expect((await getAllExercises()).some((e) => e.id === 'leg-press')).toBe(false)
    const legCurl = (await db.exercises.get('leg-curl'))!
    expect((await getSubstituteCandidates(legCurl)).some((e) => e.id === 'leg-press')).toBe(false)

    await restoreToMine('leg-press')
    const back = (await db.exercises.get('leg-press'))!
    expect(back.isActive).toBe(true)
    // `order` לא נגעו בו, ולכן התרגיל חוזר למקומו בקבוצה ולא לתחתיתה
    expect(back.order).toBe(before.order)
  })

  it('תרגיל שהוצא ממשיך להופיע ברשימה המאוחדת, במצב removed או removedOwn', async () => {
    // ללחיצת רגליים יש תאום במאגר, לכפיפת פטיש אין
    await removeFromMine('leg-press')
    await removeFromMine('hammer-curl')
    const entries = await getCatalogEntries()

    expect(entries.find((e) => e.id === 'leg-press')?.state).toBe('removed')
    expect(entries.find((e) => e.id === 'hammer-curl')?.state).toBe('removedOwn')
    // וגם אחרי ההוצאה אף רשומה לא נכפלה מול המאגר
    expect(entries.filter((e) => e.id === 'lib-leg_press').length).toBe(0)
    expect(entries.length).toBe(
      SEED_EXERCISES.length + LIBRARY_CATALOG.length - Object.keys(LIBRARY_LINKS).length
    )
  })

  it('הוספה מהמאגר יוצרת תרגיל מקושר, ולחיצה שנייה לא יוצרת עוד אחד', async () => {
    const first = await addFromLibrary(lunge)
    expect(first.outcome).toBe('created')
    expect(first.exercise.libraryId).toBe('lib-lunge')
    expect(first.exercise.muscleGroup).toBe('legs')
    expect(first.exercise.isActive).toBe(true)

    const second = await addFromLibrary(lunge)
    expect(second.outcome).toBe('already')
    expect(second.exercise.id).toBe(first.exercise.id)
    expect(await db.exercises.where('libraryId').equals('lib-lunge').count()).toBe(1)
  })

  it('הוספה של תרגיל מאגר שכבר קיים אצלך אבל הוצא — מחזירה אותו במקום ליצור כפילות', async () => {
    const { exercise } = await addFromLibrary(lunge)
    await removeFromMine(exercise.id)

    const again = await addFromLibrary(lunge)
    expect(again.outcome).toBe('restored')
    expect(again.exercise.id).toBe(exercise.id)
    expect((await db.exercises.get(exercise.id))?.isActive).toBe(true)
    expect(await db.exercises.where('libraryId').equals('lib-lunge').count()).toBe(1)
  })

  it('מונה את התוכניות שהתרגיל נמצא בהן, כולל הכבויות', async () => {
    const usage = await findPlanUsage('hammer-curl')
    const names = usage.map((u) => u.id).sort()
    // F2 פעילה, B כבויה — ושתיהן צריכות להופיע בגיליון ההחלטה
    expect(names).toEqual(['B', 'F2'])
    expect(usage.find((u) => u.id === 'F2')?.active).toBe(true)
    expect(usage.find((u) => u.id === 'B')?.active).toBe(false)

    // תרגיל שאינו באף תוכנית לא פותח גיליון בכלל
    const { exercise } = await addFromLibrary(lunge)
    expect(await findPlanUsage(exercise.id)).toEqual([])
  })

  it('ניתוק מהתוכניות מוציא את הפריט מכולן ודוחס את הסדר', async () => {
    const f2Before = (await db.routines.get('F2'))!
    await detachFromPlans('hammer-curl')

    for (const id of ['F2', 'B']) {
      const routine = (await db.routines.get(id))!
      expect(routine.items.some((i) => i.exerciseId === 'hammer-curl')).toBe(false)
      expect(routine.items.map((i) => i.order)).toEqual(routine.items.map((_, i) => i))
    }
    expect((await db.routines.get('F2'))!.items.length).toBe(f2Before.items.length - 1)

    // הרשומה עצמה לא נגעה — ניתוק מתוכנית אינו מחיקת תרגיל
    expect(await db.exercises.get('hammer-curl')).toBeTruthy()
  })

  it('מיון "הכל" אינו תלוי בחברות — שורה לא זזה כשמוסיפים או מוציאים', async () => {
    const legs = (await getCatalogEntries())
      .filter((e) => e.muscleGroup === 'legs')
      .sort(compareByName)
    const orderBefore = legs.map((e) => e.id)

    await removeFromMine('leg-press')
    const after = (await getCatalogEntries())
      .filter((e) => e.muscleGroup === 'legs')
      .sort(compareByName)

    expect(after.map((e) => e.id)).toEqual(orderBefore)
  })
})

/** סכמת גרסה 3, לפני ש-libraryId נכנס לאינדקס */
const V3_STORES = {
  exercises: 'id, muscleGroup, isActive, order',
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

function withoutLink(exercise: Exercise): Exercise {
  const copy = { ...exercise }
  delete copy.libraryId
  return copy
}

/**
 * המיגרציה היא הקוד היחיד כאן שרץ פעם אחת ואי אפשר להריץ שוב על מכשיר שכבר
 * עבר אותה. לכן היא נבדקת מול מסד אמיתי בגרסה 3, ולא מול הזריעה.
 */
describe('מיגרציה לגרסה 4', () => {
  beforeEach(async () => {
    await db.delete()
  })

  async function seedVersion3(exercises: Exercise[]): Promise<void> {
    const legacy = new Dexie('tavor-gym')
    legacy.version(3).stores(V3_STORES)
    await legacy.open()
    await legacy.table<Exercise, string>('exercises').bulkPut(exercises)
    legacy.close()
  }

  it('שותלת את הקישורים על מסד קיים', async () => {
    await seedVersion3(SEED_EXERCISES.map(withoutLink))

    await db.open()
    const exercises = await getAllExercises(true)

    expect(exercises.filter((e) => e.libraryId).length).toBe(Object.keys(LIBRARY_LINKS).length)
    expect(exercises.find((e) => e.id === 'leg-press')?.libraryId).toBe('lib-leg_press')
  })

  it('לא דורסת קישור שנקבע כבר על המכשיר', async () => {
    const rows = SEED_EXERCISES.map(withoutLink)
    const legPress = rows.find((e) => e.id === 'leg-press')!
    // קישור שנקבע מהוספת תרגיל מהמאגר גובר על הזריעה, גם כשהוא אחר
    legPress.libraryId = 'lib-push_up'

    await seedVersion3(rows)

    await db.open()
    const stored = await db.exercises.get('leg-press')
    expect(stored?.libraryId).toBe('lib-push_up')
  })

  it('משאירה את הרשומה כמות שהיא כשאין לה מקבילה במאגר', async () => {
    await seedVersion3(SEED_EXERCISES.map(withoutLink))

    await db.open()
    const stored = await db.exercises.get('hammer-curl')
    expect(stored?.libraryId).toBeUndefined()
    expect(stored?.name).toBe(SEED_EXERCISES.find((e) => e.id === 'hammer-curl')?.name)
  })
})
