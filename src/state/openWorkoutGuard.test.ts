import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady } from '@/db/db'
import { useWorkout } from '@/state/activeWorkoutStore'

/**
 * אימון פתוח לא נדרס. אף פעם.
 *
 * זו הבדיקה שמגנה על נתונים ולא על מסך. הסטים נכתבים ל-`setLogs` ברגע
 * שנרשמים, אבל שורת ה-`session` שלהם נכתבת רק ב-`finish` — ולכן דריסה של
 * `activeWorkout` הייתה משאירה אותם **יתומים**: הם ממשיכים להיספר ב"משקל
 * אחרון", בגרפים ובבניית השיאים, אבל אינם מופיעים בשום מקום בהיסטוריה ולכן
 * גם אי אפשר למחוק אותם. אימון שנמחק בטעות היה ממשיך להשפיע על ההמלצות לנצח.
 *
 * עד כאן השער היה ב-UI בלבד: שלושה מסכים שאלו "בטוח?" ואז קראו ל-`discard`.
 * שאלה היא לא שער — היא הופכת מחיקה לשתי לחיצות, ומסלול רביעי שיישכח לשאול
 * מקבל את ההתנהגות ההרסנית בחינם. עכשיו הסירוב יושב ב-store, והמסכים רק
 * מציגים אותו.
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
}

/** אימון פתוח עם סט אחד מתועד — כלומר כזה שיש מה לאבד בו */
async function openWorkoutWithASet(): Promise<{ sessionId: string; key: string }> {
  expect(await useWorkout.getState().start('C', [])).toBe('started')
  const w = useWorkout.getState().workout!
  const key = w.currentKey!
  await useWorkout.getState().logSet(key, 'work', 100, 10)
  return { sessionId: w.sessionId, key }
}

describe('אי אפשר לפתוח שני אימונים במקביל', () => {
  beforeEach(resetAll)

  it('start מסרב כשיש אימון פתוח, ולא נוגע בו', async () => {
    const { sessionId, key } = await openWorkoutWithASet()

    expect(await useWorkout.getState().start('A', [])).toBe('busy')

    const after = useWorkout.getState().workout
    // אותו אימון בדיוק — לא נפתח חדש ולא נמחק הישן
    expect(after?.sessionId).toBe(sessionId)
    expect(after?.routineId).toBe('C')
    expect(after?.setsByKey[key]?.length).toBe(1)
    // והסט עצמו עדיין על הדיסק, לא יתום ולא מחוק
    expect((await db.setLogs.where('sessionId').equals(sessionId).toArray()).length).toBe(1)
  }, 20000)

  it('startWithItems מסרב באותה מידה — גם עם רשימה ריקה', async () => {
    const { sessionId } = await openWorkoutWithASet()

    expect(await useWorkout.getState().startWithItems([])).toBe('busy')
    expect(await useWorkout.getState().startWithItems(['leg-press'])).toBe('busy')

    expect(useWorkout.getState().workout?.sessionId).toBe(sessionId)
    expect((await db.setLogs.where('sessionId').equals(sessionId).toArray()).length).toBe(1)
  }, 20000)

  /*
    החור האמיתי, וזה שבגללו השער בודק גם את הדיסק.

    הזיכרון ריק לפני ש-`hydrate` רץ, וגם בלשונית שנייה שנפתחה זה עתה. שער
    שנשען רק על `get().workout` היה מרשה שם פתיחה — כלומר אימון שרץ במכשיר
    נמחק בגלל טאב שנפתח ברקע.
  */
  it('גם כשהזיכרון ריק והאימון קיים רק על הדיסק', async () => {
    const { sessionId } = await openWorkoutWithASet()
    useWorkout.setState({ workout: null, hydrated: false })

    expect(await useWorkout.getState().start('A', [])).toBe('busy')

    // והסירוב גם החזיר את האימון לזיכרון — מסך שחוסם חייב להראות מה חוסם
    expect(useWorkout.getState().workout?.sessionId).toBe(sessionId)
    expect(useWorkout.getState().hydrated).toBe(true)
  }, 20000)

  it('אחרי סיום האימון אפשר לפתוח חדש', async () => {
    await openWorkoutWithASet()

    expect(await useWorkout.getState().finish()).toBeTruthy()
    expect(await useWorkout.getState().start('A', [])).toBe('started')
    expect(useWorkout.getState().workout?.routineId).toBe('A')
  }, 20000)

  it('גם אחרי ביטול מפורש — זו הדרך השנייה והיחידה לפנות מקום', async () => {
    const { sessionId } = await openWorkoutWithASet()

    await useWorkout.getState().discard()
    // ביטול הוא מחיקה מכוונת, ולכן הסטים שלו כן יורדים מהדיסק
    expect((await db.setLogs.where('sessionId').equals(sessionId).toArray()).length).toBe(0)

    expect(await useWorkout.getState().start('A', [])).toBe('started')
  }, 20000)
})
