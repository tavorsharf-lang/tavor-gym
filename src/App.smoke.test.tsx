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

  it('מציגה את שלוש התוכניות אחרי שהשאילתות נפתרות', async () => {
    render(<App />)

    // אין היסטוריה, ולכן אימון A אמור להיות המוצע — "מעולם לא בוצע" גובר על הכל
    await waitFor(() => expect(screen.getAllByText(/חזה ויד אחורית/).length).toBeGreaterThan(0), {
      timeout: 5000,
    })

    expect(screen.getByText(/גב ויד קדמית/)).toBeTruthy()
    expect(screen.getByText(/רגליים/)).toBeTruthy()
  })

  it('הזריעה יוצרת קטלוג מלא, שלוש תוכניות ושלושה בלוקים', async () => {
    const [exercises, routines, blocks] = await Promise.all([
      db.exercises.count(),
      db.routines.count(),
      db.blocks.count(),
    ])
    // 9 באימון A, 7 ב-B, 5 ב-C, ועוד 4+2+1 בבלוקים
    expect(exercises).toBe(28)
    expect(routines).toBe(3)
    expect(blocks).toBe(3)
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
