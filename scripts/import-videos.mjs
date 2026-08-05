#!/usr/bin/env node
/**
 * ייבוא ודחיסה של סרטוני ההדגמה מתיקיית "תוכנית אימונים (Workout Program)".
 *
 * מה זה עושה:
 *   1. עובר על התיקיות לפי המיפוי למטה
 *   2. דוחס כל mp4 ל-720px צד ארוך, בלי אודיו, H.264 crf 30, faststart
 *   3. מייצר poster JPG מהשנייה הראשונה
 *   4. כותב public/videos/<exerciseId>-NN.mp4 + .jpg
 *   5. מייצר src/db/videoManifest.ts — הרשימה שהאפליקציה קוראת
 *
 * הרצה: npm run import:videos
 * דורש ffmpeg (brew install ffmpeg).
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, writeFileSync, existsSync, statSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = '/Users/tavorsharf/projects/תוכנית אימונים (Workout Program)'
const OUT_DIR = join(ROOT, 'public', 'videos')
const MANIFEST = join(ROOT, 'src', 'db', 'videoManifest.ts')

/** תיקיית מקור → מזהה התרגיל בקטלוג */
const MAP = {
  'יום A - חזה ויד אחורית (Day A - Chest & Triceps)': {
    '00. חימום שכיבות סמיכה (Push-Up Warm-Up)': 'pushup',
    '01. לחיצת חזה חופשי - 22.5 קילו כל צד (Dumbbell Bench Press)': 'db-bench-press',
    '02. לחיצה במכונה סיקליין - 25 קילו כל צד (Decline Machine Press)': 'decline-machine-press',
    '03. מקבילים - 40 קילו כל צד (Dips)': 'dips',
    '04. פקטורל במכונה שיפוע שלילי - 15 קילו כל צד (Decline Machine Pec Fly)': 'decline-pec-fly',
    '05. לחיצה במכונה בנץ - 10 קילו כל צד (Bench Machine Press)': 'bench-machine-press',
    '06. יד אחורית עם מוט מעל הראש - 52 קילו (Overhead Barbell Triceps Extension)': 'overhead-tricep-ext',
    '07. יד אחורית עם מוט בפולי - 51 קילו (Cable Triceps Pushdown)': 'cable-tricep-pushdown',
    '08. יד אחורית כבלים צולבים - 15 קילו כל יד (Cross-Cable Triceps Extension)': 'cross-cable-tricep',
    '09. כתפיים במכונה - 45 קילו (Machine Shoulder Press)': 'machine-shoulder-press',
    '10. הרמה לצדדים - 12.5 קילו כל יד (Lateral Raise)': 'lateral-raise',
  },
  'יום B - גב ויד קדמית (Day B - Back & Biceps)': {
    '01. פולי עליון - 78 קילו (Lat Pulldown)': 'lat-pulldown',
    '02. חתירה - 60 קילו כל צד (Seated Row)': 'seated-row-heavy',
    '03. חתירה - 50 קילו כל צד (Seated Row)': 'seated-row-light',
    '04. חתירה מלמטה בכלוב - 58 קילו (Low Row in Rack)': 'low-row-rack',
    '05. יד קדמית בספה - 32 קילו (Preacher Curl)': 'preacher-curl',
    '06. פטישים יושב - 17.5 קילו (Seated Hammer Curl)': 'hammer-curl',
    '07. יד קדמית בפולי עם מרפקים מאחורי הגוף - 55 קילו (Behind-Body Cable Curl)': 'behind-body-cable-curl',
    '08. אמות - סטריט בר בכבל (Forearms - Straight Bar Cable)': 'forearm-straight-bar',
    '09. אמות - דאמבלים (Forearms - Dumbbells)': 'forearm-dumbbell',
    '10. הרמת כתפיים - 20 קילו (Shrugs)': 'shrugs',
    '11. פרפר הפוך - ריברס משין פליי (Reverse Machine Fly)': 'reverse-machine-fly',
  },
  'יום C - רגליים (Day C - Legs)': {
    '01. לחיצת רגליים - 160 קילו (Leg Press)': 'leg-press',
    '02. שרירי תאומים - 180 קילו (Calf Raise)': 'calf-raise',
    '03. סקוואט במכונה - 120 קילו (Machine Squat)': 'machine-squat',
    '04. כפיפת ברכיים - 115 קילו (Leg Curl)': 'leg-curl',
    '05. פשיטת ברכיים (Leg Extension)': 'leg-extension',
    '06. בטן (Abs)': 'abs',
  },
}

const MAX_EDGE = 720
const CRF = 30

