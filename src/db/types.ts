/**
 * מודל הנתונים של האפליקציה.
 *
 * שני עקרונות שחוזרים בכל הקובץ:
 *  1. משקל תמיד נשמר ומוצג *בדיוק* כמו שרשום על המכונה. ההכפלה ב-perSide קורית
 *     רק בחישוב נפח, בפונקציה אחת (domain/volume.ts).
 *  2. סטי חימום נשמרים ומוצגים, אבל לא נספרים בנפח, בשיאים או בהמלצות משקל.
 */

// ─── ערכי ליבה ─────────────────────────────────────────────────────────────

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'

export type Equipment = 'machine' | 'freeWeights' | 'cables' | 'bodyweight'

/**
 * total      — המספר על המכונה הוא המשקל הכולל
 * perSide    — המספר הוא לכל צד (מוצג תמיד עם התווית "כל צד", מוכפל רק לנפח)
 * bodyweight — אין משקל חיצוני
 */
export type WeightMode = 'total' | 'perSide' | 'bodyweight'

export type SetType = 'warmup' | 'work'

/**
 * במה נמדד סט.
 *
 * reps    — חזרות, וזו ברירת המחדל של כל תרגיל
 * seconds — זמן החזקה בתנוחה (פלאנק). הערך נשמר באותו שדה `SetLog.reps`
 *           ולא בשדה חדש: זה מספר החזרות של אותו סט מבחינת כל החישובים
 *           (נפח, שיאים, המלצות), ורק התצוגה שואלת מה היחידה שלו. שדה נפרד
 *           היה מחייב לפצל כל פונקציה ב-domain לשני מסלולים בלי להרוויח דבר.
 */
export type ExerciseMetric = 'reps' | 'seconds'

/**
 * 1 קל מאוד · 2 קל · 3 בינוני · 4 קשה · 5 קשה מאוד
 *
 * עד גרסה 6 הסולם היה 1–3 (קל/בינוני/קשה). מיגרציה 7 ממפה את הערכים הישנים
 * לאמצע הסולם החדש (1→2, 2→3, 3→4) כדי שההיסטוריה תשמור על המשמעות שלה.
 */
export type Rating = 1 | 2 | 3 | 4 | 5

/** חזרות שנשארו במחסנית. 4 = "4 ומעלה" */
export type Rir = 0 | 1 | 2 | 3 | 4

/**
 * A/B/C הם הפיצול המלא. F1/F2 הם שני אימוני פול-באדי מתחלפים, לחזרה הדרגתית
 * אחרי הפסקה. בכל רגע נתון פעילה תוכנית אחת מהשתיים, לפי `Routine.isActive`.
 *
 * הטיפוס היה מנייה סגורה של חמשת המזהים האלה, ולכן אימון שנבנה במסך בניית
 * האימון לא יכול היה לקבל מזהה משלו. עכשיו הוא מחרוזת, וההבחנה בין תוכנית
 * קבועה לאימון שמור עברה לשדה מפורש (`Routine.kind`) — שדה נתונים ולא צורת
 * מזהה, כדי ששום קוד לא יצטרך לנחש לפי אורך המזהה מה הוא מחזיק ביד.
 */
export type RoutineId = string

/**
 * ‏program — חמש התוכניות הקבועות (A/B/C ופול-באדי). המשתמש עורך אותן אבל
 *            לא יוצר ולא מוחק, והן אלה שמתחלפות במתג התוכניות.
 * ‏custom  — אימון שהמשתמש בנה ושמר בעצמו. תמיד "פעיל" במובן שהוא זמין
 *            להתחלה, ולעולם אינו נכנס למתג התוכניות ולא להצעת "מה היום".
 */
export type RoutineKind = 'program' | 'custom'

export interface RepRange {
  min: number
  max: number
}

// ─── קטלוג ─────────────────────────────────────────────────────────────────

