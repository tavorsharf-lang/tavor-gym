import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { SEED_EXERCISES } from './db/seed'

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
    expect(exercises).toBe(SEED_EXERCISES.length)
    // A/B/C + שתי תוכניות פול-באדי
    expect(routines).toBe(5)
    expect(blocks).toBe(3)
  })

  it('רק תוכניות הפול-באדי פעילות בהתחלה', async () => {
    const active = (await db.routines.toArray()).filter((r) => r.isActive).map((r) => r.id)
    expect(active.sort()).toEqual(['F1', 'F2'])
  })

  it('התקנה חדשה מקבלת את התוכניות בלי משקלי התחלה', async () => {
    const f1 = await db.routines.get('F1')
    const legPress = f1?.items.find((i) => i.exerciseId === 'leg-press')
    /*
      שני הצדדים ריקים, וזה חייב להיבדק בשניהם: `PlanItem.startWeightKg` גובר
      על `Exercise.seedWeightKg` בזמן ריצה, ולכן ריקון של אחד מהם לבדו לא היה
      משנה כלום בפועל.

      המספרים ב-SEED_* הם המשקלים של תבור. התקנה חדשה נזרעת דרך `freshSeed*`,
      אחרת הסט הראשון בחייו של מישהו אחר היה נפתח על 95 ק״ג בלחיצת רגליים.
    */
    expect(legPress?.startWeightKg).toBeNull()
    expect((await db.exercises.get('leg-press'))?.seedWeightKg).toBeNull()
    // ברירת המחדל אחידה לכל תרגיל — שני סטים ושתי דקות מנוחה
    expect(legPress?.targetSets).toBe(2)
    expect(legPress?.restSeconds).toBe(120)
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
  // כרטיס אחד, "תרגילים" — הוא החליף את "כל התרגילים" ואת "מאגר תרגילים" גם יחד
  const card = await screen.findByRole('button', { name: /^תרגילים/ }, { timeout: 10000 })
  await user.click(card)
}

/** מעביר את המסך המאוחד למצב "הכל" */
async function switchToAll(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(await screen.findByRole('button', { name: 'הכל' }, { timeout: 5000 }))
}

describe('ספריית התרגילים', () => {
  beforeEach(async () => {
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
    expect(screen.getByText('כפיפת פטיש')).toBeTruthy()
  }, 30000)

  it('לחיצה על תרגיל פותחת אותו עם השם באנגלית', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openLibrary(user)
    await waitFor(() => expect(screen.getByText('לחיצת רגליים')).toBeTruthy(), { timeout: 5000 })
    await user.click(screen.getByText('לחיצת רגליים'))

    await waitFor(() => expect(screen.getAllByText('Leg Press').length).toBeGreaterThan(0), {
      timeout: 5000,
    })
    // והדגשים מגיעים איתו
    expect(screen.getByText(/לדחוף מהעקבים/)).toBeTruthy()
  }, 30000)

  it('מציגה את השם באנגלית כשורה שנייה — הוא מה שכתוב על המכונה', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openLibrary(user)
    await waitFor(() => expect(screen.getByText('לחיצת רגליים')).toBeTruthy(), { timeout: 5000 })

    expect(screen.getByText('Leg Press')).toBeTruthy()
    expect(screen.getByText('Lat Pulldown')).toBeTruthy()
  }, 30000)

  it('מפרידה בין שני תרגילים בעלי אותו שם — בשם עצמו, כשאין משקל', async () => {
    const user = userEvent.setup()
    render(<App />)

    await openLibrary(user)
    await waitFor(() => expect(screen.getByText('לחיצת רגליים')).toBeTruthy(), { timeout: 5000 })

    /*
      עד היום המשקל היה מה שהבדיל בין שתי החתירות ("60 ק״ג" מול "50 ק״ג").
      בהתקנה חדשה אין משקלים, ולכן `distinguisher` לא יכול היה להחזיר כלום
      ושתי שורות זהות לחלוטין היו יושבות זו מעל זו — כולל בגיליון ההחלפה
      באמצע אימון. `freshSeedExercises` נותנת לשני מכל זוג שם משלו.

      נבדק על הזוג שיש לו גם טווח חזרות שונה, כי דווקא שם פתרון מבוסס-טווח
      היה מצביע על השורה ההפוכה: הקטלוג אומר 8–12 לכבדה, אבל F2 מריצה אותה
      ב-10–12 — בדיוק הטווח של הקלה.
    */
    expect(screen.getByText('חתירה במכונה')).toBeTruthy()
    expect(screen.getByText('חתירה במכונה (וריאציה שנייה)')).toBeTruthy()
    expect(screen.getByText('לחיצת חזה במכונה (מכונה שנייה)')).toBeTruthy()
  }, 30000)
})

