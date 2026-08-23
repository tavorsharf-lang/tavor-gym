import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { openItems, skippedItems, touchedGroups, useWorkout } from './state/activeWorkoutStore'
import { invalidateHiddenVideos } from './db/hiddenVideos'
import { invalidateVideoPrefs } from './db/videoPrefs'
import { suggestWarmup } from './domain/warmup'

/**
 * זרימת אימון מקצה לקצה, בתוך jsdom.
 *
 * זו הבדיקה שתופסת את מה שבדיקות היחידה לא יכולות: שהחיבור בין המסך, ה-store
 * ומסד הנתונים באמת עובד — שסט נשמר, שהמנוחה מתחילה, שהתאוששות מקריסה
 * מחזירה את מה שהיה, ושסיום האימון כותב אימון תקין להיסטוריה.
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
  /*
    מטמוני ההגדרות שחיים ברמת מודול לא מתים עם המסד.

    עליית האפליקציה מחממת את שניהם, ולכן בדיקה שמרנדרת `<App />` משאירה
    אותם מלאים — ומחיקת המסד בשורות שמעל לא נוגעת בהם. היום שניהם ריקים
    ולכן זה שקוף, אבל הרגע שבו בדיקה תכתוב סרטון מוסתר או סדר מותאם, זו
    הייתה הופכת לתלות סדר סמויה שקשה לאתר.
  */
  invalidateHiddenVideos()
  invalidateVideoPrefs()
}

