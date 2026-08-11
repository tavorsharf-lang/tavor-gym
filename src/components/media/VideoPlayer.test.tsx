import type { JSX } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PlayableVideo } from '@/db/types'

/**
 * ניווט בין הסרטונים.
 *
 * אחרי שסרטוני המאגר נכנסו לאימון יש עד 23 סרטונים לתרגיל, והמעבר ביניהם הפך
 * לפעולה השכיחה במסך הזה. הבדיקות נועלות את שלוש הכניסות — חיצים, מקלדת
 * והחלקה — ובעיקר את שני התנאים שמונעים החלפה בטעות.
 */

const clips: PlayableVideo[] = Array.from({ length: 12 }, (_, i) => ({
  id: `bundled:videos/lib/x-${i + 1}.mp4`,
  url: `blob:x-${i + 1}`,
  posterUrl: null,
  label: `הסבר ${i + 1}`,
  isLocal: true,
  durationSec: 8,
  sizeBytes: 1024,
}))

vi.mock('@/db/mediaDb', () => ({
  loadVideosFor: vi.fn(async () => clips),
  releaseVideos: vi.fn(),
  cacheStreamedVideo: vi.fn(async () => {}),
  deleteVideo: vi.fn(async () => {}),
}))

vi.mock('@/db/videoIssues', () => ({ videoMismatchNote: () => null }))

const { VideoPlayer } = await import('./VideoPlayer')

function Player(): JSX.Element {
  return (
    <VideoPlayer exerciseId="press" exerciseName="לחיצת חזה" open onClose={() => {}} />
  )
}

/** המונה בכותרת הוא מקור האמת למיקום */
function position(): string {
  return screen.getByRole('progressbar').getAttribute('aria-valuenow') ?? '?'
}

/** מדמה החלקה על אזור הסרטון */
async function swipe(dx: number, dy = 0): Promise<void> {
  const area = screen.getByRole('progressbar').closest('[role="dialog"]')!
  const target = area.querySelector('.touch-pan-y') as HTMLElement
  const { fireEvent } = await import('@testing-library/react')
  fireEvent.pointerDown(target, { clientX: 200, clientY: 300 })
  fireEvent.pointerUp(target, { clientX: 200 + dx, clientY: 300 + dy })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('VideoPlayer — מעבר בין סרטונים', () => {
  it('החיצים מתקדמים וחוזרים', async () => {
    const user = userEvent.setup()
    render(<Player />)
    await screen.findByRole('progressbar')

    expect(position()).toBe('1')
    await user.click(screen.getAllByLabelText('הסרטון הבא')[0])
    expect(position()).toBe('2')
    await user.click(screen.getAllByLabelText('הסרטון הקודם')[0])
    expect(position()).toBe('1')
  })

  /**
   * מחזורי ולא חסום: ברשימה של 23 הסברים, "הבא" שנעצר בסוף מחייב 22 לחיצות
   * חזרה כדי להגיע לתחילתה.
   */
  it('"הקודם" מהראשון מגיע לאחרון', async () => {
    const user = userEvent.setup()
    render(<Player />)
    await screen.findByRole('progressbar')

    await user.click(screen.getAllByLabelText('הסרטון הקודם')[0])
    expect(position()).toBe(String(clips.length))
  })

  it('חצי המקלדת מנווטים לפי RTL — שמאלה מקדם', async () => {
    const user = userEvent.setup()
    render(<Player />)
    await screen.findByRole('progressbar')

    await user.keyboard('{ArrowLeft}')
    expect(position()).toBe('2')
    await user.keyboard('{ArrowRight}')
    expect(position()).toBe('1')
  })

  it('החלקה שמאלה מקדמת, ימינה מחזירה', async () => {
    render(<Player />)
    await screen.findByRole('progressbar')

    await swipe(-90)
    expect(position()).toBe('2')
    await swipe(90)
    expect(position()).toBe('1')
  })

  /**
   * שני התנאים שמגנים על הפקדים המובנים של הנגן: המשתמש גורר עליהם את סרגל
   * הזמן, ובלעדיהם כל גרירה קטנה או אנכית הייתה מדלגת סרטון.
   */
  it('תנועה קצרה לא מחליפה סרטון', async () => {
    render(<Player />)
    await screen.findByRole('progressbar')

    await swipe(-30)
    expect(position()).toBe('1')
  })

  it('תנועה שהיא בעיקר אנכית לא מחליפה סרטון', async () => {
    render(<Player />)
    await screen.findByRole('progressbar')

    await swipe(-70, 200)
    expect(position()).toBe('1')
  })
})

describe('VideoPlayer — מחוון המיקום', () => {
  /**
   * שורת הנקודות הייתה נקודה לכל סרטון — 23 נקודות ברוחב שגולש מהמסך. מעל
   * הסף מוצג פס, ומתחתיו נקודות שאפשר לפגוע בהן.
   */
  it('מעל 10 סרטונים מוצג פס ולא נקודות', async () => {
    render(<Player />)
    await screen.findByRole('progressbar')

    expect(screen.queryByLabelText('סרטון 1')).toBeNull()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe(
      String(clips.length)
    )
  })
})
