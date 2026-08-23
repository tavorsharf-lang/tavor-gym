import type { SetLog } from '@/db/types'

/**
 * קצב האימון — כמה זמן עובר בין סט לסט.
 *
 * הנתון הזה כבר קיים במסד ומעולם לא הוצג: לכל סט יש `completedAt`, ולכן
 * ההפרש בין שני סטים עוקבים של אותו תרגיל ידוע בדיוק. זה מה שמאפשר לתעד
 * קצב גם כשטיימר המנוחה כבוי — מי שמודד מנוחה בשעון לא מאבד את המספר,
 * הוא פשוט לא רואה אותו על המסך תוך כדי.
 *
 * **זה לא "מנוחה" וגם לא נקרא כך.** `completedAt` הוא סוף הסט, ולכן ההפרש
 * בין שני סטים הוא מנוחה *ועוד* משך הסט הבא — בתרגיל חזרות אין לנו את משך
 * הסט, ולכן אי אפשר להפריד ביניהם. קריאה לזה "מנוחה" הייתה מנפחת כל מספר
 * בעשרים-שלושים שניות בשקט. "זמן בין סטים" הוא מה שבאמת נמדד.
 */

/**
 * הפרש שמעליו זה כבר לא קצב אלא הפסקה.
 *
 * שיחת טלפון, תור למתקן, או אימון שנמשך אחרי הפסקה ארוכה — כל אלה מייצרים
 * הפרש שאינו מתאר את הקצב של האימון. החציון עמיד לחריג בודד, אבל לא לשניים
 * מתוך שלושה סטים, ולכן החריגים מסוננים לפני החישוב ונספרים בנפרד.
 */
const BREAK_CEILING_SECONDS = 15 * 60

/**
 * כמה סטים של תרגילים אחרים מותר שיפרידו בין שני סטים של אותו תרגיל, ועדיין
 * ייחשב רצף. אחד הוא סופרסט קלאסי, שניים הוא טרי-סט; מעבר לזה זו עזיבה
 * וחזרה, וההפרש מתאר את חדר הכושר ולא את הקצב.
 */
const MAX_INTERLEAVED_SETS = 2

export interface PacingSummary {
  /** חציון ההפרשים, בשניות. null כשאין אף זוג סטים למדוד */
  medianSeconds: number | null
  /** כמה הפרשים נכנסו לחישוב */
  sampleCount: number
  /** כמה הפרשים סוננו כהפסקה ארוכה */
  breakCount: number
}

/**
 * ההפרשים בשניות בין סטים עוקבים של *אותו* תרגיל.
 *
 * הקיבוץ לפי תרגיל הכרחי: המעבר מתרגיל לתרגיל כולל הליכה, חיפוש מתקן
 * והמתנה, והוא מתאר את חדר הכושר ולא את הקצב. סופרסט (שני תרגילים
 * לסירוגין) נמדד כאן כשני רצפים נפרדים, וזו התשובה הנכונה — הקצב של כל
 * תרגיל הוא מה שנשמר בהיסטוריה שלו.
 */
export function setGaps(sets: readonly SetLog[]): number[] {
  const timeline = [...sets].sort((a, b) => a.completedAt - b.completedAt)
  const lastSeenAt = new Map<string, number>()
  const gaps: number[] = []

  timeline.forEach((set, index) => {
    const previous = lastSeenAt.get(set.exerciseId)
    lastSeenAt.set(set.exerciseId, index)
    if (previous === undefined) return

    /*
      כמה סטים של תרגילים *אחרים* נדחפו בין שני הסטים האלה.

      זה מה שמבדיל סופרסט מעזיבה וחזרה. בסופרסט מתחלפים סט-סט, ולכן נכנס
      סט אחד (או שניים בטרי-סט). "המתקן תפוס" דוחף את התרגיל לסוף התור,
      ובינתיים נעשים תרגילים שלמים — ואז ההפרש מודד הליכה והמתנה ולא קצב.
      בלי ההבחנה הזו האפליקציה הכריזה "הפסקה אחת ארוכה לא נספרה" על מי
      שהתאמן ברצף, או הכניסה פער של עשר דקות לחציון כאילו היה מנוחה.
    */
    const interleaved = index - previous - 1
    if (interleaved > MAX_INTERLEAVED_SETS) return

    const seconds = (set.completedAt - timeline[previous].completedAt) / 1000
    // חותמות זהות או הפוכות מגיעות מייבוא גיבוי ערוך — לא נתון, לא שגיאה
    if (seconds > 0) gaps.push(seconds)
  })

  return gaps
}

/** החציון של מערך מספרים. מוגן מפני מערך ריק. */
function median(values: readonly number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * סיכום הקצב של אימון.
 *
 * חציון ולא ממוצע: סט אחד שהתעכב בגלל מתקן תפוס לא אמור להזיז את המספר
 * שמתאר את כל האימון.
 */
export function pacingSummary(sets: readonly SetLog[]): PacingSummary {
  const all = setGaps(sets)
  const within = all.filter((s) => s <= BREAK_CEILING_SECONDS)
  return {
    medianSeconds: median(within) === null ? null : Math.round(median(within)!),
    sampleCount: within.length,
    breakCount: all.length - within.length,
  }
}

/** אותו חישוב, לתרגיל אחד — לפירוט בכרטיס התרגיל שבסיכום */
export function pacingFor(sets: readonly SetLog[], exerciseId: string): PacingSummary {
  return pacingSummary(sets.filter((s) => s.exerciseId === exerciseId))
}
