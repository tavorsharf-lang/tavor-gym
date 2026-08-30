import type { JSX } from 'react'
import { assetUrl } from '@/db/mediaDb'
import type { MuscleCardImage } from '@/db/muscleImageManifest'
import { BottomSheet } from '@/components/ui'

/**
 * הכרטיס האנטומי בגדול — איפה יושב תת-השריר בתוך הקבוצה שלו.
 *
 * גיליון ולא מסך: השאלה "רגע, מה זה חזה עליון" עולה תוך כדי גלילה ברשימה,
 * והתשובה צריכה להיסגר באותה תנועה שפתחה אותה בלי לאבד את המקום ברשימה.
 *
 * ‏`srcSet` מגיש את הממוזערת מה-precache עד שהמלאה מגיעה. אופליין בלי המלאה
 * נשארת הממוזערת — מטושטשת אבל קריאה, וזה עדיף על ריבוע שבור.
 */
export function MuscleCardSheet({
  card,
  onClose,
}: {
  /** null = סגור. הגיליון לא מרונדר בכלל, ולכן אין מצב פתוח בלי תמונה. */
  card: MuscleCardImage | null
  onClose: () => void
}): JSX.Element | null {
  if (!card) return null
  return (
    <BottomSheet open onClose={onClose} title={card.nameHe}>
      <img
        src={assetUrl(card.thumb)}
        srcSet={`${assetUrl(card.thumb)} 200w, ${assetUrl(card.src)} 1100w`}
        sizes="(max-width: 640px) 100vw, 640px"
        alt={`כרטיס אנטומי — ${card.nameHe}`}
        className="block w-full rounded-card bg-bone-50"
      />
      <p className="meta mt-2 text-center">{card.nameEn}</p>
    </BottomSheet>
  )
}
