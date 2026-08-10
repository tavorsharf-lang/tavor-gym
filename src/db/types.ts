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
  | 'calves'

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

/** 1 קל · 2 בינוני · 3 קשה */
export type Rating = 1 | 2 | 3

/** חזרות שנשארו במחסנית. 4 = "4 ומעלה" */
export type Rir = 0 | 1 | 2 | 3 | 4

/**
 * A/B/C הם הפיצול המלא. F1/F2 הם שני אימוני פול-באדי מתחלפים, לחזרה הדרגתית
 * אחרי הפסקה. בכל רגע נתון פעילה תוכנית אחת מהשתיים, לפי `Routine.isActive`.
 */
export type RoutineId = 'A' | 'B' | 'C' | 'F1' | 'F2'

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
  /** תרגילים שנשארו בלי אף סט */
  skippedExerciseIds: string[]
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

export interface AppSettings {
  defaultRestSeconds: number
  /**
   * כמה חזרות מוצעות בשדה כשאין שום נתון קודם על התרגיל.
   * ברגע שיש היסטוריה היא גוברת — הערך הזה הוא נקודת פתיחה, לא יעד.
   */
  defaultReps: number
  soundEnabled: boolean
  /** 0–1 */
  soundVolume: number
  wakeLockEnabled: boolean
  /** כמה אימונים בשבוע נחשבים "שבוע מלא" לצורך הרצף */
  weeklyGoal: number
  /** מכמה ימים בלי בלוק הוא נחשב "מוזנח" ומוצע אוטומטית */
  blockStaleDays: number
  plates: PlateSettings
  /** להציג את שורת ה-RIR אחרי הדירוג */
  askRir: boolean
  confettiEnabled: boolean
  /** להציע סט חימום בתחילת כל קבוצת שריר */
  autoWarmup: boolean
  /** אחוז ממשקל העבודה לסט החימום המוצע */
  warmupPercent: number
  /**
   * סרטונים שהמשתמש מחק — לפי מזהה הנכס (`bundledId`, כלומר הנתיב שלו).
   *
   * הרשימה יושבת בהגדרות ולא במסד המדיה כי היא צריכה לשרוד מחיקה של המדיה
   * ואת ההתקנה שאחריה: סרטון מצורף שנמחק חוזר עם כל התקנה מחדש אם אין זיכרון
   * להחלטה. היא גם נכנסת לגיבוי הנתונים בחינם, כי ההגדרות מיוצאות במלואן.
   */
  hiddenVideoIds: string[]
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

export interface QueueItem {
  /** מזהה ייחודי לפריט בתור (תרגיל יכול להופיע פעמיים אחרי החלפה) */
  key: string
  exerciseId: string
  /** התרגיל שתוכנן במקור — שונה מ-exerciseId אחרי החלפה */
  plannedExerciseId: string
  source: 'routine' | 'block'
  sourceId: string
  targetSets: number
  targetReps: RepRange
  restSeconds: number
  /** משקל ההתחלה של התוכנית, כשיש כזה. גובר על משקל הזריעה שבקטלוג. */
  startWeightKg: number | null
  status: QueueItemStatus
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

export const MUSCLE_GROUPS: Record<MuscleGroup, { label: string; short: string }> = {
  chest: { label: 'חזה', short: 'חזה' },
  back: { label: 'גב', short: 'גב' },
  legs: { label: 'רגליים', short: 'רגליים' },
  shoulders: { label: 'כתפיים', short: 'כתפיים' },
  biceps: { label: 'יד קדמית', short: 'יד קד׳' },
  triceps: { label: 'יד אחורית', short: 'יד אח׳' },
  forearms: { label: 'אמות', short: 'אמות' },
  abs: { label: 'בטן', short: 'בטן' },
  calves: { label: 'שוק', short: 'שוק' },
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
  'calves',
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
  'calves',
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

export const RATING_LABELS: Record<Rating, string> = {
  1: 'קל',
  2: 'בינוני',
  3: 'קשה',
}

export const RIR_LABELS: Record<Rir, string> = {
  0: 'כשל',
  1: '1',
  2: '2',
  3: '3',
  4: '4+',
}
