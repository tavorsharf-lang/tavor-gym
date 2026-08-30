import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Copy, Film, GraduationCap, Plus, Trash2, TriangleAlert, Video, X } from 'lucide-react'
import { saveSettings } from '@/db/db'
import { getAllExercises } from '@/db/queries'
import {
  allVisibleClips,
  assetUrl,
  bundledId,
  bundledVideosFor,
  mediaDb,
  mediaUsage,
  deleteVideo,
} from '@/db/mediaDb'
import { groupOfContext, useVideoPrefs } from '@/db/videoPrefs'
import { VIDEO_HASHES } from '@/db/videoHashes'
import { findDuplicateGroups, type HashedClip } from '@/domain/duplicates'
import { restoreHiddenVideos, useHiddenVideoIds } from '@/db/hiddenVideos'
import { videoMismatchNote } from '@/db/videoIssues'
import { VideoPlayer } from '@/components/media/VideoPlayer'
import { VIDEO_COUNT, VIDEO_MANIFEST, VIDEO_TOTAL_BYTES } from '@/db/videoManifest'
import {
  LIBRARY_CATALOG,
  LIBRARY_COUNT,
  LIBRARY_MANIFEST,
  LIBRARY_TOTAL_BYTES,
} from '@/db/libraryManifest'
import type { BundledVideo } from '@/db/videoManifest'
import type { VideoAsset } from '@/db/types'
import { MUSCLE_GROUPS } from '@/db/types'
import { formatBytes, newId } from '@/domain/units'
import { ensurePersisted, useStorageStatus } from '@/hooks/useStorageStatus'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { BottomSheet, Button, EmptyState, toast } from '@/components/ui'

/**
 * סרטונים ואחסון.
 *
 * הסרטונים המצורפים לא נכנסים למטמון של ה-service worker אלא מותקנים מכאן
 * ל-IndexedDB: 26 מגה-בייט בהתקנה הראשונה היו הופכים את פתיחת האפליקציה
 * לשברירית, וכאן המשתמש בוחר מתי ורואה התקדמות.
 */

/** מעל זה מזהירים לפני ייבוא — סרטון בודד שיאכל את המכסה */
const LARGE_VIDEO_BYTES = 40 * 1024 * 1024
/** הצלע הארוכה של התמונה הממוזערת */
const THUMB_MAX_PX = 400

interface InstallJob {
  exerciseId: string
  index: number
  video: BundledVideo
}

function jobsFrom(
  manifest: Record<string, BundledVideo[]>,
  hidden: ReadonlySet<string>
): InstallJob[] {
  const jobs: InstallJob[] = []
  for (const [exerciseId, list] of Object.entries(manifest)) {
    list.forEach((video, index) => {
      // סרטון שנמחק לא מותקן מחדש. בלי זה כל התקנה הייתה מחזירה אותו למכשיר,
      // וההחלטה למחוק אותו הייתה נמחקת בשקט על ידי הכפתור שממול.
      if (hidden.has(bundledId(video.src))) return
      jobs.push({ exerciseId, index, video })
    })
  }
  return jobs
}

/** כמה סרטונים במניפסט הזה נמחקו — כדי שהמונים יימדדו מול מה שבאמת אמור להיות */
function hiddenIn(
  manifest: Record<string, BundledVideo[]>,
  hidden: ReadonlySet<string>
): number {
  if (hidden.size === 0) return 0
  let n = 0
  for (const list of Object.values(manifest)) {
    for (const video of list) if (hidden.has(bundledId(video.src))) n += 1
  }
  return n
}

/**
 * שני המקורות מותקנים בנפרד ובכוונה.
 *
 * הדגמות התוכנית הן מה שצריך באמצע אימון, והן שוקלות מעט. המאגר הלימודי גדול
 * פי כמה ומשמש ללימוד בבית — מיזוג של השניים לכפתור אחד היה מכריח את מי שרוצה
 * רק את ההדגמות להוריד גם את כל השאר.
 */
