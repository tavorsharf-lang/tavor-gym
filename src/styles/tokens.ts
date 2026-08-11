/**
 * טוקני הצבע שגם JavaScript צריך.
 *
 * `theme.css` הוא מקור האמת, אבל שני צרכנים לא יכולים לקרוא ממנו: הקונפטי
 * (canvas-confetti מקבל מחרוזות צבע) והגרפים (Chart.js מצייר לקנבס). לפני זה
 * כל אחד מהם החזיק עותק משלו של הכתום, כלומר שלושה מקומות שיכולים להיפרד —
 * וזה בדיוק "שני הכתומים" שקל לא לשים לב אליו כי ההפרש קטן.
 *
 * הקובץ הזה הוא העותק היחיד ב-JS, ו-`tokens.test.ts` מאמת שהוא שווה בדיוק
 * למה שכתוב ב-`theme.css`. פירוד הופך מבאג ויזואלי שקט לכשל בדיקה.
 */

export const FLAME = {
  300: '#ffb066',
  400: '#ff8a2b',
  500: '#ff6a00',
} as const

export const PR_400 = '#4ade80'
export const BONE_50 = '#fbf9f7'

/** `rgba()` מהטוקן — Chart.js צריך מחרוזת ולא color-mix */
export function flameAlpha(alpha: number): string {
  const hex = FLAME[500]
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
