#!/usr/bin/env node
/**
 * ייבוא ודחיסה של סרטוני ההדגמה.
 *
 * שני מקורות:
 *   א. "תוכנית אימונים (Workout Program)" — הדגמות לתרגילי התוכנית, לפי המיפוי למטה.
 *      כל הסרטונים נכנסים, ויוצאים ל-videoManifest.ts.
 *   ב. "מאגר תרגילים (Exercise Library)" — מאגר לימודי של 62 תרגילים.
 *      נכנסים רק LIB_MAX הראשונים בכל תרגיל, ויוצאים ל-libraryManifest.ts.
 *
 * מה זה עושה לכל סרטון:
 *   1. דוחס ל-720px צד ארוך, בלי אודיו, H.264 crf 30, faststart
 *   2. מייצר poster JPG מהשנייה הראשונה
 *   3. כותב public/videos/<id>-NN.mp4 + .jpg
 *
 * למה יש תקרה על המאגר ואין על התוכנית: 489 סרטוני המאגר שוקלים כ-390MB דחוסים,
 * וזה הופך את הבנייה והפריסה לבלתי סבירות. הסרטונים בכל תרגיל ממוינים במקור לפי
 * מספר צפיות, ולכן הראשונים הם גם הטובים ביותר. השאר נשארים נגישים דרך הקישור
 * המקורי שנשמר במניפסט.
 *
 * הרצה: npm run import:videos
 * דורש ffmpeg (brew install ffmpeg).
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, writeFileSync, existsSync, statSync, rmSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = '/Users/tavorsharf/projects/תוכנית אימונים (Workout Program)'
const LIB_SOURCE = '/Users/tavorsharf/projects/מאגר תרגילים (Exercise Library)'
const OUT_DIR = join(ROOT, 'public', 'videos')
const LIB_OUT_DIR = join(OUT_DIR, 'lib')
const MANIFEST = join(ROOT, 'src', 'db', 'videoManifest.ts')
const LIB_MANIFEST = join(ROOT, 'src', 'db', 'libraryManifest.ts')

/**
 * כמה סרטונים לכל תרגיל במאגר נכנסים לבנייה. Infinity = הכל.
 *
 * היה כאן 3 מטעמי משקל, ותבור ביקש במפורש את כל החומר. המחיר מודע: 487 סרטונים
 * במקום 155, כ-184MB במקום 57MB בבנייה ובהיסטוריית git. אם צריך לחזור אחורה —
 * זה המספר היחיד שצריך לשנות, והייבוא בונה הכל מחדש.
 */
const LIB_MAX = Number.POSITIVE_INFINITY

/**
 * סרטונים שהמקור מפרסם יותר מפעם אחת.
 *
 * המאגר מכיל את אותו קליפ בדיוק תחת שתי כתובות שונות — לפעמים באותו תרגיל
 * ולפעמים בין תרגיל התוכנית לתרגיל המאגר המקביל. שם הקובץ שונה והבייטים שונים
 * (קידוד אחר), ולכן השוואת md5 לא תופסת את זה. הרשימה כאן נבנתה מהשוואה
 * תפיסתית: שמונה פריימים בפריסה אחידה מכל סרטון, dHash לכל פריים, וזוגות
 * במרחק המינג ממוצע נמוך. כל זוג נבדק גם בעין מול פריימים לפני שנכנס לכאן.
 *
 * למה כאן ולא רק במחיקת הקבצים: המניפסטים נוצרים אוטומטית מהסקריפט הזה, ולכן
 * `npm run import:videos` היה מחזיר את הכפילויות בהרצה הבאה.
 *
 * הכתובת שנשארת בכל זוג היא זו שכבר מותקנת אצל המשתמש — הדגמת התוכנית קודמת
 * לסרטון המאגר, ובתוך המאגר נשמר המופע המוקדם יותר.
 */
