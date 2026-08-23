// @vitest-environment node
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady, getSettings } from '@/db/db'
import { mediaDb } from '@/db/mediaDb'
import { exportData, exportMedia, importData, importMedia } from '@/db/backup'
import { invalidateHiddenVideos } from '@/db/hiddenVideos'
import type { Session, SetLog, VideoAsset } from '@/db/types'

/**
 * הגיבוי הוא רשת הביטחון היחידה של האפליקציה — אין שרת, אין ענן, והנתונים
 * קיימים רק על המכשיר הזה.
 *
 * `exportMedia` לא רץ עד כה באף בדיקה, וזו נקודה עיוורת מסוכנת במיוחד: ייצוא
 * שבור מתגלה רק ברגע שמנסים לשחזר, כלומר אחרי שהמכשיר הישן כבר נמחק. הבדיקות
 * כאן רצות round-trip מלא בסביבת node, שבה client-zip עובד כמו בדפדפן.
 */

function videoAsset(over: Partial<VideoAsset> = {}): VideoAsset {
  return {
    id: 'bundled:videos/leg-press-01.mp4',
    exerciseId: 'leg-press',
    origin: 'bundled',
    blob: new Blob([new Uint8Array([1, 2, 3, 4])]),
    thumbnailBlob: new Blob([new Uint8Array([9, 9])]),
    label: 'הדגמה 1',
    durationSec: 6,
    sizeBytes: 4,
    width: 720,
    height: 1280,
    createdAt: 1,
    ...over,
  }
}

describe('גיבוי מדיה — round-trip מלא', () => {
  beforeEach(async () => {
    await db.delete()
    await mediaDb.delete()
    await db.open()
    await mediaDb.open()
    await ensureReady()
    invalidateHiddenVideos()
  })

  it('מייצא ומייבא בחזרה את הבייטים, את התמונה הממוזערת ואת המזהה', async () => {
    await mediaDb.videos.put(videoAsset())

    const zip = await exportMedia()
    await mediaDb.videos.clear()
    const result = await importMedia(new File([zip], 'media.zip'))

    expect(result.ok).toBe(true)
    const back = await mediaDb.videos.get('bundled:videos/leg-press-01.mp4')
    expect(back).toBeTruthy()
    expect(back?.exerciseId).toBe('leg-press')
    expect(new Uint8Array(await back!.blob.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 4]))
    expect(back?.thumbnailBlob).toBeTruthy()
  })

  /**
   * הבאג שנמצא בסקירה: הייבוא הכיר רק 'bundled' ו-'imported', ולכן 155 סרטוני
   * המאגר חזרו כ-'imported' — המונה הראה 0, ההתקנה דילגה עליהם, וכפתור המחיקה
   * לא הופיע. עשרות מגה-בייט בלי שום מסלול ניהול.
   */
  it('שומר את שלושת סוגי המקור, כולל המאגר הלימודי', async () => {
    await mediaDb.videos.bulkPut([
      videoAsset({ id: 'bundled:videos/leg-press-01.mp4', origin: 'bundled' }),
      videoAsset({
        id: 'bundled:videos/lib/lib-plank-01.mp4',
        exerciseId: 'lib-plank',
        origin: 'library',
      }),
      videoAsset({ id: 'vid-mine', exerciseId: 'leg-press', origin: 'imported' }),
    ])

    const zip = await exportMedia()
    await mediaDb.videos.clear()
    await importMedia(new File([zip], 'media.zip'))

    expect((await mediaDb.videos.get('bundled:videos/leg-press-01.mp4'))?.origin).toBe('bundled')
    expect((await mediaDb.videos.get('bundled:videos/lib/lib-plank-01.mp4'))?.origin).toBe('library')
    expect((await mediaDb.videos.get('vid-mine'))?.origin).toBe('imported')
  })

  it('שם קובץ עברי ומזהה עם תווים מיוחדים שורדים את הארכיון', async () => {
    await mediaDb.videos.put(
      videoAsset({ id: 'vid-לחיצת רגליים/01', exerciseId: 'leg-press', origin: 'imported' })
    )

    const zip = await exportMedia()
    await mediaDb.videos.clear()
    await importMedia(new File([zip], 'media.zip'))

    expect(await mediaDb.videos.get('vid-לחיצת רגליים/01')).toBeTruthy()
  })

  it('נכס בלי תמונה ממוזערת לא מפיל את הייצוא', async () => {
    await mediaDb.videos.put(videoAsset({ thumbnailBlob: null }))

    const zip = await exportMedia()
    await mediaDb.videos.clear()
    const result = await importMedia(new File([zip], 'media.zip'))

    expect(result.ok).toBe(true)
    expect((await mediaDb.videos.get('bundled:videos/leg-press-01.mp4'))?.thumbnailBlob).toBeNull()
  })
})

