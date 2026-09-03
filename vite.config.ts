/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import pkg from './package.json' with { type: 'json' }

/** נתיב הבסיס ב-GitHub Pages. שינוי כאן דורש שינוי גם ב-manifest למטה. */
const BASE = '/tavor-gym/'

export default defineConfig({
  base: BASE,
  /*
    גרסת האפליקציה מגיעה מ-package.json ולא ממחרוזת קשיחה במסך ההגדרות.

    שתי המחרוזות היו מנותקות זו מזו, ואת המספר שבתחתית ההגדרות הולכים לצטט
    בדיווח על באג — כלומר גרסה שלא מתעדכנת היא בדיוק המספר שיטעה. `__APP_VERSION__`
    מוגדר גם ב-test למטה כדי שהמסך ירונדר בבדיקות בלי `is not defined`.
  */
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // prompt ולא autoUpdate: אסור שעדכון SW יטען מחדש את הדף באמצע סט.
      // useSWUpdate מציג טוסט, ומשהה אותו כל עוד יש אימון פעיל.
      registerType: 'prompt',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg'],
      workbox: {
        // ה-jpg כאן הם התמונות הממוזערות של הסרטונים. 34 התמונות של הדגמות
        // התוכנית הן ~300KB, והן מה שמונע שכל כרטיס תרגיל יציג ריבוע שבור
        // באימון אופליין לפני שהסרטונים הותקנו.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff,woff2}'],
        globIgnores: [
          // הסרטונים עצמם לא נכנסים ל-precache — 26MB היו הופכים את ההתקנה
          // לשברירית. הם מותקנים למכשיר דרך "התקן סרטונים" ל-IndexedDB.
          '**/videos/*.mp4',
          '**/videos/lib/*.mp4',
          /*
            גם התמונות הממוזערות של המאגר הלימודי לא נכנסות: 487 קבצים, 7.4MB,
            שהם רוב מוחלט של משקל ההתקנה.

            ההצדקה של ה-precache היא "כרטיס תרגיל באימון אופליין לא יציג ריבוע
            שבור", והיא נכונה ל-34 ההדגמות של התוכנית בלבד. המאגר משמש עיון
            בבית עם רשת, ומי שמתקין אותו מקבל את התמונות ב-IndexedDB ממילא.
            "התקנה שברירית" הוא הקו האדום שהפרויקט הגדיר לעצמו, וזה בדיוק הוא.
          */
          '**/videos/lib/*.jpg',
          /*
            כרטיסי השרירים בגודל מלא — 89 קבצים, 22MB. אותו שיקול בדיוק:
            הם נפתחים בגלריה, כלומר בכוונה ובחיבור, ולא נדרשים כדי שהרשימה
            תיראה שלמה. הממוזערות שלהם (‏images/ex/t) דווקא **כן** נכנסות —
            1.5MB — כי הן הזהות של השורה, וריבוע שבור בכל שורה אופליין הוא
            בדיוק מה ש-keepFrame ב-VideoThumb הומצא כדי למנוע.
          */
          '**/images/ex/*.jpg',
          /*
            אותו כלל לכרטיסים האנטומיים של תת-השרירים — 45 קבצים, 11MB. הם
            נפתחים בגיליון בלחיצה מכוונת, והממוזערות (‏images/muscles/t, חצי
            מגה) כן נכנסות כי הן יושבות בכותרות הרשימה עצמן.
          */
          '**/images/muscles/*.jpg',
          // תת-הקבוצות של הפונט שלעולם לא ייטענו כאן. ה-unicode-range כבר
          // מונע את הבקשה, ואין טעם לשמור אותן אופליין.
          '**/*arabic*',
          '**/*cyrillic*',
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: 'אימוני כושר',
        short_name: 'כושר',
        description:
          'ניהול אימוני כוח — תיעוד סטים, טיימר מנוחה, היסטוריה והתקדמות. עובד אופליין.',
        lang: 'he',
        dir: 'rtl',
        // ‏id מפורש ולא הסתמכות על start_url: בלעדיו הזהות נגזרת מהכתובת, וכל
        // שינוי עתידי של BASE היה מזהה את האפליקציה כהתקנה חדשה ומייתם את
        // הקיימת. חייב להיות בדיוק BASE — כרום פותר אותו מול המקור, ולכן
        // 'tavor-gym' היה נותן '/tavor-gym' ≠ '/tavor-gym/'. בערך הזה הוא
        // מחושב זהה לזהות המשתמעת של היום, כלומר אפס השפעה על התקנה קיימת.
        id: BASE,
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0C0A09',
        theme_color: '#0C0A09',
        categories: ['health', 'fitness'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        // SW כבוי ב-dev כדי לא להפריע ל-HMR. נבדק ב-`npm run preview`.
        enabled: false,
      },
    }),
  ],
  build: {
    target: 'es2020', // iOS Safari 16.4+
    // בלי פיצול ידני: כל ה-shell נכנס ל-precache ממילא, ולכן צ'אנק אחד גדול
    // נטען מהר יותר מכמה בקשות. הספריות הכבדות (client-zip, canvas-confetti)
    // נטענות דינמית בקוד ולכן יוצאות לצ'אנק נפרד בכל מקרה.
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    /*
      חצי מהליבות ולא כמה ש-vitest ירצה.

      זה תיקון של רעידה אמיתית, לא כוונון ביצועים. שישים ושלושה קבצים, כל
      אחד עם סביבת jsdom משלו, נפתחים במקביל על שמונה ליבות שכבר עמוסות —
      ואז `waitFor` עם תקרה של חמש שניות נכשל לא מפני שהקוד שגוי אלא מפני
      שהמעבד לא הגיע אליו בזמן. הכישלון היה נודד: בכל הרצה קובץ אחר נפל
      (מסך התרגילים, תיקון שיוך, נגן הווידאו), וזה החתימה של הרעבה ולא של
      באג. שלוש פריסות נחסמו כך ברצף.

      עם החצי הכל עובר — **וגם מהר יותר**, כי מחליפים החלפות הקשר בעבודה.
      אחוזים ולא מספר קבוע, כדי שזה יחזיק גם על מכונה אחרת.
    */
    maxWorkers: '50%',
    /*
      דחייה אחת מסוננת, ובכוונה רק היא.

      ‏`resetAll` של בדיקות המסך מוחק את המסד בין בדיקה לבדיקה, ו-Dexie דוחה
      כל קריאה שהייתה באוויר באותו רגע (`DatabaseClosedError`). זו תופעה של
      *הפירוק* ולא של האפליקציה: הרכיב שביקש את הנתון כבר פורק על ידי
      ‏`cleanup` של testing-library, אין מי שממתין לתשובה, ואין דרך לבטל
      קריאת IndexedDB שכבר יצאה.

      השם הספציפי הוא כל ההגנה — כל דחייה אחרת עדיין מפילה את ההרצה, ולכן
      השער לא נפרץ. **אין להרחיב את התנאי הזה.** אם מופיעה דחייה חדשה, היא
      באג שצריך לתקן בקוד ולא סוג נוסף להוסיף כאן.
    */
    onUnhandledError(error) {
      const name = (error as { name?: string; inner?: { name?: string } }).name
      const inner = (error as { inner?: { name?: string } }).inner?.name
      if (name === 'DatabaseClosedError' || inner === 'DatabaseClosedError') return false
    },
  },
})
