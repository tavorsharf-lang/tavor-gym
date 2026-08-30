import type { JSX, ReactNode } from 'react'
import { CloudOff, Dumbbell, PlayCircle, ShieldCheck } from 'lucide-react'
import { Screen } from '@/components/shell/ScreenHeader'
import { Button } from '@/components/ui'
import { InstallCard } from '@/components/onboarding/InstallCard'
import { isInAppBrowser, isStandalone } from '@/lib/install'
import { useSWUpdate } from '@/hooks/useSWUpdate'

/**
 * מסך הפתיחה — מוצג פעם אחת, בהתקנה חדשה בלבד.
 *
 * הוא מרונדר כ-early return מתוך Shell ולא כנתיב, בכוונה: ב-iOS "הוסף למסך
 * הבית" נועץ את הפרגמנט שעל המסך, ו-`#/welcome` היה עלול להפוך לכתובת הפתיחה
 * הקבועה של מישהו. גם לא `BottomSheet` — גיליון נסגר בנגיעה ברקע, וזה צריך
 * להיסגר בכוונה.
 *
 * **הוא לא שואל כלום.** אין פיצול "התחל ריק" מול "קח את הקטלוג", ומסיבות
 * מכניות ולא אסתטיות: קטלוג ריק שממומש כמחיקה נזרע בחזרה בפתיחה הקרה הבאה
 * (ענף התיקון ב-`ensureReady` יורה על "אין תרגילים" לבדו); כיבוי F1/F2 מפיל
 * את `getActiveRoutines` חזרה לכל תוכניות התוכנית; ולקטלוג ריק אין שום מסלול
 * לסט ראשון, שהוא המדד שכל המסך הזה משרת. מרגע שהמשקלים ריקים הקטלוג ממילא
 * כבר לא אישי — הוא רשימה של מכונות, וכל שורה ניתנת לעריכה או להסתרה. המסך
 * מצהיר את זה במקום לשאול.
 */

function Row({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}): JSX.Element {
  return (
    <li className="flex gap-3.5">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-flame-500/12 text-flame-400">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[0.9375rem] font-extrabold text-bone-50">{title}</h2>
        <p className="mt-0.5 text-sm leading-relaxed text-bone-400">{children}</p>
      </div>
    </li>
  )
}

export function WelcomeScreen({ onDone }: { onDone: (to: string) => void }): JSX.Element {
  const { offlineReady } = useSWUpdate(false)
  const installed = isStandalone()

  /*
    בדפדפן מוטמע אין Service Worker בכלל — הדומיין אינו app-bound, ולכן
    `offlineReady` יישאר false לנצח בלי שגיאה ובלי טיימאאוט. בלי המצב הזה
    השורה הייתה נתקעת על "עוד רגע" עד סוף הזמן.
  */
  const noServiceWorker =
    isInAppBrowser() || typeof navigator === 'undefined' || !('serviceWorker' in navigator)

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-ink-950">
      <Screen dock={false}>
        {/*
          ‏pt-safe ביד: `Screen` מוסיף רק ריפוד צדדי ותחתון, וכל הריפוד העליון
          באפליקציה מגיע מ-`ScreenHeader`. בלי זה הכותרת נכנסת מתחת ל-Dynamic
          Island באפליקציה מותקנת — ה-viewport הוא viewport-fit=cover ושורת
          המצב שקופה. אותה תבנית בדיוק ב-HomeScreen וב-StatsScreen.
        */}
        <header className="pt-safe mb-5">
          <p className="meta">ברוך הבא</p>
          <h1 className="mt-1 text-3xl font-extrabold text-bone-50">אימוני כושר</h1>
          <p className="mt-2 text-sm leading-relaxed text-bone-400">
            מחברת אימונים לחדר הכושר: מתעדים כל סט תוך כדי, והאפליקציה זוכרת
            מה הרמת ומציעה לאן להמשיך.
          </p>
        </header>

        <ul className="space-y-4">
          <Row icon={<ShieldCheck size={18} />} title="הכול נשאר במכשיר הזה">
            אין חשבון, אין הרשמה ואין שרת. שום דבר ממה שתתעד לא יוצא מהאייפון
            שלך — וגיבוי הוא קובץ שאתה שומר לעצמך, מתי שתרצה.
          </Row>

          <Row icon={<Dumbbell size={18} />} title="הקטלוג מוכן — המשקלים שלך">
            כל התרגילים מגיעים עם דגשי ביצוע ותוכניות, אבל בלי מספרים: הסט
            הראשון שתתעד בכל תרגיל הוא שיקבע את המשקל שלך. אפשר לערוך, להסתיר
            או להוסיף תרגילים בכל רגע.
          </Row>

          <Row icon={<CloudOff size={18} />} title="עובד בלי רשת">
            {noServiceWorker
              ? 'בדפדפן הזה אין שמירה אופליין. אחרי ההוספה למסך הבית — יש.'
              : offlineReady
                ? 'מוכן. האפליקציה שמורה במכשיר ותיפתח גם כשאין קליטה במכון.'
                : 'שומר את עצמו ברקע ממש עכשיו — כדאי להישאר מחובר עוד רגע.'}
          </Row>

          <Row icon={<PlayCircle size={18} />} title="סרטון לכל תרגיל">
            ההדגמות צולמו בחדר כושר אמיתי, על המכונות עצמן, כדי שיהיה ברור מה
            כל תרגיל. אפשר להוריד אותן למכשיר ולצפות גם בלי רשת.
          </Row>
        </ul>

        <div className="mt-7 space-y-3 pb-6">
          {installed ? (
            <Button variant="flame" size="hero" fullWidth onClick={() => onDone('/')}>
              יאללה, מתחילים
            </Button>
          ) : (
            <>
              <InstallCard />
              <div>
                <Button variant="quiet" size="md" fullWidth onClick={() => onDone('/')}>
                  המשך בלשונית בינתיים
                </Button>
                <p className="mt-1 text-center text-xs text-bone-500">
                  עובד גם ככה. ההוראות ימתינו לך במסך ההגדרות.
                </p>
              </div>
            </>
          )}

          {/*
            הכפתור הזה הוא לא נימוס — הוא הדרך חזרה.

            מסך הפתיחה הוא early return מעל `<Routes>`, כלומר הוא חוסם את
            `/settings/backup`. מי שדלי האחסון שלו נמחק (פינוי מקום, מחיקת
            הקיצור והתקנה מחדש) נראה מכאן בדיוק כמו מכשיר חדש — ובלי הכפתור
            הזה חודשי היסטוריה היו יושבים בקובץ גיבוי מעבר לדלת נעולה.
          */}
          <Button variant="quiet" size="md" fullWidth onClick={() => onDone('/settings/backup')}>
            כבר יש לי קובץ גיבוי לשחזר
          </Button>
        </div>
      </Screen>
    </div>
  )
}
