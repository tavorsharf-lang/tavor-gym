import type { Exercise, MuscleGroup } from './types'

/**
 * מפת השרירים שכל תרגיל עובד *בעקיפין*.
 *
 * הייחוס הראשי חי במקום אחד בלבד — `Exercise.muscleGroup` — והמפה הזאת לא נוגעת
 * בו. היא מוסיפה רק את הזיכוי המשני שמסך הכיסוי בבונה האימונים מציג: אילו שרירים
 * קיבלו עבודה אמיתית בלי שהם היו המטרה של התרגיל. לכן שריר לעולם לא מופיע כאן
 * ברשימה של תרגיל שהוא כבר הראשי שלו — זו הייתה ספירה כפולה.
 *
 * מערך ריק הוא תשובה לגיטימית ונפוצה, לא רשומה שלא הושלמה: תרגיל בידוד (כפיפות
 * מרפקים, פשיטת ברכיים, הרמות לצדדים, הרמת עקבים) פשוט לא מעניק עבודה משנית
 * משמעותית, ועדיף מערך ריק על פני שרירים שנוספו כדי למלא שורה. מפתח שחסר לגמרי
 * נקרא בדיוק כמו מערך ריק.
 *
 * המפתוח הוא גם לפי מזהי הקטלוג וגם לפי מזהי המאגר (`lib-`), כדי שתרגיל מהמאגר
 * יישא את התגיות שלו עוד לפני שהוא הופך לתרגיל בקטלוג — ואחרי שהוא הופך, המזהה
 * החדש גובר.
 *
 * המספרים כאן מזינים אך ורק את תצוגת הכיסוי. הם לא נכנסים לחישוב נפח, לא לשיאים,
 * לא לסטי חימום ולא להצעות תחליף.
 */
