import { useState, type JSX } from 'react'
import { assetUrl } from '@/db/mediaDb'
import { groupCardFor } from '@/db/muscleCards'
import { MUSCLE_GROUPS } from '@/db/types'
import type { MuscleGroup } from '@/db/types'
import { MuscleCardSheet } from './MuscleCardSheet'

/**
 * כרטיס הסקירה של קבוצת שריר — כל תת-השרירים שלה בתמונה אחת, כל אחד בצבע
 * לפי גודלו.
 *
 * יושב בכותרת הקבוצה ברשימת התרגילים, כי זו הרמה שהוא עונה עליה: "מה בכלל יש
 * בחזה" היא שאלה על הקבוצה, ו"איפה החזה העליון" היא שאלה על השורה שמתחתיה.
 * שמונה כרטיסי הסקירה מקבלים כאן את כל הבית שלהם, בלי מסך חדש לתחזק.
 */
export function GroupCardButton({ group }: { group: MuscleGroup }): JSX.Element | null {
  const [open, setOpen] = useState(false)
  const card = groupCardFor(group)
  if (!card) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`שרירי ${MUSCLE_GROUPS[group].label} — כרטיס אנטומי`}
        /*
          יעד המגע 44px כמו בכל מקום, אבל השוליים השליליים מונעים ממנו למתוח
          את שורת הכותרת — הכפתור גדול מהטקסט שלצידו, והשורה נשארת בגובהה.
        */
        className="-my-2 flex size-11 shrink-0 items-center justify-center active:opacity-70"
      >
        <img
          src={assetUrl(card.thumb)}
          alt=""
          className="size-7 rounded-md border border-ink-700 bg-bone-50 object-contain"
          loading="lazy"
        />
      </button>
      <MuscleCardSheet card={open ? card : null} onClose={() => setOpen(false)} />
    </>
  )
}
