import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { invalidateHiddenVideos } from './db/hiddenVideos'
import { invalidateHiddenExercises } from './db/hiddenExercises'
import { invalidateVideoPrefs } from './db/videoPrefs'
import { useBasket } from './state/builderBasket'
import { useWorkout } from './state/activeWorkoutStore'

/**
 * הוספת תרגיל תוך כדי אימון, ומתג "שלי/הכל" בבניית האימון.
 *
 * מה שנבדק כאן ואי אפשר לבדוק ברמת ה-store: שהבורר באמת מרונדר מתוך מסך
 * האימון, שהמתג באמת מפריד בין הקטלוג למאגר, ושלחיצה על שורת מאגר עוברת את
 * כל השרשרת — `ensureTrainable` יוצר כרטיס, `addExercise` דוחף אותו לתור,
 * והגיליון נשאר פתוח להוספה הבאה.
 *
 * "מכרעים" (`lib-lunge`) נבחר בכוונה: הוא קיים במאגר בלבד ואינו בקטלוג הזרוע,
 * ולכן הוא מוכיח את שני הצדדים של המתג בשורה אחת.
 */

const SLOW = 15_000

async function resetAll(): Promise<void> {
  useWorkout.setState({
    workout: null,
    exercisesById: {},
    prCache: [],
    pendingPrEvents: [],
    hydrated: false,
  })
  useBasket.getState().clear()
  // מטמונים ברמת מודול לא מתים עם המסד — אותו לקח כמו בשאר בדיקות המסך
  invalidateHiddenVideos()
  invalidateHiddenExercises()
  invalidateVideoPrefs()
  window.location.hash = '#/'
  await db.delete()
  await db.open()
  await ensureReady()
}

