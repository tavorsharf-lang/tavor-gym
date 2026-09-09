import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { DEFAULT_SETTINGS, SEED_EXERCISES } from '@/db/seed'
import { withDipsChest } from '@/db/dipsChest'
import type { Exercise, SettingsRow } from '@/db/types'

/**
 * מיגרציה 16 — מקבילים במכונה חוזרים לחזה.
 *
 * מיגרציה 10 העבירה אותם לטריצפס לפי כותרת הסרטון; כרטיס השרירים של המכונה,
 * שנכנס למאגר אחרי כן, מודד חזה תחתון 48% מול טרייספס 27%. מה שנבדק כאן הוא
 * שני השערים שמפרידים בין תיקון לדריסה: הסיווג נוגע רק בערך שהאפליקציה עצמה
 * כתבה, והטקסט רק במי ששמו ודגשיו עדיין המקוריים.
 */

const V15_STORES = {
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

/** הדגשים והשם כפי שמיגרציה 10 השאירה אותם על המכשיר */
const V10_CUES = [
  'גוף זקוף ומרפקים צמודים לצדדים — ככה העומס נשאר על הטריצפס',
  'הטיה קדימה מעבירה חלק מהעומס לחזה התחתון',
  'הידיות נעות ולא הגוף — לדחוף למטה עד פשיטת מרפק מלאה',
  'למעלה לא לעלות גבוה מדי — משם זו כבר הכתף הקדמית',
]

/** רשומת המקבילים כפי שהיא שוכבת על מכשיר שעבר את מיגרציה 10 */
function dipsAfterV10(patch: Partial<Exercise> = {}): Exercise {
  const seeded = SEED_EXERCISES.find((e) => e.id === 'dips')!
  return {
    ...seeded,
    name: 'מקבילים במכונה',
    nameEn: 'Plate-Loaded Triceps Dips',
    muscleGroup: 'triceps',
    subTarget: 'טריצפס וחזה תחתון',
    secondaryMuscles: ['chest', 'shoulders'],
    cues: [...V10_CUES],
    ...patch,
  }
}

async function seedV15(dips: Exercise): Promise<void> {
  const old = new Dexie('tavor-gym')
  old.version(15).stores(V15_STORES)
  await old.open()
  await old
    .table<Exercise, string>('exercises')
    .bulkPut([...SEED_EXERCISES.filter((e) => e.id !== 'dips'), dips])
  await old.table<SettingsRow, string>('settings').put({ key: 'app', value: DEFAULT_SETTINGS })
  old.close()
}

describe('מיגרציה 16 — המקבילים חוזרים לחזה', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
  })

  it('מעבירה את הסיווג, ומורידה את הטריצפס למשניים בלי כפילות', async () => {
    await seedV15(dipsAfterV10())

    await db.open()

    const dips = await db.exercises.get('dips')
    expect(dips?.muscleGroup).toBe('chest')
    // הראשי לעולם לא נשאר גם במשניים — זו ספירה כפולה במסך הכיסוי
    expect(dips?.secondaryMuscles).not.toContain('chest')
    expect(dips?.secondaryMuscles).toContain('triceps')
  })

  it('מיישרת גם את השם האנגלי, המיקוד ושני הדגשים הראשונים', async () => {
    await seedV15(dipsAfterV10())

    await db.open()

    const dips = await db.exercises.get('dips')
    expect(dips?.nameEn).toBe('Plate-Loaded Chest Dips')
    expect(dips?.subTarget).toBe('חזה תחתון וטריצפס')
    expect(dips?.cues[0]).toBe('הטיה קדימה — זה מה שמעביר את העומס לחזה התחתון')
    // שני האחרונים הם מכניקה של המכונה ולא של השריר, ולכן לא זזו
    expect(dips?.cues[2]).toBe(V10_CUES[2])
    expect(dips?.cues[3]).toBe(V10_CUES[3])
  })

  it('לא נוגעת בקבוצה שהמשתמש בחר בעצמו', async () => {
    await seedV15(dipsAfterV10({ muscleGroup: 'shoulders' }))

    await db.open()

    expect((await db.exercises.get('dips'))?.muscleGroup).toBe('shoulders')
  })

  it('לא נוגעת בדגשים שהמשתמש כתב, וכן מתקנת את הסיווג', async () => {
    await seedV15(dipsAfterV10({ cues: ['הדגש שלי'] }))

    await db.open()

    const dips = await db.exercises.get('dips')
    expect(dips?.cues).toEqual(['הדגש שלי'])
    /*
      הסיווג כן מתוקן: הוא עובר בשער נפרד מהטקסט, כי הוא עובדה על התרגיל
      ולא ניסוח. אותה הפרדה בדיוק כמו במיגרציה 10.
    */
    expect(dips?.muscleGroup).toBe('chest')
  })

  it('מסד חדש נזרע ישר עם הסיווג הנכון', async () => {
    await db.open()

    const dips = await db.exercises.get('dips')
    expect(dips?.muscleGroup).toBe('chest')
    expect(dips?.secondaryMuscles).toContain('triceps')
  })
})

/**
 * אותה המרה חייבת לרוץ גם בייבוא גיבוי, ולכן היא מודול ולא קוד במיגרציה:
 * קובץ שנוצר בין מיגרציה 10 ל-16 מחזיק `triceps`, ובלי המעבר הזה שחזור שלו
 * היה מחזיר את הסיווג שהוסר למסד שכבר תוקן.
 */
describe('withDipsChest', () => {
  it('הופך רשומה שנשמרה בין הגרסאות', () => {
    const fixed = withDipsChest(dipsAfterV10())
    expect(fixed.muscleGroup).toBe('chest')
    expect(fixed.secondaryMuscles).toEqual(['triceps', 'shoulders'])
  })

  it('לא נוגע בגיבוי ישן שכבר מחזיק chest', () => {
    const old = dipsAfterV10({ muscleGroup: 'chest', secondaryMuscles: ['triceps', 'shoulders'] })
    expect(withDipsChest(old)).toBe(old)
  })

  it('לא נוגע בתרגיל אחר', () => {
    const press = SEED_EXERCISES.find((e) => e.id === 'db-bench-press')!
    expect(withDipsChest(press)).toBe(press)
  })
})
