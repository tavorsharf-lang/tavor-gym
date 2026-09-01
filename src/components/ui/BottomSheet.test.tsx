import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { JSX } from 'react'
import { describe, expect, it } from 'vitest'
import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BottomSheet } from './BottomSheet'

/**
 * הגיליון הצהיר role="dialog" ו-aria-modal מזמן, אבל Tab המשיך לטייל בתוכן
 * שמאחורי ה-backdrop — הצהרה שלא הייתה נכונה. הבדיקות כאן נועלות את שני
 * הצדדים של התיקון: שהכליאה עובדת, ושהיא *לא* עובדת כשמשהו נפתח מעל הגיליון.
 */

function Harness({ withOverlay = false }: { withOverlay?: boolean }): JSX.Element {
  const [open, setOpen] = useState(true)
  return (
    <>
      <button type="button">מאחורי הגיליון</button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="גיליון">
        <button type="button">ראשון</button>
        <button type="button">אחרון</button>
      </BottomSheet>
      {/*
        נגן הסרטונים נפתח כ-portal אח בזמן שגיליון ההחלפה עדיין פתוח — זה
        בדיוק המבנה שמשוחזר כאן.
      */}
      {withOverlay
        ? createPortal(
            // portal כמו הנגן האמיתי — סדר ה-DOM הוא מה שקובע מי למעלה
            <div role="dialog" aria-modal="true" aria-label="נגן">
              <button type="button">בנגן</button>
            </div>,
            document.body
          )
        : null}
    </>
  )
}

describe('BottomSheet — כליאת פוקוס', () => {
  it('Tab מהאחרון חוזר לראשון ולא בורח לתוכן שמאחור', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    screen.getByRole('button', { name: 'אחרון' }).focus()
    await user.tab()

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'ראשון' }))
  })

  it('Shift+Tab מהראשון מגיע לאחרון', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    screen.getByRole('button', { name: 'ראשון' }).focus()
    await user.tab({ shift: true })

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'אחרון' }))
  })

  /**
   * הרגרסיה: הכליאה חטפה את הפוקוס בחזרה לגיליון מתוך הנגן שנפתח מעליו —
   * כלומר מה שנועד למנוע דליפה יצר מלכודת.
   */
  it('לא חוטפת פוקוס מחלון שנפתח מעל הגיליון', async () => {
    const user = userEvent.setup()
    render(<Harness withOverlay />)

    const inPlayer = screen.getByRole('button', { name: 'בנגן' })
    inPlayer.focus()
    await user.tab({ shift: true })

    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'אחרון' }))
  })

  it('Escape סוגר את הגיליון', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByRole('button', { name: 'ראשון' })).toBeTruthy()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('button', { name: 'ראשון' })).toBeNull()
  })

  it('Escape לא סוגר את הגיליון כשחלון אחר פתוח מעליו', async () => {
    const user = userEvent.setup()
    render(<Harness withOverlay />)

    await user.keyboard('{Escape}')

    // הגיליון נשאר — הנגן שמעליו הוא זה שאמור להיסגר ראשון
    expect(screen.getByRole('button', { name: 'ראשון' })).toBeTruthy()
  })
})

/**
 * סגירה בהחלקה מלמעלה למטה.
 *
 * הידית שבראש הגיליון נראתה כמו ידית גרירה מאז ומתמיד והייתה קישוט בלבד —
 * האצבע משכה, וכלום לא קרה. מה שנעול כאן הוא לא האנימציה אלא שלושת התנאים
 * שמפרידים בין כוונה לבין נגיעה מקרית: משיכה ארוכה סוגרת, נפנוף קצר ומהיר
 * סוגר, ומשיכה קצרה ואיטית מחזירה את הגיליון למקומו.
 *
 * ‏`createEvent` ולא `fireEvent` ישירות: `timeStamp` הוא לקריאה בלבד ואי אפשר
 * להעביר אותו ב-init. בלי השליטה בו כל האירועים נוחתים באותה מילישנייה, כלומר
 * *כל* משיכה נקראת כנפנוף מהיר — והבדיקה שאמורה לוודא שמשיכה איטית לא סוגרת
 * הייתה עוברת מהסיבה ההפוכה בדיוק.
 */
function drag(el: HTMLElement, dy: number, ms: number): void {
  const at = (type: 'pointerDown' | 'pointerMove' | 'pointerUp', y: number, t: number): void => {
    const event = createEvent[type](el, { pointerId: 1, clientY: y })
    Object.defineProperty(event, 'timeStamp', { value: t })
    fireEvent(el, event)
  }
  at('pointerDown', 100, 1000)
  at('pointerMove', 100 + dy, 1000 + ms)
  at('pointerUp', 100 + dy, 1000 + ms)
}

describe('BottomSheet — סגירה בהחלקה', () => {
  /** אזור הגרירה הוא הידית והכותרת יחד */
  const handle = (): HTMLElement =>
    screen.getByRole('heading', { name: 'גיליון' }).parentElement as HTMLElement

  it('משיכה ארוכה למטה סוגרת', () => {
    render(<Harness />)

    drag(handle(), 140, 400)

    expect(screen.queryByRole('button', { name: 'ראשון' })).toBeNull()
  })

  it('משיכה קצרה ואיטית מחזירה את הגיליון למקומו', () => {
    render(<Harness />)

    // 40 פיקסלים לאורך 400 מילישניות — כוונה לזוז, לא לסגור
    drag(handle(), 40, 400)

    expect(screen.getByRole('button', { name: 'ראשון' })).toBeTruthy()
  })

  /*
    נפנוף: תנועה קצרה אבל מהירה. בלי הענף הזה משיכה טבעית של ארבעים פיקסלים
    הייתה מחזירה את הגיליון למקומו, וזה נקרא "לא הגיב".
  */
  it('נפנוף קצר ומהיר כן סוגר', () => {
    render(<Harness />)

    drag(handle(), 40, 40)

    expect(screen.queryByRole('button', { name: 'ראשון' })).toBeNull()
  })

  it('משיכה כלפי מעלה לא סוגרת', () => {
    render(<Harness />)

    drag(handle(), -200, 300)

    expect(screen.getByRole('button', { name: 'ראשון' })).toBeTruthy()
  })

  it('נגיעה בלי תנועה לא סוגרת', () => {
    render(<Harness />)

    drag(handle(), 0, 50)

    expect(screen.getByRole('button', { name: 'ראשון' })).toBeTruthy()
  })
})