describe('הוספת תרגיל תוך כדי אימון', () => {
  beforeEach(resetAll)

  it('מ"הכל" ישר לתור, בלי לצאת ממסך האימון', async () => {
    const user = userEvent.setup()
    await useWorkout.getState().start('F1', [])
    const sessionId = useWorkout.getState().workout?.sessionId
    const before = useWorkout.getState().workout?.queue.length ?? 0

    window.location.hash = '#/workout'
    render(<App />)

    // פקד שקיים רק במסך האימון — ההוכחה שהמסך התייצב ולא רק נכתב ל-hash
    await screen.findByRole('button', { name: 'תור התרגילים' }, { timeout: SLOW })
    await user.click(screen.getByRole('button', { name: 'הוסף תרגיל לאימון' }))

    // הגיליון נפתח על "שלי", ותרגיל מאגר לא דולף לשם
    await screen.findByRole('button', { name: 'הכל' }, { timeout: SLOW })
    expect(screen.queryByText('מכרעים')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'הכל' }))
    await waitFor(() => expect(screen.getByText('מכרעים')).toBeTruthy(), { timeout: SLOW })

    /*
      שורת הצ׳יפים עובדת גם כאן, ובאותן שתי רמות: הרמה הראשונה היא קבוצות
      שריר, ולחיצה על אחת מהן מצמצמת את הגיליון אליה בלבד. זה מה שהופך
      "עוד משהו לרגליים" באמצע אימון לשתי לחיצות במקום לגלילה.
    */
    await user.click(screen.getByRole('button', { name: /^רגליים \d+$/ }))
    await waitFor(() => expect(screen.queryByText('שכיבות סמיכה')).toBeNull())
    expect(screen.getByText('מכרעים')).toBeTruthy()

    /*
      הלחיצה היא על גוף השורה ולא על הריבוע. השם מופיע בשניהם — הריבוע פותח
      את כרטיס השרירים — ולכן `closest('button')` מהטקסט הוא מה שמבדיל.
    */
    const row = screen.getByText('מכרעים').closest('button')
    expect(row).not.toBeNull()
    await user.click(row as HTMLElement)

    await waitFor(() => expect(useWorkout.getState().workout?.queue.length).toBe(before + 1), {
      timeout: SLOW,
    })

    // שורת המאגר קיבלה כרטיס אמיתי, והתרגיל נשאר ב"שלי" גם אחרי האימון
    const created = await db.exercises.where('libraryId').equals('lib-lunge').toArray()
    expect(created.length).toBe(1)
    expect(created[0].isActive).toBe(true)

    const last = useWorkout.getState().workout?.queue.at(-1)
    expect(last?.exerciseId).toBe(created[0].id)
    // לא 'routine': התרגיל הזה הגיע מבחירה של הרגע ולא מהתוכנית
    expect(last?.source).toBe('builder')
    // אותו אימון בדיוק — שום סט לא אבד ושום אימון חדש לא נפתח
    expect(useWorkout.getState().workout?.sessionId).toBe(sessionId)

    // והגיליון נשאר פתוח: חמש הוספות ברצף הן התרחיש, לא החריג
    expect(screen.getByRole('button', { name: 'הכל' })).toBeTruthy()
  }, 40000)

  it('מסך תרגילי השריר נפתח על "שלי", ו"הכל" חושף את המאגר', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/builder/legs'
    render(<App />)

    await screen.findByText('לחיצת רגליים', {}, { timeout: SLOW })
    // ברירת המחדל היא הקטלוג בלבד — זה מה שהשתנה במסך הזה
    expect(screen.queryByText('מכרעים')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'הכל' }))
    await waitFor(() => expect(screen.getByText('מכרעים')).toBeTruthy(), { timeout: SLOW })
    // והקטלוג לא נעלם — "הכל" הוא הרחבה ולא החלפה
    expect(screen.getByText('לחיצת רגליים')).toBeTruthy()

    /*
      שורת הצ׳יפים כאן היא הרמה השנייה בלבד: הקבוצה נבחרה בניווט לתוך המסך,
      ולכן אין "כל השרירים" — הוא היה מבטיח מעבר לקבוצה אחרת שהמסך לא עושה.
    */
    expect(screen.queryByRole('button', { name: 'כל השרירים' })).toBeNull()
    await user.click(screen.getByRole('button', { name: /^ארבע-ראשי \d+$/ }))
    await waitFor(() => expect(screen.queryByText('כפיפת ברכיים בישיבה')).toBeNull())
    expect(screen.getByText('לחיצת רגליים')).toBeTruthy()

    // הצ׳יפ של הקבוצה מחזיר את כל הרגליים, בלי לצאת מהמסך
    await user.click(screen.getByRole('button', { name: /^רגליים \d+$/ }))
    await waitFor(() => expect(screen.getByText('כפיפת ברכיים בישיבה')).toBeTruthy())
  }, 40000)

  it('אימון ריק מהבונה, ואז בונים אותו מתוך מסך האימון', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/builder'
    render(<App />)

    await user.click(
      await screen.findByRole('button', { name: /אימון ריק/ }, { timeout: SLOW })
    )

    await waitFor(() => expect(useWorkout.getState().workout).not.toBeNull(), { timeout: SLOW })
    const workout = useWorkout.getState().workout
    expect(workout?.queue).toHaveLength(0)
    // אימון חופשי: הוא לא ביצוע של אף תוכנית ולא מאפס את שעון ההזנחה שלהן
    expect(workout?.routineId).toBeNull()
    expect(workout?.currentKey).toBeNull()

    // מסך האימון נפתח על המצב הריק, והוא עצמו מציע את הבורר
    await screen.findByText('אין תרגילים באימון הזה', {}, { timeout: SLOW })
    await user.click(screen.getByRole('button', { name: 'הוסף תרגיל' }))
    await screen.findByRole('button', { name: 'הכל' }, { timeout: SLOW })

    const row = (await screen.findByText('לחיצת רגליים', {}, { timeout: SLOW })).closest('button')
    await user.click(row as HTMLElement)

    await waitFor(() => expect(useWorkout.getState().workout?.queue).toHaveLength(1), {
      timeout: SLOW,
    })
    /*
      התרגיל הראשון באימון ריק חייב להיפתח כפעיל.

      ‏`addExercise` מוסיף כ-pending ומקדם ל-active רק כש-`currentKey` הוא
      null — וזה בדיוק המצב כאן. בלי זה מסך האימון היה נשאר על "כל התרגילים
      סומנו כהושלמו" בזמן שהתרגיל שהרגע נוסף יושב בתור וממתין.
    */
    expect(useWorkout.getState().workout?.currentKey).not.toBeNull()
    expect(useWorkout.getState().workout?.queue[0].status).toBe('active')
  }, 40000)

  it('אפשר להוסיף תרגיל מתוך מסך המנוחה, בלי לוותר על הטיימר', async () => {
    const user = userEvent.setup()
    await useWorkout.getState().start('F1', [])
    const first = useWorkout.getState().workout?.queue[0].key as string
    await useWorkout.getState().startRest(first, 90)

    window.location.hash = '#/workout'
    render(<App />)

    /*
      תווית נפרדת מזו של הכפתור בכותרת. שניהם יכולים להיות על המסך יחד —
      מסך המנוחה הוא שכבה מעל מסך האימון ולא במקומו — ולכן שם נגיש זהה היה
      עמימות אמיתית ולא רק אי-נוחות בבדיקה.
    */
    await user.click(
      await screen.findByRole(
        'button',
        { name: 'הוסף תרגיל לאימון בזמן המנוחה' },
        { timeout: SLOW }
      )
    )

    // הבורר נפתח מעל מסך המנוחה, והספירה ממשיכה מתחתיו
    await screen.findByRole('button', { name: 'הכל' }, { timeout: SLOW })
    expect(useWorkout.getState().workout?.restEndsAt).not.toBeNull()
  }, 40000)
})
