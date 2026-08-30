import type { MuscleGroup } from './types'
import { MUSCLE_BREAKDOWN } from './muscleBreakdown'
import { imagesFor } from './exerciseImages'

/**
 * הטקסונומיה: שם השריר שמודפס על הכרטיס ← תת-קטגוריה, ולאיזו קבוצת שריר היא
 * שייכת.
 *
 * הכרטיסים משתמשים ב-116 תוויות עבריות שונות — "עכוז גדול", "ישבן גדול"
 * ו"גלוטאוס מקסימוס" הם אותו שריר בשלושה כרטיסים שונים. **השם האנגלי הוא
 * המפתח**, כי הוא היחיד שעקבי לאורך כל 89 הכרטיסים.
 *
 * **השם העברי כאן אינו תמלול של הכרטיס אלא הכרעה אחת לכל שריר**: העברית
 * המקצועית הנפוצה, זו שמופיעה באתרי כושר ובפיזיותרפיה בישראל. תעתיק נבחר רק
 * כשאין לו מתחרה חי — ברכיאליס, המסטרינגס, סראטוס — ולא כשיש מילה עברית
 * שכולם משתמשים בה (רחב גבי ולא "לאטס", זוקפי הגב ולא "ארקטור").
 *
 * הקיבוץ עצמו הוא החלטת מוצר ולא ממצא: ארבעת ראשי הארבע-ראשי מתאחדים לאחד,
 * כי אף אחד לא בונה אימון סביב הוואסטוס אינטרמדיוס. ראשי הטרייספס דווקא
 * נשארים בנפרד, כי הבחירה בין פשיטה מעל הראש לפשיטה בפולי היא בדיוק הבחירה
 * הזו. התאומים והסוליאוס נפרדים מאותה סיבה — ברך ישרה מול ברך כפופה.
 * המספרים עצמם מגיעים כמות שהם מ-MUSCLE_BREAKDOWN ולא חושבו כאן.
 *
 * שלוש הצמדות שאינן אנטומיה טהורה ומסומנות במקומן: "כופפי הירך" חי גם ברגליים
 * וגם בבטן, הברכיורדיאליס יושב באמות ולא ביד קדמית, ו"עכוז אמצעי" בולע גם את
 * הקטן וגם את מותח המתלה.
 */