/**
 * המתג בין "שלי" ל"הכל".
 *
 * שני המצבים קוראים מאותה `getCatalogEntries()`, וההבדל הוא מה מסוננן ואיזה
 * פקד יושב בקצה השורה. הבדיקות כאן נוגעות בדיוק במה שקל לשבור: שתרגיל מאגר
 * לא ידלוף ל"שלי", ושהוצאה לא מעלימה תרגיל שאין לו תאום במאגר.
 */
describe('המתג בין שלי לכל', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureReady()
  })

  it('מצב "שלי" מציג רק את הקטלוג, בלי תרגילי מאגר', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openLibrary(user)
    await waitFor(() => expect(screen.getByText('לחיצת רגליים')).toBeTruthy(), { timeout: 5000 })

    // "מכרעים" קיים במאגר בלבד ואינו בקטלוג הזרוע
    expect(screen.queryByText('מכרעים')).toBeNull()
    // ואין פקדי הוספה/הסרה — "שלי" הוא רשימת עיון נקייה
    expect(screen.queryByRole('button', { name: /^הוסף את/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^הוצא את/ })).toBeNull()
  }, 30000)

  it('מצב "הכל" חושף תרגילי מאגר עם כפתור הוספה, ותרגילים שלי עם כפתור הוצאה', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openLibrary(user)
    await switchToAll(user)

    await waitFor(() => expect(screen.getByText('מכרעים')).toBeTruthy(), { timeout: 5000 })
    expect(screen.getByRole('button', { name: 'הוסף את מכרעים לתרגילים שלי' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'הוצא את לחיצת רגליים מהתרגילים שלי' })
    ).toBeTruthy()
  }, 30000)

  it('הוספת תרגיל מהמאגר מכניסה אותו ל"שלי" בלי לצאת מהמסך', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openLibrary(user)
    await switchToAll(user)

    await waitFor(() => expect(screen.getByText('מכרעים')).toBeTruthy(), { timeout: 5000 })
    await user.click(screen.getByRole('button', { name: 'הוסף את מכרעים לתרגילים שלי' }))

    // הכפתור מתחלף במקום — לא ניווט, לא מסך ביניים
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'הוצא את מכרעים מהתרגילים שלי' })).toBeTruthy(),
      { timeout: 5000 }
    )

    const exercises = await db.exercises.where('libraryId').equals('lib-lunge').toArray()
    expect(exercises.length).toBe(1)
    expect(exercises[0].isActive).toBe(true)
  }, 30000)

  /**
   * הצלע שכל עיצוב תמים שובר: לכפיפת פטיש אין מקבילה במאגר (UNLINKED_NOTES),
   * ולכן הוצאה שלה חייבת להשאיר אותה ב"הכל" — אחרת היא נמחקת מהאפליקציה.
   */
  it('תרגיל שאין לו תאום במאגר לא הולך לאיבוד אחרי הוצאה', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openLibrary(user)
    await switchToAll(user)

    await waitFor(() => expect(screen.getByText('כפיפת פטיש')).toBeTruthy(), { timeout: 5000 })
    await user.click(screen.getByRole('button', { name: 'הוצא את כפיפת פטיש מהתרגילים שלי' }))

    // כפיפת פטיש יושבת בפול באדי ב׳ ובאימון B, ולכן נפתח גיליון ההחלטה
    await waitFor(() => expect(screen.getByText(/להוציא את כפיפת פטיש/)).toBeTruthy(), {
      timeout: 5000,
    })
    // הכבויה מסומנת ככזו — בלי זה "הוצא גם מהתוכניות" עורך בשקט תוכנית שלא מסתכלים עליה
    expect(screen.getByText('אימון B')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'השאר בתוכניות' }))

    // עדיין ב"הכל", עכשיו עם כפתור החזרה
    await waitFor(
      () =>
        expect(screen.getByRole('button', { name: 'הוסף את כפיפת פטיש לתרגילים שלי' })).toBeTruthy(),
      { timeout: 5000 }
    )
    // הרשומה נשארה, רק הדגל התהפך — ההיסטוריה תלויה בה
    const ex = await db.exercises.get('hammer-curl')
    expect(ex?.isActive).toBe(false)
    // והפריט נשאר בתוכנית ומחכה
    const routine = await db.routines.get('F2')
    expect(routine?.items.some((i) => i.exerciseId === 'hammer-curl')).toBe(true)
  }, 30000)

  /**
   * הקיפול של "הגדרות ← קטלוג התרגילים". הוא היה עותק שלישי של אותה רשימה,
   * וההבדל היחיד היה שהשורות הובילו לעורך. מה שחייב לשרוד את המחיקה: היכולת
   * ליצור תרגיל שאינו מהמאגר, ושני יעדי הניווט של המחיקה בעורך.
   */
  it('"תרגיל חדש משלי" יוצר רשומה ופותח את העורך', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openLibrary(user)
    await switchToAll(user)

    const before = await db.exercises.count()
    await user.click(
      await screen.findByRole('button', { name: /תרגיל חדש משלי/ }, { timeout: 5000 })
    )

    // העורך נפתח על הרשומה החדשה
    await waitFor(() => expect(screen.getByDisplayValue('תרגיל חדש')).toBeTruthy(), {
      timeout: 5000,
    })
    expect(await db.exercises.count()).toBe(before + 1)
  }, 30000)

  it('הכפתור ליצירה מופיע גם כשחיפוש לא מצא כלום בשום צד', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openLibrary(user)
    await switchToAll(user)

    await user.type(await screen.findByLabelText('חיפוש תרגיל'), 'זזזזז')
    await waitFor(() => expect(screen.getByText('לא נמצא תרגיל')).toBeTruthy(), { timeout: 5000 })
    expect(screen.getByRole('button', { name: 'צור תרגיל משלי' })).toBeTruthy()
  }, 30000)

  it('"הוצא גם מהתוכניות" מנקה את הפריט מכל התוכניות והבלוקים', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openLibrary(user)
    await switchToAll(user)

    await waitFor(() => expect(screen.getByText('כפיפת פטיש')).toBeTruthy(), { timeout: 5000 })
    await user.click(screen.getByRole('button', { name: 'הוצא את כפיפת פטיש מהתרגילים שלי' }))
    await waitFor(() => expect(screen.getByText(/להוציא את כפיפת פטיש/)).toBeTruthy(), {
      timeout: 5000,
    })
    await user.click(screen.getByRole('button', { name: 'הוצא גם מהתוכניות' }))

    await waitFor(async () => {
      const routine = await db.routines.get('F2')
      expect(routine?.items.some((i) => i.exerciseId === 'hammer-curl')).toBe(false)
    })
    // גם התוכנית הכבויה נוקתה — זה מה שהמשתמש אישר במפורש
    const b = await db.routines.get('B')
    expect(b?.items.some((i) => i.exerciseId === 'hammer-curl')).toBe(false)
    // הסדר נדחס מחדש ולא נשארו חורים
    const f2 = await db.routines.get('F2')
    expect(f2?.items.map((i) => i.order)).toEqual(f2?.items.map((_, i) => i))
  }, 30000)
})
