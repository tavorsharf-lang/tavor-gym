import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady } from '@/db/db'
import { mediaDb } from '@/db/mediaDb'
import { backupFilename, exportData, importData, importMedia } from '@/db/backup'
import type { Block, Exercise, Routine, Session, SetLog } from '@/db/types'
import {
  addBodyWeight,
  getBodyWeights,
  getExerciseHistory,
  getFinishedSessions,
  getSetsForExercise,
  getSessionsSince,
  getSubstituteCandidates,
  lastPerformedFrom,
  searchSessions,
} from '@/db/queries'

// תאריכים קבועים — הבדיקות לא תלויות בשעון
const DAY = 86_400_000
const T1 = new Date(2026, 7, 1, 18, 0).getTime()
const T2 = new Date(2026, 7, 3, 18, 0).getTime()
const T3 = new Date(2026, 7, 5, 18, 0).getTime()

function exercise(over: Partial<Exercise> & Pick<Exercise, 'id' | 'name'>): Exercise {
  return {
    nameEn: '',
    muscleGroup: 'chest',
    subTarget: 'חזה עליון',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 90,
    targetSets: 3,
    targetReps: { min: 8, max: 12 },
    cues: [],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 40,
    isActive: true,
    order: 0,
    createdAt: T1,
    updatedAt: T1,
    ...over,
  }
}

function session(over: Partial<Session> & Pick<Session, 'id' | 'startedAt'>): Session {
  return {
    routineId: 'A',
    blockIds: [],
    date: '2026-08-01',
    endedAt: over.startedAt + 3600_000,
    durationSeconds: 3600,
    plannedOrder: [],
    actualOrder: [],
    substitutions: [],
    skippedExerciseIds: [],
    exerciseIds: [],
    notes: '',
    totalVolumeKg: 0,
    totalSets: 0,
    totalWorkSets: 0,
    ...over,
  }
}

function set(sessionId: string, exerciseId: string, i: number, at: number): SetLog {
  return {
    sessionId,
    exerciseId,
    setIndex: i,
    type: 'work',
    weightKg: 40 + i * 2.5,
    reps: 10,
    completedAt: at + i * 60_000,
  }
}

const EXERCISES: Exercise[] = [
  exercise({ id: 'press', name: 'לחיצת חזה', subTarget: 'חזה עליון', order: 0 }),
  exercise({ id: 'fly', name: 'פרפר', subTarget: 'חזה תחתון', order: 1 }),
  exercise({ id: 'incline', name: 'לחיצה בשיפוע', subTarget: 'חזה עליון', order: 2 }),
  exercise({ id: 'old-press', name: 'לחיצה ישנה', subTarget: 'חזה עליון', order: 3, isActive: false }),
  exercise({ id: 'row', name: 'חתירה', muscleGroup: 'back', subTarget: 'לטיסימוס', order: 4 }),
]

const ROUTINES: Routine[] = [
  { id: 'A', name: 'אימון A', subtitle: 'חזה ויד אחורית', order: 0, isActive: true, suggestBlocks: true, items: [] },
  { id: 'B', name: 'אימון B', subtitle: 'גב ויד קדמית', order: 1, isActive: true, suggestBlocks: true, items: [] },
]

const BLOCKS: Block[] = [{ id: 'abs', name: 'בטן', order: 2, items: [] }]

// s1 ו-s2 נסגרו, s3 עדיין בתהליך — הוא זה שמוודא שאימון פתוח לא דולף לתוצאות
const SESSIONS: Session[] = [
  session({
    id: 's1',
    startedAt: T1,
    date: '2026-08-01',
    routineId: 'A',
    blockIds: ['abs'],
    exerciseIds: ['press', 'row'],
  }),
  session({ id: 's2', startedAt: T2, date: '2026-08-03', routineId: 'B', exerciseIds: ['press'] }),
  session({
    id: 's3',
    startedAt: T3,
    date: '2026-08-05',
    routineId: 'A',
    endedAt: 0,
    exerciseIds: ['press'],
  }),
]

