import { IMAGE_MANIFEST } from './imageManifest'
import type { ExerciseImage } from './imageManifest'

/**
 * איזה כרטיס שרירים שייך לאיזה תרגיל.
 *
 * כתוב ביד מאותה סיבה בדיוק כמו `LIBRARY_LINKS`: התאמה אוטומטית לפי שם נראית
 * מפתה ושוגה במקומות שכואבים. "לחיצת חזה במכונה" הוא שם של **שני** מכשירים
 * שונים בקטלוג, ו"חתירה במכונה" גם — התאמה לפי שם הייתה מצמידה לכל אחד מהם
 * תמונה שרירותית ומציגה לתבור את המכונה הלא נכונה.
 *
 * המפתחות הם גם מזהי קטלוג וגם מזהי מאגר (`lib-`), כדי שתרגיל מאגר יציג כרטיס
 * עוד לפני שהוא נכנס לתרגילים שלי — בדיוק כמו `SECONDARY_MUSCLES`.
 *
 * הערך הוא **מערך מסודר**: הראשון הוא מה שמופיע בשורה ברשימה, וכולם מופיעים
 * כשקופיות פתיחה בגלריה.
 *
 * **כל 29 תרגילי הקטלוג וכל 64 רשומות המאגר מופיעים כאן.** מה שלא מופיע פשוט
 * לא מקבל כרטיס והשורה חוזרת להציג את פריים הסרטון — זה המצב של תרגיל שהמשתמש
 * יצר בעצמו, ואין לו כרטיס עד שייווצר אחד.
 */
