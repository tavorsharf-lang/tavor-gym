import { useEffect, useState } from 'react'

/**
 * "עכשיו" שמתעדכן מעצמו.
 *
 * טקסטים כמו "לפני 3 ימים" מחושבים מול Date.now() ברגע הרינדור. בלי הוק כזה
 * מסך שנשאר פתוח בטלפון כל הלילה היה ממשיך להציג "היום" גם למחרת.
 * העדכון המיידי בחזרה לאפליקציה חשוב יותר מהאינטרוול: iOS מקפיא טיימרים
 * ברקע, ולכן הערך תמיד מיושר מחדש ברגע שהמשתמש חוזר.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, intervalMs)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs])

  return now
}
