#!/usr/bin/env node
/**
 * ייבוא כרטיסי השרירים — התמונות שמראות איזה שריר עובד בכל תרגיל ובאיזו מידה.
 *
 * המקור הוא תיקיית `תרגילי כושר 1` בשורש הריפו, מחולקת לשמונה תיקיות קטגוריה.
 * כל קובץ הוא PNG ריבועי 1254×1254 בשם `<עברית> - <ENGLISH NAME>.png`, ו**השם
 * האנגלי הוא המפתח** — הוא מה שמקשר בין הקובץ לתרגיל ב-`exerciseImages.ts`.
 *
 * מה זה עושה לכל תמונה:
 *   1. גרסה מלאה  — 1100px, JPEG q82  → public/images/ex/<slug>.jpg
 *   2. גרסה קטנה  — 200px,  JPEG q80  → public/images/ex/t/<slug>.jpg
 *   3. כותב src/db/imageManifest.ts
 *
 * למה JPEG ולא WebP: אין מקודד WebP בסביבת הבנייה (אין libwebp ב-ffmpeg ואין
 * sharp), והפוסטרים הקיימים ממילא JPEG. ההפרש בגודל לא מצדיק תלות חדשה.
 *
 * למה שתי מידות: הקטנה נכנסת ל-precache (‏89 קבצים, ~1.3MB) כי היא הזהות של
 * השורה ברשימה — ריבוע שבור בכל שורה אופליין הוא בדיוק מה ש-`keepFrame`
 * ב-VideoThumb הומצא כדי למנוע. המלאה לא נכנסת (~20MB) ונטענת בפתיחת התצוגה.
 *
 * למה בלי חיתוך לאזור הדמות: נבדק מול הכרטיס המלא ב-56px, וחיתוך יצא גרוע
 * יותר — בהרמה לצדדים ובפלאנק הוא מאבד את התנוחה, שהיא כל מה שמזהים בגודל הזה.
 * הכרטיסים כבר מהודקים, ולכן הקטנה של הכרטיס המלא היא התשובה.
 *
 * הרצה: npm run import:images
 * דורש ffmpeg.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, writeFileSync, existsSync, statSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(ROOT, 'תרגילי כושר 1')
const OUT_DIR = join(ROOT, 'public', 'images', 'ex')
const THUMB_DIR = join(OUT_DIR, 't')
const MANIFEST = join(ROOT, 'src', 'db', 'imageManifest.ts')

const FULL_PX = 1100
const THUMB_PX = 200

/**
 * שם אנגלי → slug. אותו כלל בדיוק כמו `slug()` בייבוא הסרטונים: אותיות, ספרות
 * וקו תחתון בלבד, כי השם נכנס לכתובת של שרת סטטי.
 */
function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/** קבצים שאינם כרטיס תרגיל ולכן לא נכנסים */
const SKIP = /^00 - /

function probe(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', file], { encoding: 'utf8' })
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

  const cats = readdirSync(SOURCE)
    .filter((d) => statSync(join(SOURCE, d)).isDirectory())
    .sort()

  const images = {}
  const seen = new Map()
  let fullBytes = 0
  let thumbBytes = 0
  let skipped = 0

  for (const cat of cats) {
    const dir = join(SOURCE, cat)
    for (const file of readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort()) {
      if (SKIP.test(file)) continue
      const base = file.slice(0, -4)
      // "(2)" בסוף השם הוא גרסה נוספת של אותו תרגיל, לא תרגיל אחר
      const core = base.replace(/\s*\(\d+\)$/, '')
      const dash = core.indexOf(' - ')
      if (dash < 0) {
        console.warn(`  ⚠ שם בלי " - ", מדולג: ${file}`)
        skipped += 1
        continue
      }
      const nameHe = core.slice(0, dash).trim()
      const nameEn = core.slice(dash + 3).trim()
      const key = slug(nameEn)
      // גרסה שנייה של אותו תרגיל מקבלת סיומת מספר, כמו במניפסט הסרטונים
      const n = (seen.get(key) ?? 0) + 1
      seen.set(key, n)
      const id = n === 1 ? key : `${key}_${n}`

      const src = join(dir, file)
      const { width, height } = probe(src)
      const full = join(OUT_DIR, `${id}.jpg`)
      const thumb = join(THUMB_DIR, `${id}.jpg`)
      fullBytes += render(src, full, FULL_PX, 2)
      thumbBytes += render(src, thumb, THUMB_PX, 3)

      images[id] = {
        src: `images/ex/${id}.jpg`,
        thumb: `images/ex/t/${id}.jpg`,
        nameHe,
        nameEn,
        category: cat.replace(/^\d+\s*-\s*/, ''),
        sourceWidth: width,
        sourceHeight: height,
        sizeBytes: statSync(full).size,
      }
      process.stdout.write(`  ✓ ${id}\n`)
    }
  }

  const ids = Object.keys(images)
  const ts = `// קובץ נוצר אוטומטית על ידי scripts/import-images.mjs — אין לערוך ידנית.
// הרצה מחדש: npm run import:images

/** כרטיס שרירים אחד — התמונה שמראה מה עובד בתרגיל ובאיזו מידה */
export interface ExerciseImage {
  /** נתיב יחסי ל-base של האפליקציה — 1100px */
  src: string
  /** 200px, נכנס ל-precache */
  thumb: string
  nameHe: string
  nameEn: string
  /** קבוצת השריר לפי תיקיית המקור — לתצוגה ולבדיקות בלבד */
  category: string
  sourceWidth: number
  sourceHeight: number
  sizeBytes: number
}

export const IMAGE_MANIFEST: Record<string, ExerciseImage> = ${JSON.stringify(images, null, 2)}

/** מספר הכרטיסים */
export const IMAGE_COUNT = ${ids.length}

/** משקל הגרסאות המלאות, בבתים */
export const IMAGE_TOTAL_BYTES = ${fullBytes}

/** משקל הממוזערות — זה מה שנכנס ל-precache */
export const IMAGE_THUMB_BYTES = ${thumbBytes}
`
  writeFileSync(MANIFEST, ts)

  const mb = (b) => (b / 1024 / 1024).toFixed(1)
  console.log(`\n${ids.length} כרטיסים · מלאות ${mb(fullBytes)}MB · ממוזערות ${mb(thumbBytes)}MB` +
    (skipped ? ` · ${skipped} מדולגים` : ''))
}

main()