const DUPLICATE_URLS = new Set([
  'https://www.tiktok.com/@deltabolic/video/7229117703041174790',
  'https://www.tiktok.com/@deltabolic/video/7230619955937561862',
  'https://www.tiktok.com/@deltabolic/video/7244334326920400133',
  'https://www.tiktok.com/@deltabolic/video/7328124394126068997',
  'https://www.tiktok.com/@deltabolic/video/7560124224904416513',
  'https://www.tiktok.com/@deltabolic/video/7567933458475928840',
  'https://www.tiktok.com/@deltabolic/video/7575749385187904769',
  'https://www.tiktok.com/@deltabolic/video/7580540364319132945',
  'https://www.tiktok.com/@deltabolic/video/7580924307560254736',
  'https://www.tiktok.com/@deltabolic/video/7581633130717531409',
  'https://www.tiktok.com/@deltabolic/video/7585770367348673793',
  'https://www.tiktok.com/@deltabolic/video/7586860337199090960',
  'https://www.tiktok.com/@deltabolic/video/7600597121871531280',
  'https://www.tiktok.com/@deltabolic/video/7602436025993989393',
  'https://www.tiktok.com/@deltabolic/video/7610208047830437137',
  'https://www.tiktok.com/@deltabolic/video/7612098282692611345',
  'https://www.tiktok.com/@deltabolic/video/7615013821366816017',
  'https://www.tiktok.com/@deltabolic/video/7622766689603685633',
  'https://www.tiktok.com/@deltabolic/video/7622835195439320337',
  'https://www.tiktok.com/@deltabolic/video/7623915507929959697',
  'https://www.tiktok.com/@deltabolic/video/7624689912972889345',
  'https://www.tiktok.com/@deltabolic/video/7625058981471472913',
  'https://www.tiktok.com/@deltabolic/video/7627614725223812369',
  'https://www.tiktok.com/@deltabolic/video/7627989099143597329',
  'https://www.tiktok.com/@deltabolic/video/7635387543650913537',
  'https://www.tiktok.com/@deltabolic/video/7635443784578387217',
  'https://www.tiktok.com/@deltabolic/video/7636116644674161921',
  'https://www.tiktok.com/@deltabolic/video/7636159246161169665',
  'https://www.tiktok.com/@deltabolic/video/7636953632805506320',
  'https://www.tiktok.com/@deltabolic/video/7643944699027328273',
  'https://www.tiktok.com/@deltabolic/video/7651794944499240193',
  'https://www.tiktok.com/@deltabolic/video/7666620266960801040',
  'https://www.tiktok.com/@deltabolic/video/7669146131384782096',
])


/** קבוצת שריר במאגר (עברית) → הערך ב-MuscleGroup */
const MUSCLE_MAP = {
  'חזה': 'chest',
  'גב': 'back',
  'רגליים': 'legs',
  'כתפיים': 'shoulders',
  'יד קדמית': 'biceps',
  'יד אחורית': 'triceps',
  'אמות': 'forearms',
  'בטן': 'abs',
}

/**
 * במאגר אין תרגילי שוק — יוצר התוכן פשוט לא מכסה אותם, ולכן ל-calves אין מקור.
 * אם יתווסף מקור בעתיד, כאן המקום למפות אותו: הוא יגיע תחת "רגליים" בעברית
 * וצריך להגיע ל-calves ב-MuscleGroup.
 */
const CALVES_KEYS = new Set()

/**
 * מפתח המאגר הופך לשם קובץ ולחלק מכתובת. "row_(general)" חוקי בכתובת אבל
 * שביר מספיק אצל שרתים סטטיים כדי לא לסמוך עליו — משאירים אותיות, ספרות וקו תחתון.
 */
function slug(key) {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

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
  let out = ''
  try {
    out = execFileSync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration',
      '-of', 'default=nw=1:nk=0', file,
    ]).toString()
  } catch {
    // קובץ שלא ניתן לקריאה מדווח כ"בלי מידות", והקורא מדלג עליו
    return { width: 0, height: 0, duration: 0 }
  }
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

/**
 * דוחס סרטון אחד ומייצר לו poster. מחזיר את רשומת המניפסט, או null אם דילגנו.
 * `relDir` הוא הנתיב היחסי ל-public, כדי שה-src במניפסט יתאים ל-assetUrl.
 *
 * לא זורק. קובץ מקור אחד פגום לא אמור להפיל ייבוא של מאות סרטונים — הוא מדווח
 * ומדולג, וההרצה ממשיכה. זה קרה בפועל: שני קבצים במאגר ירדו כאודיו בלבד,
 * ffmpeg עם -an ייצר מהם קובץ בלי שום stream, וכל הייבוא נפל אחרי 88 סרטונים.
 */
