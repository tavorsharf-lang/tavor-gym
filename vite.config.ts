/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

/** נתיב הבסיס ב-GitHub Pages. שינוי כאן דורש שינוי גם ב-manifest למטה. */
const BASE = '/tavor-gym/'

export default defineConfig({
  base: BASE,
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
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        globIgnores: [
          // הסרטונים לא נכנסים ל-precache — 26MB היו הופכים את ההתקנה
          // לשברירית. הם מותקנים למכשיר דרך "התקן סרטונים" ל-IndexedDB.
          '**/videos/**',
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
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0C0A09',
        theme_color: '#0C0A09',
        categories: ['health', 'fitness'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
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
  },
})
