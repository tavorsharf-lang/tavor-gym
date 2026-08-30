import { describe, expect, it } from 'vitest'
import { MUSCLE_CARD_MANIFEST } from '@/db/muscleImageManifest'
import { MUSCLE_CARD_MAPS, groupCardFor, muscleCardFor } from '@/db/muscleCards'
import { MUSCLE_TAXONOMY } from '@/db/subTargets'
import { MUSCLE_GROUP_ORDER } from '@/db/types'

/*
  המיפוי בין התווית לכרטיס הוא היחיד כאן שנכתב ביד, ולכן הוא היחיד שיכול
  לסטות. הכשל שמאיים עליו שקט לגמרי: כותרת בלי ריבוע נראית בדיוק כמו כותרת
  שלא אמור להיות לה ריבוע. הבדיקות למטה סוגרות את שני הכיוונים.
*/
describe('כרטיסי תת-השרירים', () => {
  const labels = [...new Set(Object.values(MUSCLE_TAXONOMY).map((t) => t.sub))]

  it('לכל תווית בטקסונומיה יש כרטיס', () => {
    expect(labels.filter((sub) => !muscleCardFor(sub))).toEqual([])
  })

  it('לכל שמונה הקבוצות יש כרטיס סקירה', () => {
    expect(MUSCLE_GROUP_ORDER.filter((g) => !groupCardFor(g))).toEqual([])
  })

  /*
    הכיוון ההפוך. כרטיס שיובא ואיש אינו מצביע עליו הוא או שריר שנשכח במיפוי
    או קובץ מקור שנוסף בטעות — בשני המקרים משהו לדעת עליו, ולא 200KB שנוסעים
    לטלפון בלי סיבה.
  */
  it('כל כרטיס במניפסט מקושר למשהו', () => {
    const used = new Set([
      ...Object.values(MUSCLE_CARD_MAPS.CARD_BY_SUB),
      ...Object.values(MUSCLE_CARD_MAPS.CARD_BY_GROUP),
    ])
    expect(Object.keys(MUSCLE_CARD_MANIFEST).filter((id) => !used.has(id))).toEqual([])
  })

  it('כל מזהה במיפוי קיים במניפסט', () => {
    const ids = [
      ...Object.values(MUSCLE_CARD_MAPS.CARD_BY_SUB),
      ...Object.values(MUSCLE_CARD_MAPS.CARD_BY_GROUP),
    ]
    expect(ids.filter((id) => !MUSCLE_CARD_MANIFEST[id])).toEqual([])
  })

  /*
    שני הראשים הארוכים. זו הסיבה שהמיפוי נכתב ביד ולא נגזר משם הקובץ, ולכן
    היא נעולה במפורש: התאמה לפי "ראש ארוך" הייתה מחזירה את אותו כרטיס לשניהם.
  */
  it('הראש הארוך של הדו-ראשי אינו זה של התלת-ראשי', () => {
    const biceps = muscleCardFor('דו-ראשי — ראש ארוך')
    const triceps = muscleCardFor('תלת-ראשי — ראש ארוך')
    expect(biceps?.number).toBe(17)
    expect(triceps?.number).toBe(20)
    expect(biceps?.nameHe).toBe(triceps?.nameHe)
    expect(biceps?.src).not.toBe(triceps?.src)
  })

  it('תת-קטגוריה שאינה קיימת מחזירה null ולא נופלת', () => {
    expect(muscleCardFor('אחר')).toBeNull()
    expect(muscleCardFor('')).toBeNull()
  })
})
