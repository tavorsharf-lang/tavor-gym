#!/usr/bin/env node
/**
 * ייבוא ודחיסה של סרטוני ההדגמה.
 *
 * שני מקורות:
 *   א. "תוכנית אימונים (workout-program)" — הדגמות לתרגילי התוכנית, לפי המיפוי למטה.
 *      כל הסרטונים נכנסים, ויוצאים ל-videoManifest.ts.
 *   ב. "מאגר תרגילים (exercise-library)" — מאגר לימודי של 62 תרגילים.
 *      נכנסים רק LIB_MAX הראשונים בכל תרגיל, ויוצאים ל-libraryManifest.ts.
 *
 * מה זה עושה לכל סרטון:
 *   1. דוחס ל-720px צד ארוך, בלי אודיו, H.264 crf 30, faststart
 *   2. מייצר poster JPG מהשנייה הראשונה
 *   3. כותב public/videos/<id>-NN.mp4 + .jpg
 *
 * למה יש תקרה על המאגר ואין על התוכנית: 489 סרטוני המאגר שוקלים כ-390MB דחוסים,
 * וזה הופך את הבנייה והפריסה לבלתי סבירות. הסרטונים בכל תרגיל ממוינים במקור לפי
 * מספר צפיות, ולכן הראשונים הם גם הטובים ביותר. השאר נשארים נגישים דרך הקישור
 * המקורי שנשמר במניפסט.
 *
 * הרצה: npm run import:videos
 * דורש ffmpeg (brew install ffmpeg).
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, writeFileSync, existsSync, statSync, rmSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = '/Users/tavorsharf/projects/תוכנית אימונים (workout-program)'
const LIB_SOURCE = '/Users/tavorsharf/projects/מאגר תרגילים (exercise-library)'
const OUT_DIR = join(ROOT, 'public', 'videos')
const LIB_OUT_DIR = join(OUT_DIR, 'lib')
const MANIFEST = join(ROOT, 'src', 'db', 'videoManifest.ts')
const LIB_MANIFEST = join(ROOT, 'src', 'db', 'libraryManifest.ts')

/**
 * כמה סרטונים לכל תרגיל במאגר נכנסים לבנייה. Infinity = הכל.
 *
 * היה כאן 3 מטעמי משקל, ותבור ביקש במפורש את כל החומר. המחיר מודע: 487 סרטונים
 * במקום 155, כ-184MB במקום 57MB בבנייה ובהיסטוריית git. אם צריך לחזור אחורה —
 * זה המספר היחיד שצריך לשנות, והייבוא בונה הכל מחדש.
 */
const LIB_MAX = Number.POSITIVE_INFINITY

/**
 * סרטונים שהמקור מפרסם יותר מפעם אחת.
 *
 * המאגר מכיל את אותו קליפ בדיוק תחת שתי כתובות שונות — לפעמים באותו תרגיל
 * ולפעמים בין תרגיל התוכנית לתרגיל המאגר המקביל. שם הקובץ שונה והבייטים שונים
 * (קידוד אחר), ולכן השוואת md5 לא תופסת את זה. הרשימה כאן נבנתה מהשוואה
 * תפיסתית: שמונה פריימים בפריסה אחידה מכל סרטון, dHash לכל פריים, וזוגות
 * במרחק המינג ממוצע נמוך. כל זוג נבדק גם בעין מול פריימים לפני שנכנס לכאן.
 *
 * למה כאן ולא רק במחיקת הקבצים: המניפסטים נוצרים אוטומטית מהסקריפט הזה, ולכן
 * `npm run import:videos` היה מחזיר את הכפילויות בהרצה הבאה.
 *
 * הכתובת שנשארת בכל זוג היא זו שכבר מותקנת אצל המשתמש — הדגמת התוכנית קודמת
 * לסרטון המאגר, ובתוך המאגר נשמר המופע המוקדם יותר.
 */
