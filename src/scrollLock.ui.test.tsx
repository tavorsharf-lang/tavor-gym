import type { JSX } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import type { PlayableVideo } from '@/db/types'
import { BottomSheet } from '@/components/ui/BottomSheet'

/**
 * נעילת הגלילה כששני המודלים פתוחים יחד.
 *
 * ‏`lib/scrollLock.test.ts` בודק את המונה עצמו, והוא היה עובר בשלמותו גם אם
 * אחד משני הרכיבים היה חוזר בשקט לשמור `previous` משלו. הבדיקה כאן היא זו
 * שנועלת את *החיווט*: שני הרכיבים האמיתיים, באותו זיווג שקיים באפליקציה —
 * הנגן נפתח כ-portal אח מעל גיליון שכבר נעל.
 *
 * שני התרחישים כאן אינם אותו תרחיש, וזו הסיבה ששניהם כתובים:
 *   • **סגירה עוקבת** — הגיליון נסגר ראשון והנגן נשאר פתוח. קורה באמת
 *     ב-`ExercisePickerSheet`, שקורא `onClose()` בזמן שהגלריה עדיין פתוחה.
 *   • **הסרת עץ בבת אחת** — React מריץ ניקויי אפקטים מההורה לילד, ולכן גם
 *     כאן הגיליון משחרר ראשון והנגן כותב אחריו. סידור האחים לא מגן על זה.
 *
 * בקוד הקודם שתיהן הסתיימו באותה תוצאה: `overflow: hidden` על ה-body בלי שום
 * מודל פתוח, כלומר מסך שלא נגלל עד רענון. ב-PWA מותקן זה יציאה באמצע אימון.
 */

const clips: PlayableVideo[] = [
  {
    id: 'bundled:videos/x-1.mp4',
    url: 'blob:x-1',
    posterUrl: null,
    label: 'הדגמה',
    isLocal: true,
    durationSec: 8,
    sizeBytes: 1024,
  },
]

vi.mock('@/db/mediaDb', () => ({
  loadVideosFor: vi.fn(async () => clips),
  releaseVideos: vi.fn(),
  cacheStreamedVideo: vi.fn(async () => {}),
  deleteVideo: vi.fn(async () => {}),
}))

vi.mock('@/db/videoIssues', () => ({ videoMismatchNote: () => null }))

const { VideoPlayer } = await import('@/components/media/VideoPlayer')

/** הזיווג האמיתי: גיליון, ומעליו הנגן כאח — לא כילד */
function Pair({
  sheetOpen,
  playerOpen,
}: {
  sheetOpen: boolean
  playerOpen: boolean
}): JSX.Element {
  return (
    <>
      <BottomSheet open={sheetOpen} onClose={() => {}} title="החלפת תרגיל">
        <button type="button">תרגיל חלופי</button>
      </BottomSheet>
      <VideoPlayer
        exerciseId="press"
        exerciseName="לחיצת חזה"
        open={playerOpen}
        onClose={() => {}}
      />
    </>
  )
}

const overflow = (): string => document.body.style.overflow

beforeEach(() => {
  document.body.style.overflow = ''
})

describe('נעילת גלילה — גיליון ונגן פתוחים יחד', () => {
  it('הגיליון נסגר ראשון: הרקע נשאר נעול, ורק סגירת הנגן משחררת', async () => {
    const { rerender } = render(<Pair sheetOpen playerOpen />)
    await waitFor(() => expect(overflow()).toBe('hidden'))

    // הגיליון נסגר בזמן שהנגן עדיין פתוח — הרקע חייב להישאר נעול
    rerender(<Pair sheetOpen={false} playerOpen />)
    expect(overflow()).toBe('hidden')

    // ורק עכשיו, כשאין יותר מודל, הדף חוזר להיות גליל
    rerender(<Pair sheetOpen={false} playerOpen={false} />)
    expect(overflow()).toBe('')
  })

  it('הסרת העץ כששניהם פתוחים לא משאירה את הדף נעול', async () => {
    const { unmount } = render(<Pair sheetOpen playerOpen />)
    await waitFor(() => expect(overflow()).toBe('hidden'))

    unmount()
    expect(overflow()).toBe('')
  })

  it('ערך overflow שקדם לשני המודלים מוחזר, ולא הנעילה של אחד מהם', async () => {
    document.body.style.overflow = 'auto'
    const { rerender } = render(<Pair sheetOpen playerOpen />)
    await waitFor(() => expect(overflow()).toBe('hidden'))

    rerender(<Pair sheetOpen={false} playerOpen={false} />)
    expect(overflow()).toBe('auto')
  })

  it('כל אחד לבדו עדיין נועל ומשחרר', async () => {
    const sheet = render(<Pair sheetOpen playerOpen={false} />)
    await waitFor(() => expect(overflow()).toBe('hidden'))
    sheet.unmount()
    expect(overflow()).toBe('')

    const player = render(<Pair sheetOpen={false} playerOpen />)
    await waitFor(() => expect(overflow()).toBe('hidden'))
    player.unmount()
    expect(overflow()).toBe('')
  })
})
