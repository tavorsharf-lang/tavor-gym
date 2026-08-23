#!/usr/bin/env node
/**
 * מחשב טביעת אצבע תפיסתית (dHash) לתמונה הממוזערת של כל סרטון, וכותב אותן
 * ל-`src/db/videoHashes.ts`.
 *
 * למה זה קיים: המאגר צמח מייבוא אוטומטי, ואותו סרטון נכנס אליו יותר מפעם אחת
 * תחת שמות שונים. פעם אחת כבר נמחקו 33 כפילויות (קומיט 0949aee) — בהשוואת
 * פריימים ידנית, אחת-אחת.
 *
 * למה דווקא hash של התמונה, ולא גודל הקובץ ומשך הסרטון: נמדד. על 488 הקליפים
 * שבמניפסטים אין *אף* זוג עם אותו גודל ואותו משך, בעוד השוואת תמונות מוצאת
 * עשרות מועמדים — כי כל עותק עבר קידוד מחדש בפרמטרים אחרים. זוג שהוא באמת
 * אותו סרטון נבדל אצלנו בעד 7 שניות משך ובעד 58% גודל, ולעומת זאת "כמעט אותו
 * גודל" מתאר בעיקר קליפים לא קשורים. כלי שנשען על המטא-דאטה היה מראה רשימה
 * ארוכה של לא-כפילויות ומפספס את האמיתיות.
 *
 * למה בזמן בנייה ולא בדפדפן: 488 פענוחי תמונה לקנבס בכל פתיחת מסך הם בזבוז
 * מובהק על נתון שלא משתנה בין פריסות. כאן זה רץ פעם אחת ונשמר כטקסט.
 *
 * דורש ffmpeg — אותה תלות של `npm run import:videos`.
 *
 *   node scripts/gen-video-hashes.mjs
 */

import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = join(root, 'public')
const OUT_FILE = join(root, 'src/db/videoHashes.ts')

/**
 * dHash: משווים כל פיקסל לשכנו מימין בשורה. הרוחב 9 והגובה 8 נותנים בדיוק
 * 64 השוואות, כלומר 64 סיביות. הצורה הזו עמידה לשינויי בהירות ולקידוד מחדש,
 * שזה בדיוק ההבדל בין שני עותקים של אותו סרטון.
 */
const HASH_W = 9
const HASH_H = 8

async function dhash(absPath) {
  // gray + rawvideo נותן בדיוק HASH_W*HASH_H בייטים, בייט לפיקסל
  const { stdout } = await run(
    'ffmpeg',
    [
      '-v', 'error',
      '-i', absPath,
      '-vf', `scale=${HASH_W}:${HASH_H}:flags=area`,
      '-pix_fmt', 'gray',
      '-frames:v', '1',
      '-f', 'rawvideo',
      '-',
    ],
    { encoding: 'buffer', maxBuffer: 1 << 20 }
  )
  if (stdout.length < HASH_W * HASH_H) {
    throw new Error(`פלט קצר מהצפוי (${stdout.length} בייטים)`)
  }

  let bits = 0n
  for (let y = 0; y < HASH_H; y++) {
    for (let x = 0; x < HASH_W - 1; x++) {
      const left = stdout[y * HASH_W + x]
      const right = stdout[y * HASH_W + x + 1]
      bits = (bits << 1n) | (left > right ? 1n : 0n)
    }
  }
  return bits.toString(16).padStart(16, '0')
}

/**
 * שולף את כל נתיבי ה-poster מקובץ מניפסט, בלי לייבא TypeScript.
 * שני סגנונות המרכאות נתמכים — המניפסטים נוצרים כ-JSON מוטבע ולכן כפולות,
 * אבל קובץ שנערך ביד יכול להגיע עם בודדות.
 */
async function postersFrom(manifestPath) {
  const text = await readFile(join(root, manifestPath), 'utf8')
  return [...text.matchAll(/["']?poster["']?\s*:\s*["']([^"']+)["']/g)].map((m) => m[1])
}

// ffmpeg חסר הוא הכשל השכיח (מכונה חדשה, שדרוג הומברו) — נופלים עליו מיד
// ולא אחרי 488 ניסיונות, ובעיקר: לפני שנוגעים בקובץ הפלט
try {
  await run('ffmpeg', ['-version'])
} catch {
  console.error('✗ ffmpeg לא נמצא ב-PATH. brew install ffmpeg')
  process.exit(1)
}

const posters = [
  ...new Set([
    ...(await postersFrom('src/db/videoManifest.ts')),
    ...(await postersFrom('src/db/libraryManifest.ts')),
  ]),
]

console.log(`מחשב טביעות אצבע ל-${posters.length} תמונות…`)

/** מקביליות מרוסנת — ffmpeg לכל תמונה, ואין טעם להציף את המכונה */
const CONCURRENCY = 8
const hashes = {}
const missing = []
const failed = []

let cursor = 0
async function worker() {
  while (cursor < posters.length) {
    const poster = posters[cursor++]
    const abs = join(PUBLIC_DIR, poster)
    if (!existsSync(abs)) {
      missing.push(poster)
      continue
    }
    try {
      hashes[poster] = await dhash(abs)
    } catch (err) {
      failed.push(`${poster} — ${err.message}`)
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

/*
  שער שפיות לפני הכתיבה.

  הכתיבה קרתה קודם ללא תנאי, ולכן ריצה שבה כל קריאות ffmpeg נכשלו הייתה
  מוחקת את הטבלה, מסיימת ב-0, ועוברת typecheck ובדיקות בשקט — האפליקציה
  פשוט מפסיקה למצוא כפילויות בלי ששום דבר נשבר בקול. עדיף להשאיר את הקובץ
  הקיים ולצעוק.
*/
const ok = Object.keys(hashes).length
if (ok === 0 || failed.length > posters.length * 0.02) {
  console.error(`✗ ${ok} הצלחות, ${failed.length} כשלים — הקובץ הקיים לא שונה`)
  for (const f of failed.slice(0, 5)) console.error(`  ${f}`)
  process.exit(1)
}

const entries = Object.keys(hashes)
  .sort()
  .map((poster) => `  '${poster}': '${hashes[poster]}',`)
  .join('\n')

const banner = `// נוצר אוטומטית על ידי scripts/gen-video-hashes.mjs — אין לערוך ידנית.
//
// טביעת אצבע תפיסתית (dHash, 64 סיביות בהקסה) לתמונה הממוזערת של כל סרטון.
// המפתח הוא נתיב ה-poster כפי שהוא במניפסט. ראה domain/duplicates.ts.
`

await writeFile(
  OUT_FILE,
  `${banner}\nexport const VIDEO_HASHES: Record<string, string> = {\n${entries}\n}\n`,
  'utf8'
)

console.log(`נכתבו ${Object.keys(hashes).length} טביעות ל-${OUT_FILE.replace(root + '/', '')}`)
if (missing.length) console.log(`חסרות ${missing.length} תמונות בדיסק (מדולגות)`)
if (failed.length) {
  console.log(`נכשלו ${failed.length}:`)
  for (const f of failed.slice(0, 5)) console.log(`  ${f}`)
}
