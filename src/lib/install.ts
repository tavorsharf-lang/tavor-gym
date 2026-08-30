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
 * הטוקנים שדפדפני צד-שלישי באייפון שותלים ב-userAgent. כולם רצים על אותו
 * מנוע WebKit, ולכן הטוקן הוא הדרך היחידה להבחין בהם.
 */
const IOS_THIRD_PARTY = /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/

/**
 * דפדפן מוטמע של אפליקציה אחרת (וואטסאפ, אינסטגרם, טלגרם, פייסבוק).
 *
 * ספארי אמיתי תמיד פולט טוקן `Version/<n>`; WKWebView מוטמע לא. הסינון הנוסף
 * של טוקני דפדפני צד-שלישי הוא מה שמונע מכרום ופיירפוקס באייפון ליפול לכאן —
 * גם הם בלי `Version/`, אבל הם דפדפן מלא ולא חלון בתוך אפליקציה.
 *
 * ההבחנה הזו נושאת משקל אמיתי ולא רק נוסח: בדפדפן מוטמע אין "הוסף למסך הבית"
 * בגיליון השיתוף, אין Service Worker (הדומיין אינו app-bound), וה-IndexedDB
 * יושב בקונטיינר של האפליקציה המארחת — דלי שלישי שייעלם איתה. זה גם המסלול
 * שכל מי שיקבל את הקישור בוואטסאפ ינחת בו, ולא מקרה קצה.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return isIOS() && !/Version\/\d/.test(ua) && !IOS_THIRD_PARTY.test(ua)
}

/** ספארי אמיתי באייפון — הדפדפן היחיד ב-iOS שיש בו "הוסף למסך הבית" */
export function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return isIOS() && /Version\/\d/.test(ua) && !IOS_THIRD_PARTY.test(ua)
}