describe('ייבוא נתונים', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureReady()
    invalidateHiddenVideos()
  })

  async function backupJson(): Promise<Record<string, unknown>> {
    return JSON.parse(await (await exportData()).text()) as Record<string, unknown>
  }

  it('round-trip שומר את הקטלוג, התוכניות וההגדרות', async () => {
    const before = await db.exercises.count()
    const json = await backupJson()

    const result = await importData(new File([JSON.stringify(json)], 'b.json'))
    expect(result.ok).toBe(true)
    expect(await db.exercises.count()).toBe(before)
    expect((await getSettings()).defaultReps).toBe(6)
  })

  /** גיבוי מלפני גרסה 4 לא מכיר את הקישור למאגר; השחזור שותל אותו מחדש */
  it('גיבוי בלי libraryId מקבל את הקישורים בחזרה', async () => {
    const json = await backupJson()
    json.exercises = (json.exercises as Record<string, unknown>[]).map((e) => {
      const copy = { ...e }
      delete copy.libraryId
      return copy
    })

    await importData(new File([JSON.stringify(json)], 'b.json'))
    expect((await db.exercises.get('leg-press'))?.libraryId).toBe('lib-leg_press')
  })

  /** גיבוי מלפני גרסה 5 מחזיק את הפלאנק כחזרות; המיגרציה כבר לא תרוץ שוב */
  it('גיבוי בלי metric מחזיר את הפלאנק להימדד בזמן', async () => {
    const json = await backupJson()
    json.exercises = (json.exercises as Record<string, unknown>[]).map((e) => {
      if (e.id !== 'abs') return e
      const copy: Record<string, unknown> = { ...e, targetReps: { min: 12, max: 20 } }
      delete copy.metric
      return copy
    })
    json.routines = (json.routines as { items: { exerciseId: string }[] }[]).map((r) => ({
      ...r,
      items: r.items.map((it) =>
        it.exerciseId === 'abs' ? { ...it, targetReps: { min: 12, max: 20 } } : it
      ),
    }))

    await importData(new File([JSON.stringify(json)], 'b.json'))

    const plank = await db.exercises.get('abs')
    expect(plank?.metric).toBe('seconds')
    expect(plank?.targetReps).toEqual({ min: 75, max: 75 })
    const absItems = (await db.routines.toArray())
      .flatMap((r) => r.items)
      .filter((it) => it.exerciseId === 'abs')
    expect(absItems.every((it) => it.targetReps.min === 75)).toBe(true)
  })

  /**
   * תיקון-קדימה אמור לגעת רק במה שבאמת ישן. גרסה קודמת שלו כתבה את היעד
   * המקורי לכל פריט פלאנק בכל ייבוא — כלומר שחזור של גיבוי עדכני מחק יעד
   * שהמשתמש קבע בעצמו בעורך התוכניות, והשאיר קטלוג ותוכנית סותרים.
   */
  it('גיבוי עדכני לא מאבד יעד פלאנק שהמשתמש שינה', async () => {
    await db.exercises.update('abs', { targetReps: { min: 90, max: 90 } })
    const routines = await db.routines.toArray()
    for (const r of routines) {
      if (!r.items.some((it) => it.exerciseId === 'abs')) continue
      await db.routines.put({
        ...r,
        items: r.items.map((it) =>
          it.exerciseId === 'abs' ? { ...it, targetReps: { min: 90, max: 90 } } : it
        ),
      })
    }

    const json = await backupJson()
    await importData(new File([JSON.stringify(json)], 'b.json'))

    expect((await db.exercises.get('abs'))?.targetReps).toEqual({ min: 90, max: 90 })
    const absItems = (await db.routines.toArray())
      .flatMap((r) => r.items)
      .filter((it) => it.exerciseId === 'abs')
    expect(absItems.length).toBeGreaterThan(0)
    expect(absItems.every((it) => it.targetReps.min === 90)).toBe(true)
  })

  it('הסיכום מדווח על מה שנכתב ולא על מה שהיה בקובץ', async () => {
    const json = await backupJson()
    json.sessions = []
    json.setLogs = [
      {
        sessionId: 's-open',
        exerciseId: 'leg-press',
        setIndex: 0,
        type: 'work',
        weightKg: 100,
        reps: 10,
        completedAt: 1,
      },
    ]
    json.prs = [
      {
        exerciseId: 'leg-press',
        kind: 'maxWeight',
        value: 999,
        weightKg: 999,
        reps: 1,
        sessionId: 'ghost',
        achievedAt: 1,
      },
    ]

    const result = await importData(new File([JSON.stringify(json)], 'b.json'))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // הסט היתום סונן והשיא נבנה מחדש — שניהם אפס במסד
    expect(result.counts['סטים']).toBe(0)
    expect(result.counts['שיאים']).toBe(0)
  })

  /**
   * גיבוי שנוצר באמצע אימון פתוח מכיל את הסטים שלו בלי שורת session. בלי
   * הסינון הם היו הופכים ליתומים קבועים — נספרים בגרפים ובשיאים, בלתי נראים
   * בהיסטוריה, ובלתי ניתנים למחיקה.
   */
  it('סטים בלי סשן לא נכנסים בשחזור', async () => {
    const json = await backupJson()
    const session: Session = {
      id: 's-real',
      routineId: 'F1',
      blockIds: [],
      date: '2026-01-01',
      startedAt: 1,
      endedAt: 2,
      durationSeconds: 1,
      plannedOrder: ['leg-press'],
      actualOrder: ['leg-press'],
      substitutions: [],
      skippedExerciseIds: [],
      exerciseIds: ['leg-press'],
      notes: '',
      totalVolumeKg: 100,
      totalSets: 1,
      totalWorkSets: 1,
    }
    const kept: SetLog = {
      sessionId: 's-real',
      exerciseId: 'leg-press',
      setIndex: 0,
      type: 'work',
      weightKg: 100,
      reps: 10,
      completedAt: 2,
    }
    const orphan: SetLog = { ...kept, sessionId: 's-open', weightKg: 999 }
    json.sessions = [session]
    json.setLogs = [kept, orphan]

    await importData(new File([JSON.stringify(json)], 'b.json'))

    const rows = await db.setLogs.toArray()
    expect(rows.length).toBe(1)
    expect(rows[0].sessionId).toBe('s-real')
    // והשיא לא נבנה מהסט היתום
    expect((await db.prs.get(['leg-press', 'maxWeight']))?.value).toBe(100)
  })

  /** הסטים הם מקור האמת — שיא שאין לו כיסוי בסטים לא שורד את הייבוא */
  it('שיא רפאים מהקובץ לא נכתב', async () => {
    const json = await backupJson()
    json.sessions = []
    json.setLogs = []
    json.prs = [
      {
        exerciseId: 'leg-press',
        kind: 'maxWeight',
        value: 999,
        weightKg: 999,
        reps: 1,
        sessionId: 'ghost',
        achievedAt: 1,
      },
    ]

    await importData(new File([JSON.stringify(json)], 'b.json'))
    expect(await db.prs.get(['leg-press', 'maxWeight'])).toBeUndefined()
  })

  it('גיבוי ישן (schemaVersion 1) — הדירוגים מתורגמים לסולם 1–5', async () => {
    const json = await backupJson()
    // קובץ מהעידן של סולם 3 הדרגות: 1 קל · 2 בינוני · 3 קשה
    json.schemaVersion = 1
    json.ratings = [
      { id: 1, sessionId: 's1', exerciseId: 'leg-press', rating: 1, rir: null, createdAt: 1 },
      { id: 2, sessionId: 's1', exerciseId: 'leg-press', rating: 2, rir: 2, createdAt: 2 },
      { id: 3, sessionId: 's1', exerciseId: 'abs', rating: 3, rir: 0, createdAt: 3 },
    ]

    const result = await importData(new File([JSON.stringify(json)], 'b.json'))
    expect(result.ok).toBe(true)

    // אותה המרה כמו מיגרציה 7: "קשה" ישן חייב להישאר קשה, לא להפוך ל"בינוני"
    const ratings = (await db.ratings.toArray()).sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    expect(ratings.map((r) => r.rating)).toEqual([2, 3, 4])
    expect(ratings.map((r) => r.rir)).toEqual([null, 2, 0])
  })

  it('גיבוי עדכני (schemaVersion 2) — הדירוגים נכנסים כמו שהם', async () => {
    const json = await backupJson()
    json.ratings = [
      { id: 1, sessionId: 's1', exerciseId: 'leg-press', rating: 5, rir: null, createdAt: 1 },
      { id: 2, sessionId: 's1', exerciseId: 'abs', rating: 1, rir: 4, createdAt: 2 },
    ]

    const result = await importData(new File([JSON.stringify(json)], 'b.json'))
    expect(result.ok).toBe(true)

    const ratings = (await db.ratings.toArray()).sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    expect(ratings.map((r) => r.rating)).toEqual([5, 1])
  })

  it('גיבוי מפורמט עתידי נדחה במקום לדרוס את המסד', async () => {
    const json = await backupJson()
    json.schemaVersion = 99

    const before = await db.exercises.count()
    const result = await importData(new File([JSON.stringify(json)], 'b.json'))

    expect(result.ok).toBe(false)
    expect(await db.exercises.count()).toBe(before)
  })

  it('קובץ שאינו גיבוי של האפליקציה נדחה', async () => {
    const result = await importData(new File(['{"app":"something-else"}'], 'b.json'))
    expect(result.ok).toBe(false)
  })
})