export const EXERCISE_IMAGES: Readonly<Record<string, readonly string[]>> = {
  // ─── קטלוג ───
  pushup: ['standard_push_up', 'standard_push_up_2'],
  'db-bench-press': ['flat_barbell_bench_press', 'flat_barbell_bench_press_2'],
  'incline-barbell-bench-press': ['incline_barbell_bench_press'],
  dips: ['machine_chest_dip'],
  'decline-pec-fly': ['decline_machine_pec_fly'],
  'overhead-tricep-ext': [
    'overhead_cable_triceps_extension',
    'overhead_cable_triceps_extension_2',
  ],
  'cable-tricep-pushdown': ['straight_bar_cable_triceps_pushdown', 'cable_triceps_pushdown'],
  'cross-cable-tricep': ['single_arm_cross_body_cable_triceps_extension'],
  'lat-pulldown': ['lat_pulldown', 'wide_grip_pronated_lat_pulldown'],
  'low-row-rack': ['seated_cable_row', 'seated_cable_row_2'],
  'preacher-curl': [
    'seated_machine_preacher_curl',
    'seated_machine_preacher_curl_2',
    'preacher_curl',
  ],
  'hammer-curl': ['standing_dumbbell_hammer_curl', 'standing_dumbbell_hammer_curl_2'],
  'behind-body-cable-curl': ['behind_the_body_cable_curl', 'behind_the_body_cable_curl_2'],
  'leg-press': ['45_plate_loaded_leg_press', '45_plate_loaded_leg_press_2'],
  'calf-raise': ['standing_calf_raise', 'standing_calf_raise_2', 'calf_press_on_leg_press'],
  'machine-squat': ['machine_squat_hack_squat', 'machine_squat_hack_squat_2'],
  'leg-curl': ['seated_leg_curl'],
  'leg-extension': ['seated_leg_extension', 'seated_leg_extension_2'],
  'machine-shoulder-press': ['machine_shoulder_press', 'seated_machine_shoulder_press'],
  'lateral-raise': ['standing_dumbbell_lateral_raise'],
  shrugs: ['dumbbell_shrug', 'forward_leaning_dumbbell_shrug'],
  'reverse-machine-fly': ['reverse_pec_deck_rear_delt_fly'],
  'forearm-straight-bar': ['cable_wrist_curl'],
  'forearm-dumbbell': ['dumbbell_wrist_curl'],
  abs: ['forearm_plank'],

  /*
    שני זוגות שחולקים שם עברי אחד, ולכן שניהם מקבלים את **אותן** תמונות.

    לתת לכל אחד תמונה אחרת היה נראה מסודר יותר ויהיה ניחוש: אין בשם הקובץ, בשם
    העברי ולא בכרטיס עצמו שום דבר שאומר איזה מהשניים צולם. עדיף ששניהם יראו את
    שתי האפשרויות מאשר שאחד מהם יראה בוודאות את המכונה הלא נכונה.
  */
  'decline-machine-press': ['seated_machine_chest_press', 'seated_machine_chest_press_2'],
  'bench-machine-press': ['seated_machine_chest_press', 'seated_machine_chest_press_2'],
  'seated-row-heavy': ['seated_plate_loaded_machine_row'],
  'seated-row-light': ['seated_plate_loaded_machine_row'],

  // ─── מאגר · חזה ───
  'lib-barbell_bench_press': ['flat_barbell_bench_press', 'flat_barbell_bench_press_2'],
  'lib-push_up': ['standard_push_up', 'standard_push_up_2'],
  'lib-cable_chest_fly': ['cable_chest_fly'],
  'lib-dumbbell_bench_press': ['flat_dumbbell_bench_press'],
  'lib-incline_barbell_bench_press': ['incline_barbell_bench_press'],
  'lib-machine_chest_press': ['seated_machine_chest_press', 'seated_machine_chest_press_2'],
  'lib-dumbbell_chest_fly': ['flat_dumbbell_chest_fly'],
  'lib-pec_deck_machine_chest_fly': ['pec_deck_chest_fly'],
  'lib-smith_machine_bench_press': ['smith_machine_bench_press'],
  'lib-incline_dumbbell_press': ['incline_dumbbell_bench_press'],
  'lib-cable_chest_press': ['high_to_low_cable_chest_press'],
  'lib-pullover': ['dumbbell_pullover'],

  // ─── מאגר · גב ───
  'lib-lat_pulldown': ['lat_pulldown', 'wide_grip_pronated_lat_pulldown'],
  'lib-seated_cable_row': ['seated_cable_row', 'seated_cable_row_2'],
  'lib-dumbbell_row': ['single_arm_dumbbell_row'],
  'lib-pull_up': ['pull_up'],
  'lib-barbell_row': ['bent_over_barbell_row'],
  /*
    רשומת האב הגנרית מקבלת את כרטיס החתירה במוט.
    
    ההערכה הראשונה כאן הייתה שאין תרגיל אחד שיכול לייצג אותה, והיא נשענה על
    השם הגנרי בלבד. צפייה בשמונת הקליפים מראה משהו אחר: כולם חתירה בכפיפה
    מהירך, רובם במוט, ואחד מהם אפילו פותח ב-"When performing a barbell back
    row". הביצוע בפועל גובר על השם — וזה בדיוק אותו כלל שהנחה את כל האודיט.
  */
  'lib-row_general': ['bent_over_barbell_row'],
  'lib-deadlift': ['conventional_barbell_deadlift'],
  'lib-romanian_deadlift': ['romanian_deadlift'],
  'lib-back_extension': ['back_extension'],
  'lib-t_bar_row': ['t_bar_row'],
  'lib-landmine_row': ['single_arm_landmine_row'],
  'lib-straight_arm_pulldown': ['straight_arm_cable_pulldown'],

  // ─── מאגר · כתפיים ───
  'lib-rear_delt_fly': ['reverse_pec_deck_rear_delt_fly', 'bent_over_dumbbell_rear_delt_fly'],
  'lib-lateral_raise': ['standing_dumbbell_lateral_raise'],
  // רשומת אב שמכסה מוט, דאמבלים, סמית' ומכונה — שתי התמונות הן שני הקצוות
  'lib-overhead_press': ['dumbbell_shoulder_press', 'machine_shoulder_press'],
  'lib-shrug': ['dumbbell_shrug', 'forward_leaning_dumbbell_shrug'],
  'lib-cable_lateral_raise': ['cable_lateral_raise'],
  'lib-dumbbell_shoulder_press': ['dumbbell_shoulder_press'],
  'lib-machine_shoulder_press': ['machine_shoulder_press', 'seated_machine_shoulder_press'],
  'lib-upright_row': ['upright_row'],
  'lib-face_pull': ['cable_face_pull'],
  'lib-front_raise': ['dumbbell_front_raise'],
  'lib-arnold_press': ['arnold_press'],

  // ─── מאגר · יד קדמית ───
  'lib-dumbbell_curl': ['standing_dumbbell_biceps_curl'],
  'lib-preacher_curl': [
    'seated_machine_preacher_curl',
    'seated_machine_preacher_curl_2',
    'preacher_curl',
  ],
  'lib-barbell_curl': ['standing_barbell_biceps_curl'],
  'lib-incline_dumbbell_curl': ['incline_dumbbell_biceps_curl'],
  'lib-cable_curl': ['standing_cable_biceps_curl'],

  // ─── מאגר · יד אחורית ───
  'lib-triceps_pushdown': ['straight_bar_cable_triceps_pushdown', 'cable_triceps_pushdown'],
  'lib-skull_crusher': ['lying_triceps_extension'],
  'lib-overhead_triceps_extension': [
    'overhead_cable_triceps_extension',
    'overhead_cable_triceps_extension_2',
  ],
  'lib-triceps_kickback': ['dumbbell_triceps_kickback'],
  'lib-dips': ['parallel_bar_dips'],
  'lib-bench_dip': ['bench_dip'],

  // ─── מאגר · רגליים ───
  'lib-barbell_squat': ['barbell_back_squat'],
  'lib-leg_press': ['45_plate_loaded_leg_press', '45_plate_loaded_leg_press_2'],
  'lib-leg_curl': ['seated_leg_curl'],
  'lib-leg_extension': ['seated_leg_extension', 'seated_leg_extension_2'],
  'lib-lunge': ['static_dumbbell_lunge'],
  'lib-smith_machine_squat': ['smith_machine_squat'],
  'lib-hip_thrust': ['barbell_hip_thrust'],
  'lib-bulgarian_split_squat': ['bulgarian_split_squat'],
  'lib-goblet_squat': ['goblet_squat'],
  'lib-hip_abduction': ['seated_hip_abduction'],
  'lib-front_squat': ['barbell_front_squat'],
  // הכרטיס על מזחלת הלחיצה הוא זה שנוצר לרשומה הזו; זה בעמידה הוא ההשלמה
  'lib-calf_raise': ['calf_press_on_leg_press', 'standing_calf_raise'],
  'lib-sumo_squat': ['dumbbell_sumo_squat'],

  // ─── מאגר · בטן ואמות ───
  'lib-cable_crunch': ['kneeling_cable_crunch'],
  'lib-crunch': ['floor_crunch'],
  'lib-plank': ['forearm_plank'],
  'lib-leg_raise': ['lying_leg_raise'],
  'lib-reverse_wrist_curl': ['dumbbell_wrist_curl', 'cable_wrist_curl'],
}