type InstallSource = 'program' | 'library'

async function fetchBlob(url: string, signal: AbortSignal): Promise<Blob> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`שגיאת רשת ${res.status}`)
  return res.blob()
}

/** ממתין לאירוע אחד על אלמנט הווידאו, עם תקרת זמן כדי לא להיתקע על קובץ בעייתי */
function waitFor(video: HTMLVideoElement, event: string, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = () => {
      video.removeEventListener(event, ok)
      video.removeEventListener('error', fail)
      window.clearTimeout(timer)
    }
    const ok = () => {
      done()
      resolve()
    }
    const fail = () => {
      done()
      reject(new Error('לא הצלחתי לקרוא את הסרטון'))
    }
    const timer = window.setTimeout(fail, timeoutMs)
    video.addEventListener(event, ok, { once: true })
    video.addEventListener('error', fail, { once: true })
  })
}

interface VideoMeta {
  thumbnail: Blob | null
  width: number
  height: number
  durationSec: number
}

/**
 * קורא מידות ומשך, ומייצר תמונה ממוזערת מפריים בשנייה הראשונה.
 * לעולם לא זורק — סרטון בלי תמונה ממוזערת עדיף על ייבוא שנכשל.
 */
async function readVideoMeta(file: Blob): Promise<VideoMeta> {
  const empty: VideoMeta = { thumbnail: null, width: 0, height: 0, durationSec: 0 }
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'metadata'
  video.src = url

  try {
    await waitFor(video, 'loadedmetadata')
    const width = video.videoWidth
    const height = video.videoHeight
    const durationSec = Number.isFinite(video.duration) ? Math.round(video.duration * 10) / 10 : 0

    try {
      // ספארי מצייר לקנבס רק פריים שכבר פוענח — לכן קופצים ומחכים ל-seeked
      video.currentTime = durationSec > 2 ? 1 : durationSec / 2
      await waitFor(video, 'seeked')
      const scale = Math.min(1, THUMB_MAX_PX / Math.max(width, height, 1))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(width * scale))
      canvas.height = Math.max(1, Math.round(height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) return { thumbnail: null, width, height, durationSec }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const thumbnail = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
      })
      return { thumbnail, width, height, durationSec }
    } catch {
      return { thumbnail: null, width, height, durationSec }
    }
  } catch {
    return empty
  } finally {
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
}

/**
 * שם קריא להקשר שאינו תרגיל בקטלוג — מדף של קבוצת שריר, או מזהה שהתייתם
 * אחרי ייבוא מחודש של המניפסט. בלי זה סרטון שהועבר למדף הוצג כ"תרגיל שאינו
 * בקטלוג", כלומר כתקלה, בזמן שהוא בדיוק במקום שהמשתמש שם אותו.
 */
function describeOwner(ownerId: string): string {
  const group = groupOfContext(ownerId)
  if (group) return `מדף ${MUSCLE_GROUPS[group].label}`
  return 'תרגיל שאינו בקטלוג'
}

