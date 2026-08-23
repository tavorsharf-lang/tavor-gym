import type { JSX } from 'react'
import { SkipForward } from 'lucide-react'
import { BottomSheet, Button } from '@/components/ui'
import type { PlanUsage } from '@/db/catalog'
import { SKIP_STREAK_THRESHOLD } from '@/domain/skipStreak'

/**
 * "דילגת על זה שלוש פעמים ברצף — להוציא מהתוכנית?"
 *
 * ההצעה מגיעה מהנתונים ולא מהמשתמש, ולכן היא חייבת להיות קלה לדחייה: הכפתור
 * הראשי הוא *להשאיר*, וההוצאה היא הפעולה השנייה. תוכנית היא משהו שמישהו בנה
 * בכוונה, והאפליקציה מציעה לשנות אותה על סמך שלוש לחיצות — זה מספיק כדי
 * לשאול, ולא מספיק כדי לקבוע.
 *
 * ההוצאה מסירה את התרגיל מהתוכניות ומהבלוקים בלבד. הוא נשאר בקטלוג עם כל
 * ההיסטוריה, השיאים והסרטונים שלו, ואפשר להחזיר אותו בעורך התוכניות —
 * זה נאמר במפורש בגיליון, כי "להוציא" נשמע כמו "למחוק".
 */
export function SkipStreakSheet({
  open,
  exerciseName,
  usage,
  onKeep,
  onRemove,
}: {
  open: boolean
  exerciseName: string
  /** התוכניות והבלוקים שההוצאה תערוך — מוצגים בשמם לפני שמחליטים */
  usage: PlanUsage[]
  /** נסגר בלי לשנות כלום */
  onKeep: () => void
  /** מוציא מהתוכניות והבלוקים */
  onRemove: () => void
}): JSX.Element {
  return (
    <BottomSheet open={open} onClose={onKeep} title="להוציא אותו מהתוכנית?">
      <div className="pb-4">
        <div className="card flex items-start gap-3 p-4">
          <SkipForward size={22} className="mt-0.5 shrink-0 text-flame-400" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-base font-extrabold text-bone-50">{exerciseName}</p>
            <p className="mt-1 text-sm leading-relaxed text-bone-400">
              דילגת עליו {SKIP_STREAK_THRESHOLD} פעמים ברצף. תוכנית שכתוב בה תרגיל
              שלא עושים מודדת אותך מול משהו שלא קורה — פס ההתקדמות באימון וההצעה
              במסך הבית שניהם נשענים עליה.
            </p>
          </div>
        </div>

        {/*
          השמות מוצגים ולא נרמזים. ההוצאה נוגעת בכל תוכנית שהתרגיל חבר בה —
          כולל תוכנית כבויה ואימון שמור — ו"ההוצאה נוגעת רק לתוכניות" בלי אף
          שם היה מסתיר בדיוק את מה שצריך להחליט עליו.
        */}
        {usage.length > 0 ? (
          <div className="mt-3 rounded-card border border-ink-700 bg-ink-900/50 p-3">
            <p className="meta mb-1.5">
              {usage.length === 1 ? 'יוסר מ:' : `יוסר מ-${usage.length} מקומות:`}
            </p>
            <ul className="flex flex-col gap-1">
              {usage.map((place) => (
                <li
                  key={`${place.kind}-${place.id}`}
                  className="flex items-baseline gap-1.5 text-[0.8125rem] font-semibold text-bone-200"
                >
                  <span className="min-w-0 truncate">{place.name}</span>
                  {!place.active ? <span className="meta shrink-0">כבויה</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-3 px-1 text-xs leading-relaxed text-bone-500">
          התרגיל נשאר אצלך עם ההיסטוריה, השיאים והסרטונים — רק השורה בתוכנית
          נמחקת. אפשר להחזיר אותו בהגדרות ← עריכת האימונים.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button variant="flame" size="hero" fullWidth onClick={onKeep}>
            להשאיר בתוכנית
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={onRemove}>
            הוצא מהתוכנית
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