describe('זרימת אימון', () => {
  beforeEach(resetAll)

  it('מתחילה אימון, מתעדת סט, ומסיימת עם אימון שמור בהיסטוריה', async () => {
    const user = userEvent.setup()
    render(<App />)

    // מסך הבית נטען עם ההצעה — תוכנית החזרה היא הפעילה
    await waitFor(() => expect(screen.getAllByText(/פול באדי/).length).toBeGreaterThan(0), {
      timeout: 5000,
    })

    await user.click(screen.getByRole('button', { name: /התחל אימון/ }))

    // גיליון בחירת האימון נפתח, ובו כפתור התחלה
    const start = await screen.findByRole('button', { name: /^התחל$/ }, { timeout: 5000 })
    await user.click(start)

    /*
      ממתינים לפקד שקיים *רק* במסך האימון, ולא לשם התרגיל.

      גיליון בחירת האימון מציג בעצמו את שמות התרגילים של התוכנית, ולכן
      המתנה ל"לחיצת רגליים" הסתיימה לפעמים על הגיליון שעדיין פתוח — לפני
      ש-`start()` הספיק לכתוב לחנות, והשורה הבאה נפלה על `workout === null`.
      זו הייתה בדיקה רועדת שנראתה כמו עומס מכונה. הכלל: להמתין למה שמוכיח
      שהמסך הנכון התייצב, לא למה שיכול להופיע גם לפניו.
    */
    await screen.findByRole('button', { name: 'תור התרגילים' }, { timeout: 5000 })

    // אין תרגיל חימום קבוע בראש התוכנית — החימום מוצע לפי השריר שנפתח —
    // ולכן הראשון הוא התרגיל הכבד של הרגליים.
    expect(screen.getByText('לחיצת רגליים')).toBeTruthy()

    const workout = useWorkout.getState().workout
    expect(workout).not.toBeNull()
    expect(workout?.routineId).toBe('F1')
    // פול באדי מכסה את כל הגוף, ולכן הבלוקים לא מוצעים אוטומטית
    expect(workout?.queue.length).toBe(8)
    expect(workout?.blockIds).toEqual([])
    // ברירת המחדל האחידה: שני סטים ושתי דקות מנוחה בכל תרגיל
    expect(workout?.queue[0].targetSets).toBe(2)
    expect(workout?.queue[0].restSeconds).toBe(120)

    // תיעוד סט
    const finishSet = await screen.findByRole('button', { name: /סיים סט/ })
    await user.click(finishSet)

    await waitFor(() => {
      const state = useWorkout.getState().workout
      const key = state?.currentKey
      expect(key && (state?.setsByKey[key]?.length ?? 0) > 0).toBe(true)
    })

    // הסט נכתב מיד ל-setLogs, לא רק לזיכרון
    const sessionId = useWorkout.getState().workout?.sessionId
    const logged = await db.setLogs.where('sessionId').equals(sessionId ?? '').toArray()
    expect(logged.length).toBe(1)
    expect(logged[0].exerciseId).toBe('leg-press')

    // טיימר המנוחה התחיל
    expect(useWorkout.getState().workout?.restEndsAt).not.toBeNull()

    // סיום האימון
    await useWorkout.getState().stopRest()
    const finishedId = await useWorkout.getState().finish()
    expect(finishedId).toBeTruthy()

    const session = await db.sessions.get(finishedId ?? '')
    expect(session).toBeTruthy()
    expect(session?.routineId).toBe('F1')
    expect(session?.actualOrder).toEqual(['leg-press'])
    expect(session?.totalSets).toBe(1)
    expect(session?.skippedExerciseIds.length).toBe(7)
    // האימון הפעיל נוקה
    expect(await db.activeWorkout.get('current')).toBeUndefined()
  }, 30000)

  it('שומרת את מצב האימון לדיסק ומשחזרת אותו אחרי קריסה', async () => {
    await useWorkout.getState().start('B', ['abs'])
    const before = useWorkout.getState().workout
    expect(before).not.toBeNull()

    // אימון B (7 תרגילים) + בלוק בטן (1)
    expect(before?.queue.length).toBe(8)

    const key = before?.currentKey ?? ''
    await useWorkout.getState().logSet(key, 'work', 80, 10)
    await useWorkout.getState().rate(key, 2, 1)

    // "קריסה": הזיכרון נמחק, הדיסק נשאר
    useWorkout.setState({ workout: null, hydrated: false, exercisesById: {}, prCache: [] })
    await useWorkout.getState().hydrate()

    const after = useWorkout.getState().workout
    expect(after?.sessionId).toBe(before?.sessionId)
    expect(after?.queue.length).toBe(8)
    expect(after?.setsByKey[key]?.length).toBe(1)
    expect(after?.setsByKey[key]?.[0].weightKg).toBe(80)
    expect(after?.ratingsByKey[key]).toEqual({ rating: 2, rir: 1 })
  }, 20000)

  /**
   * כמה סטים וכמה מנוחה הם שתי שאלות שהתשובה עליהן משתנה *בתוך* האימון.
   * השינוי חייב לשרוד קריסה, ואסור לו לזלוג לתוכנית הקבועה — שתי תוכניות
   * שונות שמשתמשות באותו תרגיל לא אמורות להשתנות בגלל יום אחד.
   */
  it('שינוי סטים ומנוחה תוך כדי אימון נשמר לדיסק ולא נוגע בתוכנית', async () => {
    await useWorkout.getState().start('F1', [])
    const key = useWorkout.getState().workout?.currentKey ?? ''
    const routineBefore = await db.routines.get('F1')

    await useWorkout.getState().setTargetSets(key, 4)
    await useWorkout.getState().setItemRest(key, 45)

    const item = () => useWorkout.getState().workout?.queue.find((q) => q.key === key)
    expect(item()?.targetSets).toBe(4)
    expect(item()?.restSeconds).toBe(45)

    // התוכנית הקבועה לא זזה
    expect(await db.routines.get('F1')).toEqual(routineBefore)

    // ושורד קריסה
    useWorkout.setState({ workout: null, hydrated: false, exercisesById: {}, prCache: [] })
    await useWorkout.getState().hydrate()
    expect(item()?.targetSets).toBe(4)
    expect(item()?.restSeconds).toBe(45)
  }, 20000)

  it('מספר הסטים והמנוחה חסומים לתחום שפוי', async () => {
    await useWorkout.getState().start('F1', [])
    const key = useWorkout.getState().workout?.currentKey ?? ''
    const item = () => useWorkout.getState().workout?.queue.find((q) => q.key === key)

    await useWorkout.getState().setTargetSets(key, 0)
    expect(item()?.targetSets).toBe(1)
    await useWorkout.getState().setTargetSets(key, 99)
    expect(item()?.targetSets).toBe(12)

    // אפס מנוחה הוא בחירה חוקית — סופרסט או תרגיל סיום
    await useWorkout.getState().setItemRest(key, -30)
    expect(item()?.restSeconds).toBe(0)
    await useWorkout.getState().setItemRest(key, 10_000)
    expect(item()?.restSeconds).toBe(600)
  }, 20000)

  it('"המתקן תפוס" דוחף את התרגיל לסוף התור ולא נותן לסיים בשקט', async () => {
    await useWorkout.getState().start('C', [])
    const first = useWorkout.getState().workout?.queue[0]
    expect(first?.exerciseId).toBe('leg-press')

    await useWorkout.getState().deferItem(first?.key ?? '')

    const after = useWorkout.getState().workout
    expect(after?.queue[after.queue.length - 1].exerciseId).toBe('leg-press')
    expect(after?.queue[after.queue.length - 1].status).toBe('deferred')
    // התרגיל הבא נפתח אוטומטית
    expect(after?.currentKey).toBe(after?.queue[0].key)
    expect(after?.queue[0].exerciseId).toBe('calf-raise')
  }, 20000)

  it('החלפת תרגיל לפני שנרשם סט מחליפה במקום ונרשמת בהיסטוריה', async () => {
    await useWorkout.getState().start('B', [])
    const key = useWorkout.getState().workout?.currentKey ?? ''

    await useWorkout.getState().substitute(key, 'low-row-rack', 'occupied')

    const w = useWorkout.getState().workout
    const item = w?.queue.find((q) => q.key === key)
    expect(item?.exerciseId).toBe('low-row-rack')
    expect(item?.plannedExerciseId).toBe('lat-pulldown')
    expect(w?.substitutions).toEqual([
      { plannedExerciseId: 'lat-pulldown', actualExerciseId: 'low-row-rack', reason: 'occupied' },
    ])
  }, 20000)

  it('החלפה אחרי שנרשמו סטים סוגרת את מה שבוצע ופותחת פריט חדש', async () => {
    await useWorkout.getState().start('B', [])
    const key = useWorkout.getState().workout?.currentKey ?? ''
    await useWorkout.getState().logSet(key, 'work', 78, 10)

    const lengthBefore = useWorkout.getState().workout?.queue.length ?? 0
    await useWorkout.getState().substitute(key, 'low-row-rack', 'choice')

    const w = useWorkout.getState().workout
    expect(w?.queue.length).toBe(lengthBefore + 1)
    expect(w?.queue.find((q) => q.key === key)?.status).toBe('done')
    // הסט הישן נשאר צמוד לתרגיל המקורי
    expect(w?.setsByKey[key]?.length).toBe(1)
    const fresh = w?.queue[1]
    expect(fresh?.exerciseId).toBe('low-row-rack')
    expect(w?.currentKey).toBe(fresh?.key)
  }, 20000)

  it('מזהה שיא אישי בסט העבודה הראשון ומגישה אותו לחגיגה', async () => {
    await useWorkout.getState().start('C', [])
    const key = useWorkout.getState().workout?.currentKey ?? ''
    await useWorkout.getState().logSet(key, 'work', 160, 10)

    const events = useWorkout.getState().drainPrEvents()
    expect(events.some((e) => e.kind === 'maxWeight')).toBe(true)
    // ריקון הוא חד-פעמי
    expect(useWorkout.getState().drainPrEvents()).toEqual([])

    const stored = await db.prs.get(['leg-press', 'maxWeight'])
    expect(stored?.value).toBe(160)
  }, 20000)

  it('סט חימום לא מייצר שיא ולא נספר בנפח', async () => {
    await useWorkout.getState().start('C', [])
    const key = useWorkout.getState().workout?.currentKey ?? ''
    await useWorkout.getState().logSet(key, 'warmup', 100, 10)

    expect(useWorkout.getState().drainPrEvents()).toEqual([])
    const id = await useWorkout.getState().finish()
    const session = await db.sessions.get(id ?? '')
    expect(session?.totalSets).toBe(1)
    expect(session?.totalWorkSets).toBe(0)
    expect(session?.totalVolumeKg).toBe(0)
  }, 20000)

  it('נפח perSide מוכפל פעם אחת בלבד', async () => {
    await useWorkout.getState().start('A', [])
    const w = useWorkout.getState().workout
    // לחיצת חזה במוט — perSide
    const item = w?.queue.find((q) => q.exerciseId === 'db-bench-press')
    await useWorkout.getState().logSet(item?.key ?? '', 'work', 22.5, 10)

    const id = await useWorkout.getState().finish()
    const session = await db.sessions.get(id ?? '')
    expect(session?.totalVolumeKg).toBe(450) // 22.5 × 2 צדדים × 10 חזרות
  }, 20000)
})

