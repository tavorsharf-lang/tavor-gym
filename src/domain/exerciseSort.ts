import type { Equipment } from '@/db/types'
import { imageIdOf, imagesFor } from '@/db/exerciseImages'
import { loadMapFor } from '@/db/loadMap'
import type { LoadShare } from '@/db/loadMap'

/**
 * המיון והסינון של רשימות התרגילים — הלוגיקה בלבד, בלי מסך.
 *
 * שני המסכים ששואלים "מה אני עושה על השריר הזה" — בניית האימון ומסך התרגילים —
 * מחזיקים את אותה רשימה בדיוק, ולכן גם את אותן שאלות: מה עובד הכי חזק, מה
 * ממוקד ומה מפזר, ומה לא נגעתי בו כבר חודש. הן חיות כאן ולא בכל מסך בנפרד,
 * כדי ששתי הרשימות לא יסתדרו יום אחד אחרת זו מזו.
 *
 * **אף אחוז לא מחושב כאן.** המספרים מגיעים מ-`loadMapFor`, שהוא תמלול של מה
 * שמודפס על הכרטיס האנטומי, כולל השער שלו: כרטיס שאינו חלוקה של 100% מחזיר
 * רשימה ריקה. תרגיל כזה פשוט אין לו אחוז — לא אפס — והמיון שולח אותו לתחתית
 * בלי מספר.
 */

/**
 * מה שהמיון צריך לדעת על שורה.
 *
 * מבנה מינימלי ולא `CatalogEntry`, כדי שהשכבה הזו לא תדע מה זה קטלוג:
 * `CatalogEntry` מקיים אותו מבנית, וכל רשימה עתידית תוכל לקיים אותו גם.
 */
export interface SortableEntry {
  /** מזהה קטלוג כשיש תרגיל, אחרת מזהה מאגר — בדיוק כמו `CatalogEntry.id` */
  id: string
  name: string
  exercise: { id: string; libraryId?: string; equipment: Equipment } | null
}

export type SortKey = 'default' | 'pct' | 'focus' | 'recent'

export interface SortState {
  key: SortKey
  /** יורד = הגדול/החדש קודם. לחיצה על מיון פעיל הופכת את הכיוון. */
  desc: boolean
}

/**
 * התוויות של הצ׳יפים. `default` הוא הסדר שהמסך ממיין בו ממילא — סדר התוכנית
 * במסך התרגילים, "הכי מזמן שלא עשית" בבונה — והוא נשאר כדי שאפשר יהיה לחזור
 * אליו, לא רק לצאת ממנו.
 */
export const SORT_LABELS: Record<SortKey, string> = {
  default: 'רגיל',
  pct: 'אחוז',
  focus: 'ממוקד',
  recent: 'לאחרונה',
}

/** מה כל מיון עונה עליו — לתווית הנגישה, שאין בה מקום לניחוש */
export const SORT_HINTS: Record<SortKey, string> = {
  default: 'הסדר הרגיל של המסך',
  pct: 'כמה התרגיל עובד על השריר שנבחר',
  focus: 'כמה התרגיל ממוקד בשריר אחד',
  recent: 'מתי ביצעת אותו לאחרונה',
}

/**
 * המפה של תרגיל — הכרטיס הראשון שיש עליו חלוקה תקפה.
 *
 * "הראשון שיש עליו" ולא "הראשון", מאותה סיבה בדיוק כמו `breakdownFor`:
 * לפשיטת מרפקים מעל הראש הכרטיס הראשון מדרג במילים ולא במספרים.
 */
export function sharesOf(exerciseId: string, libraryId?: string): readonly LoadShare[] {
  for (const image of imagesFor(exerciseId, libraryId)) {
    const map = loadMapFor(imageIdOf(image.src))
    if (map.length > 0) return map
  }
  return []
}

/** אותה שאלה על שורה ברשימה. המזהה נגזר כמו ב-`subOf`. */
export function sharesOfEntry(entry: SortableEntry): readonly LoadShare[] {
  return sharesOf(entry.exercise?.id ?? entry.id, entry.exercise?.libraryId)
}

/**
 * כמה התרגיל עובד על תת-שריר מסוים, לפי הכרטיס. `null` = אין נתון.
 *
 * ההבחנה בין `null` לבין 0 היא כל העניין: 0 אומר "הכרטיס בדק ולא מצא", ו-`null`
 * אומר "לא כתוב על הכרטיס". המסך חייב להציג אותם אחרת.
 */
export function pctOfSub(entry: SortableEntry, sub: string): number | null {
  for (const share of sharesOfEntry(entry)) {
    if (share.name === sub) return share.pct
  }
  return null
}

