#!/usr/bin/env node
// שומר גודל ה-bundle.
//
// למה זה קיים: קובץ שחורג מתקרת ה-4MB של workbox לא מפיל את הבנייה — הוא פשוט
// *נושר* מה-precache, וההתקנה מפסיקה לעבוד אופליין בלי שאף אחד יראה שגיאה.
//
// תקרות הצ׳אנקים כאן נדיבות בכוונה (~25% מעל המצב הנוכחי): הן לא נועדו לרדוף
// אחרי כל קילובייט אלא לתפוס תלות חדשה או ייבוא סטטי לא זהיר — למשל chart.js
// שנכנס בטעות לצ'אנק הראשי במקום להישאר עצל.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/** תקרות בבייטים. מספר עגול וקריא עדיף על נוסחה חכמה. */
const LIMITS = [
  { label: 'הצ׳אנק הראשי', match: /^index-.*\.js$/, maxBytes: 1_050_000 },
  { label: 'הגרפים (עצל)', match: /^chartTheme-.*\.js$/, maxBytes: 260_000 },
]

/** תקרת workbox לקובץ יחיד — מעליה הקובץ נושר מה-precache בשקט */
const PRECACHE_FILE_LIMIT = 4 * 1024 * 1024

/**
 * הסיומות ש-globPatterns ב-vite.config.ts מבקש להכניס ל-precache. mp4 לא כאן
 * בכוונה: הסרטונים מותקנים ל-IndexedDB ולא ל-precache, ולכן סרטון של 5MB הוא
 * מצב תקין ולא כשל.
 */
const PRECACHED_EXT = /\.(js|css|html|svg|png|jpg|woff2?)$/

/**
 * מה שנשאר בחוץ בכוונה, לפי globIgnores ב-vite.config.ts, עם הסיבה.
 *
 * הרשימה הזאת היא החוזה: קובץ שנשמט מה-precache ואינו כאן הוא תקלה. מי שיוסיף
 * globIgnore חדש יראה כשל שדורש ממנו לרשום כאן למה — וזה בדיוק הכיוון הרצוי,
 * כי ההשמטה השקטה היא הבאג שהסקריפט הזה קיים בשבילו.
 */
const EXPECTED_OUT = [
  { match: /^videos\/lib\/.*\.jpg$/, why: 'תמונות המאגר הלימודי — 7.4MB שהיו הופכים את ההתקנה לשברירית' },
  { match: /(arabic|cyrillic)/, why: 'תת-קבוצות פונט ש-unicode-range ממילא לא יבקש' },
  { match: /^(sw|workbox-[^/]+)\.js$/, why: 'ה-Service Worker עצמו — הוא לא מכניס את עצמו למטמון' },
  {
    match: /^images\/ex\/[^/]+\.jpg$/,
    why: 'כרטיסי השרירים בגודל מלא — 22MB. הממוזערות ב-images/ex/t כן נכנסות',
  },
]

const dist = join(process.cwd(), 'dist')

/**
 * כל dist ולא רק dist/assets: תקרת ה-precache חלה על כל קובץ שנכנס אליה, וקודם
 * נסרקה כאן רק תיקייה אחת. פונט, תמונה או סרטון שיושבים ב-public היו עוברים
 * מתחת לרדאר בדיוק במקרה שהבדיקה נכתבה בשבילו.
 */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile()) out.push({ name: relative(dist, full).split(sep).join('/'), bytes: statSync(full).size })
  }
  return out
}

let all
try {
  all = walk(dist)
} catch {
  console.error('✗ אין dist — צריך להריץ npm run build קודם')
  process.exit(1)
}

// תקרות ה-LIMITS נכתבו על שמות קבצים בתוך assets, ולכן הן נבדקות מולם בלבד
const sized = all
  .filter((f) => f.name.startsWith('assets/'))
  .map((f) => ({ ...f, name: f.name.slice('assets/'.length) }))
  .sort((a, b) => b.bytes - a.bytes)

const kb = (n) => `${(n / 1024).toFixed(1)}KB`

console.log('גדלי הבנייה:')
for (const f of sized.slice(0, 8)) console.log(`  ${kb(f.bytes).padStart(9)}  ${f.name}`)

const failures = []

for (const limit of LIMITS) {
  const file = sized.find((f) => limit.match.test(f.name))
  if (!file) {
    failures.push(`לא נמצא קובץ שתואם ל${limit.label} (${limit.match}) — השתנתה סכמת השמות?`)
    continue
  }
  if (file.bytes > limit.maxBytes) {
    failures.push(
      `${limit.label}: ${kb(file.bytes)} מול תקרה של ${kb(limit.maxBytes)} (${file.name})`
    )
  }
}

/*
  הבדיקה האמיתית נעשית מול המניפסט שנוצר בפועל ולא מול חיקוי של הכללים.

  workbox משמיט קובץ חורג *בשקט*, ולכן "הקובץ גדול מדי" ו"הקובץ לא נכנס" הן
  אותה תקלה משתי זוויות. שכפול של globPatterns ו-globIgnores לכאן היה נסדק
  ברגע שמישהו יערוך אחד מהם — sw.js הוא מקור האמת.
*/
let manifest = null
try {
  const sw = readFileSync(join(dist, 'sw.js'), 'utf8')
  manifest = new Set([...sw.matchAll(/url:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]))
} catch {
  failures.push('לא הצלחתי לקרוא את dist/sw.js — בלעדיו אי אפשר לוודא מה נכנס ל-precache')
}

if (manifest) {
  if (manifest.size === 0) {
    failures.push('המניפסט של ה-precache ריק — כנראה השתנתה סכמת הפלט של workbox')
  }
  let excluded = 0
  for (const f of all) {
    if (!PRECACHED_EXT.test(f.name) || manifest.has(f.name)) continue
    if (EXPECTED_OUT.some((e) => e.match.test(f.name))) {
      excluded += 1
      continue
    }
    const why =
      f.bytes > PRECACHE_FILE_LIMIT
        ? `הוא ${kb(f.bytes)}, מעל תקרת ה-${kb(PRECACHE_FILE_LIMIT)}`
        : 'הוא לא חורג מהתקרה — כנראה נוסף לו globIgnores. אם זה מכוון, להוסיף אותו ל-EXPECTED_OUT כאן עם הסיבה'
    failures.push(`${f.name} לא נכנס ל-precache — ${why}`)
  }
  console.log(`\nב-precache ${manifest.size} קבצים ייחודיים; ${excluded} הושמטו בכוונה`)
}

if (failures.length) {
  console.error('\n✗ הבנייה גדלה מעבר לסף:')
  for (const f of failures) console.error(`  ${f}`)
  console.error('\nאם הגידול מכוון — לעדכן את הסף ב-scripts/check-size.mjs עם הסבר למה.')
  process.exit(1)
}

console.log('\n✓ הגדלים בתחום')
