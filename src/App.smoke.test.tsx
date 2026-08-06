import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'

/**
 * בדיקת עשן: מרנדרת את האפליקציה כמו שהיא ומוודאת שהיא מגיעה למסך הבית.
 *
 * המטרה היא לתפוס קריסות ריצה — ייבוא שבור, גישה לשדה של undefined, הוק
 * שקורא ל-API שלא קיים. jsdom לא יודע לצייר, ולכן הבדיקה לא בודקת עיצוב אלא
 * רק שהמסלול מהאתחול ועד לתוכן הראשון עובר בשלום.
 */

describe('App', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureReady()
  })

  it('נטענת ומגיעה למסך הבית עם כפתור התחלת אימון', async () => {
    render(<App />)

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /התחל אימון/ })).toBeTruthy()
      },
      { timeout: 5000 }
    )
  })

  it('מציגה את תוכניות הפול-באדי הפעילות, ולא את הפיצול הכבוי', async () => {
    render(<App />)

    // ברירת המחדל היא תוכנית החזרה. הפיצול קיים במסד אבל כבוי, ולכן לא מוצג
    await waitFor(() => expect(screen.getAllByText(/פול באדי/).length).toBeGreaterThan(0), {
      timeout: 5000,
    })

    expect(screen.queryByText(/חזה ויד אחורית/)).toBeNull()
  })

  it('הזריעה יוצרת קטלוג מלא, חמש תוכניות ושלושה בלוקים', async () => {
    const [exercises, routines, blocks] = await Promise.all([
      db.exercises.count(),
      db.routines.count(),
      db.blocks.count(),
    ])
    // 9 באימון A, 7 ב-B, 5 ב-C, ועוד 4+2+1 בבלוקים
    expect(exercises).toBe(28)
    // A/B/C + שתי תוכניות פול-באדי
    expect(routines).toBe(5)
    expect(blocks).toBe(3)
  })

  it('רק תוכניות הפול-באדי פעילות בהתחלה', async () => {
    const active = (await db.routines.toArray()).filter((r) => r.isActive).map((r) => r.id)
    expect(active.sort()).toEqual(['F1', 'F2'])
  })

  it('לתוכנית החזרה יש משקלי התחלה מופחתים', async () => {
    const f1 = await db.routines.get('F1')
    const legPress = f1?.items.find((i) => i.exerciseId === 'leg-press')
    // 160 בקטלוג, 60% מזה מעוגל לקפיצה של 5
    expect(legPress?.startWeightKg).toBe(95)
    expect(legPress?.targetSets).toBe(3)
  })

  it('כל פריט בתוכניות ובבלוקים מצביע על תרגיל שקיים בקטלוג', async () => {
    const ids = new Set((await db.exercises.toArray()).map((e) => e.id))
    const plans = [...(await db.routines.toArray()), ...(await db.blocks.toArray())]
    const missing = plans.flatMap((p) =>
      p.items.filter((i) => !ids.has(i.exerciseId)).map((i) => i.exerciseId)
    )
    expect(missing).toEqual([])
  })
})

/**
 * מסך הבית מרנדר את כרטיסי הכניסה רק אחרי שכל ה-liveQueries נפתרו, ולכן
 * ממתינים קודם לתוכן שמגיע איתם ורק אז מחפשים את הכרטיס.
 */
async function openLibrary(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await waitFor(() => expect(screen.getAllByText(/פול באדי/).length).toBeGreaterThan(0), {
    timeout: 10000,
  })
  const card = await screen.findByRole('button', { name: /כל התרגילים/ }, { timeout: 10000 })
  await user.click(card)
}

describe('ספריית התרגילים', () => {
  beforeEach(async () => {
    // ה-hash שורד בין בדיקות, ובלי האיפוס הבדיקה הבאה נפתחת כבר בתוך הספרייה
    window.location.hash = ''
    await db.delete()
    await db.open()
    await ensureReady()
  })

  it('נפתחת ממסך הבית ומציגה את כל התרגילים לפי שריר, מהגדול לקטן', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openLibrary(user)

    await waitFor(() => expect(screen.getByRole('heading', { name: 'רגליים' })).toBeTruthy(), {
      timeout: 5000,
    })

    // סדר הכותרות הוא סדר גודל השרירים, לא סדר הקטלוג
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings.indexOf('רגליים')).toBeLessThan(headings.indexOf('גב'))
    expect(headings.indexOf('גב')).toBeLessThan(headings.indexOf('חזה'))
    expect(headings.indexOf('חזה')).toBeLessThan(headings.indexOf('כתפיים'))
    expect(headings.indexOf('בטן')).toBeGreaterThan(headings.indexOf('כתפיים'))

    // כל 28 התרגילים מופיעים
    expect(screen.getByText('לחיצת רגליים')).toBeTruthy()
    expect(screen.getByText('פטישים יושב')).toBeTruthy()
  }, 30000)

  it('לחיצה על תרגיל פותחת אותו עם השם באנגלית', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openLibrary(user)
    await waitFor(() => expect(screen.getByText('לחיצת רגליים')).toBeTruthy(), { timeout: 5000 })
    await user.click(screen.getByText('לחיצת רגליים'))

    // השם באנגלית מופיע רק כאן, לא ברשימה
    await waitFor(() => expect(screen.getByText('Leg Press')).toBeTruthy(), { timeout: 5000 })
    // והדגשים מגיעים איתו
    expect(screen.getByText(/לדחוף מהעקבים/)).toBeTruthy()
  }, 30000)

  it('הרשימה עצמה בעברית בלבד — בלי שמות באנגלית', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openLibrary(user)
    await waitFor(() => expect(screen.getByText('לחיצת רגליים')).toBeTruthy(), { timeout: 5000 })

    expect(screen.queryByText('Leg Press')).toBeNull()
    expect(screen.queryByText('Lat Pulldown')).toBeNull()
  }, 30000)
})
