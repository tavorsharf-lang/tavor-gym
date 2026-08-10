import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady, getSettings } from '@/db/db'
import { invalidateHiddenVideos, loadHiddenVideoIds, restoreHiddenVideos } from '@/db/hiddenVideos'
import {
  bundledId,
  bundledVideosFor,
  deleteVideo,
  loadThumbnailFor,
  loadVideosFor,
  mediaDb,
  videoLabelsFor,
} from '@/db/mediaDb'
import { VIDEO_MANIFEST } from '@/db/videoManifest'
import { LIBRARY_CATALOG } from '@/db/libraryManifest'

/**
 * מחיקת סרטון.
 *
 * הדרישה היא "והוא לא יוצג יותר בשום מקום", והנקודה הקשה בה היא שרוב
 * הסרטונים *מצורפים* לאפליקציה: מחיקת ה-Blob לבדה מפנה מקום אבל לא מסלקת
 * אותם — הם היו נטענים שוב מהרשת בפתיחה הבאה.
 */
describe('מחיקת סרטונים', () => {
  beforeEach(async () => {
    await db.delete()
    await mediaDb.delete()
    await db.open()
    await mediaDb.open()
    await ensureReady()
    invalidateHiddenVideos()
  })

  /** תרגיל שיש לו יותר מהדגמה אחת, כדי שאפשר יהיה לבדוק מיספור מחדש */
  const exerciseId =
    Object.entries(VIDEO_MANIFEST).find(([, list]) => list.length > 1)?.[0] ?? 'db-bench-press'

  it('סרטון שנמחק לא חוזר ברשימת הסרטונים של התרגיל', async () => {
    const before = await loadVideosFor(exerciseId)
    expect(before.length).toBeGreaterThan(1)

    await deleteVideo(before[0].id)

    const after = await loadVideosFor(exerciseId)
    expect(after.length).toBe(before.length - 1)
    expect(after.some((v) => v.id === before[0].id)).toBe(false)
  })

  it('ההחלטה נשמרת בהגדרות, ולכן נכנסת לגיבוי ושורדת התקנה מחדש של המדיה', async () => {
    const [first] = await loadVideosFor(exerciseId)
    await deleteVideo(first.id)

    const settings = await getSettings()
    expect(settings.hiddenVideoIds).toContain(first.id)
  })

  it('הכותרות נשארות מיושרות לסרטונים אחרי מחיקה', async () => {
    const clipsBefore = bundledVideosFor(exerciseId)
    const [first] = await loadVideosFor(exerciseId)
    await deleteVideo(first.id)

    const hidden = await loadHiddenVideoIds()
    const clips = bundledVideosFor(exerciseId, undefined, hidden)
    const labels = videoLabelsFor(exerciseId, undefined, hidden)

    expect(clips.length).toBe(clipsBefore.length - 1)
    expect(labels.length).toBe(clips.length)
    // ההדגמות ממוספרות מחדש — "הדגמה 2" בלי "הדגמה 1" נראה כמו תקלה
    expect(labels[0]).toBe('הדגמה 1')
  })

  /**
   * רגרסיה: מסך תרגיל המאגר הצמיד את הנושא ה-i מהקטלוג הסטטי לסרטון ה-i
   * מהרשימה *המסוננת*. אחרי מחיקה כל סרטון קיבל את הכותרת של קודמו, והאחרון
   * נעלם מהמסך. שתי הרשימות חייבות להיגזר מאותו מקור.
   */
  it('נושאי המאגר נשארים צמודים לסרטון הנכון אחרי מחיקה', async () => {
    const libId = LIBRARY_CATALOG.find((e) => e.videos.length > 2)!.id
    const all = bundledVideosFor(libId)
    const allLabels = videoLabelsFor(libId)

    const hidden = new Set([bundledId(all[0].src)])
    const clips = bundledVideosFor(libId, undefined, hidden)
    const labels = videoLabelsFor(libId, undefined, hidden)

    expect(clips.length).toBe(all.length - 1)
    expect(labels.length).toBe(clips.length)
    // כל סרטון שנשאר מחזיק בדיוק את הכותרת שהייתה לו לפני המחיקה
    for (let i = 0; i < clips.length; i++) {
      expect([clips[i].src, labels[i]]).toEqual([
        all[i + 1].src,
        allLabels[all.findIndex((c) => c.src === clips[i].src)],
      ])
    }
  })

  it('מוחק גם את ה-Blob המקומי כשהסרטון הותקן', async () => {
    const src = VIDEO_MANIFEST[exerciseId][0].src
    const id = bundledId(src)
    await mediaDb.videos.put({
      id,
      exerciseId,
      origin: 'bundled',
      blob: new Blob(['x']),
      thumbnailBlob: null,
      label: 'הדגמה 1',
      durationSec: 5,
      sizeBytes: 1,
      width: 100,
      height: 100,
      createdAt: Date.now(),
    })

    await deleteVideo(id)
    expect(await mediaDb.videos.get(id)).toBeUndefined()
  })

  it('תרגיל שכל הסרטונים שלו נמחקו לא מציג תמונה ממוזערת', async () => {
    for (const v of await loadVideosFor(exerciseId)) await deleteVideo(v.id)

    expect(await loadVideosFor(exerciseId)).toEqual([])
    expect(await loadThumbnailFor(exerciseId)).toBeNull()
  })

  it('שחזור מחזיר את הכל', async () => {
    const before = await loadVideosFor(exerciseId)
    for (const v of before) await deleteVideo(v.id)

    const restored = await restoreHiddenVideos()
    expect(restored).toBe(before.length)
    expect((await loadVideosFor(exerciseId)).length).toBe(before.length)
  })

  it('מחיקה כפולה של אותו סרטון לא מכפילה את הרשומה', async () => {
    const [first] = await loadVideosFor(exerciseId)
    await deleteVideo(first.id)
    await deleteVideo(first.id)

    expect((await getSettings()).hiddenVideoIds).toEqual([first.id])
  })
})
