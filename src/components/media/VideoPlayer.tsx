import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Loader2, TriangleAlert, WifiOff, X } from 'lucide-react'
import { loadVideosFor, releaseVideos } from '@/db/mediaDb'
import { videoMismatchNote } from '@/db/videoIssues'
import type { PlayableVideo } from '@/db/types'

/**
 * נגן ההדגמות.
 *
 * מנגן בלולאה, מושתק ו-playsInline — שלושתם חובה כדי ש-iOS ינגן בתוך הדף
 * ולא יקפוץ למסך מלא של המערכת. הסרטונים ממילא בלי אודיו.
 */
export function VideoPlayer({
  exerciseId,
  exerciseName,
  open,
  onClose,
}: {
  exerciseId: string
  exerciseName: string
  open: boolean
  onClose: () => void
}) {
  const [videos, setVideos] = useState<PlayableVideo[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!open) return
    let list: PlayableVideo[] = []
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setIndex(0)

    loadVideosFor(exerciseId).then((loaded) => {
      if (cancelled) {
        releaseVideos(loaded)
        return
      }
      list = loaded
      setVideos(loaded)
      setLoading(false)
    })

    return () => {
      cancelled = true
      releaseVideos(list)
      setVideos([])
    }
  }, [exerciseId, open])

  // נעילת גלילת הרקע כל עוד הנגן פתוח
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const current = videos[index]
  const mismatch = videoMismatchNote(exerciseId)

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950/97 backdrop-blur-xl animate-fade">
      <header
        className="flex items-center gap-2 px-4 pb-2"
        style={{ paddingTop: 'calc(var(--safe-t) + 0.75rem)' }}
      >
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-bone-50">{exerciseName}</h2>
          {videos.length > 1 && (
            <p className="text-xs text-bone-500">
              הדגמה {index + 1} מתוך {videos.length}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="סגור"
          className="flex size-11 items-center justify-center rounded-full text-bone-400 active:bg-ink-800"
        >
          <X size={24} />
        </button>
      </header>

      {/*
        האזהרה יושבת מעל הסרטון ולא מתחתיו: צריך לראות אותה לפני שמתחילים
        לחקות את מה שקורה על המסך, לא אחרי.
      */}
      {mismatch ? (
        <p className="mx-4 mb-1 flex items-start gap-2 rounded-xl border border-warmup-400/25 bg-warmup-400/10 px-3 py-2 text-xs leading-relaxed text-warmup-400">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-bold">הסרטון לא תואם לתרגיל.</span> {mismatch}
          </span>
        </p>
      ) : null}

      <div className="relative flex flex-1 items-center justify-center px-3">
        {loading && <Loader2 className="animate-spin text-bone-600" size={32} />}

        {!loading && !current && (
          <p className="px-8 text-center text-sm text-bone-500">
            אין עדיין סרטון לתרגיל הזה. אפשר להוסיף אחד במסך התרגיל.
          </p>
        )}

        {!loading && current && failed && (
          <div className="flex flex-col items-center gap-3 px-8 text-center">
            <WifiOff className="text-bone-600" size={30} />
            <p className="text-sm text-bone-400">
              הסרטון לא זמין אופליין.
              <br />
              אפשר להתקין את כל הסרטונים למכשיר בהגדרות ← סרטונים.
            </p>
          </div>
        )}

        {!loading && current && !failed && (
          <video
            key={current.id}
            ref={videoRef}
            src={current.url}
            poster={current.posterUrl ?? undefined}
            className="max-h-full w-auto max-w-full rounded-card"
            autoPlay
            loop
            muted
            playsInline
            controls
            onError={() => setFailed(true)}
          />
        )}
      </div>

      {videos.length > 1 && (
        <div className="flex items-center justify-center gap-3 px-5 pb-safe pt-4">
          {/* ב-RTL חץ ימינה הוא "אחורה" — ולכן הוא זה שמחזיר לסרטון הקודם */}
          <button
            onClick={() => setIndex((i) => (i - 1 + videos.length) % videos.length)}
            aria-label="הסרטון הקודם"
            className="btn-ghost flex size-14 items-center justify-center rounded-full"
          >
            <ChevronRight size={22} />
          </button>
          <div className="flex gap-1.5">
            {videos.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setIndex(i)}
                aria-label={`הדגמה ${i + 1}`}
                className={`h-2 rounded-pill transition-all ${
                  i === index ? 'w-6 bg-flame-500' : 'w-2 bg-ink-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setIndex((i) => (i + 1) % videos.length)}
            aria-label="הסרטון הבא"
            className="btn-ghost flex size-14 items-center justify-center rounded-full"
          >
            <ChevronLeft size={22} />
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}
