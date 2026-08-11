import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { assetUrl, bundledVideosFor, loadThumbnailFor } from '@/db/mediaDb'
import { peekHiddenVideoIds, useHiddenVideosVersion } from '@/db/hiddenVideos'

/**
 * התמונה הממוזערת של סרטון ההדגמה, כפי שהיא מופיעה בכרטיס התרגיל.
 * לחיצה פותחת את הנגן. אם אין סרטון — לא מציגים כלום.
 *
 * בלי `onOpen` היא מרונדרת כ-span ולא כ-button, וזה הכרחי ולא סגנוני: ברשימות
 * התרגילים כל שורה היא כפתור בעצמה, וכפתור מקונן היה מפעיל את שני המטפלים
 * בלחיצה אחת — שתי רשומות היסטוריה זהות, ו"חזרה" ראשונה שנראית כאילו לא עשתה
 * כלום. זה גם HTML לא חוקי שקורא-מסך מכריז כשני פקדים.
 */
export function VideoThumb({
  exerciseId,
  libraryId,
  onOpen,
  size = 'md',
}: {
  exerciseId: string
  /** התרגיל המקביל במאגר — כדי שגם תרגיל בלי הדגמה משלו יציג תמונה */
  libraryId?: string
  /** חסר = התמונה דקורטיבית, והשורה שמסביבה היא זו שנלחצת */
  onOpen?: () => void
  size?: 'sm' | 'md'
}) {
  /*
    הפוסטר מהמניפסט מוצג *מיד*, בלי להמתין ל-IndexedDB.

    כל שורה ברשימה הריצה שאילתה נפרדת ורנדרה ריק עד שהיא חזרה — בספריית המאגר
    אלה עשרות שאילתות מקבילות, וכל תשובה שחוזרת קופצת פנימה ומזיזה את הגובה.
    זו בדיוק קפיצת הגובה ש-useScrollMemory נאלץ להילחם בה בלולאת settle.
    הנתיב ידוע סינכרונית, והתמונה ממילא ב-precache — אין סיבה להמתין.
  */
  const staticPoster = (id: string, libId?: string): string | null => {
    // ההצצה מונעת הבלחה של סרטון שנמחק; לפני שהרשימה נטענה מוותרים על הקיצור
    const hidden = peekHiddenVideoIds()
    if (hidden === null) return null
    const first = bundledVideosFor(id, libId, hidden)[0]
    return first ? assetUrl(first.poster) : null
  }

  const [url, setUrl] = useState<string | null>(() => staticPoster(exerciseId, libraryId))
  // מחיקת הסרטון האחרון של תרגיל צריכה להעלים את התמונה מיד, בלי רענון מסך
  const hiddenVersion = useHiddenVideosVersion()

  useEffect(() => {
    let created: string | null = null
    let cancelled = false
    // תרגיל אחר — קודם הפוסטר שלו, ורק אחר כך ה-blob המקומי אם הותקן
    setUrl(staticPoster(exerciseId, libraryId))
    loadThumbnailFor(exerciseId, libraryId).then((u) => {
      if (cancelled) {
        if (u?.startsWith('blob:')) URL.revokeObjectURL(u)
        return
      }
      created = u
      setUrl(u)
    })
    return () => {
      cancelled = true
      if (created?.startsWith('blob:')) URL.revokeObjectURL(created)
    }
  }, [exerciseId, libraryId, hiddenVersion])

  if (!url) return null

  const box = size === 'sm' ? 'h-14 w-14' : 'h-20 w-20'
  const inner = (
    <>
      {/*
        תמונות המאגר אינן ב-precache (הן 7.4MB), ולכן אופליין הן פשוט לא
        נטענות. בלי onError הדפדפן היה מצייר ריבוע תמונה שבורה בכל שורה —
        גרוע יותר משורה בלי תמונה בכלל.
      */}
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setUrl(null)}
      />
      <span className="absolute inset-0 flex items-center justify-center bg-ink-950/35">
        <Play size={size === 'sm' ? 16 : 20} className="text-bone-50 drop-shadow" fill="currentColor" />
      </span>
    </>
  )
  const frame = `relative shrink-0 overflow-hidden rounded-xl border border-ink-700 ${box}`

  if (!onOpen) {
    return (
      <span className={frame} aria-hidden="true">
        {inner}
      </span>
    )
  }

  return (
    <button
      onClick={onOpen}
      aria-label="פתח סרטון הדגמה"
      className={`${frame} active:scale-95 transition-transform`}
    >
      {inner}
    </button>
  )
}
