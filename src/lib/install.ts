/**
 * זיהוי סביבת הריצה, לצורך הוראות התקנה בלבד.
 *
 * **אפס הסתמכות על `beforeinstallprompt`.** iOS לא מפעיל אותו לעולם, ולכן אין
 * כאן מאזין, אין prompt דחוי, ואין כפתור "התקן" שמדמה התקנה שלא תקרה. הכול
 * הנחיות טקסט — זה מה שבאמת עובד באייפון, וזה הקהל של הקישור הזה.
 *
 * כל הפונקציות מוגנות מפני היעדר `window`/`navigator`, כי `isStandalone` נקרא
 * גם ממסלול שרץ לפני הרינדור.
 */

/** האם האפליקציה רצה כמותקנת (מסך הבית) ולא בלשונית דפדפן */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // חייב להיות OR ולא אחד מהם: כרום מכבד רק את שאילתת המדיה, ו-iOS היסטורית
  // מסמן רק את השדה הקנייני navigator.standalone
  const mq = (q: string): boolean => window.matchMedia?.(`(display-mode: ${q})`).matches === true
  return (
    mq('standalone') ||
    mq('fullscreen') ||
    mq('minimal-ui') ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

/** iPadOS 13+ מתחזה ל-Mac ב-userAgent; ריבוי נקודות מגע הוא מה שמסגיר אותו */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/**
 * דפדפן מוטמע של אפליקציה אחרת (וואטסאפ, אינסטגרם, טלגרם, פייסבוק).
 *
 * ספארי אמיתי תמיד פולט טוקן `Version/<n>`; WKWebView מוטמע לא. זו ההבחנה
 * הקריטית כאן, ולא פרט טכני: קישור שנפתח מוואטסאפ באייפון רץ ב-WKWebView שבו
 * **אין בכלל** "הוסף למסך הבית" בגיליון השיתוף, אין Service Worker (הדומיין
 * אינו app-bound), וה-IndexedDB יושב בקונטיינר של וואטסאפ — דלי שלישי שייעלם.
 *
 * בלי הענף הזה הכרטיס היה מציג הוראות לפריט שלא קיים במסך שרואים — וזה מסלול
 * ברירת המחדל של כל מי שמקבל את הקישור, לא מקרה קצה.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return isIOS() && !/Version\/\d/.test(navigator.userAgent)
}

/** ספארי אמיתי באייפון — הדפדפן היחיד ב-iOS שיש בו "הוסף למסך הבית" */
export function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  return isIOS() && !isInAppBrowser() && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent)
}
