import type { Exercise } from './types'

/**
 * תיקון שמות התרגילים בקטלוג.
 *
 * השמות המקוריים נכתבו מהזיכרון ולא אומתו מול הסרטונים. כל 34 הסרטונים נבדקו
 * מאז — גם מול התיאור המקורי בטיקטוק וגם מול פריימים מהסרטון עצמו — וזה
 * התיקון המלא. seed.ts מחזיק את התוצאה בשביל התקנה חדשה; הקובץ הזה מחזיק את
 * אותה תוצאה בשביל מכשיר שכבר זרוע (ראה מיגרציה 3 ב-db.ts).
 *
 * הרשימה כאן היא תמונת מצב קפואה בכוונה, ולא נגזרת מ-seed.ts: הקטלוג ימשיך
 * להשתנות, והמיגרציה חייבת להחיל בדיוק את מה שהיה נכון בגרסה 3 גם על מכשיר
 * שמדלג כמה גרסאות בבת אחת. catalogFix.test.ts שומר שהשתיים לא ייפרדו בלי
 * שמישהו שם לב.
 *
 * `was` הוא מנגנון ההגנה: תרגיל ששמו כבר לא מה שהיה — המשתמש ערך אותו בעצמו,
 * וזה גובר על התיקון.
 */
export interface CatalogFix {
  id: string
  /** השם שהיה בקטלוג לפני התיקון */
  was: string
  name: string
  nameEn: string
  subTarget: string
  /** דגשים מתוקנים, רק כשהדגשים הישנים סתרו את השם החדש */
  wasCues?: readonly string[]
  cues?: readonly string[]
}