beforeEach(async () => {
  await ensureReady()
  await db.transaction(
    'rw',
    [db.exercises, db.routines, db.blocks, db.sessions, db.setLogs, db.ratings, db.bodyWeights],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.routines.clear(),
        db.blocks.clear(),
        db.sessions.clear(),
        db.setLogs.clear(),
        db.ratings.clear(),
        db.bodyWeights.clear(),
      ])
      await db.exercises.bulkPut(EXERCISES)
      await db.routines.bulkPut(ROUTINES)
      await db.blocks.bulkPut(BLOCKS)
      await db.sessions.bulkPut(SESSIONS)
      await db.setLogs.bulkAdd([
        set('s1', 'press', 0, T1),
        set('s1', 'press', 1, T1),
        set('s1', 'row', 0, T1),
        set('s2', 'press', 0, T2),
        set('s3', 'press', 0, T3),
      ])
      await db.ratings.bulkAdd([
        { sessionId: 's1', exerciseId: 'press', rating: 3, rir: 0, createdAt: T1 },
        { sessionId: 's2', exerciseId: 'press', rating: 1, rir: 3, createdAt: T2 },
      ])
    }
  )
})

describe('getSubstituteCandidates', () => {
  it('מחזיר קודם את אותו מיקוד, ומדלג על עצמו ועל תרגילים כבויים', async () => {
    const press = await db.exercises.get('press')
    expect(press).toBeDefined()
    const candidates = await getSubstituteCandidates(press as Exercise)
    expect(candidates.map((e) => e.id)).toEqual(['incline', 'fly'])
  })
})

describe('searchSessions', () => {
  it('מסנן לפי תוכנית ומשמיט אימון שלא נסגר', async () => {
    const found = await searchSessions({ routineId: 'A' })
    expect(found.map((s) => s.id)).toEqual(['s1'])
  })

  it('מסנן לפי תרגיל ולפי בלוק', async () => {
    expect((await searchSessions({ exerciseId: 'row' })).map((s) => s.id)).toEqual(['s1'])
    expect((await searchSessions({ blockId: 'abs' })).map((s) => s.id)).toEqual(['s1'])
  })

  it('טקסט חופשי מוצא לפי שם תרגיל, מהחדש לישן', async () => {
    const found = await searchSessions({ query: 'לחיצת' })
    expect(found.map((s) => s.id)).toEqual(['s2', 's1'])
  })

  it('טקסט חופשי מוצא גם לפי שם תוכנית', async () => {
    expect((await searchSessions({ query: 'אימון b' })).map((s) => s.id)).toEqual(['s2'])
  })

  it('סינונים מצטברים', async () => {
    expect((await searchSessions({ routineId: 'B', exerciseId: 'press' })).map((s) => s.id)).toEqual(['s2'])
    expect(await searchSessions({ routineId: 'B', exerciseId: 'row' })).toEqual([])
  })

  it('בלי סינון מחזיר את כל האימונים שנסגרו', async () => {
    expect((await searchSessions({})).map((s) => s.id)).toEqual(['s2', 's1'])
  })
})

describe('getExerciseHistory', () => {
  it('מהחדש לישן, עם הסטים והדירוג של כל אימון', async () => {
    const history = await getExerciseHistory('press')
    expect(history.map((h) => h.sessionId)).toEqual(['s2', 's1'])
    expect(history[0].rating).toEqual({ rating: 1, rir: 3 })
    expect(history[1].rating).toEqual({ rating: 3, rir: 0 })
    expect(history[0].sets).toHaveLength(1)
    expect(history[1].sets).toHaveLength(2)
    expect(history[1].sets[0].setIndex).toBe(0)
  })

  it('מכבד את מגבלת מספר האימונים', async () => {
    expect(await getExerciseHistory('press', 1)).toHaveLength(1)
  })
})

/**
 * הכיסוי הזה עבר מ-`getLastPerformance` שנמחקה. ההתנהגות עצמה חיה
 * ב-`getExerciseHistory` — אימון שעדיין בתהליך אינו נתון ללמוד ממנו.
 */
describe('getExerciseHistory מתעלם מאימון פתוח', () => {
  it('מחזיר את האימון האחרון שנסגר', async () => {
    const [last] = await getExerciseHistory('press', 1)
    expect(last?.sessionId).toBe('s2')
  })

  it('מחזיר רשימה ריקה כשאין היסטוריה', async () => {
    expect(await getExerciseHistory('fly', 1)).toEqual([])
  })
})

