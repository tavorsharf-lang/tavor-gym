import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { loadThumbnailFor } from '@/db/mediaDb'
import { useHiddenVideosVersion } from '@/db/hiddenVideos'

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
  const [url, setUrl] = useState<string | null>(null)
  // מחיקת הסרטון האחרון של תרגיל צריכה להעלים את התמונה מיד, בלי רענון מסך
  const hiddenVersion = useHiddenVideosVersion()

  useEffect(() => {
    let created: string | null = null
    let cancelled = false
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
      setUrl(null)
    }
  }, [exerciseId, libraryId, hiddenVersion])

  if (!url) return null

  const box = size === 'sm' ? 'h-14 w-14' : 'h-20 w-20'
  const inner = (
    <>
      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
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
