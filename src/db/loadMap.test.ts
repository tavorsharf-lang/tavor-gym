import { describe, expect, it } from 'vitest'
import { loadMapFor } from './loadMap'
import { MUSCLE_BREAKDOWN } from './muscleBreakdown'
import { NOT_A_SUBTARGET } from './subTargets'

/**
 * מפת העומס נגזרת משלוש טבלאות שנכתבו בנפרד — התמלול, הטקסונומיה והכרטיסים
 * האנטומיים — ולכן היא יכולה להישבר בלי ששום קובץ בודד ייראה שגוי. הבדיקות
 * כאן נועלות את שלוש נקודות החיבור: המספרים מהתמלול, השם מהטקסונומיה,
 * והתמונה מהכרטיסים.
 */

describe('מפת העומס', () => {
  it('הכרטיס של חתירה במכונה מחזיר את ארבעת השרירים עם האחוזים שעליו', () => {
    const map = loadMapFor('seated_plate_loaded_machine_row')

    expect(map.map((s) => s.pct)).toEqual([50, 25, 15, 10])
    /*
      השמות הם ההכרעה של הטקסונומיה ולא התמלול. על הכרטיס כתוב "לטיסימוס
      דורסי", וברשימת התרגילים אותו שריר נקרא "רחב גבי" — שני שמות לאותו
      שריר במרחק מסך אחד זה מזה נקראים כשני שרירים.
    */
    expect(map.map((s) => s.name)).toEqual([
      'רחב גבי',
      'מעוינים',
      'טרפז אמצעי-תחתון',
      'כתף אחורית',
    ])
    /*
      מה שמודפס על הכרטיס נשאר בשדה אבל לא מוצג בשום מקום — הוא קיים כדי
      שאפשר יהיה לאתר מאיפה שורה הגיעה מול התמונה, וזה כל תפקידו.
    */
    expect(map[0].printed).toBe('לטיסימוס דורסי')
    expect(map[0].en).toBe('Latissimus Dorsi')
    // השריר האחרון הוא כתף ולא גב — הכרטיס אומר את זה, והמפה לא מסתירה
    expect(map[3].group).toBe('shoulders')
  })

  it('לכל שורה יש כרטיס אנטומי לפתוח — חוץ ממה שאינו תת-שריר', () => {
    for (const id of Object.keys(MUSCLE_BREAKDOWN)) {
      for (const share of loadMapFor(id)) {
        if (NOT_A_SUBTARGET.has(share.en)) expect(share.card, `${id} · ${share.en}`).toBeNull()
        else expect(share.card, `${id} · ${share.en}`).not.toBeNull()
      }
    }
  })

  it('כל מפה ממוינת מהגדול לקטן', () => {
    for (const id of Object.keys(MUSCLE_BREAKDOWN)) {
      const pcts = loadMapFor(id).map((s) => s.pct)
      expect([...pcts].sort((a, b) => b - a), id).toEqual(pcts)
    }
  })

  /*
    ארבעה-עשר מ-88 הכרטיסים מפרקים שריר לראשים שלו. מרגע שהשם היחיד שמוצג
    הוא השם שלנו, ארבע שורות "ארבע-ראשי" עם ארבעה מספרים שונים הן תצוגה
    שבורה — ולכן הן שורה אחת.
  */
  it('שורות שאנחנו קוראים להן אותו שם מתמזגות, והאחוזים נסכמים', () => {
    const map = loadMapFor('seated_leg_extension')

    expect(map).toHaveLength(1)
    expect(map[0].name).toBe('ארבע-ראשי')
    // 45 + 25 + 20 + 10, כלומר כל העבודה שהכרטיס מחלק
    expect(map[0].pct).toBe(100)
    expect(map[0].parts).toBe(4)

    // ובכרטיס בלי כפילות שום דבר לא זז
    const row = loadMapFor('seated_plate_loaded_machine_row')
    expect(row.every((s) => s.parts === 1)).toBe(true)
  })

  it('אין שני שרירים באותו שם באותה מפה', () => {
    for (const id of Object.keys(MUSCLE_BREAKDOWN)) {
      const names = loadMapFor(id).map((s) => s.name)
      expect(new Set(names).size, id).toBe(names.length)
    }
  })

  /*
    השער שמצדיק את החיבור. כרטיס שמסתכם ב-100 הוא חלוקה של אותה עוגה, וחיבור
    פרוסות שלה אינו מספר חדש; שני החורגים אינם חלוקה, ושם כל מספר שהיינו
    מציגים היה שלנו ולא שלהם.
  */
  it('כרטיס שאינו חלוקה של 100% לא מקבל מפה בכלל', () => {
    expect(loadMapFor('dumbbell_wrist_curl')).toEqual([])
    expect(loadMapFor('seated_cable_row_2')).toEqual([])
  })

  it('כל מפה שקיימת מסתכמת ב-100 — גם אחרי המיזוג', () => {
    for (const id of Object.keys(MUSCLE_BREAKDOWN)) {
      const map = loadMapFor(id)
      if (map.length === 0) continue
      expect(
        map.reduce((n, s) => n + s.pct, 0),
        id
      ).toBe(100)
    }
  })

  /*
    "מייצבים", "שרירי מייצבים" ו"מייצבי גו" הם אותו דבר בשלושה כרטיסים.
    לטקסונומיה אין להם ערך — הם אינם שריר שבונים סביבו אימון — ולכן המילה
    שמוצגת נבחרת כאן ולא מועתקת מהתמונה.
  */
  it('גם למייצבים יש שם אחד שלנו, ולא שלושה מודפסים', () => {
    const names = new Set<string>()
    for (const id of Object.keys(MUSCLE_BREAKDOWN))
      for (const share of loadMapFor(id))
        if (NOT_A_SUBTARGET.has(share.en)) names.add(share.name)

    expect([...names]).toEqual(['מייצבים'])
  })

  it('כרטיס שאינו במפה מחזיר רשימה ריקה ולא נופל', () => {
    expect(loadMapFor('אין-כזה-כרטיס')).toEqual([])
  })
})