describe('getFinishedSessions ו-getSetsForExercise', () => {
  it('מחזירים מהחדש לישן', async () => {
    expect((await getFinishedSessions()).map((s) => s.id)).toEqual(['s2', 's1'])
    const sets = await getSetsForExercise('press', 2)
    expect(sets.map((s) => s.sessionId)).toEqual(['s3', 's2'])
  })
})

describe('lastPerformedFrom', () => {
  /** סט בודד, בשליטה מלאה על משקל וחזרות */
  function s(sessionId: string, weightKg: number, reps: number, at: number, i = 0): SetLog {
    return { sessionId, exerciseId: 'press', setIndex: i, type: 'work', weightKg, reps, completedAt: at }
  }

  it('מחזיר null כשאין סטי עבודה', () => {
    expect(lastPerformedFrom([])).toBeNull()
    expect(lastPerformedFrom([{ ...s('s1', 40, 10, T1), type: 'warmup' }])).toBeNull()
  })

  it('לוקח רק את האימון האחרון ולא את השיא ההיסטורי', () => {
    const out = lastPerformedFrom([
      s('s1', 80, 8, T1), // כבד יותר, אבל ישן
      s('s2', 60, 10, T2, 0),
      s('s2', 60, 9, T2 + 60_000, 1),
    ])
    expect(out).toEqual({ weightKg: 60, reps: 10, at: T2 + 60_000, sets: 2 })
  })

  it('מדווח את משקל העבודה ולא סט חריג יחיד', () => {
    // שני סטים ב-50 וסט אחד ב-70 — 50 הוא מה שבאמת נעשה
    const out = lastPerformedFrom([
      s('s2', 50, 10, T2, 0),
      s('s2', 50, 9, T2 + 60_000, 1),
      s('s2', 70, 4, T2 + 120_000, 2),
    ])
    expect(out?.weightKg).toBe(50)
    expect(out?.reps).toBe(10) // המרבי מבין הסטים באותו משקל
    expect(out?.sets).toBe(3) // ...אבל הספירה היא של כל האימון
  })

  it('מתעלם מסטי חימום בתוך אותו אימון', () => {
    const out = lastPerformedFrom([
      { ...s('s2', 20, 12, T2 - 60_000), type: 'warmup' },
      s('s2', 60, 8, T2),
    ])
    expect(out?.weightKg).toBe(60)
    expect(out?.sets).toBe(1)
  })
})

describe('getSessionsSince', () => {
  it('מחזיר רק אימונים שנסגרו מהתאריך והלאה, עם הסטים שלהם', async () => {
    const { sessions, sets } = await getSessionsSince(T2)
    // s1 מוקדם מדי, s3 לא נסגר
    expect(sessions.map((x) => x.id)).toEqual(['s2'])
    expect(sets.length).toBeGreaterThan(0)
    expect(sets.every((x) => x.sessionId === 's2')).toBe(true)
  })

  it('הגבול עצמו נכלל', async () => {
    const { sessions } = await getSessionsSince(T1)
    expect(sessions.map((x) => x.id).sort()).toEqual(['s1', 's2'])
  })

  it('בלי אימונים בטווח לא נוגע בטבלת הסטים', async () => {
    const { sessions, sets } = await getSessionsSince(T3 + DAY)
    expect(sessions).toEqual([])
    expect(sets).toEqual([])
  })
})

describe('addBodyWeight', () => {
  it('דורס שקילה קיימת באותו תאריך ושומר סדר כרונולוגי', async () => {
    await addBodyWeight('2026-08-01', 80)
    await addBodyWeight('2026-08-03', 80.4, 'בוקר')
    await addBodyWeight('2026-08-01', 81.2, 'אחרי ארוחה')

    const all = await getBodyWeights()
    expect(all.map((b) => b.date)).toEqual(['2026-08-01', '2026-08-03'])
    expect(all[0].weightKg).toBe(81.2)
    expect(all[0].note).toBe('אחרי ארוחה')
    expect(all[1].note).toBe('בוקר')
  })

  it('שומר את ההערה הקיימת כשלא נמסרת חדשה', async () => {
    await addBodyWeight('2026-08-04', 80, 'אחרי אימון')
    await addBodyWeight('2026-08-04', 79.5)
    const [entry] = await getBodyWeights()
    expect(entry.weightKg).toBe(79.5)
    expect(entry.note).toBe('אחרי אימון')
    expect(entry.createdAt).toBeLessThanOrEqual(Date.now() + DAY)
  })
})