export interface Exercise {
  /** מזהה קריא ויציב, למשל 'db-bench-press'. משמש גם לקישור סרטונים מצורפים. */
  id: string
  name: string
  nameEn?: string
  muscleGroup: MuscleGroup
  /**
   * השרירים שהתרגיל מעמיס בעקיפין — חתירה עובדת גם יד קדמית, לחיצה גם יד
   * אחורית. חסר או ריק = תרגיל בידוד, ואין לו עבודה משנית משמעותית.
   *
   * אופציונלי ולא חובה, מאותה סיבה כמו `metric`: רשומה שנכתבה לפני השדה,
   * או כזו שחוזרת מגיבוי ישן, חייבת להישאר תקפה. קוראים תמיד עם `?? []`.
   *
   * המספרים האלה מזינים *רק* את מסך כיסוי השרירים. הנפח, השיאים, החימום
   * ומועמדי ההחלפה ממשיכים לעבוד על `muscleGroup` בלבד — סט אחד שנספר לשני
   * שרירים היה מנפח את הנפח השבועי, ושריר שסומן כמחומם בעקיפין היה מבטל
   * את רמפת החימום שלו.
   */
  secondaryMuscles?: MuscleGroup[]
  /** מיקוד חופשי, למשל "חזה עליון", "לטיסימוס" */
  subTarget: string
  equipment: Equipment
  weightMode: WeightMode
  /** הקפיצה הקטנה ביותר האפשרית במכונה/במשקולות הזמינות */
  weightIncrementKg: number
  defaultRestSeconds: number
  targetSets: number
  targetReps: RepRange
  /**
   * במה נמדד סט של התרגיל הזה. חסר = 'reps', כדי שרשומה ותיקה תישאר תקפה.
   * כשזה 'seconds', `targetReps` הוא טווח שניות ולא טווח חזרות.
   */
  metric?: ExerciseMetric
  /** דגשי ביצוע — שורה לכל דגש */
  cues: string[]
  /**
   * הערה אישית: הגדרות המכונה, מה כאב, מה לזכור.
   *
   * נפרדת מ-`cues` בכוונה. הדגשים הם *איך מבצעים* — הם נכונים לכל אחד, ונערכים
   * במסך הקטלוג. ההערה היא *מה שאני יודע על המכונה הזו בחדר הזה*: "מושב בגובה
   * 4", "הכתף הציקה בסיבוב הקודם". היא נכתבת באמצע אימון ולכן חייבת להיות
   * במרחק נגיעה מהכרטיס, וזורמת לגיבוי בלי שינוי כי טבלת exercises מיוצאת כמו
   * שהיא.
   */
  personalNote?: string
  /** מוט/מכונת פלטות → מפעיל את מחשבון הפלטות */
  usesPlates: boolean
  /**
   * משקל הבסיס שיש להחסיר לפני חלוקה לצדדים (מוט ריק, מזחלת).
   * null = אין בסיס: המספר המוזן הוא כבר מה שנטען, ובמצב perSide הוא כבר לכל צד.
   */
  barWeightKg: number | null
  /** משקל התחלתי, בשימוש רק כשאין היסטוריה */
  seedWeightKg: number | null
  /**
   * התרגיל המקביל במאגר הלימודי, אם יש — מזהה מתוך LIBRARY_CATALOG.
   *
   * זה כל מה שצריך כדי לאחד את שני הקטלוגים: תרגיל לימוד אינו סוג ישות אחר
   * אלא תרגיל שיש לו רק חומר הסבר, ולכן הקשר ביניהם הוא שדה ולא טבלה. השדה
   * נזרע מ-LIBRARY_LINKS ומכאן והלאה נכתב מהוספת תרגיל מהמאגר לקטלוג.
   */
  libraryId?: string
  isActive: boolean
  /** סדר תצוגה בקטלוג */
  order: number
  createdAt: number
  updatedAt: number
}

export interface PlanItem {
  exerciseId: string
  order: number
  targetSets: number
  targetReps: RepRange
  restSeconds: number
  /**
   * משקל התחלה ספציפי לתוכנית הזו, בשימוש רק כשאין היסטוריה.
   * זה מה שמאפשר לאותו תרגיל להתחיל קל בתוכנית חזרה ולהתחיל כבד בפיצול.
   */
  startWeightKg: number | null
}

