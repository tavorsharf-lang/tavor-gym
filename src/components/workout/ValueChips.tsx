import type { JSX } from 'react'

/**
 * שורת השבבים של הבמה — קביעה ישירה של הערך שבאריח הפעיל, בלחיצה אחת.
 *
 * זו השורה שבלעה ארבעה מקטעים שהיו פרושים על הכרטיס: ההמלצה של היום, מה
 * הרמתי פעם קודמת, שבבי הפלטות ושבבי החזרות. כולם ענו על אותה שאלה — "איזה
 * מספר לשים בשדה" — וכולם דרשו לגלול כדי להגיע אליהם. עכשיו הם 38 פיקסלים
 * אחד מתחת לאריחים, ומי שמדבר בהם הוא האריח שנגעו בו אחרון.
 *
 * **שורה אחת שלא נגללת.** `overflow-hidden` הוא הצהרה ולא הגנה: שבב שלא
 * נכנס פשוט לא אמור להיווצר, וזה מה שהתקרה בבונים של השבבים אחראית עליה.
 */

export interface ValueChip {
  /** מפתח ייחודי — הערך לבדו אינו כזה: "המלצה 60" ו-"60" יכולים לחיות יחד */
  id: string
  label: string
  /** האם הערך שבשבב הוא בדיוק מה שבשדה כרגע */
  picked: boolean
  /** שם נגיש מלא, כשהתווית לבדה לא אומרת מה יקרה */
  ariaLabel?: string
  onPick: () => void
}

export function ValueChips({ chips }: { chips: readonly ValueChip[] }): JSX.Element | null {
  if (chips.length === 0) return null

  return (
    <div className="flex h-full items-stretch gap-[7px] overflow-hidden">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          aria-pressed={chip.picked}
          aria-label={chip.ariaLabel}
          onClick={chip.onPick}
          className={`tnum relative flex shrink-0 items-center rounded-xl border px-3 text-[0.8125rem] font-bold whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:-inset-y-[3px] after:content-[''] ${
            chip.picked
              ? 'border-flame-700 bg-flame-500/15 text-flame-300'
              : 'border-ink-700 bg-ink-900 text-bone-300 active:bg-ink-800'
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
