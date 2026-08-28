import type { JSX, ReactNode } from 'react'
import { Compass, Share, SquarePlus, MonitorDown } from 'lucide-react'
import { isInAppBrowser, isIOSSafari, isStandalone } from '@/lib/install'

/**
 * הוראות התקנה למסך הבית.
 *
 * הכרטיס הוא טקסט בלבד, בלי כפתור התקנה — ראה את ההסבר ב-`lib/install.ts`.
 * הוא מחזיר `null` כשהאפליקציה כבר מותקנת, ולכן אפשר לשתול אותו בלי תנאי.
 *
 * **סדר הענפים הוא העיקר, לא העיצוב.** הדפדפן המוטמע נבדק ראשון: קישור שנפתח
 * מוואטסאפ באייפון רץ בדפדפן שאין בו "הוסף למסך הבית" בכלל, וכרטיס שמסביר
 * איפה הפריט הזה יושב היה שולח את מי שקיבל את הקישור לחפש כפתור שלא קיים.
 * זה מסלול ברירת המחדל של ההפצה כאן.
 */

function Step({ n, children }: { n: number; children: ReactNode }): JSX.Element {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-flame-500/15 text-[0.6875rem] font-extrabold text-flame-300">
        {n}
      </span>
      <span className="flex-1">{children}</span>
    </li>
  )
}

function Frame({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}): JSX.Element {
  return (
    <section className="rounded-card border border-flame-500/30 bg-flame-500/[0.07] p-4">
      <h2 className="mb-2.5 flex items-center gap-2 text-base font-extrabold text-bone-50">
        <span className="text-flame-400">{icon}</span>
        {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-bone-300">{children}</div>
    </section>
  )
}

export function InstallCard(): JSX.Element | null {
  if (isStandalone()) return null

  if (isInAppBrowser()) {
    return (
      <Frame icon={<Compass size={18} />} title="קודם פותחים בספארי">
        <p>
          הקישור נפתח עכשיו בתוך אפליקציה אחרת, ומשם אי אפשר להתקין — הכפתור
          פשוט לא קיים שם.
        </p>
        <ol className="space-y-1.5">
          <Step n={1}>לחץ על תפריט שלוש הנקודות בפינה</Step>
          <Step n={2}>
            בחר <b className="text-bone-100">״פתח בספארי״</b>
          </Step>
          <Step n={3}>המשך משם — ההוראות יחכו לך</Step>
        </ol>
      </Frame>
    )
  }

  if (isIOSSafari()) {
    return (
      <Frame icon={<SquarePlus size={18} />} title="להוסיף למסך הבית">
        <ol className="space-y-1.5">
          <Step n={1}>
            לחץ על כפתור השיתוף{' '}
            <Share size={14} className="inline align-[-2px] text-flame-400" /> בסרגל התחתון
          </Step>
          <Step n={2}>
            גלול ובחר <b className="text-bone-100">״הוספה למסך הבית״</b>
          </Step>
          <Step n={3}>
            לחץ <b className="text-bone-100">״הוסף״</b> — יופיע אייקון בשם ״כושר״
          </Step>
          <Step n={4}>
            פתח אותו פעם אחת <b className="text-bone-100">עם אינטרנט</b>, כדי שיוריד את
            עצמו למכשיר. מכאן זה עובד גם בלי רשת.
          </Step>
        </ol>
        <p className="pt-1 text-xs text-bone-500">
          חשוב לפתוח מהאייקון ולא מהלשונית — זו התקנה נפרדת עם האחסון שלה.
        </p>
      </Frame>
    )
  }

  return (
    <Frame icon={<MonitorDown size={18} />} title="להתקין כאפליקציה">
      <p>
        בדפדפן במחשב או באנדרואיד יש בשורת הכתובת אייקון התקנה, או פריט
        <b className="text-bone-100"> ״התקן אפליקציה״</b> בתפריט. אחרי ההתקנה זה
        נפתח בחלון משלו ועובד גם בלי רשת.
      </p>
      <p className="text-xs text-bone-500">
        באייפון צריך ספארי דווקא — שם ההתקנה יושבת בכפתור השיתוף.
      </p>
    </Frame>
  )
}
