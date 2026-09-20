import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastHost, toast } from './Toast'

/**
 * שני הכללים של הטוסטים, ושניהם באו מתלונה מהחדר ולא מעיצוב:
 *
 *   1. הוספת שלושה תרגילים ברצף באמצע אימון נתנה שלושה כרטיסים מוערמים
 *      שכיסו את המשקל ואת החזרות — כלומר בדיוק את מה שעומדים להקליד.
 *   2. טוסט עם פעולה נשאר על המסך עד שנגעו בו, ומי שלא נגע נשאר עם הכיסוי
 *      הזה לתמיד.
 *
 * שניהם נבדקים כאן ולא ברינדור מלא של האפליקציה: החנות היא ברמת המודול,
 * והרכיב הוא עשרים שורות.
 */

describe('טוסטים', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    // מרוקן את החנות שברמת המודול — היא שורדת בין בדיקות באותו קובץ
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    vi.useRealTimers()
  })

  it('טוסט חדש דורס את הקודם — אחד על המסך ולא ערימה', () => {
    render(<ToastHost />)

    act(() => {
      toast('מכרעים נוסף לאימון')
      toast('סקוואט בולגרי נוסף לאימון')
      toast('הרמת עקבים נוספה לאימון')
    })

    expect(screen.getByText('הרמת עקבים נוספה לאימון')).toBeTruthy()
    expect(screen.queryByText('מכרעים נוסף לאימון')).toBeNull()
    expect(screen.queryByText('סקוואט בולגרי נוסף לאימון')).toBeNull()
  })

  it('גם טוסט עם פעולה נעלם לבד, אחרי חלון ארוך יותר', () => {
    render(<ToastHost />)

    act(() => {
      toast('התרגיל נוסף', { actionLabel: 'התחל עכשיו', onAction: vi.fn() })
    })
    expect(screen.getByRole('button', { name: 'התחל עכשיו' })).toBeTruthy()

    // אחרי חלון הטוסט הרגיל הוא עוד שם — יש מה ללחוץ עליו
    act(() => {
      vi.advanceTimersByTime(4_500)
    })
    expect(screen.getByRole('button', { name: 'התחל עכשיו' })).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    // ‏260ms של יציאה: הוא עוד מצויר, אבל כבר לא נמצא לאף קורא
    expect(screen.queryByRole('button', { name: 'התחל עכשיו' })).toBeNull()

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.queryByText('התרגיל נוסף')).toBeNull()
  })

  it('טוסט שנסגר מחליק החוצה לפני שהוא יורד מה-DOM', () => {
    render(<ToastHost />)

    act(() => {
      toast('התרגיל נוסף')
    })
    act(() => {
      screen.getByRole('button', { name: 'התרגיל נוסף' }).click()
    })

    /*
      בלי חלון היציאה הזה הטוסט נכנס ב-340ms ונעלם בפריים אחד. הוא עדיין
      בעץ — אחרת אין לו במה לצאת — אבל `aria-hidden` כבר מוציא אותו מהכרזת
      ה-`aria-live`, ולכן חיפוש לפי תפקיד לא מוצא אותו.
    */
    expect(screen.queryByRole('button', { name: 'התרגיל נוסף' })).toBeNull()
    expect(screen.getByText('התרגיל נוסף')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.queryByText('התרגיל נוסף')).toBeNull()
  })

  it('הפעולה עדיין רצה בלחיצה, והטוסט נסגר אחריה', () => {
    const onAction = vi.fn()
    render(<ToastHost />)

    act(() => {
      toast('התרגיל נוסף', { actionLabel: 'התחל עכשיו', onAction })
    })
    act(() => {
      screen.getByRole('button', { name: 'התחל עכשיו' }).click()
    })

    expect(onAction).toHaveBeenCalledTimes(1)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.queryByText('התרגיל נוסף')).toBeNull()
  })
})
