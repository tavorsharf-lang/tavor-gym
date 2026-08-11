import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireConfetti } from './Confetti'

/**
 * סביבת הבדיקות כופה prefers-reduced-motion (ראה src/test/setup.ts), ולכן
 * מסלול הקונפטי לא נבדק דרך רינדור מלא. כאן הוא נבדק ישירות, משני צדדיו.
 */
function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('fireConfetti', () => {
  it('לא טוען את הספרייה כשהמשתמש ביקש להפחית תנועה', async () => {
    stubReducedMotion(true)
    const mod = await import('canvas-confetti')
    fireConfetti('big')
    await Promise.resolve()
    expect(mod.default).not.toHaveBeenCalled()
  })

  it('יורה כשהתנועה מותרת', async () => {
    stubReducedMotion(false)
    const mod = await import('canvas-confetti')
    fireConfetti('small')
    // הייבוא הדינמי נפתר במיקרו-משימה
    await new Promise((r) => setTimeout(r, 0))
    expect(mod.default).toHaveBeenCalled()
  })

  it('לא זורק גם כשאין matchMedia בכלל', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(() => fireConfetti()).not.toThrow()
  })
})
