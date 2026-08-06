#!/usr/bin/env node
/**
 * מייצר את אייקוני ה-PWA — משקולת ברזל מלובנת על שחור חמים.
 *
 * העיצוב נגזר ישירות ממערכת העיצוב של האפליקציה ("מכון בלילה"):
 *   · רקע ink-950 עם הילה חמה מלמעלה, כמו מנורה יחידה מעל המתקן
 *   · הלהבה מתנהגת כאור — יש בלום סביב הברזל, לא רק מילוי כתום
 *   · קצה עליון מואר וקצה תחתון מוצל, כמו ה-inset של .card
 *   · חריצים אלכסוניים על המוט — אותה טקסטורת .knurl של ידית מוט
 *
 * מרסטר את הצורות ידנית ומקודד PNG עם zlib, בלי שום תלות חיצונית.
 * דגימת-על פי 4 בכל ציר נותנת קצוות חלקים.
 *
 * הרצה: npm run gen:icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const INK = [0x0c, 0x0a, 0x09] // ink-950
const GLOW = [0x33, 0x1d, 0x0e] // ההילה החמה מאחורי הברזל
// אותו גרדיאנט בדיוק של .btn-flame — האייקון הוא הכתום של כפתור הפעולה
const FLAME_HI = [0xff, 0x8a, 0x2b] // flame-400
const FLAME_LO = [0xe3, 0x51, 0x00] // flame-600
const FLAME_DEEP = [0xb1, 0x3c, 0x00] // flame-700 — הצללת הקצה התחתון
const FLAME_LIGHT = [0xff, 0x6a, 0x00] // flame-500 — צבע הבלום
const SPEC = [0xff, 0xe6, 0xc8] // הבהקת הקצה העליון

const SS = 4 // דגימת-על

/** חצי הגובה של הפלטה הגבוהה — קובע את פרישת הגרדיאנט על הסמל */
const PLATE_HH = 0.185

/** מרחק חתום מריבוע מעוגל שמרכזו (cx,cy) */
function roundedRectSD(x, y, cx, cy, hw, hh, r) {
  const qx = Math.abs(x - cx) - (hw - r)
  const qy = Math.abs(y - cy) - (hh - r)
  const ax = Math.max(qx, 0)
  const ay = Math.max(qy, 0)
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r
}

/**
 * המשקולת. הקואורדינטות ביחידות של 0..1 כדי שיתאימו לכל גודל.
 * מוט מרכזי + שתי פלטות פנימיות + שתי פלטות חיצוניות + קצוות מוט בכל צד.
 *
 * הפרופורציות מכוונות לקריאה במסך הבית של אייפון (60pt): צללית עבה,
 * הפרש ברור בין הפלטה הפנימית לחיצונית, ורווח שנשאר פתוח גם אחרי החיתוך.
 */
function dumbbellSD(u, v, scale) {
  // מרכוז וסקיילינג סביב (0.5, 0.5)
  const x = (u - 0.5) / scale + 0.5
  const y = (v - 0.5) / scale + 0.5

  const parts = [
    // מוט
    roundedRectSD(x, y, 0.5, 0.5, 0.22, 0.035, 0.035),
    // פלטות פנימיות — הגבוהות
    roundedRectSD(x, y, 0.325, 0.5, 0.05, PLATE_HH, 0.036),
    roundedRectSD(x, y, 0.675, 0.5, 0.05, PLATE_HH, 0.036),
    // פלטות חיצוניות
    roundedRectSD(x, y, 0.225, 0.5, 0.046, 0.125, 0.034),
    roundedRectSD(x, y, 0.775, 0.5, 0.046, 0.125, 0.034),
    // קצוות המוט
    roundedRectSD(x, y, 0.15, 0.5, 0.028, 0.06, 0.024),
    roundedRectSD(x, y, 0.85, 0.5, 0.028, 0.06, 0.024),
  ]
  return Math.min(...parts) * scale
}