const DUPLICATE_URLS = new Set([
  'https://www.tiktok.com/@deltabolic/video/7229117703041174790',
  'https://www.tiktok.com/@deltabolic/video/7230619955937561862',
  'https://www.tiktok.com/@deltabolic/video/7244334326920400133',
  'https://www.tiktok.com/@deltabolic/video/7328124394126068997',
  'https://www.tiktok.com/@deltabolic/video/7560124224904416513',
  'https://www.tiktok.com/@deltabolic/video/7567933458475928840',
  'https://www.tiktok.com/@deltabolic/video/7575749385187904769',
  'https://www.tiktok.com/@deltabolic/video/7580540364319132945',
  'https://www.tiktok.com/@deltabolic/video/7580924307560254736',
  'https://www.tiktok.com/@deltabolic/video/7581633130717531409',
  'https://www.tiktok.com/@deltabolic/video/7585770367348673793',
  'https://www.tiktok.com/@deltabolic/video/7586860337199090960',
  'https://www.tiktok.com/@deltabolic/video/7600597121871531280',
  'https://www.tiktok.com/@deltabolic/video/7602436025993989393',
  'https://www.tiktok.com/@deltabolic/video/7610208047830437137',
  'https://www.tiktok.com/@deltabolic/video/7612098282692611345',
  'https://www.tiktok.com/@deltabolic/video/7615013821366816017',
  'https://www.tiktok.com/@deltabolic/video/7622766689603685633',
  'https://www.tiktok.com/@deltabolic/video/7622835195439320337',
  'https://www.tiktok.com/@deltabolic/video/7623915507929959697',
  'https://www.tiktok.com/@deltabolic/video/7624689912972889345',
  'https://www.tiktok.com/@deltabolic/video/7625058981471472913',
  'https://www.tiktok.com/@deltabolic/video/7627614725223812369',
  'https://www.tiktok.com/@deltabolic/video/7627989099143597329',
  'https://www.tiktok.com/@deltabolic/video/7635387543650913537',
  'https://www.tiktok.com/@deltabolic/video/7635443784578387217',
  'https://www.tiktok.com/@deltabolic/video/7636116644674161921',
  'https://www.tiktok.com/@deltabolic/video/7636159246161169665',
  'https://www.tiktok.com/@deltabolic/video/7636953632805506320',
  'https://www.tiktok.com/@deltabolic/video/7643944699027328273',
  'https://www.tiktok.com/@deltabolic/video/7651794944499240193',
  'https://www.tiktok.com/@deltabolic/video/7666620266960801040',
  'https://www.tiktok.com/@deltabolic/video/7669146131384782096',

  // סבב שני (אודיט המאגר). אותה שיטה — dHash על שמונה פריימים בפריסה אחידה,
  // וכל זוג אומת בעין מול פריימים לפני שנכנס לכאן. שבעה מהם היו גם *וגם*:
  // אותו קליף בדיוק, ובנוסף אחד העותקים ישב תחת תרגיל שגוי. הכתובת שנשארת
  // היא זו שיושבת בתרגיל הנכון; בזוג שבו שני העותקים באותו תרגיל נשמר
  // המופע המוקדם יותר, כמו בסבב הראשון.
  'https://www.tiktok.com/@deltabolic/video/7575350536535379216', // חתירה בכבל, ישב תחת פרפר הפוך
  'https://www.tiktok.com/@deltabolic/video/7591650240193662209', // זוויות ספסל בדאמבלים, ישב תחת מוט
  'https://www.tiktok.com/@deltabolic/video/7538947864047799557', // דדליפט רומני, ישב תחת דדליפט
  'https://www.tiktok.com/@deltabolic/video/7477778832280358199', // לחיצה בשיפוע, ישבה תחת שטוח
  'https://www.tiktok.com/@deltabolic/video/7614683044384951553', // פרפר במכונה, ישב תחת כבלים
  'https://www.tiktok.com/@deltabolic/video/7508543918905036038', // פרפר במכונה, ישב תחת כבלים
  'https://www.tiktok.com/@deltabolic/video/6880363767008365825', // פרפר בדאמבלים, ישב תחת כבלים
  'https://www.tiktok.com/@deltabolic/video/7577965531286834433', // כפיפת ברכיים — כפילות פנימית
  'https://www.tiktok.com/@deltabolic/video/7606481835203333392', // חתירה בדאמבל — כפילות פנימית
  'https://www.tiktok.com/@deltabolic/video/7620156173517425937', // סקוואט בסמית — כפילות פנימית
  'https://www.tiktok.com/@deltabolic/video/7604296322199391489', // כפיפת בטן בכבל — כפילות פנימית
  'https://www.tiktok.com/@deltabolic/video/7479964650256239877', // פשיטת מרפקים מעל הראש, ישבה תחת לחיצת כתפיים
  'https://www.tiktok.com/@deltabolic/video/7600601665439370497', // כפיפת מרפקים במוט, ישבה תחת הרמת כתפיים
])

/**
 * סרטוני מאגר שיושבים תחת התרגיל הלא נכון, וההעברה שלהם.
 *
 * המקור מסווג לפי התרגיל שהסרטון *הוזכר* בו, ולכן קליפ שכל תוכנו "אל תשרוג
 * במקבילים" נחת תחת הרמת כתפיים, ו"מיקום כפות רגליים בלחיצת רגליים" נחת תחת
 * סקוואט בסמית׳. כל אחד מאלה נצפה בעין — הכותרת הצרובה בסרטון היא שקבעה.
 *
 * שם קובץ *הפלט* ממשיך להיגזר מתרגיל המקור ומהמיקום בו, בדיוק כמו ב-`split`
 * של תוכנית האימונים ומאותה סיבה: שם הקובץ הוא המפתח של הסרטון ב-DB המדיה
 * על המכשיר, ושינוי שלו מאלץ הורדה מחדש של קליפ שלא השתנה.
 */