describe('גיבוי נתונים', () => {
  it('שם הקובץ נושא את התאריך', () => {
    expect(backupFilename(T3, 'data')).toBe('tavor-gym-נתונים-2026-08-05.json')
    expect(backupFilename(T3, 'media')).toBe('tavor-gym-סרטונים-2026-08-05.zip')
  })

  it('דוחה בעברית קובץ שאינו גיבוי של האפליקציה', async () => {
    expect(await importData(new Blob(['לא JSON בכלל']))).toEqual({
      ok: false,
      error: 'הקובץ אינו JSON תקין',
    })
    expect(await importData(new Blob([JSON.stringify({ app: 'משהו אחר' })]))).toEqual({
      ok: false,
      error: 'הקובץ אינו גיבוי של אימוני כושר',
    })
    expect(await importData(new Blob([JSON.stringify({ app: 'tavor-gym' })]))).toEqual({
      ok: false,
      error: 'הגיבוי פגום — חסר החלק "תרגילים"',
    })
  })

  it('ייצוא וייבוא מחזירים את אותם נתונים ומחשבים שיאים מחדש', async () => {
    const blob = await exportData()
    await db.prs.clear()
    await db.exercises.clear()

    const result = await importData(blob)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.counts['אימונים']).toBe(3)

    expect(await db.exercises.count()).toBe(5)
    expect((await getFinishedSessions()).map((s) => s.id)).toEqual(['s2', 's1'])
    // השיאים לא הגיעו מהקובץ אלא חושבו מחדש מהסטים
    expect((await db.prs.where('exerciseId').equals('press').toArray()).length).toBeGreaterThan(0)
  })
})


/**
 * ארכיוני הסרטונים.
 *
 * client-zip לא רץ תחת jsdom (ה-Uint8Array של ה-TextEncoder שייך לתחום אחר),
 * ו-fake-indexeddb לא משמר Blob-ים בשכפול המובנה שלו. לכן הבדיקה עובדת מול
 * ארכיון אמיתי שנוצר ב-Node על ידי client-zip, ובודקת בדיוק את מה שכתוב כאן
 * ביד — הקורא של ה-ZIP.
 *
 * ב-FIXTURE יש ארבע רשומות בסדר הזה: video.mp4 · manifest.json ·
 * bundled_videos_press-1.mp4 · bundled_videos_press-1.jpg. ה-manifest אינו
 * הרשומה הראשונה בכוונה — פענוח שלו מוכיח שגם היסט של רשומה מאוחרת מחושב נכון.
 */
