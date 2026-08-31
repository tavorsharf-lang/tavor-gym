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
    // ומה שמודפס על הכרטיס נשמר, כי התמונה עצמה נמצאת מעל השורה
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

  it('כרטיס שאינו במפה מחזיר רשימה ריקה ולא נופל', () => {
    expect(loadMapFor('אין-כזה-כרטיס')).toEqual([])
  })
})
