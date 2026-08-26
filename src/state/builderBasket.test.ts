import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BasketItem } from './builderBasket'

/**
 * הסל שורד עדכון גרסה — הוא ב-localStorage ולא במסד, ולכן מיגרציית Dexie לא
 * מגיעה אליו. זו הבדיקה של הפער הזה: פריט שנבחר לפני שקבוצת "שוק" אוחדה לתוך
 * "רגליים" חוזר עם קבוצה שכבר אין לה תווית, ו-`MUSCLE_GROUPS[...]` מתפוצץ
 * עליה בפס הסל (`undefined.label`) עוד לפני שהמשתמש הספיק לפתוח את הגיליון.
 *
 * שני דברים שסביבת הבדיקות מכתיבה כאן:
 *
 *  1. **‏localStorage מזויף במפורש.** ה-`localStorage` הגלובלי בהרצה הזו הוא
 *     אובייקט ריק בלי שיטות בכלל (אזהרת `--localstorage-file` בפלט), ולכן
 *     `read()` ו-`write()` נופלים לתוך ה-catch שלהם ומחזירים סל ריק תמיד.
 *     בלי הזיוף כאן הבדיקה הייתה "עוברת" על מסלול שלא רץ.
 *  2. **טעינה ב-`import` דינמי אחרי `resetModules`.** ה-store קורא את
 *     האחסון פעם אחת, ברגע יצירת המודול, ולכן הכתיבה חייבת לקרות לפניו.
 */

const STORAGE_KEY = 'tavor-gym:builder-basket'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadWith(stored: unknown): Promise<BasketItem[]> {
  store.set(STORAGE_KEY, JSON.stringify(stored))
  vi.resetModules()
  const { useBasket } = await import('./builderBasket')
  return useBasket.getState().items
}

describe('הסל קורא תצלומים ישנים', () => {
  it('פריט שנבחר תחת "שוק" חוזר כרגליים', async () => {
    const items = await loadWith([
      { id: 'calf-raise', name: 'הרמת עקבים', muscleGroup: 'calves', needsCatalogEntry: false },
    ])
    expect(items).toHaveLength(1)
    expect(items[0].muscleGroup).toBe('legs')
    // רק הקבוצה מתורגמת — כל השאר הוא התצלום כמו שהיה
    expect(items[0].name).toBe('הרמת עקבים')
  })

  it('קבוצה שאין לה יורשת מפילה את הפריט ולא את המסך', async () => {
    const items = await loadWith([
      { id: 'a', name: 'א', muscleGroup: 'שריר שהומצא', needsCatalogEntry: false },
      { id: 'b', name: 'ב', muscleGroup: 'chest', needsCatalogEntry: false },
    ])
    expect(items.map((i) => i.id)).toEqual(['b'])
  })

  it('סל תקין עובר כמו שהוא', async () => {
    const stored: BasketItem[] = [
      { id: 'leg-press', name: 'לחיצת רגליים', muscleGroup: 'legs', needsCatalogEntry: false },
      { id: 'lib-crunch', name: 'כפיפות בטן', muscleGroup: 'abs', needsCatalogEntry: true },
    ]
    expect(await loadWith(stored)).toEqual(stored)
  })
})