export interface Routine {
  id: RoutineId
  /**
   * תוכנית קבועה או אימון שהמשתמש בנה. חובה ולא אופציונלי, כדי שהקומפיילר
   * יאתר כל מקום שיוצר תוכנית — אבל *הבדיקות* בקוד נכתבות תמיד כ-
   * `kind !== 'custom'` ולא כ-`kind === 'program'`: שחזור גיבוי שנוצר לפני
   * השדה כותב את השורות כמו שהן, ורשומה בלי `kind` חייבת להתנהג כתוכנית
   * קבועה ולא להיעלם משני הצדדים.
   */
  kind: RoutineKind
  name: string
  subtitle: string
  order: number
  /** רק תוכניות פעילות מוצעות במסך הבית ומופיעות בבחירת האימון */
  isActive: boolean
  /**
   * האם להציע בלוקים נלווים לתוכנית הזו.
   * הבלוקים קיימים כדי להשלים את מה שהפיצול לא מכסה. פול-באדי כבר מכסה הכל,
   * ולכן שם הם רק היו מכפילים תרגילים ומנפחים אימון שכל מטרתו להיות קצר.
   */
  suggestBlocks: boolean
  items: PlanItem[]
}

/** בלוק נלווה שמתחבר לאימון: כתפיים, אמות, בטן */
export interface Block {
  id: string
  name: string
  order: number
  items: PlanItem[]
}

// ─── מדיה ──────────────────────────────────────────────────────────────────

/**
 * סרטון ששמור מקומית כ-Blob ב-DB המדיה.
 * שני מקורות: `bundled` (הורד מהסרטונים המצורפים לאפליקציה) ו-`imported`
 * (המשתמש ייבא קובץ מהטלפון). המזהה של bundled הוא הנתיב שלו, כדי שהורדה
 * חוזרת לא תיצור כפילויות.
 */
export interface VideoAsset {
  id: string
  exerciseId: string
  /**
   * bundled  — הדגמה מצורפת לתרגיל בתוכנית
   * library  — סרטון הסבר מהמאגר הלימודי
   * imported — סרטון שהמשתמש הוסיף בעצמו
   *
   * library נפרד מ-bundled כדי שאפשר יהיה להתקין ולמחוק את המאגר בלי לגעת
   * בהדגמות של האימון עצמו — הן הקטנות והחשובות, והוא הגדול והנלווה.
   */
  origin: 'bundled' | 'library' | 'imported'
  blob: Blob
  thumbnailBlob: Blob | null
  label: string
  durationSec: number
  sizeBytes: number
  width: number
  height: number
  createdAt: number
}

/** סרטון כפי שהנגן מקבל אותו — או מקומי או מהרשת */
export interface PlayableVideo {
  id: string
  label: string
  /** objectURL של Blob מקומי, או URL יחסי לסרטון מצורף */
  url: string
  posterUrl: string | null
  durationSec: number
  sizeBytes: number
  isLocal: boolean
}

// ─── אימונים ───────────────────────────────────────────────────────────────

export interface Substitution {
  plannedExerciseId: string
  actualExerciseId: string
  reason: 'occupied' | 'choice'
}

export interface Session {
  id: string
  routineId: RoutineId | null
  blockIds: string[]
  /** YYYY-MM-DD בזמן מקומי */
  date: string
  startedAt: number
  endedAt: number
  durationSeconds: number
  /** סדר התרגילים כפי שתוכנן */
  plannedOrder: string[]
  /** הסדר שבוצע בפועל, אחרי דילוגים והחלפות */
  actualOrder: string[]
  substitutions: Substitution[]
  /** תרגילים שנשארו בלי אף סט — כולל כאלה שפשוט לא הגעת אליהם */
  skippedExerciseIds: string[]
  /**
   * תת-קבוצה של `skippedExerciseIds`: אלה שנלחץ עליהם "דלג היום" במפורש.
   *
   * ההבחנה נחוצה כי שני המצבים נראים זהים בנתונים — אין סטים — אבל אומרים
   * דברים הפוכים. "לא הספקתי" הוא אימון שנגמר באמצע; "לא עושה את זה היום"
   * הוא החלטה. רק ההחלטה נספרת כשהאפליקציה מציעה להוציא תרגיל מהתוכנית,
   * אחרת אימון אחד שנקטע היה מסמן שבעה תרגילים כמיותרים.
   *
   * אופציונלי בכוונה: כל אימון שנשמר לפני השדה הזה, וכל גיבוי ישן, מגיעים
   * בלעדיו — והקוראים משלימים ל-`[]`.
   */
  deliberatelySkippedIds?: string[]
  /** דנורמליזציה לאינדקס multiEntry — סינון היסטוריה לפי תרגיל */
  exerciseIds: string[]
  notes: string
  /** דנורמליזציה לרשימת ההיסטוריה, לא צריך לחשב מחדש */
  totalVolumeKg: number
  totalSets: number
  totalWorkSets: number
}

