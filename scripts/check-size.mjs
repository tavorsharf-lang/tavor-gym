#!/usr/bin/env node
// שומר גודל ה-bundle.
//
// למה זה קיים: כל קובץ ב-dist נכנס ל-precache של ה-Service Worker, ול-workbox
// יש תקרה של 4MB לקובץ. חריגה ממנה לא מפילה את הבנייה — היא פשוט *משמיטה* את
// הקובץ מה-precache, וההתקנה מפסיקה לעבוד אופליין בלי שאף אחד יראה שגיאה.
//
// הסף כאן נדיב בכוונה (~25% מעל המצב הנוכחי): הוא לא נועד לרדוף אחרי כל
// קילובייט אלא לתפוס תלות חדשה או ייבוא סטטי לא זהיר — למשל chart.js שנכנס
// בטעות לצ'אנק הראשי במקום להישאר עצל.

import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** תקרות בבייטים. מספר עגול וקריא עדיף על נוסחה חכמה. */
const LIMITS = [
  { label: 'הצ׳אנק הראשי', match: /^index-.*\.js$/, maxBytes: 1_050_000 },
  { label: 'הגרפים (עצל)', match: /^chartTheme-.*\.js$/, maxBytes: 260_000 },
]

/** תקרת workbox לקובץ יחיד — מעליה הקובץ נושר מה-precache בשקט */
const PRECACHE_FILE_LIMIT = 4_000_000

const dir = join(process.cwd(), 'dist', 'assets')

let files
try {
  files = readdirSync(dir)
} catch {
  console.error('✗ אין dist/assets — צריך להריץ npm run build קודם')
  process.exit(1)
}

const sized = files
  .map((name) => ({ name, bytes: statSync(join(dir, name)).size }))
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

for (const f of sized) {
  if (f.bytes > PRECACHE_FILE_LIMIT) {
    failures.push(`${f.name} הוא ${kb(f.bytes)} — מעל תקרת ה-precache, והוא יישמט ממנה בשקט`)
  }
}

if (failures.length) {
  console.error('\n✗ הבנייה גדלה מעבר לסף:')
  for (const f of failures) console.error(`  ${f}`)
  console.error('\nאם הגידול מכוון — לעדכן את הסף ב-scripts/check-size.mjs עם הסבר למה.')
  process.exit(1)
}

console.log('\n✓ הגדלים בתחום')