export const MUSCLE_TAXONOMY: Readonly<Record<string, { sub: string; group: MuscleGroup }>> = {
  // ─── חזה ───
  'Clavicular Pectoralis': { sub: 'חזה עליון', group: 'chest' },
  'Clavicular Pectoralis Major': { sub: 'חזה עליון', group: 'chest' },
  'Chest Middle Region': { sub: 'חזה אמצעי', group: 'chest' },
  'Middle Sternocostal': { sub: 'חזה אמצעי', group: 'chest' },
  'Pectoralis Major': { sub: 'חזה אמצעי', group: 'chest' },
  'Sternocostal Pectoralis': { sub: 'חזה אמצעי', group: 'chest' },
  'Lower Pectoralis': { sub: 'חזה תחתון', group: 'chest' },
  // "מסור קדמי" הוא תרגום מילולי של serratus. בחדר כושר קוראים לו סראטוס,
  // ובספר אנטומיה "המשונן הקדמי" — אף אחד מהם אינו "מסור".
  'Serratus Anterior': { sub: 'סראטוס', group: 'chest' },
  // ─── גב ───
  'Latissimus Dorsi': { sub: 'רחב גבי', group: 'back' },
  'Lower Lat Region': { sub: 'רחב גבי', group: 'back' },
  'Upper Thoracic Lat': { sub: 'רחב גבי', group: 'back' },
  'Teres Major': { sub: 'עגול גדול', group: 'back' },
  'Mid-Back Retractors': { sub: 'מעוינים', group: 'back' },
  'Rhomboids': { sub: 'מעוינים', group: 'back' },
  'Lower & Middle Trapezius': { sub: 'טרפז אמצעי-תחתון', group: 'back' },
  'Lower Trapezius': { sub: 'טרפז אמצעי-תחתון', group: 'back' },
  'Middle & Lower Trapezius': { sub: 'טרפז אמצעי-תחתון', group: 'back' },
  'Middle Trapezius': { sub: 'טרפז אמצעי-תחתון', group: 'back' },
  // עשרה כרטיסים מתוך עשרה כותבים "זוקפי הגב", וכך גם אומרים
  'Erector Spinae': { sub: 'זוקפי הגב', group: 'back' },
  // ─── כתפיים ───
  'Anterior Deltoid': { sub: 'כתף קדמית', group: 'shoulders' },
  'Lateral Deltoid': { sub: 'כתף אמצעית', group: 'shoulders' },
  'Posterior Deltoid': { sub: 'כתף אחורית', group: 'shoulders' },
  'Levator Scapulae': { sub: 'טרפז עליון', group: 'shoulders' },
  'Upper / Lower Trapezius': { sub: 'טרפז עליון', group: 'shoulders' },
  'Upper Trapezius': { sub: 'טרפז עליון', group: 'shoulders' },
  // rotator cuff. "חוגרת המסובבים" הוא המונח שבו משתמשים פיזיותרפיסטים בעברית;
  // "חוגרת מסובבת" לא אומר כלום.
  'Infraspinatus': { sub: 'חוגרת המסובבים', group: 'shoulders' },
  'Supraspinatus': { sub: 'חוגרת המסובבים', group: 'shoulders' },
  'Teres Minor': { sub: 'חוגרת המסובבים', group: 'shoulders' },
  // ─── יד קדמית ───
  'Biceps': { sub: 'דו-ראשי', group: 'biceps' },
  'Biceps Brachii': { sub: 'דו-ראשי', group: 'biceps' },
  'Biceps Short Head': { sub: 'דו-ראשי — ראש קצר', group: 'biceps' },
  'Biceps Long Head': { sub: 'דו-ראשי — ראש ארוך', group: 'biceps' },
  'Brachialis': { sub: 'ברכיאליס', group: 'biceps' },
  // ─── יד אחורית ───
  'Triceps': { sub: 'תלת-ראשי', group: 'triceps' },
  'Triceps Brachii': { sub: 'תלת-ראשי', group: 'triceps' },
  'Triceps Long Head': { sub: 'תלת-ראשי — ראש ארוך', group: 'triceps' },
  // לטרלי הוא הראש החיצוני ומדיאלי הוא הפנימי. הכרטיסים משתמשים בשני הזוגות,
  // וזה שאומרים בעל פה הוא חיצוני/פנימי.
  'Triceps Lateral Head': { sub: 'תלת-ראשי — ראש חיצוני', group: 'triceps' },
  'Triceps Medial Head': { sub: 'תלת-ראשי — ראש פנימי', group: 'triceps' },
  // ─── רגליים ───
  'Quadriceps': { sub: 'ארבע-ראשי', group: 'legs' },
  'Rectus Femoris': { sub: 'ארבע-ראשי', group: 'legs' },
  'Vastus Intermedius': { sub: 'ארבע-ראשי', group: 'legs' },
  'Vastus Lateralis': { sub: 'ארבע-ראשי', group: 'legs' },
  'Vastus Medialis': { sub: 'ארבע-ראשי', group: 'legs' },
  'Gluteus Maximus': { sub: 'עכוז גדול', group: 'legs' },
  'Gluteus Medius': { sub: 'עכוז אמצעי', group: 'legs' },
  'Gluteus Minimus': { sub: 'עכוז אמצעי', group: 'legs' },
  'Tensor Fasciae Latae': { sub: 'עכוז אמצעי', group: 'legs' },
  'Hamstrings': { sub: 'המסטרינגס', group: 'legs' },
  // העדין (gracilis) הוא מקרב ולא ירך אחורית — הוא ישב תחת המסטרינגס בטעות
  'Adductor Magnus': { sub: 'מקרבים', group: 'legs' },
  'Gracilis': { sub: 'מקרבים', group: 'legs' },
  // החייט (sartorius) הוא כופף ירך שגם מכופף ברך, ולכן הוא מופיע על כרטיס של
  // כפיפת ברכיים. הוא עדיין לא המסטרינג. התווית משותפת עם הבטן במכוון: זה אותו
  // שריר, ומה שקובע מי יכול לזכות בכותרת הוא הקבוצה של התרגיל.
  'Sartorius': { sub: 'כופפי הירך', group: 'legs' },
  // השוק נפרד לשניים: התאומים עובדים בברך ישרה והסוליאוס בברך כפופה
  'Gastrocnemius': { sub: 'תאומים', group: 'legs' },
  'Soleus': { sub: 'סוליאוס', group: 'legs' },
  // הפרונאוס אינו שריר תאומים ואינו סוליאוס. הוא לא יזכה בכותרת לעולם (10%
  // לכל היותר), אבל הוא כן מה שכתוב על הכרטיס ולכן הוא מקבל תווית משלו.
  'Peroneus Longus': { sub: 'פרונאוס', group: 'legs' },
  // ─── בטן ───
  'Rectus Abdominis': { sub: 'ישר בטני', group: 'abs' },
  'External Oblique': { sub: 'אלכסונים', group: 'abs' },
  'Internal Oblique': { sub: 'אלכסונים', group: 'abs' },
  'Obliques': { sub: 'אלכסונים', group: 'abs' },
  'Deep Core': { sub: 'בטן עמוקה', group: 'abs' },
  'Transversus Abdominis': { sub: 'בטן עמוקה', group: 'abs' },
  'Iliopsoas': { sub: 'כופפי הירך', group: 'abs' },
  // ─── אמות ───
  'Flexor Carpi Radialis': { sub: 'כופפי אמה', group: 'forearms' },
  'Flexor Carpi Ulnaris': { sub: 'כופפי אמה', group: 'forearms' },
  'Flexor Digitorum Superficialis': { sub: 'כופפי אמה', group: 'forearms' },
  'Forearm Flexors': { sub: 'כופפי אמה', group: 'forearms' },
  'Palmaris Longus': { sub: 'כופפי אמה', group: 'forearms' },
  'Extensor Carpi Radialis': { sub: 'פושטי אמה', group: 'forearms' },
  'Extensor Carpi Ulnaris': { sub: 'פושטי אמה', group: 'forearms' },
  // הברכיורדיאליס הוא שריר אמה שחוצה את המרפק, לא שריר של היד הקדמית. הוא
  // ממשיך להופיע כתגית משנית על כל כפיפת מרפקים — התגיות אינן מוגבלות לקבוצה.
  'Brachioradialis': { sub: 'ברכיורדיאליס', group: 'forearms' },
}

