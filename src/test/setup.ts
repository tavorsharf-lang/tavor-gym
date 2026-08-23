import 'fake-indexeddb/auto'
import { afterEach, vi } from 'vitest'

/**
 * סביבת הבדיקות. jsdom חסר כמעט את כל ה-API-ים שהאפליקציה נשענת עליהם
 * באייפון, ולכן כולם מקבלים כאן פנקס דמה — הקוד עצמו כבר יודע להסתדר בלעדיהם,
 * וזה בדיוק מה שהבדיקה מוודאת.
 *
 * הקובץ רץ גם בבדיקות שמוצהרות `@vitest-environment node`, שבהן אין DOM כלל.
 * לכן כל מה שנוגע ב-window יושב מאחורי `HAS_DOM`. ה-round-trip של הגיבוי חייב
 * לרוץ ב-node כדי ש-client-zip יעבוד על בייטים אמיתיים ולא על חיקוי.
 */
const HAS_DOM = typeof window !== 'undefined'

// virtual:pwa-register לא קיים מחוץ ל-Vite build
vi.mock('virtual:pwa-register', () => ({
  registerSW: () => () => Promise.resolve(),
}))

// canvas-confetti מצייר ל-canvas אמיתי ונופל ב-jsdom. הוא לא חלק מהלוגיקה
// שאנחנו בודקים, ולכן מוחלף בפונקציה ריקה.
vi.mock('canvas-confetti', () => ({
  default: Object.assign(vi.fn(), { create: () => vi.fn() }),
}))

/*
  שני כללים שנלמדו מבדיקות רועדות, ושחוזרים בכל בדיקה שמרנדרת מסך:

  1. **בבדיקת מעבר מסך, להמתין לפקד שקיים רק ביעד — לא לטקסט תוכן.**
     שם תרגיל מופיע גם בגיליון בחירת האימון וגם במסך האימון, וכותרת מסך
     מרונדרת מיד בזמן שהשורות עוד ממתינות ל-`useLiveQuery`. `waitFor` על
     אחד מאלה נפתר לפני שהמסך הנכון התייצב, והטענות שאחריו נבדקות על מצב
     ביניים. `aria-label` ייחודי הוא מה שמוכיח שהגענו.

  2. **מה שחי מחוץ למסד לא מת עם `db.delete()`.** ה-hash שבכתובת ומטמוני
     ההגדרות שברמת מודול (`hiddenVideos`, `videoPrefs`) שורדים איפוס מסד,
     ולכן איפוס של קובץ בדיקות צריך לנקות גם אותם.

  שלוש בדיקות רועדות נפרדות נבעו מהשניים האלה, וכולן נראו כמו "עומס מכונה"
  עד שנתפסה הודעת השגיאה עצמה. הרצה חוזרת שעברה אינה ראיה לכך שלא היה באג.
*/
if (HAS_DOM) {
  const { cleanup } = await import('@testing-library/react')
  afterEach(() => {
    cleanup()
    /*
      ה-hash שורד בין בדיקות באותו קובץ, והאפליקציה מנותבת דרכו. בלי האיפוס
      כאן בדיקה נפתחת במסך שהבדיקה הקודמת השאירה — תלות סדר סמויה, שכל אחד
      שנתקל בה משלם עליה שוב מקומית. מרוכז כאן כדי שאי אפשר יהיה לשכוח.
    */
    window.location.hash = ''
  })

  /*
    matchMedia — הצרכן היחיד שלו בקוד הוא `prefersReducedMotion` ב-Confetti.tsx.

    שאילתת "הפחתת תנועה" מוחזרת כמתקיימת, וזו החלטה שנמדדה ולא הונחה: עם
    `matches: false` ההרצה המלאה מסתיימת עם unhandled error אמיתי —
    `clearRect` על null מתוך canvas-confetti דרך rAF של jsdom — ו-vitest
    מזהיר במפורש ש"this might cause false positive tests". ה-mock של המודול
    כן חל על ייבוא דינמי (נמדד), ובכל זאת הספרייה האמיתית מגיעה לצייר; לא
    ירדתי לשורש המדויק, ולכן הנימוק כאן הוא התצפית ולא תיאוריה.

    מה שזה עולה: מסלול הקונפטי לא נבדק דרך רינדור מלא. `fireConfetti` עצמו
    מכוסה ישירות ב-Confetti.test.ts, כולל שני צדי ההחלטה.
  */
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia
  }

  // Screen Wake Lock
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request: vi.fn().mockRejectedValue(new Error('not supported')) },
  })

  // Storage Manager
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: {
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
      estimate: vi.fn().mockResolvedValue({ usage: 0, quota: 1_000_000_000 }),
    },
  })

  // AudioContext — האפליקציה חייבת לשרוד גם בלי אודיו
  class FakeAudioContext {
    state = 'running'
    currentTime = 0
    sampleRate = 48000
    destination = {}
    createBuffer() {
      return {}
    }
    createBufferSource() {
      return { buffer: null, connect: vi.fn(), start: vi.fn() }
    }
    createOscillator() {
      return {
        type: '',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      }
    }
    createGain() {
      return {
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
    }
    resume() {
      return Promise.resolve()
    }
  }
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })

  // ResizeObserver — Chart.js נשען עליו
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }

  // Canvas — Chart.js מצייר לתוכו
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => null
  ) as unknown as HTMLCanvasElement['getContext']

  // jsdom לא מממש גלילה, וה-shell קורא לזה בכל מעבר מסך
  window.scrollTo = vi.fn()

  // Pointer capture — ה-Stepper תופס את המצביע כדי שהאצבע תוכל להחליק מהכפתור
  // בלי שהספירה תברח. jsdom לא מממש את המשפחה הזו, ובלעדיה כל לחיצה עליו קורסת.
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = vi.fn()
    HTMLElement.prototype.releasePointerCapture = vi.fn()
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  }
}

// URL.createObjectURL — לא קיים ב-jsdom ולא בכל גרסת node, וטעינת תמונות
// ממוזערות נופלת בלעדיו
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
}
