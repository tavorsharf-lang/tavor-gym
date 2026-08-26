import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { invalidateHiddenVideos } from './db/hiddenVideos'
import { invalidateHiddenExercises } from './db/hiddenExercises'
import { invalidateVideoPrefs } from './db/videoPrefs'
import { MUSCLE_GROUPS } from './db/types'
import { useBasket } from './state/builderBasket'
import { useWorkout } from './state/activeWorkoutStore'

/**
 * בניית אימון — המסלול המלא דרך המסכים, בתוך jsdom.
 *
 * זו הבדיקה שתופסת את מה ש-`builder.flow.test.ts` לא יכול: הוא בודק את
 * ה-store ואת המסד ועוקף את React לגמרי, ולכן מסך שלא מתרנדר בכלל — או
 * כפתור שלא מחובר — היה עובר אצלו בהצלחה מלאה.
 *
 * שלוש בדיקות ולא שמונה, וזה שיקול של עלות ולא של כיסוי: כל בדיקה כאן
 * מרנדרת את האפליקציה כולה ומאתחלת את המסד, ושמונה אתחולים כאלה האטו את
 * *כל* חבילת הבדיקות מספיק כדי שפסקי הזמן של קבצים אחרים ייגמרו. כל טענה
 * שאפשר לבדוק ברמת ה-store נבדקת שם; כאן נשאר רק מה שדורש מסך אמיתי.
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
  // clear() כותב גם את localStorage — הוא הרשת של הסל, לא רק המצב בזיכרון
  useBasket.getState().clear()
  /*
    מטמונים שחיים ברמת מודול ולא מתים עם המסד.

    ‏`db.delete()` מנקה את הטבלאות ולא את מה שכבר נקרא מהן לזיכרון. מסך
    תרגילי השריר מרנדר `VideoThumb`, שקורא את שני המטמונים האלה — ולכן
    בדיקה שתכתוב סרטון מוסתר או סדר מותאם הייתה מדליפה אותם לבדיקה הבאה.
    היום זה שקוף כי הם ריקים; זו בדיוק אותה תלות-סדר סמויה של ה-hash, רק
    דרך זיכרון במקום דרך כתובת.
  */
  invalidateHiddenVideos()
  invalidateHiddenExercises()
  invalidateVideoPrefs()
  /*
    כל בדיקה מתחילה במפורש בבית.

    ‏`setup.ts` מאפס את ה-hash ב-afterEach, אבל בדיקה שנכשלת באמצע משאירה את
    האפליקציה על המסך שאליו הגיעה — וכאן המסלול מסתיים ב-‎/workout. בלי
    הקביעה המפורשת הבדיקה הבאה נפתחה על מסך האימון וחיפשה בו כפתור של הבית,
    כלומר כשל אחד הפיל את זה שאחריו והסתיר את הסיבה האמיתית.
  */
  window.location.hash = '#/'
  await db.delete()
  await db.open()
  await ensureReady()
}