export function MediaScreen(): JSX.Element {
  const storage = useStorageStatus()
  const hidden = useHiddenVideoIds()

  const exercises = useLiveQuery(() => getAllExercises(true), [], [])

  /*
    מועמדים לכפילות — מחושב מטבלת טביעות סטטית, ולכן זול מספיק ל-useMemo
    רגיל בלי שאילתה. שני התלויות אמיתיות: מחיקה מסירה מועמד מהרשימה,
    והעברה משנה תחת איזה תרגיל הוא מוצג.
  */
  /** הסרטון שנפתח להשוואה מתוך רשימת הכפילויות */
  const [preview, setPreview] = useState<{ ownerId: string; assetId: string } | null>(null)
  const videoPrefs = useVideoPrefs()
  const duplicateGroups = useMemo(() => {
    const nameOf = new Map<string, string>()
    for (const ex of exercises) nameOf.set(ex.id, ex.name)
    for (const lib of LIBRARY_CATALOG) nameOf.set(lib.id, lib.nameHe)

    const clips: HashedClip[] = allVisibleClips(hidden, videoPrefs).map((c) => ({
      id: c.id,
      poster: c.clip.poster,
      label: c.topic ?? c.clip.src.split('/').pop() ?? c.id,
      ownerId: c.ownerId,
      ownerName: nameOf.get(c.ownerId) ?? describeOwner(c.ownerId),
      durationSec: c.clip.durationSec,
      sizeBytes: c.clip.sizeBytes,
    }))
    return findDuplicateGroups(clips, VIDEO_HASHES)
  }, [exercises, hidden, videoPrefs])
  const usage = useLiveQuery(() => mediaUsage(), [], { count: 0, bytes: 0 })
  const installedBundled = useLiveQuery(
    () => mediaDb.videos.where('origin').equals('bundled').count(),
    [],
    0
  )
  const importedByExercise = useLiveQuery(
    async () => {
      const map = new Map<string, { id: string; label: string; sizeBytes: number }[]>()
      await mediaDb.videos.each((v) => {
        if (v.origin !== 'imported') return
        const list = map.get(v.exerciseId) ?? []
        list.push({ id: v.id, label: v.label, sizeBytes: v.sizeBytes })
        map.set(v.exerciseId, list)
      })
      return map
    },
    [],
    new Map<string, { id: string; label: string; sizeBytes: number }[]>()
  )

  const installedLibrary = useLiveQuery(
    () => mediaDb.videos.where('origin').equals('library').count(),
    [],
    0
  )

  const [progress, setProgress] = useState<{
    done: number
    total: number
    source: InstallSource
  } | null>(null)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [clearOpen, setClearOpen] = useState(false)
  const cancelRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const installing = progress !== null
  // המונים נמדדים מול מה שאמור להיות במכשיר — כלומר בלי מה שנמחק
  const programTotal = VIDEO_COUNT - hiddenIn(VIDEO_MANIFEST, hidden)
  const libraryTotal = LIBRARY_COUNT - hiddenIn(LIBRARY_MANIFEST, hidden)
  const missing = programTotal - installedBundled
  const missingLibrary = libraryTotal - installedLibrary

  // יציאה מהמסך עוצרת את ההורדה. בלי זה היא הייתה ממשיכה ברקע בלי מד התקדמות
  // ובלי כפתור עצירה, וחזרה למסך הייתה מתחילה התקנה שנייה במקביל על אותו מסד.
  useEffect(() => {
    return () => {
      cancelRef.current = true
      abortRef.current?.abort()
    }
  }, [])

  const install = async (source: InstallSource): Promise<void> => {
    // שומר הכניסה היחיד הוא ה-ref: מצב ה-progress מתעדכן רק ברינדור הבא,
    // ולחיצה כפולה מהירה הייתה מספיקה כדי להפעיל שתי לולאות במקביל.
    if (abortRef.current) return

    /*
      בקשת אחסון קבוע לפני הכתיבה הגדולה ביותר שהאפליקציה עושה (עד ~192MB).

      בלי "persistent" הדפדפן רשאי לפנות את כל ה-IndexedDB כשנגמר המקום —
      כלומר גם את היסטוריית האימונים, לא רק את הסרטונים. עד כאן הקריאה
      האוטומטית היחידה הייתה בסוף אימון שלם, ודווקא המסלול שממלא את הדיסק לא
      ביקש כלום. בלשונית זה מחזיר false ולא עולה כלום; באפליקציה מותקנת ספארי
      מאשרת בשקט בלי דיאלוג. לא חוסם את ההתקנה בשום מקרה.
    */
    void ensurePersisted()

    const jobs = jobsFrom(source === 'program' ? VIDEO_MANIFEST : LIBRARY_MANIFEST, hidden)
    const controller = new AbortController()
    abortRef.current = controller
    cancelRef.current = false
    setProgress({ done: 0, total: jobs.length, source })

    let done = 0
    try {
      for (const job of jobs) {
        if (cancelRef.current) break
        const id = bundledId(job.video.src)
        // התקנה מתחדשת: מה שכבר כאן מדולג, כך שאפשר לעצור ולהמשיך אחר כך
        const existing = await mediaDb.videos.get(id)
        if (!existing) {
          const [blob, poster] = await Promise.all([
            fetchBlob(assetUrl(job.video.src), controller.signal),
            // פוסטר חסר הוא לא סיבה להפיל התקנה — אבל ביטול כן: בלי ההבחנה הזאת
            // היינו כותבים נכס בלי תמונה ממוזערת, וההתקנה החוזרת מדלגת עליו לנצח
            fetchBlob(assetUrl(job.video.poster), controller.signal).catch((err: unknown) => {
              if (controller.signal.aborted) throw err
              return null
            }),
          ])
          // ההורדה יכולה להסתיים בדיוק כשהמשתמש עוצר או יוצא מהמסך — בודקים שוב
          // ממש לפני הכתיבה כדי שביטול לא ישאיר נכס שנכתב אחרי העצירה
          if (cancelRef.current || controller.signal.aborted) break
          const asset: VideoAsset = {
            id,
            exerciseId: job.exerciseId,
            origin: source === 'program' ? 'bundled' : 'library',
            blob,
            thumbnailBlob: poster,
            label: `הדגמה ${job.index + 1}`,
            durationSec: job.video.durationSec,
            sizeBytes: blob.size,
            width: job.video.width,
            height: job.video.height,
            createdAt: Date.now(),
          }
          await mediaDb.videos.put(asset)
        }
        done += 1
        setProgress({ done, total: jobs.length, source })
      }

      if (cancelRef.current || controller.signal.aborted) {
        toast('ההתקנה נעצרה. מה שכבר ירד נשמר במכשיר')
      } else {
        // videosInstalledAt מתעד את הדגמות התוכנית בלבד — המאגר נלווה ולא
        // אמור להשפיע על החיווי "הסרטונים מותקנים" במקומות אחרים באפליקציה
        if (source === 'program') await saveSettings({ videosInstalledAt: Date.now() })
        toast(source === 'program' ? 'כל ההדגמות במכשיר' : 'המאגר במכשיר', { tone: 'success' })
      }
    } catch (err) {
      // לא כל דפדפן זורק DOMException על ביטול — הסיגנל עצמו הוא המקור האמין
      const aborted =
        controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')
      toast(
        aborted
          ? 'ההתקנה נעצרה. מה שכבר ירד נשמר במכשיר'
          : `ההתקנה נכשלה — ${err instanceof Error ? err.message : 'שגיאה לא צפויה'}`,
        { tone: aborted ? 'info' : 'warn' }
      )
    } finally {
      abortRef.current = null
      setProgress(null)
      // המסך הזה כל תפקידו לדווח על מקום — בלי רענון הוא היה מציג את המספרים
      // שמלפני ההתקנה. refresh מתעלם מעצמו אחרי unmount, ולכן בטוח גם כאן.
      await storage.refresh()
    }
  }

  const cancelInstall = (): void => {
    cancelRef.current = true
    abortRef.current?.abort()
  }

  const clearBundled = async (): Promise<void> => {
    try {
      await mediaDb.videos.where('origin').equals('bundled').delete()
      await saveSettings({ videosInstalledAt: null })
      setClearOpen(false)
      toast('הסרטונים המצורפים נמחקו מהמכשיר')
    } catch {
      toast('המחיקה נכשלה', { tone: 'warn' })
    } finally {
      await storage.refresh()
    }
  }

  const clearLibrary = async (): Promise<void> => {
    try {
      await mediaDb.videos.where('origin').equals('library').delete()
      toast('המאגר נמחק מהמכשיר')
    } catch {
      toast('המחיקה נכשלה', { tone: 'warn' })
    } finally {
      await storage.refresh()
    }
  }

  const importVideo = async (exerciseId: string, file: File): Promise<void> => {
    if (file.size > LARGE_VIDEO_BYTES) {
      toast(`הסרטון שוקל ${formatBytes(file.size)} — הוא יתפוס הרבה מהמקום במכשיר`, {
        tone: 'warn',
      })
    }
    setImportingId(exerciseId)
    try {
      const meta = await readVideoMeta(file)
      const asset: VideoAsset = {
        id: newId('vid-'),
        exerciseId,
        origin: 'imported',
        blob: file,
        thumbnailBlob: meta.thumbnail,
        label: file.name.replace(/\.[^.]+$/, '') || 'סרטון שלי',
        durationSec: meta.durationSec,
        sizeBytes: file.size,
        width: meta.width,
        height: meta.height,
        createdAt: Date.now(),
      }
      await mediaDb.videos.put(asset)
      toast('הסרטון נוסף לתרגיל', { tone: 'success' })
    } catch {
      toast('לא הצלחתי לשמור את הסרטון', { tone: 'warn' })
    } finally {
      setImportingId(null)
      await storage.refresh()
    }
  }

  const deleteImported = async (id: string): Promise<void> => {
    try {
      /*
        דרך deleteVideo ולא ישירות מהטבלה: הוא מנקה גם את העדפות הסדר
        וההעברות של המזהה (forgetVideoPrefs) ומודיע למסכים. מחיקה ישירה
        השאירה שיוך-רפאים — מדף קבוצה שסופר סרטון שכבר לא קיים.
      */
      await deleteVideo(id)
      toast('הסרטון נמחק')
    } catch {
      toast('המחיקה נכשלה', { tone: 'warn' })
    } finally {
      await storage.refresh()
    }
  }

  const percent = progress && progress.total > 0 ? (progress.done / progress.total) * 100 : 0
  const quota = storage.quotaBytes
  const used = storage.usageBytes
  const usedPercent = used !== null && quota !== null && quota > 0 ? (used / quota) * 100 : null

  return (
    <Screen dock={false}>
      <ScreenHeader title="סרטונים ואחסון" fallback="/settings" />

      <section className="card animate-rise mb-5 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-flame-400">
            <Film size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-bone-50">סרטוני ההדגמה</h2>
            <p className="meta tnum mt-1">
              {VIDEO_COUNT} סרטונים · {formatBytes(VIDEO_TOTAL_BYTES)}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-bone-400">
          ההתקנה מורידה את הסרטונים פעם אחת ושומרת אותם במכשיר — משם הם נפתחים מיד וגם בלי
          חיבור לרשת.
        </p>

        <p className="tnum mt-3 text-sm font-bold text-bone-200">
          {installedBundled === 0
            ? 'עוד לא הותקן אף סרטון'
            : `מותקנים ${installedBundled} מתוך ${programTotal}`}
        </p>

        {progress?.source === 'program' ? (
          <>
            <div
              className="mt-3 h-2 overflow-hidden rounded-pill bg-ink-800"
              role="progressbar"
              aria-label="התקדמות ההתקנה"
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-pill bg-flame-500 transition-[width] duration-300"
                style={{ width: `${Math.max(2, percent)}%` }}
              />
            </div>
            <p className="tnum meta mt-2">
              {progress.done} מתוך {progress.total}
            </p>
            <Button variant="ghost" size="md" fullWidth className="mt-3" onClick={cancelInstall}>
              עצור
            </Button>
          </>
        ) : (
          <Button
            variant="flame"
            size="lg"
            fullWidth
            className="mt-4"
            disabled={missing <= 0}
            onClick={() => void install('program')}
          >
            {missing <= 0 ? 'הכל כבר במכשיר' : 'התקן סרטונים למכשיר'}
          </Button>
        )}

        {installedBundled > 0 && !installing ? (
          <Button
            variant="danger"
            size="md"
            fullWidth
            className="mt-2"
            icon={<Trash2 size={16} />}
            onClick={() => setClearOpen(true)}
          >
            מחק סרטונים מהמכשיר
          </Button>
        ) : null}
      </section>

      {/*
        המאגר בכרטיס נפרד ולא כחלק מההתקנה שמעליו: הוא כבד פי כמה ומשמש ללימוד
        בבית, לא באמצע סט. מי שרוצה רק את ההדגמות לא צריך לשלם עליו.
      */}
      {LIBRARY_COUNT > 0 ? (
        <section className="card animate-rise mb-5 p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-flame-400">
              <GraduationCap size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-extrabold text-bone-50">מאגר התרגילים</h2>
              <p className="meta tnum mt-1">
                {LIBRARY_CATALOG.length} תרגילים · {LIBRARY_COUNT} סרטונים ·{' '}
                {formatBytes(LIBRARY_TOTAL_BYTES)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-bone-400">
            סרטוני הסבר על ביצוע נכון וטעויות נפוצות. בלי התקנה הם עובדים רק מקוון.
          </p>

          <p className="tnum mt-3 text-sm font-bold text-bone-200">
            {installedLibrary === 0
              ? 'עוד לא הותקן אף סרטון'
              : `מותקנים ${installedLibrary} מתוך ${libraryTotal}`}
          </p>

          {progress?.source === 'library' ? (
            <>
              <div
                className="mt-3 h-2 overflow-hidden rounded-pill bg-ink-800"
                role="progressbar"
                aria-label="התקדמות התקנת המאגר"
                aria-valuenow={Math.round(percent)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-pill bg-flame-500 transition-[width] duration-300"
                  style={{ width: `${Math.max(2, percent)}%` }}
                />
              </div>
              <p className="tnum meta mt-2">
                {progress.done} מתוך {progress.total}
              </p>
              <Button variant="ghost" size="md" fullWidth className="mt-3" onClick={cancelInstall}>
                עצור
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              className="mt-4"
              disabled={missingLibrary <= 0 || installing}
              onClick={() => void install('library')}
            >
              {missingLibrary <= 0 ? 'המאגר כבר במכשיר' : 'התקן את המאגר למכשיר'}
            </Button>
          )}

          {installedLibrary > 0 && !installing ? (
            <Button
              variant="danger"
              size="md"
              fullWidth
              className="mt-2"
              icon={<Trash2 size={16} />}
              onClick={() => void clearLibrary()}
            >
              מחק את המאגר מהמכשיר
            </Button>
          ) : null}
        </section>
      ) : null}

      {/*
        המחיקה נעשית מתוך הנגן, באמצע אימון, בלחיצה אחת ואישור. זה המקום היחיד
        שבו אפשר לחזור ממנה — ולכן הוא קיים, ומופיע רק כשיש ממה לחזור.
      */}
      {hidden.size > 0 ? (
        <section className="card mb-5 p-4">
          <h2 className="text-sm font-extrabold text-bone-100">סרטונים שמחקת</h2>
          <p className="tnum mt-1 text-xs leading-relaxed text-bone-400">
            {hidden.size} סרטונים לא מוצגים בשום מקום באפליקציה. שחזור מחזיר אותם לרשימות —
            סרטון מצורף ינוגן שוב מהרשת, ואפשר להתקין אותו מחדש מכאן.
          </p>
          <Button
            size="md"
            fullWidth
            className="mt-3"
            onClick={() => {
              void restoreHiddenVideos().then((n) => {
                if (n > 0) toast(`${n} סרטונים חזרו`, { tone: 'success' })
              })
            }}
          >
            שחזר את כל מה שנמחק
          </Button>
        </section>
      ) : null}

      {/*
        ── כפילויות ──

        המאגר צמח מייבוא אוטומטי, ואותו סרטון נכנס אליו יותר מפעם אחת תחת
        שמות שונים; פעם אחת כבר נמחקו 33 כאלה ידנית. הזיהוי הוא על התמונה
        הממוזערת ולא על גודל ומשך — ראה domain/duplicates, שם גם המדידה שפסלה
        את המטא-דאטה. "מועמדים" ולא "כפילויות": פריים פתיחה זהה אינו הוכחה,
        ולכן כל שורה נפתחת בנגן לפני שמוחקים אותה.
      */}
      {duplicateGroups.length > 0 ? (
        <section className="mb-5">
          <h2 className="meta mb-2 px-1">מועמדים לכפילות</h2>
          <div className="flex flex-col gap-3">
            {duplicateGroups.map((group) => (
              <div key={group.clips[0].id} className="card p-3">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold text-bone-300">
                  <Copy size={14} className="shrink-0 text-flame-400" aria-hidden="true" />
                  {group.maxDistance === 0
                    ? 'תמונה זהה לחלוטין'
                    : `תמונה כמעט זהה (${group.maxDistance}/64 שונה)`}
                  {group.clips.every((c) => c.ownerId === group.clips[0].ownerId) ? (
                    <span className="font-medium text-bone-500">· באותו תרגיל</span>
                  ) : (
                    <span className="font-medium text-bone-500">· בתרגילים שונים</span>
                  )}
                </p>
                <ul className="flex flex-col gap-2">
                  {group.clips.map((clip) => (
                    <li key={clip.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreview({ ownerId: clip.ownerId, assetId: clip.id })}
                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1 text-start active:bg-ink-800"
                      >
                        <img
                          src={assetUrl(clip.poster)}
                          alt=""
                          loading="lazy"
                          className="h-12 w-12 shrink-0 rounded-lg border border-ink-700 object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.8125rem] font-semibold text-bone-100">
                            {clip.ownerName}
                          </span>
                          <span dir="ltr" className="meta tnum block truncate text-end">
                            {Math.round(clip.durationSec)}s · {formatBytes(clip.sizeBytes)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`מחק את הסרטון של ${clip.ownerName}`}
                        onClick={() => {
                          void deleteVideo(clip.id)
                            .then(() => toast('הסרטון נמחק', { tone: 'warn' }))
                            .catch(() => toast('המחיקה נכשלה', { tone: 'warn' }))
                        }}
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-hard-400 active:bg-ink-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="meta mt-2 px-1 leading-relaxed">
            לחיצה על שורה פותחת את הסרטון להשוואה. מחיקה של סרטון מצורף הפיכה —
            "שחזר את כל מה שנמחק" מחזיר אותו.
          </p>
        </section>
      ) : null}

      <section className="mb-5">
        <h2 className="meta mb-2 px-1">סרטונים לפי תרגיל</h2>
        <div className="card divide-y divide-ink-800/70 overflow-hidden">
          {exercises.length === 0 ? (
            <EmptyState title="הקטלוג ריק" hint="הוסף תרגיל בקטלוג, ואז אפשר לצרף לו סרטון." />
          ) : (
            exercises.map((ex) => {
              const bundled = bundledVideosFor(ex.id, undefined, hidden).length
              const own = importedByExercise.get(ex.id) ?? []
              const mismatch = videoMismatchNote(ex.id)
              return (
                <div key={ex.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-bone-50">{ex.name}</p>
                      <p className="meta tnum mt-1">
                        {bundled === 0 && own.length === 0
                          ? 'אין סרטון עדיין'
                          : [
                              bundled > 0 ? `${bundled} הדגמות` : '',
                              own.length > 0 ? `${own.length} שלי` : '',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                      </p>
                      {/* המסך הזה הוא המקום שמחליפים בו סרטון — כאן הסימון מוביל לפעולה */}
                      {mismatch ? (
                        <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-relaxed text-warmup-400">
                          <TriangleAlert size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                          <span>{mismatch}</span>
                        </p>
                      ) : null}
                    </div>

                    {/*
                      קובץ אחד בכל פעם, בלי multiple: סרטון הוא עשרות מגה-בייט,
                      וכמה קבצים שנקראים במקביל היו מפילים את הטאב באייפון.
                    */}
                    <label
                      className={[
                        'btn-ghost flex min-h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-xs font-bold',
                        importingId !== null ? 'opacity-50' : '',
                      ].join(' ')}
                    >
                      <Plus size={14} strokeWidth={3} aria-hidden="true" />
                      {importingId === ex.id ? 'מייבא…' : 'הוסף סרטון'}
                      <input
                        type="file"
                        accept="video/*"
                        className="sr-only"
                        disabled={importingId !== null}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          e.target.value = ''
                          if (file) void importVideo(ex.id, file)
                        }}
                      />
                    </label>
                  </div>

                  {own.length > 0 ? (
                    <ul className="mt-2 flex flex-col gap-1">
                      {own.map((video) => (
                        <li
                          key={video.id}
                          className="flex items-center gap-2 rounded-xl bg-ink-900/70 ps-3"
                        >
                          <Video size={14} className="shrink-0 text-bone-600" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate text-xs text-bone-400">
                            {video.label}
                          </span>
                          <span className="meta tnum shrink-0">
                            {formatBytes(video.sizeBytes)}
                          </span>
                          <button
                            type="button"
                            aria-label={`מחק את ${video.label}`}
                            onClick={() => void deleteImported(video.id)}
                            className="flex size-12 shrink-0 items-center justify-center rounded-xl text-hard-400 active:bg-hard-400/12"
                          >
                            <X size={18} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="mb-5">
        <h2 className="meta mb-2 px-1">אחסון</h2>
        <div className="card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="tnum text-sm font-bold text-bone-50">
              {usage.count} סרטונים · {formatBytes(usage.bytes)}
            </p>
            {used !== null ? (
              <p className="meta tnum">האפליקציה כולה {formatBytes(used)}</p>
            ) : null}
          </div>

          {usedPercent !== null && quota !== null ? (
            <>
              <div
                className="mt-2 h-2 overflow-hidden rounded-pill bg-ink-800"
                role="progressbar"
                aria-label="ניצול האחסון"
                aria-valuenow={Math.round(usedPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-pill bg-flame-500"
                  style={{ width: `${Math.max(1.5, Math.min(100, usedPercent))}%` }}
                />
              </div>
              <p className="meta tnum mt-2">מתוך {formatBytes(quota)} שהדפדפן מקצה</p>
            </>
          ) : (
            <p className="mt-2 text-xs text-bone-500">
              הדפדפן הזה לא מדווח כמה מקום פנוי נשאר.
            </p>
          )}
        </div>
      </section>

      <BottomSheet
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="למחוק את הסרטונים מהמכשיר?"
      >
        <p className="text-sm leading-relaxed text-bone-400">
          נמחקים רק סרטוני ההדגמה המצורפים — הסרטונים שייבאת בעצמך נשארים. אפשר להתקין אותם
          שוב בכל רגע, אבל זה ידרוש חיבור לרשת.
        </p>
        <div className="mt-5 mb-2 flex flex-col gap-2">
          <Button variant="danger" size="lg" fullWidth onClick={() => void clearBundled()}>
            כן, מחק
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => setClearOpen(false)}>
            השאר
          </Button>
        </div>
      </BottomSheet>
      {preview ? (
        <VideoPlayer
          exerciseId={preview.ownerId}
          exerciseName="השוואת כפילות"
          open
          startId={preview.assetId}
          onClose={() => setPreview(null)}
        />
      ) : null}

    </Screen>
  )
}