export interface SetLog {
  id?: number
  sessionId: string
  exerciseId: string
  /** אינדקס הסט בתוך התרגיל באימון הזה, מ-0 */
  setIndex: number
  type: SetType
  /** בדיוק כמו שרשום על המכונה */
  weightKg: number
  reps: number
  completedAt: number
}

/** דירוג אחד לכל תרגיל בכל אימון, על הסט האחרון */
export interface ExerciseRating {
  id?: number
  sessionId: string
  exerciseId: string
  rating: Rating
  /** אופציונלי — עידון שהמשתמש בוחר להוסיף */
  rir: Rir | null
  createdAt: number
}

// ─── שיאים ─────────────────────────────────────────────────────────────────

export type PrKind =
  /** המשקל הגבוה ביותר שהורם בסט עבודה */
  | 'maxWeight'
  /** הכי הרבה חזרות במשקל השיא */
  | 'repsAtMaxWeight'
  /** לתרגילי משקל גוף — הכי הרבה חזרות בסט */
  | 'maxReps'
  /** הנפח הגבוה ביותר בתרגיל באימון אחד */
  | 'maxSessionVolume'

export interface PersonalRecord {
  exerciseId: string
  kind: PrKind
  value: number
  weightKg: number | null
  reps: number | null
  sessionId: string
  achievedAt: number
}

// ─── משקל גוף ──────────────────────────────────────────────────────────────

export interface BodyWeightEntry {
  id?: number
  /** YYYY-MM-DD */
  date: string
  weightKg: number
  note: string
  createdAt: number
}

// ─── הגדרות ────────────────────────────────────────────────────────────────

export interface PlateSettings {
  /** משקל המוט הריק */
  barWeightKg: number
  /** הפלטות הזמינות בחדר הכושר, לכל צד */
  perSideKg: number[]
}

/**
 * תיקון ידני של שיוך השריר של שורה אחת ברשימת התרגילים.
 *
 * הקיים נגזר משני מקורות שאי אפשר לערוך: קבוצת השריר של שורת מאגר מגיעה
 * מהמניפסט המג׳ונרט, וראש השריר נגזר מכרטיס השרירים (השריר בעל האחוז הגבוה
 * ביותר בקבוצה). שניהם נכונים ברוב המכריע של המקרים ושגויים בקומץ — ובקומץ
 * הזה לא הייתה שום דרך לומר "לא, זה יושב שם".
 *
 * שני השדות אופציונליים כי הם עצמאיים: אפשר לתקן רק את הראש בלי לגעת
 * בקבוצה, ולהפך. רשומה שכל שדותיה ריקים נמחקת ולא נשמרת ריקה.
 *
 * ‏`group` נשמר כאן **רק לשורת מאגר שאין לה כרטיס בקטלוג**. לשורה שיש לה
 * כרטיס, `Exercise.muscleGroup` הוא האמת היחידה — הוא מה שהנפח, החימום
 * ומועמדי ההחלפה קוראים — והתיקון נכתב לשם. שכבת-על מקבילה הייתה דורסת
 * בחזרה כל שינוי שנעשה בעורך המלא.
 */
export interface MuscleFix {
  group?: MuscleGroup
  /** תווית מ-`MUSCLE_TAXONOMY` בדיוק כפי שהיא — היא גם מפתח לכרטיס האנטומי */
  sub?: string
}

