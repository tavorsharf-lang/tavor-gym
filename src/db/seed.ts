import type { AppSettings, Block, Exercise, PlanItem, RepRange, Routine } from './types'
import { withLibraryLink } from './libraryLinks'
import { withSecondaryMuscles } from './muscleTags'

/**
 * נתוני ההתחלה — הקטלוג, שלוש התוכניות והבלוקים הנלווים.
 *
 * המשקלים הם המשקל הנוכחי של תבור ומשמשים רק כערך התחלתי, עד שיש היסטוריה.
 * מספרי הסטים, טווחי החזרות וזמני המנוחה הם ברירות מחדל סבירות — הכל ניתן
 * לעריכה במסך ההגדרות.
 *
 * מזהי התרגילים חייבים להתאים למפתחות ב-videoManifest.ts כדי שהסרטונים
 * המצורפים יתחברו לתרגיל הנכון.
 */

const now = () => Date.now()

/**
 * שני מספרים שחלים על *כל* תרגיל, ולא לפי תרגיל.
 *
 * הם אחידים בכוונה. תבור רוצה להיכנס לכל תרגיל עם אותה ציפייה ולשנות אותה
 * במקום כשהיא לא מתאימה — שני סטים ושתי דקות מנוחה — ולא לזכור שלכל תרגיל
 * יש מספר משלו. שניהם ניתנים לשינוי בשלוש רמות: בהגדרות, בעורך התוכניות,
 * ותוך כדי אימון על כרטיס התרגיל עצמו.
 */
export const DEFAULT_TARGET_SETS = 2
export const DEFAULT_REST_SECONDS = 120

/** כמה חזרות מוצעות כשאין שום היסטוריה על התרגיל */
export const DEFAULT_REPS = 6

/** היעד של הפלאנק — 1:15. נמדד בשניות, ולכן טווח סגור על מספר אחד. */
export const PLANK_RANGE: RepRange = { min: 75, max: 75 }

type ExerciseSeed = Omit<Exercise, 'createdAt' | 'updatedAt' | 'isActive' | 'order'>

const reps = (min: number, max: number): RepRange => ({ min, max })

