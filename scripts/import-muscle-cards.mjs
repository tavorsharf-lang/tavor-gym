#!/usr/bin/env node
/**
 * ייבוא כרטיסי תת-השרירים — התמונות שמראות **איפה** יושב כל תת-שריר בתוך
 * הקבוצה שלו, להבדיל מכרטיסי התרגילים שמראים **מה** עובד בתרגיל ובכמה.
 *
 * המקור הוא `muscle-cards-45/` בשורש הריפו: 45 קבצי PNG ריבועיים 1254×1254
 * בשם `NN - <עברית> - <ENGLISH NAME>.png`. 37 כרטיסי תת-שריר ועוד 8 כרטיסי
 * סקירה, אחד לכל קבוצת שריר.
 *
 * **המספר הוא הזהות, לא השם.** "ראש ארוך" מופיע בשני כרטיסים שונים — 17 של
 * הדו-ראשי ו-20 של התלת-ראשי — ולכן התאמה לפי השם העברי הייתה מצמידה לשניהם
 * את אותה תמונה בשקט. המספר מכריע, והשם רק נכתב למניפסט לתצוגה.
 *
 * מה זה עושה לכל תמונה — בדיוק כמו `import-images.mjs`, מאותן סיבות:
 *   1. גרסה מלאה  — 1100px, JPEG q82  → public/images/muscles/<slug>.jpg
 *   2. גרסה קטנה  — 200px,  JPEG q80  → public/images/muscles/t/<slug>.jpg
 *   3. כותב src/db/muscleImageManifest.ts
 *
 * הרצה: npm run import:muscle-cards
 * דורש ffmpeg.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, writeFileSync, existsSync, statSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(ROOT, 'muscle-cards-45')
const OUT_DIR = join(ROOT, 'public', 'images', 'muscles')
const THUMB_DIR = join(OUT_DIR, 't')
const MANIFEST = join(ROOT, 'src', 'db', 'muscleImageManifest.ts')

const FULL_PX = 1100
const THUMB_PX = 200
const EXPECTED = 45

/**
 * איזו גרסה מנצחת כשיש שתיים.
 *
 * ההכרעות עצמן ויזואליות ולא טכניות, ולכן הן כתובות כאן עם הנימוק:
 *   42 — שתי הגרסאות תקינות, ו-b נבחרה כי המסגור שלה (זרוע שלמה באלכסון) זהה
 *        לכרטיסי 19–22 של אותה קבוצה. a יפה יותר לבדה ושוברת את הסדרה.
 *   45 — a כותבת "אמוה" בכותרת במקום "אמות". פסילה, לא העדפה.
 *   16 — קיימת רק b, ולכן היא הבחירה בהיעדר מתחרה. הגרסה השנייה נשמרה בשם
 *        ריק (" .png") ונופלת ממילא בסינון של שם שאינו תואם לתבנית.
 */
const VARIANT = { 16: 'b', 42: 'b', 45: 'b' }

const FILE_RE = /^(\d{2})([ab]?) - (.+?) - ([^-]+)\.png$/

/** שם אנגלי → slug. אותו כלל בדיוק כמו בייבוא כרטיסי התרגילים. */
function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function probe(file) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
      '-of', 'csv=p=0:s=x', file],
    { encoding: 'utf8' }
  )
  const [w, h] = out.trim().split('x').map(Number)
  return { width: w, height: h }
}

function render(src, dest, px, q) {
  execFileSync('ffmpeg', ['-v', 'error', '-i', src, '-vf',
    `scale=${px}:${px}:force_original_aspect_ratio=decrease:flags=lanczos`,
    '-frames:v', '1', '-q:v', String(q), dest, '-y'])
  return statSync(dest).size
}

