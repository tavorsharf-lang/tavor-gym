import { render, screen, waitFor } from '@testing-library/react'
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
