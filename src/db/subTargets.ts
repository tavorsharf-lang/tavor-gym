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
 * הקיבוץ עצמו הוא החלטת מוצר ולא ממצא: ארבעת ראשי הארבע-ראשי מתאחדים לאחד,
 * כי אף אחד לא בונה אימון סביב הוואסטוס אינטרמדיוס. ראשי הטרייספס דווקא
 * נשארים בנפרד, כי הבחירה בין פשיטה מעל הראש לפשיטה בפולי היא בדיוק הבחירה
 * הזו. המספרים עצמם מגיעים כמות שהם מ-MUSCLE_BREAKDOWN ולא חושבו כאן.
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
  'Serratus Anterior': { sub: 'מסור קדמי', group: 'chest' },
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
  'Erector Spinae': { sub: 'זוקפי גב', group: 'back' },
  // ─── כתפיים ───
  'Anterior Deltoid': { sub: 'כתף קדמית', group: 'shoulders' },
  'Lateral Deltoid': { sub: 'כתף אמצעית', group: 'shoulders' },
  'Posterior Deltoid': { sub: 'כתף אחורית', group: 'shoulders' },
  'Levator Scapulae': { sub: 'טרפז עליון', group: 'shoulders' },
  'Upper / Lower Trapezius': { sub: 'טרפז עליון', group: 'shoulders' },
  'Upper Trapezius': { sub: 'טרפז עליון', group: 'shoulders' },
  'Infraspinatus': { sub: 'חוגרת מסובבת', group: 'shoulders' },
  'Supraspinatus': { sub: 'חוגרת מסובבת', group: 'shoulders' },
  'Teres Minor': { sub: 'חוגרת מסובבת', group: 'shoulders' },
  // ─── יד קדמית ───
  'Biceps': { sub: 'דו-ראשי', group: 'biceps' },
  'Biceps Brachii': { sub: 'דו-ראשי', group: 'biceps' },
  'Biceps Short Head': { sub: 'דו-ראשי — ראש קצר', group: 'biceps' },
  'Biceps Long Head': { sub: 'דו-ראשי — ראש ארוך', group: 'biceps' },
  'Brachialis': { sub: 'ברכיאליס', group: 'biceps' },
  'Brachioradialis': { sub: 'ברכיורדיאליס', group: 'biceps' },
  // ─── יד אחורית ───
  'Triceps': { sub: 'תלת-ראשי', group: 'triceps' },
  'Triceps Brachii': { sub: 'תלת-ראשי', group: 'triceps' },
  'Triceps Long Head': { sub: 'תלת-ראשי — ראש ארוך', group: 'triceps' },
  'Triceps Lateral Head': { sub: 'תלת-ראשי — ראש צידי', group: 'triceps' },
  'Triceps Medial Head': { sub: 'תלת-ראשי — ראש תיכוני', group: 'triceps' },
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
  'Gracilis': { sub: 'המסטרינגס', group: 'legs' },
  'Hamstrings': { sub: 'המסטרינגס', group: 'legs' },
  'Sartorius': { sub: 'המסטרינגס', group: 'legs' },
  'Adductor Magnus': { sub: 'מקרבים', group: 'legs' },
  'Gastrocnemius': { sub: 'שוק', group: 'legs' },
  'Peroneus Longus': { sub: 'שוק', group: 'legs' },
  'Soleus': { sub: 'שוק', group: 'legs' },
  // ─── בטן ───
  'Rectus Abdominis': { sub: 'ישר בטני', group: 'abs' },
  'External Oblique': { sub: 'אלכסונים', group: 'abs' },
  'Internal Oblique': { sub: 'אלכסונים', group: 'abs' },
  'Obliques': { sub: 'אלכסונים', group: 'abs' },
  'Deep Core': { sub: 'בטן עמוקה', group: 'abs' },
  'Transversus Abdominis': { sub: 'בטן עמוקה', group: 'abs' },
  'Iliopsoas': { sub: 'כופפי ירך', group: 'abs' },
  // ─── אמות ───
  'Flexor Carpi Radialis': { sub: 'כופפי אמה', group: 'forearms' },
  'Flexor Carpi Ulnaris': { sub: 'כופפי אמה', group: 'forearms' },
  'Flexor Digitorum Superficialis': { sub: 'כופפי אמה', group: 'forearms' },
  'Forearm Flexors': { sub: 'כופפי אמה', group: 'forearms' },
  'Palmaris Longus': { sub: 'כופפי אמה', group: 'forearms' },
  'Extensor Carpi Radialis': { sub: 'פושטי אמה', group: 'forearms' },
  'Extensor Carpi Ulnaris': { sub: 'פושטי אמה', group: 'forearms' },
}

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
 * תת-הקטגוריה של תרגיל: השריר בעל האחוז הגבוה ביותר **מתוך קבוצת השריר של
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
