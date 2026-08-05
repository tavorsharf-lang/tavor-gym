#!/usr/bin/env node
/**
 * מייצר את אייקוני ה-PWA — משקולת כתומה על שחור חמים.
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

const INK = [0x0c, 0x0a, 0x09]
const GLOW = [0x2a, 0x18, 0x0c]
const FLAME_HI = [0xff, 0xb0, 0x66]
const FLAME_LO = [0xe3, 0x51, 0x00]

const SS = 4 // דגימת-על

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
 * מוט מרכזי + שתי פלטות פנימיות + שתי פלטות חיצוניות בכל צד.
 */
function dumbbellSD(u, v, scale) {
  // מרכוז וסקיילינג סביב (0.5, 0.5)
  const x = (u - 0.5) / scale + 0.5
  const y = (v - 0.5) / scale + 0.5

  const parts = [
    // מוט
    roundedRectSD(x, y, 0.5, 0.5, 0.235, 0.026, 0.026),
    // פלטות פנימיות
    roundedRectSD(x, y, 0.318, 0.5, 0.044, 0.135, 0.032),
    roundedRectSD(x, y, 0.682, 0.5, 0.044, 0.135, 0.032),
    // פלטות חיצוניות
    roundedRectSD(x, y, 0.214, 0.5, 0.042, 0.093, 0.03),
    roundedRectSD(x, y, 0.786, 0.5, 0.042, 0.093, 0.03),
    // קצוות המוט
    roundedRectSD(x, y, 0.152, 0.5, 0.026, 0.05, 0.022),
    roundedRectSD(x, y, 0.848, 0.5, 0.026, 0.05, 0.022),
  ]
  return Math.min(...parts) * scale
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

/**
 * @param size    גודל בפיקסלים
 * @param scale   כמה מהמסגרת הסמל תופס (maskable צריך שוליים)
 * @param rounded לעגל את הפינות (favicon/maskable לא, אייקון אפל כן — iOS חותך בעצמו)
 */
function render(size, scale, { squircle = false } = {}) {
  const px = Buffer.alloc(size * size * 4)
  const half = size / 2

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

          // מחוץ למסגרת המעוגלת של אייקון אפל
          if (squircle) {
            const d = roundedRectSD(fx, fy, half, half, half, half, size * 0.225)
            if (d > 0) continue
          }

          // רקע: שחור חמים עם הילה רכה מלמעלה
          const dist = Math.hypot(u - 0.5, v - 0.18) / 0.75
          const bg = mix(GLOW, INK, Math.min(1, dist * dist))

          // הסמל
          const sd = dumbbellSD(u, v, scale)
          const inside = sd < 0
          let col = bg
          if (inside) {
            // גרדיאנט להבה מלמעלה למטה על הסמל
            const t = Math.min(1, Math.max(0, (v - 0.34) / 0.32))
            col = mix(FLAME_HI, FLAME_LO, t)
          }

          r += col[0]
          g += col[1]
          b += col[2]
          a += 255
        }
      }

      const n = SS * SS
      const i = (py * size + pxi) * 4
      px[i] = Math.round(r / n)
      px[i + 1] = Math.round(g / n)
      px[i + 2] = Math.round(b / n)
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

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0C0A09"/>
  <g fill="url(#f)">
    <rect x="26.5" y="47.4" width="47" height="5.2" rx="2.6"/>
    <rect x="27.4" y="36.5" width="8.8" height="27" rx="3.2"/>
    <rect x="63.8" y="36.5" width="8.8" height="27" rx="3.2"/>
    <rect x="17.2" y="40.7" width="8.4" height="18.6" rx="3"/>
    <rect x="74.4" y="40.7" width="8.4" height="18.6" rx="3"/>
    <rect x="12.6" y="45" width="5.2" height="10" rx="2.2"/>
    <rect x="82.2" y="45" width="5.2" height="10" rx="2.2"/>
  </g>
  <defs>
    <linearGradient id="f" x1="0" y1="34" x2="0" y2="66" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFB066"/><stop offset="1" stop-color="#E35100"/>
    </linearGradient>
  </defs>
</svg>
`

mkdirSync(OUT, { recursive: true })

const jobs = [
  { file: 'icon-192.png', size: 192, scale: 0.92 },
  { file: 'icon-512.png', size: 512, scale: 0.92 },
  // maskable: iOS/Android חותכים עד 20% מכל צד, לכן הסמל קטן יותר
  { file: 'maskable-512.png', size: 512, scale: 0.62 },
  // apple-touch-icon חייב רקע אטום — iOS מרנדר שקיפות כשחור
  { file: 'apple-touch-icon.png', size: 180, scale: 0.9, squircle: false },
]

for (const j of jobs) {
  const px = render(j.size, j.scale, { squircle: j.squircle })
  writeFileSync(join(OUT, j.file), encodePng(j.size, px))
  console.log(`  ✓ ${j.file}  ${j.size}×${j.size}`)
}
writeFileSync(join(OUT, 'favicon.svg'), FAVICON_SVG)
console.log('  ✓ favicon.svg')
console.log('✓ אייקונים נוצרו ב-public/icons')
