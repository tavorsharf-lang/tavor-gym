import type { AppSettings, Exercise, MuscleGroup } from './types'

/**
 * איחוד "שוק" לתוך "רגליים" — ההמרה של מיגרציה 9, במקום אחד.
 *
 * מודול נפרד ולא פונקציות בתוך המיגרציה, מאותה סיבה כמו `libraryLinks` ו-
 * `muscleTags`: מיגרציה רצה פעם אחת ורק על מסד שעולה מגרסה 8, אבל אותה המרה
 * נחוצה שוב בכל ייבוא גיבוי — קובץ שנוצר לפני האיחוד מחזיר את המחרוזת הישנה
 * לתוך מסד שכבר בגרסה 9, ושם אין מיגרציה שתתפוס אותה.
 *
 * שתי הפונקציות מחזירות את אותו אובייקט כשאין מה לשנות, כדי שהקורא ידלג על
 * הכתיבה.
 */

/** הקבוצה שאוחדה, והמדפים שנושאים את שמה */
const LEGACY_CALVES = 'calves'
const CALF_SHELF = `group:${LEGACY_CALVES}`
const LEG_SHELF = 'group:legs'

export function withoutCalves(exercise: Exercise): Exercise {
  const muscleGroup: MuscleGroup =
    (exercise.muscleGroup as string) === LEGACY_CALVES ? 'legs' : exercise.muscleGroup
  const secondary = exercise.secondaryMuscles
  // גם `legs` יורד מהמשניים כשהוא הפך להיות הראשי — אחרת אותו סט נספר פעמיים
  const cleaned = secondary?.filter((m) => (m as string) !== LEGACY_CALVES && m !== muscleGroup)
  const secondaryChanged = cleaned !== undefined && cleaned.length !== secondary?.length
  if (muscleGroup === exercise.muscleGroup && !secondaryChanged) return exercise
  return {
    ...exercise,
    muscleGroup,
    ...(cleaned === undefined ? {} : { secondaryMuscles: cleaned }),
  }
}

export function mergeCalfShelves(settings: AppSettings): AppSettings {
  const moves = settings.videoMoves ?? {}
  const order = settings.videoOrder ?? {}
  const movedToCalves = Object.values(moves).includes(CALF_SHELF)
  if (!movedToCalves && !(CALF_SHELF in order)) return settings

  const nextMoves = Object.fromEntries(
    Object.entries(moves).map(([assetId, target]) => [
      assetId,
      target === CALF_SHELF ? LEG_SHELF : target,
    ])
  )
  const { [CALF_SHELF]: calfOrder, ...restOrder } = order
  const nextOrder = calfOrder
    ? { ...restOrder, [LEG_SHELF]: [...new Set([...(order[LEG_SHELF] ?? []), ...calfOrder])] }
    : restOrder
  return { ...settings, videoMoves: nextMoves, videoOrder: nextOrder }
}
