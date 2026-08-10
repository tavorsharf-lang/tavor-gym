import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { useScrollMemory } from './useScrollMemory'
import { useBack } from './useBack'

/**
 * jsdom לא גולל, ולכן מחליפים כאן גלילה מדומה: scrollY שמישהו כותב אליו,
 * ואירוע scroll שיוצא בעקבותיו — בדיוק שני הדברים שההוק נשען עליהם.
 */
let scrollY = 0

function scrollUserTo(top: number): void {
  scrollY = top
  window.dispatchEvent(new Event('scroll'))
}

function List() {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate('/item')}>
      פתח תרגיל
    </button>
  )
}

function Item() {
  const back = useBack('/')
  const navigate = useNavigate()
  return (
    <>
      <button type="button" onClick={back}>
        חזרה
      </button>
      <button type="button" onClick={() => navigate('/')}>
        קדימה לרשימה
      </button>
    </>
  )
}

function Harness() {
  useScrollMemory()
  return (
    <Routes>
      <Route path="/" element={<List />} />
      <Route path="/item" element={<Item />} />
    </Routes>
  )
}

describe('זיכרון גלילה', () => {
  beforeEach(() => {
    scrollY = 0
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY })
    window.scrollTo = ((_x: number, top: number) => scrollUserTo(top)) as typeof window.scrollTo
  })

  it('חזרה אחורה מחזירה לאותו מקום ברשימה', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    )

    scrollUserTo(340)
    await user.click(screen.getByText('פתח תרגיל'))

    // מסך התרגיל נפתח מלמעלה
    expect(scrollY).toBe(0)

    await user.click(screen.getByText('חזרה'))
    await waitFor(() => expect(scrollY).toBe(340))
  })

  it('כניסה חדשה לרשימה מתחילה מלמעלה גם אם כבר היינו בה', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    )

    scrollUserTo(340)
    await user.click(screen.getByText('פתח תרגיל'))
    // ניווט קדימה לאותה כתובת הוא ביקור חדש, לא חזרה
    await user.click(screen.getByText('קדימה לרשימה'))

    await waitFor(() => expect(screen.getByText('פתח תרגיל')).toBeTruthy())
    expect(scrollY).toBe(0)
  })
})