export interface AppSettings {
  defaultRestSeconds: number
  /**
   * כמה חזרות מוצעות בשדה כשאין שום נתון קודם על התרגיל.
   * ברגע שיש היסטוריה היא גוברת — הערך הזה הוא נקודת פתיחה, לא יעד.
   */
  defaultReps: number
  /**
   * כמה סטים מקבל תרגיל *חדש* שנוצר בזמן ריצה — מהמאגר הלימודי או מאפס.
   *
   * ברירת מחדל ליצירה בלבד, לא override: `Exercise.targetSets` שכבר יושב על
   * הרשומה גובר עליה תמיד, ולכן שינוי כאן לא נוגע ב-29 תרגילי הקטלוג ולא
   * באימון שכבר רץ.
   */
  defaultSets: number
  soundEnabled: boolean
  /** 0–1 */
  soundVolume: number
  wakeLockEnabled: boolean
  /** כמה אימונים בשבוע נחשבים "שבוע מלא" לצורך הרצף */
  weeklyGoal: number
  /** מכמה ימים בלי בלוק הוא נחשב "מוזנח" ומוצע אוטומטית */
  blockStaleDays: number
  /**
   * חלון הימים שמסך בניית האימון סופר בו כיסוי שרירים. 4 = היום ושלושת
   * הימים שלפניו.
   *
   * מתכוונן ולא קבוע, בדיוק כמו `blockStaleDays` שלידו: מי שמתאמן פעמיים
   * בשבוע יראה בחלון של ארבעה ימים שכל הגוף מוזנח, וזה מידע חסר תועלת.
   */
  coverageWindowDays: number
  plates: PlateSettings
  /**
   * האם לפתוח את שאלון "איך היה" (דירוג קושי) בסיום תרגיל.
   *
   * מתג ולא קבוע כי זו החלטה של יום: באימון שאין בו אנרגיה לתעד — מכבים,
   * והשאלון לא מופיע בכלל. נגיש גם ממסך האימון עצמו, לא רק מההגדרות.
   */
  askRating: boolean
  /** להציג את שורת ה-RIR אחרי הדירוג */
  askRir: boolean
  /**
   * האם לפתוח את מסך טיימר המנוחה אחרי כל סט.
   *
   * מי שמתעד מנוחה בשעון (Apple Watch) לא צריך את המסך הזה בכלל — הכיבוי
   * נעשה מתוך מסך המנוחה עצמו, וההדלקה חזרה ממסך האימון או מההגדרות.
   */
  restTimerEnabled: boolean
  confettiEnabled: boolean
  /** כפתור סט חימום בכל תרגיל, עם המלצת משקל וחזרות */
  autoWarmup: boolean
  /** אחוז ממשקל העבודה לסט החימום המוצע בתרגיל הראשון של קבוצת השריר */
  warmupPercent: number
  /**
   * סרטונים שהמשתמש מחק — לפי מזהה הנכס (`bundledId`, כלומר הנתיב שלו).
   *
   * הרשימה יושבת בהגדרות ולא במסד המדיה כי היא צריכה לשרוד מחיקה של המדיה
   * ואת ההתקנה שאחריה: סרטון מצורף שנמחק חוזר עם כל התקנה מחדש אם אין זיכרון
   * להחלטה. היא גם נכנסת לגיבוי הנתונים בחינם, כי ההגדרות מיוצאות במלואן.
   */
  hiddenVideoIds: string[]
  /**
   * תרגילים שהוסתרו מבניית האימון — "לעולם לא אעשה את זה".
   *
   * מכיל את שלישיית הזהות של כל שורה מוסתרת (מזהה קטלוג, מזהה מאגר, או
   * שניהם) כי המזהה הקנוני מתחלף כששורת מאגר מקבלת כרטיס. דגל תצוגה טהור:
   * מסנן רק את רשימות הבונה ואת "בנה לי אימון" — לא את isActive, לא
   * תוכניות ולא סטטיסטיקה. הנימוק המלא ב-hiddenExercises.ts.
   */
  hiddenExerciseIds: string[]
  /**
   * שיוך מותאם של סרטון — ממזהה נכס אל יעד תצוגה חדש.
   *
   * היעד הוא מזהה תרגיל (קטלוג או מאגר), או `group:<muscleGroup>` — מדף
   * הסרטונים של קבוצת שריר שלמה. הרשומה חיה כאן ולא במסד המדיה מאותה סיבה
   * כמו hiddenVideoIds: המניפסטים מג'ונרטים, ה-Blob-ים נמחקים ומותקנים מחדש,
   * וההחלטה "הסרטון הזה שייך לשם" חייבת לשרוד את שניהם ולהיכנס לגיבוי בחינם.
   */
  videoMoves: Record<string, string>
  /**
   * סדר תצוגה מותאם לסרטונים של הקשר אחד (תרגיל / תרגיל מאגר / קבוצה).
   *
   * המפתח הוא ההקשר, הערך הוא מזהי נכסים בסדר הרצוי. מזהה שלא ברשימה נכנס
   * אחרי הממוינים, בסדר ברירת המחדל; מזהה מת (סרטון שנמחק בייבוא מחודש)
   * פשוט לא מיושם — הרשימה סובלנית לשני הכיוונים.
   */
  videoOrder: Record<string, string[]>
  /**
   * תיקוני שיוך שריר, לפי מזהה שורה.
   *
   * אותה שלישיית זהות כמו `hiddenExerciseIds` ומאותה סיבה: המזהה הקנוני
   * מתחלף כששורת מאגר מקבלת כרטיס. הערך נכתב תחת כל אחד משלושת המזהים, כך
   * שהתיקון שורד את ההיפוך לשני הכיוונים.
   *
   * חי בהגדרות ולא בטבלה משלו כי המניפסטים מג׳ונרטים והכרטיסים מוחלפים —
   * ההכרעה "התרגיל הזה שייך לשם" חייבת לחיות מעליהם, ולהיכנס לגיבוי בחינם.
   */
  muscleFixes: Record<string, MuscleFix>
  lastBackupAt: number | null
  /** מתי הסרטונים המצורפים הותקנו למכשיר */
  videosInstalledAt: number | null
  /** האם המשתמש כבר ראה את בקשת האחסון הקבוע */
  storagePromptSeenAt: number | null
}

