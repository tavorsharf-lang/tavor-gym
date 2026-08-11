/** @vitest-environment node */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { bundledVideosFor, videoLabelsFor } from './mediaDb'
import { LIBRARY_LINKS } from './libraryLinks'
import { VIDEO_MANIFEST } from './videoManifest'
import { LIBRARY_MANIFEST } from './libraryManifest'

/**
 * "אין שם את כל התרגילים מהמאגר" — הבאג שהמשתמש דיווח עליו.
 *
 * `bundledVideosFor` יודע למזג הדגמות תוכנית עם סרטוני המאגר, אבל רק כשמקבל
 * `libraryId`. מסך התרגיל העביר אותו; שלושת אתרי הקריאה שבתוך האימון — כרטיס
 * התרגיל, הנגן במסך האימון וגיליון ההחלפה — לא. התוצאה: בדיוק ברגע שבו צריך
 * ללמוד איך מבצעים את התנועה, הופיעו רק ההדגמות.
 *
 * הבדיקות כאן נועלות את שני הצדדים: שהמיזוג עצמו עובד, ושאף אתר קריאה לא
 * שוכח שוב את ה-prop.
 */

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('מיזוג הדגמות התוכנית עם המאגר', () => {
  it('תרגיל מקושר מחזיר גם הדגמות וגם סרטוני מאגר', () => {
    // נבחר תרגיל מקושר שבאמת יש לו משני המקורות
    const pair = Object.entries(LIBRARY_LINKS).find(
      ([exerciseId, libId]) =>
        (VIDEO_MANIFEST[exerciseId]?.length ?? 0) > 0 &&
        (LIBRARY_MANIFEST[libId]?.length ?? 0) > 0
    )
    expect(pair, 'אין אף תרגיל מקושר עם שני המקורות — השתנתה הזריעה?').toBeTruthy()
    const [exerciseId, libId] = pair as [string, string]

    const demosOnly = bundledVideosFor(exerciseId)
    const merged = bundledVideosFor(exerciseId, libId)

    expect(demosOnly.length).toBe(VIDEO_MANIFEST[exerciseId].length)
    expect(merged.length).toBe(
      VIDEO_MANIFEST[exerciseId].length + LIBRARY_MANIFEST[libId].length
    )
    // וזה בדיוק ההפרש שהמשתמש לא ראה באמצע אימון
    expect(merged.length).toBeGreaterThan(demosOnly.length)
  })

  it('ההדגמות קודמות, ולכל סרטון מאגר יש נושא ולא מספר', () => {
    const [exerciseId, libId] = Object.entries(LIBRARY_LINKS).find(
      ([id, lib]) =>
        (VIDEO_MANIFEST[id]?.length ?? 0) > 0 && (LIBRARY_MANIFEST[lib]?.length ?? 0) > 0
    ) as [string, string]

    const labels = videoLabelsFor(exerciseId, libId)
    const demoCount = VIDEO_MANIFEST[exerciseId].length

    expect(labels.slice(0, demoCount).every((l) => l.startsWith('הדגמה'))).toBe(true)
    expect(labels.slice(demoCount).every((l) => l.length > 0)).toBe(true)
  })
})

describe('אתרי הקריאה של הנגן והתמונה', () => {
  /**
   * שני מסכי המאגר מעבירים מזהה מאגר כ-`exerciseId`, ו-`labelledClips` מזהה
   * אותו לבד. שם `libraryId` נפרד הוא מיותר ולא חסר.
   */
  const LIBRARY_SCREENS = ['screens/LibraryScreen.tsx', 'screens/LibraryExerciseScreen.tsx']

  const CALL_SITES = [
    'screens/WorkoutScreen.tsx',
    'screens/ExerciseScreen.tsx',
    'screens/ExerciseLibraryScreen.tsx',
    'components/workout/ExerciseCard.tsx',
    'components/workout/SubstituteSheet.tsx',
    ...LIBRARY_SCREENS,
  ]

  it('כל שימוש ב-VideoThumb/VideoPlayer מחוץ למסכי המאגר מעביר libraryId', () => {
    const missing: string[] = []

    for (const rel of CALL_SITES) {
      if (LIBRARY_SCREENS.includes(rel)) continue
      const text = readFileSync(join(SRC, rel), 'utf8')
      // כל אלמנט VideoThumb/VideoPlayer, מהתגית ועד סגירתה
      for (const m of text.matchAll(/<Video(?:Thumb|Player)\b([\s\S]*?)\/?>/g)) {
        const props = m[1]
        if (!props.includes('exerciseId=')) continue
        if (props.includes('libraryId=')) continue
        const line = text.slice(0, m.index).split('\n').length
        missing.push(`${rel}:${line}`)
      }
    }

    expect(missing).toEqual([])
  })
})
