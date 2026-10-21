import { render, screen, waitFor } from '@testing-library/react'
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
 * "חזור על האימון הקודם" — ממסך הבית עד התור שנפתח.
 *
 * מה שנבדק כאן הוא בדיוק מה שמפריד את השורה הזו מ"התחל את התוכנית": התור
 * נבנה ממה ש**בוצע** ולא ממה שתוכנן, ולכן תרגיל שדולג לא חוזר.
 */

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
  markFirstRunSeen()
  window.location.hash = '#/'
}

/**
 * מתאמן ומסיים — שני תרגילים מתוך התור, והשאר נסגרים בלי סטים.
 *
 * מחזיר את שני המזהים שבוצעו, כדי שהטענות ישוו מול מה שבאמת קרה ולא מול
 * שמות שנכתבו ביד ויישברו בשינוי קטלוג.
 */
async function trainAndFinish(sets = 1): Promise<string[]> {
  await useWorkout.getState().hydrate()
  expect(await useWorkout.getState().start('F1', [])).toBe('started')

  const queue = useWorkout.getState().workout?.queue ?? []
  expect(queue.length).toBeGreaterThan(2)
  const done = queue.slice(0, 2)
  for (const item of done) {
    for (let i = 0; i < sets; i += 1) {
      await useWorkout.getState().logSet(item.key, 'work', 50, 10)
    }
  }
  expect(await useWorkout.getState().finish()).toBeTruthy()

  // האפליקציה נפתחת מחדש: הזיכרון ריק והמסד הוא מה שנשאר
  useWorkout.setState({ workout: null, hydrated: false })
  return done.map((q) => q.exerciseId)
}

describe('חזרה על האימון הקודם', () => {
  beforeEach(resetAll)

  it('פותחת את מה שבוצע בלבד, בסדר הביצוע, ותחת אותה תוכנית', async () => {
    const user = userEvent.setup()
    const performed = await trainAndFinish()
    render(<App />)

    const repeat = await screen.findByRole(
      'button',
      { name: /^חזור על האימון הקודם/ },
      { timeout: 5000 }
    )
    await user.click(repeat)

    await waitFor(() => {
      expect(useWorkout.getState().workout).not.toBeNull()
    })

    const workout = useWorkout.getState().workout
    // רק השניים שבוצעו, ולא שמונת התרגילים של התוכנית
    expect(workout?.queue.map((q) => q.exerciseId)).toEqual(performed)
    // ונשאר ביצוע של אותה תוכנית — אחרת מסך הבית היה ממשיך להציע אותה
    expect(workout?.routineId).toBe('F1')
    expect(workout?.planned).toBe(true)
    // התרגיל הראשון פתוח, כמו בכל אימון שנפתח מתור שנבחר מראש
    expect(workout?.currentKey).toBe(workout?.queue[0]?.key)
  })

  it('אימון שנסגר בלי אף סט לא מציע חזרה', async () => {
    await useWorkout.getState().hydrate()
    expect(await useWorkout.getState().start('F1', [])).toBe('started')
    expect(await useWorkout.getState().finish()).toBeTruthy()
    useWorkout.setState({ workout: null, hydrated: false })

    render(<App />)

    /*
      ממתינים לשורה שתמיד קיימת במסך הבית ורק אז מצהירים על היעדר — בלי זה
      הטענה עוברת על מסך שעוד לא פתר את השאילתות, וכל שורה "חסרה" בו.
    */
    await screen.findByRole('button', { name: /^אימון חופשי/ }, { timeout: 5000 })
    expect(screen.queryByRole('button', { name: /^חזור על האימון הקודם/ })).toBeNull()
  })

  it('תרגיל שהוסר מהתרגילים שלי אחרי האימון לא חוזר', async () => {
    const user = userEvent.setup()
    const performed = await trainAndFinish()
    await db.exercises.update(performed[0], { isActive: false })

    render(<App />)

    const repeat = await screen.findByRole(
      'button',
      { name: /^חזור על האימון הקודם/ },
      { timeout: 5000 }
    )
    await user.click(repeat)

    await waitFor(() => {
      expect(useWorkout.getState().workout).not.toBeNull()
    })
    expect(useWorkout.getState().workout?.queue.map((q) => q.exerciseId)).toEqual([performed[1]])
  })
})