/** רק המוט — כדי לדעת איפה מותר למרוח חריצים */
function barSD(u, v, scale) {
  const x = (u - 0.5) / scale + 0.5
  const y = (v - 0.5) / scale + 0.5
  return roundedRectSD(x, y, 0.5, 0.5, 0.22, 0.035, 0.035) * scale
}

/** הפלטות הפנימיות — החריצים נעצרים בהן */
function innerPlateSD(u, v, scale) {
  const x = (u - 0.5) / scale + 0.5
  const y = (v - 0.5) / scale + 0.5
  return (
    Math.min(
      roundedRectSD(x, y, 0.325, 0.5, 0.05, PLATE_HH, 0.036),
      roundedRectSD(x, y, 0.675, 0.5, 0.05, PLATE_HH, 0.036),
    ) * scale
  )
}

function mix(a, b, t) {
  const k = t < 0 ? 0 : t > 1 ? 1 : t
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

function clamp01(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t
}

/** גרעין דטרמיניסטי — מונע פסי גרדיאנט ב-OLED, כמו טקסטורת הרקע באפליקציה */
function grain(px, py) {
  let h = (px * 0x1f1f1f1f) ^ (py * 0x27220a95)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39)
  return (((h ^ (h >>> 15)) >>> 0) / 0xffffffff - 0.5) * 5
}

/**
 * @param size    גודל בפיקסלים
 * @param scale   כמה מהמסגרת הסמל תופס (maskable צריך שוליים)
 * @param squircle לחתוך לפינות מעוגלות (iOS חותך בעצמו, אז שם לא צריך)
 */
function render(size, scale, { squircle = false } = {}) {
  const px = Buffer.alloc(size * size * 4)
  const half = size / 2

  // גבולות הגרדיאנט האנכי על הסמל, אחרי הסקיילינג
  const top = 0.5 - PLATE_HH * scale
  const span = 2 * PLATE_HH * scale

  // רוחב הקצה המואר ותחום הבלום — יחסיים למסגרת, כדי שייראו זהים בכל גודל
  const EDGE = 0.014
  const BLOOM = 0.042
  // צעד לחישוב נורמל הקצה; חצי פיקסל מספיק ולא רועד
  const eps = 0.5 / size

  // חריצים: אותו מרווח יחסי של .knurl בהתאמה לגודל האייקון
  const knurlPeriod = 1 / 34
  const knurlLine = knurlPeriod * 0.42
  const knurlOn = size >= 96 // בקטן מזה זו רק לכלוך

  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = pxi + (sx + 0.5) / SS
          const fy = py + (sy + 0.5) / SS
          const u = fx / size
          const v = fy / size

          // מחוץ למסגרת המעוגלת
          if (squircle) {
            if (roundedRectSD(fx, fy, half, half, half, half, size * 0.225) > 0) continue
          }

          // ── רקע: שחור חמים עם הילה רכה מלמעלה ──
          const dist = Math.hypot(u - 0.5, v - 0.16) / 0.78
          let col = mix(GLOW, INK, clamp01(dist * dist))

          const sd = dumbbellSD(u, v, scale)

          if (sd < 0) {
            // ── הברזל עצמו: גרדיאנט להבה מלמעלה למטה ──
            col = mix(FLAME_HI, FLAME_LO, clamp01((v - top) / span))

            // חריצים על המוט החשוף בלבד — ידית של מוט, לא על הפלטות
            if (knurlOn && barSD(u, v, scale) < -0.004 && innerPlateSD(u, v, scale) > 0.006) {
              const t = ((u + v) % knurlPeriod + knurlPeriod) % knurlPeriod
              const groove = clamp01((knurlLine - t) / (knurlLine * 0.6))
              col = mix(col, FLAME_DEEP, groove * 0.42)
            }

            // ── קצה עליון מואר, קצה תחתון מוצל ──
            if (sd > -EDGE * 1.6) {
              // נורמל אנכי: שלילי = משטח שפונה למעלה
              const ny =
                (dumbbellSD(u, v + eps, scale) - dumbbellSD(u, v - eps, scale)) / (2 * eps)
              const prox = clamp01((sd + EDGE) / EDGE)
              if (ny < 0) col = mix(col, SPEC, clamp01(-ny) * prox * 0.5)
              else col = mix(col, FLAME_DEEP, clamp01(ny) * prox * 0.45)
            }
          } else if (sd < BLOOM) {
            // ── בלום: הלהבה מתנהגת כאור ומחממת את הרקע סביבה ──
            col = mix(col, FLAME_LIGHT, Math.exp(-sd / (BLOOM * 0.28)) * 0.58)
          }

          r += col[0]
          g += col[1]
          b += col[2]
          a += 255
        }
      }

      const n = SS * SS
      const i = (py * size + pxi) * 4
      const gr = grain(pxi, py)
      px[i] = Math.max(0, Math.min(255, Math.round(r / n + gr)))
      px[i + 1] = Math.max(0, Math.min(255, Math.round(g / n + gr)))
      px[i + 2] = Math.max(0, Math.min(255, Math.round(b / n + gr)))
      px[i + 3] = Math.round(a / n)
    }
  }
  return px
}

