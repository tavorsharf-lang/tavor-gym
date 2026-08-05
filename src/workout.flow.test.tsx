import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { db, ensureReady } from './db/db'
import { useWorkout } from './state/activeWorkoutStore'

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
}

describe('זרימת אימון', () => {
  beforeEach(resetAll)

  it('מתחילה אימון, מתעדת סט, ומסיימת עם אימון שמור בהיסטוריה', async () => {
    const user = userEvent.setup()
    render(<App />)

    // מסך הבית נטען עם ההצעה
    await waitFor(() => expect(screen.getAllByText(/חזה ויד אחורית/).length).toBeGreaterThan(0), {
      timeout: 5000,
    })

    await user.click(screen.getByRole('button', { name: /התחל אימון/ }))

    // גיליון בחירת האימון נפתח, ובו כפתור התחלה
    const start = await screen.findByRole('button', { name: /^התחל$/ }, { timeout: 5000 })
    await user.click(start)

    // מסך האימון: התרגיל הראשון של אימון A הוא חימום שכיבות סמיכה
    await waitFor(() => expect(screen.getByText('שכיבות סמיכה — חימום')).toBeTruthy(), {
      timeout: 5000,
    })

    const workout = useWorkout.getState().workout
    expect(workout).not.toBeNull()
    // 9 באימון A, ועוד 4+2+1 מהבלוקים — כשאף בלוק לא בוצע מעולם כולם מוצעים
    // מראש, וזו בדיוק ההתנהגות שהצעת הבלוקים אמורה לתת
    expect(workout?.queue.length).toBe(16)
    expect(workout?.blockIds.sort()).toEqual(['abs', 'forearms', 'shoulders'])

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
    expect(logged[0].exerciseId).toBe('pushup')

    // טיימר המנוחה התחיל
    expect(useWorkout.getState().workout?.restEndsAt).not.toBeNull()

    // סיום האימון
    await useWorkout.getState().stopRest()
    const finishedId = await useWorkout.getState().finish()
    expect(finishedId).toBeTruthy()

    const session = await db.sessions.get(finishedId ?? '')
    expect(session).toBeTruthy()
    expect(session?.routineId).toBe('A')
    expect(session?.actualOrder).toEqual(['pushup'])
    // שכיבות סמיכה הן משקל גוף, ולכן נפח 0 — אבל הסט נספר
    expect(session?.totalSets).toBe(1)
    expect(session?.skippedExerciseIds.length).toBe(15)
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
    // לחיצת חזה חופשי — perSide
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
