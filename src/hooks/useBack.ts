import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * חזרה אמיתית אחורה, עם יעד גיבוי.
 *
 * ניווט קדימה אל הכתובת הקודמת (navigate('/library')) יוצר רשומה חדשה
 * בהיסטוריה, וכל רשומה חדשה נפתחת מלמעלה — כך מקום הגלילה אובד. navigate(-1)
 * חוזר לרשומה הקיימת, ואיתה למקום שבו היינו (ראה useScrollMemory).
 *
 * כשאין לאן לחזור — האפליקציה נפתחה ישר בכתובת הזו — הולכים ליעד הגיבוי
 * במקום להיתקע או לצאת מהאפליקציה.
 */
export function useBack(fallback: string): () => void {
  const navigate = useNavigate()
  const { key } = useLocation()

  return useCallback(() => {
    if (key === 'default') navigate(fallback, { replace: true })
    else navigate(-1)
  }, [key, navigate, fallback])
}