export interface SettingsRow {
  key: 'app'
  value: AppSettings
}

// ─── מצב אימון פעיל (התאוששות מקריסה) ──────────────────────────────────────

export type QueueItemStatus =
  /** עוד לא הגענו אליו */
  | 'pending'
  /** התרגיל הפתוח כרגע */
  | 'active'
  /** יש בו סטים והוא נסגר */
  | 'done'
  /** "המתקן תפוס" — נדחף לסוף התור וממתין */
  | 'deferred'
  /**
   * דילוג מפורש — "לא עושה את זה היום".
   * לא חוסם סיום אימון, לא נספר כבוצע, ולחיצה עליו בתור פותחת אותו מחדש.
   */
  | 'skipped'

export interface QueueItem {
  /** מזהה ייחודי לפריט בתור (תרגיל יכול להופיע פעמיים אחרי החלפה) */
  key: string
  exerciseId: string
  /** התרגיל שתוכנן במקור — שונה מ-exerciseId אחרי החלפה */
  plannedExerciseId: string
  /**
   * מאיפה הפריט הגיע. `builder` הוא תרגיל שנבחר במסך בניית האימון ונוסף
   * לאימון הזה בלבד — הבחנה מ-`routine`, שמשמעותו "זה מה שהתוכנית אמרה".
   */
  source: 'routine' | 'block' | 'builder'
  sourceId: string
  targetSets: number
  targetReps: RepRange
  restSeconds: number
  /** משקל ההתחלה של התוכנית, כשיש כזה. גובר על משקל הזריעה שבקטלוג. */
  startWeightKg: number | null
  status: QueueItemStatus
  /**
   * נלחץ "דלג היום" במפורש — להבדיל מסגירה ריקה ב"סיים תרגיל".
   *
   * שניהם מייצרים `status: 'skipped'` כי שניהם נראים אותו דבר בתור, אבל רק
   * הראשון הוא הצהרה. בלי ההפרדה, סגירה ריקה הייתה נספרת ברצף הדילוגים:
   * אימון שנקטע וכל התור נסגר ב"סיים תרגיל" היה מסמן שמונה תרגילים כמיותרים,
   * ובגלל שההצעה מוצגת בדיוק על הסף — היא כבר לא הייתה מוצגת לעולם.
   *
   * אופציונלי כי אימון פתוח שנשמר לפני השדה הזה מגיע בלעדיו.
   */
  deliberateSkip?: boolean
  /** האם כבר הוצע סט חימום לקבוצת השריר הזו בתרגיל הזה */
  warmupOffered: boolean
}

export interface DraftSet {
  /** id של השורה ב-setLogs אחרי שנשמרה */
  logId: number
  type: SetType
  weightKg: number
  reps: number
  completedAt: number
}