const LIB_REASSIGN = {
  'https://www.tiktok.com/@deltabolic/video/7621359575739960577': 'lib-overhead_triceps_extension',
  'https://www.tiktok.com/@deltabolic/video/6917340420728950022': 'lib-overhead_triceps_extension',
  'https://www.tiktok.com/@deltabolic/video/7451754414399966470': 'lib-barbell_curl',
  'https://www.tiktok.com/@deltabolic/video/7498145524617334021': 'lib-straight_arm_pulldown',
  'https://www.tiktok.com/@deltabolic/video/7258347917864406278': 'lib-seated_cable_row',
  'https://www.tiktok.com/@deltabolic/video/7560851529704443153': 'lib-seated_cable_row',
  'https://www.tiktok.com/@deltabolic/video/7586821501987327248': 'lib-face_pull',
  'https://www.tiktok.com/@deltabolic/video/7114406189726780678': 'lib-dips',
  'https://www.tiktok.com/@deltabolic/video/7536720767279516933': 'lib-dumbbell_curl',
  'https://www.tiktok.com/@deltabolic/video/7584196042317466881': 'lib-barbell_curl',
  'https://www.tiktok.com/@deltabolic/video/7574984731347914000': 'lib-hip_thrust',
  'https://www.tiktok.com/@deltabolic/video/7565265280272796945': 'lib-leg_press',

  // סבב אודיט קבוצת החזה: `lib-cable_chest_fly` החזיק תשעה קליפים שאינם כבלים
  // — חמישה פרפר עם דאמבלים על ספסל, שניים במכונת פק-דק. הכיתוב בסרטון
  // ("Dumbbell Chest Fly Mistakes", "Machine Chest Fly Mistakes") מאשר את מה
  // שרואים בפריים.
  'https://www.tiktok.com/@deltabolic/video/6845839320419454213': 'lib-dumbbell_chest_fly',
  'https://www.tiktok.com/@deltabolic/video/6922951610050039045': 'lib-dumbbell_chest_fly',
  'https://www.tiktok.com/@deltabolic/video/7108868873427963142': 'lib-pec_deck_machine_chest_fly',
  'https://www.tiktok.com/@deltabolic/video/7451447029680704773': 'lib-dumbbell_chest_fly',
  'https://www.tiktok.com/@deltabolic/video/7529312860468563205': 'lib-dumbbell_chest_fly',
  'https://www.tiktok.com/@deltabolic/video/7590187882011282689': 'lib-dumbbell_chest_fly',
  'https://www.tiktok.com/@deltabolic/video/7664414076881128721': 'lib-pec_deck_machine_chest_fly',

  // אודיט קבוצת הגב. `lib-machine_row` נשאר ריק אחרי ההעברה ולכן נושר מהקטלוג
  // מעצמו — הרשומה מעולם לא החזיקה תוכן על חתירה במכונה, רק טריק לחתירת ארצ׳ר
  // בכבל. זה בדיוק מה שכבר מתועד ב-UNLINKED_NOTES של קטלוג האימון.
  'https://www.tiktok.com/@deltabolic/video/7457018519314648326': 'lib-straight_arm_pulldown',
  'https://www.tiktok.com/@deltabolic/video/7663991412198755600': 'lib-seated_cable_row',

  // אודיט קבוצת הכתפיים. ארבעה קליפים תחת `lib-rear_delt_fly` הם משיכת פנים
  // בכבל — שלושה מהם אומרים "Face Pull" על המסך. `lib-face_pull` כבר קלט קליפ
  // כזה בסבב קודם, ולכן זו המשכה של אותה החלטה ולא חדשה.
  'https://www.tiktok.com/@deltabolic/video/6891815522111917314': 'lib-face_pull',
  'https://www.tiktok.com/@deltabolic/video/6941592592219966726': 'lib-face_pull',
  'https://www.tiktok.com/@deltabolic/video/7412795066479119621': 'lib-face_pull',
  'https://www.tiktok.com/@deltabolic/video/7488128884299336965': 'lib-face_pull',

  // ארבעה מתוך ששת הקליפים של `lib-shrug` אינם הרמת כתפיים אלא "אל תרים
  // כתפיים בתרגיל X" — התרגיל שמבוצע בפועל בפריים הוא הרמה לצדדים, כפיפת
  // מרפקים במוט, חתירה עם דאמבל וחתירה במוט. הביצוע בפועל קובע, לא הנושא.
  'https://www.tiktok.com/@deltabolic/video/6836906581473398022': 'lib-lateral_raise',
  'https://www.tiktok.com/@deltabolic/video/6840687402898541829': 'lib-barbell_curl',
  'https://www.tiktok.com/@deltabolic/video/6850884602895158533': 'lib-dumbbell_row',
  'https://www.tiktok.com/@deltabolic/video/6956029285228449030': 'lib-barbell_row',

  // אודיט קבוצת הרגליים. `lib-barbell_squat` החזיק סקוואט פיצול עם דאמבלים
  // וסקוואט סומו עם דאמבל — לא סקוואט במוט. `lib-leg_press` החזיק הרמת עקבים
  // על מזחלת הלחיצה; הכיתוב אומר "Do calf raises on any leg press/squat machine".
  'https://www.tiktok.com/@deltabolic/video/6800044262005280006': 'lib-lunge',
  'https://www.tiktok.com/@deltabolic/video/7652514843739589904': 'lib-sumo_squat',
  'https://www.tiktok.com/@deltabolic/video/6788742907751845125': 'lib-calf_raise',

  // אודיט קבוצת היד האחורית. שני קליפים תחת `lib-triceps_pushdown` הם פשיטה
  // בשכיבה — אחד מהם אומר "LYING TRICEP EXTENSION MISTAKE" על המסך. וקליפ
  // אחד תחת `lib-dips` מבוצע בישיבה על ספסל, לא על מוטות מקבילים.
  'https://www.tiktok.com/@deltabolic/video/6964353766481005830': 'lib-skull_crusher',
  'https://www.tiktok.com/@deltabolic/video/7058052021340900613': 'lib-skull_crusher',
  'https://www.tiktok.com/@deltabolic/video/6869565245250096389': 'lib-bench_dip',

  // אודיט קבוצת היד הקדמית. `lib-dumbbell_curl` שימש בפועל כרשומת "כפיפת
  // מרפקים" גנרית: ארבעה קליפים מבוצעים במוט או ב-EZ, שלושה על ספסל בשיפוע
  // (והכיתוב אומר "incline" בשלושתם), ואחד בכבל. שם הרשומה אומר "בדאמבלים",
  // ולכן כאן, בשונה מ-`lib-row_general` ו-`lib-overhead_press`, הקליפים סותרים
  // את שם הרשומה עצמו ולא רק את הקטגוריה שלה. כל שמונה אומתו ב-8 פריימים.
  'https://www.tiktok.com/@deltabolic/video/6800546602126691590': 'lib-barbell_curl',
  'https://www.tiktok.com/@deltabolic/video/6950476539347684613': 'lib-barbell_curl',
  'https://www.tiktok.com/@deltabolic/video/7021690774332951813': 'lib-barbell_curl',
  'https://www.tiktok.com/@deltabolic/video/7245075772501658886': 'lib-barbell_curl',
  'https://www.tiktok.com/@deltabolic/video/7110747528437533958': 'lib-incline_dumbbell_curl',
  'https://www.tiktok.com/@deltabolic/video/7471078615006891269': 'lib-incline_dumbbell_curl',
  'https://www.tiktok.com/@deltabolic/video/7584931170341735688': 'lib-incline_dumbbell_curl',
  'https://www.tiktok.com/@deltabolic/video/7473645877161233719': 'lib-cable_curl',
}

