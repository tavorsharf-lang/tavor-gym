import type { Options } from 'canvas-confetti'
import { BONE_50, FLAME, PR_400 } from '@/styles/tokens'

/**
 * חגיגת שיא אישי.
 *
 * הספרייה נטענת ב-import דינמי בלבד — היא לא צריכה להיות בחבילה שנטענת
 * לפני האימון, ורוב האימונים בכלל לא יגיעו לשיא.
 */

export type ConfettiIntensity = 'small' | 'big'

/** רק הפלטה החמה של האפליקציה, פלוס הירוק של שיא ולבן עצם */
const COLORS = [FLAME[500], FLAME[400], FLAME[300], PR_400, BONE_50]

type ConfettiFn = (options?: Options) => Promise<null> | null

/** הספרייה נפתרת כ-CJS או כ-ESM לפי הבנייה — מאתרים את הפונקציה בשני המקרים */
function resolveConfetti(mod: unknown): ConfettiFn | null {
  if (typeof mod === 'function') return mod as ConfettiFn
  if (typeof mod === 'object' && mod !== null && 'default' in mod) {
    const fallback = (mod as { default: unknown }).default
    if (typeof fallback === 'function') return fallback as ConfettiFn
  }
  return null
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  // matchMedia חסר ב-jsdom, ולכן אופציונלי
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

const BASE: Options = {
  colors: COLORS,
  disableForReducedMotion: true,
  scalar: 1.05,
  ticks: 220,
  zIndex: 120,
}

export function fireConfetti(intensity: ConfettiIntensity = 'small'): void {
  if (prefersReducedMotion()) return

  void import('canvas-confetti')
    .then((mod) => {
      const fire = resolveConfetti(mod)
      if (fire === null) return

      if (intensity === 'small') {
        fire({ ...BASE, particleCount: 45, spread: 60, startVelocity: 34, origin: { x: 0.5, y: 0.72 } })
        return
      }

      // שתי פינות תחתונות פנימה, ועוד פיצוץ מהמרכז שממלא את האמצע
      fire({ ...BASE, particleCount: 70, angle: 62, spread: 58, startVelocity: 52, origin: { x: 0.06, y: 0.96 } })
      fire({ ...BASE, particleCount: 70, angle: 118, spread: 58, startVelocity: 52, origin: { x: 0.94, y: 0.96 } })
      fire({ ...BASE, particleCount: 110, spread: 110, startVelocity: 42, origin: { x: 0.5, y: 0.62 } })
    })
    .catch(() => {
      // חגיגה שלא נטענה לא אמורה להפריע לאימון
    })
}
