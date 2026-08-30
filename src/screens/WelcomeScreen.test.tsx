import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '@/App'
import { db, ensureReady } from '@/db/db'

/**
 * מסך הפתיחה — הבדיקה היחידה שמדליקה אותו בכוונה.
 *
 * בכל שאר קובצי הבדיקות הוא כבוי מעצמו: ה-`localStorage` הגלובלי בהרצה הזו
 * הוא אובייקט ריק בלי שיטות, ולכן `isFirstRun()` נופל ל-catch ומחזיר false.
 * זו בדיוק ההתנהגות הרצויה (נכשל סגור), אבל היא גם מה שהופך את הפיצ׳ר כולו
 * לבלתי-נבדק — ולכן הקובץ הזה קיים. בלעדיו מי שיישבור אותו בעתיד לא יראה
 * שום כשל, ומי שייתקל בכשל לא יבין מה מכבה מה.
 */

const KEY = 'tavor-gym:first-run'
const store = new Map<string, string>()

beforeEach(async () => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  })
  await db.delete()
  await db.open()
  await ensureReady()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('מסך הפתיחה', () => {
  it('מופיע בהתקנה חדשה, ונסגר לתמיד בלחיצה אחת', async () => {
    // ‏db.open() כאן עבר דרך populate, ולכן הדגל כבר 'new'
    expect(store.get(KEY)).toBe('new')

    const user = userEvent.setup()
    render(<App />)

    const start = await screen.findByRole(
      'button',
      { name: 'המשך בלשונית בינתיים' },
      { timeout: 5000 }
    )
    // הקטלוג לא מוזכר כשאלה — המסך מצהיר ולא מפצל
    expect(screen.getByText(/הכול נשאר במכשיר הזה/)).toBeTruthy()

    await user.click(start)

    // מסך הבית, ובלי דרך חזרה למסך הפתיחה
    await waitFor(() => expect(screen.getByRole('button', { name: /התחל אימון/ })).toBeTruthy(), {
      timeout: 5000,
    })
    expect(store.get(KEY)).toBe('done')
  })

  it('יש דרך לשחזור גיבוי מתוך המסך — הוא חוסם את הנתיב לשם', async () => {
    /*
      מסך הפתיחה הוא early return מעל `<Routes>`. מי שדלי האחסון שלו נמחק
      נראה מכאן בדיוק כמו מכשיר חדש, ובלי הכפתור הזה קובץ הגיבוי שלו היה
      יושב מעבר לדלת נעולה.
    */
    const user = userEvent.setup()
    render(<App />)

    const restore = await screen.findByRole(
      'button',
      { name: 'כבר יש לי קובץ גיבוי לשחזר' },
      { timeout: 5000 }
    )
    await user.click(restore)

    await waitFor(
      () => expect(screen.getByRole('heading', { name: 'גיבוי ושחזור' })).toBeTruthy(),
      { timeout: 10000 }
    )
    expect(store.get(KEY)).toBe('done')
  }, 30000)

  it('לא מופיע כשהדגל חתום — זה המסלול של תבור', async () => {
    store.set(KEY, 'done')

    render(<App />)

    await waitFor(() => expect(screen.getByRole('button', { name: /התחל אימון/ })).toBeTruthy(), {
      timeout: 5000,
    })
    expect(screen.queryByText(/הכול נשאר במכשיר הזה/)).toBeNull()
  })
})
