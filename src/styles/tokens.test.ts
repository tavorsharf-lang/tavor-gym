/** @vitest-environment node */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BONE_50, FLAME, PR_400, flameAlpha } from './tokens'

/**
 * הבדיקה שמונעת "שני כתומים".
 *
 * `theme.css` צובע את כל ה-DOM, אבל הקנבס של הקונפטי ושל הגרפים מקבל מחרוזות
 * מ-JavaScript. כשמישהו יכוונן את הכתום ב-CSS בלבד, ההפרש בין השניים קטן מכדי
 * שיתפסו אותו בעין — וגדול מספיק כדי שהגרף ייראה "כמעט" בצבע של האפליקציה.
 * כאן זה נופל בבדיקות במקום להישאר על המסך.
 */

const themeCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'theme.css'),
  'utf8'
)

/** קורא ערך טוקן מתוך בלוק ה-@theme */
function cssToken(name: string): string {
  const m = themeCss.match(new RegExp(`--color-${name}:\\s*([^;]+);`))
  if (!m) throw new Error(`הטוקן --color-${name} לא נמצא ב-theme.css`)
  return m[1].trim().toLowerCase()
}

describe('טוקני צבע — JS מול CSS', () => {
  it('גווני הלהבה זהים לאלה שב-theme.css', () => {
    expect(FLAME[300]).toBe(cssToken('flame-300'))
    expect(FLAME[400]).toBe(cssToken('flame-400'))
    expect(FLAME[500]).toBe(cssToken('flame-500'))
  })

  it('ירוק השיא והלבן זהים', () => {
    expect(PR_400).toBe(cssToken('pr-400'))
    expect(BONE_50).toBe(cssToken('bone-50'))
  })

  it('flameAlpha גוזר rgba מאותו גוון', () => {
    expect(flameAlpha(0.28)).toBe('rgba(255, 106, 0, 0.28)')
    expect(flameAlpha(0)).toBe('rgba(255, 106, 0, 0)')
  })

  /**
   * הליטרלים ב-@layer components הוחלפו ב-color-mix על הטוקן. אם מישהו יחזיר
   * ליטרל, ה"שני כתומים" חוזר דרך הדלת האחורית של ה-CSS עצמו.
   */
  it('אין יותר ליטרל של גוון הלהבה ב-theme.css', () => {
    const literals = themeCss.match(/rgb\(\s*255\s+106\s+0\b/g) ?? []
    expect(literals).toEqual([])
  })
})
