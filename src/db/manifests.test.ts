// @vitest-environment node
// eslint-disable-next-line
/// <reference types="node" />
// ה-reference הוא מקומי בכוונה: tsconfig.app.json לא כולל טיפוסי node, וזה
// שומר על ההבטחה שקוד האפליקציה עצמו לא נוגע ב-API של השרת. הבדיקה הזו כן —
// היא בודקת שקבצים קיימים על הדיסק, וזה בדיוק מה שאי אפשר לעשות בדפדפן.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { VIDEO_MANIFEST } from '@/db/videoManifest'
import { LIBRARY_CATALOG, LIBRARY_MANIFEST } from '@/db/libraryManifest'
import { LIBRARY_LINKS, UNLINKED_NOTES } from '@/db/libraryLinks'
import { SEED_EXERCISES } from '@/db/seed'
import { VIDEO_MISMATCH } from '@/db/videoIssues'

/**
 * המניפסטים נוצרים על ידי scripts/import-videos.mjs, והקבצים עצמם יושבים
 * ב-public/videos ומקובעים ב-git. שלושה מקורות שאמורים להיות מיושרים תמיד —
 * ודריפט ביניהם כבר קרה בפועל (הקומיט "תיקון שמות הקטלוג מול הסרטונים").
 *
 * הכשל שהבדיקות האלה קיימות בשבילו הוא שקט: מזהה שמשתנה בהרצה חוזרת של
 * הסקריפט הופך ערך ב-LIBRARY_LINKS למצביע מת, `withLibraryLink` שותל קישור
 * שלא קיים, וחומר הלימוד פשוט נעלם מהמסך בלי שום שגיאה.
 */

const PUBLIC = join(process.cwd(), 'public')

function missingFiles(manifest: Record<string, { src: string; poster: string }[]>): string[] {
  const missing: string[] = []
  for (const clips of Object.values(manifest)) {
    for (const clip of clips) {
      if (!existsSync(join(PUBLIC, clip.src))) missing.push(clip.src)
      if (!existsSync(join(PUBLIC, clip.poster))) missing.push(clip.poster)
    }
  }
  return missing
}

describe('מניפסט ההדגמות מול הדיסק', () => {
  it('כל סרטון וכל תמונה ממוזערת קיימים ב-public', () => {
    expect(missingFiles(VIDEO_MANIFEST)).toEqual([])
  })

  it('כל מזהה במניפסט הוא תרגיל אמיתי בקטלוג', () => {
    const ids = new Set(SEED_EXERCISES.map((e) => e.id))
    const orphans = Object.keys(VIDEO_MANIFEST).filter((id) => !ids.has(id))
    expect(orphans).toEqual([])
  })
})

describe('מניפסט המאגר מול הדיסק ומול הקטלוג שלו', () => {
  it('כל סרטון וכל תמונה ממוזערת קיימים ב-public', () => {
    expect(missingFiles(LIBRARY_MANIFEST)).toEqual([])
  })

  /** התיעוד מבטיח ש-`videos` מקביל אחד-לאחד ל-LIBRARY_MANIFEST[id] */
  it('מספר הנושאים שווה למספר הסרטונים בכל תרגיל', () => {
    const mismatched = LIBRARY_CATALOG.filter(
      (e) => e.videos.length !== (LIBRARY_MANIFEST[e.id]?.length ?? 0)
    ).map((e) => e.id)
    expect(mismatched).toEqual([])
  })

  it('לכל תרגיל בקטלוג המאגר יש סרטונים במניפסט, ולהפך', () => {
    const catalogIds = new Set(LIBRARY_CATALOG.map((e) => e.id))
    const manifestIds = new Set(Object.keys(LIBRARY_MANIFEST))
    expect([...catalogIds].filter((id) => !manifestIds.has(id))).toEqual([])
    expect([...manifestIds].filter((id) => !catalogIds.has(id))).toEqual([])
  })

  it('כל המזהים בתחילית lib- כדי שלא יתנגשו בתרגילי התוכנית', () => {
    expect(LIBRARY_CATALOG.every((e) => e.id.startsWith('lib-'))).toBe(true)
  })

  it('totalAvailable לא קטן ממספר הסרטונים שנכללו', () => {
    const broken = LIBRARY_CATALOG.filter((e) => e.totalAvailable < e.videos.length).map((e) => e.id)
    expect(broken).toEqual([])
  })
})

describe('הקישורים בין שני הקטלוגים', () => {
  it('כל צד של קישור מצביע על משהו שקיים', () => {
    const exerciseIds = new Set(SEED_EXERCISES.map((e) => e.id))
    const libIds = new Set(LIBRARY_CATALOG.map((e) => e.id))
    for (const [exerciseId, libId] of Object.entries(LIBRARY_LINKS)) {
      expect([exerciseId, exerciseIds.has(exerciseId)]).toEqual([exerciseId, true])
      expect([libId, libIds.has(libId)]).toEqual([libId, true])
    }
  })

  it('אין שני תרגילים שמקושרים לאותו תרגיל מאגר', () => {
    const targets = Object.values(LIBRARY_LINKS)
    expect(new Set(targets).size).toBe(targets.length)
  })

  /** ההערות קיימות כדי שמי שמחפש קישור חסר יידע שזו החלטה ולא באג */
  it('כל הערה על היעדר קישור מצביעה על תרגיל שקיים', () => {
    const ids = new Set(SEED_EXERCISES.map((e) => e.id))
    const orphans = Object.keys(UNLINKED_NOTES).filter((id) => !ids.has(id))
    expect(orphans).toEqual([])
  })

  it('אין מזהה שמופיע גם כמקושר וגם כמתועד-כלא-מקושר', () => {
    const both = Object.keys(UNLINKED_NOTES).filter((id) => id in LIBRARY_LINKS)
    expect(both).toEqual([])
  })
})

describe('אזהרות הסרטונים', () => {
  it('כל אזהרה מצביעה על תרגיל שקיים', () => {
    const ids = new Set(SEED_EXERCISES.map((e) => e.id))
    const orphans = Object.keys(VIDEO_MISMATCH).filter((id) => !ids.has(id))
    expect(orphans).toEqual([])
  })
})
