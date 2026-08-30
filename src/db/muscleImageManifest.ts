// קובץ נוצר אוטומטית על ידי scripts/import-muscle-cards.mjs — אין לערוך ידנית.
// הרצה מחדש: npm run import:muscle-cards

/** כרטיס אנטומי אחד — איפה יושב תת-שריר בתוך הקבוצה שלו */
export interface MuscleCardImage {
  /** מספר הכרטיס במקור. הוא הזהות: "ראש ארוך" הוא שם של שניים. */
  number: number
  /** נתיב יחסי ל-base של האפליקציה — 1100px */
  src: string
  /** 200px, נכנס ל-precache */
  thumb: string
  nameHe: string
  nameEn: string
  sourceWidth: number
  sourceHeight: number
  sizeBytes: number
}

export const MUSCLE_CARD_MANIFEST: Record<string, MuscleCardImage> = {
  "upper_chest": {
    "number": 1,
    "src": "images/muscles/upper_chest.jpg",
    "thumb": "images/muscles/t/upper_chest.jpg",
    "nameHe": "חזה עליון",
    "nameEn": "UPPER CHEST",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 331567
  },
  "middle_chest": {
    "number": 2,
    "src": "images/muscles/middle_chest.jpg",
    "thumb": "images/muscles/t/middle_chest.jpg",
    "nameHe": "חזה אמצעי",
    "nameEn": "MIDDLE CHEST",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 325419
  },
  "lower_chest": {
    "number": 3,
    "src": "images/muscles/lower_chest.jpg",
    "thumb": "images/muscles/t/lower_chest.jpg",
    "nameHe": "חזה תחתון",
    "nameEn": "LOWER CHEST",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 323690
  },
  "serratus_anterior": {
    "number": 4,
    "src": "images/muscles/serratus_anterior.jpg",
    "thumb": "images/muscles/t/serratus_anterior.jpg",
    "nameHe": "סראטוס",
    "nameEn": "SERRATUS ANTERIOR",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 268046
  },
  "latissimus_dorsi": {
    "number": 5,
    "src": "images/muscles/latissimus_dorsi.jpg",
    "thumb": "images/muscles/t/latissimus_dorsi.jpg",
    "nameHe": "רחב גבי",
    "nameEn": "LATISSIMUS DORSI",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 321782
  },
  "teres_major": {
    "number": 6,
    "src": "images/muscles/teres_major.jpg",
    "thumb": "images/muscles/t/teres_major.jpg",
    "nameHe": "עגול גדול",
    "nameEn": "TERES MAJOR",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 318052
  },
  "rhomboids": {
    "number": 7,
    "src": "images/muscles/rhomboids.jpg",
    "thumb": "images/muscles/t/rhomboids.jpg",
    "nameHe": "מעוינים",
    "nameEn": "RHOMBOIDS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 292554
  },
  "middle_and_lower_trapezius": {
    "number": 8,
    "src": "images/muscles/middle_and_lower_trapezius.jpg",
    "thumb": "images/muscles/t/middle_and_lower_trapezius.jpg",
    "nameHe": "טרפז אמצעי-תחתון",
    "nameEn": "MIDDLE AND LOWER TRAPEZIUS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 284830
  },
  "erector_spinae": {
    "number": 9,
    "src": "images/muscles/erector_spinae.jpg",
    "thumb": "images/muscles/t/erector_spinae.jpg",
    "nameHe": "זוקפי הגב",
    "nameEn": "ERECTOR SPINAE",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 257813
  },
  "anterior_deltoid": {
    "number": 10,
    "src": "images/muscles/anterior_deltoid.jpg",
    "thumb": "images/muscles/t/anterior_deltoid.jpg",
    "nameHe": "כתף קדמית",
    "nameEn": "ANTERIOR DELTOID",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 332500
  },
  "lateral_deltoid": {
    "number": 11,
    "src": "images/muscles/lateral_deltoid.jpg",
    "thumb": "images/muscles/t/lateral_deltoid.jpg",
    "nameHe": "כתף אמצעית",
    "nameEn": "LATERAL DELTOID",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 378961
  },
  "posterior_deltoid": {
    "number": 12,
    "src": "images/muscles/posterior_deltoid.jpg",
    "thumb": "images/muscles/t/posterior_deltoid.jpg",
    "nameHe": "כתף אחורית",
    "nameEn": "POSTERIOR DELTOID",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 380028
  },
  "upper_trapezius": {
    "number": 13,
    "src": "images/muscles/upper_trapezius.jpg",
    "thumb": "images/muscles/t/upper_trapezius.jpg",
    "nameHe": "טרפז עליון",
    "nameEn": "UPPER TRAPEZIUS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 310103
  },
  "rotator_cuff": {
    "number": 14,
    "src": "images/muscles/rotator_cuff.jpg",
    "thumb": "images/muscles/t/rotator_cuff.jpg",
    "nameHe": "חוגרת המסובבים",
    "nameEn": "ROTATOR CUFF",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 328917
  },
  "biceps_brachii": {
    "number": 15,
    "src": "images/muscles/biceps_brachii.jpg",
    "thumb": "images/muscles/t/biceps_brachii.jpg",
    "nameHe": "דו-ראשי",
    "nameEn": "BICEPS BRACHII",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 186795
  },
  "short_head": {
    "number": 16,
    "src": "images/muscles/short_head.jpg",
    "thumb": "images/muscles/t/short_head.jpg",
    "nameHe": "ראש קצר",
    "nameEn": "SHORT HEAD",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 196488
  },
  "long_head": {
    "number": 17,
    "src": "images/muscles/long_head.jpg",
    "thumb": "images/muscles/t/long_head.jpg",
    "nameHe": "ראש ארוך",
    "nameEn": "LONG HEAD",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 206211
  },
  "brachialis": {
    "number": 18,
    "src": "images/muscles/brachialis.jpg",
    "thumb": "images/muscles/t/brachialis.jpg",
    "nameHe": "ברכיאליס",
    "nameEn": "BRACHIALIS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 155060
  },
  "triceps_brachii": {
    "number": 19,
    "src": "images/muscles/triceps_brachii.jpg",
    "thumb": "images/muscles/t/triceps_brachii.jpg",
    "nameHe": "תלת-ראשי",
    "nameEn": "TRICEPS BRACHII",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 185827
  },
  "triceps_long_head": {
    "number": 20,
    "src": "images/muscles/triceps_long_head.jpg",
    "thumb": "images/muscles/t/triceps_long_head.jpg",
    "nameHe": "ראש ארוך",
    "nameEn": "TRICEPS LONG HEAD",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 170624
  },
  "lateral_head": {
    "number": 21,
    "src": "images/muscles/lateral_head.jpg",
    "thumb": "images/muscles/t/lateral_head.jpg",
    "nameHe": "ראש חיצוני",
    "nameEn": "LATERAL HEAD",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 185581
  },
  "medial_head": {
    "number": 22,
    "src": "images/muscles/medial_head.jpg",
    "thumb": "images/muscles/t/medial_head.jpg",
    "nameHe": "ראש פנימי",
    "nameEn": "MEDIAL HEAD",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 173538
  },
  "quadriceps": {
    "number": 23,
    "src": "images/muscles/quadriceps.jpg",
    "thumb": "images/muscles/t/quadriceps.jpg",
    "nameHe": "ארבע-ראשי",
    "nameEn": "QUADRICEPS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 245972
  },
  "gluteus_maximus": {
    "number": 24,
    "src": "images/muscles/gluteus_maximus.jpg",
    "thumb": "images/muscles/t/gluteus_maximus.jpg",
    "nameHe": "עכוז גדול",
    "nameEn": "GLUTEUS MAXIMUS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 270515
  },
  "gluteus_medius": {
    "number": 25,
    "src": "images/muscles/gluteus_medius.jpg",
    "thumb": "images/muscles/t/gluteus_medius.jpg",
    "nameHe": "עכוז אמצעי",
    "nameEn": "GLUTEUS MEDIUS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 251416
  },
  "hamstrings": {
    "number": 26,
    "src": "images/muscles/hamstrings.jpg",
    "thumb": "images/muscles/t/hamstrings.jpg",
    "nameHe": "המסטרינגס",
    "nameEn": "HAMSTRINGS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 231287
  },
  "adductors": {
    "number": 27,
    "src": "images/muscles/adductors.jpg",
    "thumb": "images/muscles/t/adductors.jpg",
    "nameHe": "מקרבים",
    "nameEn": "ADDUCTORS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 245648
  },
  "hip_flexors": {
    "number": 28,
    "src": "images/muscles/hip_flexors.jpg",
    "thumb": "images/muscles/t/hip_flexors.jpg",
    "nameHe": "כופפי הירך",
    "nameEn": "HIP FLEXORS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 248838
  },
  "gastrocnemius": {
    "number": 29,
    "src": "images/muscles/gastrocnemius.jpg",
    "thumb": "images/muscles/t/gastrocnemius.jpg",
    "nameHe": "תאומים",
    "nameEn": "GASTROCNEMIUS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 256307
  },
  "soleus": {
    "number": 30,
    "src": "images/muscles/soleus.jpg",
    "thumb": "images/muscles/t/soleus.jpg",
    "nameHe": "סוליאוס",
    "nameEn": "SOLEUS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 231470
  },
  "peroneals": {
    "number": 31,
    "src": "images/muscles/peroneals.jpg",
    "thumb": "images/muscles/t/peroneals.jpg",
    "nameHe": "פרונאוס",
    "nameEn": "PERONEALS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 238490
  },
  "rectus_abdominis": {
    "number": 32,
    "src": "images/muscles/rectus_abdominis.jpg",
    "thumb": "images/muscles/t/rectus_abdominis.jpg",
    "nameHe": "ישר בטני",
    "nameEn": "RECTUS ABDOMINIS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 350013
  },
  "obliques": {
    "number": 33,
    "src": "images/muscles/obliques.jpg",
    "thumb": "images/muscles/t/obliques.jpg",
    "nameHe": "אלכסונים",
    "nameEn": "OBLIQUES",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 318470
  },
  "transverse_abdominis": {
    "number": 34,
    "src": "images/muscles/transverse_abdominis.jpg",
    "thumb": "images/muscles/t/transverse_abdominis.jpg",
    "nameHe": "בטן עמוקה",
    "nameEn": "TRANSVERSE ABDOMINIS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 337879
  },
  "forearm_flexors": {
    "number": 35,
    "src": "images/muscles/forearm_flexors.jpg",
    "thumb": "images/muscles/t/forearm_flexors.jpg",
    "nameHe": "כופפי אמה",
    "nameEn": "FOREARM FLEXORS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 214154
  },
  "forearm_extensors": {
    "number": 36,
    "src": "images/muscles/forearm_extensors.jpg",
    "thumb": "images/muscles/t/forearm_extensors.jpg",
    "nameHe": "פושטי אמה",
    "nameEn": "FOREARM EXTENSORS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 217454
  },
  "brachioradialis": {
    "number": 37,
    "src": "images/muscles/brachioradialis.jpg",
    "thumb": "images/muscles/t/brachioradialis.jpg",
    "nameHe": "ברכיורדיאליס",
    "nameEn": "BRACHIORADIALIS",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 213520
  },
  "chest_overview": {
    "number": 38,
    "src": "images/muscles/chest_overview.jpg",
    "thumb": "images/muscles/t/chest_overview.jpg",
    "nameHe": "חזה",
    "nameEn": "CHEST OVERVIEW",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 288278
  },
  "back_overview": {
    "number": 39,
    "src": "images/muscles/back_overview.jpg",
    "thumb": "images/muscles/t/back_overview.jpg",
    "nameHe": "גב",
    "nameEn": "BACK OVERVIEW",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 276869
  },
  "shoulders_overview": {
    "number": 40,
    "src": "images/muscles/shoulders_overview.jpg",
    "thumb": "images/muscles/t/shoulders_overview.jpg",
    "nameHe": "כתפיים",
    "nameEn": "SHOULDERS OVERVIEW",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 308237
  },
  "biceps_overview": {
    "number": 41,
    "src": "images/muscles/biceps_overview.jpg",
    "thumb": "images/muscles/t/biceps_overview.jpg",
    "nameHe": "יד קדמית",
    "nameEn": "BICEPS OVERVIEW",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 157024
  },
  "triceps_overview": {
    "number": 42,
    "src": "images/muscles/triceps_overview.jpg",
    "thumb": "images/muscles/t/triceps_overview.jpg",
    "nameHe": "יד אחורית",
    "nameEn": "TRICEPS OVERVIEW",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 148103
  },
  "legs_overview": {
    "number": 43,
    "src": "images/muscles/legs_overview.jpg",
    "thumb": "images/muscles/t/legs_overview.jpg",
    "nameHe": "רגליים",
    "nameEn": "LEGS OVERVIEW",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 246479
  },
  "abs_overview": {
    "number": 44,
    "src": "images/muscles/abs_overview.jpg",
    "thumb": "images/muscles/t/abs_overview.jpg",
    "nameHe": "בטן",
    "nameEn": "ABS OVERVIEW",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 279602
  },
  "forearms_overview": {
    "number": 45,
    "src": "images/muscles/forearms_overview.jpg",
    "thumb": "images/muscles/t/forearms_overview.jpg",
    "nameHe": "אמות",
    "nameEn": "FOREARMS OVERVIEW",
    "sourceWidth": 1254,
    "sourceHeight": 1254,
    "sizeBytes": 206500
  }
}

/** מספר הכרטיסים — 37 תת-שרירים ועוד 8 סקירות */
export const MUSCLE_CARD_COUNT = 45

/** משקל הגרסאות המלאות, בבתים */
export const MUSCLE_CARD_TOTAL_BYTES = 11696911

/** משקל הממוזערות — זה מה שנכנס ל-precache */
export const MUSCLE_CARD_THUMB_BYTES = 521195