function main() {
  if (!existsSync(SOURCE)) {
    console.error(`✗ תיקיית המקור לא נמצאה: ${SOURCE}`)
    process.exit(1)
  }
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(THUMB_DIR, { recursive: true })

  /** מספר כרטיס → הקובץ שנבחר */
  const chosen = new Map()
  const skipped = []

  for (const file of readdirSync(SOURCE).sort()) {
    const m = FILE_RE.exec(file)
    if (!m) {
      if (file.toLowerCase().endsWith('.png')) skipped.push(file)
      continue
    }
    const [, num, variant, , ] = m
    const want = VARIANT[Number(num)] ?? ''
    if (variant !== want) {
      skipped.push(file)
      continue
    }
    if (chosen.has(num)) {
      console.error(`✗ שני קבצים לאותו מספר: ${num}`)
      process.exit(1)
    }
    chosen.set(num, { file, nameHe: m[3].trim(), nameEn: m[4].trim() })
  }

  if (chosen.size !== EXPECTED) {
    const missing = Array.from({ length: EXPECTED }, (_, i) => String(i + 1).padStart(2, '0'))
      .filter((n) => !chosen.has(n))
    console.error(`✗ נמצאו ${chosen.size} כרטיסים במקום ${EXPECTED}. חסרים: ${missing.join(', ')}`)
    process.exit(1)
  }

  const cards = {}
  let fullBytes = 0
  let thumbBytes = 0

  for (const [num, { file, nameHe, nameEn }] of [...chosen].sort()) {
    const id = slug(nameEn)
    if (cards[id]) {
      console.error(`✗ שני כרטיסים נופלים לאותו מזהה: ${id}`)
      process.exit(1)
    }
    const src = join(SOURCE, file)
    const { width, height } = probe(src)
    const full = join(OUT_DIR, `${id}.jpg`)
    const thumb = join(THUMB_DIR, `${id}.jpg`)
    fullBytes += render(src, full, FULL_PX, 2)
    thumbBytes += render(src, thumb, THUMB_PX, 3)

    cards[id] = {
      number: Number(num),
      src: `images/muscles/${id}.jpg`,
      thumb: `images/muscles/t/${id}.jpg`,
      nameHe,
      nameEn,
      sourceWidth: width,
      sourceHeight: height,
      sizeBytes: statSync(full).size,
    }
    process.stdout.write(`  ✓ ${num} ${id}\n`)
  }

  const ids = Object.keys(cards)
  const ts = `// קובץ נוצר אוטומטית על ידי scripts/import-muscle-cards.mjs — אין לערוך ידנית.
// הרצה מחדש: npm run import:muscle-cards

/** כרטיס אנטומי אחד — איפה יושב תת-שריר בתוך הקבוצה שלו */
export interface MuscleCardImage {
  /** מספר הכרטיס במקור. הוא הזהות: "ראש ארוך" הוא שם של שניים. */
  number: number
  /** נתיב יחסי ל-base של האפליקציה — 1100px */
  src: string
  /** 200px, נכנס ל-precache */
  thumb: string
  nameHe: string
  nameEn: string
  sourceWidth: number
  sourceHeight: number
  sizeBytes: number
}

export const MUSCLE_CARD_MANIFEST: Record<string, MuscleCardImage> = ${JSON.stringify(cards, null, 2)}

/** מספר הכרטיסים — 37 תת-שרירים ועוד 8 סקירות */
export const MUSCLE_CARD_COUNT = ${ids.length}

/** משקל הגרסאות המלאות, בבתים */
export const MUSCLE_CARD_TOTAL_BYTES = ${fullBytes}

/** משקל הממוזערות — זה מה שנכנס ל-precache */
export const MUSCLE_CARD_THUMB_BYTES = ${thumbBytes}
`
  writeFileSync(MANIFEST, ts)

  const mb = (b) => (b / 1024 / 1024).toFixed(1)
  console.log(`\n${ids.length} כרטיסים · מלאות ${mb(fullBytes)}MB · ממוזערות ${mb(thumbBytes)}MB`)
  if (skipped.length) console.log(`מדולגים: ${skipped.join(' · ')}`)
}

main()
