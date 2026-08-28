// קובץ נוצר אוטומטית על ידי scripts/import-images.mjs — אין לערוך ידנית.
// הרצה מחדש: npm run import:images

/** כרטיס שרירים אחד — התמונה שמראה מה עובד בתרגיל ובאיזו מידה */
export interface ExerciseImage {
  /** נתיב יחסי ל-base של האפליקציה — 1100px */
  src: string
  /** 200px, נכנס ל-precache */
  thumb: string
  nameHe: string
  nameEn: string
  /** קבוצת השריר לפי תיקיית המקור — לתצוגה ולבדיקות בלבד */
  category: string
  sourceWidth: number
  sourceHeight: number
  sizeBytes: number
}

export const IMAGE_MANIFEST: Record<string, ExerciseImage> = {
  "flat_dumbbell_bench_press": {
    "src": "images/ex/flat_dumbbell_bench_press.jpg",
    "thumb": "images/ex/t/flat_dumbbell_bench_press.jpg",
    "nameHe": "לחיצת חזה בדאמבלים",
    "nameEn": "FLAT DUMBBELL BENCH PRESS",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 269160
  },
  "incline_dumbbell_bench_press": {
    "src": "images/ex/incline_dumbbell_bench_press.jpg",
    "thumb": "images/ex/t/incline_dumbbell_bench_press.jpg",
    "nameHe": "לחיצת חזה בדאמבלים בשיפוע",
    "nameEn": "INCLINE DUMBBELL BENCH PRESS",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 265762
  },
  "high_to_low_cable_chest_press": {
    "src": "images/ex/high_to_low_cable_chest_press.jpg",
    "thumb": "images/ex/t/high_to_low_cable_chest_press.jpg",
    "nameHe": "לחיצת חזה בכבלים מלמעלה למטה",
    "nameEn": "HIGH-TO-LOW CABLE CHEST PRESS",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 265422
  },
  "flat_barbell_bench_press": {
    "src": "images/ex/flat_barbell_bench_press.jpg",
    "thumb": "images/ex/t/flat_barbell_bench_press.jpg",
    "nameHe": "לחיצת חזה במוט",
    "nameEn": "FLAT BARBELL BENCH PRESS",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 286438
  },
  "flat_barbell_bench_press_2": {
    "src": "images/ex/flat_barbell_bench_press_2.jpg",
    "thumb": "images/ex/t/flat_barbell_bench_press_2.jpg",
    "nameHe": "לחיצת חזה במוט",
    "nameEn": "FLAT BARBELL BENCH PRESS",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 269207
  },
  "incline_barbell_bench_press": {
    "src": "images/ex/incline_barbell_bench_press.jpg",
    "thumb": "images/ex/t/incline_barbell_bench_press.jpg",
    "nameHe": "לחיצת חזה במוט בשיפוע חיובי",
    "nameEn": "INCLINE BARBELL BENCH PRESS",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 284448
  },
  "seated_machine_chest_press": {
    "src": "images/ex/seated_machine_chest_press.jpg",
    "thumb": "images/ex/t/seated_machine_chest_press.jpg",
    "nameHe": "לחיצת חזה במכונה",
    "nameEn": "SEATED MACHINE CHEST PRESS",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 333729
  },
  "seated_machine_chest_press_2": {
    "src": "images/ex/seated_machine_chest_press_2.jpg",
    "thumb": "images/ex/t/seated_machine_chest_press_2.jpg",
    "nameHe": "לחיצת חזה במכונה",
    "nameEn": "SEATED MACHINE CHEST PRESS",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 261931
  },
  "smith_machine_bench_press": {
    "src": "images/ex/smith_machine_bench_press.jpg",
    "thumb": "images/ex/t/smith_machine_bench_press.jpg",
    "nameHe": "לחיצת חזה בסמית",
    "nameEn": "SMITH MACHINE BENCH PRESS",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 263135
  },
  "machine_chest_dip": {
    "src": "images/ex/machine_chest_dip.jpg",
    "thumb": "images/ex/t/machine_chest_dip.jpg",
    "nameHe": "מקבילים במכונה",
    "nameEn": "MACHINE CHEST DIP",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 226525
  },
  "dumbbell_pullover": {
    "src": "images/ex/dumbbell_pullover.jpg",
    "thumb": "images/ex/t/dumbbell_pullover.jpg",
    "nameHe": "פולאובר עם דאמבל",
    "nameEn": "DUMBBELL PULLOVER",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 221954
  },
  "cable_chest_fly": {
    "src": "images/ex/cable_chest_fly.jpg",
    "thumb": "images/ex/t/cable_chest_fly.jpg",
    "nameHe": "פרפר בכבלים",
    "nameEn": "CABLE CHEST FLY",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 253125
  },
  "pec_deck_chest_fly": {
    "src": "images/ex/pec_deck_chest_fly.jpg",
    "thumb": "images/ex/t/pec_deck_chest_fly.jpg",
    "nameHe": "פרפר במכונה",
    "nameEn": "PEC DECK CHEST FLY",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 270970
  },
  "decline_machine_pec_fly": {
    "src": "images/ex/decline_machine_pec_fly.jpg",
    "thumb": "images/ex/t/decline_machine_pec_fly.jpg",
    "nameHe": "פרפר במכונה בשיפוע שלילי",
    "nameEn": "DECLINE MACHINE PEC FLY",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 323263
  },
  "flat_dumbbell_chest_fly": {
    "src": "images/ex/flat_dumbbell_chest_fly.jpg",
    "thumb": "images/ex/t/flat_dumbbell_chest_fly.jpg",
    "nameHe": "פרפר עם דאמבלים",
    "nameEn": "FLAT DUMBBELL CHEST FLY",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 241110
  },
  "standard_push_up": {
    "src": "images/ex/standard_push_up.jpg",
    "thumb": "images/ex/t/standard_push_up.jpg",
    "nameHe": "שכיבות סמיכה",
    "nameEn": "STANDARD PUSH-UP",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 286084
  },
  "standard_push_up_2": {
    "src": "images/ex/standard_push_up_2.jpg",
    "thumb": "images/ex/t/standard_push_up_2.jpg",
    "nameHe": "שכיבות סמיכה",
    "nameEn": "STANDARD PUSH-UP",
    "category": "חזה",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 232098
  },
  "conventional_barbell_deadlift": {
    "src": "images/ex/conventional_barbell_deadlift.jpg",
    "thumb": "images/ex/t/conventional_barbell_deadlift.jpg",
    "nameHe": "דדליפט",
    "nameEn": "CONVENTIONAL BARBELL DEADLIFT",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 278001
  },
  "romanian_deadlift": {
    "src": "images/ex/romanian_deadlift.jpg",
    "thumb": "images/ex/t/romanian_deadlift.jpg",
    "nameHe": "דדליפט רומני",
    "nameEn": "ROMANIAN DEADLIFT",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 243320
  },
  "back_extension": {
    "src": "images/ex/back_extension.jpg",
    "thumb": "images/ex/t/back_extension.jpg",
    "nameHe": "הרמת גב",
    "nameEn": "BACK EXTENSION",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 254577
  },
  "seated_cable_row": {
    "src": "images/ex/seated_cable_row.jpg",
    "thumb": "images/ex/t/seated_cable_row.jpg",
    "nameHe": "חתירה בכבל בישיבה",
    "nameEn": "SEATED CABLE ROW",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 305097
  },
  "seated_cable_row_2": {
    "src": "images/ex/seated_cable_row_2.jpg",
    "thumb": "images/ex/t/seated_cable_row_2.jpg",
    "nameHe": "חתירה בכבל בישיבה",
    "nameEn": "SEATED CABLE ROW",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 345046
  },
  "bent_over_barbell_row": {
    "src": "images/ex/bent_over_barbell_row.jpg",
    "thumb": "images/ex/t/bent_over_barbell_row.jpg",
    "nameHe": "חתירה במוט",
    "nameEn": "BENT-OVER BARBELL ROW",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 261288
  },
  "seated_plate_loaded_machine_row": {
    "src": "images/ex/seated_plate_loaded_machine_row.jpg",
    "thumb": "images/ex/t/seated_plate_loaded_machine_row.jpg",
    "nameHe": "חתירה במכונה",
    "nameEn": "SEATED PLATE-LOADED MACHINE ROW",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 269101
  },
  "single_arm_dumbbell_row": {
    "src": "images/ex/single_arm_dumbbell_row.jpg",
    "thumb": "images/ex/t/single_arm_dumbbell_row.jpg",
    "nameHe": "חתירה עם דאמבל ביד אחת",
    "nameEn": "SINGLE-ARM DUMBBELL ROW",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 256478
  },
  "t_bar_row": {
    "src": "images/ex/t_bar_row.jpg",
    "thumb": "images/ex/t/t_bar_row.jpg",
    "nameHe": "חתירת טי-בר",
    "nameEn": "T-BAR ROW",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 237749
  },
  "single_arm_landmine_row": {
    "src": "images/ex/single_arm_landmine_row.jpg",
    "thumb": "images/ex/t/single_arm_landmine_row.jpg",
    "nameHe": "חתירת לנדמיין ביד אחת",
    "nameEn": "SINGLE-ARM LANDMINE ROW",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 260332
  },
  "straight_arm_cable_pulldown": {
    "src": "images/ex/straight_arm_cable_pulldown.jpg",
    "thumb": "images/ex/t/straight_arm_cable_pulldown.jpg",
    "nameHe": "משיכה בזרועות ישרות",
    "nameEn": "STRAIGHT-ARM CABLE PULLDOWN",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 237742
  },
  "lat_pulldown": {
    "src": "images/ex/lat_pulldown.jpg",
    "thumb": "images/ex/t/lat_pulldown.jpg",
    "nameHe": "משיכת פולי עליון",
    "nameEn": "LAT PULLDOWN",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 272116
  },
  "wide_grip_pronated_lat_pulldown": {
    "src": "images/ex/wide_grip_pronated_lat_pulldown.jpg",
    "thumb": "images/ex/t/wide_grip_pronated_lat_pulldown.jpg",
    "nameHe": "משיכת פולי עליון באחיזה רחבה",
    "nameEn": "WIDE-GRIP PRONATED LAT PULLDOWN",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 332521
  },
  "pull_up": {
    "src": "images/ex/pull_up.jpg",
    "thumb": "images/ex/t/pull_up.jpg",
    "nameHe": "מתח",
    "nameEn": "PULL-UP",
    "category": "גב",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 209309
  },
  "cable_lateral_raise": {
    "src": "images/ex/cable_lateral_raise.jpg",
    "thumb": "images/ex/t/cable_lateral_raise.jpg",
    "nameHe": "הרמה לצדדים בכבל",
    "nameEn": "CABLE LATERAL RAISE",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 234535
  },
  "dumbbell_front_raise": {
    "src": "images/ex/dumbbell_front_raise.jpg",
    "thumb": "images/ex/t/dumbbell_front_raise.jpg",
    "nameHe": "הרמת יד לפנים עם דאמבל",
    "nameEn": "DUMBBELL FRONT RAISE",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 258631
  },
  "standing_dumbbell_lateral_raise": {
    "src": "images/ex/standing_dumbbell_lateral_raise.jpg",
    "thumb": "images/ex/t/standing_dumbbell_lateral_raise.jpg",
    "nameHe": "הרמת ידיים לצדדים עם דאמבלים",
    "nameEn": "STANDING DUMBBELL LATERAL RAISE",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 236207
  },
  "dumbbell_shrug": {
    "src": "images/ex/dumbbell_shrug.jpg",
    "thumb": "images/ex/t/dumbbell_shrug.jpg",
    "nameHe": "הרמת כתפיים עם דאמבלים",
    "nameEn": "DUMBBELL SHRUG",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 198291
  },
  "forward_leaning_dumbbell_shrug": {
    "src": "images/ex/forward_leaning_dumbbell_shrug.jpg",
    "thumb": "images/ex/t/forward_leaning_dumbbell_shrug.jpg",
    "nameHe": "הרמת כתפיים עם דאמבלים בהטיה קדימה",
    "nameEn": "FORWARD-LEANING DUMBBELL SHRUG",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 244081
  },
  "upright_row": {
    "src": "images/ex/upright_row.jpg",
    "thumb": "images/ex/t/upright_row.jpg",
    "nameHe": "חתירה זקופה",
    "nameEn": "UPRIGHT ROW",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 270723
  },
  "arnold_press": {
    "src": "images/ex/arnold_press.jpg",
    "thumb": "images/ex/t/arnold_press.jpg",
    "nameHe": "לחיצת ארנולד",
    "nameEn": "ARNOLD PRESS",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 261275
  },
  "dumbbell_shoulder_press": {
    "src": "images/ex/dumbbell_shoulder_press.jpg",
    "thumb": "images/ex/t/dumbbell_shoulder_press.jpg",
    "nameHe": "לחיצת כתפיים בדאמבלים",
    "nameEn": "DUMBBELL SHOULDER PRESS",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 287528
  },
  "machine_shoulder_press": {
    "src": "images/ex/machine_shoulder_press.jpg",
    "thumb": "images/ex/t/machine_shoulder_press.jpg",
    "nameHe": "לחיצת כתפיים במכונה",
    "nameEn": "MACHINE SHOULDER PRESS",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 264546
  },
  "seated_machine_shoulder_press": {
    "src": "images/ex/seated_machine_shoulder_press.jpg",
    "thumb": "images/ex/t/seated_machine_shoulder_press.jpg",
    "nameHe": "לחיצת כתפיים במכונה",
    "nameEn": "SEATED MACHINE SHOULDER PRESS",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 340061
  },
  "cable_face_pull": {
    "src": "images/ex/cable_face_pull.jpg",
    "thumb": "images/ex/t/cable_face_pull.jpg",
    "nameHe": "משיכת פנים בכבל",
    "nameEn": "CABLE FACE PULL",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 254199
  },
  "reverse_pec_deck_rear_delt_fly": {
    "src": "images/ex/reverse_pec_deck_rear_delt_fly.jpg",
    "thumb": "images/ex/t/reverse_pec_deck_rear_delt_fly.jpg",
    "nameHe": "פרפר הפוך במכונה",
    "nameEn": "REVERSE PEC DECK REAR DELT FLY",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 259622
  },
  "bent_over_dumbbell_rear_delt_fly": {
    "src": "images/ex/bent_over_dumbbell_rear_delt_fly.jpg",
    "thumb": "images/ex/t/bent_over_dumbbell_rear_delt_fly.jpg",
    "nameHe": "פרפר הפוך עם דאמבלים בכפיפה",
    "nameEn": "BENT-OVER DUMBBELL REAR DELT FLY",
    "category": "כתפיים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 251792
  },
  "standing_cable_biceps_curl": {
    "src": "images/ex/standing_cable_biceps_curl.jpg",
    "thumb": "images/ex/t/standing_cable_biceps_curl.jpg",
    "nameHe": "כפיפות מרפקים בכבל",
    "nameEn": "STANDING CABLE BICEPS CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 233444
  },
  "preacher_curl": {
    "src": "images/ex/preacher_curl.jpg",
    "thumb": "images/ex/t/preacher_curl.jpg",
    "nameHe": "כפיפות מרפקים בספת ווקר",
    "nameEn": "PREACHER CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 287239
  },
  "standing_barbell_biceps_curl": {
    "src": "images/ex/standing_barbell_biceps_curl.jpg",
    "thumb": "images/ex/t/standing_barbell_biceps_curl.jpg",
    "nameHe": "כפיפות מרפקים בעמידה עם מוט",
    "nameEn": "STANDING BARBELL BICEPS CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 217430
  },
  "standing_dumbbell_biceps_curl": {
    "src": "images/ex/standing_dumbbell_biceps_curl.jpg",
    "thumb": "images/ex/t/standing_dumbbell_biceps_curl.jpg",
    "nameHe": "כפיפות מרפקים עם דאמבלים",
    "nameEn": "STANDING DUMBBELL BICEPS CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 249810
  },
  "incline_dumbbell_biceps_curl": {
    "src": "images/ex/incline_dumbbell_biceps_curl.jpg",
    "thumb": "images/ex/t/incline_dumbbell_biceps_curl.jpg",
    "nameHe": "כפיפות מרפקים עם דאמבלים בשיפוע",
    "nameEn": "INCLINE DUMBBELL BICEPS CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 256841
  },
  "behind_the_body_cable_curl": {
    "src": "images/ex/behind_the_body_cable_curl.jpg",
    "thumb": "images/ex/t/behind_the_body_cable_curl.jpg",
    "nameHe": "כפיפת מרפקים בכבל מאחורי הגוף",
    "nameEn": "BEHIND-THE-BODY CABLE CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 309019
  },
  "behind_the_body_cable_curl_2": {
    "src": "images/ex/behind_the_body_cable_curl_2.jpg",
    "thumb": "images/ex/t/behind_the_body_cable_curl_2.jpg",
    "nameHe": "כפיפת מרפקים בכבל מאחורי הגוף",
    "nameEn": "BEHIND-THE-BODY CABLE CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 233515
  },
  "seated_machine_preacher_curl": {
    "src": "images/ex/seated_machine_preacher_curl.jpg",
    "thumb": "images/ex/t/seated_machine_preacher_curl.jpg",
    "nameHe": "כפיפת מרפקים בספה",
    "nameEn": "SEATED MACHINE PREACHER CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 317073
  },
  "seated_machine_preacher_curl_2": {
    "src": "images/ex/seated_machine_preacher_curl_2.jpg",
    "thumb": "images/ex/t/seated_machine_preacher_curl_2.jpg",
    "nameHe": "כפיפת מרפקים בספה",
    "nameEn": "SEATED MACHINE PREACHER CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 317934
  },
  "standing_dumbbell_hammer_curl": {
    "src": "images/ex/standing_dumbbell_hammer_curl.jpg",
    "thumb": "images/ex/t/standing_dumbbell_hammer_curl.jpg",
    "nameHe": "כפיפת פטיש",
    "nameEn": "STANDING DUMBBELL HAMMER CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 222905
  },
  "standing_dumbbell_hammer_curl_2": {
    "src": "images/ex/standing_dumbbell_hammer_curl_2.jpg",
    "thumb": "images/ex/t/standing_dumbbell_hammer_curl_2.jpg",
    "nameHe": "כפיפת פטיש",
    "nameEn": "STANDING DUMBBELL HAMMER CURL",
    "category": "יד קדמית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 228474
  },
  "dumbbell_triceps_kickback": {
    "src": "images/ex/dumbbell_triceps_kickback.jpg",
    "thumb": "images/ex/t/dumbbell_triceps_kickback.jpg",
    "nameHe": "בעיטת טרייספס עם דאמבל",
    "nameEn": "DUMBBELL TRICEPS KICKBACK",
    "category": "יד אחורית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 260897
  },
  "parallel_bar_dips": {
    "src": "images/ex/parallel_bar_dips.jpg",
    "thumb": "images/ex/t/parallel_bar_dips.jpg",
    "nameHe": "מקבילים",
    "nameEn": "PARALLEL BAR DIPS",
    "category": "יד אחורית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 201751
  },
  "bench_dip": {
    "src": "images/ex/bench_dip.jpg",
    "thumb": "images/ex/t/bench_dip.jpg",
    "nameHe": "מקבילים על ספסל",
    "nameEn": "BENCH DIP",
    "category": "יד אחורית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 206586
  },
  "single_arm_cross_body_cable_triceps_extension": {
    "src": "images/ex/single_arm_cross_body_cable_triceps_extension.jpg",
    "thumb": "images/ex/t/single_arm_cross_body_cable_triceps_extension.jpg",
    "nameHe": "פשיטת מרפק בכבל חוצה גוף",
    "nameEn": "SINGLE-ARM CROSS-BODY CABLE TRICEPS EXTENSION",
    "category": "יד אחורית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 291235
  },
  "cable_triceps_pushdown": {
    "src": "images/ex/cable_triceps_pushdown.jpg",
    "thumb": "images/ex/t/cable_triceps_pushdown.jpg",
    "nameHe": "פשיטת מרפקים בפולי",
    "nameEn": "CABLE TRICEPS PUSHDOWN",
    "category": "יד אחורית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 261958
  },
  "straight_bar_cable_triceps_pushdown": {
    "src": "images/ex/straight_bar_cable_triceps_pushdown.jpg",
    "thumb": "images/ex/t/straight_bar_cable_triceps_pushdown.jpg",
    "nameHe": "פשיטת מרפקים בפולי עם מוט",
    "nameEn": "STRAIGHT-BAR CABLE TRICEPS PUSHDOWN",
    "category": "יד אחורית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 286887
  },
  "lying_triceps_extension": {
    "src": "images/ex/lying_triceps_extension.jpg",
    "thumb": "images/ex/t/lying_triceps_extension.jpg",
    "nameHe": "פשיטת מרפקים בשכיבה",
    "nameEn": "LYING TRICEPS EXTENSION",
    "category": "יד אחורית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 246249
  },
  "overhead_cable_triceps_extension": {
    "src": "images/ex/overhead_cable_triceps_extension.jpg",
    "thumb": "images/ex/t/overhead_cable_triceps_extension.jpg",
    "nameHe": "פשיטת מרפקים מעל הראש בכבל",
    "nameEn": "OVERHEAD CABLE TRICEPS EXTENSION",
    "category": "יד אחורית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 295138
  },
  "overhead_cable_triceps_extension_2": {
    "src": "images/ex/overhead_cable_triceps_extension_2.jpg",
    "thumb": "images/ex/t/overhead_cable_triceps_extension_2.jpg",
    "nameHe": "פשיטת מרפקים מעל הראש בכבל",
    "nameEn": "OVERHEAD CABLE TRICEPS EXTENSION",
    "category": "יד אחורית",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 244194
  },
  "goblet_squat": {
    "src": "images/ex/goblet_squat.jpg",
    "thumb": "images/ex/t/goblet_squat.jpg",
    "nameHe": "גובלט סקוואט",
    "nameEn": "GOBLET SQUAT",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 237306
  },
  "seated_hip_abduction": {
    "src": "images/ex/seated_hip_abduction.jpg",
    "thumb": "images/ex/t/seated_hip_abduction.jpg",
    "nameHe": "הרחקת ירך במכונה",
    "nameEn": "SEATED HIP ABDUCTION",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 251337
  },
  "barbell_hip_thrust": {
    "src": "images/ex/barbell_hip_thrust.jpg",
    "thumb": "images/ex/t/barbell_hip_thrust.jpg",
    "nameHe": "הרמת אגן עם מוט",
    "nameEn": "BARBELL HIP THRUST",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 244691
  },
  "calf_press_on_leg_press": {
    "src": "images/ex/calf_press_on_leg_press.jpg",
    "thumb": "images/ex/t/calf_press_on_leg_press.jpg",
    "nameHe": "הרמת עקבים בלחיצת רגליים",
    "nameEn": "CALF PRESS ON LEG PRESS",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 245688
  },
  "standing_calf_raise": {
    "src": "images/ex/standing_calf_raise.jpg",
    "thumb": "images/ex/t/standing_calf_raise.jpg",
    "nameHe": "הרמת עקבים בעמידה",
    "nameEn": "STANDING CALF RAISE",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 309435
  },
  "standing_calf_raise_2": {
    "src": "images/ex/standing_calf_raise_2.jpg",
    "thumb": "images/ex/t/standing_calf_raise_2.jpg",
    "nameHe": "הרמת עקבים בעמידה",
    "nameEn": "STANDING CALF RAISE",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 204669
  },
  "seated_leg_curl": {
    "src": "images/ex/seated_leg_curl.jpg",
    "thumb": "images/ex/t/seated_leg_curl.jpg",
    "nameHe": "כפיפת ברכיים בישיבה",
    "nameEn": "SEATED LEG CURL",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 225762
  },
  "45_plate_loaded_leg_press": {
    "src": "images/ex/45_plate_loaded_leg_press.jpg",
    "thumb": "images/ex/t/45_plate_loaded_leg_press.jpg",
    "nameHe": "לחיצת רגליים",
    "nameEn": "45 PLATE-LOADED LEG PRESS",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 352443
  },
  "45_plate_loaded_leg_press_2": {
    "src": "images/ex/45_plate_loaded_leg_press_2.jpg",
    "thumb": "images/ex/t/45_plate_loaded_leg_press_2.jpg",
    "nameHe": "לחיצת רגליים",
    "nameEn": "45 PLATE-LOADED LEG PRESS",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 267301
  },
  "static_dumbbell_lunge": {
    "src": "images/ex/static_dumbbell_lunge.jpg",
    "thumb": "images/ex/t/static_dumbbell_lunge.jpg",
    "nameHe": "מכרע סטטי עם דאמבלים",
    "nameEn": "STATIC DUMBBELL LUNGE",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 220729
  },
  "bulgarian_split_squat": {
    "src": "images/ex/bulgarian_split_squat.jpg",
    "thumb": "images/ex/t/bulgarian_split_squat.jpg",
    "nameHe": "סקוואט בולגרי עם דאמבלים",
    "nameEn": "BULGARIAN SPLIT SQUAT",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 231304
  },
  "barbell_back_squat": {
    "src": "images/ex/barbell_back_squat.jpg",
    "thumb": "images/ex/t/barbell_back_squat.jpg",
    "nameHe": "סקוואט במוט",
    "nameEn": "BARBELL BACK SQUAT",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 236473
  },
  "machine_squat_hack_squat": {
    "src": "images/ex/machine_squat_hack_squat.jpg",
    "thumb": "images/ex/t/machine_squat_hack_squat.jpg",
    "nameHe": "סקוואט במכונה",
    "nameEn": "MACHINE SQUAT HACK SQUAT",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 370462
  },
  "machine_squat_hack_squat_2": {
    "src": "images/ex/machine_squat_hack_squat_2.jpg",
    "thumb": "images/ex/t/machine_squat_hack_squat_2.jpg",
    "nameHe": "סקוואט במכונה",
    "nameEn": "MACHINE SQUAT HACK SQUAT",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 290116
  },
  "smith_machine_squat": {
    "src": "images/ex/smith_machine_squat.jpg",
    "thumb": "images/ex/t/smith_machine_squat.jpg",
    "nameHe": "סקוואט בסמית",
    "nameEn": "SMITH MACHINE SQUAT",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 238598
  },
  "dumbbell_sumo_squat": {
    "src": "images/ex/dumbbell_sumo_squat.jpg",
    "thumb": "images/ex/t/dumbbell_sumo_squat.jpg",
    "nameHe": "סקוואט סומו עם דאמבל",
    "nameEn": "DUMBBELL SUMO SQUAT",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 229943
  },
  "barbell_front_squat": {
    "src": "images/ex/barbell_front_squat.jpg",
    "thumb": "images/ex/t/barbell_front_squat.jpg",
    "nameHe": "פרונט סקוואט",
    "nameEn": "BARBELL FRONT SQUAT",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 240370
  },
  "seated_leg_extension": {
    "src": "images/ex/seated_leg_extension.jpg",
    "thumb": "images/ex/t/seated_leg_extension.jpg",
    "nameHe": "פשיטת ברכיים בישיבה",
    "nameEn": "SEATED LEG EXTENSION",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 368045
  },
  "seated_leg_extension_2": {
    "src": "images/ex/seated_leg_extension_2.jpg",
    "thumb": "images/ex/t/seated_leg_extension_2.jpg",
    "nameHe": "פשיטת ברכיים בישיבה",
    "nameEn": "SEATED LEG EXTENSION",
    "category": "רגליים",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 282421
  },
  "lying_leg_raise": {
    "src": "images/ex/lying_leg_raise.jpg",
    "thumb": "images/ex/t/lying_leg_raise.jpg",
    "nameHe": "הרמת רגליים בשכיבה",
    "nameEn": "LYING LEG RAISE",
    "category": "בטן",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 215944
  },
  "kneeling_cable_crunch": {
    "src": "images/ex/kneeling_cable_crunch.jpg",
    "thumb": "images/ex/t/kneeling_cable_crunch.jpg",
    "nameHe": "כפיפות בטן בכבל",
    "nameEn": "KNEELING CABLE CRUNCH",
    "category": "בטן",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 262398
  },
  "floor_crunch": {
    "src": "images/ex/floor_crunch.jpg",
    "thumb": "images/ex/t/floor_crunch.jpg",
    "nameHe": "כפיפות בטן על הרצפה",
    "nameEn": "FLOOR CRUNCH",
    "category": "בטן",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 226221
  },
  "forearm_plank": {
    "src": "images/ex/forearm_plank.jpg",
    "thumb": "images/ex/t/forearm_plank.jpg",
    "nameHe": "פלאנק על האמות",
    "nameEn": "FOREARM PLANK",
    "category": "בטן",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 220475
  },
  "cable_wrist_curl": {
    "src": "images/ex/cable_wrist_curl.jpg",
    "thumb": "images/ex/t/cable_wrist_curl.jpg",
    "nameHe": "כפיפות שורש כף יד בכבל עם מוט",
    "nameEn": "CABLE WRIST CURL",
    "category": "אמות",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 260675
  },
  "dumbbell_wrist_curl": {
    "src": "images/ex/dumbbell_wrist_curl.jpg",
    "thumb": "images/ex/t/dumbbell_wrist_curl.jpg",
    "nameHe": "כפיפות שורש כף יד עם דאמבל",
    "nameEn": "DUMBBELL WRIST CURL",
    "category": "אמות",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 267184
  }
}

/** מספר הכרטיסים */
export const IMAGE_COUNT = 89

/** משקל הגרסאות המלאות, בבתים */
export const IMAGE_TOTAL_BYTES = 23347098

/** משקל הממוזערות — זה מה שנכנס ל-precache */
export const IMAGE_THUMB_BYTES = 1537913
