import { create } from 'zustand'
import type { MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS } from '@/db/types'

/**
 * הסל של בניית האימון — התרגילים שנבחרו וטרם נשלחו לשום מקום.
 *
 * ‏localStorage ולא state של מסך, ולא sessionStorage:
 *   • הבחירה נמשכת על פני שני מסכים (רשימת השרירים ורשימת התרגילים) וחוזרת
 *     ביניהם, ולכן היא לא יכולה לחיות בתוך אחד מהם.
 *   • ‏iOS סוגר אפליקציית PWA שברקע בלי היסוס. לבחור שישה תרגילים, להציץ
 *     בהודעה שנכנסה ולחזור לסל ריק זה בדיוק התרחיש שקורה בחדר כושר, ו-
 *     sessionStorage מת עם התהליך. שאר האפליקציה כבר משתמשת ב-localStorage
 *     לדגלים שצריכים לשרוד את זה.
 *
 * מה שנשמר הוא תצלום תצוגה (שם וקבוצת שריר) ולא רק מזהים: הסל הוא רשימת
 * קניות זמנית, והפס התחתון צריך לצייר אותה בלי לשאול את המסד בכל מסך.
 * ‏`id` הוא מזהה מהרשימה המאוחדת — הוא יכול להיות מזהה תרגיל או מזהה מאגר,
 * ומי שמממש אותו הוא `ensureTrainable` ברגע השליחה.
 */

const STORAGE_KEY = 'tavor-gym:builder-basket'

export interface BasketItem {
  id: string
  name: string
  muscleGroup: MuscleGroup
  /** מזהה מאגר שעדיין אין לו כרטיס תרגיל — ייווצר בשליחה */
  needsCatalogEntry: boolean
}

interface BasketState {
  items: BasketItem[]
  has: (id: string) => boolean
  toggle: (item: BasketItem) => void
  remove: (id: string) => void
  /**
   * מעדכן את שם התצלום אחרי שינוי שם בעריכה מהירה. בלי זה הגלולה בפס הסל
   * הייתה ממשיכה להציג את השם הישן — התצלום נלקח ברגע הבחירה.
   */
  renameItem: (id: string, name: string) => void
  /**
   * מרענן תצלומים מול הקטלוג — שם וקבוצת שריר. התצלום נלקח ברגע הבחירה,
   * ותרגיל ששונה בינתיים היה כותב את הקבוצה הישנה לכותרת של אימון שנשמר.
   */
  refreshSnapshots: (rows: readonly { id: string; name: string; muscleGroup: MuscleGroup }[]) => void
  move: (fromIndex: number, toIndex: number) => void
  clear: () => void
}

/**
 * קבוצות שכבר לא קיימות, וממה שהן היו לפני. `calves` אוחדה לתוך `legs`.
 *
 * הסל שורד עדכון גרסה — הוא ב-localStorage ולא במסד, ולכן מיגרציית Dexie לא
 * מגיעה אליו. פריט שנבחר לפני האיחוד חוזר עם `muscleGroup: 'calves'`, ושתי
 * קריאות ל-`MUSCLE_GROUPS[...]` בפס הסל (התווית בגיליון והכותרת של אימון
 * שנשמר) היו מתפוצצות עליו — `undefined.label`. `refreshSnapshots` אמנם
 * מתקן קבוצה מהמסד, אבל רק כשהגיליון נפתח; המסך מצויר לפני זה.
 */
const MERGED_GROUPS: Record<string, MuscleGroup> = { calves: 'legs' }

function normalizeGroup(value: unknown): MuscleGroup | null {
  if (typeof value !== 'string') return null
  if (value in MUSCLE_GROUPS) return value as MuscleGroup
  return MERGED_GROUPS[value] ?? null
}

function read(): BasketItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    /*
      סינון הגנתי: הסל שורד עדכוני גרסה, ורשומה פגומה לא תפיל מסך. קבוצה
      שאין לה תווית מפילה — ולכן היא נבדקת ולא רק המזהה. קבוצה שאוחדה
      מתורגמת ליורשת שלה, וקבוצה שאין לה יורשת מפילה את הפריט: עדיף פריט
      חסר בסל מאשר שורה שנצבעת בשם של שריר אחר.
    */
    const items: BasketItem[] = []
    for (const entry of parsed) {
      if (typeof entry !== 'object' || entry === null) continue
      const item = entry as BasketItem
      if (typeof item.id !== 'string') continue
      const muscleGroup = normalizeGroup(item.muscleGroup)
      if (muscleGroup === null) continue
      items.push(muscleGroup === item.muscleGroup ? item : { ...item, muscleGroup })
    }
    return items
  } catch {
    return []
  }
}

function write(items: BasketItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // מכסה מלאה או מצב פרטי — הסל ימשיך לעבוד בזיכרון עד לסגירת האפליקציה
  }
}

export const useBasket = create<BasketState>((set, get) => ({
  items: read(),

  has(id) {
    return get().items.some((i) => i.id === id)
  },

  toggle(item) {
    const items = get().items
    const next = items.some((i) => i.id === item.id)
      ? items.filter((i) => i.id !== item.id)
      : [...items, item]
    write(next)
    set({ items: next })
  },

  remove(id) {
    const next = get().items.filter((i) => i.id !== id)
    write(next)
    set({ items: next })
  },

  renameItem(id, name) {
    const items = get().items
    if (!items.some((i) => i.id === id)) return
    const next = items.map((i) => (i.id === id ? { ...i, name } : i))
    write(next)
    set({ items: next })
  },

  refreshSnapshots(rows) {
    const byId = new Map(rows.map((r) => [r.id, r]))
    const items = get().items
    const next = items.map((i) => {
      const fresh = byId.get(i.id)
      if (!fresh || (fresh.name === i.name && fresh.muscleGroup === i.muscleGroup)) return i
      return { ...i, name: fresh.name, muscleGroup: fresh.muscleGroup }
    })
    if (next.every((n, idx) => n === items[idx])) return
    write(next)
    set({ items: next })
  },

  move(fromIndex, toIndex) {
    const items = get().items
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= items.length ||
      toIndex >= items.length
    ) {
      return
    }
    const next = [...items]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    write(next)
    set({ items: next })
  },

  clear() {
    write([])
    set({ items: [] })
  },
}))

/** השרירים שהסל הנוכחי נוגע בהם — לחיווי "מה כבר כיסית" */
export function basketGroups(items: readonly BasketItem[]): Set<MuscleGroup> {
  return new Set(items.map((i) => i.muscleGroup))
}