describe('ניווט', () => {
  beforeEach(resetAll)

  it('כל לשוניות הניווט נפתחות בלי לקרוס', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByRole('navigation')).toBeTruthy(), { timeout: 5000 })
    const nav = screen.getByRole('navigation')

    for (const label of ['היסטוריה', 'נתונים', 'הגדרות', 'בית']) {
      await user.click(within(nav).getByRole('link', { name: label }))
      await waitFor(() => {
        expect(document.body.textContent).toContain(label)
      })
    }
  }, 30000)
})

describe('שיאים מתואמים לסטים שבאמת קיימים', () => {
  beforeEach(resetAll)

  it('מחיקת סט מבטלת את השיא שהוא יצר', async () => {
    await useWorkout.getState().start('C', [])
    const key = useWorkout.getState().workout?.currentKey ?? ''

    await useWorkout.getState().logSet(key, 'work', 160, 8)
    await useWorkout.getState().logSet(key, 'work', 300, 5) // הקלדה שגויה
    expect((await db.prs.get(['leg-press', 'maxWeight']))?.value).toBe(300)

    const bad = useWorkout.getState().workout?.setsByKey[key]?.at(-1)
    await useWorkout.getState().removeSet(key, bad?.logId ?? 0)

    // השיא חוזר למה שבאמת הורם
    expect((await db.prs.get(['leg-press', 'maxWeight']))?.value).toBe(160)
    // וגם המטמון שבזיכרון מתעדכן, אחרת סט של 200 לא היה מזוהה כשיא
    const cached = useWorkout.getState().prCache.find((p) => p.kind === 'maxWeight')
    expect(cached?.value).toBe(160)

    await useWorkout.getState().logSet(key, 'work', 200, 5)
    expect(useWorkout.getState().drainPrEvents().some((e) => e.kind === 'maxWeight')).toBe(true)
  }, 20000)

  it('תיקון משקל של סט מעדכן את השיא', async () => {
    await useWorkout.getState().start('C', [])
    const key = useWorkout.getState().workout?.currentKey ?? ''
    await useWorkout.getState().logSet(key, 'work', 250, 5)
    const set = useWorkout.getState().workout?.setsByKey[key]?.[0]

    await useWorkout.getState().updateSet(key, set?.logId ?? 0, 150, 5)
    expect((await db.prs.get(['leg-press', 'maxWeight']))?.value).toBe(150)
  }, 20000)

  it('הפיכת סט לחימום מבטלת את השיא — חימום לא שובר שיאים', async () => {
    await useWorkout.getState().start('C', [])
    const key = useWorkout.getState().workout?.currentKey ?? ''
    await useWorkout.getState().logSet(key, 'work', 180, 6)
    const set = useWorkout.getState().workout?.setsByKey[key]?.[0]

    await useWorkout.getState().toggleSetType(key, set?.logId ?? 0)
    expect(await db.prs.get(['leg-press', 'maxWeight'])).toBeUndefined()
  }, 20000)

  it('ביטול אימון מוחק גם את השיאים שהוא כתב', async () => {
    // אימון אמיתי שקובע רף
    await useWorkout.getState().start('C', [])
    const k1 = useWorkout.getState().workout?.currentKey ?? ''
    await useWorkout.getState().logSet(k1, 'work', 150, 8)
    await useWorkout.getState().finish()

    // אימון שמתחיל, קובע שיא, ומבוטל
    await useWorkout.getState().start('C', [])
    const k2 = useWorkout.getState().workout?.currentKey ?? ''
    await useWorkout.getState().logSet(k2, 'work', 220, 8)
    await useWorkout.getState().discard()

    expect((await db.prs.get(['leg-press', 'maxWeight']))?.value).toBe(150)

    // ולכן שיא של 200 באימון הבא כן ייחשב
    await useWorkout.getState().start('C', [])
    const k3 = useWorkout.getState().workout?.currentKey ?? ''
    await useWorkout.getState().logSet(k3, 'work', 200, 8)
    expect(useWorkout.getState().drainPrEvents().some((e) => e.kind === 'maxWeight')).toBe(true)
  }, 20000)

  it('לחיצה כפולה על "סיים אימון" לא מכפילה את הדירוגים', async () => {
    await useWorkout.getState().start('A', [])
    const key = useWorkout.getState().workout?.currentKey ?? ''
    await useWorkout.getState().logSet(key, 'work', 0, 15)
    await useWorkout.getState().rate(key, 2, 1)

    const [a, b] = await Promise.all([
      useWorkout.getState().finish(),
      useWorkout.getState().finish(),
    ])
    expect(a).toBe(b)

    const ratings = await db.ratings.where('sessionId').equals(a ?? '').toArray()
    expect(ratings.length).toBe(1)
  }, 20000)
})

