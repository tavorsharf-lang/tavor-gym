import { LIBRARY_CATALOG } from './libraryManifest'
import type { LibraryExercise } from './libraryManifest'

/**
 * קישור בין תרגיל בתוכנית לתרגיל המקביל במאגר הלימודי.
 *
 * הרשימה כתובה ביד בכוונה. התאמה אוטומטית לפי שם נראית מפתה — היא גם עובדת
 * ברוב המקרים — אבל היא שוגה בדיוק במקומות שכואבים: `seated-row-heavy` ו-
 * `seated-row-light` הם שני תרגילים שונים על מכונות שונות, ושניהם היו נקשרים
 * לאותה "חתירה" במאגר. עדיף שלא יהיה קישור מאשר קישור שמוביל לתרגיל אחר.
 *
 * מה שלא מופיע כאן פשוט לא מקבל קישור. זה תקין ומכוון.
 */
export const LIBRARY_LINKS: Readonly<Record<string, string>> = {
  pushup: 'lib-push_up',
  'cable-tricep-pushdown': 'lib-triceps_pushdown',
  'machine-shoulder-press': 'lib-machine_shoulder_press',
  'lateral-raise': 'lib-lateral_raise',
  'lat-pulldown': 'lib-lat_pulldown',
  'preacher-curl': 'lib-preacher_curl',
  shrugs: 'lib-shrug',
  'reverse-machine-fly': 'lib-rear_delt_fly',
  'leg-press': 'lib-leg_press',
  'leg-curl': 'lib-leg_curl',
  'leg-extension': 'lib-leg_extension',
  abs: 'lib-plank',
}

/**
 * תרגילים בתוכנית שאין להם מקבילה במאגר, והסיבה.
 *
 * לא נדרש לקוד — קיים כדי שמי שיתהה למה אין קישור לא יחשוב שזה באג, וכדי
 * שיהיה ברור מה ייפתר אם יתווסף יוצר תוכן נוסף.
 */
export const UNLINKED_NOTES: Readonly<Record<string, string>> = {
  'calf-raise': 'אין תרגילי שוק במאגר — יוצר התוכן לא מכסה אותם',
  'hammer-curl': 'אין כפיפת פטיש במאגר — יד קדמית מכוסה שם רק בארבעה תרגילים',
  'forearm-straight-bar': 'אמות מכוסות במאגר בשני תרגילים בלבד',
  'forearm-dumbbell': 'אמות מכוסות במאגר בשני תרגילים בלבד',
  'seated-row-heavy': 'יש חתירות במאגר, אבל לא זיהוי ודאי של אותה מכונה',
  'seated-row-light': 'יש חתירות במאגר, אבל לא זיהוי ודאי של אותה מכונה',
  'low-row-rack': 'יש חתירות במאגר, אבל לא זיהוי ודאי של אותה מכונה',
  'machine-squat': 'במאגר יש סקוואט במוט ובסמית׳, לא סקוואט במכונה',
  'decline-pec-fly': 'אין במאגר גרסת שיפוע שלילי',
  'bench-machine-press': 'אין במאגר את המכונה הזאת',
  'behind-body-cable-curl': 'אין במאגר את הווריאציה הזאת',
  'cross-cable-tricep': 'אין במאגר את הווריאציה הזאת',
}

const BY_ID = new Map(LIBRARY_CATALOG.map((e) => [e.id, e]))

/** התרגיל במאגר שמקביל לתרגיל בתוכנית, אם יש */
export function libraryFor(exerciseId: string): LibraryExercise | null {
  const libId = LIBRARY_LINKS[exerciseId]
  return libId ? (BY_ID.get(libId) ?? null) : null
}

/** תרגיל מהמאגר לפי מזהה */
export function libraryExercise(id: string): LibraryExercise | null {
  return BY_ID.get(id) ?? null
}