/**
 * רשומות מאגר שאין להן מקבילה במקור.
 *
 * המקור מגיע מיוצר תוכן אחד, וחלוקת התרגילים שלו אינה מלאה — הרמת עקבים
 * וסקוואט סומו אינם רשומות אצלו, אבל יש להם סרטון ייעודי שיושב תחת רשומה
 * אחרת. `LIB_REASSIGN` לבדו לא מספיק: הקטלוג נבנה מ-`meta`, וכל מזהה שאינו
 * שם היה מייצר קליפ יתום בלי רשומה שתציג אותו.
 *
 * `videoCount: 0` — הספירה במקור אינה מכירה את הרשומה, ולכן `totalAvailable`
 * ייגזר ממה שבפועל נכנס אליה.
 */
const LIB_NEW = {
  'lib-calf_raise': { nameHe: 'הרמת עקבים', nameEn: 'Calf Raise', muscleGroup: 'legs', videoCount: 0 },
  'lib-sumo_squat': { nameHe: 'סקוואט סומו', nameEn: 'Sumo Squat', muscleGroup: 'legs', videoCount: 0 },
  'lib-cable_curl': {
    nameHe: 'כפיפת מרפקים בכבל',
    nameEn: 'Cable Biceps Curl',
    muscleGroup: 'biceps',
    videoCount: 0,
  },
}

/**
 * שם רשומה שהמקור נתן לה, ושהאודיט הראה שאינו מתאר את מה שיש בה.
 *
 * המזהה לא משתנה לעולם — הוא המפתח של הקישור לקטלוג ושל תגיות השרירים. רק
 * התווית שהמשתמש רואה מתוקנת.
 */
const LIB_RENAME = {
  // ארבעת הקליפים מכסים גם כפיפה וגם פשיטה — הכיתוב מסמן במפורש
  // "WRIST FLEXION", "EXTENSORS" ו-"Flexors:"/"Extensors:" באותו קליפ
  'lib-reverse_wrist_curl': {
    nameHe: 'אמות — כפיפה ופשיטת שורש כף יד',
    nameEn: 'Wrist Curl & Reverse Wrist Curl',
  },
}

/**
 * דריסת נושא לקליפ בודד, לפי כתובת.
 *
 * `cleanTopic` מטפל בתבניות (שברי כתובת, כותרת השקה). מה שנשאר הוא כיתוב
 * קידום שאין בו שום תבנית ("Summer Sale is now LIVE!") או מותג שנדבק לפני
 * התוכן — ואת אלה אי אפשר לזהות בלי לקרוא את הקליפ. לכן דריסה מפורשת
 * ומאומתת חזותית, ולא ניחוש רגולרי שעלול לאכול טקסט אמיתי.
 */
const LIB_TOPIC = {
  // "SIZE and SHRED .com The PERFECT Rear Delt Fly" — מותג לפני התוכן
  'https://www.tiktok.com/@deltabolic/video/7544866892813487378': 'The PERFECT Rear Delt Fly',
  // כיתוב קידום בלבד; הפריים מראה הרמת כתפיים עם דאמבלים בעמידה
  'https://www.tiktok.com/@deltabolic/video/7533055215797357829': 'Dumbbell Shrug',
  // זוג קליפים עם אותו נושא בדיוק, ושתי זוויות צילום שונות שכתובות על המסך
  'https://www.tiktok.com/@deltabolic/video/6894406872846060801':
    'STOP shrugging during rear delt flyes! (Back View)',
  'https://www.tiktok.com/@deltabolic/video/6894408027110165761':
    'STOP shrugging during rear delt flyes! (Front View)',
  // "Wearing the latest from — ." — קידום בלבד; הקליפ מראה הנחת המוט וסקוואט בסמית'
  'https://www.tiktok.com/@deltabolic/video/7513352117692665094': 'Smith Machine Squat',
}

/**
 * מנקה שאריות גרידה מתחילת הנושא.
 *
 * המקור שאב את הכיתוב מטיקטוק יחד עם שברי כתובת וידית — "com ( )",
 * "official - ." — ואלה הגיעו כמות שהם לתווית שהמשתמש רואה על הסרטון.
 * 62 מתוך 454 הנושאים התחילו כך.
 */
function cleanTopic(s) {
  let x = String(s).replace(/\s+/g, ' ').trim()
  // כותרת קידום שקדמה לתוכן: "The 7TH .com! Launches Monday … 8 PM CET Hyperextension"
  x = x.replace(/^.*?\bLaunches\b.*?(?:\d{1,2}\s*(?:AM|PM)\s*[A-Z]{2,4}\s*\|?\s*)+/i, '')
  // סוגריים שנקטעו בגרידה בסוף המחרוזת
  x = x.replace(/\s*\([^)]{0,3}$/, '')
  // שארית כתובת שנפלה לאמצע המחרוזת ולא לתחילתה: ".com ( )"
  x = x.replace(/\s*\.com\s*\(\s*\)\s*/gi, ' ')
  for (let i = 0; i < 6; i++) {
    const y = x
      .replace(/^(?:(?:https?:\/\/)?(?:www\.)?[\w-]*\.?(?:com|coml?)\b|official)[\s.,\-\u2013\u2014()]*/i, '')
      .replace(/^[\s.,\-\u2013\u2014()]+/, '')
    if (y === x) break
    x = y
  }
  return x.trim()
}


