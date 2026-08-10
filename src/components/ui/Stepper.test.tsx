import { useState } from 'react'
import type { JSX } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from './Stepper'

/**
 * הפקד שמזינים דרכו כל סט. שתי ההתנהגויות שנבדקות כאן הן שתי תלונות אמיתיות
 * מהחדר, ולא פרטי מימוש:
 *
 *   1. "אני מקליד כמה חזרות ולא רואים שינוי" — הערך היה נשמר רק ב-blur, אבל
 *      `pointerdown` על "סיים סט" קודם ל-blur, ולכן הסט נרשם עם המספר הישן.
 *   2. "אני רוצה לרשום בדיוק מה שכתוב על המכונה" — הקלדה הוצמדה לרשת הקפיצות
 *      של התרגיל, ומכונה שמסומנת 62 הייתה קופצת ל-62.5.
 */
function Harness({
  step = 1,
  initial = 0,
  onValue,
}: {
  step?: number
  initial?: number
  onValue: (v: number) => void
}): JSX.Element {
  const [value, setValue] = useState(initial)
  return (
    <Stepper
      label="חזרות"
      value={value}
      step={step}
      min={0}
      onChange={(v) => {
        setValue(v)
        onValue(v)
      }}
    />
  )
}

describe('Stepper', () => {
  it('מדווח על הערך המוקלד מיד, בלי להמתין ליציאה מהשדה', async () => {
    const user = userEvent.setup()
    const seen: number[] = []
    render(<Harness onValue={(v) => seen.push(v)} />)

    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '12')

    // בלי blur, בלי Enter — מה שרואים על המסך הוא מה שנרשם
    expect(seen.at(-1)).toBe(12)
    expect((input as HTMLInputElement).value).toBe('12')
  })

  it('לא מעגל מספר שהוקלד לרשת הקפיצות', async () => {
    const user = userEvent.setup()
    const seen: number[] = []
    render(<Harness step={2.5} initial={60} onValue={(v) => seen.push(v)} />)

    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '62')
    await user.tab()

    // 62 ולא 62.5 — המספר שכתוב על המכונה הוא מדידה, לא הצעה
    expect(seen.at(-1)).toBe(62)
  })

  it('כפתורי החיצים כן נעים על רשת הקפיצות', async () => {
    const user = userEvent.setup()
    const seen: number[] = []
    render(<Harness step={2.5} initial={60} onValue={(v) => seen.push(v)} />)

    await user.click(screen.getByRole('button', { name: 'הוסף חזרות' }))
    expect(seen.at(-1)).toBe(62.5)
  })

  it('מספר שיצא מהרשת נצמד אליה בכיוון הלחיצה', async () => {
    const user = userEvent.setup()
    const seen: number[] = []
    render(<Harness step={2.5} initial={62} onValue={(v) => seen.push(v)} />)

    await user.click(screen.getByRole('button', { name: 'הוסף חזרות' }))
    expect(seen.at(-1)).toBe(62.5)

    await user.click(screen.getByRole('button', { name: 'הפחת חזרות' }))
    expect(seen.at(-1)).toBe(60)
  })

  /**
   * ה-onFocus בוחר את כל הטקסט פעמיים — פעם מיד ופעם ב-rAF, כי ספארי מאבד
   * את הבחירה בפריים הראשון. במכשיר עמוס הפריים הבא יכול לנחות *אחרי* ההקשה
   * הראשונה, ובחירה חוזרת אז הייתה מוחקת אותה.
   */
  it('בחירה חוזרת שמאחרת לא בולעת את מה שכבר הוקלד', async () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
      setTimeout(() => cb(0), 25) as unknown as number
    )
    try {
      const user = userEvent.setup({ delay: 20 })
      const seen: number[] = []
      render(<Harness step={2.5} initial={60} onValue={(v) => seen.push(v)} />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      await user.clear(input)
      await user.type(input, '62')

      expect(input.value).toBe('62')
      expect(seen.at(-1)).toBe(62)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  /**
   * רגרסיה: התצוגה עיגלה לפי הצעד בלבד. מאז שהקלדה כבר לא נצמדת לרשת, ערך
   * יכול להיות מדויק ממנה — 97.5 במכונה שקופצת ב-5 היה *נרשם* כ-97.5 ומצויר
   * כ-"98", כלומר השדה משקר בדיוק על מה שהסט תיעד.
   */
  it('השדה מציג את מה שנרשם, גם כשהוא מדויק יותר מהקפיצה', async () => {
    const user = userEvent.setup()
    const seen: number[] = []
    render(<Harness step={5} initial={95} onValue={(v) => seen.push(v)} />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    await user.clear(input)
    await user.type(input, '97.5')
    await user.tab()

    expect(seen.at(-1)).toBe(97.5)
    expect(input.value).toBe('97.5')
  })

  it('קלט לא תקין לא מייצר NaN', async () => {
    const user = userEvent.setup()
    const seen: number[] = []
    render(<Harness initial={10} onValue={(v) => seen.push(v)} />)

    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'אבג')
    await user.tab()

    expect(seen.every((v) => Number.isFinite(v))).toBe(true)
  })

  it('לא יורד מתחת למינימום', async () => {
    const user = userEvent.setup()
    const seen: number[] = []
    render(<Harness initial={0} onValue={(v) => seen.push(v)} />)

    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '-5')
    await user.tab()

    expect(seen.every((v) => v >= 0)).toBe(true)
  })
})
