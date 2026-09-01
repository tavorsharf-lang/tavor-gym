import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady, saveSettings } from './db/db'
import { invalidateHiddenVideos } from './db/hiddenVideos'
import { invalidateHiddenExercises } from './db/hiddenExercises'
import { invalidateVideoPrefs } from './db/videoPrefs'
import { useWorkout } from './state/activeWorkoutStore'

/**
 * הבמה — אזור אחד בכרטיס, גובה קבוע, ארבעה מצבים.
 *
 * מה שנבדק כאן הוא **מי נכנס לבמה ומתי**, וזה בדיוק מה שאי אפשר לבדוק ברמת
 * ה-store: הדירוג אינו פעולה שמישהו קורא לה, אלא מצב שנולד מהסט שהשלים את
 * היעד — ורק כשהמתג דלוק.
 *
 *   • סט שאינו האחרון ⇒ מנוחה, לא דירוג.
 *   • הסט שמשלים את היעד ⇒ דירוג, ואחריו RIR, ואחריו התרגיל הבא נפתח.
 *   • אותו סט כשמתג הקושי כבוי ⇒ מעבר ישיר לתרגיל הבא, בלי שאלה.
 *   • עורך הסטים מחליף את שורת השבבים באותם 38 פיקסלים.
 *
 * והאחרון נעול כאן מסיבה אחרת: ספירת הפלטות ירדה מהכרטיס לגיליון עריכת הסט,
 * וזה המסלול היחיד שנשאר אליה.
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
  invalidateHiddenVideos()
  invalidateHiddenExercises()
  invalidateVideoPrefs()
  window.location.hash = '#/'
  await db.delete()
  await db.open()
  await ensureReady()
}

/** מסך אימון פתוח על תוכנית הרגליים, עם משקל בשדה כדי שהכפתור יהיה פעיל */
async function openWorkout(targetSets: number): Promise<{ key: string }> {
  await useWorkout.getState().start('C', [])
  const key = useWorkout.getState().workout!.currentKey!
  await useWorkout.getState().setTargetSets(key, targetSets)

  window.location.hash = '#/workout'
  render(<App />)

  const weight = await screen.findByLabelText('משקל', {}, { timeout: SLOW })
  const user = userEvent.setup()
  await user.clear(weight)
  await user.type(weight, '100')
  return { key }
}

