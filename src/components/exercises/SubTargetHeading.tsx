import { useState, type JSX } from 'react'
import { assetUrl } from '@/db/mediaDb'
import { muscleCardFor } from '@/db/muscleCards'
import { MuscleCardSheet } from './MuscleCardSheet'

/**
 * כותרת תת-הקטגוריה ברשימת התרגילים ובבניית האימון — אותו רכיב בשני המסכים,
 * כי זו אותה כותרת מאותו מקור.
 *
 * הכותרת הייתה שורת טקסט בלבד, ובדיוק שם עולה השאלה "מה זה חזה עליון ואיפה
 * הוא". הריבוע עונה עליה במקום, ולכן הוא כאן ולא במסך נפרד.
 *
 * כל השורה היא הכפתור ולא רק הריבוע: 24 פיקסלים הם יעד מגע גרוע, והכותרת
 * ממילא לא עשתה שום דבר אחר בלחיצה. תת-קטגוריה בלי כרטיס — "אחר", הדלי של
 * תרגיל שהמשתמש יצר — חוזרת להיות טקסט שקט ולא כפתור שלא עושה כלום.
 */
export function SubTargetHeading({ sub, count }: { sub: string; count: number }): JSX.Element {
  const [open, setOpen] = useState(false)
  const card = muscleCardFor(sub)

  if (!card) {
    return (
      <p className="mb-1.5 flex items-baseline gap-2 px-1">
        <span className="text-[0.6875rem] font-bold tracking-wide text-flame-400">{sub}</span>
        <span className="meta tnum">{count}</span>
      </p>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${sub} — איפה השריר הזה יושב`}
        className="mb-1.5 flex min-h-9 w-full items-center gap-2 px-1 text-start active:opacity-70"
      >
        <img
          src={assetUrl(card.thumb)}
          alt=""
          className="size-6 shrink-0 rounded-md border border-ink-700 bg-bone-50 object-contain"
          loading="lazy"
        />
        <span className="text-[0.6875rem] font-bold tracking-wide text-flame-400">{sub}</span>
        <span className="meta tnum">{count}</span>
      </button>
      <MuscleCardSheet card={open ? card : null} onClose={() => setOpen(false)} />
    </>
  )
}
