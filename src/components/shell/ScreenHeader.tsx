import { ChevronRight, House } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBack } from '@/hooks/useBack'
import { TAB_ROUTES } from './TabBar'

/**
 * "חזרה לדף הבית" — הדרך הקצרה החוצה, מכל מסך.
 *
 * חזרה אחורה מטפסת רשומה אחת בכל לחיצה, ומסך שנפתח מתוך מסך שנפתח מתוך גיליון
 * דורש שלוש. הבית הוא `replace` ולא רשומה חדשה: ערימת היסטוריה שמתנפחת היא מה
 * שהופך את מחוות ההחלקה של iOS לטיול דרך עותקים של אותו מסך.
 *
 * מיוצא כי שלושה מסכים מחזיקים כותרת משלהם (האימון, האימון החופשי) ולא את
 * `ScreenHeader` — והכפתור חייב להיראות ולהתנהג בהם אותו דבר.
 */
export function HomeButton({
  compact = false,
  className = '',
}: {
  /** הצורה של כותרת האימון — ריבוע 34 עם מסגרת, כמו ה-`+` שלידו */
  compact?: boolean
  className?: string
}) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/', { replace: true })}
      aria-label="חזרה לדף הבית"
      className={[
        'relative flex shrink-0 items-center justify-center active:bg-ink-800',
        // הוויזואל 34 והאצבע 44 — הפסאודו מרחיב את שטח הלחיצה בלי לשנות גובה
        compact
          ? "size-[34px] rounded-[11px] border border-ink-700 bg-ink-900 text-bone-500 after:absolute after:-inset-[5px] after:content-['']"
          : 'size-11 rounded-full text-bone-400',
        className,
      ].join(' ')}
    >
      <House size={compact ? 18 : 20} />
    </button>
  )
}

/**
 * כותרת מסך אחידה עם חזרה.
 * חץ החזרה מצביע ימינה — ב-RTL זה הכיוון של "אחורה".
 *
 * החזרה היא `useBack` כברירת מחדל, וזה לא פרט מימוש: ניווט *קדימה* אל הכתובת
 * הקודמת (navigate('/history')) פותח רשומת היסטוריה חדשה, וכל רשומה חדשה
 * נפתחת מלמעלה — כך מקום הגלילה והפילטרים אובדים, וערימת ההיסטוריה מתנפחת עד
 * שמחוות ההחלקה-אחורה של iOS מטיילת דרך עותקים של אותו מסך. `fallback` הוא
 * לאן ללכת כשאין לאן לחזור (האפליקציה נפתחה ישר בכתובת הזו).
 *
 * `onBack` נשאר ליציאות שהן באמת לא "אחורה" — סיום אימון שחוזר לבית, או עורך
 * ששואל אם לשמור לפני שהוא סוגר.
 */
export function ScreenHeader({
  title,
  subtitle,
  action,
  onBack,
  fallback = '/',
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  onBack?: () => void
  /** לאן ללכת כשאין היסטוריה לחזור אליה */
  fallback?: string
}) {
  const goBack = useBack(fallback)
  const back = onBack ?? goBack
  /*
    במסכי הסרגל התחתון "בית" כבר יושב על המסך, וכפתור שני באותו יעד היה רעש
    ולא קיצור. בכל שאר המסכים אין סרגל, ושם הוא הדרך היחידה החוצה בלחיצה אחת.
  */
  const { pathname } = useLocation()
  const showHome = !TAB_ROUTES.includes(pathname)

  return (
    <header
      className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-2 border-b border-ink-800/70 bg-ink-950/80 px-4 pb-3 backdrop-blur-xl"
      style={{ paddingTop: 'calc(var(--safe-t) + 0.75rem)' }}
    >
      <button
        onClick={back}
        aria-label="חזרה"
        className="-ms-2 flex size-11 shrink-0 items-center justify-center rounded-full text-bone-400 active:bg-ink-800"
      >
        <ChevronRight size={24} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-extrabold text-bone-50">{title}</h1>
        {subtitle && <p className="truncate text-xs text-bone-500">{subtitle}</p>}
      </div>
      {action}
      {showHome && <HomeButton className="-me-2" />}
    </header>
  )
}

/** מעטפת מסך רגילה: ריפוד צדדי, מקום לסרגל התחתון, גלילה נעימה */
export function Screen({ children, dock = true }: { children: ReactNode; dock?: boolean }) {
  return (
    <div className={`mx-auto min-h-dvh w-full max-w-lg px-4 ${dock ? 'pb-dock' : 'pb-safe'}`}>
      {children}
    </div>
  )
}
