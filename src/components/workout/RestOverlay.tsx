import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, TimerOff } from 'lucide-react'
import { useRestTimer } from '@/hooks/useRestTimer'
import type { AudioCue } from '@/hooks/useAudioCue'
import { formatClock } from '@/domain/units'
import { assetUrl } from '@/db/mediaDb'
import type { ExerciseImage } from '@/db/imageManifest'
import type { LoadShare } from '@/db/loadMap'
import type { MuscleCardImage } from '@/db/muscleImageManifest'
import { MuscleCardSheet } from '@/components/exercises/MuscleCardSheet'
import { PlateProgress } from '@/components/ui'
import type { PlateSegState } from '@/components/ui'
import { ExerciseThumb } from '@/components/media/ExerciseThumb'
import { ElapsedClock } from './ElapsedClock'

/**
 * מה שמסך המנוחה יודע על התרגיל שממנו נחים.
 *
 * מחושב במסך האימון ולא כאן: שם כבר יושבים התור, הסטים וההגדרות, וחישוב שני
 * שלהם בתוך השכבה היה מקור שני לאותה אמת — ובדיוק בזמן שהמספרים על שני המסכים
 * חייבים להסכים.
 */
export interface RestFocus {
  /** התרגיל שסיימנו בו סט לפני רגע */
  name: string
  /** כרטיס השרירים שלו — מה שממלא את הטבעת */
  image: ExerciseImage | null
  /** מצב הסטים שכבר בוצעו, בדיוק כמו על הכרטיס */
  segments: PlateSegState[]
  targetSets: number
  doneWorkSets: number
  /**
   * היעד של הסט הבא. משקל אינו נמצא כאן בכוונה: המסך הזה נקרא בהצצה, והמספר
   * שקובע לסט הבא כבר יושב גדול על הכרטיס שמאחור.
   */
  nextSet: {
    /** "8–12". בלי בידוד כיווניות הוא נקרא כטווח יורד. */
    count: string
    /** "חזרות" או "להחזיק" */
    countLabel: string
  } | null
  /** האחוזים שמודפסים על הכרטיס, מהגדול לקטן */
  shares: readonly LoadShare[]
  /** מה מחכה בתור אחרי התרגיל הזה */
  next: {
    exerciseId: string
    libraryId?: string
    name: string
    targetSets: number
  } | null
}

/** "נשאר 1" ולא "נשארו 1" — המסך הזה נקרא בחטף ושגיאת מספר נתקעת בעין */
function remainingChip(remaining: number): string {
  return remaining === 1 ? 'נשאר 1' : `נשארו ${remaining}`
}

/**
 * טיימר המנוחה.
 *
 * ארבע החלטות שמחזיקות את זה באוויר בחדר כושר אמיתי:
 *   1. הספירה מחושבת מול חותמת זמן סיום, לא מצבירת טיקים — המסך יכול לכבות,
 *      האפליקציה יכולה לרדת לרקע, והמספר עדיין יהיה נכון.
 *   2. בסיום יש גם צליל וגם הבזק כתום על כל המסך. מתג ההשתקה הפיזי של האייפון
 *      משתיק WebAudio, וההבזק הוא מה שנשאר כשזה קורה.
 *   3. הכפתורים גדולים ומעוגנים לתחתית — האגודל מגיע אליהם בלי להסתכל.
 *   4. **המסך לא נגלל.** הכל נכנס למסך אחד, וכל שורת מלל שנוספת כאן חייבת
 *      לבוא על חשבון אחרת. מנוחה היא הצצה של שנייה, ומסך שצריך לגלול בו כדי
 *      לראות מה הלאה הוא מסך שלא קוראים.
 *
 * והמסך עצמו הוא לא רק ספירה. הדקה הזו היא הזמן היחיד באימון שבו העיניים
 * פנויות, ולכן היא נושאת את מה שהכרטיס מציג ממילא: התמונה של התרגיל, כמה סטים
 * נשארו בו, מה בא אחריו — ואת מפת השרירים עם האחוזים שמודפסים על הכרטיס. הכל
 * קריאה בלבד: אף מספר כאן אינו נערך, כדי שהמסך יישאר מה שהוא — הפסקה.
 */
