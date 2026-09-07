#!/usr/bin/env node
/**
 * מריץ תרחיש על האפליקציה החיה ומצלם.
 *
 * זו לא בדיקה — זו העין. `npm test` מוכיח שהלוגיקה נכונה ולא מראה שהמסך נכנס,
 * שהטקסט לא נחתך, ושהכתום יושב איפה שהוא אמור. את זה רואים רק בצילום, ובלי
 * הכלי הזה כל סבב עיצוב מתחיל בבנייה מחדש של אותו קוד הרצה בדיוק: איתור
 * הבינארי, מסגרת האייפון, דילוג על מסך הפתיחה, וגישה ל-store.
 *
 * הרצה:
 *   npm run dev                                    # בטרמינל נפרד
 *   node scripts/shoot.mjs .claude/shots/foo.mjs   # התרחיש
 *
 * התרחיש מייצא ברירת מחדל פונקציה אחת:
 *
 *   export default async ({ page, shot, store, base }) => {
 *     await store(async (s) => { await s.useWorkout.getState().start('C', []) })
 *     await page.goto(`${base}#/workout`)
 *     await shot('card')
 *   }
 *
 * יציאה בקוד 1 אם נזרקה שגיאה בדף — כך הצילום הוא גם בדיקת עשן, ולא רק תמונה.
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'
import { pathToFileURL } from 'node:url'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:5173/tavor-gym/'

/*
  מסגרת iPhone 14/15 בלי safe areas — אותה מסגרת שכל חבילות העיצוב נמדדו
  עליה. `deviceScaleFactor: 2` כדי שהצילום יהיה קריא, `isMobile`+`hasTouch`
  כדי שמדיה-קוורי ומחוות מגע יתנהגו כמו במכשיר.
*/
const VIEWPORT = { width: 390, height: 846 }

/**
 * הבינארי של Chromium מהמטמון של Playwright.
 *
 * חיפוש ולא נתיב קשיח: מספר הגרסה בשם התיקייה משתנה עם כל עדכון, והשם בפנים
 * הוא "Google Chrome for Testing" ולא "Chromium" — שתי מלכודות שכל אחת בפני
 * עצמה נראית כמו "הכלי לא מותקן".
 */
function findChromium() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const roots = [
    join(homedir(), 'Library/Caches/ms-playwright'),
    join(homedir(), '.cache/ms-playwright'),
  ].filter(existsSync)

  const inners = [
    'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-linux/chrome',
  ]

  for (const root of roots) {
    const dirs = readdirSync(root)
      .filter((d) => d.startsWith('chromium-') && !d.includes('headless'))
      .sort()
      .reverse()
    for (const dir of dirs) {
      for (const inner of inners) {
        const full = join(root, dir, inner)
        if (existsSync(full)) return full
      }
    }
  }
  return null
}

function die(message, code = 2) {
  console.error(`✗ ${message}`)
  process.exit(code)
}

const scenarioArg = process.argv[2]
if (!scenarioArg) die('שימוש: node scripts/shoot.mjs <תרחיש.mjs> [--out DIR]')

const outFlag = process.argv.indexOf('--out')
const outDir = resolve(outFlag > -1 ? process.argv[outFlag + 1] : dirname(resolve(scenarioArg)))

let chromium
try {
  ;({ chromium } = await import('playwright-core'))
} catch {
  die('חסר playwright-core. להתקין:  npm i -D playwright-core')
}

const executablePath = findChromium()
if (!executablePath) {
  die('לא נמצא Chromium במטמון של Playwright. להתקין:  npx playwright install chromium')
}

// שער מוקדם: בלי שרת פיתוח הכל ייכשל אחר כך בהודעה שלא מסבירה כלום
try {
  const res = await fetch(BASE, { signal: AbortSignal.timeout(3000) })
  if (!res.ok) throw new Error(String(res.status))
} catch {
  die(`אין שרת פיתוח ב-${BASE}. להריץ בטרמינל נפרד:  npm run dev`)
}

mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ executablePath })
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
const page = await context.newPage()

/** שגיאות דף — הן מה שהופך את הצילום לבדיקת עשן */
const errors = []
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})

let shotIndex = 0
const shots = []

/** צילום ממוספר, כדי שסדר הצילומים בתיקייה יהיה סדר התרחיש */
async function shot(name) {
  shotIndex += 1
  const file = join(outDir, `${String(shotIndex).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file })
  shots.push(file)
  return file
}

/**
 * גישה ל-state ול-DB מתוך הדף.
 *
 * זה הקיצור שחוסך את רוב עבודת ההכנה בכל תרחיש: להעמיד אימון במצב מסוים דרך
 * ה-store מהיר, יציב, וקורא הרבה יותר מלחיצות על שרשרת מסכים.
 */
async function store(fn) {
  return page.evaluate(async (source) => {
    const [workout, db, queries] = await Promise.all([
      import('/tavor-gym/src/state/activeWorkoutStore.ts'),
      import('/tavor-gym/src/db/db.ts'),
      import('/tavor-gym/src/db/queries.ts'),
    ])
    // eslint-disable-next-line no-new-func
    return new Function('mods', `return (${source})(mods)`)({ ...workout, db: db.db, ...db, ...queries })
  }, fn.toString())
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// מסך הפתיחה עולה רק בהתקנה טרייה, ולכן הוא מטופל ולא מונח
const welcome = page.getByRole('button', { name: /בוא נתחיל|התחל|המשך/ })
if (await welcome.count()) {
  await welcome.first().click().catch(() => {})
  await page.waitForTimeout(1200)
}

// קונפטי מסתיר בדיוק את מה שבאים לצלם
await page
  .evaluate(async () => {
    const m = await import('/tavor-gym/src/db/db.ts')
    await m.saveSettings({ confettiEnabled: false })
  })
  .catch(() => {})
await page.waitForTimeout(500)

const scenario = await import(pathToFileURL(resolve(scenarioArg)).href)
const run = scenario.default
if (typeof run !== 'function') die(`${scenarioArg} חייב לייצא ברירת מחדל פונקציה`)

let failed = false
try {
  await run({ page, shot, store, base: BASE, log: console.log })
} catch (e) {
  console.error(`✗ התרחיש נפל: ${e.message}`)
  await shot('failure').catch(() => {})
  failed = true
}

await browser.close()

for (const file of shots) console.log(`  ${file}`)
if (errors.length) {
  console.error(`\n✗ ${errors.length} שגיאות בדף:`)
  for (const e of errors.slice(0, 10)) console.error(`  ${e}`)
}
process.exit(failed || errors.length ? 1 : 0)