export const CATALOG_FIXES: readonly CatalogFix[] = [
  // ═══ אימון A ═══
  {
    id: 'pushup',
    was: 'שכיבות סמיכה — חימום',
    name: 'שכיבות סמיכה (חימום)',
    nameEn: 'Push-Up (Warm-Up)',
    subTarget: 'חימום — חזה, טריצפס, כתף קדמית',
  },
  {
    // ארבעת הסרטונים הם מוט ולא דאמבלים: אחד בשיפוע חיובי, שלושה שטוח
    id: 'db-bench-press',
    was: 'לחיצת חזה חופשי',
    name: 'לחיצת חזה במוט — שיפוע חיובי ושטוח',
    nameEn: 'Barbell Bench Press (Incline & Flat)',
    subTarget: 'חזה עליון ותחתון',
  },
  {
    // "סיקליין" ירד: התיאור המקורי מדבר על סיבי חזה אמצעי-תחתון וגובה מושב
    // שמביא את הידיות לגובה הפטמה — זו לא לחיצה בשיפוע
    id: 'decline-machine-press',
    was: 'לחיצה במכונה סיקליין',
    name: 'לחיצת חזה במכונה',
    nameEn: 'Machine Chest Press',
    subTarget: 'חזה אמצעי-תחתון',
    wasCues: [
      'לכוון את גובה המושב כך שהידיות בקו החזה התחתון',
      'לדחוף מהחזה, לא מהכתפיים',
      'לעצור רגע בנקודה הקצרה ולסחוט',
      'לחזור לאט — 2 שניות בירידה',
    ],
    cues: [
      'לכוון את גובה המושב כך שהידיות בגובה הפטמה',
      'לדחוף מהחזה, לא מהכתפיים',
      'לעצור רגע בנקודה הקצרה ולסחוט',
      'לחזור לאט — 2 שניות בירידה',
    ],
  },
  {
    // הסרטון מוכתר Plate Loaded Tricep Dips והדגש בו טריצפס, לא רק חזה תחתון
    id: 'dips',
    was: 'מקבילים',
    name: 'מקבילים במכונה',
    nameEn: 'Plate-Loaded Triceps Dips',
    subTarget: 'טריצפס וחזה תחתון',
    wasCues: [
      'להטות את הגוף קדימה — זה מה שהופך את זה לחזה ולא לטריצפס',
      'מרפקים מעט החוצה',
      'לרדת עד שהכתף בגובה המרפק, לא נמוך',
      'לא לנעול מרפקים למעלה',
    ],
    cues: [
      'גוף זקוף ומרפקים צמודים לצדדים — ככה העומס נשאר על הטריצפס',
      'הטיה קדימה מעבירה חלק מהעומס לחזה התחתון',
      'לרדת עד שהכתף בגובה המרפק, לא נמוך',
      'לא לנעול מרפקים למעלה',
    ],
  },
  {
    id: 'decline-pec-fly',
    was: 'פקטורל במכונה שיפוע שלילי',
    name: 'פרפר במכונה בשיפוע שלילי',
    nameEn: 'Decline Machine Pec Fly',
    subTarget: 'חזה',
  },
  {
    id: 'bench-machine-press',
    was: 'לחיצה במכונה בנץ',
    name: 'לחיצת חזה במכונה',
    nameEn: 'Machine Bench Press',
    subTarget: 'חזה',
  },
  {
    // כבל בפולי גבוה, לא מוט חופשי
    id: 'overhead-tricep-ext',
    was: 'יד אחורית עם מוט מעל הראש',
    name: 'פשיטת מרפקים מעל הראש בכבל',
    nameEn: 'Overhead Cable Triceps Extension',
    subTarget: 'טריצפס — ראש ארוך',
  },
  {
    id: 'cable-tricep-pushdown',
    was: 'יד אחורית עם מוט בפולי',
    name: 'פשיטת מרפקים בפולי עם מוט ישר',
    nameEn: 'Cable Triceps Pushdown (Straight Bar)',
    subTarget: 'טריצפס',
  },
  {
    id: 'cross-cable-tricep',
    was: 'יד אחורית כבלים צולבים',
    name: 'פשיטת מרפק בכבל חוצה גוף',
    nameEn: 'Cross-Body Cable Triceps Extension',
    subTarget: 'טריצפס',
  },
  {
    id: 'machine-shoulder-press',
    was: 'כתפיים במכונה',
    name: 'לחיצת כתפיים במכונה',
    nameEn: 'Machine Shoulder Press',
    subTarget: 'דלתא קדמי',
  },
  {
    id: 'lateral-raise',
    was: 'הרמה לצדדים',
    name: 'הרמת ידיים לצדדים',
    nameEn: 'Lateral Raise',
    subTarget: 'דלתא צדי',
  },

  // ═══ אימון B ═══
  {
    id: 'lat-pulldown',
    was: 'פולי עליון',
    name: 'משיכת פולי עליון',
    nameEn: 'Lat Pulldown',
    subTarget: 'לטיסימוס',
  },
  {
    // שתי החתירות נשארות שני תרגילים נפרדים למרות שם זהה — הן נבדלות במשקל
    // ובסרטון, והמשקל הוא מה שמבדיל ביניהן בתצוגה (domain/naming.ts)
    id: 'seated-row-heavy',
    was: 'חתירה כבדה',
    name: 'חתירה במכונה',
    nameEn: 'Machine Row',
    subTarget: 'לטיסימוס ואמצע גב',
  },
  {
    id: 'seated-row-light',
    was: 'חתירה שנייה',
    name: 'חתירה במכונה',
    nameEn: 'Machine Row',
    subTarget: 'לטיסימוס ואמצע גב',
  },
  {
    id: 'low-row-rack',
    was: 'חתירה מלמטה בכלוב',
    name: 'חתירה בכבל בישיבה',
    nameEn: 'Seated Cable Row',
    subTarget: 'לטיסימוס תחתון',
  },
  {
    id: 'preacher-curl',
    was: 'יד קדמית בספה',
    name: 'כפיפת מרפקים בספה',
    nameEn: 'Preacher Curl',
    subTarget: 'ביצפס',
  },
  {
    // "יושב" ירד — בסרטון התרגיל מבוצע בעמידה
    id: 'hammer-curl',
    was: 'פטישים יושב',
    name: 'כפיפת פטיש',
    nameEn: 'Hammer Curl',
    subTarget: 'ביצפס וברכיורדיאליס',
  },
  {
    id: 'behind-body-cable-curl',
    was: 'יד קדמית בפולי, מרפקים מאחורי הגוף',
    name: 'כפיפת מרפקים בכבל עם מרפקים מאחורי הגוף',
    nameEn: 'Behind-the-Body Cable Curl',
    subTarget: 'ביצפס — ראש ארוך',
  },
  {
    id: 'forearm-straight-bar',
    was: 'אמות — סטריט בר בכבל',
    name: 'כפיפות שורש כף יד בכבל עם מוט ישר',
    nameEn: 'Cable Wrist Curl (Straight Bar)',
    subTarget: 'אמות — כופפים ופושטים',
  },
  {
    id: 'forearm-dumbbell',
    was: 'אמות — דאמבלים',
    name: 'כפיפות שורש כף יד עם דאמבלים',
    nameEn: 'Dumbbell Wrist Curl',
    subTarget: 'אמות',
  },
  {
    id: 'shrugs',
    was: 'הרמת כתפיים',
    name: 'הרמת כתפיים עם דאמבלים',
    nameEn: 'Dumbbell Shrug',
    subTarget: 'טרפזים',
  },
  {
    id: 'reverse-machine-fly',
    was: 'פרפר הפוך במכונה',
    name: 'פרפר הפוך במכונה',
    nameEn: 'Reverse Pec Deck (Rear Delt Fly)',
    subTarget: 'דלתא אחורי',
  },

  // ═══ אימון C ═══
  {
    id: 'calf-raise',
    was: 'שרירי תאומים',
    name: 'הרמת עקבים',
    nameEn: 'Calf Raise',
    subTarget: 'שוק — תאומים',
  },
  {
    id: 'machine-squat',
    was: 'סקוואט במכונה',
    name: 'סקוואט במכונה',
    nameEn: 'Machine Squat / Hack Squat',
    subTarget: 'קוואדריצפס וגלוטאוס',
  },
  {
    id: 'leg-curl',
    was: 'כפיפת ברכיים',
    name: 'כפיפת ברכיים בישיבה',
    nameEn: 'Seated Leg Curl',
    subTarget: 'המסטרינג',
  },
  {
    // הסרטון הוא ספציפית פלאנק, לא תרגילי בטן כלליים
    id: 'abs',
    was: 'בטן',
    name: 'פלאנק',
    nameEn: 'Plank',
    subTarget: 'core — בטן',
    wasCues: [
      'לגלגל את עמוד השדרה, לא למשוך מהצוואר',
      'לנשוף בכיווץ',
      'לרדת לאט — לא להיעזר בתנופה',
    ],
    cues: [
      'מרפקים מתחת לכתפיים, אמות על הרצפה',
      'גוף בקו ישר מהעקב עד הראש — אגן לא נופל ולא מתרומם',
      'בטן ועכוז נעולים, נשימה רגילה',
      'החזרות כאן הן שניות — לספור זמן ולא תנועות',
    ],
  },
]

/**
 * מחיל תיקון על רשומה קיימת. מחזיר null כשאין מה לתקן — או שאין תיקון לתרגיל
 * הזה, או שהמשתמש כבר שינה את השם בעצמו.
 */
export function applyCatalogFix(
  exercise: Exercise,
  fixes: readonly CatalogFix[] = CATALOG_FIXES
): Exercise | null {
  const fix = fixes.find((f) => f.id === exercise.id)
  if (!fix || exercise.name !== fix.was) return null

  // הדגשים מתוקנים רק אם הם עדיין בדיוק מה שהיו. גם דגש אחד ששונה מסמן
  // שהמשתמש נגע בהם, ואז הם שלו.
  const cuesUntouched =
    fix.wasCues !== undefined &&
    fix.cues !== undefined &&
    exercise.cues.length === fix.wasCues.length &&
    exercise.cues.every((cue, i) => cue === fix.wasCues?.[i])

  return {
    ...exercise,
    name: fix.name,
    nameEn: fix.nameEn,
    subTarget: fix.subTarget,
    cues: cuesUntouched && fix.cues ? [...fix.cues] : exercise.cues,
    updatedAt: Date.now(),
  }
}
