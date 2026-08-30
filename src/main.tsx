import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import { App } from './App'
import { startSW } from './hooks/useSWUpdate'

/**
 * רישום ה-Service Worker, מוקדם ככל האפשר.
 *
 * הצרכן היחיד של `useSWUpdate` הוא `UpdateBanner`, שיושב בתוך Shell — כלומר
 * הרישום היה מחכה ל-`ensureReady` + `hydrate` + שלושה חימומי מטמון. בביקור
 * ראשון זה בדיוק הזמן שבו כדאי שהפריקאש כבר ירד: הוא מותקן עכשיו במקביל
 * לפתיחת המסד במקום אחריה.
 *
 * `registerType` נשאר 'prompt' — מוקדם יותר, לא אגרסיבי יותר. עדכון עדיין לא
 * טוען מחדש את הדף מעצמו, כי זה אסור באמצע סט.
 */
startSW()

/**
 * חסימת זום ב-iOS.
 *
 * ספארי מתעלמת בכוונה מ-`user-scalable=no` בלשונית רגילה, מטעמי נגישות, אבל
 * היא כן מכבדת ביטול של אירועי ה-gesture הקנייניים שלה. יחד עם
 * `touch-action: pan-x pan-y` ב-CSS זה מכסה גם צביטה וגם לחיצה כפולה.
 *
 * זו החלטה מודעת לאפליקציה הזו: מסך שקופץ לזום באמצע סט, מנגיעה מקרית של
 * אצבע רטובה, גורם יותר נזק ממה שהזום מועיל. כל הטקסט כאן ממילא גדול.
 */
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false })
}

/** לחיצה כפולה מהירה — הנתיב השני לזום ב-iOS */
let lastTouchEnd = 0
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now()
    if (now - lastTouchEnd < 320) e.preventDefault()
    lastTouchEnd = now
  },
  { passive: false }
)

const root = document.getElementById('root')
if (!root) throw new Error('חסר אלמנט #root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