function transcode(src, outDir, base, relDir) {
  const outMp4 = join(outDir, `${base}.mp4`)
  const outJpg = join(outDir, `${base}.jpg`)
  const info = probe(src)
  const inSize = statSync(src).size

  if (!info.width || !info.height) {
    console.warn(`  ⚠ ${base}: אין זרם וידאו במקור (${src}) — מדולג`)
    return null
  }

  try {
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
  } catch (err) {
    console.warn(`  ⚠ ${base}: הדחיסה נכשלה — ${err.message.split('\n')[0]} — מדולג`)
    rmSync(outMp4, { force: true })
    rmSync(outJpg, { force: true })
    return null
  }

  const outSize = statSync(outMp4).size
  const outInfo = probe(outMp4)

  const pct = Math.round((1 - outSize / inSize) * 100)
  console.log(
    `  ✓ ${base}  ${(inSize / 1e6).toFixed(1)}MB → ${(outSize / 1e6).toFixed(1)}MB (-${pct}%)  ${outInfo.width}x${outInfo.height}  ${info.duration.toFixed(1)}s`
  )

  return {
    entry: {
      src: `${relDir}/${base}.mp4`,
      poster: `${relDir}/${base}.jpg`,
      width: outInfo.width,
      height: outInfo.height,
      durationSec: Math.round(info.duration * 10) / 10,
      sizeBytes: outSize,
    },
    inSize,
    outSize,
  }
}

/** מקור א׳ — הדגמות לתרגילי התוכנית. הכל נכנס. */
function importProgram() {
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
      let kept = 0
      files.forEach((f) => {
        // המספור לפי מה שנכנס בפועל ולא לפי מיקום במקור, כדי שדילוג לא ישאיר חור
        const idx = String(kept + 1).padStart(2, '0')
        const r = transcode(join(srcDir, f), OUT_DIR, `${exerciseId}-${idx}`, 'videos')
        if (!r) return
        kept += 1
        totalIn += r.inSize
        totalOut += r.outSize
        manifest[exerciseId].push(r.entry)
      })
      if (!manifest[exerciseId].length) delete manifest[exerciseId]
    }
  }
  return { manifest, totalIn, totalOut }
}

/** מקור ב׳ — המאגר הלימודי. רק LIB_MAX הראשונים בכל תרגיל. */
function importLibrary() {
  const jsonPath = join(LIB_SOURCE, 'exercise-library.json')
  if (!existsSync(jsonPath)) {
    console.warn(`  ⚠ המאגר לא נמצא, מדלג: ${jsonPath}`)
    return null
  }
  const source = JSON.parse(readFileSync(jsonPath, 'utf8'))
  mkdirSync(LIB_OUT_DIR, { recursive: true })

  const manifest = {}
  const catalog = []
  let totalIn = 0
  let totalOut = 0
  let capped = 0
  let dropped = 0

  for (const ex of source) {
    const muscle = CALVES_KEYS.has(ex.key) ? 'calves' : MUSCLE_MAP[ex.muscle]
    if (!muscle) {
      console.warn(`  ⚠ שריר לא מוכר "${ex.muscle}" בתרגיל ${ex.nameEn} — מדולג`)
      continue
    }
    const key = slug(ex.key)
    const id = `lib-${key}`
    const unique = ex.videos.filter((v) => !DUPLICATE_URLS.has(v.url))
    dropped += ex.videos.length - unique.length
    const picked = unique.slice(0, LIB_MAX)
    if (unique.length > picked.length) capped += unique.length - picked.length

    manifest[id] = []
    const videos = []
    picked.forEach((v) => {
      const srcFile = join(LIB_SOURCE, ex.folder, v.file)
      if (!existsSync(srcFile)) {
        console.warn(`  ⚠ קובץ חסר: ${ex.folder}/${v.file}`)
        return
      }
      // המספור לפי מה שנכנס בפועל — videos ו-manifest[id] חייבים להישאר מקבילים
      const idx = String(manifest[id].length + 1).padStart(2, '0')
      const r = transcode(srcFile, LIB_OUT_DIR, `${key}-${idx}`, 'videos/lib')
      if (!r) return
      totalIn += r.inSize
      totalOut += r.outSize
      manifest[id].push(r.entry)
      videos.push({ topic: v.topic, url: v.url })
    })

    if (!manifest[id].length) {
      delete manifest[id]
      continue
    }
    catalog.push({
      id,
      nameHe: ex.nameHe,
      nameEn: ex.nameEn,
      muscleGroup: muscle,
      videos,
      totalAvailable: ex.videoCount,
    })
  }

  return { manifest, catalog, totalIn, totalOut, capped, dropped }
}

