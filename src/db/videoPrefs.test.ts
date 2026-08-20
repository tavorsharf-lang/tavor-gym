import { describe, expect, it } from 'vitest'
import { bundledId, bundledVideosFor, videoLabelsFor } from '@/db/mediaDb'
import { VIDEO_MANIFEST } from '@/db/videoManifest'
import { LIBRARY_MANIFEST } from '@/db/libraryManifest'
import { groupContextId } from '@/db/videoPrefs'
import type { VideoPrefs } from '@/db/videoPrefs'

/**
 * העדפות הסרטונים — סדר מותאם, העברות ומדפי קבוצות — כפי שהן מיושמות
 * ב-labelledClips. הבדיקות רצות מול המניפסטים האמיתיים אבל בוחרות מהם
 * דינמית, כדי לא להישבר בכל הרצה של import:videos.
 */

const prefs = (p: Partial<VideoPrefs>): VideoPrefs => ({ moves: {}, order: {}, ...p })

/** תרגיל אמיתי עם לפחות שתי הדגמות — הבסיס לרוב הבדיקות */
const [demoExercise, demoClips] = Object.entries(VIDEO_MANIFEST).find(
  ([, clips]) => clips.length >= 2
)!

/** תרגיל מאגר אמיתי עם לפחות שני סרטונים */
const [libExercise] = Object.entries(LIBRARY_MANIFEST).find(([, clips]) => clips.length >= 2)!

describe('סדר מותאם', () => {
  it('בלי העדפות — הסדר הוא סדר המניפסט', () => {
    const clips = bundledVideosFor(demoExercise)
    expect(clips.map((c) => c.src)).toEqual(demoClips.map((c) => c.src))
  })

  it('סדר שמור הופך את הרשימה, והמספור עוקב אחרי הסדר החדש', () => {
    const reversed = [...demoClips].reverse()
    const order = { [demoExercise]: reversed.map((c) => bundledId(c.src)) }

    const clips = bundledVideosFor(demoExercise, undefined, undefined, prefs({ order }))
    expect(clips.map((c) => c.src)).toEqual(reversed.map((c) => c.src))

    // "הדגמה 1" הוא מיקום, לא זהות: הסרטון שהוזז לראש מקבל את המספר 1
    const labels = videoLabelsFor(demoExercise, undefined, undefined, prefs({ order }))
    expect(labels[0]).toBe('הדגמה 1')
  })

  it('מזהה שלא ברשימת הסדר נכנס אחרי הממוינים, בסדר ברירת המחדל', () => {
    // רק האחרון מקבל דירוג — הוא עובר לראש, והשאר שומרים על סדרם המקורי
    const last = demoClips[demoClips.length - 1]
    const order = { [demoExercise]: [bundledId(last.src)] }
    const clips = bundledVideosFor(demoExercise, undefined, undefined, prefs({ order }))
    expect(clips[0].src).toBe(last.src)
    expect(clips.slice(1).map((c) => c.src)).toEqual(
      demoClips.filter((c) => c !== last).map((c) => c.src)
    )
  })

  it('מזהה מת ברשימת הסדר נסבל בשקט', () => {
    const order = { [demoExercise]: ['bundled:videos/לא-קיים.mp4'] }
    const clips = bundledVideosFor(demoExercise, undefined, undefined, prefs({ order }))
    expect(clips.length).toBe(demoClips.length)
  })
})

describe('העברת סרטון', () => {
  const movedId = bundledId(demoClips[0].src)

  it('סרטון שהועבר נעלם מהבית שלו ומופיע ביעד', () => {
    const p = prefs({ moves: { [movedId]: 'abs' } })

    const home = bundledVideosFor(demoExercise, undefined, undefined, p)
    expect(home.some((c) => bundledId(c.src) === movedId)).toBe(false)

    const target = bundledVideosFor('abs', undefined, undefined, p)
    expect(target.some((c) => bundledId(c.src) === movedId)).toBe(true)
  })

  it('סרטון מאגר שהועבר שומר את הנושא שלו; הדגמה מקבלת מספור ביעד', () => {
    const libClip = LIBRARY_MANIFEST[libExercise][0]
    const libTopicLabel = videoLabelsFor(libExercise)[0]
    const p = prefs({
      moves: {
        [bundledId(libClip.src)]: demoExercise,
        [movedId]: 'abs',
      },
    })

    const labels = videoLabelsFor(demoExercise, undefined, undefined, p)
    const clips = bundledVideosFor(demoExercise, undefined, undefined, p)
    const at = clips.findIndex((c) => c.src === libClip.src)
    expect(at).toBeGreaterThanOrEqual(0)
    expect(labels[at]).toBe(libTopicLabel)

    const absLabels = videoLabelsFor('abs', undefined, undefined, p)
    const absClips = bundledVideosFor('abs', undefined, undefined, p)
    const demoAt = absClips.findIndex((c) => bundledId(c.src) === movedId)
    expect(absLabels[demoAt]).toMatch(/^הדגמה \d+$/)
  })

  it('מזהה מת בהעברות נסבל בשקט', () => {
    const p = prefs({ moves: { 'bundled:videos/נמחק.mp4': demoExercise } })
    const clips = bundledVideosFor(demoExercise, undefined, undefined, p)
    expect(clips.length).toBe(demoClips.length)
  })
})

describe('מדף קבוצת שריר', () => {
  it('מדף מתחיל ריק, ומתמלא רק מהעברות', () => {
    expect(bundledVideosFor(groupContextId('chest'))).toEqual([])

    const movedId = bundledId(demoClips[0].src)
    const p = prefs({ moves: { [movedId]: groupContextId('chest') } })
    const shelf = bundledVideosFor(groupContextId('chest'), undefined, undefined, p)
    expect(shelf.map((c) => bundledId(c.src))).toEqual([movedId])

    // ומהבית הוא נעלם
    const home = bundledVideosFor(demoExercise, undefined, undefined, p)
    expect(home.some((c) => bundledId(c.src) === movedId)).toBe(false)
  })

  it('סרטון מוסתר לא מופיע גם במדף — מחיקה גוברת על העברה', () => {
    const movedId = bundledId(demoClips[0].src)
    const p = prefs({ moves: { [movedId]: groupContextId('legs') } })
    const shelf = bundledVideosFor(groupContextId('legs'), undefined, new Set([movedId]), p)
    expect(shelf).toEqual([])
  })
})
