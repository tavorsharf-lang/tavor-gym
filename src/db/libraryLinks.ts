import { LIBRARY_CATALOG } from './libraryManifest'
import type { LibraryExercise } from './libraryManifest'

/**
 * הקישור ההתחלתי בין תרגיל בקטלוג לתרגיל המקביל במאגר הלימודי.
 *
 * הרשימה כתובה ביד בכוונה. התאמה אוטומטית לפי שם נראית מפתה — היא גם עובדת
 * ברוב המקרים — אבל היא שוגה בדיוק במקומות שכואבים: `seated-row-heavy` ו-
 * `seated-row-light` הם שני תרגילים שונים על מכונות שונות, ושניהם היו נקשרים
 * לאותה "חתירה" במאגר. עדיף שלא יהיה קישור מאשר קישור שמוביל לתרגיל אחר.
 *
 * מה שלא מופיע כאן פשוט לא מקבל קישור. זה תקין ומכוון.
 *
 * מגרסה 4 של המסד זו זריעה בלבד ולא מקור האמת: הקישור חי ב-`Exercise.libraryId`,
 * ומשם והלאה הוא נוצר מהוספת תרגיל מהמאגר לקטלוג ולא מעריכת הקובץ הזה.
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
  // שני אלה נוספו אחרי בדיקה חוזרת מול המאגר, כשהתברר שהם היו חסרים ולא נדחו:
  'low-row-rack': 'lib-seated_cable_row',
  'overhead-tricep-ext': 'lib-overhead_triceps_extension',
}

/**
 * תרגילים בתוכנית שאין להם מקבילה במאגר, והסיבה.
 *
 * לא נדרש לקוד — קיים כדי שמי שיתהה למה אין קישור לא יחשוב שזה באג, וכדי
 * שיהיה ברור מה ייפתר אם יתווסף יוצר תוכן נוסף.
 */
export const UNLINKED_NOTES: Readonly<Record<string, string>> = {
  'calf-raise': 'אין במאגר קבוצת שוק בכלל — האזכור היחיד הוא לחיצת שוק על מזחלת ה-leg press',
  'hammer-curl': 'אין כפיפת פטיש במאגר; כל 27 סרטוני הכפיפה שם באחיזת סופינציה, וזו אחיזה אחרת',
  'forearm-straight-bar':
    'רשומת האמות היחידה במאגר היא פשיטת שורש כף יד — התנועה ההפוכה לכפיפה',
  'forearm-dumbbell':
    'רשומת האמות היחידה במאגר היא פשיטת שורש כף יד — התנועה ההפוכה לכפיפה',
  'seated-row-heavy':
    'אין במאגר תוכן על חתירה במכונה טעונת-פלטות. lib-machine_row מחזיק סרטון אחד, והוא על טריק לחתירת ארצ׳ר בכבל',
  'seated-row-light':
    'אין במאגר תוכן על חתירה במכונה טעונת-פלטות, ובנוסף קישור של שתי החתירות לאותה רשומה הוא בדיוק הכשל שהקובץ הזה מזהיר ממנו',
  'machine-squat': 'במאגר יש סקוואט במוט, בסמית׳, פרונט וגובלט — אין hack/מכונה',
  'decline-pec-fly': 'כל 12 רשומות החזה במאגר הן שטוח או שיפוע חיובי; אין שיפוע שלילי',
  'bench-machine-press':
    'lib-machine_chest_press היא הרשומה היחידה שיכלה להתאים, ושתי מכונות הלחיצה בקטלוג חולקות את אותו שם עברי — קישור היה מוביל אחת מהן למכונה הלא נכונה',
  'decline-machine-press': 'אותה סיבה כמו bench-machine-press — שם עברי זהה לשתי מכונות שונות',
  'db-bench-press':
    'הרשומה בקטלוג מכסה שיפוע חיובי *ושטוח* יחד, והמאגר מפריד ביניהן לשתי רשומות. הרשומה השטוחה אף מלמדת להוריד את המוט לחזה האמצעי — הפוך ממה שנכון בשיפוע',
  dips: 'במאגר יש מקבילים במשקל גוף על מוטות, לא מכונת מקבילים עם פלטות',
  'behind-body-cable-curl': 'אין במאגר תוכן על מרפקים מאחורי קו הגוף',
  'cross-cable-tricep': 'אין במאגר אף סרטון על פשיטת מרפק חוצת גוף',
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

/**
 * שותל את הקישור ההתחלתי על רשומת תרגיל, אם היא עוד לא נושאת אחד.
 *
 * אותה פונקציה משמשת גם בזריעה, גם במיגרציה לגרסה 4 וגם בייבוא גיבוי ישן —
 * שלושת המסלולים שבהם רשומה יכולה להגיע למסד בלי `libraryId`. קישור שכבר קיים
 * לא נדרס: הוא יכול להיות תוצאה של הוספת תרגיל מהמאגר, וזה גובר על הזריעה.
 */
export function withLibraryLink<T extends { id: string; libraryId?: string }>(exercise: T): T {
  if (exercise.libraryId !== undefined) return exercise
  const libId = LIBRARY_LINKS[exercise.id]
  return libId ? { ...exercise, libraryId: libId } : exercise
}