describe('הבמה שבכרטיס', () => {
  beforeEach(resetAll)

  it('סט שאינו האחרון מוביל למנוחה ולא לשאלון', async () => {
    const user = userEvent.setup()
    await openWorkout(3)

    await user.click(await screen.findByRole('button', { name: 'סיים סט' }))

    await screen.findByRole('button', { name: /פתח את מסך המנוחה המלא/ })
    expect(screen.queryByText('איך היה?')).toBeNull()
  }, 40000)

  it('הסט שמשלים את היעד פותח דירוג, ואחריו RIR, ואחריו התרגיל הבא', async () => {
    const user = userEvent.setup()
    const { key } = await openWorkout(1)
    const nextKey = useWorkout.getState().workout!.queue[1].key

    // "סיים סט אחרון" — התווית עצמה היא ההצהרה שזה הסט שסוגר את היעד
    await user.click(await screen.findByRole('button', { name: 'סיים סט אחרון' }))

    /*
      הדירוג נכנס לבמה, ולא כגיליון תחתון: הכרטיס שהוא מסכם חייב להישאר
      גלוי מאחוריו — זה בדיוק הרגע שבו מסתכלים על מה שנרשם.
    */
    await screen.findByText('איך היה?')
    expect(screen.queryByRole('dialog')).toBeNull()
    // ומנוחה לא התחילה: אחרי הסט האחרון קודם עונים, ורק אז נחים
    expect(useWorkout.getState().workout?.restEndsAt).toBeNull()

    await user.click(screen.getByRole('button', { name: 'קשה' }))

    // שלב שני — כמה חזרות נשארו. אותה מסגרת, אותו גובה
    await screen.findByText('רוצה לדייק? כמה חזרות נשארו לך')
    await user.click(screen.getByRole('button', { name: /נשארו 2/ }))

    await waitFor(() => {
      const w = useWorkout.getState().workout
      expect(w?.ratingsByKey[key]).toEqual({ rating: 4, rir: 2 })
      // התרגיל נסגר והבא נפתח, ומנוחה רצה לפניו
      expect(w?.queue.find((q) => q.key === key)?.status).toBe('done')
      expect(w?.currentKey).toBe(nextKey)
      expect(w?.restEndsAt).not.toBeNull()
    })
  }, 40000)

  it('מתג הקושי כבוי — הסט האחרון עובר ישר לתרגיל הבא', async () => {
    await saveSettings({ askRating: false })
    const user = userEvent.setup()
    const { key } = await openWorkout(1)
    const nextKey = useWorkout.getState().workout!.queue[1].key

    await user.click(await screen.findByRole('button', { name: 'סיים סט אחרון' }))

    await waitFor(() => {
      const w = useWorkout.getState().workout
      expect(w?.currentKey).toBe(nextKey)
      expect(w?.ratingsByKey[key]).toBeUndefined()
    })
    expect(screen.queryByText('איך היה?')).toBeNull()
  }, 40000)

  it('"כמה סטים היום" מחליף את שורת השבבים ומשנה את היעד לאימון הזה בלבד', async () => {
    const user = userEvent.setup()
    const { key } = await openWorkout(2)

    // השבבים על המסך, והעורך לא
    expect(screen.getByRole('button', { name: 'סט 1 מתוך 2' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '4 סטים' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'סט 1 מתוך 2' }))
    await user.click(await screen.findByRole('button', { name: '4 סטים' }))

    await waitFor(() =>
      expect(useWorkout.getState().workout?.queue.find((q) => q.key === key)?.targetSets).toBe(4)
    )
    // התוכנית הקבועה לא זזה — השינוי חי בתור בלבד
    expect((await db.routines.get('C'))?.items[0].targetSets).toBe(2)
  }, 40000)

  /*
    ספירת פלטות חיה בגיליון עריכת הסט, ולא על הכרטיס.

    שני הכיוונים של אותה שאלה נבדקים יחד, כי רק ביחד הם נכונים: השבב סופר
    פלטות *אל תוך* המספר, והרמז מפרק את המספר *חזרה* לפלטות. במצב total פלטה
    של 20 מוסיפה 40 — אחת לכל צד — וזו בדיוק הכפילות היחידה בקוד שאפשר לטעות
    בה, ולכן היא זו שנעולה כאן במספר.
  */
  it('ספירת פלטות בגיליון עריכת הסט מוסיפה לשני הצדדים', async () => {
    const user = userEvent.setup()
    const { key } = await openWorkout(3)

    await user.click(await screen.findByRole('button', { name: 'סיים סט' }))
    await waitFor(() =>
      expect(useWorkout.getState().workout?.setsByKey[key]?.length).toBe(1)
    )

    // "תועד" ← הסטים שתועדו ← פעולות לסט ← ערוך
    await user.click(screen.getByRole('button', { name: /תועד/ }))
    await user.click(await screen.findByRole('button', { name: 'פעולות לסט' }))
    await user.click(await screen.findByRole('button', { name: 'ערוך' }))

    const weight = await screen.findByRole('textbox', { name: 'משקל' })
    expect((weight as HTMLInputElement).value).toBe('100')

    await user.click(screen.getByRole('button', { name: 'הוסף פלטה של 20 קילו לכל צד' }))
    expect((weight as HTMLInputElement).value).toBe('140')
    // והפירוק מסכים: 70 לכל צד
    expect(screen.getByText(/3×20 \+ 10/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'שמור שינוי' }))
    await waitFor(() =>
      expect(useWorkout.getState().workout?.setsByKey[key]?.[0].weightKg).toBe(140)
    )
  }, 40000)

  /*
    "מה הלאה" הוא כל מה שהרשימה הזאת עונה עליו.

    התרגילים שנסגרו יושבים במקומם ב-`workout.queue` — הוא מה שקובע את הפריט
    הבא ואת סדר האימון שנשמר — אבל בתצוגה הם יורדים לתחתית. בלי זה, אחרי
    שלושה תרגילים באימון של שבעה, שלוש שורות של ✓ נדחפות בין הכרטיס הפעיל
    לבין מה שבאמת בא אחריו.
  */
  it('תרגיל שנסגר יורד לתחתית הרשימה, והתור עצמו לא זז', async () => {
    await useWorkout.getState().start('C', [])
    const queue = useWorkout.getState().workout!.queue
    const byId = useWorkout.getState().exercisesById
    const firstName = byId[queue[0].exerciseId].name
    const lastName = byId[queue[queue.length - 1].exerciseId].name

    await useWorkout.getState().logSet(queue[0].key, 'work', 100, 10)
    await useWorkout.getState().completeCurrent()

    window.location.hash = '#/workout'
    render(<App />)

    const closed = await screen.findByText(`${firstName} · הושלם`, {}, { timeout: SLOW })
    const upcoming = screen.getByText(lastName)

    // השורה שנסגרה מופיעה ב-DOM *אחרי* התרגיל האחרון שעוד לפנינו
    expect(
      upcoming.compareDocumentPosition(closed) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()

    // והתור עצמו שמר על סדר התוכנית — זו תצוגה, לא סידור מחדש
    expect(useWorkout.getState().workout?.queue.map((q) => q.key)).toEqual(
      queue.map((q) => q.key)
    )
  }, 40000)
})
