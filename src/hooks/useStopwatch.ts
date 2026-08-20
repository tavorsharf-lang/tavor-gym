import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * סטופר לתרגיל שנמדד בזמן (פלאנק).
 *
 * אותו כלל ברזל כמו טיימר המנוחה: הזמן שעבר מחושב תמיד מ-`Date.now() - startedAt`,
 * אף פעם לא מצבירת טיקים. iOS מקפיא setInterval כשהמסך כבה — סטופר שסופר טיקים
 * היה משקר בדיוק בתרגיל שבו המשתמש לא מסוגל להסתכל על הטלפון.
 *
 * ההגעה ליעד היא אירוע חד-פעמי (onTarget) והסטופר *ממשיך לספור* אחריה —
 * לפעמים מחזיקים יותר מהיעד, וזה בדיוק מה שרוצים לתעד.
 */

export interface StopwatchState {
  running: boolean
  /** שניות שעברו מאז ההתחלה, שלמות (מעוגלות כלפי מטה) */
  elapsedSeconds: number
  /** 0–1 מול היעד; נשאר 1 אחרי שעברו אותו */
  progress: number
  /** האם היעד כבר הושג */
  reachedTarget: boolean
  start: () => void
  stop: () => number
  reset: () => void
}

const TICK_MS = 250

export function useStopwatch(targetSeconds: number, onTarget?: () => void): StopwatchState {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const onTargetRef = useRef(onTarget)
  useEffect(() => {
    onTargetRef.current = onTarget
  }, [onTarget])

  /** ה-startedAt שעבורו כבר הופעל onTarget — "בדיוק פעם אחת" לכל ריצה */
  const firedForRef = useRef<number | null>(null)

  useEffect(() => {
    if (startedAt === null) return

    const measure = () => {
      const at = Date.now()
      setNow(at)
      if (
        targetSeconds > 0 &&
        at - startedAt >= targetSeconds * 1000 &&
        firedForRef.current !== startedAt
      ) {
        firedForRef.current = startedAt
        onTargetRef.current?.()
      }
    }

    measure()
    const id = window.setInterval(measure, TICK_MS)

    // חזרה מרקע: מיישרים מיד, ואם היעד עבר בינתיים — האירוע נורה עכשיו
    const onVisibility = () => {
      if (document.visibilityState === 'visible') measure()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [startedAt, targetSeconds])

  const start = useCallback(() => {
    firedForRef.current = null
    setNow(Date.now())
    setStartedAt(Date.now())
  }, [])

  const stopRef = useRef<() => number>(() => 0)
  stopRef.current = () => {
    if (startedAt === null) return 0
    const elapsed = Math.round((Date.now() - startedAt) / 1000)
    setStartedAt(null)
    return elapsed
  }
  const stop = useCallback(() => stopRef.current(), [])

  const reset = useCallback(() => {
    firedForRef.current = null
    setStartedAt(null)
  }, [])

  return useMemo(() => {
    const elapsedMs = startedAt === null ? 0 : Math.max(0, now - startedAt)
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    return {
      running: startedAt !== null,
      elapsedSeconds,
      progress:
        targetSeconds > 0 ? Math.min(1, elapsedMs / (targetSeconds * 1000)) : 0,
      reachedTarget: targetSeconds > 0 && elapsedMs >= targetSeconds * 1000,
      start,
      stop,
      reset,
    }
  }, [startedAt, now, targetSeconds, start, stop, reset])
}
