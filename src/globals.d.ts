/**
 * גרסת האפליקציה, מוזרקת מ-`package.json` דרך `define` ב-vite.config.ts.
 *
 * קבוע בזמן בנייה ולא ייבוא של ה-JSON, כדי ש-`package.json` לא ייכנס לבאנדל.
 */
declare const __APP_VERSION__: string
