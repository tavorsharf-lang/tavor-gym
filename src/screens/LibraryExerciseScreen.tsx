import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { JSX } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ExternalLink, Play, Plus, SearchX } from 'lucide-react'
import { assetUrl, bundledId, bundledVideosFor, mediaDb, videoLabelsFor } from '@/db/mediaDb'
import { useHiddenVideoIds } from '@/db/hiddenVideos'
import { libraryExercise } from '@/db/libraryLinks'
import { LIBRARY_MAX_PER_EXERCISE } from '@/db/libraryManifest'
import { MUSCLE_GROUPS } from '@/db/types'
import type { Exercise, VideoAsset } from '@/db/types'
import { db } from '@/db/db'
import { getCatalogEntry } from '@/db/catalog'
import { DEFAULT_REST_SECONDS, DEFAULT_TARGET_SETS } from '@/db/seed'
import { formatBytes, newId } from '@/domain/units'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { Button, EmptyState, toast } from '@/components/ui'
import { VideoPlayer } from '@/components/media/VideoPlayer'

/**
 * תרגיל אחד במאגר — כל סרטוני ההסבר שלו.
 *
 * הנושא של כל סרטון הוא העיקר כאן ולא מספר סידורי: שלושה סרטונים על אותו תרגיל
 * מלמדים שלושה דברים שונים, ובלי הנושא המשתמש פותח אותם אחד-אחד כדי לגלות מה יש בהם.
 */