export interface ActiveWorkout {
  id: 'current'
  sessionId: string
  routineId: RoutineId | null
  blockIds: string[]
  startedAt: number
  queue: QueueItem[]
  /**
   * מפתח הפריט הפתוח כרגע. מפתח ולא אינדקס — כדי שגרירה, דילוג והחלפה
   * לא יזיזו את "התרגיל הנוכחי" מתחת לרגליים.
   */
  currentKey: string | null
  /** מראה בזיכרון של setLogs לאימון הזה, לפי מפתח פריט בתור */
  setsByKey: Record<string, DraftSet[]>
  ratingsByKey: Record<string, { rating: Rating; rir: Rir | null }>
  substitutions: Substitution[]
  /** חותמת סיום של טיימר המנוחה — הטיימר מחושב מולה, לא מ-setInterval */
  restEndsAt: number | null
  restTotalSeconds: number
  /** לאיזה פריט בתור שייכת המנוחה הנוכחית */
  restForKey: string | null
  notes: string
  lastSavedAt: number
}

// ─── תצוגה ─────────────────────────────────────────────────────────────────

/**
 * שמונה קבוצות, ולא תשע: "שוק" הייתה קבוצה בפני עצמה ואוחדה לתוך `legs`.
 *
 * הפיצול נראה נכון אנטומית ועבד רע בפועל. שוק הוא שריר אחד עם תרגיל אחד
 * בקטלוג ואפס תרגילים במאגר — ולכן הוא היה תמיד ובאופן קבוע "לא נגעת",
 * גם מיד אחרי אימון רגליים מלא. שורה תשיעית שבוערת בכתום לנצח אינה מידע,
 * והיא דחקה שרירים שבאמת הוזנחו למטה ברשימת "על מה לא עבדתי".
 *
 * המיקוד לא אבד: `Exercise.subTarget` של הרמת עקבים עדיין אומר "שוק —
 * תאומים", וזה מה שמוצג בכרטיס התרגיל וממיין מועמדי החלפה.
 */
export const MUSCLE_GROUPS: Record<MuscleGroup, { label: string; short: string }> = {
  chest: { label: 'חזה', short: 'חזה' },
  back: { label: 'גב', short: 'גב' },
  legs: { label: 'רגליים', short: 'רגליים' },
  shoulders: { label: 'כתפיים', short: 'כתפיים' },
  biceps: { label: 'יד קדמית', short: 'יד קד׳' },
  triceps: { label: 'יד אחורית', short: 'יד אח׳' },
  forearms: { label: 'אמות', short: 'אמות' },
  abs: { label: 'בטן', short: 'בטן' },
}

export const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
]

/**
 * מהשריר הגדול לקטן. זה הסדר שבו מציגים את ספריית התרגילים — הוא גם סדר
 * העדיפות באימון עצמו, כי שריר גדול דורש יותר אנרגיה ובא קודם.
 */
export const MUSCLE_GROUP_BY_SIZE: MuscleGroup[] = [
  'legs',
  'back',
  'chest',
  'shoulders',
  'triceps',
  'biceps',
  'abs',
  'forearms',
]

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  machine: 'מכונה',
  freeWeights: 'משקולות חופשיות',
  cables: 'כבלים',
  bodyweight: 'משקל גוף',
}

export const WEIGHT_MODE_LABELS: Record<WeightMode, string> = {
  total: 'משקל כולל',
  perSide: 'כל צד',
  bodyweight: 'משקל גוף',
}

/**
 * צבעי הדירוג. יושבים ליד התוויות כי הם אותה מערכת סימון.
 *
 * שלושה מסכים החזיקו כל אחד עותק משלו עם סטיות קטנות — flame-300 מול
 * flame-400, border-ink-600 מול 700 — ולכן אותו דירוג "בינוני" נצבע מעט שונה
 * בכל מסך. הבדל שאף אחד לא התכוון אליו ואי אפשר להסביר.
 */
export const RATING_TONES: Record<Rating, string> = {
  1: 'border-pr-400/35 bg-pr-400/12 text-pr-400',
  2: 'border-pr-400/20 bg-pr-400/6 text-pr-400',
  3: 'border-ink-700 bg-ink-800 text-bone-400',
  4: 'border-flame-500/30 bg-flame-500/10 text-flame-300',
  5: 'border-hard-400/30 bg-hard-400/10 text-hard-400',
}

export const RATING_LABELS: Record<Rating, string> = {
  1: 'קל מאוד',
  2: 'קל',
  3: 'בינוני',
  4: 'קשה',
  5: 'קשה מאוד',
}

export const RIR_LABELS: Record<Rir, string> = {
  0: 'כשל',
  1: '1',
  2: '2',
  3: '3',
  4: '4+',
}
