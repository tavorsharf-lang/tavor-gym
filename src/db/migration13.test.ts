import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db/db'
import { SEED_EXERCISES } from '@/db/seed'
import type { Exercise } from '@/db/types'

/**
 * מיגרציה 13 — חותמת "משתמש קיים", ומה שהיא מגנה עליו.
 *
 * זו ההוכחה הפורמלית שתבור לא יפגוש את מסך "ברוך הבא" באפליקציה שהוא משתמש
 * בה כבר חודשים. `Dexie` מריץ `upgrade` אם ורק אם המסד היה קיים בגרסה נמוכה
 * יותר — כלומר בדיוק על מכשיר ותיק — ומסד חדש עובר דרך `populate` בלי לראות
 * אותה בכלל. שני הצדדים נבדקים כאן מול מסד אמיתי ולא מול הנחה.
 *
 * **‏localStorage מזויף במפורש.** ה-`localStorage` הגלובלי בהרצה הזו הוא
 * אובייקט ריק בלי שיטות (אזהרת `--localstorage-file` בפלט), ולכן כל גישה אליו
 * נופלת ל-catch ו-`isFirstRun()` מחזיר תמיד false. בלי הזיוף כאן הבדיקה הייתה
 * "עוברת" על מסלול שלא רץ. זו אותה תבנית בדיוק שב-builderBasket.test.ts.
 */

const KEY = 'tavor-gym:first-run'

const V12_STORES = {
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

const store = new Map<string, string>()

beforeEach(async () => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  })
  await db.close()
  await db.delete()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** מסד כפי שהוא שוכב על המכשיר של תבור לפני העדכון */
async function seedV12(): Promise<void> {
  const old = new Dexie('tavor-gym')
  old.version(12).stores(V12_STORES)
  await old.open()
  await old.table<Exercise, string>('exercises').bulkPut(SEED_EXERCISES)
  old.close()
}

describe('מיגרציה 13 — מי רואה את מסך הפתיחה', () => {
  it('מסד קיים נחתם "done" — משתמש ותיק לא רואה את מסך הפתיחה', async () => {
    await seedV12()
    expect(store.get(KEY)).toBeUndefined()

    await db.open()

    expect(store.get(KEY)).toBe('done')
  })

  it('המיגרציה לא נוגעת בנתונים — היא שורה אחת שכותבת רק ל-localStorage', async () => {
    await seedV12()
    await db.open()

    /*
      זריקה בתוך `upgrade` חוסמת את `db.open()`, והאפליקציה הייתה נוחתת על
      מסך השגיאה במקום להיפתח. הבדיקה הזו היא הגדר סביב הפיתוי להוסיף לתוכה
      עבודת קטלוג בעתיד.
    */
    expect(await db.exercises.count()).toBe(SEED_EXERCISES.length)
    const legPress = await db.exercises.get('leg-press')
    // המשקלים של תבור נשארים שלו — המיגרציה לא מרוקנת מסד קיים
    expect(legPress?.seedWeightKg).toBe(160)
  })

  it('מסד חדש לגמרי מסומן "new" — רק הוא רואה את מסך הפתיחה', async () => {
    await db.open()

    expect(store.get(KEY)).toBe('new')
  })

  it('מסד חדש נזרע בלי המשקלים של תבור', async () => {
    await db.open()

    // ההוכחה ש-populate עובר דרך freshSeed* ולא דרך הקבועים
    expect((await db.exercises.get('leg-press'))?.seedWeightKg).toBeNull()
    const f1 = await db.routines.get('F1')
    expect(f1?.items.find((i) => i.exerciseId === 'leg-press')?.startWeightKg).toBeNull()
    // ואותה כמות תרגילים — ריקון משקלים ולא קיצוץ קטלוג
    expect(await db.exercises.count()).toBe(SEED_EXERCISES.length)
  })

  it('"מחק הכל" לא מחזיר את מסך הפתיחה — הדגל שורד את מחיקת המסד', async () => {
    await seedV12()
    await db.open()
    expect(store.get(KEY)).toBe('done')

    // בדיוק מה ש-resetDatabase עושה: מוחק, פותח מחדש, וזורע שוב
    await db.close()
    await db.delete()
    await db.open()

    /*
      ‏`markFirstRun` כותב רק כשהמפתח חסר, והוא ב-localStorage ולא במסד —
      ולכן `populate` שרץ שוב לא מוריד את החותמת. בלי זה כל איפוס יזום היה
      זורק לתבור את מסך "ברוך הבא" בפנים.
    */
    expect(store.get(KEY)).toBe('done')
  })
})
