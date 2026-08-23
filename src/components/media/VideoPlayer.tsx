import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  FolderInput,
  Loader2,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  WifiOff,
  X,
} from 'lucide-react'
import { cacheStreamedVideo, deleteVideo, loadVideosFor, releaseVideos } from '@/db/mediaDb'
import { useHiddenVideosVersion } from '@/db/hiddenVideos'
import { groupContextId, saveVideoMove, saveVideoOrder, useVideoPrefsVersion } from '@/db/videoPrefs'
import { videoMismatchNote } from '@/db/videoIssues'
import { db } from '@/db/db'
import { MUSCLE_GROUPS, MUSCLE_GROUP_BY_SIZE } from '@/db/types'
import type { Exercise, PlayableVideo } from '@/db/types'
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
/** מעל זה שורת הנקודות רחבה מהמסך, ומוחלפת בפס מיקום */
const DOTS_MAX = 10

/** כמה צריך להחליק כדי שזו תהיה החלפה ולא נגיעה */
const SWIPE_MIN_PX = 56

export function VideoPlayer({
  exerciseId,
  libraryId,
  exerciseName,
  open,
  onClose,
  startIndex = 0,
  startId,
}: {
  exerciseId: string
  /** התרגיל המקביל במאגר — ממנו מגיעים סרטוני ההסבר */
  libraryId?: string
  exerciseName: string
  open: boolean
  onClose: () => void
  /** באיזה סרטון להיפתח. במאגר נכנסים לסרטון מסוים ולא לראשון. */
  startIndex?: number
  /**
   * פתיחה לפי מזהה נכס — עמידה לסדר מותאם ולסרטונים מיובאים שמשתחלים
   * לרשימה. כשהוא קיים הוא גובר על startIndex.
   */
  startId?: string
}) {
  const [videos, setVideos] = useState<PlayableVideo[]>([])
  const [index, setIndex] = useState(startIndex)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  /** מזהה הנכס שמחכה לאישור מחיקה — מהכותרת או מפאנל הניהול */
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [managing, setManaging] = useState(false)
  /** מזהה הנכס שבוחרים לו יעד העברה */
  const [movingId, setMovingId] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  /*
    נקודת ההתחלה של המחווה ב-ref ולא במשתנה רגיל.

    בין pointerdown ל-pointerup יש רינדורים מחדש — הסרטון נטען, הפקדים
    מתעדכנים — וכל אחד מהם היה יוצר אובייקט חדש ומאפס את נקודת ההתחלה לאפס.
    התוצאה הייתה dx ענק מול הקצה השמאלי של המסך, כלומר קפיצת סרטון מנגיעה.
  */
  const swipeFrom = useRef<{ x: number; y: number } | null>(null)
  // האורך העדכני, כדי ש-`go` לא ייכנס לתלויות של כל מי שקורא לו
  const videosRef = useRef(videos)
  useLayoutEffect(() => {
    videosRef.current = videos
  })
  // אחרי מחיקה נשארים באותו מקום ברשימה במקום לקפוץ לסרטון הראשון
  const resumeAt = useRef<number | null>(null)
  /*
    טיוטת הסדר בין שמירה לטעינה-מחדש.

    כל שמירה מקפיצה prefsVersion, שמרוקן את הרשימה וטוען אותה מחדש — חלון של
    עשרות מילישניות שבו videos ריק או ישן. בלי הטיוטה, שתי הקשות חצים מהירות
    היו מחשבות שתיהן מאותו מערך ישן: השנייה דורסת את הראשונה, והזזה של כמה
    מקומות ברצף מתקדמת מקום אחד בלבד. הטיוטה מתאפסת כשהטעינה נוחתת.
  */
  const orderDraft = useRef<string[] | null>(null)

  // מחיקת סרטון, שינוי סדר או העברה משנים את הרשימה מתחת לרגליים של המסך
  // הזה — הגרסאות הן מה שמחזיר אותו לטעון מחדש, בלי שהשינוי יכיר את המציג
  const hiddenVersion = useHiddenVideosVersion()
  const prefsVersion = useVideoPrefsVersion()

  useEffect(() => {
    if (!open) return
    let list: PlayableVideo[] = []
    let cancelled = false
    setLoading(true)
    setFailed(false)
    const resume = resumeAt.current
    setIndex(resume ?? startIndex)
    resumeAt.current = null

    loadVideosFor(exerciseId, libraryId).then((loaded) => {
      if (cancelled) {
        releaseVideos(loaded)
        return
      }
      list = loaded
      /*
        הטיוטה מתאפסת רק כשהטעינה השיגה אותה. טעינה ישנה (שמירה ראשונה מתוך
        שתיים) עוד לא משקפת את ההקשה האחרונה — איפוס עיוור היה מחזיר את
        ההקשה הבאה לחשב מסדר ישן. חברות שונה (סרטון הועבר/נמחק) מאפסת תמיד,
        כי הטיוטה כבר לא מדברת על אותה רשימה.
      */
      const draft = orderDraft.current
      if (draft) {
        const loadedIds = loaded.map((v) => v.id)
        const pendingReorder =
          draft.length === loadedIds.length &&
          draft.every((id) => loadedIds.includes(id)) &&
          draft.join('|') !== loadedIds.join('|')
        if (!pendingReorder) orderDraft.current = null
      }
      setVideos(loaded)
      // פתיחה לפי מזהה גוברת: היא עמידה לסדר מותאם ולמיובאים שנכנסו באמצע
      const byId = resume === null && startId ? loaded.findIndex((v) => v.id === startId) : -1
      setIndex((i) => Math.max(0, Math.min(byId >= 0 ? byId : i, loaded.length - 1)))
      setLoading(false)
    })

    return () => {
      cancelled = true
      releaseVideos(list)
      setVideos([])
    }
    // startIndex/startId לא ברשימת התלויות: הם נקראים פעם אחת בפתיחה, וכל שינוי
    // שלהם בזמן שהנגן פתוח היה קופץ למשתמש מהסרטון שהוא צופה בו לסרטון אחר
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, libraryId, open, hiddenVersion, prefsVersion])

  // כישלון שייך לסרטון שנכשל, לא לנגן. בלי האיפוס הזה סרטון אחד שלא הותקן
  // נעל את כל השאר על מסך "לא זמין אופליין" — גם את אלה שיושבים במכשיר.
  useEffect(() => {
    setFailed(false)
  }, [index])

  // הגיליונות נסגרים יחד עם הנגן, אחרת הם היו ממתינים פתוחים לפתיחה הבאה
  useEffect(() => {
    if (!open) {
      setConfirmingDelete(null)
      setManaging(false)
      setMovingId(null)
    }
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

  /**
   * מעבר מחזורי בין הסרטונים.
   *
   * מחזורי ולא חסום בקצוות: ברשימה של 23 סרטוני הסבר, "הבא" שמפסיק לעבוד
   * בסרטון האחרון מחייב לחזור אחורה 22 פעם. `step` הוא +1 קדימה ו-‎-1 אחורה.
   */
  const go = useCallback((step: number) => {
    setIndex((i) => {
      const n = videosRef.current.length
      return n ? (i + step + n) % n : 0
    })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      // המסך כולו RTL: הבא יושב משמאל, ולכן חץ שמאלה מקדם וחץ ימינה מחזיר
      if (e.key === 'ArrowLeft') go(1)
      if (e.key === 'ArrowRight') go(-1)
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, go])

  /*
    סרטון שנוגן מהרשת נשמר למכשיר.

    בלי זה אותם בייטים יורדים מחדש כמעט בכל צפייה — הקאש של GitHub Pages קצר —
    והסרטון עדיין לא זמין בחדר בלי קליטה. זו לא התקנה מאחורי הגב: יורד בדיוק
    מה שהמשתמש ממילא הוריד כדי לצפות. ההמתנה עד `canplay` מוודאת שמורידים רק
    מה שבאמת נצפה ולא כל דבר שהנגן נגע בו לרגע.
  */
  useEffect(() => {
    const el = videoRef.current
    const asset = videos[index]
    if (!el || !asset || asset.isLocal) return
    const onReady = () => void cacheStreamedVideo(asset.id)
    el.addEventListener('canplay', onReady, { once: true })
    return () => el.removeEventListener('canplay', onReady)
  }, [videos, index])

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
  const many = videos.length > 1
  const mismatch = videoMismatchNote(exerciseId)

  /*
    החלקה להחלפת סרטון.

    הסף כפול בכוונה: מרחק מינימלי, *וגם* דרישה שהתנועה תהיה בעיקר אופקית.
    לנגן יש פקדים מובנים, והמשתמש גורר עליהם את סרגל הזמן — בלי התנאי השני כל
    גרירה קטנה על הסרגל הייתה מדלגת סרטון. אין `preventDefault` מאותה סיבה:
    נגיעה רגילה חייבת להמשיך להגיע לפקדים.
  */
  const onSwipeStart = (e: React.PointerEvent) => {
    swipeFrom.current = { x: e.clientX, y: e.clientY }
  }
  const onSwipeEnd = (e: React.PointerEvent) => {
    const from = swipeFrom.current
    swipeFrom.current = null
    if (!many || !from) return
    const dx = e.clientX - from.x
    const dy = e.clientY - from.y
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return
    // התוכן זז עם האצבע: גרירה שמאלה מביאה את מה שמימין — וב-RTL זה הבא
    go(dx < 0 ? 1 : -1)
  }

  const deleteTarget = confirmingDelete
    ? (videos.find((v) => v.id === confirmingDelete) ?? null)
    : null

  const confirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return
    const label = deleteTarget.label
    // נשארים על הסרטון שצפינו בו; אם מחקנו דווקא אותו — על שכנו
    const remaining = videos.filter((v) => v.id !== deleteTarget.id)
    const watching = current && current.id !== deleteTarget.id
      ? remaining.findIndex((v) => v.id === current.id)
      : Math.min(index, remaining.length - 1)
    resumeAt.current = Math.max(0, watching)
    setConfirmingDelete(null)
    try {
      await deleteVideo(deleteTarget.id)
      toast(`${label} נמחק`, { tone: 'warn' })
    } catch {
      // המחיקה לא קרתה, ולכן גם אין למה לחזור — בלי האיפוס הזה הפתיחה הבאה
      // של הנגן הייתה נוחתת על סרטון אחר מזה שביקשו
      resumeAt.current = null
      toast('לא הצלחתי למחוק את הסרטון', { tone: 'warn' })
    }
  }

  /** הזזת סרטון מעלה/מטה ושמירת הסדר החדש להקשר הזה */
  const moveInOrder = async (assetId: string, direction: -1 | 1): Promise<void> => {
    const ids = orderDraft.current ?? videos.map((v) => v.id)
    const from = ids.indexOf(assetId)
    const to = from + direction
    if (from < 0 || to < 0 || to >= ids.length) return
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, assetId)
    orderDraft.current = next
    // הרשימה תיטען מחדש דרך prefsVersion — נשארים על הסרטון שצפינו בו
    resumeAt.current = current ? Math.max(0, next.indexOf(current.id)) : 0
    try {
      await saveVideoOrder(exerciseId, next)
    } catch {
      resumeAt.current = null
      toast('שמירת הסדר נכשלה', { tone: 'warn' })
    }
  }

  /** העברת סרטון ליעד אחר — תרגיל או מדף קבוצת שריר */
  const moveTo = async (assetId: string, target: string, targetLabel: string): Promise<void> => {
    const stays = videos.filter((v) => v.id !== assetId)
    const watching = current && current.id !== assetId
      ? stays.findIndex((v) => v.id === current.id)
      : Math.min(index, stays.length - 1)
    resumeAt.current = Math.max(0, watching)
    setMovingId(null)
    try {
      await saveVideoMove(assetId, target)
      toast(`הסרטון עבר אל ${targetLabel}`)
    } catch {
      resumeAt.current = null
      toast('ההעברה נכשלה', { tone: 'warn' })
    }
  }

  return createPortal(
    /*
      role ו-aria-modal אינם קישוט: הנגן הוא שכבה מלאה מעל המסך, ובלעדיהם
      קורא-מסך רואה אותו כתוכן שנוסף לדף ולא כחלון. הם גם מה שמאפשר לגיליון
      שמתחתיו לדעת שהוא כבר לא העליון ולוותר על כליאת הפוקוס שלו.
    */
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink-950/97 backdrop-blur-xl animate-fade"
      role="dialog"
      aria-modal="true"
      aria-label={`סרטוני הדגמה — ${exerciseName}`}
    >
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
        {videos.length > 0 ? (
          <button
            onClick={() => setManaging(true)}
            aria-label="ניהול הסרטונים — סדר, העברה ומחיקה"
            className="flex size-11 items-center justify-center rounded-full text-bone-500 active:bg-ink-800"
          >
            <SlidersHorizontal size={20} />
          </button>
        ) : null}
        {current ? (
          <button
            onClick={() => setConfirmingDelete(current.id)}
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

      <div
        className="relative flex flex-1 items-center justify-center px-3 touch-pan-y"
        onPointerDown={onSwipeStart}
        onPointerUp={onSwipeEnd}
      >
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

        {/*
          החיצים יושבים על הסרטון ולא רק בתחתית המסך.

          עם 23 סרטוני הסבר המעבר הוא הפעולה השכיחה כאן, והיד שאוחזת בטלפון
          מגיעה לצדדים בלי לשנות אחיזה. הם מעל שוליים ולא מעל הסרטון עצמו, כדי
          לא לכסות את הפקדים המובנים שבתחתיתו.
        */}
        {many && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="הסרטון הקודם"
              className="absolute inset-y-0 end-0 flex w-14 items-center justify-center text-bone-300 active:text-flame-400"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-ink-900/70 backdrop-blur-sm">
                <ChevronRight size={24} />
              </span>
            </button>
            <button
              onClick={() => go(1)}
              aria-label="הסרטון הבא"
              className="absolute inset-y-0 start-0 flex w-14 items-center justify-center text-bone-300 active:text-flame-400"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-ink-900/70 backdrop-blur-sm">
                <ChevronLeft size={24} />
              </span>
            </button>
          </>
        )}
      </div>

      {/*
        מחוון מיקום, לא פקד ניווט — הניווט עבר לחיצים שעל הסרטון ולהחלקה.

        שורת הנקודות הייתה נקודה לכל סרטון. זה עבד כשהיו שלוש הדגמות, אבל אחרי
        שסרטוני המאגר נכנסו לאימון יש עד 23 — כלומר שורה ברוחב 550px שגולשת
        מהמסך ונקודות שאי אפשר לפגוע בהן. מעל הסף מוצג פס מיקום שלא תלוי בכמות.
      */}
      {many && (
        <div className="flex items-center justify-center px-5 pb-safe pt-4">
          {videos.length <= DOTS_MAX ? (
            <div className="flex gap-1.5">
              {videos.map((v, i) => (
                /* אזור הלחיצה 44px, הנקודה עצמה נשארת קטנה — הוויזואל לא משתנה */
                <button
                  key={v.id}
                  onClick={() => setIndex(i)}
                  aria-label={`סרטון ${i + 1}`}
                  aria-current={i === index}
                  className="flex h-11 w-6 items-center justify-center"
                >
                  <span
                    className={`h-2 rounded-pill transition-all ${
                      i === index ? 'w-6 bg-flame-500' : 'w-2 bg-ink-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-11 w-full max-w-64 items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-pill bg-ink-700"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={videos.length}
                aria-valuenow={index + 1}
                aria-label="מיקום ברשימת הסרטונים"
              >
                <span
                  className="block h-full rounded-pill bg-flame-500 transition-all duration-200"
                  style={{ width: `${((index + 1) / videos.length) * 100}%` }}
                />
              </div>
              <span className="tnum shrink-0 text-xs font-bold text-bone-400" dir="ltr">
                {index + 1}/{videos.length}
              </span>
            </div>
          )}
        </div>
      )}

      {/*
        פאנל הניהול יושב בתוך הנגן ולא ב-BottomSheet: הנגן כבר תופס את המסך
        כולו ב-portal משלו, וגיליון נוסף מעליו היה נפתח מאחוריו בחלק מהמצבים.
        חיצים ולא גרירה — גרירה במגע על iOS standalone נלחמת בגלילה.
      */}
      {managing && (
        <div className="animate-fade absolute inset-0 z-10 flex flex-col bg-ink-950/95 backdrop-blur-md">
          <header
            className="flex items-center gap-2 px-4 pb-2"
            style={{ paddingTop: 'calc(var(--safe-t) + 0.75rem)' }}
          >
            <h3 className="min-w-0 flex-1 truncate text-base font-bold text-bone-50">
              ניהול סרטונים — {exerciseName}
            </h3>
            <button
              onClick={() => setManaging(false)}
              aria-label="סגור את הניהול"
              className="flex size-11 items-center justify-center rounded-full text-bone-400 active:bg-ink-800"
            >
              <X size={24} />
            </button>
          </header>

          <p className="px-4 pb-2 text-xs leading-relaxed text-bone-500">
            הראשון ברשימה הוא שנפתח ראשון ומופיע בתמונת הכרטיס. אפשר גם להעביר
            סרטון לתרגיל אחר או למדף של קבוצת שריר, או למחוק אותו מכל האפליקציה.
          </p>

          <ul className="flex-1 space-y-2 overflow-y-auto px-4 pb-safe">
            {videos.map((v, i) => (
              <li key={v.id} className="card flex items-center gap-1 p-2">
                <span className="min-w-0 flex-1 ps-1">
                  <span
                    dir="ltr"
                    className="block truncate text-end text-[0.8125rem] font-semibold text-bone-100"
                  >
                    {v.label}
                  </span>
                  <span className="meta tnum mt-0.5 block">
                    {Math.round(v.durationSec)} שניות{v.isLocal ? ' · במכשיר' : ''}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => void moveInOrder(v.id, -1)}
                  aria-label={`העלה למעלה: ${v.label}`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-bone-400 active:bg-ink-800 disabled:opacity-25"
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  type="button"
                  disabled={i === videos.length - 1}
                  onClick={() => void moveInOrder(v.id, 1)}
                  aria-label={`הורד למטה: ${v.label}`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-bone-400 active:bg-ink-800 disabled:opacity-25"
                >
                  <ArrowDown size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setMovingId(v.id)}
                  aria-label={`העבר לתרגיל אחר: ${v.label}`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-flame-400 active:bg-ink-800"
                >
                  <FolderInput size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(v.id)}
                  aria-label={`מחק: ${v.label}`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-hard-400 active:bg-ink-800"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {movingId && (
        <MoveTargetPicker
          currentContext={exerciseId}
          onPick={(target, label) => void moveTo(movingId, target, label)}
          onClose={() => setMovingId(null)}
        />
      )}

      {deleteTarget && (
        <div className="animate-fade absolute inset-0 z-30 flex items-end bg-ink-950/85 backdrop-blur-sm">
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
                {deleteTarget.label}
              </span>{' '}
              לא יופיע יותר — לא כאן, לא בכרטיס התרגיל ולא במאגר. אפשר להחזיר את
              כל הסרטונים שנמחקו בהגדרות ← סרטונים.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="quiet"
                size="lg"
                className="flex-1"
                onClick={() => setConfirmingDelete(null)}
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

/**
 * בורר יעד ההעברה: מדפי קבוצות השריר קודם, ואז התרגילים מהקטלוג.
 *
 * חי בתוך ה-portal של הנגן (שכבת z-20, מעל פאנל הניהול ומתחת לאישור המחיקה)
 * מאותה סיבה שהאישור שם: BottomSheet חיצוני היה נפתח מאחורי הנגן.
 */
function MoveTargetPicker({
  currentContext,
  onPick,
  onClose,
}: {
  currentContext: string
  onPick: (target: string, label: string) => void
  onClose: () => void
}) {
  const [exercises, setExercises] = useState<Exercise[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void db.exercises
      .toArray()
      .then((all) => {
        if (cancelled) return
        setExercises(all.filter((e) => e.isActive).sort((a, b) => a.order - b.order))
      })
      .catch(() => {
        if (!cancelled) setExercises([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const groups = useMemo(
    () =>
      MUSCLE_GROUP_BY_SIZE.map((g) => ({
        target: groupContextId(g),
        label: `מדף ${MUSCLE_GROUPS[g].label}`,
      })).filter(({ target }) => target !== currentContext),
    [currentContext]
  )

  return (
    <div className="animate-fade absolute inset-0 z-20 flex flex-col bg-ink-950/95 backdrop-blur-md">
      <header
        className="flex items-center gap-2 px-4 pb-2"
        style={{ paddingTop: 'calc(var(--safe-t) + 0.75rem)' }}
      >
        <h3 className="min-w-0 flex-1 text-base font-bold text-bone-50">לאן להעביר את הסרטון?</h3>
        <button
          onClick={onClose}
          aria-label="בטל העברה"
          className="flex size-11 items-center justify-center rounded-full text-bone-400 active:bg-ink-800"
        >
          <X size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-safe">
        <h4 className="meta mb-2">מדף של קבוצת שריר — לסרטונים שמדגימים כמה תרגילים</h4>
        <div className="mb-5 flex flex-wrap gap-2">
          {groups.map(({ target, label }) => (
            <button
              key={target}
              type="button"
              onClick={() => onPick(target, label)}
              className="flex min-h-12 items-center rounded-pill border border-ink-700 bg-ink-850 px-4 text-sm font-bold text-bone-200 active:bg-ink-800"
            >
              {label}
            </button>
          ))}
        </div>

        <h4 className="meta mb-2">התרגילים שלי</h4>
        {exercises === null ? (
          <Loader2 className="mx-auto my-6 animate-spin text-bone-600" size={24} />
        ) : (
          <ul className="space-y-2">
            {exercises
              .filter((e) => e.id !== currentContext)
              .map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onPick(e.id, e.name)}
                    className="card flex min-h-13 w-full items-center gap-3 px-3 text-start active:bg-ink-800"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-bone-50">
                      {e.name}
                    </span>
                    <span className="meta shrink-0">{MUSCLE_GROUPS[e.muscleGroup].label}</span>
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
