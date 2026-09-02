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
 * אימון בלי תוכנית, מקצה לקצה.
 *
 * מה שנעול כאן הוא בדיוק מה שמפריד בין המסלול הזה לבין הבונה: **בחירת תרגיל
 * היא התחלת אימון**, בלי סל ובלי אישור, והאימון שנוצר הוא חופשי (`routineId`
 * ריק) — זה מה שגורם לו להיקרא "אימון חופשי" בהיסטוריה ובסיכום בלי שאף מסך
 * יצטרך לדעת על כך.
 *
 * ושתי ההתנהגויות שקל לשבור בלי לשים לב:
 *   • בחירה מתוך המנוחה **לא מאפסת את הטיימר**. זו כל הפואנטה של הפאנל.
 *   • הסטפר של הסטים לא יורד מתחת למה שכבר בוצע.
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
  localStorage.removeItem?.('tavor-gym:routine-offer-dismissed')
  await db.delete()
  await db.open()
  await ensureReady()
}

/** רשת השרירים ← קבוצה ← התרגיל הראשון בה */
async function pickFirstExercise(group: RegExp): Promise<void> {
  const user = userEvent.setup()
  /*
    ‏`^אימון חופשי` בלבד: השם הנגיש הוא שרשור של שני ה-span-ים בלי רווח
    ביניהם (`אימון חופשיבלי תוכנית…`), כי ל-jsdom אין פריסה שממנה להסיק אחד.
  */
  await user.click(
    await screen.findByRole('button', { name: /^אימון חופשי/ }, { timeout: SLOW })
  )
  await user.click(await screen.findByRole('button', { name: group }, { timeout: SLOW }))
  const rows = await screen.findAllByRole('button', { name: /קודם|ראשון/ }, { timeout: SLOW })
  await user.click(rows[0])
}

