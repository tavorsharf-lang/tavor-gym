import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isStandalone } from '@/lib/install'

const KEY = 'tavor-gym:launched'

/**
 * פתיחה קרה של האפליקציה המותקנת נוחתת תמיד בבית.
 *
 * הניתוב הוא HashRouter, וב-iOS "הוסף למסך הבית" נועץ את הכתובת **שרואים
 * באותו רגע** — כולל הפרגמנט. מי שיתקין בזמן שהוא יושב על `#/settings/media`
 * יקבל קיצור שנפתח שם בכל פעם מחדש, לנצח, בלי דרך ברורה להבין למה.
 *
 * שלוש הגנות, וכולן נדרשות:
 *   • `sessionStorage` — רק בפתיחה הראשונה של המופע. ניווט רגיל בתוך
 *     האפליקציה לא נוגע בזה.
 *   • `try/catch` עם יציאה מוקדמת — גלישה פרטית זורקת בגישה לאחסון, וההוק
 *     יושב בראש Shell: זריקה כאן מפילה את כל האפליקציה.
 *   • דילוג על `/workout` ו-`/summary` — אימון פעיל הוא קו אדום בכל הקובץ
 *     הזה, ואין שום סיבה לפרוץ אותו בשביל ניקיון כתובת.
 *
 * רק באפליקציה מותקנת: בלשונית רגילה כתובת עם פרגמנט היא בקשה מכוונת של
 * המשתמש (קישור ששלח לעצמו), ולחטוף אותה היה באג.
 */
export function useColdLaunchHome(): void {
  // הכוונה היא הכתובת שבה *נפתחנו*, ולכן הערך נלכד ברינדור הראשון והמערך ריק
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return
      sessionStorage.setItem(KEY, '1')
    } catch {
      return
    }
    if (!isStandalone() || pathname === '/') return
    if (pathname.startsWith('/workout') || pathname.startsWith('/summary')) return
    navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
