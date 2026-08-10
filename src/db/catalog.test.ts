import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady } from '@/db/db'
import { getCatalogEntries, getCatalogEntry } from '@/db/catalog'
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
    expect(exercises.find((e) => e.id === 'calf-raise')?.libraryId).toBeUndefined()
  })

  it('מאחד את שני המקורות בלי כפילות — 28 ועוד 62 פחות 12 מקושרים', async () => {
    const entries = await getCatalogEntries()
    const own = entries.filter((e) => e.exercise)
    const teaching = entries.filter((e) => !e.exercise)

    expect(entries.length).toBe(78)
    expect(own.length).toBe(28)
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
    expect(exercises.length).toBe(28)

    const legPress = exercises.find((e) => e.id === 'leg-press')!
    const candidates = await getSubstituteCandidates(legPress)
    expect(candidates.some((e) => e.id.startsWith('lib-'))).toBe(false)
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
    const stored = await db.exercises.get('calf-raise')
    expect(stored?.libraryId).toBeUndefined()
    expect(stored?.name).toBe(SEED_EXERCISES.find((e) => e.id === 'calf-raise')?.name)
  })
})
