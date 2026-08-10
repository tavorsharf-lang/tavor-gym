import { useState } from 'react'
import type { JSX } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ExternalLink, Play, SearchX } from 'lucide-react'
import { assetUrl, bundledVideosFor } from '@/db/mediaDb'
import { libraryExercise, LIBRARY_LINKS } from '@/db/libraryLinks'
import { LIBRARY_MAX_PER_EXERCISE } from '@/db/libraryManifest'
import { MUSCLE_GROUPS } from '@/db/types'
import { formatBytes } from '@/domain/units'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { useBack } from '@/hooks/useBack'
import { EmptyState } from '@/components/ui'
import { VideoPlayer } from '@/components/media/VideoPlayer'

/**
 * תרגיל אחד במאגר — כל סרטוני ההסבר שלו.
 *
 * הנושא של כל סרטון הוא העיקר כאן ולא מספר סידורי: שלושה סרטונים על אותו תרגיל
 * מלמדים שלושה דברים שונים, ובלי הנושא המשתמש פותח אותם אחד-אחד כדי לגלות מה יש בהם.
 */

/** מזהה התרגיל בתוכנית שמקושר לתרגיל המאגר הזה, אם יש */
function programIdFor(libId: string): string | null {
  const found = Object.entries(LIBRARY_LINKS).find(([, lib]) => lib === libId)
  return found ? found[0] : null
}

export function LibraryExerciseScreen(): JSX.Element {
  const { libId = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack('/library')
  const [playing, setPlaying] = useState<number | null>(null)

  const exercise = libraryExercise(libId)
  const clips = bundledVideosFor(libId)

  if (!exercise) {
    return (
      <Screen>
        <ScreenHeader title="תרגיל לא נמצא" onBack={back} />
        <EmptyState
          icon={<SearchX size={26} />}
          title="התרגיל לא במאגר"
          hint="אולי הוא הוסר בייבוא האחרון. חזרה למאגר תראה מה קיים."
        />
      </Screen>
    )
  }

  const programId = programIdFor(exercise.id)
  const omitted = exercise.totalAvailable - clips.length
  const totalBytes = clips.reduce((n, c) => n + c.sizeBytes, 0)

  return (
    <Screen>
      <ScreenHeader
        title={exercise.nameHe}
        subtitle={`${MUSCLE_GROUPS[exercise.muscleGroup].label} · ${clips.length} סרטונים`}
        onBack={back}
      />

      <p dir="ltr" className="mb-5 text-end text-sm font-semibold text-bone-400">
        {exercise.nameEn}
      </p>

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
        {exercise.videos.map((note, i) => {
          const clip = clips[i]
          if (!clip) return null
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
                  {note.topic}
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

      <p className="tnum meta mt-3 text-center">{formatBytes(totalBytes)} במכשיר</p>

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
