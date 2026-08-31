import { render, screen, waitFor, within } from '@testing-library/react'
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
 * מסך המנוחה כמסך של תוכן, לא רק ספירה.
 *
 * מה שנבדק כאן ואי אפשר לבדוק ברמת ה-store: שהתמונה של התרגיל, מד הסטים,
 * התרגיל הבא בתור ומפת השרירים עם האחוזים באמת מגיעים למסך — ושהכפתור
 * הראשי אומר איזה סט מתחיל עכשיו ולא "דלג".
 *
 * הנתונים לא נבנים בבדיקה: מכונת הרגליים היא הפריט הראשון ב-F1, יש לה כרטיס
 * במניפסט ויש עליו אחוזים. אם אחד מהשלושה יישבר — הבדיקה נופלת, וזו בדיוק
 * השרשרת שהמסך תלוי בה.
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
  invalidateHiddenVideos()
  invalidateHiddenExercises()
  invalidateVideoPrefs()
  window.location.hash = '#/'
  await db.delete()
  await db.open()
  await ensureReady()
}

describe('מסך המנוחה', () => {
  beforeEach(resetAll)

  it('מציג את הכרטיס, מה נשאר, מה הבא ואת מפת השרירים', async () => {
    await useWorkout.getState().start('F1', [])
    const queue = useWorkout.getState().workout?.queue ?? []
    const first = queue[0].key
    const nextName = useWorkout.getState().exercisesById[queue[1].exerciseId].name

    // סט עבודה אחד ואז מנוחה — בדיוק מה שקורה בלחיצה על "סיים סט"
    await useWorkout.getState().logSet(first, 'work', 100, 10)
    await useWorkout.getState().startRest(first, 90)

    window.location.hash = '#/workout'
    render(<App />)

    /*
      הכפתור הראשי אומר איזה סט מתחיל. "דלג" ירד מהמסך: אותה פעולה בדיוק,
      אבל השם תיאר ויתור על משהו בזמן שהלחיצה היא ההתחלה של הסט הבא.
    */
    const start = await screen.findByRole('button', { name: 'התחל סט 2' }, { timeout: SLOW })
    expect(screen.queryByRole('button', { name: 'דלג על המנוחה' })).toBeNull()

    // כרטיס השרירים של התרגיל ממלא את הטבעת
    await waitFor(() =>
      expect(document.querySelector('img[src*="45_plate_loaded_leg_press"]')).toBeTruthy()
    )

    /*
      מה נשאר בתרגיל הזה, ומה מחכה אחריו בתור — ושתי הטענות נשאלות *בתוך*
      השכבה: מסך האימון חי מתחתיה עם אותם שמות בדיוק, ושאילתה גלובלית הייתה
      עוברת גם אם השכבה לא הציגה כלום.
    */
    const sheet = within(screen.getByRole('dialog'))
    expect(sheet.getByText(/סט 1 הושלם/)).toBeTruthy()
    expect(sheet.getByText(nextName)).toBeTruthy()

    /*
      מפת השרירים עם האחוזים. 50% הוא מה שמודפס על הכרטיס של מכונת הרגליים —
      תמלול, לא חישוב — והשורה הראשונה נפתחת בלחיצה לכרטיס האנטומי.
    */
    expect(sheet.getByText('50%')).toBeTruthy()
    /*
      והכרטיס של מכונת הרגליים מפרק את הארבע-ראשי לשלושה ראשים — שלושה
      אריחים שכתוב עליהם "ארבע-ראשי" נראים כמו תקלה, ולכן כפילות נשברת לשם
      שמודפס על הכרטיס.
    */
    expect(sheet.getByText('ונדוס לטרליס')).toBeTruthy()

    // הכוונון קופץ ב-30 שניות לשני הכיוונים
    const user = userEvent.setup()
    const before = useWorkout.getState().workout?.restEndsAt ?? 0
    await user.click(screen.getByRole('button', { name: 'הוסף 30 שניות' }))
    await waitFor(() =>
      expect((useWorkout.getState().workout?.restEndsAt ?? 0) - before).toBeGreaterThan(25_000)
    )
    await user.click(screen.getByRole('button', { name: 'הפחת 30 שניות' }))
    await waitFor(() =>
      expect(Math.abs((useWorkout.getState().workout?.restEndsAt ?? 0) - before)).toBeLessThan(2_000)
    )

    // והלחיצה על הכפתור הראשי מסיימת את המנוחה
    await user.click(start)
    await waitFor(() => expect(useWorkout.getState().workout?.restEndsAt).toBeNull())
  }, 40000)
})
