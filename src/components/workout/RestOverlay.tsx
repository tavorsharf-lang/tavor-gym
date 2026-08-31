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
  /** היעד של הסט הבא, מפורק — הטווח חייב לרוץ LTR בנפרד */
  nextSet: {
    /** "52.5 ק״ג כל צד" — מה שהורם בפועל לפני רגע. null אחרי סט חימום. */
    weight: string | null
    /** "8–12". בלי בידוד כיווניות הוא נקרא כטווח יורד. */
    count: string
    /** "חזרות" או "להחזיק" */
    countLabel: string
  } | null
  /** האחוזים שמודפסים על הכרטיס, מהגדול לקטן */
  shares: readonly LoadShare[]
  /** מה מחכה בתור אחרי התרגיל הזה */
  next: { exerciseId: string; libraryId?: string; name: string; targetSets: number } | null
}

/** "נשאר 1" ולא "נשארו 1" — המסך הזה נקרא בחטף ושגיאת מספר נתקעת בעין */
function remainingChip(remaining: number): string {
  return remaining === 1 ? 'נשאר 1' : `נשארו ${remaining}`
}

/**
 * טיימר המנוחה.
 *
 * שלוש החלטות שמחזיקות את זה באוויר בחדר כושר אמיתי:
 *   1. הספירה מחושבת מול חותמת זמן סיום, לא מצבירת טיקים — המסך יכול לכבות,
 *      האפליקציה יכולה לרדת לרקע, והמספר עדיין יהיה נכון.
 *   2. בסיום יש גם צליל וגם הבזק כתום על כל המסך. מתג ההשתקה הפיזי של האייפון
 *      משתיק WebAudio, וההבזק הוא מה שנשאר כשזה קורה.
 *   3. הכפתורים גדולים ומעוגנים לתחתית — האגודל מגיע אליהם בלי להסתכל.
 *
 * והמסך עצמו הוא לא רק ספירה. הדקה הזו היא הזמן היחיד באימון שבו העיניים
 * פנויות, ולכן היא נושאת את מה שהכרטיס מציג ממילא: התמונה של התרגיל, כמה סטים
 * נשארו בו, מה היעד של הסט הבא, מה בא אחריו — ואת מפת השרירים עם האחוזים
 * שמודפסים על הכרטיס. הכל קריאה בלבד: אף מספר כאן אינו נערך, כדי שהמסך יישאר
 * מה שהוא — הפסקה.
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

  const ringSize = 208
  const radius = 96
  const circumference = 2 * Math.PI * radius
  const drained = circumference * Math.min(1, timer.progress)

  const remaining = focus ? Math.max(0, focus.targetSets - focus.doneWorkSets) : 0
  const startLabel =
    focus && remaining > 0 ? `התחל סט ${focus.doneWorkSets + 1}` : 'חזור לאימון'
  const setsLine = !focus
    ? null
    : focus.doneWorkSets === 0
      ? `${focus.targetSets} סטים בתרגיל הזה`
      : remaining === 0
        ? `היעד הושלם — ${focus.doneWorkSets} סטים`
        : `סט ${focus.doneWorkSets} הושלם · עוד ${remaining === 1 ? 'סט אחד' : remaining} בתרגיל הזה`
  // ארבעה שרירים ולא כולם: זו שורה אחת על מסך טלפון, והזנב של 5% ממילא
  // אינו מה שמסתכלים עליו בהפסקה
  const shares = focus ? focus.shares.slice(0, 4) : []

  const clockText = formatClock(timer.remainingSeconds)

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col animate-fade" role="dialog" aria-modal="true">
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
      {flash && (
        <div className="pointer-events-none absolute inset-0 animate-flash bg-flame-500" />
      )}

      {/*
        כותרת שמחזירה את מה שהשכבה מסתירה: השעון של האימון, הוספת תרגיל
        וסיום. שלושתם קטנים ורחוקים מהאגודל — היעד היחיד באזור הנוח הוא
        הכפתור הכתום שבתחתית.
      */}
      <div
        className="relative flex shrink-0 items-center gap-2 px-4"
        style={{ paddingTop: 'calc(var(--safe-t) + 0.5rem)' }}
      >
        <ElapsedClock startedAt={startedAt} className="min-h-9" label="זמן מתחילת האימון, בזמן מנוחה" />
        <span className="meta">מתחילת האימון</span>

        <span className="flex-1" />

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
            className="flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-bone-400 active:bg-ink-800"
          >
            סיים
          </button>
        ) : null}
      </div>

      {/*
        גוף גליל: על מסך קטן מפת השרירים יורדת מתחת לקו, והכפתור הכתום נשאר
        מעוגן. `overscroll-contain` כדי שהגלילה לא תדלוף למסך שמאחור.
      */}
      <div className="relative flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-4">
        <div className="mx-auto flex w-full max-w-md flex-col items-center">
          <p className="meta mb-3 uppercase">מנוחה</p>

          <div className="relative mb-6" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} className="-rotate-90">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="var(--color-ink-800)"
                strokeWidth={6}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="var(--color-flame-500)"
                strokeWidth={6}
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
                <img
                  src={assetUrl(focus.image.thumb)}
                  srcSet={`${assetUrl(focus.image.thumb)} 200w, ${assetUrl(focus.image.src)} 1100w`}
                  sizes="200px"
                  alt=""
                  className="absolute rounded-full bg-bone-50 object-contain"
                  style={{ inset: 12 }}
                />
                {/*
                  הספירה יושבת על שפת הטבעת ולא במרכזה: במרכז יש עכשיו תמונה,
                  ומספר על גבי איור לבן הוא בדיוק המקום שבו קריאות נשברת.
                */}
                <span
                  dir="ltr"
                  aria-hidden="true"
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-pill border border-ink-700 bg-ink-950/95 px-5 py-1.5 numeral-hero text-[2.25rem] shadow-lg ${
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
                  className={`numeral-hero tabular-nums text-[4rem] ${
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

          {focus && (
            <>
              <h2 className="text-center text-2xl leading-tight font-extrabold text-bone-50">
                {focus.name}
                <span className="ms-2 align-middle text-sm font-bold text-bone-500">עבד עכשיו</span>
              </h2>
              {focus.nextSet && (
                <p className="mt-1.5 text-center text-sm font-semibold text-bone-400">
                  הסט הבא —{' '}
                  {focus.nextSet.weight && (
                    <>
                      <span className="tnum text-bone-200">{focus.nextSet.weight}</span>
                      {' · '}
                    </>
                  )}
                  {/* אי LTR: בלי זה "8–12" מוצג כ-"12–8" ונקרא כטווח יורד */}
                  <span dir="ltr" className="tnum text-bone-200">
                    {focus.nextSet.count}
                  </span>{' '}
                  {focus.nextSet.countLabel}
                </p>
              )}

              {/* כמה נשאר בתרגיל הזה — אותו מד בדיוק שעל הכרטיס */}
              <div className="card mt-5 w-full p-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-semibold text-bone-400">{setsLine}</p>
                  {remaining > 0 && (
                    <span className="shrink-0 text-xs font-extrabold text-flame-400">
                      {remainingChip(remaining)}
                    </span>
                  )}
                </div>
                <PlateProgress
                  className="mt-2.5"
                  total={focus.targetSets}
                  states={focus.segments}
                />
              </div>

              {focus.next && (
                /*
                  מה בא אחרי. בהפסקה שאחרי הסט האחרון זו השאלה הבאה ממש, ועד
                  כאן התשובה עליה דרשה לסגור את המסך ולגלול את התור.
                */
                <div className="mt-2.5 flex w-full items-center gap-3 rounded-card border border-flame-500/35 bg-flame-500/5 p-3">
                  <ExerciseThumb
                    exerciseId={focus.next.exerciseId}
                    libraryId={focus.next.libraryId}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="meta">
                      {remaining > 0 ? 'ואחר כך — התרגיל הבא' : 'התרגיל הבא'}
                    </p>
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
                <section className="mt-5 w-full">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-bone-200">
                      מפת השרירים בתרגיל הזה
                    </h3>
                    {/* מאיפה המספרים. בלי זה הם נקראים כהערכה שלנו, והם תמלול. */}
                    <span className="meta">כפי שהם על הכרטיס</span>
                  </div>
                  {/*
                    שורה במרכז ולא רשת של ארבע עמודות: אחרי שהראשים מתאחדים
                    לשם אחד יש תרגילים עם שני שרירים בלבד, ורשת קבועה הייתה
                    דוחפת אותם לצד אחד ומשאירה חצי שורה ריקה.
                  */}
                  <ul className="flex flex-wrap justify-center gap-2">
                    {shares.map((share, i) => (
                      <li key={share.name} className="w-[calc((100%-1.5rem)/4)] min-w-20">
                        <button
                          type="button"
                          disabled={!share.card}
                          onClick={() => setCard(share.card)}
                          aria-label={
                            share.card
                              ? `${share.name} ${share.pct} אחוז — איפה השריר הזה יושב`
                              : `${share.name} ${share.pct} אחוז`
                          }
                          className="flex w-full flex-col items-center gap-1.5 rounded-card border border-ink-700 bg-ink-900/60 p-1.5 text-center transition-transform active:scale-95 disabled:active:scale-100"
                        >
                          {share.card ? (
                            <img
                              src={assetUrl(share.card.thumb)}
                              alt=""
                              className="aspect-square w-full rounded-lg bg-bone-50 object-contain"
                              loading="lazy"
                            />
                          ) : (
                            /* שומר על יישור השורה כששריר אחד הוא "מייצבים" */
                            <span
                              className="aspect-square w-full rounded-lg border border-dashed border-ink-800"
                              aria-hidden="true"
                            />
                          )}
                          {/*
                            השם של האפליקציה בלבד — "ארבע-ראשי", לא "וסטוס
                            מדיאליס". הכרטיס מדפיס 116 תוויות שונות לאותם
                            שרירים, והמסך הזה מדבר באותה שפה שבה כתובים
                            הסינון, כותרות הרשימה וכרטיס התרגיל.
                          */}
                          <span className="w-full text-[0.6875rem] leading-tight font-bold text-balance text-bone-200">
                            {share.name}
                          </span>
                          <span
                            className={`tnum text-xs font-extrabold ${
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

          {/*
            כיבוי הטיימר בתחתית התוכן ולא ליד כפתורי הפעולה: זו החלטה לכל
            האימון ולא רפלקס של אמצע סט, והמרחק מהאגודל הוא מה שמונע לחיצה
            בטעות בדיוק ברגע שמחכים לצפצוף.
          */}
          <button
            onClick={onDisable}
            className="mt-6 flex min-h-11 items-center gap-2 rounded-pill border border-ink-700 bg-ink-900/70 px-4 text-xs font-bold text-bone-400 active:bg-ink-800"
          >
            <TimerOff size={14} />
            אני עם שעון — כבה את טיימר המנוחה
          </button>
        </div>
      </div>

      <div className="relative shrink-0 border-t border-ink-800/70 bg-ink-950/80 px-5 pt-3 pb-safe backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2.5">
          <button
            onClick={onStartSet}
            className="btn-flame flex h-16 w-full items-center justify-center rounded-card text-lg"
          >
            {startLabel}
          </button>

          {/*
            dir="ltr" בכוונה: מינוס בצד השמאלי הפיזי ופלוס בימני, בדיוק כמו
            ה-Stepper של המשקל. האצבע עוברת ישירות מהאחד לשני באמצע אימון,
            ושיקוף היה גורם להוריד זמן במקום להוסיף.
          */}
          <div dir="ltr" className="flex items-stretch gap-3">
            <button
              onClick={() => onAdjust(-30)}
              aria-label="הפחת 30 שניות"
              className="btn-ghost flex h-13 flex-1 items-center justify-center gap-1.5 rounded-card text-base font-bold"
            >
              <Minus size={18} />
              30
            </button>
            <button
              onClick={() => onAdjust(30)}
              aria-label="הוסף 30 שניות"
              className="btn-ghost flex h-13 flex-1 items-center justify-center gap-1.5 rounded-card text-base font-bold"
            >
              <Plus size={18} />
              30
            </button>
          </div>
        </div>
      </div>

      <MuscleCardSheet card={card} onClose={() => setCard(null)} />
    </div>,
    document.body
  )
}