/** קבוצת שריר במאגר (עברית) → הערך ב-MuscleGroup */
const MUSCLE_MAP = {
  'חזה': 'chest',
  'גב': 'back',
  // שוק אינו קבוצה בפני עצמה — תרגיל תאומים במאגר יגיע תחת "רגליים" וזה נכון
  'רגליים': 'legs',
  'כתפיים': 'shoulders',
  'יד קדמית': 'biceps',
  'יד אחורית': 'triceps',
  'אמות': 'forearms',
  'בטן': 'abs',
}

/**
 * מפתח המאגר הופך לשם קובץ ולחלק מכתובת. "row_(general)" חוקי בכתובת אבל
 * שביר מספיק אצל שרתים סטטיים כדי לא לסמוך עליו — משאירים אותיות, ספרות וקו תחתון.
 */
function slug(key) {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * תיקיית מקור → מזהה התרגיל בקטלוג.
 *
 * הערך הוא בדרך כלל מזהה אחד, וכל הקבצים בתיקייה נכנסים אליו. כשתיקייה אחת
 * מחזיקה שתי וריאציות שהן שני תרגילים נפרדים בקטלוג — כמו לחיצת חזה שטוחה
 * מול שיפוע חיובי — הערך הוא `{ id, split }`: `id` הוא ברירת המחדל, ו-`split`
 * ממפה שם קובץ מקור למזהה אחר.
 *
 * שם קובץ *הפלט* נגזר תמיד מ-`id` ומהמיקום בתיקייה, גם עבור קובץ שנשלח
 * לתרגיל אחר. זה נראה לא עקבי ונבחר בכוונה: שם הקובץ הוא המפתח של הסרטון
 * ב-DB המדיה על המכשיר וב-videoHashes.ts, ושינוי שלו היה מאלץ הורדה מחדש של
 * סרטון שכבר מותקן ומזייף שינוי תוכן שלא קרה.
 */
const MAP = {
  'יום A - חזה ויד אחורית (Day A - Chest & Triceps)': {
    '00. חימום שכיבות סמיכה (Push-Up Warm-Up)': 'pushup',
    '01. לחיצת חזה חופשי - 22.5 קילו כל צד (Dumbbell Bench Press)': {
      id: 'db-bench-press',
      // שלושת האחרונים שטוח, הראשון בשיפוע חיובי — שתי רשומות בקטלוג
      split: { '01.mp4': 'incline-barbell-bench-press' },
    },
    '02. לחיצה במכונה סיקליין - 25 קילו כל צד (Decline Machine Press)': 'decline-machine-press',
    '03. מקבילים - 40 קילו כל צד (Dips)': 'dips',
    '04. פקטורל במכונה שיפוע שלילי - 15 קילו כל צד (Decline Machine Pec Fly)': 'decline-pec-fly',
    '05. לחיצה במכונה בנץ - 10 קילו כל צד (Bench Machine Press)': 'bench-machine-press',
    '06. יד אחורית עם מוט מעל הראש - 52 קילו (Overhead Barbell Triceps Extension)': 'overhead-tricep-ext',
    '07. יד אחורית עם מוט בפולי - 51 קילו (Cable Triceps Pushdown)': 'cable-tricep-pushdown',
    '08. יד אחורית כבלים צולבים - 15 קילו כל יד (Cross-Cable Triceps Extension)': 'cross-cable-tricep',
    '09. כתפיים במכונה - 45 קילו (Machine Shoulder Press)': 'machine-shoulder-press',
    '10. הרמה לצדדים - 12.5 קילו כל יד (Lateral Raise)': 'lateral-raise',
  },
  'יום B - גב ויד קדמית (Day B - Back & Biceps)': {
    '01. פולי עליון - 78 קילו (Lat Pulldown)': 'lat-pulldown',
    '02. חתירה - 60 קילו כל צד (Seated Row)': 'seated-row-heavy',
    '03. חתירה - 50 קילו כל צד (Seated Row)': 'seated-row-light',
    '04. חתירה מלמטה בכלוב - 58 קילו (Low Row in Rack)': 'low-row-rack',
    '05. יד קדמית בספה - 32 קילו (Preacher Curl)': 'preacher-curl',
    '06. פטישים יושב - 17.5 קילו (Seated Hammer Curl)': 'hammer-curl',
    '07. יד קדמית בפולי עם מרפקים מאחורי הגוף - 55 קילו (Behind-Body Cable Curl)': 'behind-body-cable-curl',
    '08. אמות - סטריט בר בכבל (Forearms - Straight Bar Cable)': 'forearm-straight-bar',
    '09. אמות - דאמבלים (Forearms - Dumbbells)': 'forearm-dumbbell',
    '10. הרמת כתפיים - 20 קילו (Shrugs)': 'shrugs',
    '11. פרפר הפוך - ריברס משין פליי (Reverse Machine Fly)': 'reverse-machine-fly',
  },
  'יום C - רגליים (Day C - Legs)': {
    '01. לחיצת רגליים - 160 קילו (Leg Press)': 'leg-press',
    '02. שרירי תאומים - 180 קילו (Calf Raise)': 'calf-raise',
    '03. סקוואט במכונה - 120 קילו (Machine Squat)': {
      id: 'machine-squat',
      // הסרטון בתיקייה הזו הוא לחיצת רגליים ב-45 מעלות ולא סקוואט. הוא עבר
      // ל-leg-press, ולכן לסקוואט במכונה אין כרגע סרטון — וזה מצב כן יותר
      // מסרטון שמלמד תרגיל אחר.
      split: { '01.mp4': 'leg-press' },
    },
    '04. כפיפת ברכיים - 115 קילו (Leg Curl)': 'leg-curl',
    '05. פשיטת ברכיים (Leg Extension)': 'leg-extension',
    '06. בטן (Abs)': 'abs',
  },
}

const MAX_EDGE = 720
const CRF = 30

/**
 * דריסת השנייה שממנה נלקחת התמונה הממוזערת, לפי שם קובץ הפלט.
 *
 * ברירת המחדל — שנייה 1 — טובה כמעט תמיד, כי רוב הקליפים נפתחים על התרגיל
 * עצמו. היא נשברת בקליפ שנפתח בתקריב: `behind-body-cable-curl-01` מתחיל על
 * כף היד האוחזת במוט, ומה שיוצא הוא תמונה ממוזערת שאי אפשר לזהות ממנה שום
 * תרגיל. ברשימת התרגילים זה ההבדל בין "אני יודע מה זה" ל"מה אני מסתכל עליו".
 *
 * המפתח הוא שם הפלט ולא כתובת המקור, בשונה מ-`LIB_TOPIC` ו-`LIB_REASSIGN`:
 * הוא היחיד שקיים בשני המקורות: להדגמות התוכנית אין כתובת בסקריפט הזה בכלל.
 *
 * כל ערך כאן נבחר בעין מול פריסת פריימים של הקליפ המומר, כמו שאר הדריסות
 * בקובץ. שנייה שחורגת ממשך הקליפ נופלת בחזרה לברירת המחדל עם אזהרה, כדי
 * שערך שגוי לא ייצר poster ריק בשקט.
 */
const POSTER_AT = {
  // נפתח בתקריב אחיזה. בשנייה 10 — מבט צד מלא, המרפק מסומן מאחורי קו הגוף
  'behind-body-cable-curl-01': 10,
}

function probe(file) {
  let out = ''
  try {
    out = execFileSync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration',
      '-of', 'default=nw=1:nk=0', file,
    ]).toString()
  } catch {
    // קובץ שלא ניתן לקריאה מדווח כ"בלי מידות", והקורא מדלג עליו
    return { width: 0, height: 0, duration: 0 }
  }
  const get = (k) => {
    const m = out.match(new RegExp(`^${k}=(.+)$`, 'm'))
    return m ? m[1].trim() : null
  }
  return {
    width: Number(get('width')),
    height: Number(get('height')),
    duration: Number(get('duration')) || 0,
  }
}

