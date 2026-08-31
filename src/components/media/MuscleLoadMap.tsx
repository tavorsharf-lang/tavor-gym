import { useState } from 'react'
import type { JSX } from 'react'
import { assetUrl } from '@/db/mediaDb'
import { countMasculine } from '@/lib/text'
import type { LoadShare } from '@/db/loadMap'
import type { MuscleCardImage } from '@/db/muscleImageManifest'
import { MuscleCardSheet } from '@/components/exercises/MuscleCardSheet'

/**
 * מפת העומס מתחת לכרטיס בגלריה.
 *
 * שורה לשריר: הכרטיס האנטומי שלו, השם, האחוז, והפס שמראה את היחס. הפס באורך
 * האחוז המלא ולא מנורמל למקסימום — 50% הם חצי מהעבודה, וזה מה שהפס אמור
 * להראות. נרמול היה מותח את השורה הראשונה לרוחב מלא תמיד ומוחק בדיוק את
 * ההבדל בין תרגיל שמרוכז בשריר אחד לתרגיל שמפזר.
 *
 * הלחיצה על שורה פותחת את הכרטיס האנטומי בגדול. זו השאלה שעולה מיד אחרי
 * שקוראים "מעוינים 25%" — איפה זה בכלל — והתשובה קיימת אצלנו כתמונה, במרחק
 * לחיצה אחת ולא במסך אחר.
 *
 * **כל שם על המסך הוא השם שלנו.** מה שמודפס על התמונה בעברית לא מופיע כאן
 * אפילו כשורה שנייה, וגם האנגלית מגיעה מהכרטיס האנטומי שלנו ולא מהתמלול —
 * אותו שריר נכתב על הכרטיסים בשלוש צורות שונות, ושתי גרסאות של אותו שם
 * במרחק סנטימטר זו מזו נקראות כשני שרירים.
 */
export function MuscleLoadMap({ shares }: { shares: readonly LoadShare[] }): JSX.Element | null {
  const [card, setCard] = useState<MuscleCardImage | null>(null)

  if (shares.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-lg">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h3 className="text-sm font-extrabold text-bone-200">מפת עומס</h3>
        {/* מאיפה המספרים. בלי זה הם נקראים כהערכה שלנו, והם תמלול. */}
        <span className="meta">האחוזים כפי שהם על הכרטיס</span>
      </div>

      <ul className="card divide-y divide-ink-800/70 overflow-hidden">
        {shares.map((share, i) => (
          <li key={share.en}>
            <button
              type="button"
              disabled={!share.card}
              onClick={() => setCard(share.card)}
              aria-label={
                share.card
                  ? `${share.name} ${share.pct} אחוז — איפה השריר הזה יושב`
                  : `${share.name} ${share.pct} אחוז`
              }
              className="flex w-full items-center gap-3 p-3 text-start transition-colors active:bg-ink-800 disabled:active:bg-transparent"
            >
              {share.card ? (
                <img
                  src={assetUrl(share.card.thumb)}
                  alt=""
                  className="size-12 shrink-0 rounded-lg border border-ink-700 bg-bone-50 object-contain"
                  loading="lazy"
                />
              ) : (
                /* שומר על יישור העמודה כששריר אחד ברשימה הוא "מייצבים" */
                <span
                  className="size-12 shrink-0 rounded-lg border border-dashed border-ink-800"
                  aria-hidden="true"
                />
              )}

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-bold text-bone-50">{share.name}</span>
                  <span
                    className={[
                      'tnum ms-auto shrink-0 text-sm font-extrabold',
                      i === 0 ? 'text-flame-400' : 'text-bone-300',
                    ].join(' ')}
                  >
                    {share.pct}%
                  </span>
                </span>

{/*
                  השם האנגלי מהכרטיס האנטומי שלנו, ולצידו — כששורה אחת כאן
                  מאחדת כמה שורות על התמונה — מכמה היא מורכבת. בלי המשפט הזה
                  "ארבע-ראשי 100%" מול תמונה שכתוב עליה 45/25/20/10 נראה כמו
                  מספר שהמצאנו.
                */}
                <span className="meta mt-0.5 block truncate">
                  {[
                    share.card?.nameEn,
                    share.parts > 1 ? `${countMasculine(share.parts)} אזורים על הכרטיס` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>

                <span
                  className="mt-2 block h-1.5 overflow-hidden rounded-pill bg-ink-800"
                  aria-hidden="true"
                >
                  <span
                    className={[
                      'block h-full rounded-pill',
                      i === 0 ? 'bg-flame-500' : 'bg-flame-500/45',
                    ].join(' ')}
                    style={{ width: `${share.pct}%` }}
                  />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <MuscleCardSheet card={card} onClose={() => setCard(null)} />
    </section>
  )
}

