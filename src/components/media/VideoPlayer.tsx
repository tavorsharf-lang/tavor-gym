import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  TriangleAlert,
  WifiOff,
  X,
} from 'lucide-react'
import { deleteVideo, loadVideosFor, releaseVideos } from '@/db/mediaDb'
import { useHiddenVideosVersion } from '@/db/hiddenVideos'
import { videoMismatchNote } from '@/db/videoIssues'
import type { PlayableVideo } from '@/db/types'
import { Button, toast } from '@/components/ui'

/**
 * נגן ההדגמות.
 *
 * מנגן בלולאה, מושתק ו-playsInline — שלושתם חובה כדי ש-iOS ינגן בתוך הדף
 * ולא יקפוץ למסך מלא של המערכת.
 *
 * ההשתקה נאכפת ולא רק מוצהרת: לכל הסרטונים אין בכלל רצועת אודיו (הם נדחסים
 * עם ‎-an), אבל ברגע שסרטון ב-iOS מפסיק להיות mute הוא תופס את מושב האודיו
 * של המערכת — והמוזיקה שהמשתמש מנגן ברקע נעצרת. פקדי הנגן המובנים מציעים
 * כפתור השתקה, ולחיצה מקרית עליו הייתה עולה במוזיקה בלי להוסיף שום צליל.
 */
export function VideoPlayer({
  exerciseId,
  libraryId,
  exerciseName,
  open,
  onClose,
  startIndex = 0,
}: {
  exerciseId: string
  /** התרגיל המקביל במאגר — ממנו מגיעים סרטוני ההסבר */
  libraryId?: string
  exerciseName: string
  open: boolean
  onClose: () => void
  /** באיזה סרטון להיפתח. במאגר נכנסים לסרטון מסוים ולא לראשון. */
  startIndex?: number
}) {
  const [videos, setVideos] = useState<PlayableVideo[]>([])
  const [index, setIndex] = useState(startIndex)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  // אחרי מחיקה נשארים באותו מקום ברשימה במקום לקפוץ לסרטון הראשון
  const resumeAt = useRef<number | null>(null)

  // מחיקת סרטון משנה את הרשימה מתחת לרגליים של המסך הזה — הגרסה היא מה
  // שמחזיר אותו לטעון מחדש, בלי שהמחיקה תצטרך להכיר את מי שמציג
  const hiddenVersion = useHiddenVideosVersion()

  useEffect(() => {
    if (!open) return
    let list: PlayableVideo[] = []
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setIndex(resumeAt.current ?? startIndex)
    resumeAt.current = null

    loadVideosFor(exerciseId, libraryId).then((loaded) => {
      if (cancelled) {
        releaseVideos(loaded)
        return
      }
      list = loaded
      setVideos(loaded)
      setIndex((i) => Math.max(0, Math.min(i, loaded.length - 1)))
      setLoading(false)
    })

    return () => {
      cancelled = true
      releaseVideos(list)
      setVideos([])
    }
    // startIndex לא ברשימת התלויות: הוא נקרא פעם אחת בפתיחה, וכל שינוי שלו
    // בזמן שהנגן פתוח היה קופץ למשתמש מהסרטון שהוא צופה בו לסרטון אחר
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, libraryId, open, hiddenVersion])

  // הגיליון נסגר יחד עם הנגן, אחרת הוא היה ממתין פתוח לפתיחה הבאה
  useEffect(() => {
    if (!open) setConfirmingDelete(false)
  }, [open])

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

  // ההשתקה חוזרת ונאכפת גם אחרי שהמשתמש נגע בכפתור ההשתקה של הפקדים — אחרת
  // הסרטון תופס את מושב האודיו ועוצר את המוזיקה, בלי להשמיע כלום בתמורה
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const enforce = () => {
      if (!el.muted || el.volume !== 0) {
        el.muted = true
        el.volume = 0
      }
    }
    enforce()
    el.addEventListener('volumechange', enforce)
    el.addEventListener('play', enforce)
    return () => {
      el.removeEventListener('volumechange', enforce)
      el.removeEventListener('play', enforce)
    }
  })

  if (!open) return null

  const current = videos[index]
  const mismatch = videoMismatchNote(exerciseId)

  const confirmDelete = async (): Promise<void> => {
    if (!current) return
    const label = current.label
    resumeAt.current = Math.max(0, Math.min(index, videos.length - 2))
    setConfirmingDelete(false)
    try {
      await deleteVideo(current.id)
      toast(`${label} נמחק`, { tone: 'warn' })
    } catch {
      // המחיקה לא קרתה, ולכן גם אין למה לחזור — בלי האיפוס הזה הפתיחה הבאה
      // של הנגן הייתה נוחתת על סרטון אחר מזה שביקשו
      resumeAt.current = null
      toast('לא הצלחתי למחוק את הסרטון', { tone: 'warn' })
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950/97 backdrop-blur-xl animate-fade">
      <header
        className="flex items-center gap-2 px-4 pb-2"
        style={{ paddingTop: 'calc(var(--safe-t) + 0.75rem)' }}
      >
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-bone-50">{exerciseName}</h2>
          {/*
            במאגר לכל סרטון יש נושא משלו — הוא מה שמזהה אותו, ולכן הוא מחליף את
            "הדגמה N". השורה נשארת גם כשיש סרטון אחד, כי היא נושאת מידע ולא מיקום.
          */}
          {current ? (
            <p className="flex items-baseline justify-end gap-2 text-xs text-bone-500">
              {videos.length > 1 ? (
                <span className="tnum shrink-0">
                  {index + 1}/{videos.length}
                </span>
              ) : null}
              <span dir="ltr" className="truncate text-end">
                {current.label}
              </span>
            </p>
          ) : null}
        </div>
        {current ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            aria-label="מחק את הסרטון הזה"
            className="flex size-11 items-center justify-center rounded-full text-bone-500 active:bg-ink-800"
          >
            <Trash2 size={20} />
          </button>
        ) : null}
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

      {/*
        האישור יושב בתוך הנגן ולא ב-BottomSheet: הנגן כבר תופס את המסך כולו
        ב-portal משלו, וגיליון נוסף מעליו היה נפתח מאחוריו בחלק מהמצבים.
      */}
      {confirmingDelete && current && (
        <div className="animate-fade absolute inset-0 z-10 flex items-end bg-ink-950/85 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-video-title"
            className="w-full rounded-t-3xl border-t border-ink-700 bg-ink-900 p-5 pb-safe"
          >
            <h3 id="delete-video-title" className="text-lg font-extrabold text-bone-50">
              למחוק את הסרטון?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-bone-400">
              <span dir="ltr" className="font-semibold text-bone-200">
                {current.label}
              </span>{' '}
              לא יופיע יותר — לא כאן, לא בכרטיס התרגיל ולא במאגר. אפשר להחזיר את
              כל הסרטונים שנמחקו בהגדרות ← סרטונים.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="quiet"
                size="lg"
                className="flex-1"
                onClick={() => setConfirmingDelete(false)}
              >
                ביטול
              </Button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-card border border-hard-400/40 bg-hard-400/15 text-base font-extrabold text-hard-400"
              >
                <Trash2 size={18} />
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
