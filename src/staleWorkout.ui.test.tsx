import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { markFirstRunSeen } from './db/firstRun'
import { invalidateHiddenVideos } from './db/hiddenVideos'
import { invalidateHiddenExercises } from './db/hiddenExercises'
import { invalidateVideoPrefs } from './db/videoPrefs'
import { useWorkout } from './state/activeWorkoutStore'

/**
 * אימון שנשכח פתוח — מהפתיחה הבאה של האפליקציה ועד השורה בהיסטוריה.
 *
 * זו הבדיקה של הבאג שהיה בנתונים האמיתיים: הסט האחרון ב-16:34, הסגירה
 * למחרת, ואימון של 24 שעות בהיסטוריה. היא רצה על `<App />` שלם כי כל העניין
 * הוא מה קורה ב**פתיחה** — `hydrate` קורא את האימון מהדיסק, והגיליון נשען
 * על החותמות שהוא מחזיר.
 */

const HOUR = 3_600_000

async function resetAll(): Promise<void> {
  useWorkout.setState({
    workout: null,
    exercisesById: {},
    prCache: [],
    pendingPrEvents: [],
    hydrated: false,
  })
  await db.delete()
  await db.open()
  await ensureReady()
  invalidateHiddenVideos()
  invalidateHiddenExercises()
  invalidateVideoPrefs()
  // ‏`ensureReady` על מסד טרי מסמן 'new' ב-localStorage, ומסך הפתיחה משתלט
  // על Shell — כלומר הגיליון שנבדק כאן לא מרונדר בכלל
  markFirstRunSeen()
  window.location.hash = '#/'
}

/** פותח אימון, רושם בו סטים, ומריץ אחורה את השעון כאילו היה אתמול */
async function openWorkoutAndRewind(opts: {
  sets: number
  startedAt: number
  lastSetAt: number
}): Promise<void> {
  await useWorkout.getState().hydrate()
  expect(await useWorkout.getState().start('F1', [])).toBe('started')

  const key = useWorkout.getState().workout?.queue[0]?.key
  expect(key).toBeTruthy()
  for (let i = 0; i < opts.sets; i += 1) {
    await useWorkout.getState().logSet(key as string, 'work', 120, 7)
  }

  /*
    הזזת החותמות בדיסק ולא `vi.setSystemTime`.

    הסטים נכתבים ל-`setLogs` ברגע הלחיצה, והאימון נשמר ב-`activeWorkout` —
    שתי טבלאות, ושתיהן נקראות מחדש ב-`hydrate`. שינוי שלהן הוא בדיוק המצב
    שבו האפליקציה נפתחת למחרת, בלי לזייף את השעון מתחת לכל שאר הקוד.
  */
  await db.setLogs.toCollection().modify({ completedAt: opts.lastSetAt })
  await db.activeWorkout.update('current', { startedAt: opts.startedAt })

  // האפליקציה נסגרה: הזיכרון ריק, והדיסק הוא מה שנשאר
  useWorkout.setState({ workout: null, hydrated: false })
}

describe('אימון שנשכח פתוח', () => {
  beforeEach(resetAll)

  it('נסגר על הסט האחרון, ולא על רגע הלחיצה', async () => {
    const user = userEvent.setup()
    const startedAt = Date.now() - 25 * HOUR
    const lastSetAt = startedAt + 70 * 60_000

    await openWorkoutAndRewind({ sets: 2, startedAt, lastSetAt })
    render(<App />)

    /*
      דרך הגיליון במפורש.

      כרטיס האימון הפתוח במסך הבית נושא את אותה הצעה בדיוק, ולכן `^סיים על`
      מוצא שני כפתורים ו-`findByRole` נופל על ריבוי התאמות. זה לא רעש —
      שניהם אמורים להיות שם, והבדיקה הזו היא של הגיליון.
    */
    const sheet = await screen.findByRole('dialog', {}, { timeout: 5000 })
    await user.click(within(sheet).getByRole('button', { name: /^סיים על/ }))

    await waitFor(async () => {
      expect(await db.sessions.count()).toBe(1)
    })

    const session = (await db.sessions.toArray())[0]
    // שבעים דקות, ולא עשרים וחמש שעות
    expect(session.endedAt).toBe(lastSetAt)
    expect(session.durationSeconds).toBe(70 * 60)
    expect(session.totalWorkSets).toBe(2)

    // והשורה הפתוחה נעלמה — אחרת "התחל אימון" הבא היה מסרב כ-busy
    expect(await db.activeWorkout.get('current')).toBeUndefined()
  })

  it('אימון שנפתח ולא נרשם בו כלום מוצע לביטול ולא לסגירה', async () => {
    const user = userEvent.setup()
    const startedAt = Date.now() - 25 * HOUR

    await openWorkoutAndRewind({ sets: 0, startedAt, lastSetAt: startedAt })
    render(<App />)

    const sheet = await screen.findByRole('dialog', {}, { timeout: 5000 })
    // אין מה לסגור עליו — ולכן גם אין את ההצעה השנייה, לא כאן ולא על הכרטיס
    expect(screen.queryByRole('button', { name: /^סיים על/ })).toBeNull()
    await user.click(within(sheet).getByRole('button', { name: 'בטל את האימון' }))

    await waitFor(async () => {
      expect(await db.activeWorkout.get('current')).toBeUndefined()
    })
    // ביטול ולא סגירה: אימון ריק לא נכנס להיסטוריה
    expect(await db.sessions.count()).toBe(0)
  })

  it('אימון שרץ עכשיו לא נשאל כלום', async () => {
    const now = Date.now()
    await openWorkoutAndRewind({ sets: 1, startedAt: now - 20 * 60_000, lastSetAt: now - 60_000 })
    render(<App />)

    /*
      ממתינים לכרטיס האימון הפתוח ורק אז מצהירים על היעדר.

      הכותרת שלו היא גם ההבחנה עצמה: "יש אימון פתוח" לאימון חי מול "אימון
      שנשאר פתוח" לנשכח. המתנה אליה מוכיחה גם ש-`hydrate` כבר רץ — בלעדיה
      הטענה הייתה עוברת על מסך שעוד לא יודע שיש אימון בכלל.
    */
    await screen.findByText('יש אימון פתוח', {}, { timeout: 5000 })
    expect(screen.queryByText('אימון שנשאר פתוח')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
