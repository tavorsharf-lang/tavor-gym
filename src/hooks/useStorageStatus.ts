import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * מצב האחסון של האפליקציה.
 *
 * בלי אחסון קבוע (persistent) הדפדפן רשאי למחוק את ה-IndexedDB כשנגמר המקום
 * במכשיר — כלומר את כל היסטוריית האימונים. Safari דורש שהמשתמש יאשר, ולכן
 * `requestPersist` נקרא מכפתור מפורש ולא אוטומטית.
 */

export interface StorageStatus {
  /** null = לא ידוע או לא נתמך */
  persisted: boolean | null
  usageBytes: number | null
  quotaBytes: number | null
  supported: boolean
  requestPersist: () => Promise<boolean>
  refresh: () => Promise<void>
}

interface Estimate {
  persisted: boolean | null
  usageBytes: number | null
  quotaBytes: number | null
}

const EMPTY: Estimate = { persisted: null, usageBytes: null, quotaBytes: null }

function storageManager(): StorageManager | null {
  if (typeof navigator === 'undefined' || !('storage' in navigator)) return null
  return navigator.storage ?? null
}

export function useStorageStatus(): StorageStatus {
  const [supported] = useState(() => storageManager() !== null)
  const [state, setState] = useState<Estimate>(EMPTY)
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    const storage = storageManager()
    if (!storage) return

    const next: Estimate = { ...EMPTY }
    // כל יכולת נבדקת בנפרד: יש דפדפנים עם estimate בלי persisted ולהיפך
    if (typeof storage.persisted === 'function') {
      try {
        next.persisted = await storage.persisted()
      } catch {
        next.persisted = null
      }
    }
    if (typeof storage.estimate === 'function') {
      try {
        const estimate = await storage.estimate()
        next.usageBytes = estimate.usage ?? null
        next.quotaBytes = estimate.quota ?? null
      } catch {
        // Safari מחזיר לפעמים שגיאה כשהמסמך ברקע — נשארים עם null
      }
    }

    if (!mountedRef.current) return
    setState(next)
  }, [])

  const requestPersist = useCallback(async () => {
    const storage = storageManager()
    if (!storage || typeof storage.persist !== 'function') return false
    try {
      const granted = await storage.persist()
      await refresh()
      return granted
    } catch {
      return false
    }
  }, [refresh])

  useEffect(() => {
    mountedRef.current = true
    void refresh()
    return () => {
      mountedRef.current = false
    }
  }, [refresh])

  return {
    persisted: state.persisted,
    usageBytes: state.usageBytes,
    quotaBytes: state.quotaBytes,
    supported,
    requestPersist,
    refresh,
  }
}