function probe(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height:format=duration',
    '-of', 'default=nw=1:nk=0', file,
  ]).toString()
  const get = (k) => {
    const m = out.match(new RegExp(`^${k}=(.+)$`, 'm'))
    return m ? m[1].trim() : null
  }
  return {
    width: Number(get('width')),
    height: Number(get('height')),
    duration: Number(get('duration')) || 0,
  }
}

function main() {
  if (!existsSync(SOURCE)) {
    console.error(`✗ תיקיית המקור לא נמצאה: ${SOURCE}`)
    process.exit(1)
  }
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })

  const manifest = {}
  let totalIn = 0
  let totalOut = 0

  for (const [dayDir, exercises] of Object.entries(MAP)) {
    for (const [exDir, exerciseId] of Object.entries(exercises)) {
      const srcDir = join(SOURCE, dayDir, exDir)
      if (!existsSync(srcDir)) {
        console.warn(`  ⚠ אין תיקייה: ${exDir}`)
        continue
      }
      const files = readdirSync(srcDir).filter((f) => f.toLowerCase().endsWith('.mp4')).sort()
      if (!files.length) continue

      manifest[exerciseId] = []
      files.forEach((f, i) => {
        const src = join(srcDir, f)
        const idx = String(i + 1).padStart(2, '0')
        const base = `${exerciseId}-${idx}`
        const outMp4 = join(OUT_DIR, `${base}.mp4`)
        const outJpg = join(OUT_DIR, `${base}.jpg`)

        const info = probe(src)
        const inSize = statSync(src).size
        totalIn += inSize

        // וידאו: צד ארוך עד 720, בלי אודיו, faststart לניגון מיידי
        execFileSync('ffmpeg', [
          '-y', '-loglevel', 'error', '-i', src,
          '-an',
          '-vf', `scale=w=${MAX_EDGE}:h=${MAX_EDGE}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
          '-c:v', 'libx264', '-profile:v', 'main', '-level', '4.0',
          '-crf', String(CRF), '-preset', 'slow',
          '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
          outMp4,
        ])

        // poster מהשנייה הראשונה (או מההתחלה אם הסרטון קצר)
        const posterAt = info.duration > 1.5 ? '1' : '0'
        execFileSync('ffmpeg', [
          '-y', '-loglevel', 'error', '-ss', posterAt, '-i', outMp4,
          '-frames:v', '1', '-q:v', '5',
          '-vf', `scale=w=400:h=400:force_original_aspect_ratio=decrease:force_divisible_by=2`,
          outJpg,
        ])

        const outSize = statSync(outMp4).size
        totalOut += outSize
        const outInfo = probe(outMp4)

        manifest[exerciseId].push({
          src: `videos/${base}.mp4`,
          poster: `videos/${base}.jpg`,
          width: outInfo.width,
          height: outInfo.height,
          durationSec: Math.round(info.duration * 10) / 10,
          sizeBytes: outSize,
        })

        const pct = Math.round((1 - outSize / inSize) * 100)
        console.log(
          `  ✓ ${base}  ${(inSize / 1e6).toFixed(1)}MB → ${(outSize / 1e6).toFixed(1)}MB (-${pct}%)  ${outInfo.width}x${outInfo.height}  ${info.duration.toFixed(1)}s`
        )
      })
    }
  }

  const ts = `// קובץ נוצר אוטומטית על ידי scripts/import-videos.mjs — אין לערוך ידנית.
// הרצה מחדש: npm run import:videos

export interface BundledVideo {
  /** נתיב יחסי ל-base של האפליקציה */
  src: string
  poster: string
  width: number
  height: number
  durationSec: number
  sizeBytes: number
}

export const VIDEO_MANIFEST: Record<string, BundledVideo[]> = ${JSON.stringify(manifest, null, 2)}

/** סך כל המשקל של הסרטונים המצורפים, בבתים */
export const VIDEO_TOTAL_BYTES = ${totalOut}

/** מספר הסרטונים המצורפים */
export const VIDEO_COUNT = ${Object.values(manifest).reduce((n, v) => n + v.length, 0)}
`
  writeFileSync(MANIFEST, ts)

  console.log(
    `\n✓ ${Object.values(manifest).reduce((n, v) => n + v.length, 0)} סרטונים · ` +
      `${(totalIn / 1e6).toFixed(0)}MB → ${(totalOut / 1e6).toFixed(0)}MB ` +
      `(-${Math.round((1 - totalOut / totalIn) * 100)}%)`
  )
  console.log(`✓ manifest: ${MANIFEST}`)
}

main()
