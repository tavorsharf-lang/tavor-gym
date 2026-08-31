import { describe, expect, it } from 'vitest'
import { loadMapFor, shareLabels } from './loadMap'
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

  /*
    התוויות של שורת התמונות במסך המנוחה. שם הטקסונומיה הוא ברירת המחדל, ומה
    שמודפס על הכרטיס נכנס רק כדי לשבור כפילות — אחרת הארכת ברך היא ארבעה
    אריחים זהים שכתוב עליהם "ארבע-ראשי".
  */
  it('תווית חוזרת נופלת לשם שמודפס על הכרטיס, והשאר נשארים בשם שלנו', () => {
    const quads = loadMapFor('seated_leg_extension').slice(0, 4)
    expect(quads.map((s) => s.name)).toEqual([
      'ארבע-ראשי',
      'ארבע-ראשי',
      'ארבע-ראשי',
      'ארבע-ראשי',
    ])
    expect(shareLabels(quads)).toEqual([
      'רקטוס פמוריס',
      'וסטוס לאטרליס',
      'וסטוס מדיאליס',
      'וסטוס אינטרמדיאוס',
    ])

    // ובכרטיס בלי כפילות שום שם לא משתנה
    const row = loadMapFor('seated_plate_loaded_machine_row').slice(0, 4)
    expect(shareLabels(row)).toEqual(row.map((s) => s.name))
  })

  it('כפילות נשברת רק בין מה שמוצג בפועל', () => {
    /*
      מכונת הרגליים מפרקת את הארבע-ראשי לשלושה ראשים, והרביעי הוא העכוז.
      חיתוך לשניים משאיר על המסך שתי שורות שעדיין חוזרות — ולכן שתיהן
      מקבלות את השם שעל הכרטיס, והעכוז שנחתך אינו משפיע על אף אחת.
    */
    const two = loadMapFor('45_plate_loaded_leg_press').slice(0, 2)
    expect(shareLabels(two)).toEqual(['ונדוס לטרליס', 'רקטוס פמוריס'])

    const one = loadMapFor('45_plate_loaded_leg_press').slice(0, 1)
    expect(shareLabels(one)).toEqual(['ארבע-ראשי'])
  })

  it('כרטיס שאינו במפה מחזיר רשימה ריקה ולא נופל', () => {
    expect(loadMapFor('אין-כזה-כרטיס')).toEqual([])
  })
})
