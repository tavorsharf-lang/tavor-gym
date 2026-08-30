import { afterEach, describe, expect, it } from 'vitest'
import { isIOS, isIOSSafari, isInAppBrowser, isStandalone } from './install'

/**
 * מחרוזות userAgent אמיתיות. כולן רצות על אותו מנוע WebKit באייפון, והטוקן
 * הוא ההבדל היחיד — ולכן זו בדיוק הבדיקה שאי אפשר לוותר עליה: טעות סיווג כאן
 * מציגה למי שקיבל את הקישור הוראות לכפתור שלא קיים במסך שלפניו.
 */
const UA = {
  iosSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  // וואטסאפ, אינסטגרם וטלגרם — WKWebView מוטמע, בלי טוקן Version
  whatsapp:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  // כרום באייפון: גם הוא בלי Version, ולכן רק טוקן CriOS מבדיל אותו ממוטמע
  chromeIOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  firefoxIOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15',
  // iPadOS 13+ מתחזה ל-Mac; רק maxTouchPoints מסגיר אותו
  ipad:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  desktopChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

function setAgent(userAgent: string, platform = 'iPhone', maxTouchPoints = 5): void {
  for (const [key, value] of Object.entries({ userAgent, platform, maxTouchPoints })) {
    Object.defineProperty(navigator, key, { configurable: true, value })
  }
}

afterEach(() => {
  setAgent(UA.desktopChrome, 'MacIntel', 0)
  Object.defineProperty(navigator, 'standalone', { configurable: true, value: undefined })
})

describe('isIOS', () => {
  it('מזהה אייפון', () => {
    setAgent(UA.iosSafari)
    expect(isIOS()).toBe(true)
  })

  it('מזהה אייפד שמתחזה ל-Mac לפי ריבוי נקודות מגע', () => {
    setAgent(UA.ipad, 'MacIntel', 5)
    expect(isIOS()).toBe(true)
  })

  it('לא מסמן Mac אמיתי — אותו userAgent בדיוק, בלי מסך מגע', () => {
    setAgent(UA.ipad, 'MacIntel', 0)
    expect(isIOS()).toBe(false)
  })

  it('לא מסמן דסקטופ', () => {
    setAgent(UA.desktopChrome, 'MacIntel', 0)
    expect(isIOS()).toBe(false)
  })
})

describe('הבחנה בין ספארי, דפדפן מוטמע ודפדפן צד-שלישי', () => {
  it('ספארי באייפון הוא ספארי ולא מוטמע', () => {
    setAgent(UA.iosSafari)
    expect(isIOSSafari()).toBe(true)
    expect(isInAppBrowser()).toBe(false)
  })

  it('וואטסאפ הוא מוטמע ולא ספארי — כאן אין "הוסף למסך הבית" בכלל', () => {
    setAgent(UA.whatsapp)
    expect(isInAppBrowser()).toBe(true)
    expect(isIOSSafari()).toBe(false)
  })

  for (const [name, ua] of [
    ['כרום', UA.chromeIOS],
    ['פיירפוקס', UA.firefoxIOS],
  ] as const) {
    it(`${name} באייפון אינו ספארי, אבל גם אינו דפדפן מוטמע`, () => {
      setAgent(ua)
      expect(isIOSSafari()).toBe(false)
      expect(isInAppBrowser()).toBe(false)
    })
  }

  it('דסקטופ אינו אף אחד מהשלושה', () => {
    setAgent(UA.desktopChrome, 'MacIntel', 0)
    expect(isIOSSafari()).toBe(false)
    expect(isInAppBrowser()).toBe(false)
  })
})

describe('isStandalone', () => {
  it('שקר בלשונית רגילה — זה מה שמאפשר לכרטיס ההתקנה לרנדר null בכל הבדיקות', () => {
    setAgent(UA.iosSafari)
    expect(isStandalone()).toBe(false)
  })

  it('אמת כש-navigator.standalone דלוק, גם בלי שאילתת מדיה — זה המסלול של iOS', () => {
    setAgent(UA.iosSafari)
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true })
    expect(isStandalone()).toBe(true)
  })
})
