import type { MuscleGroup } from './types'
import type { MuscleCardImage } from './muscleImageManifest'
import { MUSCLE_CARD_MANIFEST } from './muscleImageManifest'

/**
 * איזה כרטיס אנטומי שייך לאיזו תת-קטגוריה.
 *
 * כתוב ביד מאותה סיבה כמו `EXERCISE_IMAGES` ו-`LIBRARY_LINKS`, וכאן זה אפילו
 * חד יותר: **"ראש ארוך" הוא שם של שני כרטיסים שונים** — 17 של הדו-ראשי ו-20
 * של התלת-ראשי. התאמה אוטומטית לפי השם העברי הייתה מצמידה לשניהם את אותה
 * תמונה בלי להגיד מילה, ומראה לתבור זרוע אחורית במסך של היד הקדמית.
 *
 * המפתח הוא התווית מ-`MUSCLE_TAXONOMY` בדיוק כפי שהיא, כולל הקו המפריד
 * הארוך. בדיקה נועלת את שני הכיוונים: שכל 37 התוויות מוצאות כרטיס, ושאין
 * כרטיס במניפסט שאף אחד לא מצביע עליו.
 */
const CARD_BY_SUB: Readonly<Record<string, string>> = {
  // ─── חזה ───
  'חזה עליון': 'upper_chest',
  'חזה אמצעי': 'middle_chest',
  'חזה תחתון': 'lower_chest',
  סראטוס: 'serratus_anterior',
  // ─── גב ───
  'רחב גבי': 'latissimus_dorsi',
  'עגול גדול': 'teres_major',
  מעוינים: 'rhomboids',
  'טרפז אמצעי-תחתון': 'middle_and_lower_trapezius',
  'זוקפי הגב': 'erector_spinae',
  // ─── כתפיים ───
  'כתף קדמית': 'anterior_deltoid',
  'כתף אמצעית': 'lateral_deltoid',
  'כתף אחורית': 'posterior_deltoid',
  'טרפז עליון': 'upper_trapezius',
  'חוגרת המסובבים': 'rotator_cuff',
  // ─── יד קדמית ───
  'דו-ראשי': 'biceps_brachii',
  'דו-ראשי — ראש קצר': 'short_head',
  'דו-ראשי — ראש ארוך': 'long_head',
  ברכיאליס: 'brachialis',
  // ─── יד אחורית ───
  'תלת-ראשי': 'triceps_brachii',
  'תלת-ראשי — ראש ארוך': 'triceps_long_head',
  'תלת-ראשי — ראש חיצוני': 'lateral_head',
  'תלת-ראשי — ראש פנימי': 'medial_head',
  // ─── רגליים ───
  'ארבע-ראשי': 'quadriceps',
  'עכוז גדול': 'gluteus_maximus',
  'עכוז אמצעי': 'gluteus_medius',
  המסטרינגס: 'hamstrings',
  מקרבים: 'adductors',
  'כופפי הירך': 'hip_flexors',
  תאומים: 'gastrocnemius',
  סוליאוס: 'soleus',
  פרונאוס: 'peroneals',
  // ─── בטן ───
  'ישר בטני': 'rectus_abdominis',
  אלכסונים: 'obliques',
  'בטן עמוקה': 'transverse_abdominis',
  // ─── אמות ───
  'כופפי אמה': 'forearm_flexors',
  'פושטי אמה': 'forearm_extensors',
  ברכיורדיאליס: 'brachioradialis',
}

/**
 * כרטיס הסקירה של קבוצה — כל תת-השרירים שלה בתמונה אחת, כל אחד בצבע לפי
 * גודלו. זה מה שעונה על "מה בכלל יש בחזה", להבדיל מ"איפה יושב החזה העליון".
 */
const CARD_BY_GROUP: Readonly<Record<MuscleGroup, string>> = {
  chest: 'chest_overview',
  back: 'back_overview',
  shoulders: 'shoulders_overview',
  biceps: 'biceps_overview',
  triceps: 'triceps_overview',
  legs: 'legs_overview',
  abs: 'abs_overview',
  forearms: 'forearms_overview',
}

/**
 * הכרטיס של תת-קטגוריה, או null.
 *
 * null אינו תקלה: "אחר" היא הדלי של תרגיל בלי כרטיס שרירים, ואין לה אנטומיה
 * להראות. הקוראים מציגים את הכותרת בלי ריבוע ולא נופלים.
 */
export function muscleCardFor(sub: string): MuscleCardImage | null {
  const id = CARD_BY_SUB[sub]
  return id ? (MUSCLE_CARD_MANIFEST[id] ?? null) : null
}

/** כרטיס הסקירה של קבוצת שריר. כל שמונה הקבוצות מכוסות. */
export function groupCardFor(group: MuscleGroup): MuscleCardImage | null {
  return MUSCLE_CARD_MANIFEST[CARD_BY_GROUP[group]] ?? null
}

/** לבדיקות בלבד — שני הכיוונים של המיפוי */
export const MUSCLE_CARD_MAPS = { CARD_BY_SUB, CARD_BY_GROUP } as const
