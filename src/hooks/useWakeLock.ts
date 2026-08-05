import { useEffect, useRef, useState } from 'react'

/**
 * מונע מהמסך להיכבות באמצע אימון.
 *
 * ב-iOS הנעילה משתחררת בכל פעם שהמסך נכבה או שעוברים לאפליקציה אחרת, והיא
 * *לא* חוזרת מעצמה. לכן מבקשים אותה מחדש בכל חזרה לאפליקציה. במצב חיסכון
 * בסוללה הבקשה נדחית — זה לא מצב שגיאה אלא הודעה למשתמש.
 */

/** הודעה למשתמש, לא חריגה — האימון ממשיך גם בלי נעילת מסך */
const LOW_POWER_MESSAGE = 'המסך עלול לכבות — מצב חיסכון בסוללה'

export interface WakeLockState {
  supported: boolean
  held: boolean
  error: string | null
}

export function useWakeLock(active: boolean): WakeLockState {
  const [supported] = useState(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator)
  const [held, setHeld] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!supported || !active) {
      setHeld(false)
      // האזהרה שייכת לאימון שנגמר — לא נשארים איתה על המסך
      if (!active) setError(null)
      return
    }

    let cancelled = false

    const release = () => {
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      if (sentinel && !sentinel.released) void sentinel.release().catch(() => {})
      setHeld(false)
    }

    const request = async () => {
      // בקשה כשהמסמך מוסתר נדחית תמיד — מחכים ל-visibilitychange
      if (cancelled || document.visibilityState !== 'visible') return
      const current = sentinelRef.current
      if (current && !current.released) return

      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void sentinel.release().catch(() => {})
          return
        }
        sentinelRef.current = sentinel
        setHeld(true)
        setError(null)
        // המערכת משחררת מיוזמתה — מסמנים, והבקשה הבאה תגיע מ-visibilitychange
        sentinel.addEventListener('release', () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null
          setHeld(false)
        })
      } catch {
        if (cancelled) return
        setHeld(false)
        setError(LOW_POWER_MESSAGE)
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request()
    }

    document.addEventListener('visibilitychange', onVisibility)
    void request()

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      release()
    }
  }, [active, supported])

  return { supported, held, error }
}
