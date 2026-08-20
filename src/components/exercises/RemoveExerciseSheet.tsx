import type { JSX } from 'react'
import type { PlanUsage } from '@/db/catalog'
import { BottomSheet, Button } from '@/components/ui'

/**
 * מה קורה לפריטי התוכנית כשמוציאים תרגיל מ"התרגילים שלי".
 *
 * הגיליון נפתח *רק* כשהתרגיל נמצא לפחות בתוכנית או בלוק אחד. כשהוא לא בשום
 * תוכנית ההסרה שקטה, עם טוסט ו"בטל" — אין כאן החלטה לקבל.
 *
 * למה שאלה ולא כלל קבוע: שתי התשובות נכונות במצבים שונים. "לא עושה את זה
 * החודש" רוצה שהפריט יחכה; "המכונה הזאת לא בחדר יותר" רוצה שהוא ייעלם.
 *
 * "השאר בתוכניות" הוא הכפתור הראשי כי הוא ההפיך מבין השניים: החזרת התרגיל
 * מחזירה גם את מקומו, את טווח החזרות ואת משקל ההתחלה. "הוצא גם מהתוכניות"
 * הוא הענף היחיד בכל הזרימה שלחיצה אחת לא מבטלת.
 *
 * התוכניות מוצגות בשם, והכבויות מסומנות ככאלה. זה לא קישוט: בלי הסימון
 * "הוצא גם מהתוכניות" עורך בשקט גם תוכנית שהמשתמש לא מסתכל עליה, וזו בדיוק
 * ההפתעה שמיגרציה 5 מזהירה ממנה.
 */

/*
  ספרה אחרי אות שימוש נקראת רע בעברית: "נמצא ב2 תוכניות". במספרים קטנים
  המילה היא הפתרון הנכון, ולא מקף. תוכנית נקבה, בלוק זכר.
*/
const FEM = ['', 'אחת', 'שתי', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר']
const MASC = ['', 'אחד', 'שני', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה', 'עשרה']

const countF = (n: number): string => FEM[n] ?? `${n}`
const countM = (n: number): string => MASC[n] ?? `${n}`

export interface RemoveExerciseSheetProps {
  open: boolean
  onClose: () => void
  exerciseName: string
  usage: readonly PlanUsage[]
  /** `detach` = להוציא את הפריט גם מהתוכניות */
  onConfirm: (detach: boolean) => void
  busy?: boolean
}

export function RemoveExerciseSheet({
  open,
  onClose,
  exerciseName,
  usage,
  onConfirm,
  busy = false,
}: RemoveExerciseSheetProps): JSX.Element {
  const routines = usage.filter((u) => u.kind === 'routine').length
  const blocks = usage.length - routines
  const what = [
    routines > 0 ? (routines === 1 ? 'תוכנית אחת' : `${countF(routines)} תוכניות`) : null,
    blocks > 0 ? (blocks === 1 ? 'בלוק אחד' : `${countM(blocks)} בלוקים`) : null,
  ]
    .filter(Boolean)
    .join(' וב')

  return (
    <BottomSheet open={open} onClose={onClose} title={`להוציא את ${exerciseName}?`}>
      <p className="text-sm leading-relaxed text-bone-400">
        התרגיל נמצא ב{what}. ההיסטוריה, השיאים והמשקלים נשמרים בכל מקרה.
      </p>

      <ul className="mt-4 flex flex-col gap-1.5">
        {usage.map((u) => (
          <li
            key={`${u.kind}-${u.id}`}
            className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-850 px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-bone-100">{u.name}</span>
            <span className="meta shrink-0">
              {u.kind === 'block' ? 'בלוק' : u.active ? 'פעילה' : 'כבויה'}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 mb-2 flex flex-col gap-2">
        <Button size="lg" fullWidth loading={busy} onClick={() => onConfirm(false)}>
          השאר בתוכניות
        </Button>
        <Button variant="ghost" size="lg" fullWidth disabled={busy} onClick={() => onConfirm(true)}>
          הוצא גם מהתוכניות
        </Button>
      </div>

      <p className="mb-1 text-xs leading-relaxed text-bone-500">
        פריט שנשאר בתוכנית לא נכנס לאימון, ומסומן שם "לא בתרגילים שלי". החזרת התרגיל מחזירה גם
        אותו.
      </p>
    </BottomSheet>
  )
}
