import type { Exercise, RoutineId, Session } from '@/db/types'

/**
 * חזרה על האימון הקודם.
 *
 * הדלתות הקיימות לאימון שואלות שאלה לפני הסט הראשון: הבונה שואל על אילו
 * שרירים לעבוד ואיזה תרגיל מכל אחד, האימון החופשי שואל שריר, והתוכניות
 * שואלות איזו תוכנית. כאן אין שאלה — זה מה שעשית בפעם הקודמת, באותו סדר.
 *
 * מי שמתאמן דרך הבונה משלם את המחיר הזה בכל אימון מחדש: אימון של הבונה הוא
 * ‏`routineId: null`, ולכן אין לו שום צורה לחזור חוץ מלבנות את הסל שוב
 * מאפס. תוכנית קבועה לפחות יושבת על מסך הבית.
 */

export interface RepeatPlan {
  /** התרגילים שבוצעו בפועל, בסדר הביצוע, מסוננים למה שעדיין בקטלוג */
  exerciseIds: string[]
  routineId: RoutineId | null
  blockIds: string[]
}

export function repeatLast(
  session: Session | null | undefined,
  exercises: readonly Exercise[]
): RepeatPlan | null {
  if (!session) return null

  const trainable = new Set(exercises.filter((e) => e.isActive).map((e) => e.id))

  /*
    ‏`actualOrder` ולא `plannedOrder`, וזה כל ההבדל.

    ‏`plannedOrder` הוא מה שהתוכנית אמרה, כולל מה שדילגת עליו — חזרה עליו
    הייתה מחזירה בדיוק את מה שוויתרת עליו, ועוד מציגה אותו ראשון אם שם הוא
    ישב. ‏`actualOrder` נבנה ב-`finish` מהסט הראשון של כל תרגיל, ולכן הוא גם
    הרשימה הנכונה וגם הסדר הנכון: מה שבאמת עשית, בסדר שבו באמת עשית.
  */
  const seen = new Set<string>()
  const exerciseIds = session.actualOrder.filter((id) => {
    if (seen.has(id) || !trainable.has(id)) return false
    seen.add(id)
    return true
  })

  /*
    אין על מה לחזור — אימון שנסגר בלי אף סט, או שכל תרגיליו הוצאו מהקטלוג
    מאז. מחזירים null ולא רשימה ריקה, כדי שמסך הבית פשוט לא יציג את השורה:
    כפתור שפותח אימון בלי תרגילים הוא הבטחה שבורה.
  */
  if (exerciseIds.length === 0) return null

  /*
    התוכנית והבלוקים נשמרים, ולכן חזרה על "פול באדי א׳" נספרת כביצוע שלו.

    בלעדיהם האימון החוזר היה נרשם כ"אימון חופשי", מסך הבית היה ממשיך להציע
    את אותה תוכנית בדיוק אחרי שעשית אותה, ושם האימון בהיסטוריה היה אובד.
    זו חזרה על האימון כפי שהיה — גם על מה שהוא היה, לא רק על מה שהיה בו.
  */
  return {
    exerciseIds,
    routineId: session.routineId,
    blockIds: [...session.blockIds],
  }
}
