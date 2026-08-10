import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { loadThumbnailFor } from '@/db/mediaDb'

/**
 * התמונה הממוזערת של סרטון ההדגמה, כפי שהיא מופיעה בכרטיס התרגיל.
 * לחיצה פותחת את הנגן. אם אין סרטון — לא מציגים כלום.
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
  onOpen: () => void
  size?: 'sm' | 'md'
}) {
  const [url, setUrl] = useState<string | null>(null)

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
  }, [exerciseId, libraryId])

  if (!url) return null

  const box = size === 'sm' ? 'h-14 w-14' : 'h-20 w-20'

  return (
    <button
      onClick={onOpen}
      aria-label="פתח סרטון הדגמה"
      className={`relative shrink-0 overflow-hidden rounded-xl border border-ink-700 ${box} active:scale-95 transition-transform`}
    >
      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      <span className="absolute inset-0 flex items-center justify-center bg-ink-950/35">
        <Play size={size === 'sm' ? 16 : 20} className="text-bone-50 drop-shadow" fill="currentColor" />
      </span>
    </button>
  )
}
