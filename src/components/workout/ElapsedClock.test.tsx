import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ElapsedClock } from './ElapsedClock'

/**
 * שעון האימון נקרא באמצע סט, בזווית עין. שתי התכונות שחייבות להחזיק:
 * שהוא מתקדם לבד, ושהוא נגזר מחותמת ההתחלה — כך שאימון שהטלפון ננעל
 * באמצעו לא "מפסיד" את הדקות שבהן המסך היה כבוי.
 */
describe('שעון האימון', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('מציג את הזמן שעבר מתחילת האימון ומתקדם לבד', async () => {
    vi.setSystemTime(new Date('2026-08-30T10:00:00Z'))
    const startedAt = Date.now() - 90_000

    render(<ElapsedClock startedAt={startedAt} />)
    expect(screen.getByRole('timer', { name: 'זמן מתחילת האימון' }).textContent).toBe('1:30')

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByRole('timer').textContent).toBe('1:32')
  })

  it('עובר לפורמט שעות אחרי שעה, ולא מתאפס', () => {
    vi.setSystemTime(new Date('2026-08-30T10:00:00Z'))
    render(<ElapsedClock startedAt={Date.now() - 3_725_000} />)
    expect(screen.getByRole('timer').textContent).toBe('1:02:05')
  })

  it('מתעלם מקפיצת שעון לאחור ולא מציג זמן שלילי', () => {
    vi.setSystemTime(new Date('2026-08-30T10:00:00Z'))
    render(<ElapsedClock startedAt={Date.now() + 5000} />)
    expect(screen.getByRole('timer').textContent).toBe('0:00')
  })
})
