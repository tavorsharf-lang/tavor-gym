import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import { App } from './App'

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