/**
 * תרגילים שאין להם כרטיס, והסיבה. לא נדרש לקוד — קיים כדי שמי שיתהה לא יחשוב
 * שזה באג, בדיוק כמו `UNLINKED_NOTES`.
 */
export const IMAGELESS_NOTES: Readonly<Record<string, string>> = {}

/**
 * הכרטיסים של תרגיל, לפי הסדר. מזהה הקטלוג קודם, ואם אין לו — התרגיל המקושר
 * במאגר. אותו סדר עדיפויות בדיוק כמו `secondaryMusclesFor`.
 */
export function imagesFor(exerciseId: string, libraryId?: string): readonly ExerciseImage[] {
  const ids = EXERCISE_IMAGES[exerciseId] ?? (libraryId ? EXERCISE_IMAGES[libraryId] : undefined)
  if (!ids) return []
  // מזהה שאינו במניפסט מסונן ולא מפיל — הייבוא יכול לרוץ מחדש עם פחות קבצים
  return ids.map((id) => IMAGE_MANIFEST[id]).filter((img): img is ExerciseImage => Boolean(img))
}

/** הכרטיס הראשי — מה שמופיע בשורה ברשימה */
export function primaryImageFor(exerciseId: string, libraryId?: string): ExerciseImage | null {
  return imagesFor(exerciseId, libraryId)[0] ?? null
}
