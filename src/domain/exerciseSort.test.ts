import { describe, expect, it } from 'vitest'
import {
  equipmentHidden,
  focusOf,
  matchesEquipment,
  pctOfSub,
  sortedBy,
  touchesSub,
} from './exerciseSort'
import type { SortableEntry } from './exerciseSort'
import type { Equipment } from '@/db/types'

/**
 * המיון נשען על שלוש טבלאות שנכתבו בנפרד — הכרטיסים, התמלול והטקסונומיה —
 * ולכן הבדיקות כאן משתמשות בתרגילים אמיתיים מהקטלוג ולא בנתוני דמה. תרגיל
 * שיאבד את הכרטיס שלו ישבור אותן, וזה בדיוק מה שצריך לקרות.
 */

function entry(id: string, name: string, equipment: Equipment = 'machine'): SortableEntry {
  return { id, name, exercise: { id, equipment } }
}

describe('מיון רשימת התרגילים', () => {
  it('אחוז על השריר הנבחר מגיע מהכרטיס, אחרי המיזוג לשם שלנו', () => {
    // הארכת ברך היא ארבעה ראשים שכולם ארבע-ראשי — 45+25+20+10
    expect(pctOfSub(entry('leg-extension', 'הארכת ברך'), 'ארבע-ראשי')).toBe(100)
    // מכונת הרגליים: שלושה ראשים (50+30+15) ועוד עכוז
    expect(pctOfSub(entry('leg-press', 'מכונת רגליים'), 'ארבע-ראשי')).toBe(95)
    expect(pctOfSub(entry('leg-press', 'מכונת רגליים'), 'עכוז גדול')).toBe(5)
    // שריר שאינו על הכרטיס אינו אפס — הוא היעדר נתון
    expect(pctOfSub(entry('leg-press', 'מכונת רגליים'), 'חזה עליון')).toBeNull()
  })

  it('תרגיל בלי מפה מחזיר null ולא אפס', () => {
    /*
      כפיפת שורש כף היד בדאמבל: הכרטיס שלה נושא שני תרגילים ולכן מסתכם ב-200,
      ו-`loadMapFor` מסרב לתת לו מפה. השורה הזו נועלת שהיעדר הנתון עובר עד
      לכאן כ-null — מספר היה מסדר אותה בין תרגילים שנמדדו באמת.
    */
    expect(pctOfSub(entry('forearm-dumbbell', 'כפיפת אמה'), 'כופפי אמה')).toBeNull()
    expect(focusOf(entry('forearm-dumbbell', 'כפיפת אמה'))).toBeNull()
    expect(touchesSub(entry('forearm-dumbbell', 'כפיפת אמה'), 'כופפי אמה')).toBe(false)
  })

  it('ממוקד הוא האחוז של השריר החזק', () => {
    // בידוד טהור מול תרגיל שמפזר
    expect(focusOf(entry('leg-extension', 'הארכת ברך'))).toBe(100)
    expect(focusOf(entry('leg-press', 'מכונת רגליים'))).toBe(95)
    expect(focusOf(entry('machine-squat', 'סקוואט במכונה'))).toBe(95)
  })

  it('מיון לפי אחוז — מהגבוה לנמוך, ומי שאין לו נתון בתחתית', () => {
    const list = [
      entry('leg-press', 'מכונת רגליים'),
      entry('forearm-dumbbell', 'כפיפת אמה'),
      entry('leg-extension', 'הארכת ברך'),
    ]
    const sorted = sortedBy(list, { key: 'pct', desc: true }, { sub: 'ארבע-ראשי' })
    expect(sorted.map((e) => e.id)).toEqual(['leg-extension', 'leg-press', 'forearm-dumbbell'])
  })

  it('הפיכת הכיוון לא מעלה את מי שאין לו נתון', () => {
    /*
      זו לא קפדנות: "בלי נתון" אינו הקטן ביותר אלא לא-מספר, והפיכת כיוון היא
      שאלה על המספרים. אילו הוא היה עולה לראש, הלחיצה שאמורה לענות "מה הכי
      פחות עובד על השריר" הייתה מחזירה דווקא את מי שלא נמדד.
    */
    const list = [
      entry('leg-press', 'מכונת רגליים'),
      entry('forearm-dumbbell', 'כפיפת אמה'),
      entry('leg-extension', 'הארכת ברך'),
    ]
    const sorted = sortedBy(list, { key: 'pct', desc: false }, { sub: 'ארבע-ראשי' })
    expect(sorted.map((e) => e.id)).toEqual(['leg-press', 'leg-extension', 'forearm-dumbbell'])
  })

  it('מיון לפי ביצוע אחרון — ומעולם-לא הוא הרחוק ביותר, לא חוסר נתון', () => {
    const list = [entry('a', 'א'), entry('b', 'ב'), entry('c', 'ג')]
    const lastAt = new Map([
      ['a', 3_000],
      ['b', 1_000],
    ])

    // החדש קודם, ומי שלא בוצע מעולם בתחתית
    expect(sortedBy(list, { key: 'recent', desc: true }, { lastAt }).map((e) => e.id)).toEqual([
      'a',
      'b',
      'c',
    ])
    /*
      הכיוון ההפוך הוא ברירת המחדל של מסך הבונה מאז ומתמיד: "הכי מזמן שלא
      עשית" מתחיל במה שלא עשית מעולם. לכן `-Infinity` ולא null.
    */
    expect(sortedBy(list, { key: 'recent', desc: false }, { lastAt }).map((e) => e.id)).toEqual([
      'c',
      'b',
      'a',
    ])
  })

  it('שוויון נשבר בשם ולא בסדר הקלט', () => {
    /*
      הרשימה מגיעה מ-useLiveQuery ומתחלפת בכל כתיבה למסד. בלי שובר שוויון
      קבוע, שתי שורות באותו אחוז היו מחליפות מקום מעצמן בין רינדורים.
    */
    const list = [entry('z', 'תרגיל ב'), entry('y', 'תרגיל א')]
    const sorted = sortedBy(list, { key: 'focus', desc: true }, {})
    expect(sorted.map((e) => e.id)).toEqual(['y', 'z'])
  })

  it('"רגיל" מאציל למיון של המסך', () => {
    const list = [entry('a', 'ב'), entry('b', 'א')]
    const byId = (x: SortableEntry, y: SortableEntry): number => x.id.localeCompare(y.id)
    expect(
      sortedBy(list, { key: 'default', desc: true }, { fallback: byId }).map((e) => e.id)
    ).toEqual(['a', 'b'])
  })

  it('מסנן ציוד: סט ריק מעביר הכל, ושורת מאגר בלי תרגיל נופלת ונספרת', () => {
    const machine = entry('m', 'מכונה', 'machine')
    const cables = entry('c', 'כבל', 'cables')
    const libraryOnly: SortableEntry = { id: 'lib-x', name: 'רשומת מאגר', exercise: null }
    const list = [machine, cables, libraryOnly]

    expect(list.filter((e) => matchesEquipment(e, new Set()))).toEqual(list)
    expect(
      list.filter((e) => matchesEquipment(e, new Set(['machine' as const]))).map((e) => e.id)
    ).toEqual(['m'])
    // ומה שנפל בגלל היעדר סיווג נספר, כדי שהמסך יוכל להגיד את זה במקום להעלים
    expect(equipmentHidden(list, new Set(['machine' as const]))).toBe(1)
    expect(equipmentHidden(list, new Set())).toBe(0)
  })
})