describe('אימון חופשי', () => {
  beforeEach(resetAll)

  it('בחירת שריר ותרגיל פותחת אימון חופשי מיד, בלי מסך אישור', async () => {
    window.location.hash = '#/'
    render(<App />)

    await pickFirstExercise(/^גב —/)

    await waitFor(
      () => {
        const w = useWorkout.getState().workout
        expect(w).not.toBeNull()
        // `routineId` ריק *הוא* אימון חופשי — אין כאן דגל חדש
        expect(w?.routineId).toBeNull()
        expect(w?.queue.length).toBe(1)
      },
      { timeout: SLOW }
    )

    // ונחתנו על הכרטיס, לא על עוד מסך בחירה
    await screen.findByRole('button', { name: /קבע משקל כדי לרשום|סיים סט/ }, { timeout: SLOW })
    // אין `+` בכותרת של אימון חופשי — ההוספה יושבת ליד רשימת מה־שנעשה
    expect(screen.queryByRole('button', { name: 'הוסף תרגיל לאימון' })).toBeNull()
    expect(screen.getByRole('button', { name: 'הוסף תרגיל' })).toBeTruthy()
  }, 40000)

  it('הסטפר לא יורד מתחת למספר הסטים שכבר בוצעו', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/'
    render(<App />)
    await pickFirstExercise(/^גב —/)

    const weight = await screen.findByLabelText('משקל', {}, { timeout: SLOW })
    await user.clear(weight)
    await user.type(weight, '40')

    const key = useWorkout.getState().workout!.currentKey!
    const target = (): number =>
      useWorkout.getState().workout!.queue.find((q) => q.key === key)!.targetSets

    // ‏+ מעלה, וזה עובד בכל ערך פתיחה שברירת המחדל תיתן
    const before = target()
    await user.click(screen.getByRole('button', { name: 'סט אחד יותר' }))
    await waitFor(() => expect(target()).toBe(before + 1))

    // סט אחד נרשם, ומכאן הרצפה היא 1 — לא פחות ממה שכבר בוצע
    await user.click(await screen.findByRole('button', { name: /^סיים סט$/ }))
    await waitFor(() => expect(useWorkout.getState().workout?.setsByKey[key]?.length).toBe(1))

    // לוחצים למטה עד שהכפתור נחסם, ובודקים איפה הוא נעצר
    for (let i = 0; i < 8; i++) {
      const minus = screen.getByRole('button', { name: 'סט אחד פחות' }) as HTMLButtonElement
      if (minus.disabled) break
      await user.click(minus)
    }
    expect(target()).toBe(1)
    expect((screen.getByRole('button', { name: 'סט אחד פחות' }) as HTMLButtonElement).disabled).toBe(
      true
    )
  }, 40000)

  it('בחירה מתוך המנוחה מחליפה תרגיל בלי לאפס את הטיימר', async () => {
    await saveSettings({ askRating: false })
    const user = userEvent.setup()
    window.location.hash = '#/'
    render(<App />)
    await pickFirstExercise(/^גב —/)

    const first = useWorkout.getState().workout!.currentKey!
    // סט אחד ליעד, כדי שהסט הראשון יהיה גם האחרון
    await useWorkout.getState().setTargetSets(first, 1)

    const weight = await screen.findByLabelText('משקל', {}, { timeout: SLOW })
    await user.clear(weight)
    await user.type(weight, '40')

    // "סיים תרגיל" ולא "סיים סט אחרון": באימון חופשי הסגירה היא ההחלטה
    await user.click(await screen.findByRole('button', { name: 'סיים תרגיל' }, { timeout: SLOW }))

    /*
      הפריט **נשאר פעיל** אחרי סיום התרגיל, ולא נסגר: בלי תור אין מה לפתוח
      אחריו, וסגירה הייתה משאירה את המסך בלי כרטיס בדיוק ברגע הבחירה.
    */
    /*
      ממתינים למנוחה ולא ל-`currentKey`: באימון חופשי המפתח *לא* משתנה בסיום
      תרגיל, ולכן המתנה עליו נפתרת מיד — עוד לפני שהלחיצה סיימה לרוץ.
    */
    await waitFor(() => expect(useWorkout.getState().workout?.restEndsAt).not.toBeNull(), {
      timeout: SLOW,
    })
    const started = useWorkout.getState().workout?.restEndsAt
    expect(useWorkout.getState().workout?.currentKey).toBe(first)

    /*
      שתי הצעות: "עוד לגב" (המשך באותו שריר) ו-"<קבוצה> · טרי" (שבירה אליו).
      נבדקות שתיהן — קיומן הוא חצי מהתכונה — ונלחצת הראשונה.
    */
    const suggestions = await screen.findAllByRole(
      'button',
      { name: /עוד לגב|טרי/ },
      { timeout: SLOW }
    )
    expect(suggestions.length).toBe(2)
    await user.click(suggestions[0])

    await waitFor(() => {
      const w = useWorkout.getState().workout
      expect(w?.queue.length).toBe(2)
      expect(w?.currentKey).not.toBe(first)
      // התרגיל שיצאנו ממנו נסגר מעצמו — `setCurrent` עושה את זה
      expect(w?.queue.find((q) => q.key === first)?.status).toBe('done')
    })
    expect(useWorkout.getState().workout?.restEndsAt).toBe(started)
  }, 40000)

  it('שורת הכיול מופיעה רק כשאין היסטוריה, ונעלמת כשיש', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/'
    render(<App />)
    await pickFirstExercise(/^גב —/)

    const key = useWorkout.getState().workout!.currentKey!
    // לפני הסט הראשון: הסבר, לא שבבים
    expect(await screen.findByText(/בסיס: משקל שאתה בטוח בו/, {}, { timeout: SLOW })).toBeTruthy()

    const weight = await screen.findByLabelText('משקל', {}, { timeout: SLOW })
    await user.clear(weight)
    await user.type(weight, '40')
    await user.click(screen.getByRole('button', { name: 'סט אחד יותר' }))
    await user.click(await screen.findByRole('button', { name: /^סיים סט$/ }))
    await waitFor(() => expect(useWorkout.getState().workout?.setsByKey[key]?.length).toBe(1))

    // אחרי הסט: שלושת שבבי הכיול, והתג "בסיס נקבע" במקום "שיא"
    await user.click(await screen.findByRole('button', { name: /אני מוכן/ }, { timeout: SLOW }))
    expect(await screen.findByRole('button', { name: /היה נכון/ })).toBeTruthy()
    expect(screen.getByText('בסיס נקבע')).toBeTruthy()
    /*
      הסט הראשון בתרגיל שאין לו היסטוריה הוא תמיד שיא — אין מול מה להשוות —
      ולכן התג הזה עליו הוא טאוטולוגיה ולא הישג.
    */
    expect(screen.queryByText(/^שיא$/)).toBeNull()
  }, 40000)
})
