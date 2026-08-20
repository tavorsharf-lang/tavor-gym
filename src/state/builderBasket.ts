import { create } from 'zustand'
import type { MuscleGroup } from '@/db/types'

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
  move: (fromIndex: number, toIndex: number) => void
  clear: () => void
}

function read(): BasketItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // סינון הגנתי: הסל שורד עדכוני גרסה, ורשומה פגומה לא תפיל מסך
    return parsed.filter(
      (i): i is BasketItem =>
        typeof i === 'object' && i !== null && typeof (i as BasketItem).id === 'string'
    )
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