/**
 * דוחס סרטון אחד ומייצר לו poster. מחזיר את רשומת המניפסט, או null אם דילגנו.
 * `relDir` הוא הנתיב היחסי ל-public, כדי שה-src במניפסט יתאים ל-assetUrl.
 *
 * לא זורק. קובץ מקור אחד פגום לא אמור להפיל ייבוא של מאות סרטונים — הוא מדווח
 * ומדולג, וההרצה ממשיכה. זה קרה בפועל: שני קבצים במאגר ירדו כאודיו בלבד,
 * ffmpeg עם -an ייצר מהם קובץ בלי שום stream, וכל הייבוא נפל אחרי 88 סרטונים.
 */
function transcode(src, outDir, base, relDir) {
  const outMp4 = join(outDir, `${base}.mp4`)
  const outJpg = join(outDir, `${base}.jpg`)
  const info = probe(src)
  const inSize = statSync(src).size

  if (!info.width || !info.height) {
    console.warn(`  ⚠ ${base}: אין זרם וידאו במקור (${src}) — מדולג`)
    return null
  }

  try {
    // וידאו: צד ארוך עד 720, בלי אודיו, faststart לניגון מיידי
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', src,
      '-an',
      '-vf', `scale=w=${MAX_EDGE}:h=${MAX_EDGE}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
      '-c:v', 'libx264', '-profile:v', 'main', '-level', '4.0',
      '-crf', String(CRF), '-preset', 'slow',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      outMp4,
    ])

    // poster מהשנייה הראשונה (או מההתחלה אם הסרטון קצר), אלא אם נבחרה אחרת
    const fallbackAt = info.duration > 1.5 ? 1 : 0
    const override = POSTER_AT[base]
    if (override !== undefined && !(override < info.duration)) {
      console.warn(
        `  ⚠ ${base}: POSTER_AT=${override} חורג ממשך הקליפ (${info.duration.toFixed(1)}s) — ברירת המחדל`
      )
    }
    const posterAt = String(override !== undefined && override < info.duration ? override : fallbackAt)
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-ss', posterAt, '-i', outMp4,
      '-frames:v', '1', '-q:v', '5',
      '-vf', `scale=w=400:h=400:force_original_aspect_ratio=decrease:force_divisible_by=2`,
      outJpg,
    ])
  } catch (err) {
    console.warn(`  ⚠ ${base}: הדחיסה נכשלה — ${err.message.split('\n')[0]} — מדולג`)
    rmSync(outMp4, { force: true })
    rmSync(outJpg, { force: true })
    return null
  }

  const outSize = statSync(outMp4).size
  const outInfo = probe(outMp4)

  const pct = Math.round((1 - outSize / inSize) * 100)
  console.log(
    `  ✓ ${base}  ${(inSize / 1e6).toFixed(1)}MB → ${(outSize / 1e6).toFixed(1)}MB (-${pct}%)  ${outInfo.width}x${outInfo.height}  ${info.duration.toFixed(1)}s`
  )

  return {
    entry: {
      src: `${relDir}/${base}.mp4`,
      poster: `${relDir}/${base}.jpg`,
      width: outInfo.width,
      height: outInfo.height,
      durationSec: Math.round(info.duration * 10) / 10,
      sizeBytes: outSize,
    },
    inSize,
    outSize,
  }
}

/** מקור א׳ — הדגמות לתרגילי התוכנית. הכל נכנס. */
function importProgram() {
  const manifest = {}
  let totalIn = 0
  let totalOut = 0

  for (const [dayDir, exercises] of Object.entries(MAP)) {
    for (const [exDir, target] of Object.entries(exercises)) {
      const exerciseId = typeof target === 'string' ? target : target.id
      const split = typeof target === 'string' ? {} : (target.split ?? {})
      const srcDir = join(SOURCE, dayDir, exDir)
      if (!existsSync(srcDir)) {
        console.warn(`  ⚠ אין תיקייה: ${exDir}`)
        continue
      }
      const files = readdirSync(srcDir).filter((f) => f.toLowerCase().endsWith('.mp4')).sort()
      if (!files.length) continue

      manifest[exerciseId] = []
      let kept = 0
      files.forEach((f) => {
        // המספור לפי מה שנכנס בפועל ולא לפי מיקום במקור, כדי שדילוג לא ישאיר חור
        const idx = String(kept + 1).padStart(2, '0')
        const r = transcode(join(srcDir, f), OUT_DIR, `${exerciseId}-${idx}`, 'videos')
        if (!r) return
        kept += 1
        totalIn += r.inSize
        totalOut += r.outSize
        const into = split[f] ?? exerciseId
        ;(manifest[into] ??= []).push(r.entry)
      })
      if (!manifest[exerciseId].length) delete manifest[exerciseId]
    }
  }
  return { manifest, totalIn, totalOut }
}

/** מקור ב׳ — המאגר הלימודי. רק LIB_MAX הראשונים בכל תרגיל. */
function importLibrary() {
  const jsonPath = join(LIB_SOURCE, 'exercise-library.json')
  if (!existsSync(jsonPath)) {
    console.warn(`  ⚠ המאגר לא נמצא, מדלג: ${jsonPath}`)
    return null
  }
  const source = JSON.parse(readFileSync(jsonPath, 'utf8'))
  mkdirSync(LIB_OUT_DIR, { recursive: true })

  const manifest = {}
  const notes = {}
  const meta = new Map()
  const catalog = []
  let totalIn = 0
  let totalOut = 0
  let capped = 0
  let dropped = 0
  let moved = 0

  for (const ex of source) {
    const muscle = MUSCLE_MAP[ex.muscle]
    if (!muscle) {
      console.warn(`  ⚠ שריר לא מוכר "${ex.muscle}" בתרגיל ${ex.nameEn} — מדולג`)
      continue
    }
    const key = slug(ex.key)
    const id = `lib-${key}`
    const unique = ex.videos.filter((v) => !DUPLICATE_URLS.has(v.url))
    dropped += ex.videos.length - unique.length
    const picked = unique.slice(0, LIB_MAX)
    if (unique.length > picked.length) capped += unique.length - picked.length

    meta.set(id, { nameHe: ex.nameHe, nameEn: ex.nameEn, muscleGroup: muscle, videoCount: ex.videoCount })
    manifest[id] ??= []
    notes[id] ??= []
    // המספור נשען על `kept` ולא על אורך המערך: קליפ שמועבר לתרגיל אחר לא מגדיל
    // את המערך של המקור, ובלי מונה נפרד שני קבצים היו מקבלים אותו שם.
    let kept = 0
    picked.forEach((v) => {
      const srcFile = join(LIB_SOURCE, ex.folder, v.file)
      if (!existsSync(srcFile)) {
        console.warn(`  ⚠ קובץ חסר: ${ex.folder}/${v.file}`)
        return
      }
      const idx = String(kept + 1).padStart(2, '0')
      const r = transcode(srcFile, LIB_OUT_DIR, `${key}-${idx}`, 'videos/lib')
      if (!r) return
      kept += 1
      totalIn += r.inSize
      totalOut += r.outSize
      const into = LIB_REASSIGN[v.url] ?? id
      if (into !== id) moved += 1
      // notes ו-manifest חייבים להישאר מקבילים — לכן שניהם נדחפים יחד
      ;(manifest[into] ??= []).push(r.entry)
      // נושא שכולו היה שברי כתובת מתרוקן בניקוי, ותווית ריקה גרועה מזבל —
      // שם התרגיל לפחות נכון
      // נושא שכולו קידום ("link in my bio", "is having a 7th") נופל אחורה לשם
      const cleaned = LIB_TOPIC[v.url] ?? cleanTopic(v.topic)
      const usable = /link in my bio/i.test(cleaned) || cleaned.length < 6 ? '' : cleaned
      ;(notes[into] ??= []).push({ topic: usable || ex.nameEn, url: v.url })
    })
  }

  // אחרי הלולאה ולא לפניה: כך הרשומות החדשות נכנסות לסוף הקטלוג, ושום מזהה
  // מהמקור לא נדרס אם יום אחד יופיע שם תרגיל באותו שם
  for (const [id, m] of Object.entries(LIB_NEW)) if (!meta.has(id)) meta.set(id, m)
  for (const [id, m] of Object.entries(LIB_RENAME)) if (meta.has(id)) Object.assign(meta.get(id), m)

  for (const [id, m] of meta) {
    if (!manifest[id] || !manifest[id].length) {
      delete manifest[id]
      delete notes[id]
      continue
    }
    catalog.push({
      id,
      nameHe: m.nameHe,
      nameEn: m.nameEn,
      muscleGroup: m.muscleGroup,
      videos: notes[id],
      // תרגיל שקיבל קליפ מהעברה יכול להחזיק יותר ממה שהמקור ספר עבורו
      totalAvailable: Math.max(m.videoCount, manifest[id].length),
    })
  }

  return { manifest, catalog, totalIn, totalOut, capped, dropped, moved }
}

function main() {
  if (!existsSync(SOURCE)) {
    console.error(`✗ תיקיית המקור לא נמצאה: ${SOURCE}`)
    process.exit(1)
  }
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })

  console.log('— תוכנית האימונים —')
  const { manifest, totalIn, totalOut } = importProgram()

  console.log('\n— מאגר התרגילים —')
  const lib = importLibrary()

  const ts = `// קובץ נוצר אוטומטית על ידי scripts/import-videos.mjs — אין לערוך ידנית.
// הרצה מחדש: npm run import:videos

export interface BundledVideo {
  /** נתיב יחסי ל-base של האפליקציה */
  src: string
  poster: string
  width: number
  height: number
  durationSec: number
  sizeBytes: number
}

export const VIDEO_MANIFEST: Record<string, BundledVideo[]> = ${JSON.stringify(manifest, null, 2)}

/** סך כל המשקל של הסרטונים המצורפים, בבתים */
export const VIDEO_TOTAL_BYTES = ${totalOut}

/** מספר הסרטונים המצורפים */
export const VIDEO_COUNT = ${Object.values(manifest).reduce((n, v) => n + v.length, 0)}
`
  writeFileSync(MANIFEST, ts)

  if (lib) {
    const libCount = Object.values(lib.manifest).reduce((n, v) => n + v.length, 0)
    const libTs = `// קובץ נוצר אוטומטית על ידי scripts/import-videos.mjs — אין לערוך ידנית.
// הרצה מחדש: npm run import:videos

import type { MuscleGroup } from './types'
import type { BundledVideo } from './videoManifest'

/** מה הסרטון הספציפי הזה מלמד, וקישור למקור */
export interface LibraryVideoNote {
  topic: string
  url: string
}

export interface LibraryExercise {
  /** תמיד בתחילית lib- כדי שלא יתנגש במזהי תרגילי התוכנית */
  id: string
  nameHe: string
  nameEn: string
  muscleGroup: MuscleGroup
  /** מקביל אחד-לאחד ל-LIBRARY_MANIFEST[id] */
  videos: LibraryVideoNote[]
  /** כמה סרטונים קיימים במקור. שווה לאורך videos כשאין תקרה. */
  totalAvailable: number
}

/** הסרטונים עצמם. אותו מבנה כמו VIDEO_MANIFEST, כדי ש-mediaDb יטפל בשניהם. */
export const LIBRARY_MANIFEST: Record<string, BundledVideo[]> = ${JSON.stringify(lib.manifest, null, 2)}

export const LIBRARY_CATALOG: LibraryExercise[] = ${JSON.stringify(lib.catalog, null, 2)}

/** סך כל המשקל של סרטוני המאגר, בבתים */
export const LIBRARY_TOTAL_BYTES = ${lib.totalOut}

/** מספר סרטוני המאגר שנכנסו לבנייה */
export const LIBRARY_COUNT = ${libCount}

/** התקרה שהופעלה בייבוא, או null כשהכל נכנס */
export const LIBRARY_MAX_PER_EXERCISE: number | null = ${
      Number.isFinite(LIB_MAX) ? LIB_MAX : 'null'
    }

/** כמה סרטונים קיימים במקור ולא נכנסו לבנייה */
export const LIBRARY_OMITTED = ${lib.capped}
`
    writeFileSync(LIB_MANIFEST, libTs)
  }

  const count = Object.values(manifest).reduce((n, v) => n + v.length, 0)
  console.log(
    `\n✓ תוכנית: ${count} סרטונים · ` +
      `${(totalIn / 1e6).toFixed(0)}MB → ${(totalOut / 1e6).toFixed(0)}MB ` +
      `(-${Math.round((1 - totalOut / totalIn) * 100)}%)`
  )
  if (lib) {
    const libCount = Object.values(lib.manifest).reduce((n, v) => n + v.length, 0)
    console.log(
      `✓ מאגר: ${libCount} סרטונים ב-${lib.catalog.length} תרגילים · ` +
        `${(lib.totalIn / 1e6).toFixed(0)}MB → ${(lib.totalOut / 1e6).toFixed(0)}MB ` +
        `(-${Math.round((1 - lib.totalOut / lib.totalIn) * 100)}%)`
    )
    // קיצוץ שקט נקרא ככיסוי מלא — לכן הוא נאמר במפורש
    console.log(
      lib.dropped > 0 ? `  ${lib.dropped} סרטונים דולגו ככפילויות של סרטון אחר` : null,
      lib.capped > 0
        ? `  ${lib.capped} סרטונים נוספים קיימים במקור ולא נכנסו (תקרה של ${LIB_MAX} לתרגיל)`
        : '  בלי תקרה — כל הסרטונים שבמקור נכנסו'
    )
    console.log(`✓ סך הכל בבנייה: ${((totalOut + lib.totalOut) / 1e6).toFixed(0)}MB`)
  }
  console.log(`✓ manifest: ${MANIFEST}`)
  if (lib) console.log(`✓ manifest: ${LIB_MANIFEST}`)
}

main()
