/// <reference types="vite-plugin-pwa/client" />
import { useCallback, useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * עדכוני Service Worker.
 *
 * `deferUpdates` הוא כל העניין: כשיש אימון פעיל אסור שתופיע הודעת עדכון,
 * כי לחיצה עליה טוענת מחדש את הדף באמצע סט. מחזיקים את הדגל עד שהאימון
 * נגמר, ואז ההודעה מופיעה מעצמה — בלי לאבד את המידע שיש עדכון.
 *
 * הרישום עצמו יושב ברמת המודול ולא בתוך ההוק: הוא חייב לקרות פעם אחת בלבד
 * בחיי הדף, גם אם ההוק מורכב מחדש (StrictMode) או נצרך בכמה מקומות.
 */

type UpdateSW = (reloadPage?: boolean) => Promise<void>

let started = false
let updateSW: UpdateSW | null = null
let registration: ServiceWorkerRegistration | null = null
let needRefresh = false
let offlineReady = false

const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function start(): void {
  if (started) return
  started = true
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh = true
        emit()
      },
      onOfflineReady() {
        offlineReady = true
        emit()
      },
      onRegisteredSW(_swUrl, reg) {
        registration = reg ?? null
      },
      onRegisterError() {
        // אין SW (למשל ב-dev או ללא HTTPS) — האפליקציה עובדת, פשוט בלי עדכונים
      },
    })
  } catch {
    updateSW = null
  }
}

/** בדיקה יזומה מול השרת. הרישום עצמו כבר בודק, זה נועד לחזרות לאפליקציה. */
function checkForUpdate(): void {
  void registration?.update().catch(() => {})
}

export interface SWUpdateState {
  updateAvailable: boolean
  applyUpdate: () => void
  offlineReady: boolean
}

export function useSWUpdate(deferUpdates: boolean): SWUpdateState {
  const [state, setState] = useState(() => ({ needRefresh, offlineReady }))

  useEffect(() => {
    start()

    const sync = () => {
      setState((prev) =>
        prev.needRefresh === needRefresh && prev.offlineReady === offlineReady
          ? prev
          : { needRefresh, offlineReady }
      )
    }
    listeners.add(sync)
    sync()
    checkForUpdate()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      listeners.delete(sync)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const applyUpdate = useCallback(() => {
    void updateSW?.(true).catch(() => {})
  }, [])

  return {
    // המידע נשמר גם כשהוא מוסתר, ולכן ברגע ש-deferUpdates מתאפס ההודעה מופיעה
    updateAvailable: state.needRefresh && !deferUpdates,
    applyUpdate,
    offlineReady: state.offlineReady,
  }
}
