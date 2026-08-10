import { describe, expect, it } from 'vitest'
import type { Exercise } from './types'
import { CATALOG_FIXES, CATALOG_FIXES_V5, applyCatalogFix } from './catalogFix'
import { SEED_EXERCISES } from './seed'

const seedById = new Map(SEED_EXERCISES.map((e) => [e.id, e]))
const v5ById = new Map(CATALOG_FIXES_V5.map((f) => [f.id, f]))

/**
 * מה התיקון האחרון שחל על התרגיל הזה. תרגיל שדור מאוחר יותר נגע בו נמדד מולו
 * ולא מול הדור שלפניו — אחרת "התמונה הקפואה" הייתה נשברת בכל שינוי קטלוג
 * לגיטימי, ומפסיקה להגן על מה שהיא נועדה להגן עליו.
 */
function latest(fix: (typeof CATALOG_FIXES)[number]): (typeof CATALOG_FIXES)[number] {
  return v5ById.get(fix.id) ?? fix
}

/** רשומה בקטלוג כפי שהיא נראית לפני התיקון */
function before(fix: (typeof CATALOG_FIXES)[number]): Exercise {
  const seed = seedById.get(fix.id)
  if (!seed) throw new Error(`אין תרגיל כזה בזריעה — ${fix.id}`)
  return {
    ...seed,
    name: fix.was,
    nameEn: 'ישן',
    subTarget: 'ישן',
    cues: fix.wasCues ? [...fix.wasCues] : seed.cues,
  }
}

describe('CATALOG_FIXES מול הזריעה', () => {
  it('כל תיקון מצביע על תרגיל שקיים', () => {
    for (const fix of [...CATALOG_FIXES, ...CATALOG_FIXES_V5]) {
      expect(seedById.has(fix.id), `${fix.id} לא בזריעה`).toBe(true)
    }
  })

  /**
   * זה השומר על התמונה הקפואה. אם מישהו ישנה שם ב-seed.ts בלי מיגרציה חדשה,
   * מכשיר מותקן היה נשאר מאחור בשקט — הבדיקה הזאת הופכת את זה לכישלון גלוי.
   */
  it('מחיל בדיוק את מה שיושב בזריעה', () => {
    for (const fix of CATALOG_FIXES.map(latest)) {
      const seed = seedById.get(fix.id)
      expect([fix.id, fix.name]).toEqual([fix.id, seed?.name])
      expect([fix.id, fix.nameEn]).toEqual([fix.id, seed?.nameEn])
      expect([fix.id, fix.subTarget]).toEqual([fix.id, seed?.subTarget])
      if (fix.cues) expect([fix.id, [...fix.cues]]).toEqual([fix.id, seed?.cues])
    }
  })

  /** דור מאוחר חייב להמשיך את הקודם, אחרת קפיצה מגרסה 1 ל-5 מפספסת אותו */
  it('כל תיקון בדור 5 ממשיך את התוצאה של דור 3', () => {
    const v3ById = new Map(CATALOG_FIXES.map((f) => [f.id, f]))
    for (const fix of CATALOG_FIXES_V5) {
      const previous = v3ById.get(fix.id)
      if (!previous) continue
      expect([fix.id, fix.was]).toEqual([fix.id, previous.name])
      if (fix.wasCues && previous.cues) {
        expect([fix.id, [...fix.wasCues]]).toEqual([fix.id, [...previous.cues]])
      }
    }
  })

  it('אין מזהה שמופיע פעמיים', () => {
    for (const list of [CATALOG_FIXES, CATALOG_FIXES_V5]) {
      const ids = list.map((f) => f.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('applyCatalogFix', () => {
  it('מתקן שם, שם באנגלית ומיקוד', () => {
    const fix = CATALOG_FIXES.find((f) => f.id === 'lat-pulldown')!
    const fixed = applyCatalogFix(before(fix))
    expect(fixed?.name).toBe('משיכת פולי עליון')
    expect(fixed?.nameEn).toBe('Lat Pulldown')
    expect(fixed?.subTarget).toBe('לטיסימוס')
  })

  it('לא נוגע בתרגיל שהמשתמש כבר שינה את שמו', () => {
    const fix = CATALOG_FIXES.find((f) => f.id === 'lat-pulldown')!
    expect(applyCatalogFix({ ...before(fix), name: 'השם שלי' })).toBeNull()
  })

  it('לא נוגע בתרגיל שאין לו תיקון', () => {
    const legPress = seedById.get('leg-press')!
    expect(applyCatalogFix(legPress)).toBeNull()
  })

  it('משאיר את המזהה, המשקל וההגדרות כמו שהם', () => {
    const fix = CATALOG_FIXES.find((f) => f.id === 'leg-curl')!
    const original = before(fix)
    const fixed = applyCatalogFix(original)
    expect(fixed?.id).toBe('leg-curl')
    expect(fixed?.seedWeightKg).toBe(original.seedWeightKg)
    expect(fixed?.weightMode).toBe(original.weightMode)
    expect(fixed?.targetSets).toBe(original.targetSets)
  })

  it('מחליף דגשים שסתרו את השם החדש', () => {
    const fix = CATALOG_FIXES.find((f) => f.id === 'abs')!
    const fixed = applyCatalogFix(before(fix))
    expect(fixed?.name).toBe('פלאנק')
    expect(fixed?.cues[0]).toBe('מרפקים מתחת לכתפיים, אמות על הרצפה')
  })

  it('משאיר דגשים שהמשתמש ערך, גם כשהשם מתוקן', () => {
    const fix = CATALOG_FIXES.find((f) => f.id === 'abs')!
    const mine = ['הדגש שלי']
    const fixed = applyCatalogFix({ ...before(fix), cues: mine })
    expect(fixed?.name).toBe('פלאנק')
    expect(fixed?.cues).toEqual(mine)
  })

  it('שתי החתירות נשארות שני תרגילים נפרדים עם אותו שם', () => {
    const rows = CATALOG_FIXES.filter((f) => f.name === 'חתירה במכונה')
    expect(rows.map((f) => f.id).sort()).toEqual(['seated-row-heavy', 'seated-row-light'])
    expect(seedById.get('seated-row-heavy')?.seedWeightKg).toBe(60)
    expect(seedById.get('seated-row-light')?.seedWeightKg).toBe(50)
  })
})