/**
 * כל ראשי השרירים של כל קבוצה, בסדר שבו הם מופיעים בטקסונומיה.
 *
 * נגזר ולא נכתב ביד: רשימה מקבילה הייתה מתיישנת ברגע שתווית חדשה נכנסת
 * לטקסונומיה, ובשקט — היא פשוט לא הייתה מוצעת בגיליון תיקון השיוך.
 *
 * ‏"כופפי הירך" מופיע בשתי קבוצות (רגליים ובטן) וזה מכוון — זה אותו שריר,
 * והקבוצה של התרגיל היא שקובעת תחת איזו כותרת הוא נספר.
 */
export const SUBS_BY_GROUP: Readonly<Record<MuscleGroup, readonly string[]>> = (() => {
  const out = {} as Record<MuscleGroup, string[]>
  for (const { sub, group } of Object.values(MUSCLE_TAXONOMY)) {
    const list = (out[group] ??= [])
    if (!list.includes(sub)) list.push(sub)
  }
  return out
})()

/**
 * שרירים שאינם תת-קטגוריה. "מייצבים" אינו שריר ממוקד שאפשר לבנות סביבו
 * אימון — הוא מופיע על הכרטיס כשארית ולא כמטרה.
 */
export const NOT_A_SUBTARGET: ReadonlySet<string> = new Set(['Stabilizers', 'Trunk Stabilizers'])

/** מזהה התמונה מתוך הנתיב שלה — "images/ex/<id>.jpg" */
function imageIdOf(src: string): string {
  return src.slice(src.lastIndexOf('/') + 1, -4)
}

/**
 * פירוט השרירים של תרגיל, מהכרטיס הראשון שלו שיש עליו אחוזים.
 *
 * "הראשון שיש עליו אחוזים" ולא "הראשון": לפשיטת מרפקים מעל הראש הכרטיס
 * הראשון הוא כרטיס הסבר שמדרג במילים ולא במספרים, והשני הוא זה שנושא נתונים.
 */
export function breakdownFor(exerciseId: string, libraryId?: string) {
  for (const image of imagesFor(exerciseId, libraryId)) {
    const rows = MUSCLE_BREAKDOWN[imageIdOf(image.src)]
    if (rows) return rows
  }
  return []
}

/**
 * התת-קטגוריה של תרגיל: השריר בעל האחוז הגבוה ביותר **מתוך קבוצת השריר של
 * התרגיל עצמו**.
 *
 * ההגבלה לקבוצה אינה קישוט. מקבילים במכונה יושבים בקטלוג תחת יד אחורית, אבל
 * הכרטיס שלהם מסמן חזה תחתון 48 אחוז מול טרייספס 27 — בלי ההגבלה התרגיל היה
 * מקבל כותרת של חזה בתוך קבוצת היד האחורית, כלומר כותרת שלא שייכת למסך שהיא
 * מופיעה בו.
 */
export function subTargetFor(
  exerciseId: string,
  group: MuscleGroup,
  libraryId?: string
): string | null {
  let best: { sub: string; pct: number } | null = null
  for (const row of breakdownFor(exerciseId, libraryId)) {
    const hit = MUSCLE_TAXONOMY[row.en]
    if (!hit || hit.group !== group) continue
    if (!best || row.pct > best.pct) best = { sub: hit.sub, pct: row.pct }
  }
  return best?.sub ?? null
}

/** מה עוד עובד בתרגיל — כל השאר, בלי העיקרי ובלי המייצבים */
export function secondaryFor(
  exerciseId: string,
  group: MuscleGroup,
  libraryId?: string
): readonly { he: string; pct: number }[] {
  const primary = subTargetFor(exerciseId, group, libraryId)
  const seen = new Set<string>()
  const out: { he: string; pct: number }[] = []
  for (const row of breakdownFor(exerciseId, libraryId)) {
    if (NOT_A_SUBTARGET.has(row.en)) continue
    const sub = MUSCLE_TAXONOMY[row.en]?.sub
    if (!sub || sub === primary || seen.has(sub)) continue
    seen.add(sub)
    out.push({ he: sub, pct: row.pct })
  }
  return out
}

/** האחוז של תת-הקטגוריה הראשית, כפי שהוא מודפס על הכרטיס */
export function primaryPctFor(
  exerciseId: string,
  group: MuscleGroup,
  libraryId?: string
): number | null {
  const primary = subTargetFor(exerciseId, group, libraryId)
  if (!primary) return null
  let best = 0
  for (const row of breakdownFor(exerciseId, libraryId)) {
    if (MUSCLE_TAXONOMY[row.en]?.sub === primary && row.pct > best) best = row.pct
  }
  return best || null
}