/**
 * כמה התרגיל ממוקד: האחוז של השריר החזק שלו.
 *
 * ‏100 הוא בידוד טהור — הארכת ברך, שכל הכרטיס שלה הוא ארבע-ראשי. 35 הוא תרגיל
 * שמפזר על ארבעה שרירים. זה לא דירוג של "טוב יותר": ביום שבו רוצים להעמיס
 * שריר אחד רוצים את הראש, וביום קצר רוצים את התחתית.
 */
export function focusOf(entry: SortableEntry): number | null {
  const shares = sharesOfEntry(entry)
  if (shares.length === 0) return null
  return shares.reduce((best, s) => (s.pct > best ? s.pct : best), 0) || null
}

/** האם הכרטיס של התרגיל נוגע בתת-השריר הזה בכלל — הבסיס ל"כל מי שנוגע" */
export function touchesSub(entry: SortableEntry, sub: string): boolean {
  return pctOfSub(entry, sub) !== null
}

/**
 * מיון לפי מצב אחד.
 *
 * שלושה כללים שחוזרים בכל המיונים:
 *   • **חוסר נתון תמיד בתחתית**, בשני הכיוונים. הפיכת הכיוון היא שאלה על
 *     המספרים, לא הזמנה להעלות לראש את מי שאין לו מספר.
 *   • **שובר שוויון קבוע** — שם ואז מזהה. בלעדיו `sort` היה יציב ביחס לקלט,
 *     והקלט עצמו משתנה עם כל כתיבה למסד; אותה רשימה הייתה מתערבבת מעצמה.
 *   • **`default` מאציל למסך.** הסדר הרגיל הוא ידע של המסך — סדר התוכנית מול
 *     "הכי מזמן שלא עשית" — ואין לשכבה הזו דעה עליו.
 */
export function sortedBy<T extends SortableEntry>(
  list: readonly T[],
  state: SortState,
  ctx: {
    /** תת-השריר שהמיון לפי אחוז נמדד מולו. בלעדיו אין ל"אחוז" עוגן. */
    sub?: string | null
    lastAt?: ReadonlyMap<string, number>
    fallback?: (a: T, b: T) => number
  } = {}
): T[] {
  const byName = (a: T, b: T): number =>
    a.name.localeCompare(b.name, 'he') || a.id.localeCompare(b.id)

  if (state.key === 'default') {
    return [...list].sort(ctx.fallback ?? byName)
  }

  /*
    ‏`recent` הוא היחיד שחוסר בו אינו "אין נתון" אלא ערך אמיתי: תרגיל שמעולם
    לא בוצע הוא הרחוק ביותר בזמן, ולכן ‎-Infinity ולא null. זה גם מה ששומר על
    ברירת המחדל של הבונה — "מעולם לא" בראש, אחר כך מהישן לחדש — כשממיינים
    בכיוון עולה.
  */
  const valueOf = (entry: T): number | null => {
    if (state.key === 'recent') {
      const at = entry.exercise ? ctx.lastAt?.get(entry.exercise.id) : undefined
      return at ?? -Infinity
    }
    if (state.key === 'focus') return focusOf(entry)
    return ctx.sub ? pctOfSub(entry, ctx.sub) : null
  }

  const scored = list.map((entry) => ({ entry, value: valueOf(entry) }))
  scored.sort((a, b) => {
    if (a.value === null || b.value === null) {
      if (a.value === b.value) return byName(a.entry, b.entry)
      return a.value === null ? 1 : -1
    }
    const diff = state.desc ? b.value - a.value : a.value - b.value
    return diff || byName(a.entry, b.entry)
  })
  return scored.map((x) => x.entry)
}

// ─── סינון ציוד ────────────────────────────────────────────────────────────

/**
 * האם השורה עוברת את מסנן הציוד. סט ריק = בלי סינון.
 *
 * שורת מאגר שאין לה תרגיל בקטלוג **נופלת** כשהמסנן דלוק, כי אין עליה נתון
 * ציוד בכלל — הוא נקבע כשמוסיפים אותה לתרגילים שלי. זה מוסתר בשקט ולכן המסך
 * סופר כמה נפלו ואומר את זה; ראו `equipmentHidden`.
 */
export function matchesEquipment(
  entry: SortableEntry,
  picked: ReadonlySet<Equipment>
): boolean {
  if (picked.size === 0) return true
  return entry.exercise ? picked.has(entry.exercise.equipment) : false
}

/** כמה שורות נעלמו רק משום שאין להן סיווג ציוד — המספר שהמסך מציג */
export function equipmentHidden(
  list: readonly SortableEntry[],
  picked: ReadonlySet<Equipment>
): number {
  if (picked.size === 0) return 0
  return list.filter((entry) => entry.exercise === null).length
}
