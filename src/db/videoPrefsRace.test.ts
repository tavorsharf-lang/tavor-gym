import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady, getSettings } from '@/db/db'
import { hideVideo, invalidateHiddenVideos, loadHiddenVideoIds } from '@/db/hiddenVideos'
import {
  invalidateVideoPrefs,
  loadVideoPrefs,
  saveVideoMove,
  saveVideoOrder,
} from '@/db/videoPrefs'

/**
 * כתיבות מקבילות להגדרות.
 *
 * כל השדות האלה חיים באותה שורה אחת (`settings.app`), והכתיבה אליה היא
 * קרא-שנה-כתוב. פאנל ניהול הסרטונים הוא בדיוק מקום שבו לוחצים כמה פעמים
 * ברצף מהיר — מחיקה, חץ, חץ, העברה — ולכן שתי פעולות שיוצאות לדרך לפני
 * שהראשונה נכתבה חייבות שתיהן לשרוד. בלי תור, השנייה דרסה את הראשונה.
 *
 * הבדיקות כאן לא ממתינות בין הפעולות בכוונה: זה כל התרחיש.
 */
describe('כתיבות מקבילות להעדפות הסרטונים', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureReady()
    invalidateHiddenVideos()
    invalidateVideoPrefs()
  })

  it('שתי העברות בו-זמנית — שתיהן נשמרות', async () => {
    await Promise.all([
      saveVideoMove('bundled:videos/a.mp4', 'chest-press'),
      saveVideoMove('bundled:videos/b.mp4', 'group:legs'),
    ])

    const stored = await getSettings()
    expect(stored.videoMoves).toEqual({
      'bundled:videos/a.mp4': 'chest-press',
      'bundled:videos/b.mp4': 'group:legs',
    })
  })

  it('שתי שמירות סדר בו-זמנית — שתיהן נשמרות', async () => {
    await Promise.all([
      saveVideoOrder('ex-1', ['a', 'b']),
      saveVideoOrder('ex-2', ['c', 'd']),
    ])

    const stored = await getSettings()
    expect(stored.videoOrder).toEqual({ 'ex-1': ['a', 'b'], 'ex-2': ['c', 'd'] })
  })

  it('שלוש מחיקות בו-זמנית — אף אחת לא נעלמת', async () => {
    const ids = ['bundled:videos/x.mp4', 'bundled:videos/y.mp4', 'bundled:videos/z.mp4']
    await Promise.all(ids.map((id) => hideVideo(id, async () => {})))

    const stored = await getSettings()
    expect([...(stored.hiddenVideoIds ?? [])].sort()).toEqual([...ids].sort())
  })

  it('מחיקה והעברה בו-זמנית — שני השדות שורדים', async () => {
    // שני שדות שונים באותה שורה: בלי תור, הכתיבה המאוחרת החזירה את השדה
    // השני לערך שקראה לפני שהראשונה נכתבה
    await Promise.all([
      hideVideo('bundled:videos/gone.mp4', async () => {}),
      saveVideoMove('bundled:videos/moved.mp4', 'abs'),
    ])

    const stored = await getSettings()
    expect(stored.hiddenVideoIds).toEqual(['bundled:videos/gone.mp4'])
    expect(stored.videoMoves).toEqual({ 'bundled:videos/moved.mp4': 'abs' })
  })

  it('המטמון בזיכרון מסכים עם מה שנכתב למסד', async () => {
    // הפרסום נגזר מתוצאת הכתיבה ולא מהקריאה שקדמה לה — אחרת שדה שנכתב
    // בפעולה המקבילה היה חוזר במטמון לערכו הישן
    await Promise.all([
      saveVideoMove('bundled:videos/one.mp4', 'abs'),
      saveVideoOrder('abs', ['bundled:videos/one.mp4']),
    ])

    const cached = await loadVideoPrefs()
    const stored = await getSettings()
    expect(cached.moves).toEqual(stored.videoMoves)
    expect(cached.order).toEqual(stored.videoOrder)
  })

  it('הסתרה כפולה של אותו מזהה לא מכפילה אותו ברשימה', async () => {
    const id = 'bundled:videos/same.mp4'
    await Promise.all([hideVideo(id, async () => {}), hideVideo(id, async () => {})])

    expect([...(await loadHiddenVideoIds())]).toEqual([id])
    expect((await getSettings()).hiddenVideoIds).toEqual([id])
  })
})