export const SECONDARY_MUSCLES: Record<string, MuscleGroup[]> = {
  // ─── קטלוג ───
  pushup: ['triceps', 'shoulders', 'abs'],
  'db-bench-press': ['triceps', 'shoulders'],
  'decline-machine-press': ['triceps', 'shoulders'],
  dips: ['triceps', 'shoulders'],
  'decline-pec-fly': [],
  'bench-machine-press': ['triceps', 'shoulders'],
  'overhead-tricep-ext': [],
  'cable-tricep-pushdown': [],
  'cross-cable-tricep': [],
  'lat-pulldown': ['biceps', 'forearms', 'shoulders'],
  'seated-row-heavy': ['biceps', 'forearms', 'shoulders'],
  'seated-row-light': ['biceps', 'forearms', 'shoulders'],
  'low-row-rack': ['biceps', 'forearms', 'shoulders'],
  'preacher-curl': [],
  // כפיפת פטיש היא התרגיל היחיד בקטלוג שבו הברכיורדיאליס באמת עובד
  'hammer-curl': ['forearms'],
  'behind-body-cable-curl': [],
  'leg-press': [],
  'calf-raise': [],
  // האק-סקוואט תומך בגב ובליבה בריפוד — אין כאן זיכוי לגב או לבטן
  'machine-squat': [],
  'leg-curl': [],
  'leg-extension': [],
  'machine-shoulder-press': ['triceps', 'chest'],
  'lateral-raise': [],
  shrugs: ['forearms'],
  'reverse-machine-fly': ['back'],
  'forearm-straight-bar': [],
  'forearm-dumbbell': [],
  abs: [],

  // ─── מאגר ───
  'lib-reverse_wrist_curl': [], // פשיטת שורש כף יד
  'lib-cable_crunch': [], // כפיפות בטן בכבל
  'lib-crunch': [], // כפיפות בטן
  'lib-plank': [], // פלאנק
  'lib-leg_raise': [], // הרמת רגליים
  'lib-lat_pulldown': ['biceps', 'forearms', 'shoulders'], // משיכת פולי עליון
  'lib-seated_cable_row': ['biceps', 'forearms', 'shoulders'], // חתירה בכבל בישיבה
  'lib-dumbbell_row': ['biceps', 'forearms', 'shoulders'], // חתירה עם דאמבל
  'lib-pull_up': ['biceps', 'forearms', 'shoulders', 'abs'], // מתח
  'lib-row_general': ['biceps', 'forearms', 'shoulders'], // חתירה
  'lib-barbell_row': ['biceps', 'forearms', 'shoulders', 'abs'], // חתירה במוט
  'lib-deadlift': ['legs', 'forearms', 'abs'], // דדליפט
  'lib-romanian_deadlift': ['legs', 'forearms', 'abs'], // דדליפט רומני
  'lib-back_extension': ['legs'], // הרמת גב
  'lib-t_bar_row': ['biceps', 'forearms', 'shoulders', 'abs'], // חתירת טי-בר
  'lib-landmine_row': ['biceps', 'forearms', 'shoulders', 'abs'], // חתירת לנדמיין
  'lib-machine_row': ['biceps', 'forearms', 'shoulders'], // חתירה במכונה
  'lib-straight_arm_pulldown': [], // משיכה בזרועות ישרות
  'lib-barbell_bench_press': ['triceps', 'shoulders'], // לחיצת חזה במוט
  'lib-push_up': ['triceps', 'shoulders', 'abs'], // שכיבות סמיכה
  'lib-cable_chest_fly': [], // פרפר בכבלים
  'lib-dumbbell_bench_press': ['triceps', 'shoulders'], // לחיצת חזה בדאמבלים
  'lib-incline_barbell_bench_press': ['triceps', 'shoulders'], // לחיצת חזה במוט בשיפוע חיובי
  'lib-machine_chest_press': ['triceps', 'shoulders'], // לחיצת חזה במכונה
  'lib-dumbbell_chest_fly': [], // פרפר עם דאמבלים
  'lib-pec_deck_machine_chest_fly': [], // פרפר במכונה
  'lib-smith_machine_bench_press': ['triceps', 'shoulders'], // לחיצת חזה בסמית
  'lib-incline_dumbbell_press': ['triceps', 'shoulders'], // לחיצת חזה בדאמבלים בשיפוע
  'lib-cable_chest_press': ['triceps', 'shoulders'], // לחיצת חזה בכבלים
  'lib-pullover': ['back', 'triceps'], // פולאובר
  'lib-triceps_pushdown': [], // פשיטת מרפקים בפולי
  'lib-skull_crusher': [], // סקאל קראשר
  'lib-overhead_triceps_extension': [], // פשיטת מרפקים מעל הראש
  'lib-triceps_kickback': [], // בעיטת טריצפס
  'lib-dips': ['chest', 'shoulders'], // מקבילים
  'lib-bench_dip': ['chest', 'shoulders'], // מקבילים על ספסל
  'lib-dumbbell_curl': [], // כפיפת מרפקים בדאמבלים
  'lib-preacher_curl': [], // כפיפת מרפקים בספה
  'lib-barbell_curl': [], // כפיפת מרפקים במוט
  'lib-incline_dumbbell_curl': [], // כפיפת מרפקים בשיפוע
  'lib-rear_delt_fly': ['back'], // פרפר הפוך
  'lib-lateral_raise': [], // הרמת ידיים לצדדים
  'lib-overhead_press': ['triceps', 'chest', 'abs'], // לחיצת כתפיים מעל הראש
  'lib-shrug': ['forearms'], // הרמת כתפיים
  'lib-cable_lateral_raise': [], // הרמה לצדדים בכבל
  'lib-dumbbell_shoulder_press': ['triceps', 'chest', 'abs'], // לחיצת כתפיים בדאמבלים
  'lib-machine_shoulder_press': ['triceps', 'chest'], // לחיצת כתפיים במכונה
  'lib-upright_row': ['biceps', 'forearms'], // חתירה זקופה
  'lib-face_pull': ['back', 'biceps'], // משיכת פנים
  'lib-front_raise': [], // הרמת ידיים לפנים
  'lib-arnold_press': ['triceps', 'chest', 'abs'], // לחיצת ארנולד
  'lib-barbell_squat': ['back', 'abs'], // סקוואט במוט
  'lib-leg_press': [], // לחיצת רגליים
  'lib-leg_curl': [], // כפיפת ברכיים
  'lib-leg_extension': [], // פשיטת ברכיים
  'lib-lunge': ['back', 'abs'], // מכרעים
  'lib-smith_machine_squat': ['back', 'abs'], // סקוואט בסמית
  'lib-hip_thrust': ['abs'], // הרמת אגן
  'lib-bulgarian_split_squat': ['back', 'abs'], // סקוואט בולגרי
  'lib-goblet_squat': ['back', 'abs'], // גובלט סקוואט
  'lib-hip_abduction': [], // הרחקת ירך
  'lib-front_squat': ['back', 'abs'], // פרונט סקוואט
}

/** התגיות של תרגיל — לפי מזהה הקטלוג, ואם אין, לפי מזהה המאגר המקושר. */
export function secondaryMusclesFor(exerciseId: string, libraryId?: string): MuscleGroup[] {
  return SECONDARY_MUSCLES[exerciseId] ?? (libraryId ? SECONDARY_MUSCLES[libraryId] ?? [] : [])
}

/**
 * שותל את התגיות ברשומת תרגיל שעדיין אין לה שדה `secondaryMuscles`.
 *
 * השומר הוא *היעדר* השדה ולא ריקנותו: מערך ריק הוא החלטה — של הטבלה כאן או של
 * המשתמש — ואסור לדרוס אותה בכל פתיחה של המסד. תרגיל שאינו מוכר מקבל `[]`, כדי
 * שגם עליו תהיה תשובה ולא שאלה פתוחה.
 *
 * מחזיר את אותה רשומה עצמה כשאין מה לשנות, כדי שהקורא יוכל לדלג על הכתיבה.
 */
export function withSecondaryMuscles(exercise: Exercise): Exercise {
  if (exercise.secondaryMuscles !== undefined) return exercise
  return { ...exercise, secondaryMuscles: secondaryMusclesFor(exercise.id, exercise.libraryId) }
}
