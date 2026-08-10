import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** כמה פריימים מנסים להגיע ליעד לפני שמוותרים */
const SETTLE_FRAMES = 30

/**
 * זיכרון מקום הגלילה בין מסכים.
 *
 * מסך שנפתח קדימה מתחיל מלמעלה, אבל חזרה אחורה מחזירה למקום שממנו יצאנו:
 * מי שגלל לאמצע מאגר התרגילים, נכנס לתרגיל, צפה בסרטונים וחזר — נוחת על אותו
 * תרגיל ולא בראש הרשימה. בלי זה כל כניסה לתרגיל מאבדת את מקום הקריאה, ובמאגר
 * של 62 תרגילים זו גלילה מחדש בכל פעם.
 *
 * המפתח הוא location.key ולא הנתיב: אותו נתיב יכול להופיע כמה פעמים בהיסטוריה,
 * ולכל מופע מקום גלילה משלו.
 */
export function useScrollMemory(): void {
  const { key } = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  const activeKey = useRef(key)

  useEffect(() => {
    // הדפדפן משחזר גלילה בעצמו ב-POP, לפי הגובה שהיה לפני הניווט ובתזמון משלו.
    // כאן זה מתנגש עם השחזור שלנו, אז לוקחים את ההגה.
    const previous = history.scrollRestoration
    history.scrollRestoration = 'manual'

    // שומרים תוך כדי גלילה ולא בעזיבת המסך: כשהעזיבה מגיעה, המסך החדש כבר
    // אופס את הגלילה ואין מה לשמור. activeKey דרך ref כדי שאירוע גלילה שמגיע
    // באיחור ייזקף לרשומה הנכונה.
    const save = () => positions.current.set(activeKey.current, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })

    return () => {
      window.removeEventListener('scroll', save)
      history.scrollRestoration = previous
    }
  }, [])

  useLayoutEffect(() => {
    activeKey.current = key
    const target = navigationType === 'POP' ? positions.current.get(key) : undefined

    if (!target) {
      window.scrollTo(0, 0)
      return
    }

    /*
      התוכן גדל אחרי הרינדור הראשון — התמונות הממוזערות נטענות מ-IndexedDB, ורק
      כשהן מגיעות לשורות יש גובה מלא. גלילה חד-פעמית כאן הייתה נחתכת לגובה
      הקצר של הרגע הזה ומנחיתה את המשתמש גבוה מדי, ולכן מכוונים שוב כל פריים
      עד שהיעד באמת מושג.
    */
    let frames = 0
    let raf = 0
    const settle = () => {
      window.scrollTo(0, target)
      if (window.scrollY < target && frames++ < SETTLE_FRAMES) {
        raf = requestAnimationFrame(settle)
      }
    }
    settle()

    // אם המשתמש גולל בעצמו בינתיים — הוא מנצח, ואנחנו מפסיקים לכוון
    const stop = () => cancelAnimationFrame(raf)
    window.addEventListener('touchstart', stop, { passive: true, once: true })
    window.addEventListener('wheel', stop, { passive: true, once: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('wheel', stop)
    }
  }, [key, navigationType])
}