// ── קידוד PNG ──

function crc32(buf) {
  let c
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  c = -1
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(size, rgba) {
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** אותה משקולת בדיוק, וקטורית — ללשונית הדפדפן */
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0C0A09"/>
  <circle cx="50" cy="50" r="34" fill="url(#glow)"/>
  <g fill="url(#f)">
    <rect x="28" y="46.5" width="44" height="7" rx="3.5"/>
    <rect x="27.5" y="31.5" width="10" height="37" rx="3.6"/>
    <rect x="62.5" y="31.5" width="10" height="37" rx="3.6"/>
    <rect x="17.9" y="37.5" width="9.2" height="25" rx="3.4"/>
    <rect x="72.9" y="37.5" width="9.2" height="25" rx="3.4"/>
    <rect x="12.2" y="44" width="5.6" height="12" rx="2.4"/>
    <rect x="82.2" y="44" width="5.6" height="12" rx="2.4"/>
  </g>
  <defs>
    <linearGradient id="f" x1="0" y1="31.5" x2="0" y2="68.5" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFB066"/><stop offset="1" stop-color="#E35100"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop stop-color="#FF6A00" stop-opacity=".28"/>
      <stop offset="1" stop-color="#FF6A00" stop-opacity="0"/>
    </radialGradient>
  </defs>
</svg>
`

mkdirSync(OUT, { recursive: true })

const jobs = [
  { file: 'icon-192.png', size: 192, scale: 0.9 },
  { file: 'icon-512.png', size: 512, scale: 0.9 },
  // maskable: אזור הבטיחות הוא עיגול בקוטר 80%. בסקייל הזה חצי-האלכסון של
  // המשקולת הוא ~0.32 מהמסגרת — בתוך ה-0.4 המותרים, בלי להתגמד.
  { file: 'maskable-512.png', size: 512, scale: 0.75 },
  // apple-touch-icon חייב רקע אטום — iOS מרנדר שקיפות כשחור, והוא גם
  // מעגל את הפינות בעצמו. 0.86 משאיר אוויר כדי שהחיתוך לא יגע בברזל.
  { file: 'apple-touch-icon.png', size: 180, scale: 0.86, squircle: false },
]

for (const j of jobs) {
  const px = render(j.size, j.scale, { squircle: j.squircle })
  writeFileSync(join(OUT, j.file), encodePng(j.size, px))
  console.log(`  ✓ ${j.file}  ${j.size}×${j.size}`)
}
writeFileSync(join(OUT, 'favicon.svg'), FAVICON_SVG)
console.log('  ✓ favicon.svg')
console.log('✓ אייקונים נוצרו ב-public/icons')