function main() {
  if (!existsSync(SOURCE)) {
    console.error(`✗ תיקיית המקור לא נמצאה: ${SOURCE}`)
    process.exit(1)
  }
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })

  console.log('— תוכנית האימונים —')
  const { manifest, totalIn, totalOut } = importProgram()

  console.log('\n— מאגר התרגילים —')
  const lib = importLibrary()

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

  if (lib) {
    const libCount = Object.values(lib.manifest).reduce((n, v) => n + v.length, 0)
    const libTs = `// קובץ נוצר אוטומטית על ידי scripts/import-videos.mjs — אין לערוך ידנית.
// הרצה מחדש: npm run import:videos

import type { MuscleGroup } from './types'
import type { BundledVideo } from './videoManifest'

/** מה הסרטון הספציפי הזה מלמד, וקישור למקור */
export interface LibraryVideoNote {
  topic: string
  url: string
}

export interface LibraryExercise {
  /** תמיד בתחילית lib- כדי שלא יתנגש במזהי תרגילי התוכנית */
  id: string
  nameHe: string
  nameEn: string
  muscleGroup: MuscleGroup
  /** מקביל אחד-לאחד ל-LIBRARY_MANIFEST[id] */
  videos: LibraryVideoNote[]
  /** כמה סרטונים קיימים במקור. שווה לאורך videos כשאין תקרה. */
  totalAvailable: number
}

/** הסרטונים עצמם. אותו מבנה כמו VIDEO_MANIFEST, כדי ש-mediaDb יטפל בשניהם. */
export const LIBRARY_MANIFEST: Record<string, BundledVideo[]> = ${JSON.stringify(lib.manifest, null, 2)}

export const LIBRARY_CATALOG: LibraryExercise[] = ${JSON.stringify(lib.catalog, null, 2)}

/** סך כל המשקל של סרטוני המאגר, בבתים */
export const LIBRARY_TOTAL_BYTES = ${lib.totalOut}

/** מספר סרטוני המאגר שנכנסו לבנייה */
export const LIBRARY_COUNT = ${libCount}

/** התקרה שהופעלה בייבוא, או null כשהכל נכנס */
export const LIBRARY_MAX_PER_EXERCISE: number | null = ${
      Number.isFinite(LIB_MAX) ? LIB_MAX : 'null'
    }

/** כמה סרטונים קיימים במקור ולא נכנסו לבנייה */
export const LIBRARY_OMITTED = ${lib.capped}
`
    writeFileSync(LIB_MANIFEST, libTs)
  }

  const count = Object.values(manifest).reduce((n, v) => n + v.length, 0)
  console.log(
    `\n✓ תוכנית: ${count} סרטונים · ` +
      `${(totalIn / 1e6).toFixed(0)}MB → ${(totalOut / 1e6).toFixed(0)}MB ` +
      `(-${Math.round((1 - totalOut / totalIn) * 100)}%)`
  )
  if (lib) {
    const libCount = Object.values(lib.manifest).reduce((n, v) => n + v.length, 0)
    console.log(
      `✓ מאגר: ${libCount} סרטונים ב-${lib.catalog.length} תרגילים · ` +
        `${(lib.totalIn / 1e6).toFixed(0)}MB → ${(lib.totalOut / 1e6).toFixed(0)}MB ` +
        `(-${Math.round((1 - lib.totalOut / lib.totalIn) * 100)}%)`
    )
    // קיצוץ שקט נקרא ככיסוי מלא — לכן הוא נאמר במפורש
    console.log(
      lib.dropped > 0 ? `  ${lib.dropped} סרטונים דולגו ככפילויות של סרטון אחר` : null,
      lib.capped > 0
        ? `  ${lib.capped} סרטונים נוספים קיימים במקור ולא נכנסו (תקרה של ${LIB_MAX} לתרגיל)`
        : '  בלי תקרה — כל הסרטונים שבמקור נכנסו'
    )
    console.log(`✓ סך הכל בבנייה: ${((totalOut + lib.totalOut) / 1e6).toFixed(0)}MB`)
  }
  console.log(`✓ manifest: ${MANIFEST}`)
  if (lib) console.log(`✓ manifest: ${LIB_MANIFEST}`)
}

main()
