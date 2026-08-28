import type { JSX } from 'react'
import { Play } from 'lucide-react'
import { assetUrl } from '@/db/mediaDb'
import { primaryImageFor } from '@/db/exerciseImages'
import { VideoThumb } from './VideoThumb'

/**
 * הריבוע שבתחילת שורת התרגיל.
 *
 * מציג את **כרטיס השרירים** — מה עובד בתרגיל ובאיזו מידה — ולא פריים מהסרטון.
 * הכרטיס מזהה את התרגיל טוב יותר מפריים אקראי: פריים מסרטון של יוצר תוכן הוא
 * לרוב פנים או שלט, והכרטיס הוא תמיד אותה קומפוזיציה עם דמות והדגשה צבעונית.
 *
 * לתרגיל בלי כרטיס נופלים חזרה ל-`VideoThumb`, ולכן השורה אף פעם לא מאבדת את
 * התיבה. זה גם מה שמכסה תרגיל שהמשתמש יצר בעצמו.
 *
 * הממוזערת מוצגת בלי חיתוך (`contain` ולא `cover`). נבדק מול חיתוך לאזור
 * הדמות ב-56px, והחיתוך יצא גרוע יותר: בהרמה לצדדים ובפלאנק הוא בולע את
 * התנוחה, שהיא כל מה שמזהים בגודל הזה. הכרטיסים כבר מהודקים במקור.
 */
export function ExerciseThumb({
  exerciseId,
  libraryId,
  onOpen,
  size = 'sm',
  keepFrame = false,
}: {
  exerciseId: string
  libraryId?: string
  /** חסר = התמונה דקורטיבית והשורה שמסביבה נלחצת, בדיוק כמו ב-VideoThumb */
  onOpen?: () => void
  size?: 'sm' | 'md'
  keepFrame?: boolean
}): JSX.Element | null {
  const image = primaryImageFor(exerciseId, libraryId)
  if (!image) {
    return (
      <VideoThumb
        exerciseId={exerciseId}
        libraryId={libraryId}
        onOpen={onOpen}
        size={size}
        keepFrame={keepFrame}
      />
    )
  }

  const box = size === 'sm' ? 'h-14 w-14' : 'h-20 w-20'
  const frame = `relative shrink-0 overflow-hidden rounded-xl border border-ink-700 bg-bone-50 ${box}`

  const inner = (
    <>
      <img
        src={assetUrl(image.thumb)}
        alt=""
        className="h-full w-full object-contain"
        loading="lazy"
      />
      {/*
        סימן ההפעלה נשאר: הריבוע הוא עדיין הכניסה לגלריה, והכרטיס הוא רק
        השקופית הראשונה בה. בלעדיו התמונה נראית דקורטיבית ואי אפשר לנחש שיש
        מאחוריה סרטונים.
      */}
      <span className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-ink-950/70 to-transparent pb-0.5 pt-2">
        <Play size={size === 'sm' ? 11 : 14} className="text-bone-50 drop-shadow" fill="currentColor" />
      </span>
    </>
  )

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
      aria-label={`אילו שרירים עובדים ב${image.nameHe}`}
      className={`${frame} transition-transform active:scale-95`}
    >
      {inner}
    </button>
  )
}