export function RestOverlay({
  endsAt,
  totalSeconds,
  audio,
  onAdjust,
  onStartSet,
  onDisable,
  focus,
  onAddExercise,
  onFinishWorkout,
  startedAt,
}: {
  endsAt: number | null
  totalSeconds: number
  audio: AudioCue
  onAdjust: (deltaSeconds: number) => void
  /**
   * מסיים את המנוחה וחוזר לכרטיס.
   *
   * זה מה שהיה "דלג", ובכוונה בשם אחר: הפעולה זהה אבל המשמעות הפוכה. "דלג"
   * מתאר ויתור על משהו, והלחיצה הזו היא בדיוק ההפך — היא ההתחלה של הסט הבא.
   */
  onStartSet: () => void
  /**
   * כיבוי טיימר המנוחה מכאן והלאה — לא רק דילוג על המנוחה הזו.
   * למי שמתעד מנוחה בשעון: המסך הזה מיותר, והכפתור בראש המסך מכבה אותו
   * לכל האימון. ההדלקה חזרה ממסך האימון או מההגדרות.
   */
  onDisable: () => void
  /** התרגיל שממנו נחים. null כשהפריט נעלם מהתור באמצע המנוחה. */
  focus: RestFocus | null
  /**
   * פותח את בורר התרגילים מתוך המנוחה.
   *
   * המנוחה היא הדקה היחידה באימון שבה יש ידיים פנויות וראש פנוי, וזה בדיוק
   * הזמן שבו מחליטים מה הלאה. עד כאן המסך הזה חסם את כל הכותרת, ולכן הוספת
   * תרגיל דרשה קודם לדלג על הטיימר — כלומר לוותר על המנוחה כדי לתכנן אותה.
   *
   * הגיליון נפתח *מעל* המסך הזה ולא במקומו: שני פורטלים, והאחרון ב-DOM הוא
   * שלמעלה. הספירה ממשיכה מתחתיו, וסגירת הגיליון מחזירה אליה.
   */
  onAddExercise?: () => void
  /**
   * סיום האימון מתוך המנוחה, מאותה סיבה בדיוק שבגללה "הוסף תרגיל" כאן:
   * ההחלטה "מספיק להיום" נופלת בהפסקה, לא באמצע סט, והכותרת שבה הכפתור
   * הזה יושב חסומה על ידי המסך הזה.
   */
  onFinishWorkout?: () => void
  /**
   * תחילת האימון, כדי ששעון האימון ימשיך להיראות גם מכאן.
   *
   * המסך הזה חוסם את כותרת האימון לגמרי, ומנוחה היא בדיוק הרגע שבו שואלים
   * "כמה זמן אני כבר פה". בלי זה השעון היחיד שרואים בזמן מנוחה הוא הספירה
   * לאחור — ושני מספרים שונים עדיף להם לחיות במקומות שונים על המסך.
   */
  startedAt: number
}) {
  const [flash, setFlash] = useState(false)
  const [card, setCard] = useState<MuscleCardImage | null>(null)
  const flashTimer = useRef<number | null>(null)

  const timer = useRestTimer(endsAt, totalSeconds, () => {
    // מנוחה שהסתיימה לפני יותר מדקה כבר לא רלוונטית — לא מצפצפים על היסטוריה
    if (endsAt !== null && Date.now() - endsAt > 60_000) return
    audio.beep('done')
    setFlash(true)
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(false), 1500)
  })

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
    }
  }, [])

  // שלוש השניות האחרונות מקבלות פעימה — התראה מקדימה בלי צליל
  const urgent = timer.active && timer.remainingSeconds <= 3 && timer.remainingSeconds > 0

  if (!timer.active && !flash) return null

  /*
    הטבעת נמדדת ביחידות ה-viewBox ולא בפיקסלים, כי הקופסה עצמה משנה גודל לפי
    המסך. שני מספרים מחזיקים את ההיקף מדויק:
      • הרדיוס הוא חצי התיבה *פחות חצי עובי* — כך הקצה החיצוני של הקו נוחת
        בדיוק על שפת הקופסה ולא נחתך.
      • התמונה נדחפת פנימה בדיוק בעובי הקו ועוד שערה, ולכן העיגול הלבן משיק
        לצד הפנימי של הטבעת לכל אורכה במקום להשאיר סהר בצד אחד.
    ה-SVG עצמו ממוקם `absolute inset-0` ולא זורם בשורה: אלמנט inline יושב על
    קו הבסיס של הטקסט, וזה מה שהזיז אותו קודם כמה פיקסלים ביחס לתמונה.
  */
  const VIEW = 100
  const STROKE = 3.4
  const radius = VIEW / 2 - STROKE / 2
  const circumference = 2 * Math.PI * radius
  const drained = circumference * Math.min(1, timer.progress)
  const imageInset = `${STROKE + 0.6}%`

  const remaining = focus ? Math.max(0, focus.targetSets - focus.doneWorkSets) : 0
  /*
    הכפתור אומר לאן הלחיצה מובילה, לא איזו פעולה היא מבצעת: "סט הבא" כשנשאר
    סט בתרגיל הזה, "לתרגיל הבא" כשהיעד הושלם ויש עוד משהו בתור, ו"חזור לאימון"
    רק כשגם זה לא — שם אין "הבא" שאפשר להבטיח.
  */
  const startLabel = !focus
    ? 'חזור לאימון'
    : remaining > 0
      ? 'סט הבא'
      : focus.next
        ? 'לתרגיל הבא'
        : 'חזור לאימון'
  const setsLine = !focus
    ? null
    : focus.doneWorkSets === 0
      ? `${focus.targetSets} סטים בתרגיל הזה`
      : remaining === 0
        ? `היעד הושלם — ${focus.doneWorkSets} סטים`
        : `סט ${focus.doneWorkSets} הושלם`
  // ארבעה שרירים ולא כולם: זו שורה אחת על מסך טלפון, והזנב של 5% ממילא
  // אינו מה שמסתכלים עליו בהפסקה
  const shares = focus ? focus.shares.slice(0, 4) : []

  const clockText = formatClock(timer.remainingSeconds)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-fade"
      role="dialog"
      aria-modal="true"
    >
      {/* רקע: שחור עמוק עם הילת חום שמתחזקת ככל שנשאר פחות זמן */}
      <div
        className="absolute inset-0 bg-ink-950/97 backdrop-blur-xl transition-[background] duration-1000"
        style={{
          // הגוון מהטוקן ולא כליטרל: שינוי צבע המבטא לא אמור להשאיר את
          // מסך המנוחה — המסך הכי כתום באפליקציה — על הגוון הישן
          backgroundImage: `radial-gradient(90% 55% at 50% 42%, color-mix(in srgb, var(--color-flame-500) ${
            (0.06 + 0.16 * timer.progress) * 100
          }%, transparent), transparent 70%)`,
        }}
      />
      {flash && <div className="pointer-events-none absolute inset-0 animate-flash bg-flame-500" />}

      {/*
        כותרת שמחזירה את מה שהשכבה מסתירה: השעון של האימון, כיבוי הטיימר,
        הוספת תרגיל וסיום. כולם קטנים ורחוקים מהאגודל — היעד היחיד באזור הנוח
        הוא הכפתור הכתום שבתחתית.
      */}
      <div
        className="relative flex shrink-0 items-center gap-1 px-4"
        style={{ paddingTop: 'calc(var(--safe-t) + 0.5rem)' }}
      >
        <ElapsedClock
          startedAt={startedAt}
          className="min-h-9"
          label="זמן מתחילת האימון, בזמן מנוחה"
        />
        <span className="meta">מתחילת האימון</span>

        <span className="flex-1" />

        {/*
          כיבוי הטיימר לכל האימון. בכותרת ולא ליד כפתורי הפעולה: זו החלטה
          לכל האימון ולא רפלקס של אמצע סט, והמרחק מהאגודל הוא מה שמונע לחיצה
          בטעות בדיוק ברגע שמחכים לצפצוף.
        */}
        <button
          onClick={onDisable}
          aria-label="אני עם שעון — כבה את טיימר המנוחה"
          className="flex size-11 items-center justify-center rounded-full text-bone-400 active:bg-ink-800"
        >
          <TimerOff size={18} />
        </button>
        {onAddExercise ? (
          <button
            onClick={onAddExercise}
            /*
              תווית מפורשת ושונה מזו של הכפתור בכותרת האימון. שני כפתורים
              באותו שם נגיש שיכולים להיות על המסך יחד הם עמימות אמיתית — גם
              לקורא מסך, וגם לכל שאילתת בדיקה שמחפשת אחד מהם לפי שם.
            */
            aria-label="הוסף תרגיל לאימון בזמן המנוחה"
            className="flex size-11 items-center justify-center rounded-full text-bone-400 active:bg-ink-800"
          >
            <Plus size={20} />
          </button>
        ) : null}
        {onFinishWorkout ? (
          <button
            onClick={onFinishWorkout}
            className="flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-bone-400 active:bg-ink-800"
          >
            סיים
          </button>
        ) : null}
      </div>

      {/*
        גוף שאינו נגלל: `overflow-hidden` ולא `auto`. מה שנכנס לכאן חייב
        להיכנס למסך אחד, ולכן הטבעת גמישה והמלל מהודק עד העצם.
      */}
      <div className="relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center overflow-hidden px-5 pb-2">
        {/*
          הטבעת בולעת את כל האוויר שנשאר על המסך, וזה מה שמחזיק אותו בלי
          גלילה: היא מקבלת את מה ששאר השורות לא לקחו (`flex-1`), ריבוע לפי
          הגובה הזה (`aspect-square h-full`) ולא לפי מספר קבוע. על מסך גבוה
          התמונה גדלה וממורכזת בין הכותרת למד הסטים, ועל מסך נמוך היא
          מצטמצמת עד שהכל נכנס — במקום לדחוף את מפת השרירים אל מחוץ למסך.
          התקרה היא רוחב המסך, כי ריבוע שגובהו רב מרוחבו כבר יוצא מהצדדים.
        */}
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div className="relative aspect-square h-full max-h-[66vw]">
            <svg
              viewBox={`0 0 ${VIEW} ${VIEW}`}
              className="absolute inset-0 block size-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx={VIEW / 2}
                cy={VIEW / 2}
                r={radius}
                fill="none"
                stroke="var(--color-ink-800)"
                strokeWidth={STROKE}
              />
              <circle
                cx={VIEW / 2}
                cy={VIEW / 2}
                r={radius}
                fill="none"
                stroke="var(--color-flame-500)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={drained}
                style={{
                  filter:
                    'drop-shadow(0 0 8px color-mix(in srgb, var(--color-flame-500) 65%, transparent))',
                }}
              />
            </svg>

            {focus?.image ? (
              <>
                {/*
                  כרטיס השרירים ממלא את הטבעת. הוא מזהה את התרגיל בלי לקרוא
                  מילה, וזו התשובה השקטה ל"רגע, על מה אני נח" כשמרימים את
                  העיניים מהטלפון של מישהו אחר באמצע ההפסקה.
                */}
                <span
                  className="absolute overflow-hidden rounded-full bg-bone-50"
                  style={{ inset: imageInset }}
                >
                  {/*
                    התמונה יושבת בתוך עוטף ולא ישירות על ה-inset. `img` הוא
                    אלמנט מוחלף: כשרוחבו `auto` הוא נופל לרוחב הטבעי שלו ומתעלם
                    מהצד השני של ה-inset — כלומר נמתח על כל התיבה ונדחף לפינה.
                    זה בדיוק מה שנראה כמו טבעת "לא אחידה": לא הטבעת זזה, התמונה
                    גלשה מתחתיה.
                  */}
                  <img
                    src={assetUrl(focus.image.thumb)}
                    srcSet={`${assetUrl(focus.image.thumb)} 240w, ${assetUrl(focus.image.src)} 1100w`}
                    sizes="260px"
                    alt=""
                    className="size-full object-contain"
                  />
                </span>
                {/*
                  הספירה יושבת על שפת הטבעת ולא במרכזה: במרכז יש עכשיו תמונה,
                  ומספר על גבי איור לבן הוא בדיוק המקום שבו קריאות נשברת.
                */}
                <span
                  dir="ltr"
                  aria-hidden="true"
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-pill border border-ink-700 bg-ink-950/95 px-4 py-1 numeral-hero text-[clamp(1.5rem,7vw,2.25rem)] shadow-lg ${
                    urgent ? 'animate-heat text-flame-400' : 'text-bone-50'
                  }`}
                >
                  {clockText}
                </span>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  dir="ltr"
                  aria-hidden="true"
                  className={`numeral-hero tabular-nums text-[clamp(2.5rem,14vw,4rem)] ${
                    urgent ? 'animate-heat text-flame-400' : 'text-bone-50'
                  }`}
                >
                  {clockText}
                </span>
              </div>
            )}
            {/* הזמן עצמו לקורא מסך — פעם אחת, בלי קשר לאיפה הוא מצויר */}
            <span role="timer" aria-label={`נותרו ${clockText} למנוחה`} className="sr-only">
              {clockText}
            </span>
          </div>
        </div>

        {focus && (
          <>
            {/* מרווח לשלט הספירה שיוצא מתחת לטבעת */}
            <h2 className="mt-6 text-center text-xl leading-tight font-extrabold text-bone-50">
              {focus.name}
            </h2>

            {/* כמה נשאר בתרגיל הזה — אותו מד בדיוק שעל הכרטיס */}
            <div className="card mt-2.5 w-full p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-semibold text-bone-400">
                  {setsLine}
                  {focus.nextSet && remaining > 0 && (
                    <>
                      {' · '}
                      {/* אי LTR: בלי זה "8–12" מוצג כ-"12–8" ונקרא כטווח יורד */}
                      <span dir="ltr" className="tnum text-bone-200">
                        {focus.nextSet.count}
                      </span>{' '}
                      {focus.nextSet.countLabel}
                    </>
                  )}
                </p>
                {remaining > 0 && (
                  <span className="shrink-0 text-xs font-extrabold text-flame-400">
                    {remainingChip(remaining)}
                  </span>
                )}
              </div>
              <PlateProgress className="mt-2" total={focus.targetSets} states={focus.segments} />
            </div>

            {focus.next && (
              /*
                מה בא אחרי. בהפסקה שאחרי הסט האחרון זו השאלה הבאה ממש, ועד
                כאן התשובה עליה דרשה לסגור את המסך ולגלול את התור.
              */
              <div className="mt-2 flex w-full items-center gap-2.5 rounded-card border border-flame-500/35 bg-flame-500/5 p-2.5">
                <ExerciseThumb
                  exerciseId={focus.next.exerciseId}
                  libraryId={focus.next.libraryId}
                  size="xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="meta">{remaining > 0 ? 'ואחר כך — התרגיל הבא' : 'התרגיל הבא'}</p>
                  <p className="mt-0.5 truncate text-sm font-extrabold text-bone-50">
                    {focus.next.name}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold text-bone-400">
                  {focus.next.targetSets} סטים
                </span>
              </div>
            )}

            {shares.length > 0 && (
              <section className="w-full">
                <h3 className="mb-1.5 text-xs font-extrabold text-bone-200">
                  מפת השרירים בתרגיל הזה
                </h3>
                {/*
                  שורה במרכז ולא רשת של ארבע עמודות: אחרי שהראשים מתאחדים
                  לשם אחד יש תרגילים עם שני שרירים בלבד, ורשת קבועה הייתה
                  דוחפת אותם לצד אחד ומשאירה חצי שורה ריקה.
                */}
                <ul className="flex flex-wrap items-stretch justify-center gap-2">
                  {shares.map((share, i) => (
                    <li key={share.name} className="w-[calc((100%-1.5rem)/4)] min-w-16 max-w-24">
                      <button
                        type="button"
                        disabled={!share.card}
                        onClick={() => setCard(share.card)}
                        aria-label={
                          share.card
                            ? `${share.name} ${share.pct} אחוז — איפה השריר הזה יושב`
                            : `${share.name} ${share.pct} אחוז`
                        }
                        className="flex h-full w-full flex-col items-center gap-1 rounded-card border border-ink-700 bg-ink-900/60 p-1.5 text-center transition-transform active:scale-95 disabled:active:scale-100"
                      >
                        {share.card ? (
                          <img
                            src={assetUrl(share.card.thumb)}
                            alt=""
                            className="aspect-square w-full max-h-[9vh] rounded-lg bg-bone-50 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          /* שומר על יישור השורה כששריר אחד הוא "מייצבים" */
                          <span
                            className="aspect-square w-full max-h-[9vh] rounded-lg border border-dashed border-ink-800"
                            aria-hidden="true"
                          />
                        )}
                        {/*
                          השם של האפליקציה בלבד — "ארבע-ראשי", לא "וסטוס
                          מדיאליס". הכרטיס מדפיס 116 תוויות שונות לאותם
                          שרירים, והמסך הזה מדבר באותה שפה שבה כתובים
                          הסינון, כותרות הרשימה וכרטיס התרגיל.
                        */}
                        <span className="w-full text-[0.625rem] leading-tight font-bold text-balance text-bone-200">
                          {share.name}
                        </span>
                        <span
                          className={`tnum text-[0.6875rem] font-extrabold ${
                            i === 0 ? 'text-flame-400' : 'text-bone-400'
                          }`}
                        >
                          {share.pct}%
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {/*
        שורה אחת בתחתית: הכתום באמצע, והכוונון משני צדדיו. שלושתם יחד חוסכים
        את השורה שדחפה קודם את מפת השרירים אל מתחת לקו, והאגודל מגיע לשלושתם
        בלי לזוז.

        dir="ltr" בכוונה: מינוס בצד השמאלי הפיזי ופלוס בימני, בדיוק כמו
        ה-Stepper של המשקל. האצבע עוברת ישירות מהאחד לשני באמצע אימון,
        ושיקוף היה גורם להוריד זמן במקום להוסיף.
      */}
      <div className="relative shrink-0 border-t border-ink-800/70 bg-ink-950/80 px-4 pt-3 pb-safe backdrop-blur-xl">
        <div dir="ltr" className="mx-auto flex w-full max-w-md items-stretch gap-2.5">
          <button
            onClick={() => onAdjust(-30)}
            aria-label="הפחת 30 שניות"
            className="btn-ghost flex h-16 w-[4.25rem] shrink-0 items-center justify-center gap-0.5 rounded-card text-base font-bold"
          >
            <Minus size={16} />
            30
          </button>
          <button
            onClick={onStartSet}
            dir="rtl"
            className="btn-flame flex h-16 flex-1 items-center justify-center rounded-card text-lg"
          >
            {startLabel}
          </button>
          <button
            onClick={() => onAdjust(30)}
            aria-label="הוסף 30 שניות"
            className="btn-ghost flex h-16 w-[4.25rem] shrink-0 items-center justify-center gap-0.5 rounded-card text-base font-bold"
          >
            <Plus size={16} />
            30
          </button>
        </div>
      </div>

      <MuscleCardSheet card={card} onClose={() => setCard(null)} />
    </div>,
    document.body,
  )
}