describe('מסכי בניית האימון', () => {
  beforeEach(resetAll)

  it('מהבית עד אימון שרץ: שרירים, תרגילים, סל, והתחלה', async () => {
    const user = userEvent.setup()
    render(<App />)

    // ─── מסך הבית ───
    const entry = await screen.findByRole('button', { name: /בניית אימון/ }, { timeout: SLOW })
    // הכרטיס נושא את המידע עוד לפני הלחיצה — זו הסיבה להיכנס אליו
    expect(entry.textContent).toMatch(/שרירים לא כוסו|כל הגוף כוסה/)
    await user.click(entry)

    /*
      ─── רשימת השרירים ───

      ההמתנה היא לתוכן ולא לכותרת. `ScreenHeader` מרונדר מיד, בעוד השורות
      עצמן ממתינות לשאילתות — ולכן המתנה לכותרת מצליחה בזמן שהמסך עדיין שלד,
      והטענות שאחריה נבדקות על מסך ריק. זה עבר בהרצה בודדת ונפל בהרצה מלאה,
      שבה השאילתות איטיות יותר.
    */
    await screen.findByText(MUSCLE_GROUPS.chest.label, {}, { timeout: SLOW })
    // כל הקבוצות מופיעות, גם אלה שלא אומנו — קבוצה שנעלמת היא זו ששוכחים
    for (const group of Object.values(MUSCLE_GROUPS)) {
      expect(screen.getAllByText(group.label).length).toBeGreaterThan(0)
    }
    // נגזר מהמקור ולא מספר קשיח: איחוד או פיצול קבוצה לא אמור להפיל טסט תצוגה
    expect(screen.getAllByText('לא נגעת').length).toBe(Object.keys(MUSCLE_GROUPS).length)

    // ─── תרגילי השריר ───
    await user.click(await screen.findByRole('button', { name: /רגליים/ }, { timeout: SLOW }))
    await screen.findByText('לחיצת רגליים', {}, { timeout: SLOW })
    expect(screen.getByText('הכי מזמן שלא עשית — למעלה')).toBeTruthy()
    expect(screen.getAllByText('עוד לא בוצע').length).toBeGreaterThan(0)

    // ─── בחירה ───
    await user.click(await screen.findByRole('button', { name: /לחיצת רגליים/ }, { timeout: SLOW }))
    await waitFor(() => expect(useBasket.getState().items).toHaveLength(1))
    expect(useBasket.getState().items[0].muscleGroup).toBe('legs')
    // הפס הצף מופיע ברגע שיש משהו בסל
    expect(await screen.findByRole('button', { name: /פתח את האימון שבניתי/ })).toBeTruthy()

    // ─── הסל שורד מעבר בין מסכים ───
    await user.click(screen.getByRole('button', { name: 'חזרה' }))
    /*
      ממתינים שמסך השרירים באמת חזר לפני ששואלים על הפס.

      במהלך המעבר שני המסכים מרונדרים לרגע, ולכל אחד מהם יש `BasketBar` משלו.
      שאילתה באמצע התפר מחזירה את הפס של המסך *היוצא*, ולחיצה עליו פותחת
      גיליון שנעלם איתו — בדיוק הכשל שנראה כאן.
    */
    await screen.findByText(MUSCLE_GROUPS.chest.label, {}, { timeout: SLOW })
    const basket = await screen.findByRole(
      'button',
      { name: /פתח את האימון שבניתי/ },
      { timeout: SLOW }
    )
    expect(useBasket.getState().items).toHaveLength(1)

    // ─── התחלה ───
    await user.click(basket)
    await user.click(
      await screen.findByRole('button', { name: /התחל את האימון עכשיו/ }, { timeout: SLOW })
    )

    await waitFor(() => expect(useWorkout.getState().workout).not.toBeNull(), { timeout: SLOW })
    const workout = useWorkout.getState().workout
    // אימון חופשי: הוא לא ביצוע של אף תוכנית ולא מאפס את שעון ההזנחה שלהן
    expect(workout?.routineId).toBeNull()
    expect(workout?.queue.map((q) => q.exerciseId)).toEqual(['leg-press'])
    expect(workout?.queue[0].status).toBe('active')
    expect(workout?.queue[0].source).toBe('builder')
    /*
      והסל התרוקן — הוא רשימת קניות, לא היסטוריה.

      ‏`waitFor` ולא בדיקה מיידית: `startWithItems` נפתר לפני שהניקוי רץ,
      ולכן יש חלון לגיטימי שבו האימון כבר קיים והסל עדיין מלא. בדיקה מיידית
      הצליחה או נכשלה לפי מהירות המכונה.
    */
    await waitFor(() => expect(useBasket.getState().items).toHaveLength(0), { timeout: SLOW })

    // מסך האימון באמת נפתח על התרגיל הזה
    expect(await screen.findByText('לחיצת רגליים', {}, { timeout: SLOW })).toBeTruthy()
  }, 40000)

  it('מוסיפה לאימון שכבר רץ במקום לדרוס אותו', async () => {
    const user = userEvent.setup()
    await useWorkout.getState().start('F1', [])
    const sessionId = useWorkout.getState().workout?.sessionId
    const before = useWorkout.getState().workout?.queue.length ?? 0

    render(<App />)
    await user.click(await screen.findByRole('button', { name: /בניית אימון/ }, { timeout: SLOW }))
    await screen.findByText(MUSCLE_GROUPS.chest.label, {}, { timeout: SLOW })
    await user.click(await screen.findByRole('button', { name: /יד קדמית/ }, { timeout: SLOW }))
    await screen.findByText('כפיפת פטיש', {}, { timeout: SLOW })
    // שם ייחודי בכוונה — לקטלוג יש שלוש כפיפות מרפקים שונות
    await user.click(await screen.findByRole('button', { name: /כפיפת פטיש/ }, { timeout: SLOW }))

    await user.click(
      await screen.findByRole('button', { name: /פתח את האימון שבניתי/ }, { timeout: SLOW })
    )
    await user.click(
      await screen.findByRole('button', { name: /הוסף לאימון שרץ/ }, { timeout: SLOW })
    )

    await waitFor(() => expect(useWorkout.getState().workout?.queue.length).toBe(before + 1), {
      timeout: SLOW,
    })
    // אותו אימון בדיוק — לא נפתח חדש, ושום סט לא אבד
    expect(useWorkout.getState().workout?.sessionId).toBe(sessionId)
    expect(useWorkout.getState().workout?.queue.at(-1)?.source).toBe('builder')
  }, 40000)

  it('"בנה לי אימון" ממלא סל שלם מהשרירים המוזנחים', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /בניית אימון/ }, { timeout: SLOW }))
    await screen.findByText(MUSCLE_GROUPS.chest.label, {}, { timeout: SLOW })
    await user.click(await screen.findByRole('button', { name: /בנה לי אימון/ }, { timeout: SLOW }))

    await waitFor(() => expect(useBasket.getState().items.length).toBeGreaterThan(1), {
      timeout: SLOW,
    })
    // לרוחב ולא לעומק: תרגיל לכל שריר לפני שחוזרים לשריר שכבר נבחר
    const groups = useBasket.getState().items.map((i) => i.muscleGroup)
    expect(new Set(groups).size).toBe(groups.length)
  }, 40000)
})