/**
 * ארבע פעולות שרצות באמצע אימון אמיתי ולא נקראו באף בדיקה. לכל אחת אותו דפוס:
 * לבצע, לאמת את התור, ואז hydrate מהדיסק — כי כתיבה חסרה ל-activeWorkout היא
 * בדיוק הבאג שכל ההתאוששות מקריסה תלויה בו.
 */
describe('פעולות התור נשמרות לדיסק', () => {
  beforeEach(resetAll)

  /** מפרק את הזיכרון ומשחזר מהדיסק, כמו קריסה */
  async function reload(): Promise<void> {
    useWorkout.setState({ workout: null, hydrated: false, exercisesById: {}, prCache: [] })
    await useWorkout.getState().hydrate()
  }

  it('reorder מזיז את הפריט ושורד קריסה', async () => {
    await useWorkout.getState().start('F1', [])
    const before = useWorkout.getState().workout!.queue.map((q) => q.exerciseId)

    await useWorkout.getState().reorder(0, 2)
    const moved = [...before]
    moved.splice(2, 0, ...moved.splice(0, 1))

    expect(useWorkout.getState().workout?.queue.map((q) => q.exerciseId)).toEqual(moved)
    await reload()
    expect(useWorkout.getState().workout?.queue.map((q) => q.exerciseId)).toEqual(moved)
  }, 20000)

  it('reorder עם אינדקס לא חוקי לא משנה כלום', async () => {
    await useWorkout.getState().start('F1', [])
    const before = useWorkout.getState().workout!.queue.map((q) => q.key)

    await useWorkout.getState().reorder(0, 99)
    await useWorkout.getState().reorder(-1, 1)
    await useWorkout.getState().reorder(1, 1)

    expect(useWorkout.getState().workout?.queue.map((q) => q.key)).toEqual(before)
  }, 20000)

  it('addExercise מוסיף לסוף התור עם ברירות המחדל של הקטלוג', async () => {
    await useWorkout.getState().start('F1', [])
    const lengthBefore = useWorkout.getState().workout!.queue.length

    await useWorkout.getState().addExercise('shrugs')

    const added = useWorkout.getState().workout!.queue.at(-1)!
    expect(useWorkout.getState().workout?.queue.length).toBe(lengthBefore + 1)
    expect(added.exerciseId).toBe('shrugs')
    expect(added.status).toBe('pending')
    expect(added.targetSets).toBe(2)

    await reload()
    expect(useWorkout.getState().workout?.queue.at(-1)?.exerciseId).toBe('shrugs')
  }, 20000)

  it('addExercise מתעלם מתרגיל שלא בקטלוג', async () => {
    await useWorkout.getState().start('F1', [])
    const lengthBefore = useWorkout.getState().workout!.queue.length
    await useWorkout.getState().addExercise('אין-כזה')
    expect(useWorkout.getState().workout?.queue.length).toBe(lengthBefore)
  }, 20000)

  it('completeCurrent עם סטים סוגר כ-done ופותח את הבא', async () => {
    await useWorkout.getState().start('F1', [])
    const first = useWorkout.getState().workout!.currentKey!
    const second = useWorkout.getState().workout!.queue[1].key

    // סגירה עם סט אחד — בדיוק התרחיש של "סיים תרגיל" אחרי סט בודד
    await useWorkout.getState().logSet(first, 'work', 40, 8)
    await useWorkout.getState().completeCurrent()

    const w = useWorkout.getState().workout!
    expect(w.queue.find((q) => q.key === first)?.status).toBe('done')
    expect(w.currentKey).toBe(second)
    expect(w.queue.find((q) => q.key === second)?.status).toBe('active')

    await reload()
    expect(useWorkout.getState().workout?.currentKey).toBe(second)
  }, 20000)

  it('completeCurrent בלי אף סט הוא דילוג, לא השלמה', async () => {
    await useWorkout.getState().start('F1', [])
    const first = useWorkout.getState().workout!.currentKey!

    await useWorkout.getState().completeCurrent()

    // סימון done על תרגיל ריק היה עוקף בשקט את האזהרה של גיליון הסיום
    expect(
      useWorkout.getState().workout?.queue.find((q) => q.key === first)?.status
    ).toBe('skipped')
  }, 20000)

  it('completeCurrent על התרגיל האחרון משאיר את התור בלי פריט פעיל', async () => {
    await useWorkout.getState().start('F1', [])
    const total = useWorkout.getState().workout!.queue.length
    for (let i = 0; i < total; i++) await useWorkout.getState().completeCurrent()

    expect(useWorkout.getState().workout?.currentKey).toBeNull()
    // תרגילים ריקים נסגרים כ"דולגו" — אף אחד לא נשאר פתוח
    expect(
      useWorkout.getState().workout?.queue.every((q) => q.status === 'skipped')
    ).toBe(true)
  }, 20000)

  it('skipItem מדלג על תרגיל ולא חוסם סיום, ולחיצה חוזרת פותחת אותו', async () => {
    await useWorkout.getState().start('F1', [])
    const first = useWorkout.getState().workout!.currentKey!
    const second = useWorkout.getState().workout!.queue[1].key

    await useWorkout.getState().skipItem(first)

    let w = useWorkout.getState().workout!
    expect(w.queue.find((q) => q.key === first)?.status).toBe('skipped')
    expect(w.currentKey).toBe(second)
    // תרגיל שדולג אינו "פתוח" — הוא לא מופיע באזהרת הסיום
    expect(openItems(w).some((q) => q.key === first)).toBe(false)
    expect(skippedItems(w).some((q) => q.key === first)).toBe(true)

    // הדילוג שורד קריסה
    await reload()
    expect(
      useWorkout.getState().workout?.queue.find((q) => q.key === first)?.status
    ).toBe('skipped')

    // נגיעה בתרגיל שדולג מחזירה אותו לפעיל
    await useWorkout.getState().setCurrent(first)
    w = useWorkout.getState().workout!
    expect(w.queue.find((q) => q.key === first)?.status).toBe('active')
    expect(w.currentKey).toBe(first)
  }, 20000)

  it('skipItem על תרגיל שכבר יש בו סטים סוגר אותו כ-done, לא כדילוג', async () => {
    await useWorkout.getState().start('F1', [])
    const first = useWorkout.getState().workout!.currentKey!

    // הסטים כבר ב-setLogs ונספרים בכל מקום — "דילגת, לא יתועד" לצדם היה שקר
    await useWorkout.getState().logSet(first, 'work', 40, 8)
    await useWorkout.getState().skipItem(first)

    const w = useWorkout.getState().workout!
    expect(w.queue.find((q) => q.key === first)?.status).toBe('done')
    expect(skippedItems(w).some((q) => q.key === first)).toBe(false)
  }, 20000)

  it('adjustRest מזיז את הדדליין ושורד קריסה', async () => {
    await useWorkout.getState().start('F1', [])
    const key = useWorkout.getState().workout!.currentKey!
    await useWorkout.getState().startRest(key, 120)
    const endsAt = useWorkout.getState().workout!.restEndsAt!

    await useWorkout.getState().adjustRest(15)
    expect(useWorkout.getState().workout?.restEndsAt).toBe(endsAt + 15_000)
    expect(useWorkout.getState().workout?.restTotalSeconds).toBe(135)

    await reload()
    expect(useWorkout.getState().workout?.restTotalSeconds).toBe(135)
  }, 20000)

  it('adjustRest לא דוחף את הדדליין לעבר, ולא נוגע כשאין מנוחה', async () => {
    await useWorkout.getState().start('F1', [])
    const key = useWorkout.getState().workout!.currentKey!

    // בלי מנוחה פעילה — אין מה לכוון
    await useWorkout.getState().adjustRest(15)
    expect(useWorkout.getState().workout?.restEndsAt).toBeNull()

    await useWorkout.getState().startRest(key, 30)
    await useWorkout.getState().adjustRest(-600)
    expect(useWorkout.getState().workout!.restEndsAt!).toBeGreaterThan(Date.now())
    // המינימום של restTotalSeconds הוא 5 שניות, לא מספר שלילי
    expect(useWorkout.getState().workout!.restTotalSeconds).toBeGreaterThanOrEqual(5)
  }, 20000)
})

