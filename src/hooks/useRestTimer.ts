import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * טיימר המנוחה.
 *
 * הכלל היחיד שחשוב כאן: הזמן שנותר מחושב תמיד מ-`endsAt - Date.now()`, אף פעם
 * לא מספירת טיקים. iOS מקפיא setInterval כשהמסך נכבה, ולכן טיימר שסופר טיקים
 * היה "מאבד" שלושים שניות בכל נעילת מסך. חותמת הזמן שורדת גם הקפאה, גם רענון
 * של הדף (היא נשמרת ב-activeWorkout) וגם מעבר בין מסכים.
 */

export interface RestTimerState {
  active: boolean
  endsAt: number | null
  totalSeconds: number
  remainingSeconds: number
  progress: number
  finished: boolean
}

/** קצב הרענון — מספיק חלק לספרות שניות, וזול מספיק לא לשרוף סוללה */
const TICK_MS = 250

interface Tick {
  /** ה-endsAt שעבורו נמדד `at` */
  key: number | null
  at: number
}

export function useRestTimer(
  endsAt: number | null,
  totalSeconds: number,
  onFinish: () => void
): RestTimerState {
  // ref ולא dependency: כך אפשר להעביר closure מוטבע בלי לאתחל את הטיימר בכל רינדור
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  /** ה-endsAt שעבורו כבר הופעל onFinish — שומר על "בדיוק פעם אחת" */
  const firedForRef = useRef<number | null>(null)
  const [tick, setTick] = useState<Tick>(() => ({ key: endsAt, at: Date.now() }))

  // התאמת state בזמן רינדור: ברגע שמתחילה מנוחה חדשה חייבים למדוד זמן מחדש כבר
  // בפריים הזה. אחרת ה-effect (שרץ אחרי הציור) היה משאיר הבזק של מספר שגוי.
  if (tick.key !== endsAt) setTick({ key: endsAt, at: Date.now() })
  const now = tick.key === endsAt ? tick.at : Date.now()

  useEffect(() => {
    if (endsAt === null) return

    let intervalId: number | null = null
    let done = false

    const stop = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId)
        intervalId = null
      }
    }

    const measure = () => {
      const at = Date.now()
      setTick({ key: endsAt, at })
      if (done || at < endsAt) return
      done = true
      stop()
      if (firedForRef.current !== endsAt) {
        firedForRef.current = endsAt
        onFinishRef.current()
      }
    }

    // בדיקה מיידית: אם הדד-ליין עבר בזמן שהאפליקציה הייתה ברקע, מסיימים כאן ועכשיו
    measure()
    if (!done) intervalId = window.setInterval(measure, TICK_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') measure()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [endsAt])

  return useMemo(() => {
    if (endsAt === null) {
      return {
        active: false,
        endsAt: null,
        totalSeconds,
        remainingSeconds: 0,
        progress: 0,
        finished: false,
      }
    }
    const remainingMs = Math.max(0, endsAt - now)
    const totalMs = Math.max(0, totalSeconds) * 1000
    return {
      active: remainingMs > 0,
      endsAt,
      totalSeconds,
      remainingSeconds: Math.max(0, Math.ceil(remainingMs / 1000)),
      progress: totalMs > 0 ? Math.min(1, Math.max(0, (totalMs - remainingMs) / totalMs)) : 1,
      finished: remainingMs === 0,
    }
  }, [endsAt, now, totalSeconds])
}
