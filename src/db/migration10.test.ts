import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { SEED_EXERCISES } from '@/db/seed'
import type { Exercise } from '@/db/types'

/**
 * מיגרציה 10 — הקטלוג מיושר מול מה שהסרטונים באמת מראים.
 *
 * כמו מיגרציות 5, 7 ו-9, זה קוד שרץ פעם אחת על הנתונים האמיתיים, ולכן הוא
 * נבדק מול מסד גרסה 9 אמיתי שמחזיק את הרשומות כפי שהן שכבו על המכשיר.
 *
 * שני כשלים שקטים שהיא מונעת: היסטוריה שמתנתקת (אילו הפיצול היה יוצר מזהה
 * חדש לשטוח ומשאיר את הישן לשיפוע), ורשומה חדשה שלא מגיעה למי שכבר מותקן
 * (שינוי ב-seed.ts לבדו נוגע רק בהתקנה טרייה).
 */

/** הסכמה כפי שהייתה מגרסה 4 ועד 9 — אף מיגרציה בדרך לא שינתה אינדקסים */
const V9_STORES = {
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

const template = SEED_EXERCISES.find((e) => e.id === 'db-bench-press') as Exercise

function legacy(over: Partial<Exercise>): Exercise {
  return { ...template, libraryId: undefined, ...over }
}

/** הקטלוג כפי שהוא שכב על המכשיר בגרסה 9 */
function legacyExercises(): Exercise[] {
  return [
    legacy({
      id: 'db-bench-press',
      name: 'לחיצת חזה במוט — שיפוע חיובי ושטוח',
      nameEn: 'Barbell Bench Press (Incline & Flat)',
      subTarget: 'חזה עליון ותחתון',
      muscleGroup: 'chest',
      order: 1,
      usesPlates: false,
      cues: [
        'שכמות נעוצות במשענת לאורך כל הסט',
        'קשת קלה בגב התחתון, ישבן נשאר על הספסל',
        'להוריד עד גובה החזה, לא נמוך יותר',
        'למעלה לא לנעול מרפקים — לשמור מתח',
      ],
    }),
    legacy({
      id: 'dips',
      name: 'מקבילים במכונה',
      nameEn: 'Plate-Loaded Triceps Dips',
      subTarget: 'טריצפס וחזה תחתון',
      muscleGroup: 'chest',
      secondaryMuscles: ['triceps', 'shoulders'],
      order: 3,
      cues: [
        'גוף זקוף ומרפקים צמודים לצדדים — ככה העומס נשאר על הטריצפס',
        'הטיה קדימה מעבירה חלק מהעומס לחזה התחתון',
        'לרדת עד שהכתף בגובה המרפק, לא נמוך',
        'לא לנעול מרפקים למעלה',
      ],
    }),
    // ביקורת: תרגיל שהמיגרציה לא אמורה לגעת בו, ושהסדר שלו כן זז בגלל התאומה
    legacy({ id: 'lat-pulldown', name: 'משיכת פולי עליון', muscleGroup: 'back', order: 9 }),
  ]
}

async function seedV9(): Promise<void> {
  const old = new Dexie('tavor-gym')
  old.version(9).stores(V9_STORES)
  await old.open()
  await old.table<Exercise, string>('exercises').bulkPut(legacyExercises())
  old.close()
}

describe('מיגרציה 10 — פיצול לחיצת החזה ותיקוני קטלוג', () => {
  beforeEach(async () => {
    await db.close()
    await db.delete()
  })

  it('המזהה הישן נשאר עם הגרסה השטוחה, כדי שההיסטוריה לא תתנתק', async () => {
    await seedV9()
    await db.open()

    const flat = await db.exercises.get('db-bench-press')
    expect(flat?.name).toBe('לחיצת חזה במוט — ספסל שטוח')
    expect(flat?.nameEn).toBe('Flat Barbell Bench Press')
    expect(flat?.cues[2]).toBe('להוריד את המוט לחזה האמצעי-תחתון, מרפקים ב-45 מעלות')
  })

  it('רשומת השיפוע נולדת מיד אחרי השטוחה, ודוחפת את מי שאחריה', async () => {
    await seedV9()
    await db.open()

    const incline = await db.exercises.get('incline-barbell-bench-press')
    expect(incline?.nameEn).toBe('Incline Barbell Bench Press')
    expect(incline?.isActive).toBe(true)
    // מיד אחרי השטוחה (order 1), ומי שהיה אחריה זז מקום אחד
    expect(incline?.order).toBe(2)
    expect((await db.exercises.get('lat-pulldown'))?.order).toBe(10)
    // ומי שהיה לפניה לא זז
    expect((await db.exercises.get('db-bench-press'))?.order).toBe(1)
  })

  it('מחשבון הפלטות נדלק בלחיצת החזה — היא מוט, לא דאמבלים', async () => {
    await seedV9()
    await db.open()
    expect((await db.exercises.get('db-bench-press'))?.usesPlates).toBe(true)
  })

  it('מקבילים עוברים לטריצפס, והחזה יורד לעבודה משנית בלי כפילות', async () => {
    await seedV9()
    await db.open()

    const dips = await db.exercises.get('dips')
    expect(dips?.muscleGroup).toBe('triceps')
    // הראשי לעולם לא נשאר גם במשניים — זו ספירה כפולה במסך הכיסוי
    expect(dips?.secondaryMuscles).toEqual(['chest', 'shoulders'])
    expect(dips?.cues[2]).toBe('הידיות נעות ולא הגוף — לדחוף למטה עד פשיטת מרפק מלאה')
  })

  it('הפיצול פותח את הקישורים למאגר ששתי הרשומות חסמו זו לזו', async () => {
    await seedV9()
    await db.open()

    expect((await db.exercises.get('db-bench-press'))?.libraryId).toBe('lib-barbell_bench_press')
    expect((await db.exercises.get('incline-barbell-bench-press'))?.libraryId).toBe(
      'lib-incline_barbell_bench_press'
    )
  })

  it('לא נוגעת ברשומה שהמשתמש כבר שינה את שמה בעצמו', async () => {
    const old = new Dexie('tavor-gym')
    old.version(9).stores(V9_STORES)
    await old.open()
    await old
      .table<Exercise, string>('exercises')
      .bulkPut([legacy({ id: 'dips', name: 'המקבילים שלי', muscleGroup: 'chest', order: 3 })])
    old.close()
    await db.open()

    const dips = await db.exercises.get('dips')
    expect(dips?.name).toBe('המקבילים שלי')
    // הדגשים הם של המשתמש עכשיו, אבל קבוצת השריר היא עובדה על התרגיל ולא טקסט
    expect(dips?.muscleGroup).toBe('triceps')
  })
})
