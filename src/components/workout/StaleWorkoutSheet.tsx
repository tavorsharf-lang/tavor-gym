import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { staleWorkout } from '@/domain/staleWorkout'
import { formatDuration } from '@/domain/units'
import { formatRelativeDay, formatTime } from '@/lib/dates'
import { useWorkout } from '@/state/activeWorkoutStore'
import { BottomSheet, Button, toast } from '@/components/ui'

/**
 * ההצעה לסגור אימון שנשכח פתוח.
 *
 * יושב ב-Shell ולא במסך הבית, ובכוונה: `useColdLaunchHome` מדלג במפורש על
 * ‏`/workout` ("אימון פעיל הוא קו אדום"), ולכן מי שסגר את האפליקציה בתוך
 * אימון חוזר *לתוכו* ולא הביתה. כרטיס במסך הבית לבדו היה מפספס בדיוק את
 * המקרה שבשבילו נבנה.
 *
 * הוא שואל ולא מחליט. סגירה אוטומטית הייתה חוסכת את הלחיצה, אבל גם סוגרת
 * אימון שהייתה בו הפסקה ארוכה מסיבה אמיתית — והאינווריאנט "אימון פתוח לא
 * נדרס" הוא מה שמגן על הסטים שכבר יושבים ב-`setLogs`.
 */

/**
 * מה שהגיליון מציג, מוקפא ברגע הזיהוי.
 *
 * כל הערכים מועתקים פנימה ולא נקראים מה-store תוך כדי, משתי סיבות: הסגירה
 * מאפסת את `workout` והתוכן היה נעלם באמצע אנימציית היציאה, ו-`Date.now()`
 * בתוך רינדור הופך את המספר המוצג לערך שזז בלי שקרה כלום.
 */
type Prompt =
  | { state: 'abandoned'; startedAt: number; lastSetAt: number; now: number }
  | { state: 'empty'; startedAt: number }

export function StaleWorkoutSheet(): JSX.Element | null {
  const navigate = useNavigate()
  const workout = useWorkout((s) => s.workout)
  const finish = useWorkout((s) => s.finish)
  const discard = useWorkout((s) => s.discard)

  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [answered, setAnswered] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (answered || prompt || !workout) return
    const now = Date.now()
    const verdict = staleWorkout(workout, now)
    if (verdict.state === 'live') return
    setPrompt(
      verdict.state === 'abandoned'
        ? {
            state: 'abandoned',
            startedAt: workout.startedAt,
            lastSetAt: verdict.lastSetAt,
            now,
          }
        : { state: 'empty', startedAt: verdict.startedAt }
    )
  }, [workout, answered, prompt])

  if (!prompt) return null

  const closeNow = async (): Promise<void> => {
    if (busy || prompt.state !== 'abandoned') return
    setBusy(true)
    try {
      await finish(prompt.lastSetAt)
      setAnswered(true)
      // בלי השעה בטקסט: הטוסט הוא מחרוזת אחת, ואין בה איפה לעטוף שעון ב-dir
      toast('האימון נסגר על הסט האחרון שנרשם בו')
    } catch {
      toast('לא הצלחתי לסגור את האימון — הסטים שמורים, אפשר לנסות שוב', { tone: 'warn' })
    } finally {
      setBusy(false)
    }
  }

  const discardNow = async (): Promise<void> => {
    if (busy) return
    setBusy(true)
    try {
      await discard()
      setAnswered(true)
      toast('האימון בוטל')
    } finally {
      setBusy(false)
    }
  }

  /* גם סגירה בגרירה ובמקש Escape היא "המשך" — ברירת המחדל לא נוגעת בנתונים */
  const resume = (): void => {
    setAnswered(true)
    navigate('/workout')
  }

  return (
    <BottomSheet open={!answered} onClose={resume} title="אימון שנשאר פתוח">
      {prompt.state === 'abandoned' ? (
        <>
          <p className="text-sm leading-relaxed text-bone-400">
            הסט האחרון נרשם {formatRelativeDay(prompt.lastSetAt, prompt.now)} ב־
            <span dir="ltr" className="tnum text-bone-50">
              {formatTime(prompt.lastSetAt)}
            </span>
            , ומאז לא נרשם באימון כלום.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-bone-500">
            סגירה על השעה הזו תרשום אימון של{' '}
            <span dir="ltr" className="tnum">
              {formatDuration(Math.round((prompt.lastSetAt - prompt.startedAt) / 1000))}
            </span>
            . סגירה על עכשיו הייתה רושמת{' '}
            <span dir="ltr" className="tnum">
              {formatDuration(Math.round((prompt.now - prompt.startedAt) / 1000))}
            </span>
            .
          </p>
          <div className="mt-5 mb-2 flex flex-col gap-2">
            <Button
              variant="flame"
              size="lg"
              fullWidth
              loading={busy}
              onClick={() => void closeNow()}
            >
              {/*
                עטוף בספאן אחד: `Button` הוא flex עם gap-2, ושני ילדים נפרדים
                היו מקבלים גם את הרווח שלו וגם את זה שבטקסט — רווח כפול שנראה
                כמו טעות הקלדה.
              */}
              <span>
                סיים על <span dir="ltr" className="tnum">{formatTime(prompt.lastSetAt)}</span>
              </span>
            </Button>
            <Button variant="ghost" size="lg" fullWidth disabled={busy} onClick={resume}>
              המשך את האימון
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-bone-400">
            האימון נפתח {formatRelativeDay(prompt.startedAt)} ב־
            <span dir="ltr" className="tnum text-bone-50">
              {formatTime(prompt.startedAt)}
            </span>{' '}
            ולא נרשם בו אף סט.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-bone-500">
            אין ממנו מה לשמור, וסגירה שלו רק תוסיף להיסטוריה אימון ריק.
          </p>
          <div className="mt-5 mb-2 flex flex-col gap-2">
            <Button
              variant="danger"
              size="lg"
              fullWidth
              loading={busy}
              onClick={() => void discardNow()}
            >
              בטל את האימון
            </Button>
            <Button variant="ghost" size="lg" fullWidth disabled={busy} onClick={resume}>
              המשך את האימון
            </Button>
          </div>
        </>
      )}
    </BottomSheet>
  )
}