const MEDIA_ZIP_BASE64 =
  'UEsDBC0ACAgAAACgBVsAAAAAAAAAAAAAAAAJAAAAdmlkZW8ubXA0KlBLBwhbJrkJAQAAAAEAAABQ' +
  'SwMELQAICAAAAKAFWwAAAAAAAAAAAAAAAA0AAABtYW5pZmVzdC5qc29ueyJhcHAiOiJ0YXZvci1n' +
  'eW0iLCJzY2hlbWFWZXJzaW9uIjoxLCJleHBvcnRlZEF0IjoxNzU0NDEzMjAwMDAwLCJ2aWRlb3Mi' +
  'Olt7ImlkIjoiYnVuZGxlZDp2aWRlb3MvcHJlc3MtMS5tcDQiLCJleGVyY2lzZUlkIjoicHJlc3Mi' +
  'LCJvcmlnaW4iOiJidW5kbGVkIiwibGFiZWwiOiLXlNeT15LXnteUIDEiLCJkdXJhdGlvblNlYyI6' +
  'MTIsInNpemVCeXRlcyI6OCwid2lkdGgiOjcyMCwiaGVpZ2h0IjoxMjgwLCJoYXNUaHVtYm5haWwi' +
  'OnRydWUsImZpbGUiOiJidW5kbGVkX3ZpZGVvc19wcmVzcy0xLm1wNCIsInRodW1iIjoiYnVuZGxl' +
  'ZF92aWRlb3NfcHJlc3MtMS5qcGcifSx7ImlkIjoi16nXnNeZLTEiLCJleGVyY2lzZUlkIjoiZmx5' +
  'Iiwib3JpZ2luIjoiaW1wb3J0ZWQiLCJsYWJlbCI6Iteh16jXmNeV158g16nXnNeZIiwiZHVyYXRp' +
  'b25TZWMiOjMsInNpemVCeXRlcyI6MSwid2lkdGgiOjEwODAsImhlaWdodCI6MTkyMCwiaGFzVGh1' +
  'bWJuYWlsIjpmYWxzZSwiZmlsZSI6InZpZGVvLm1wNCIsInRodW1iIjpudWxsfV19UEsHCKS0CnsH' +
  'AgAABwIAAFBLAwQtAAgIAAAAoAVbAAAAAAAAAAAAAAAAGgAAAGJ1bmRsZWRfdmlkZW9zX3ByZXNz' +
  'LTEubXA0AQIDBAUGBwhQSwcIxYjKPwgAAAAIAAAAUEsDBC0ACAgAAACgBVsAAAAAAAAAAAAAAAAa' +
  'AAAAYnVuZGxlZF92aWRlb3NfcHJlc3MtMS5qcGcJCAdQSwcINv0tpgMAAAADAAAAUEsBAi0DLQAI' +
  'CAAAAKAFW1smuQkBAAAAAQAAAAkAAAAAAAAAAAAAALSBAAAAAHZpZGVvLm1wNFBLAQItAy0ACAgA' +
  'AACgBVuktAp7BwIAAAcCAAANAAAAAAAAAAAAAAC0gTgAAABtYW5pZmVzdC5qc29uUEsBAi0DLQAI' +
  'CAAAAKAFW8WIyj8IAAAACAAAABoAAAAAAAAAAAAAALSBegIAAGJ1bmRsZWRfdmlkZW9zX3ByZXNz' +
  'LTEubXA0UEsBAi0DLQAICAAAAKAFWzb9LaYDAAAAAwAAABoAAAAAAAAAAAAAALSBygIAAGJ1bmRs' +
  'ZWRfdmlkZW9zX3ByZXNzLTEuanBnUEsFBgAAAAAEAAQAAgEAABUDAAAAAA=='

/** ZIP תקין עם קובץ אחד ובלי manifest */
const STRAY_ZIP_BASE64 =
  'UEsDBC0ACAgAAACgBVsAAAAAAAAAAAAAAAAFAAAAYS50eHTXqdec15XXnVBLBwhNl5igCAAAAAgA' +
  'AABQSwECLQMtAAgIAAAAoAVbTZeYoAgAAAAIAAAABQAAAAAAAAAAAAAAtIEAAAAAYS50eHRQSwUG' +
  'AAAAAAEAAQAzAAAAOwAAAAAA'

function zipBlob(base64: string): Blob {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: 'application/zip' })
}

describe('importMedia', () => {
  it('קורא ארכיון STORED ומשחזר את הסרטונים לפי ה-manifest', async () => {
    await mediaDb.videos.clear()
    const steps: Array<[number, number]> = []
    const result = await importMedia(zipBlob(MEDIA_ZIP_BASE64), (done, total) =>
      steps.push([done, total])
    )

    expect(result).toEqual({ ok: true, count: 2 })
    expect(steps).toEqual([
      [0, 2],
      [1, 2],
      [2, 2],
    ])

    const bundled = await mediaDb.videos.get('bundled:videos/press-1.mp4')
    expect(bundled?.exerciseId).toBe('press')
    expect(bundled?.origin).toBe('bundled')
    expect(bundled?.label).toBe('הדגמה 1')
    // הגודל נלקח מהחיתוך של ה-Blob, לא מהמספר שרשום ב-manifest
    expect(bundled?.sizeBytes).toBe(8)
    expect(bundled?.thumbnailBlob).not.toBeNull()

    // מזהה בעברית שורד את ניקוי שם הקובץ, בזכות המיפוי ב-manifest
    const mine = await mediaDb.videos.get('שלי-1')
    expect(mine?.exerciseId).toBe('fly')
    expect(mine?.sizeBytes).toBe(1)
    expect(mine?.thumbnailBlob).toBeNull()
  })

  it('דוחה בעברית קובץ שאינו ארכיון סרטונים', async () => {
    expect(await importMedia(new Blob(['בכלל לא ZIP']))).toEqual({
      ok: false,
      error: 'הקובץ אינו ZIP',
    })
    expect(await importMedia(zipBlob(STRAY_ZIP_BASE64))).toEqual({
      ok: false,
      error: 'הקובץ אינו גיבוי סרטונים של אימוני כושר',
    })
  })
})
