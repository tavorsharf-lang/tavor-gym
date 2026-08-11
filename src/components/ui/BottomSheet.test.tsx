import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { JSX } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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
