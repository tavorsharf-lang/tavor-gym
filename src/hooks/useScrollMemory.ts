import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * תקציב זמן לשחזור, לא תקציב פריימים.
 *
 * הגרסה הקודמת ספרה 30 פריימים של rAF — באייפון 120Hz זה רבע שנייה בלבד,
 * והמסכים כאן נטענים מ-IndexedDB: הפריים הראשון אחרי חזרה הוא רשימה ריקה
 * בגובה אפס, והנתונים מגיעים אחרי החלון. התוצאה הייתה נחיתה בראש המסך
 * בדיוק במסכים הארוכים שהזיכרון נבנה בשבילם.
 */
const SETTLE_MS = 2500

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
  /**
   * דגל "שחזור בתהליך" שמשתיק את השמירה.
   *
   * בלי זה השחזור דורס את עצמו: כשהמסמך מתקצר לרגע (רשימה שעוד נטענת),
   * הדפדפן מקצץ את scrollY ויורה אירוע scroll — והשמירה הייתה כותבת את
   * הערך המקוצץ על המיקום האמיתי. כישלון אחד היה מוחק את היעד לתמיד.
   */
  const restoring = useRef(false)

  useEffect(() => {
    // הדפדפן משחזר גלילה בעצמו ב-POP, לפי הגובה שהיה לפני הניווט ובתזמון משלו.
    // כאן זה מתנגש עם השחזור שלנו, אז לוקחים את ההגה.
    const previous = history.scrollRestoration
    history.scrollRestoration = 'manual'

    // שומרים תוך כדי גלילה ולא בעזיבת המסך: כשהעזיבה מגיעה, המסך החדש כבר
    // אופס את הגלילה ואין מה לשמור. activeKey דרך ref כדי שאירוע גלילה שמגיע
    // באיחור ייזקף לרשומה הנכונה.
    const save = () => {
      if (restoring.current) return
      positions.current.set(activeKey.current, window.scrollY)
    }
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
      התוכן גדל אחרי הרינדור הראשון — הרשימות מגיעות מ-IndexedDB והתמונות
      הממוזערות אחריהן, ורק אז יש גובה מלא. גלילה חד-פעמית הייתה נחתכת לגובה
      הקצר של הרגע הזה, ולכן מכוונים שוב כל פריים עד שהיעד באמת מושג או
      שתקציב הזמן נגמר.
    */
    restoring.current = true
    const startedAt = Date.now()
    let raf = 0
    const finish = () => {
      restoring.current = false
    }
    const settle = () => {
      window.scrollTo(0, target)
      // סף של פיקסל: scrollY יכול לעצור על ערך שבור בזום/מסכי retina
      if (window.scrollY >= target - 1 || Date.now() - startedAt >= SETTLE_MS) {
        finish()
        return
      }
      raf = requestAnimationFrame(settle)
    }
    settle()

    /*
      אם המשתמש גולל בעצמו בינתיים — הוא מנצח. מאזינים לתנועה אמיתית
      (touchmove/wheel) ולא ל-touchstart: נגיעה סתמית במסך בזמן שהרשימה עוד
      נטענת היא רגע טבעי, והיא לא סיבה לוותר על השחזור.
    */
    const stop = () => {
      cancelAnimationFrame(raf)
      finish()
    }
    window.addEventListener('touchmove', stop, { passive: true, once: true })
    window.addEventListener('wheel', stop, { passive: true, once: true })

    return () => {
      cancelAnimationFrame(raf)
      finish()
      window.removeEventListener('touchmove', stop)
      window.removeEventListener('wheel', stop)
    }
  }, [key, navigationType])
}