const RAW: ExerciseSeed[] = [
  // ═══ אימון A — חזה ויד אחורית ═══
  {
    id: 'pushup',
    name: 'שכיבות סמיכה',
    nameEn: 'Push-Up',
    muscleGroup: 'chest',
    subTarget: 'חזה, טריצפס, כתף קדמית',
    equipment: 'bodyweight',
    weightMode: 'bodyweight',
    weightIncrementKg: 0,
    defaultRestSeconds: 45,
    targetSets: 2,
    targetReps: reps(10, 20),
    cues: [
      'כפות ידיים מעט רחבות מרוחב הכתפיים',
      'גוף בקו ישר — בטן ועכוז נעולים',
      'מרפקים ב-45 מעלות מהגוף, לא מפושקים לצדדים',
      'לרדת עד שהחזה כמעט נוגע ברצפה',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: null,
  },
  {
    id: 'db-bench-press',
    name: 'לחיצת חזה במוט — שיפוע חיובי ושטוח',
    nameEn: 'Barbell Bench Press (Incline & Flat)',
    muscleGroup: 'chest',
    subTarget: 'חזה עליון ותחתון',
    equipment: 'freeWeights',
    weightMode: 'perSide',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 120,
    targetSets: 4,
    targetReps: reps(8, 12),
    cues: [
      'שכמות נעוצות במשענת לאורך כל הסט',
      'קשת קלה בגב התחתון, ישבן נשאר על הספסל',
      'להוריד עד גובה החזה, לא נמוך יותר',
      'למעלה לא לנעול מרפקים — לשמור מתח',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 22.5,
  },
  {
    id: 'decline-machine-press',
    name: 'לחיצת חזה במכונה',
    nameEn: 'Machine Chest Press',
    muscleGroup: 'chest',
    subTarget: 'חזה אמצעי-תחתון',
    equipment: 'machine',
    weightMode: 'perSide',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 120,
    targetSets: 4,
    targetReps: reps(8, 12),
    cues: [
      'לכוון את גובה המושב כך שהידיות בגובה הפטמה',
      'לדחוף מהחזה, לא מהכתפיים',
      'לעצור רגע בנקודה הקצרה ולסחוט',
      'לחזור לאט — 2 שניות בירידה',
    ],
    usesPlates: true,
    barWeightKg: null,
    seedWeightKg: 25,
  },
  {
    id: 'dips',
    name: 'מקבילים במכונה',
    nameEn: 'Plate-Loaded Triceps Dips',
    muscleGroup: 'chest',
    subTarget: 'טריצפס וחזה תחתון',
    equipment: 'machine',
    weightMode: 'perSide',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 120,
    targetSets: 4,
    targetReps: reps(8, 12),
    cues: [
      'גוף זקוף ומרפקים צמודים לצדדים — ככה העומס נשאר על הטריצפס',
      'הטיה קדימה מעבירה חלק מהעומס לחזה התחתון',
      'לרדת עד שהכתף בגובה המרפק, לא נמוך',
      'לא לנעול מרפקים למעלה',
    ],
    usesPlates: true,
    barWeightKg: null,
    seedWeightKg: 40,
  },
  {
    id: 'decline-pec-fly',
    name: 'פרפר במכונה בשיפוע שלילי',
    nameEn: 'Decline Machine Pec Fly',
    muscleGroup: 'chest',
    subTarget: 'חזה',
    equipment: 'machine',
    weightMode: 'perSide',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 75,
    targetSets: 3,
    targetReps: reps(10, 15),
    cues: [
      'מרפקים כפופים קלות וקבועים — התנועה מהכתף',
      'לסחוט את החזה בסוף, שנייה שלמה',
      'לפתוח לאט, למתוח בלי לאבד שליטה',
      'שכמות נשארות מקובעות',
    ],
    usesPlates: true,
    barWeightKg: null,
    seedWeightKg: 15,
  },
  {
    id: 'bench-machine-press',
    name: 'לחיצת חזה במכונה',
    nameEn: 'Machine Bench Press',
    muscleGroup: 'chest',
    subTarget: 'חזה',
    equipment: 'machine',
    weightMode: 'perSide',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 90,
    targetSets: 3,
    targetReps: reps(10, 15),
    cues: [
      'מסלול קבוע — לנצל את זה כדי לדחוף לכשל בבטחה',
      'לא להרים את הכתפיים לכיוון האוזניים',
      'טווח מלא, בלי חצי חזרות',
    ],
    usesPlates: true,
    barWeightKg: null,
    seedWeightKg: 10,
  },
  {
    id: 'overhead-tricep-ext',
    name: 'פשיטת מרפקים מעל הראש בכבל',
    nameEn: 'Overhead Cable Triceps Extension',
    muscleGroup: 'triceps',
    subTarget: 'טריצפס — ראש ארוך',
    equipment: 'cables',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 90,
    targetSets: 3,
    targetReps: reps(10, 15),
    cues: [
      'מרפקים צמודים לראש ולא זזים — רק האמות נעות',
      'למתוח עמוק מאחורי הראש, שם הראש הארוך עובד',
      'להתרחק מהמכונה כדי לשמור מתח לאורך כל הטווח',
      'לא לפשק מרפקים החוצה כשמתעייפים',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 52,
  },
  {
    id: 'cable-tricep-pushdown',
    name: 'פשיטת מרפקים בפולי עם מוט ישר',
    nameEn: 'Cable Triceps Pushdown (Straight Bar)',
    muscleGroup: 'triceps',
    subTarget: 'טריצפס',
    equipment: 'cables',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 75,
    targetSets: 3,
    targetReps: reps(10, 15),
    cues: [
      'מרפקים נעולים לצדי הגוף',
      'לנעול את המרפק בסוף התנועה ולסחוט',
      'לא להישען קדימה כדי לעזור עם משקל הגוף',
      'לחזור למעלה בשליטה, בלי לתת למשקל למשוך',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 51,
  },
  {
    id: 'cross-cable-tricep',
    name: 'פשיטת מרפק בכבל חוצה גוף',
    nameEn: 'Cross-Body Cable Triceps Extension',
    muscleGroup: 'triceps',
    subTarget: 'טריצפס',
    equipment: 'cables',
    weightMode: 'perSide',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 75,
    targetSets: 3,
    targetReps: reps(12, 15),
    cues: [
      'לעמוד במרכז, כבל אחד בכל יד, ידיים מוצלבות',
      'מרפקים גבוהים וקבועים',
      'לפתוח לצדדים ולסחוט בסוף',
      'תרגיל גימור — לרדת במשקל ולהתמקד בתחושה',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 15,
  },

  // ═══ אימון B — גב ויד קדמית ═══
  {
    id: 'lat-pulldown',
    name: 'משיכת פולי עליון',
    nameEn: 'Lat Pulldown',
    muscleGroup: 'back',
    subTarget: 'לטיסימוס',
    equipment: 'cables',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 120,
    targetSets: 4,
    targetReps: reps(8, 12),
    cues: [
      'להתחיל מהורדת השכמות, רק אחר כך לכופף מרפקים',
      'למשוך את המוט לחלק העליון של החזה',
      'חזה למעלה, הטיה קלה לאחור — לא להתנדנד',
      'למעלה למתוח מלא ולהרגיש את הלט נפתח',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 78,
  },
  {
    id: 'seated-row-heavy',
    name: 'חתירה במכונה',
    nameEn: 'Machine Row',
    muscleGroup: 'back',
    subTarget: 'לטיסימוס ואמצע גב',
    equipment: 'machine',
    weightMode: 'perSide',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 120,
    targetSets: 4,
    targetReps: reps(8, 12),
    cues: [
      'חזה נשען, גב ניטרלי לאורך כל הסט',
      'למשוך עם המרפקים אחורה וצמוד לגוף',
      'לסחוט שכמות בסוף התנועה',
      'לא לתת לגוף להתנדנד קדימה ואחורה',
    ],
    usesPlates: true,
    barWeightKg: null,
    seedWeightKg: 60,
  },
  {
    id: 'seated-row-light',
    name: 'חתירה במכונה',
    nameEn: 'Machine Row',
    muscleGroup: 'back',
    subTarget: 'לטיסימוס ואמצע גב',
    equipment: 'machine',
    weightMode: 'perSide',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 100,
    targetSets: 3,
    targetReps: reps(10, 12),
    cues: [
      'אחיזה או זווית שונה מהחתירה הראשונה',
      'טווח מלא — למתוח קדימה בין החזרות',
      'קצב איטי יותר, להרגיש את השריר',
    ],
    usesPlates: true,
    barWeightKg: null,
    seedWeightKg: 50,
  },
  {
    id: 'low-row-rack',
    name: 'חתירה בכבל בישיבה',
    nameEn: 'Seated Cable Row',
    muscleGroup: 'back',
    subTarget: 'לטיסימוס תחתון',
    equipment: 'cables',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 100,
    targetSets: 3,
    targetReps: reps(10, 12),
    cues: [
      'למשוך לכיוון הבטן התחתונה, לא לחזה',
      'מרפקים צמודים — זה מה שמדגיש את הלט התחתון',
      'גב ישר, בלי לעגל בסוף המתיחה',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 58,
  },
  {
    id: 'preacher-curl',
    name: 'כפיפת מרפקים בספה',
    nameEn: 'Preacher Curl',
    muscleGroup: 'biceps',
    subTarget: 'ביצפס',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 75,
    targetSets: 3,
    targetReps: reps(10, 15),
    cues: [
      'בית שחי צמוד לכרית, לא מחליק',
      'לרדת עד מתיחה כמעט מלאה — שם הצמיחה',
      'לא לנוח למעלה, לשמור מתח',
      'לעצור שנייה בתחתית לפני שעולים',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 32,
  },
  {
    id: 'hammer-curl',
    name: 'כפיפת פטיש',
    nameEn: 'Hammer Curl',
    muscleGroup: 'biceps',
    subTarget: 'ביצפס וברכיורדיאליס',
    equipment: 'freeWeights',
    weightMode: 'total',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 75,
    targetSets: 3,
    targetReps: reps(10, 15),
    cues: [
      'אחיזה ניטרלית — אגודלים למעלה כל הזמן',
      'מרפקים צמודים לגוף ולא זזים קדימה',
      'לרדת בשליטה מלאה, בלי להפיל',
      'אפשר לסירוגין כדי לשמור על טכניקה',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 17.5,
  },
  {
    id: 'behind-body-cable-curl',
    name: 'כפיפת מרפקים בכבל עם מרפקים מאחורי הגוף',
    nameEn: 'Behind-the-Body Cable Curl',
    muscleGroup: 'biceps',
    subTarget: 'ביצפס — ראש ארוך',
    equipment: 'cables',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 75,
    targetSets: 3,
    targetReps: reps(12, 15),
    cues: [
      'לעמוד לפני הפולי כך שהמרפקים מאחורי קו הגוף',
      'המתיחה הזו היא כל התרגיל — לא לקצר',
      'מרפקים קבועים, רק האמה עולה',
      'משקל נמוך, תחושה גבוהה',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 55,
  },

  // ═══ אימון C — רגליים ═══
  {
    id: 'leg-press',
    name: 'לחיצת רגליים',
    nameEn: 'Leg Press',
    muscleGroup: 'legs',
    subTarget: 'קוואדריצפס',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 150,
    targetSets: 4,
    targetReps: reps(8, 12),
    cues: [
      'רגליים ברוחב כתפיים באמצע המשטח',
      'לרדת עד 90 מעלות בברך — בלי שהאגן מתגלגל',
      'לדחוף מהעקבים',
      'לא לנעול ברכיים למעלה',
    ],
    usesPlates: true,
    barWeightKg: 0,
    seedWeightKg: 160,
  },
  {
    id: 'calf-raise',
    name: 'הרמת עקבים',
    nameEn: 'Calf Raise',
    muscleGroup: 'calves',
    subTarget: 'שוק — תאומים',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 60,
    targetSets: 4,
    targetReps: reps(12, 20),
    cues: [
      'לרדת עד מתיחה מלאה בעקב',
      'לעצור שנייה למעלה על קצות האצבעות',
      'ברך כמעט ישרה — לא לקפוץ',
      'קצב איטי, זה שריר שדורש זמן תחת מתח',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 180,
  },
  {
    id: 'machine-squat',
    name: 'סקוואט במכונה',
    nameEn: 'Machine Squat / Hack Squat',
    muscleGroup: 'legs',
    subTarget: 'קוואדריצפס וגלוטאוס',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 150,
    targetSets: 4,
    targetReps: reps(8, 12),
    cues: [
      'רגליים ברוחב כתפיים, אצבעות מעט החוצה',
      'לרדת עד שהירך מקבילה לרצפה',
      'ברכיים בקו האצבעות, לא נכנסות פנימה',
      'ליבה נעולה לאורך כל החזרה',
    ],
    usesPlates: true,
    barWeightKg: 0,
    seedWeightKg: 120,
  },
  {
    id: 'leg-curl',
    name: 'כפיפת ברכיים בישיבה',
    nameEn: 'Seated Leg Curl',
    muscleGroup: 'legs',
    subTarget: 'המסטרינג',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 90,
    targetSets: 3,
    targetReps: reps(10, 15),
    cues: [
      'ציר הברך מיושר עם ציר המכונה',
      'לסחוט בסוף הכפיפה, שנייה',
      'לחזור לאט מאוד — הפאזה השלילית היא העיקר כאן',
      'אגן צמוד לכרית, לא מתרומם',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 115,
  },
  {
    id: 'leg-extension',
    name: 'פשיטת ברכיים',
    nameEn: 'Leg Extension',
    muscleGroup: 'legs',
    subTarget: 'קוואדריצפס',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 90,
    targetSets: 3,
    targetReps: reps(12, 15),
    cues: [
      'לנעול את הברכיים למעלה ולסחוט שנייה',
      'לרדת בשליטה, בלי להפיל את המשקל',
      'להיצמד למשענת — לא להתנדנד',
      'תרגיל גימור, לא צריך לשבור שיאים',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: null,
  },

  // ═══ בלוק כתפיים ═══
  {
    id: 'machine-shoulder-press',
    name: 'לחיצת כתפיים במכונה',
    nameEn: 'Machine Shoulder Press',
    muscleGroup: 'shoulders',
    subTarget: 'דלתא קדמי',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 100,
    targetSets: 4,
    targetReps: reps(8, 12),
    cues: [
      'לכוון מושב כך שהידיות בגובה הכתף',
      'לא לנעול מרפקים למעלה',
      'ליבה נעולה, בלי קשת בגב התחתון',
      'לרדת עד שהמרפק מעט מתחת לכתף',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 45,
  },
  {
    id: 'lateral-raise',
    name: 'הרמת ידיים לצדדים',
    nameEn: 'Lateral Raise',
    muscleGroup: 'shoulders',
    subTarget: 'דלתא צדי',
    equipment: 'freeWeights',
    weightMode: 'perSide',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 60,
    targetSets: 3,
    targetReps: reps(12, 20),
    cues: [
      'להוביל עם המרפק, לא עם כף היד',
      'להרים עד גובה הכתף בלבד',
      'הטיה קלה קדימה, כמו למזוג מים',
      'משקל קטן — ברגע שיש תנופה, זה כבר לא הדלתא',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 12.5,
  },
  {
    id: 'shrugs',
    name: 'הרמת כתפיים עם דאמבלים',
    nameEn: 'Dumbbell Shrug',
    muscleGroup: 'shoulders',
    subTarget: 'טרפזים',
    equipment: 'freeWeights',
    weightMode: 'total',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 60,
    targetSets: 3,
    targetReps: reps(12, 15),
    cues: [
      'למשוך ישר למעלה לכיוון האוזניים',
      'לא לסובב את הכתפיים במעגל',
      'לעצור שנייה למעלה',
      'ידיים רק מחזיקות — לא מכופפות',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: 20,
  },
  {
    id: 'reverse-machine-fly',
    name: 'פרפר הפוך במכונה',
    nameEn: 'Reverse Pec Deck (Rear Delt Fly)',
    muscleGroup: 'shoulders',
    subTarget: 'דלתא אחורי',
    equipment: 'machine',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 60,
    targetSets: 3,
    targetReps: reps(12, 20),
    cues: [
      'חזה צמוד לכרית',
      'מרפקים כפופים קלות וקבועים',
      'לפתוח אחורה עד קו הגוף ולסחוט',
      'לא לכווץ שכמות — התנועה מהכתף האחורית',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: null,
  },

  // ═══ בלוק אמות ═══
  {
    id: 'forearm-straight-bar',
    name: 'כפיפות שורש כף יד בכבל עם מוט ישר',
    nameEn: 'Cable Wrist Curl (Straight Bar)',
    muscleGroup: 'forearms',
    subTarget: 'אמות — כופפים ופושטים',
    equipment: 'cables',
    weightMode: 'total',
    weightIncrementKg: 5,
    defaultRestSeconds: 60,
    targetSets: 3,
    targetReps: reps(12, 20),
    cues: [
      'רק שורש כף היד נע, המרפק קבוע',
      'לפתוח את האצבעות בתחתית ולגלגל חזרה',
      'טווח מלא, איטי',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: null,
  },
  {
    id: 'forearm-dumbbell',
    name: 'כפיפות שורש כף יד עם דאמבלים',
    nameEn: 'Dumbbell Wrist Curl',
    muscleGroup: 'forearms',
    subTarget: 'אמות',
    equipment: 'freeWeights',
    weightMode: 'total',
    weightIncrementKg: 2.5,
    defaultRestSeconds: 60,
    targetSets: 3,
    targetReps: reps(12, 20),
    cues: [
      'אמות נשענות על הברכיים או על ספסל',
      'לרדת עד מתיחה מלאה',
      'לעשות גם כיוון הפוך לפושטים',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: null,
  },

  // ═══ בלוק בטן ═══
  {
    id: 'abs',
    name: 'פלאנק',
    nameEn: 'Plank',
    muscleGroup: 'abs',
    subTarget: 'core — בטן',
    equipment: 'bodyweight',
    weightMode: 'bodyweight',
    weightIncrementKg: 0,
    defaultRestSeconds: 60,
    targetSets: 3,
    // פלאנק נמדד בזמן החזקה ולא בתנועות. היעד הוא 1:15, והטווח סגור בכוונה
    // על מספר אחד: זו לא "עוד חזרה אם אפשר" אלא שעון שרצים מולו.
    metric: 'seconds',
    targetReps: { ...PLANK_RANGE },
    cues: [
      'מרפקים מתחת לכתפיים, אמות על הרצפה',
      'גוף בקו ישר מהעקב עד הראש — אגן לא נופל ולא מתרומם',
      'בטן ועכוז נעולים, נשימה רגילה',
      'מודדים כמה זמן החזקת — לא כמה תנועות עשית',
    ],
    usesPlates: false,
    barWeightKg: null,
    seedWeightKg: null,
  },
]

// withLibraryLink ו-withSecondaryMuscles כאן ולא ב-populate: SEED_EXERCISES
// נכתב גם בהשלמת זריעה שנכשלה וגם באיפוס יזום, ובשלושת המסלולים הרשומה צריכה
// לצאת זהה. התיוג המשני חייב לעבור כאן במיוחד — מיגרציה 8 שותלת אותו רק
// בשדרוג, ולכן בלי השורה הזו דווקא התקנה חדשה הייתה נשארת בלי שום תגית.
export const SEED_EXERCISES: Exercise[] = RAW.map((e, i) =>
  withSecondaryMuscles(
  withLibraryLink({
    ...e,
    // הסטים והמנוחה נכפים כאן ולא נכתבים בכל רשומה — כך אי אפשר להוסיף תרגיל
    // חדש ולשכוח ליישר אותו, והמספרים שב-RAW נשארים תיעוד של המקור
    targetSets: DEFAULT_TARGET_SETS,
    defaultRestSeconds: DEFAULT_REST_SECONDS,
    isActive: true,
    order: i,
    createdAt: now(),
    updatedAt: now(),
  })
  )
)

/** בונה פריט תוכנית מברירות המחדל של התרגיל */
function item(exerciseId: string, order: number): PlanItem {
  const ex = RAW.find((e) => e.id === exerciseId)
  if (!ex) throw new Error(`seed: תרגיל לא קיים — ${exerciseId}`)
  return {
    exerciseId,
    order,
    targetSets: DEFAULT_TARGET_SETS,
    targetReps: { ...ex.targetReps },
    restSeconds: DEFAULT_REST_SECONDS,
    startWeightKg: null,
  }
}

const plan = (ids: string[]): PlanItem[] => ids.map((id, i) => item(id, i))

/**
 * פריט לתוכנית החזרה: פחות סטים, יותר חזרות, ומשקל התחלה מופחת.
 *
 * @param ratio אחוז ממשקל הזריעה. 0.6 אחרי הפסקה ארוכה זו נקודת פתיחה
 *   שמרגישה קלה מדי בכוונה — הגוף מקדים את הגידים, וזה מה שמונע פציעה.
 */
function comebackItem(
  exerciseId: string,
  order: number,
  reps: RepRange,
  ratio: number
): PlanItem {
  const ex = RAW.find((e) => e.id === exerciseId)
  if (!ex) throw new Error(`seed: תרגיל לא קיים — ${exerciseId}`)
  const inc = ex.weightIncrementKg > 0 ? ex.weightIncrementKg : 2.5
  const start =
    ex.seedWeightKg === null
      ? null
      : Math.max(inc, Math.round((ex.seedWeightKg * ratio) / inc) * inc)
  return {
    exerciseId,
    order,
    targetSets: DEFAULT_TARGET_SETS,
    targetReps: { ...reps },
    restSeconds: DEFAULT_REST_SECONDS,
    startWeightKg: start,
  }
}

/**
 * שתי תוכניות פול-באדי מתחלפות, לחזרה הדרגתית אחרי הפסקה.
 *
 * העקרונות: תרגיל אחד לכל שריר קטן ושניים לגדולים, טווח חזרות גבוה יותר
 * (10–15) שמעמיס פחות על המפרקים, ומשקל התחלה של כ-60% מהמשקל הקודם. שני
 * האימונים מכסים את אותם השרירים בתרגילים שונים, כדי שאפשר יהיה להתאמן
 * פעמיים-שלוש בשבוע בלי לחזור על עצמו.
 *
 * אין כאן תרגיל חימום קבוע בראש התוכנית. חימום נקשר לשריר ולא לאימון: שכיבות
 * סמיכה מחממות חזה ולא עושות כלום לרגליים, ולכן ההצעה מגיעה מ-`domain/warmup`
 * ברגע שנפתחת קבוצת שריר חדשה — עם משקל מופחת של אותו תרגיל שעומדים לעשות.
 */
const R = { min: 10, max: 15 } as const
const R_LOW = { min: 10, max: 12 } as const
const R_HIGH = { min: 12, max: 20 } as const

export const SEED_ROUTINES: Routine[] = [
  {
    id: 'F1',
    kind: 'program',
    name: 'פול באדי א׳',
    subtitle: 'כל הגוף — חזרה הדרגתית',
    order: 0,
    isActive: true,
    suggestBlocks: false,
    items: [
      comebackItem('leg-press', 0, R_LOW, 0.6),
      comebackItem('lat-pulldown', 1, R_LOW, 0.6),
      comebackItem('decline-machine-press', 2, R_LOW, 0.6),
      comebackItem('leg-curl', 3, R, 0.6),
      comebackItem('machine-shoulder-press', 4, R, 0.6),
      comebackItem('preacher-curl', 5, R, 0.6),
      comebackItem('cable-tricep-pushdown', 6, R, 0.6),
      comebackItem('abs', 7, PLANK_RANGE, 1),
    ],
  },
  {
    id: 'F2',
    kind: 'program',
    name: 'פול באדי ב׳',
    subtitle: 'כל הגוף — וריאציה שנייה',
    order: 1,
    isActive: true,
    suggestBlocks: false,
    items: [
      comebackItem('machine-squat', 0, R_LOW, 0.6),
      comebackItem('seated-row-heavy', 1, R_LOW, 0.6),
      comebackItem('db-bench-press', 2, R_LOW, 0.6),
      comebackItem('leg-extension', 3, R, 0.6),
      comebackItem('lateral-raise', 4, R_HIGH, 0.6),
      comebackItem('hammer-curl', 5, R, 0.6),
      comebackItem('cross-cable-tricep', 6, R, 0.6),
      comebackItem('calf-raise', 7, R_HIGH, 0.6),
    ],
  },
  {
    id: 'A',
    kind: 'program',
    name: 'אימון A',
    subtitle: 'חזה ויד אחורית',
    order: 2,
    isActive: false,
    suggestBlocks: true,
    items: plan([
      'pushup',
      'db-bench-press',
      'decline-machine-press',
      'dips',
      'decline-pec-fly',
      'bench-machine-press',
      'overhead-tricep-ext',
      'cable-tricep-pushdown',
      'cross-cable-tricep',
    ]),
  },
  {
    id: 'B',
    kind: 'program',
    name: 'אימון B',
    subtitle: 'גב ויד קדמית',
    order: 3,
    isActive: false,
    suggestBlocks: true,
    items: plan([
      'lat-pulldown',
      'seated-row-heavy',
      'seated-row-light',
      'low-row-rack',
      'preacher-curl',
      'hammer-curl',
      'behind-body-cable-curl',
    ]),
  },
  {
    id: 'C',
    kind: 'program',
    name: 'אימון C',
    subtitle: 'רגליים',
    order: 4,
    isActive: false,
    suggestBlocks: true,
    items: plan([
      'leg-press',
      'calf-raise',
      'machine-squat',
      'leg-curl',
      'leg-extension',
    ]),
  },
]

export const SEED_BLOCKS: Block[] = [
  {
    id: 'shoulders',
    name: 'כתפיים',
    order: 0,
    items: plan([
      'machine-shoulder-press',
      'lateral-raise',
      'shrugs',
      'reverse-machine-fly',
    ]),
  },
  {
    id: 'forearms',
    name: 'אמות',
    order: 1,
    items: plan(['forearm-straight-bar', 'forearm-dumbbell']),
  },
  {
    id: 'abs',
    name: 'בטן',
    order: 2,
    items: plan(['abs']),
  },
]

export const DEFAULT_SETTINGS: AppSettings = {
  defaultRestSeconds: DEFAULT_REST_SECONDS,
  defaultReps: DEFAULT_REPS,
  soundEnabled: true,
  soundVolume: 0.8,
  wakeLockEnabled: true,
  weeklyGoal: 3,
  blockStaleDays: 7,
  coverageWindowDays: 4,
  plates: {
    barWeightKg: 20,
    perSideKg: [20, 15, 10, 5, 2.5, 1.25],
  },
  askRating: true,
  askRir: true,
  restTimerEnabled: true,
  confettiEnabled: true,
  autoWarmup: true,
  warmupPercent: 55,
  hiddenVideoIds: [],
  hiddenExerciseIds: [],
  videoMoves: {},
  videoOrder: {},
  lastBackupAt: null,
  videosInstalledAt: null,
  storagePromptSeenAt: null,
}
