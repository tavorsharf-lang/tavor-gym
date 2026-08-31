import { imageIdOf } from './exerciseImages'
import type { ExerciseImage } from './imageManifest'
import { MUSCLE_BREAKDOWN } from './muscleBreakdown'
import { muscleCardFor } from './muscleCards'
import type { MuscleCardImage } from './muscleImageManifest'
import { MUSCLE_TAXONOMY } from './subTargets'
import type { MuscleGroup } from './types'

/**
 * מפת העומס — האחוזים שעל הכרטיס, כשורות שאפשר לקרוא.
 *
 * הכרטיס עצמו כבר אומר את זה, וזו בדיוק הבעיה: הוא אומר את זה בטקסט קטן
 * שמודפס על איור, בשלוש-ארבע נקודות פזורות סביב הגוף. כדי לדעת מה עובד הכי
 * הרבה צריך לסרוק את התמונה בעיניים ולהשוות מספרים שלא יושבים זה מעל זה.
 * השורות כאן הן אותם מספרים בדיוק, ממוינים, עם הפס שמראה את היחס.
 *
 * **שום מספר לא מחושב כאן.** `MUSCLE_BREAKDOWN` הוא תמלול של מה שמודפס, וזה
 * כל המקור. מה שכן נגזר הוא שני דברים:
 *
 *   • **השם.** הכרטיסים משתמשים ב-116 תוויות עבריות שונות לאותם שרירים
 *     ("לטיסימוס דורסי" מול "רחב גבי"), והטקסונומיה כבר מכריעה אחת לכל שריר.
 *     השם שמוצג הוא ההכרעה הזו, כדי שהשורה תקרא כמו כותרת תת-הקטגוריה
 *     ברשימה ולא כמו שריר אחר. מה שמודפס על הכרטיס נשמר ב-`printed` כשהוא
 *     שונה, כי הכרטיס נמצא מעל השורה והתמונה והטקסט לא אמורים לסתור.
 *   • **הכרטיס האנטומי.** אותה טקסונומיה מובילה מהשם האנגלי אל אחד מ-45
 *     הכרטיסים, וזו התשובה ל"איפה השריר הזה בכלל יושב" — השאלה שעולה מיד
 *     אחרי "רומבואידים 25%".
 *
 * ‏`card: null` הוא מצב לגיטימי ולא חוסר: "מייצבים" מופיע על כרטיסים כשארית
 * ואין לו אנטומיה להראות. השורה מוצגת עם האחוז שלה ובלי תמונה.
 */

export interface LoadShare {
  /** השם שהאפליקציה משתמשת בו לשריר הזה, מהטקסונומיה */
  name: string
  /** השם האנגלי כפי שמודפס על הכרטיס — הוא גם המפתח לטקסונומיה */
  en: string
  /** מה שמודפס בעברית על הכרטיס, רק כשהוא שונה מ-`name` */
  printed: string | null
  /** האחוז המודפס. לא מנורמל ולא מעוגל. */
  pct: number
  group: MuscleGroup | null
  card: MuscleCardImage | null
}

/** האחוזים של כרטיס אחד, מהגדול לקטן */
export function loadMapFor(imageId: string): readonly LoadShare[] {
  const shares = MUSCLE_BREAKDOWN[imageId]
  if (!shares) return []
  /*
    מיון יורד, ו-`sort` יציב — שרירים שחולקים אחוז נשארים בסדר שבו הם
    מתומללים מהכרטיס. רוב הכרטיסים כבר כתובים מהגדול לקטן, והמיון הוא מה
    שמבטיח שגם החריגים ייקראו כמו כולם.
  */
  return [...shares]
    .sort((a, b) => b.pct - a.pct)
    .map((share) => {
      const taxon = MUSCLE_TAXONOMY[share.en] ?? null
      const name = taxon?.sub ?? share.he
      return {
        name,
        en: share.en,
        printed: share.he === name ? null : share.he,
        pct: share.pct,
        group: taxon?.group ?? null,
        card: taxon ? muscleCardFor(taxon.sub) : null,
      }
    })
}

/**
 * הכרטיסים שהמפה נפתחת עליהם — **בינתיים אחד**.
 *
 * הנתונים קיימים ל-89 הכרטיסים, והמנגנון לא יודע להבחין ביניהם: ברגע
 * שהשורה הזו נמחקת המפה נפתחת לכולם. היא כאן כדי שתבור יאשר את הצורה על
 * כרטיס אחד לפני שהיא מופיעה בכל גלריה באפליקציה.
 */
const PREVIEW: ReadonlySet<string> = new Set(['seated_plate_loaded_machine_row'])

/**
 * המפה של תמונה בגלריה, או רשימה ריקה.
 *
 * ריקה בשלושה מצבים שכולם לגיטימיים: כרטיס שאין עליו אחוזים כלל (יש כאלה —
 * ‏`IMAGES_WITHOUT_PERCENTAGES`), תמונה שאינה במניפסט, וכרטיס שעדיין לא נכלל
 * בתצוגה המקדימה. הקורא מציג את התמונה בדיוק כמו קודם.
 */
export function loadMapForImage(image: ExerciseImage): readonly LoadShare[] {
  const id = imageIdOf(image.src)
  // מחיקת התנאי הזה פותחת את המפה לכל הכרטיסים
  if (!PREVIEW.has(id)) return []
  return loadMapFor(id)
}