/**
 * רמפת החימום קרסה אחרי השלב הראשון: סט חימום שנרשם סימן את השריר כ"כבר
 * עבדנו עליו", ולכן שלבים 2 ו-3 לא הוצעו לעולם. חימום נגמר כשמתחילים לעבוד.
 */
describe('רמפת חימום מתקדמת בין השלבים', () => {
  beforeEach(resetAll)

  it('סט חימום לא מסמן את השריר כמחומם, וסט עבודה כן', async () => {
    await useWorkout.getState().start('C', []) // אימון רגליים — לחיצת רגליים ראשונה
    const key = useWorkout.getState().workout!.currentKey!
    const byId = () => useWorkout.getState().exercisesById
    const groups = () => touchedGroups(useWorkout.getState().workout, byId())

    expect(groups().has('legs')).toBe(false)

    await useWorkout.getState().logSet(key, 'warmup', 60, 10)
    expect(groups().has('legs')).toBe(false)

    await useWorkout.getState().logSet(key, 'work', 160, 12)
    expect(groups().has('legs')).toBe(true)
  }, 20000)

  it('שלושת שלבי הרמפה מוצעים בזה אחר זה', async () => {
    await useWorkout.getState().start('C', [])
    const w = () => useWorkout.getState().workout!
    const key = w().currentKey!
    const exercise = useWorkout.getState().exercisesById['leg-press']

    const nextStep = () => {
      const plan = suggestWarmup({
        exercise,
        touchedGroups: touchedGroups(w(), useWorkout.getState().exercisesById),
        plannedWeightKg: 160,
        enabled: true,
        percent: 55,
      })
      const done = (w().setsByKey[key] ?? []).filter((s) => s.type === 'warmup').length
      return plan[done] ?? null
    }

    const seen: number[] = []
    for (let i = 0; i < 3; i++) {
      const step = nextStep()
      expect(step).not.toBeNull()
      seen.push(step!.weightKg)
      await useWorkout.getState().logSet(key, 'warmup', step!.weightKg, step!.reps)
    }

    // שלושה שלבים עולים, ואחריהם אין מה להציע
    expect(seen).toEqual([60, 95, 125])
    expect(nextStep()).toBeNull()
  }, 20000)
})