export function LibraryExerciseScreen(): JSX.Element {
  const { libId = '' } = useParams()
  const navigate = useNavigate()
  const [playing, setPlaying] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const hidden = useHiddenVideoIds()

  /*
    התרגיל המקביל בקטלוג נשאל מהמסד ולא מהמפה הסטטית ההפוכה.

    `Exercise.libraryId` הוא מקור האמת מגרסה 4, והוא גם מאונדקס בדיוק בשביל
    החיפוש הזה. המפה הסטטית הייתה מפספסת קישור שנוצר בזמן ריצה, וגרוע מזה —
    ממשיכה להציג כרטיס "התרגיל הזה בתוכנית שלך" לתרגיל שנמחק מהקטלוג, שמנווט
    למסך "תרגיל לא נמצא".
  */
  /*
    `null` הוא "חיפשתי ואין קישור", ו-undefined הוא "עוד לא יודע".
    useLiveQuery מחזיר undefined בשני המצבים, ולכן הרינדור הראשון הציג תמיד
    "הוסף לתרגילים שלי" — כולל לתרגיל שכבר בתוכנית, שרק אחרי רגע התחלף בכרטיס
    הקישור. הכפתור שהבהב היה גם הכפתור שיוצר כפילות אם מספיקים ללחוץ עליו.
  */
  const linked = useLiveQuery(
    async () => (libId ? ((await db.exercises.where('libraryId').equals(libId).first()) ?? null) : null),
    [libId]
  )
  const linkKnown = linked !== undefined

  /*
    האם הסרטונים באמת במכשיר. בלי הבדיקה הזו הכיתוב למטה חישב נפח מהמניפסט
    והכריז "12MB במכשיר" גם למי שמעולם לא התקין את המאגר — עד שהוא ניסה לצפות
    במצב טיסה וקיבל WifiOff.
  */
  const installedIds = useLiveQuery(
    async () => {
      const ids = bundledVideosFor(libId).map((c) => bundledId(c.src))
      if (!ids.length) return new Set<string>()
      const rows = await mediaDb.videos.bulkGet(ids)
      return new Set(rows.filter((v): v is VideoAsset => Boolean(v)).map((v) => v.id))
    },
    [libId],
    new Set<string>()
  )
  const exercise = libraryExercise(libId)

  /*
    כתובת של תרגיל מהקטלוג שהגיעה לנתיב של המאגר.

    `libraryExercise` מכיר רק את המאגר, ולכן /library/<מזהה-קטלוג> נחת על
    "התרגיל לא במאגר" — מסך שקרי, כי התרגיל קיים ורק הנתיב לא נכון.
    `getCatalogEntry` הוא בדיוק השכבה שיודעת לענות על שני סוגי המזהים, והיא
    מחזירה את הרשומה הקנונית: התרגיל שלי, עם חומר הלימוד בתוכו.
  */
  const entry = useLiveQuery(async () => (exercise ? null : getCatalogEntry(libId)), [libId, exercise])
  const canonicalId = entry?.exercise?.id ?? null
  useEffect(() => {
    if (canonicalId) navigate(`/exercise/${canonicalId}`, { replace: true })
  }, [canonicalId, navigate])
  /*
    הנושאים נלקחים מ-videoLabelsFor ולא מ-`exercise.videos` שבקטלוג הסטטי.

    שתי הרשימות נראות מקבילות אבל רק אחת מהן מסוננת: אחרי מחיקת סרטון, הצמדה
    של הנושא ה-i לסרטון ה-i הייתה מדביקה לכל סרטון את הכותרת של קודמו, ומשמיטה
    את האחרון. שתי הפונקציות האלה נגזרות ממקור אחד ולכן מיושרות תמיד.
  */
  const clips = bundledVideosFor(libId, undefined, hidden)
  const labels = videoLabelsFor(libId, undefined, hidden)

  if (!exercise) {
    return (
      <Screen>
        <ScreenHeader title="תרגיל לא נמצא" fallback="/library" />
        <EmptyState
          icon={<SearchX size={26} />}
          title="התרגיל לא במאגר"
          hint="אולי הוא הוסר בייבוא האחרון. חזרה למאגר תראה מה קיים."
        />
      </Screen>
    )
  }

  const programId = linked?.id ?? null

  /**
   * יוצר תרגיל בקטלוג עם הקישור למאגר.
   *
   * ברירות המחדל שמרניות בכוונה: מכונה, משקל כולל, בלי פלטות ובלי משקל זריעה.
   * המשתמש יראה את המספרים שלו כבר בסט הראשון, והעורך פתוח לו מיד — עדיף
   * לנחש מעט מלנחש הרבה ולא נכון.
   */
  const addToCatalog = async (): Promise<void> => {
    if (!exercise || adding) return
    setAdding(true)
    try {
      const existing = await db.exercises.where('libraryId').equals(exercise.id).first()
      if (existing) {
        navigate(`/exercise/${existing.id}`)
        return
      }
      const now = Date.now()
      const maxOrder = (await db.exercises.toArray()).reduce((m, e) => Math.max(m, e.order), -1)
      const created: Exercise = {
        id: newId('ex-'),
        name: exercise.nameHe,
        nameEn: exercise.nameEn,
        muscleGroup: exercise.muscleGroup,
        subTarget: '',
        equipment: 'machine',
        weightMode: 'total',
        weightIncrementKg: 2.5,
        defaultRestSeconds: DEFAULT_REST_SECONDS,
        targetSets: DEFAULT_TARGET_SETS,
        targetReps: { min: 8, max: 12 },
        cues: [],
        usesPlates: false,
        barWeightKg: null,
        seedWeightKg: null,
        libraryId: exercise.id,
        isActive: true,
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      }
      await db.exercises.add(created)
      toast(`${created.name} נוסף לתרגילים שלך`, { tone: 'success' })
      navigate(`/settings/exercises/${created.id}`)
    } catch {
      toast('לא הצלחתי להוסיף את התרגיל', { tone: 'warn' })
    } finally {
      setAdding(false)
    }
  }
  const localCount = clips.filter((c) => installedIds.has(bundledId(c.src))).length
  // "יש עוד סרטונים שלא נכללו" מדבר על מה שלא ירד לאפליקציה, ולא על מה שנמחק
  const omitted = exercise.totalAvailable - bundledVideosFor(libId).length
  const totalBytes = clips.reduce((n, c) => n + c.sizeBytes, 0)

  return (
    <Screen>
      <ScreenHeader
        title={exercise.nameHe}
        subtitle={`${MUSCLE_GROUPS[exercise.muscleGroup].label} · ${clips.length} סרטונים`}
        fallback="/library"
      />

      <p dir="ltr" className="mb-5 text-end text-sm font-semibold text-bone-400">
        {exercise.nameEn}
      </p>

      {/*
        הזרימה שמיגרציית v4 נבנתה בשבילה: הוספת תרגיל מהמאגר לקטלוג יוצרת את
        הקישור בעצמה, במקום לדרוש עריכת קוד. לפני היצירה בודקים אם כבר קיים
        קישור ומנווטים אליו — כך אי אפשר לייצר שני תרגילים שמצביעים על אותו
        מזהה מאגר, וזו גם ההתנהגות הנכונה מוצרית.
      */}
      {linkKnown && !programId ? (
        <Button
          size="lg"
          fullWidth
          className="mb-5"
          icon={<Plus size={18} />}
          loading={adding}
          onClick={() => void addToCatalog()}
        >
          הוסף לתרגילים שלי
        </Button>
      ) : null}

      {programId ? (
        <button
          type="button"
          onClick={() => navigate(`/exercise/${programId}`)}
          className="card mb-5 flex w-full items-center gap-3 p-3 text-start active:bg-ink-800"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-bone-50">התרגיל הזה בתוכנית שלך</span>
            <span className="meta mt-0.5 block">המשקלים וההיסטוריה שלך</span>
          </span>
          <ExternalLink size={16} className="shrink-0 text-bone-500" />
        </button>
      ) : null}

      <div className="space-y-2">
        {clips.map((clip, i) => {
          return (
            <button
              key={clip.src}
              type="button"
              onClick={() => setPlaying(i)}
              className="card flex w-full items-center gap-3 p-3 text-start active:bg-ink-800"
            >
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-850">
                <img
                  src={assetUrl(clip.poster)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-ink-950/35">
                  <Play size={18} className="text-bone-50" fill="currentColor" />
                </span>
              </span>

              <span className="min-w-0 flex-1">
                {/*
                  הנושא מגיע מהכיתוב המקורי ולכן הוא באנגלית. dir=ltr כדי שסימני
                  פיסוק לא יקפצו לצד הלא נכון, יישור לקצה כדי שיישאר צמוד לעברית.
                */}
                <span
                  dir="ltr"
                  className="block text-end text-[0.8125rem] leading-snug font-semibold text-bone-100"
                >
                  {labels[i]}
                </span>
                <span className="meta tnum mt-1 block">
                  {Math.round(clip.durationSec)} שניות · {formatBytes(clip.sizeBytes)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/*
        קיצוץ שקט נקרא ככיסוי מלא. אם יש עוד חומר על התרגיל — אומרים כמה ולאן,
        גם אם הוא לא ירד למכשיר.
      */}
      {omitted > 0 ? (
        <p className="mt-4 rounded-xl border border-ink-800 bg-ink-900/60 px-3 py-2.5 text-xs leading-relaxed text-bone-500">
          יש עוד {omitted} סרטונים על התרגיל הזה שלא נכללו באפליקציה
          {LIBRARY_MAX_PER_EXERCISE !== null
            ? ` — נכנסים עד ${LIBRARY_MAX_PER_EXERCISE} לתרגיל, הנצפים ביותר`
            : ''}
          . אפשר לראות את השאר במקור.
        </p>
      ) : null}

      {/* "במכשיר" רק כשזה נכון — אחרת אומרים מאיפה הם באמת מגיעים */}
      <p className="tnum meta mt-3 text-center">
        {clips.length > 0 && localCount === clips.length
          ? `${formatBytes(totalBytes)} במכשיר`
          : localCount > 0
            ? `${localCount} מתוך ${clips.length} במכשיר · השאר בהזרמה מהרשת`
            : `${formatBytes(totalBytes)} · בהזרמה מהרשת. אפשר להתקין בהגדרות ← סרטונים`}
      </p>

      {playing !== null ? (
        <VideoPlayer
          exerciseId={exercise.id}
          exerciseName={exercise.nameHe}
          open
          startIndex={playing}
          onClose={() => setPlaying(null)}
        />
      ) : null}
    </Screen>
  )
}
