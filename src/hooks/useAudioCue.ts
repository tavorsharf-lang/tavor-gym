import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * צלילי הטיימר — מסונתזים, בלי אף קובץ אודיו.
 *
 * שלושה מכשולים ב-iOS שהקוד הזה קיים בשבילם:
 *   1. Safari לא מנגן כלום עד שהקשר האודיו נפתח *בתוך* מחוות משתמש. לכן
 *      `unlock` נקרא מהלחיצה על "התחל אימון", ומשמיע באפר שקט של דגימה אחת.
 *   2. מתג ההשתקה החומרי משתיק WebAudio. `navigator.audioSession.type` = 'playback'
 *      (Safari 17+) מסמן שזו השמעה ולא צליל ממשק, ואז המתג לא משתיק.
 *   3. ההקשר עובר ל-suspended כשהמסך נכבה. מחזירים אותו בכל חזרה לאפליקציה
 *      ובכל קריאה ל-keepAlive.
 *
 * אם משהו מזה לא נתמך — משתתקים בשקט. צליל חסר הוא הרבה פחות גרוע מקריסה
 * באמצע אימון.
 */

export type AudioCuePattern = 'done' | 'tick' | 'pr'

/** Safari 17+. לא קיים בטיפוסי ה-DOM, ולכן הצהרה מקומית וצרה במקום any */
interface AudioSessionLike {
  type: string
}
interface NavigatorWithAudioSession extends Navigator {
  audioSession?: AudioSessionLike
}
/** Safari ישן יותר עדיין דורש את הקידומת */
interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext
}

interface Note {
  /** תדר בהרץ */
  freq: number
  /** מתי מתחיל, בשניות מתחילת התבנית */
  at: number
  /** אורך בשניות */
  dur: number
  /** עוצמה יחסית 0–1 */
  gain: number
}

/**
 * התבניות. 'done' עולה בשלושה צעדים ומסתיים בצליל ארוך ובולט — נשמע גם
 * מהתיק ומעל מוזיקה של חדר כושר. 'tick' חייב להישאר שקט, הוא מתנגן בכל שנייה
 * של ספירה לאחור. 'pr' בהיר יותר וכולל קפיצה לאוקטבה, כדי שיהיה ברור שקרה
 * משהו טוב ולא שהטיימר נגמר.
 */
const PATTERNS: Record<AudioCuePattern, Note[]> = {
  done: [
    { freq: 660, at: 0, dur: 0.16, gain: 0.85 },
    { freq: 880, at: 0.2, dur: 0.16, gain: 0.9 },
    { freq: 1320, at: 0.4, dur: 0.38, gain: 1 },
  ],
  tick: [{ freq: 1100, at: 0, dur: 0.05, gain: 0.18 }],
  pr: [
    { freq: 880, at: 0, dur: 0.12, gain: 0.8 },
    { freq: 1108, at: 0.11, dur: 0.12, gain: 0.85 },
    { freq: 1318, at: 0.22, dur: 0.12, gain: 0.9 },
    { freq: 1760, at: 0.33, dur: 0.42, gain: 1 },
  ],
}

/** תקרת עוצמה. מעליה הרמקול של האייפון מעוות במקום להיות חזק יותר */
const MASTER = 0.9
/** ערך "אפס" לרמפות אקספוננציאליות — אסור להן להגיע ל-0 ממש */
const SILENT = 0.0001
/** עלייה קצרה מאוד, רק כדי למנוע נקישה בתחילת הצליל */
const ATTACK = 0.012

export interface AudioCue {
  /** לקרוא מתוך מחוות משתמש (הלחיצה על "התחל אימון") */
  unlock: () => void
  isUnlocked: boolean
  beep: (pattern?: AudioCuePattern) => void
  /** להעיר את ההקשר אם המערכת השהתה אותו — נקרא מהטיק של הטיימר */
  keepAlive: () => void
}

export function useAudioCue(enabled: boolean, volume: number): AudioCue {
  const ctxRef = useRef<AudioContext | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)

  // refs כדי ש-beep ו-unlock יישארו יציבים ולא יפילו effects של הקוראים
  const enabledRef = useRef(enabled)
  const volumeRef = useRef(volume)
  useEffect(() => {
    enabledRef.current = enabled
    volumeRef.current = volume
  }, [enabled, volume])

  /** ניגון באפר של דגימה אחת — זה מה ש"צורך" את מחוות המשתמש ב-iOS */
  const primeSilently = useCallback((ctx: AudioContext) => {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
  }, [])

  const unlock = useCallback(() => {
    try {
      const Ctor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext
      if (!Ctor) return

      // חייב לקרות לפני יצירת ההקשר, אחרת ההקשר כבר נקבע כ'סאונד ממשק'
      const nav = navigator as NavigatorWithAudioSession
      if (nav.audioSession) nav.audioSession.type = 'playback'

      let ctx = ctxRef.current
      if (!ctx) {
        ctx = new Ctor()
        ctxRef.current = ctx
      }
      primeSilently(ctx)
      void ctx.resume().catch(() => {})
      setIsUnlocked(true)
    } catch {
      // אין WebAudio בסביבה הזו — ממשיכים בלי צליל
    }
  }, [primeSilently])

  const keepAlive = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || ctx.state === 'closed') return
    if (ctx.state !== 'running') void ctx.resume().catch(() => {})
  }, [])

  const beep = useCallback(
    (pattern: AudioCuePattern = 'done') => {
      if (!enabledRef.current) return
      const level = Math.min(1, Math.max(0, volumeRef.current))
      if (level <= 0) return

      const ctx = ctxRef.current
      if (!ctx || ctx.state === 'closed') return

      try {
        // אם המערכת השהתה את ההקשר בזמן שהמסך היה כבוי — מעירים ומנגנים בכל זאת
        if (ctx.state !== 'running') void ctx.resume().catch(() => {})

        const start = ctx.currentTime + 0.02
        for (const note of PATTERNS[pattern]) {
          const osc = ctx.createOscillator()
          const env = ctx.createGain()
          // triangle: עשיר מספיק כדי לחתוך רעש רקע, בלי החספוס של square
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(note.freq, start + note.at)

          const peak = Math.max(SILENT * 2, note.gain * level * MASTER)
          const t0 = start + note.at
          const t1 = t0 + note.dur
          // מעטפת אקספוננציאלית משני הצדדים — בלי זה נשמעת נקישה בהתחלה ובסוף
          env.gain.setValueAtTime(SILENT, t0)
          env.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(ATTACK, note.dur / 2))
          env.gain.exponentialRampToValueAtTime(SILENT, t1)

          osc.connect(env)
          env.connect(ctx.destination)
          osc.start(t0)
          osc.stop(t1 + 0.02)
          osc.onended = () => {
            osc.disconnect()
            env.disconnect()
          }
        }
      } catch {
        // צליל שנכשל לא מפיל אימון
      }
    },
    []
  )

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') keepAlive()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [keepAlive])

  // בכוונה לא סוגרים כאן את ה-AudioContext: פתיחה מחדש מחייבת מחוות משתמש
  // נוספת, ופירוק־והרכבה של ההוק (StrictMode) היה משתיק את הטיימר עד ללחיצה
  // הבאה. ההקשר חי לכל אורך חיי האפליקציה, וזה מה שאנחנו רוצים.

  return { unlock, isUnlocked, beep, keepAlive }
}
