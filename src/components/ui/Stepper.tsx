import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Minus, Plus } from 'lucide-react'
import { round2, roundToIncrement } from '@/domain/units'

/**
 * הפקד המרכזי של האפליקציה — משקל וחזרות באמצע סט.
 *
 * שלושה דברים שהוא חייב לעשות טוב: להיות גדול מספיק ליד רועדת, לתת גם הקלדה
 * ישירה כשהקפיצה גדולה, ולחזור על עצמו בלחיצה ממושכת בלי לרוץ מהר מדי בהתחלה.
 */

export interface StepperProps {
  value: number
  onChange: (v: number) => void
  step: number
  min?: number
  max?: number
  /** התווית מעל השדה, למשל 'משקל' */
  label: string
  /** הבהרה קטנה לצד התווית, למשל 'ק״ג כל צד' */
  suffix?: string
  /**
   * היחידה שנכתבת *מתחת למספר עצמו*, בתוך המסגרת — 'ק״ג', 'חזרות'.
   *
   * התווית שמעל השדה נקראת פעם אחת כשמגיעים לכרטיס; באמצע סט העין נופלת על
   * המספר בלבד, וצריך שיהיה כתוב עליו מה הוא. בלי זה שני מספרים גדולים זה לצד
   * זה נראים אותו דבר, וזו בדיוק הטעות שעולה סט שלם.
   */
  unit?: string
  /** שורה מתחת לפקד — למה הכפתורים קופצים בקפיצה הזו, או מה אפשר להקליד */
  hint?: string
  decimals?: 0 | 1 | 2
  size?: 'md' | 'hero'
  disabled?: boolean
  /**
   * `tile` — הפקד כאריח בתוך במת הסט: מסגרת אחת סביב הכל, ± בגודל 42,
   * והתווית יורדת לקורא מסך בלבד. הלוגיקה זהה לחלוטין; מה שמשתנה הוא
   * שהאריח הוא יחידה אחת שאפשר להאיר, ולא שלושה פקדים בשורה.
   */
  variant?: 'stack' | 'tile'
  /** ‏`tile` בלבד — האריח הפעיל, זה ששורת השבבים מדברת עליו */
  focused?: boolean
  /** ‏`tile` בלבד — נגיעה כלשהי באריח מעבירה אליו את המיקוד */
  onActivate?: () => void
}

const HOLD_DELAY_MS = 400
const HOLD_INTERVAL_MS = 90
const HOLD_FAST_MS = 45
const HOLD_ACCELERATE_AFTER_MS = 1500

/** מספר הספרות נגזר מהצעד: 5 → 0, ‏2.5 → 1, ‏1.25 → 2 */
function decimalsForStep(step: number): 0 | 1 | 2 {
  if (!Number.isFinite(step) || Number.isInteger(step)) return 0
  return Number.isInteger(round2(step * 10)) ? 1 : 2
}

/** כמה ספרות אחרי הנקודה יש בערך עצמו */
function decimalsOf(value: number): 0 | 1 | 2 {
  const r = round2(value)
  if (Number.isInteger(r)) return 0
  return Math.abs(r * 10 - Math.round(r * 10)) < 1e-9 ? 1 : 2
}

/**
 * '60' ולא '60.0', אבל '22.5' נשאר מדויק.
 *
 * הדיוק נגזר מהצעד *ומהערך גם יחד*, ולא מהצעד לבדו. מאז שהקלדה כבר לא נצמדת
 * לרשת, ערך יכול להיות מדויק יותר ממנה: במכונה שקופצת ב-5 אפשר להקליד 97.5,
 * ועיגול בתצוגה בלבד היה מצייר "98" מעל סט שנרשם כ-97.5 — בדיוק השקר שהקומיט
 * החי בא לחסל, רק בכיוון ההפוך.
 */
function display(value: number, decimals: 0 | 1 | 2): string {
  if (!Number.isFinite(value)) return '0'
  const places = Math.max(decimals, decimalsOf(value)) as 0 | 1 | 2
  const fixed = value.toFixed(places)
  return places === 0 ? fixed : fixed.replace(/\.?0+$/, '')
}

interface StepButtonProps {
  dir: -1 | 1
  disabled: boolean
  active: boolean
  ariaLabel: string
  tile?: boolean
  onStart: (dir: -1 | 1) => void
  onStop: () => void
}

function StepButton({
  dir,
  disabled,
  active,
  ariaLabel,
  tile = false,
  onStart,
  onStop,
}: StepButtonProps): JSX.Element {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        'flex shrink-0 select-none items-center justify-center',
        '[-webkit-touch-callout:none]',
        'disabled:opacity-30 disabled:[transform:none]',
        tile
          ? // 42 חזותי, 50 באצבע: הריבוע נשאר בדיוק בגודל שבעיצוב, והפסאודו
            // שמסביבו מרחיב את שטח הלחיצה מעבר למינימום של 44 בלי לזוז.
            [
              'relative size-[42px] rounded-xl bg-ink-800 text-bone-300 active:bg-ink-700',
              "after:absolute after:-inset-1 after:content-['']",
              active ? 'bg-ink-700 text-flame-400' : '',
            ]
              .filter(Boolean)
              .join(' ')
          : // רוחב קבוע וגובה נמתח: הכפתור נצמד לגובה תיבת המספר, ולעולם לא גונב
            // ממנה רוחב. size-16 קבוע היה מוחץ את המספר לפס דק בעמודה צרה.
            [
              'btn-ghost w-16 self-stretch rounded-2xl',
              active ? 'border-flame-500/60 bg-ink-700 text-flame-400' : '',
            ]
              .filter(Boolean)
              .join(' '),
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={(e) => {
        // תפיסת המצביע: גם אם האצבע מחליקה מהכפתור, ה-pointerup עדיין מגיע
        // לכאן ומכבה את החזרה. בלי זה הספירה הייתה בורחת.
        e.currentTarget.setPointerCapture(e.pointerId)
        onStart(dir)
      }}
      onPointerUp={onStop}
      onPointerCancel={onStop}
      onLostPointerCapture={onStop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        // מקלדת לא מייצרת pointerdown — preventDefault מונע גם click כפול
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault()
          onStart(dir)
        }
      }}
      onKeyUp={onStop}
    >
      {dir === 1 ? (
        <Plus size={tile ? 20 : 30} strokeWidth={3} />
      ) : (
        <Minus size={tile ? 20 : 30} strokeWidth={3} />
      )}
    </button>
  )
}

export function Stepper({
  value,
  onChange,
  step,
  min,
  max,
  label,
  suffix,
  unit,
  hint,
  decimals,
  size = 'md',
  disabled = false,
  variant = 'stack',
  focused = false,
  onActivate,
}: StepperProps): JSX.Element {
  const inputId = useId()
  // ההסבר מתחת לשדה נקרא בעיניים ממילא. בלי הקישור הזה קורא מסך מקריא את
  // התווית ואת המספר, ומדלג בדיוק על המשפט שמסביר מה המספר הזה אומר.
  const hintId = `${inputId}-hint`
  const dec = decimals ?? decimalsForStep(step)
  const [draft, setDraft] = useState<string | null>(null)
  const [held, setHeld] = useState<-1 | 0 | 1>(0)

  // לולאת הלחיצה הממושכת חיה מחוץ למחזור הרינדור, ולכן היא קוראת ערכים מכאן
  // ולא מהסגור שלה — אחרת כל חזרה הייתה מוסיפה לאותו ערך ישן.
  const latest = useRef({ value, step, min, max, onChange })
  useLayoutEffect(() => {
    latest.current = { value, step, min, max, onChange }
  })

  const timerRef = useRef<number | null>(null)

  /**
   * חוסם לתחום, ולעולם לא פולט NaN.
   *
   * `snap` מפריד בין שני מקורות שונים לגמרי לערך. כפתורי ה-+/- נעים על רשת
   * הקפיצות של התרגיל ולכן מצמידים אליה. מספר שהוקלד ביד הוא *מדידה* — זה מה
   * שכתוב על המכונה — ואסור לעגל אותו: מכונה עם קפיצות של 2.5 שמסומנת 62
   * הייתה קופצת ל-62.5, כלומר האפליקציה מתקנת את המציאות.
   */
  const commitNumber = useCallback((n: number, snap: boolean) => {
    const s = latest.current
    if (!Number.isFinite(n)) return
    let next = snap && s.step > 0 ? roundToIncrement(n, s.step) : round2(n)
    if (s.min !== undefined) next = Math.max(s.min, next)
    if (s.max !== undefined) next = Math.min(s.max, next)
    next = round2(next)
    if (!Number.isFinite(next) || next === s.value) return
    s.onChange(next)
  }, [])

  const bump = useCallback(
    (dir: -1 | 1) => {
      const s = latest.current
      if (s.step <= 0) return
      // ערך שיצא מהרשת (למשל אחרי הקלדה ידנית של 21 כשהצעד 2.5) נצמד קודם
      // לנקודת הרשת בכיוון הלחיצה. רק ערך שכבר על הרשת זז צעד שלם.
      const onGrid = Math.abs(roundToIncrement(s.value, s.step) - s.value) < 1e-9
      commitNumber(
        onGrid
          ? round2(s.value + dir * s.step)
          : roundToIncrement(s.value, s.step, dir === 1 ? 'up' : 'down'),
        true
      )
    },
    [commitNumber]
  )

  const stopHold = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setHeld(0)
  }, [])

  const startHold = useCallback(
    (dir: -1 | 1) => {
      stopHold()
      setHeld(dir)
      bump(dir)
      const startedAt = Date.now()
      // setTimeout רקורסיבי ולא setInterval — כך אפשר לקצר את המרווח תוך כדי
      const tick = () => {
        bump(dir)
        const elapsed = Date.now() - startedAt
        timerRef.current = window.setTimeout(
          tick,
          elapsed > HOLD_ACCELERATE_AFTER_MS ? HOLD_FAST_MS : HOLD_INTERVAL_MS
        )
      }
      timerRef.current = window.setTimeout(tick, HOLD_DELAY_MS)
    },
    [bump, stopHold]
  )

  // ניקוי אחרון — פירוק הרכיב באמצע לחיצה לא משאיר טיימר רץ
  useEffect(() => stopHold, [stopHold])

  /**
   * כל הקשה מדווחת מיד כלפי מעלה, ולא רק ב-blur.
   *
   * זה תיקון של באג אמיתי באמצע סט: `pointerdown` על "סיים סט" קודם ל-blur של
   * השדה, ולכן ערך שהוקלד ולא אושר נבלע — הסט נרשם עם המספר הישן, והמשתמש
   * רואה שההקלדה שלו "לא נתפסה". מה שמופיע על המסך הוא מה שנרשם, נקודה.
   *
   * ה-draft נשאר כדי שהטקסט לא יילחם באצבע תוך כדי הקלדה ("6" בדרך ל-"60"
   * לא מקפיץ את השדה), אבל הערך שמאחוריו כבר מעודכן.
   */
  const typeDraft = useCallback(
    (raw: string) => {
      setDraft(raw)
      const normalized = raw.replace(',', '.').trim()
      const n = Number(normalized)
      if (normalized !== '' && Number.isFinite(n)) commitNumber(n, false)
    },
    [commitNumber]
  )

  const commitDraft = useCallback(
    (raw: string) => {
      const normalized = raw.replace(',', '.').trim()
      // קלט לא תקין נזרק בשקט והערך האחרון הטוב חוזר לתצוגה
      const n = Number(normalized)
      if (normalized !== '' && Number.isFinite(n)) commitNumber(n, false)
      setDraft(null)
    },
    [commitNumber]
  )

  const canStep = step > 0 && !disabled
  const atMin = min !== undefined && value <= min
  const atMax = max !== undefined && value >= max
  const hero = size === 'hero'
  const tile = variant === 'tile'

  /*
    שדה המספר עצמו, משותף לשתי הפריסות.

    הוא נשאר `input` גם באריח, ולא כיתוב שפותח מקלדת בלחיצה ארוכה: המסלול
    הזה הוא מה שמאפשר להקליד "62.5" בלי שתים-עשרה לחיצות על +, ובכל תרגיל
    שאין לו היסטוריה הוא הדרך היחידה להגיע למשקל אמיתי. הפוקוס עליו הוא גם
    מה שמסמן את האריח כפעיל — כלומר נגיעה במספר מעבירה אליו את שורת השבבים,
    בדיוק כמו בעיצוב.
  */
  const field = (
    <input
      id={inputId}
      aria-describedby={hint ? hintId : undefined}
      inputMode="decimal"
      dir="ltr"
      type="text"
      autoComplete="off"
      disabled={disabled}
      className={[
        'numeral-hero tnum w-full appearance-none border-0 bg-transparent text-center leading-none text-bone-50 outline-none',
        tile ? 'text-[1.6875rem]' : hero ? 'text-[2.75rem]' : 'text-[2.125rem]',
      ].join(' ')}
      value={draft ?? display(value, dec)}
      onChange={(e) => typeDraft(e.target.value)}
      onFocus={(e) => {
        onActivate?.()
        // בחירת הכל כדי שהקלדה תחליף במקום להוסיף. ספארי מאבד את
        // הבחירה בפריים הראשון של הפוקוס, ולכן חוזרים עליה ב-rAF.
        const el = e.currentTarget
        const atFocus = el.value
        el.select()
        requestAnimationFrame(() => {
          // רק אם המשתמש עוד לא הספיק להקליד. במכשיר עמוס הפריים הבא
          // יכול לנחות *אחרי* ההקשה הראשונה, ובחירה חוזרת אז הייתה בולעת
          // אותה — בדיוק תחושת "הקלדתי ולא נתפס" שהפקד הזה נועד למנוע.
          if (el.value === atFocus) el.select()
        })
      }}
      onBlur={(e) => commitDraft(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
    />
  )

  if (tile) {
    return (
      /*
        ‏dir=ltr מאותה סיבה בדיוק כמו בפריסה הרגילה — מינוס בצד השמאלי הפיזי
        ופלוס בימני, כי האצבע באמצע סט הולכת לפי זיכרון שריר.
      */
      <div
        dir="ltr"
        onPointerDown={onActivate}
        className={[
          'flex h-full items-center gap-1 rounded-2xl border bg-ink-900 px-1.5 transition-colors',
          focused
            ? 'border-flame-500/45 shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-flame-500)_7%,transparent)]'
            : 'border-ink-700',
          disabled ? 'opacity-45' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <StepButton
          dir={-1}
          tile
          disabled={!canStep || atMin}
          active={held === -1}
          ariaLabel={`הפחת ${label}`}
          onStart={startHold}
          onStop={stopHold}
        />
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
          {/* התווית יורדת מהעין ונשארת לקורא מסך — שני אריחים באותו מסך
              מוכרחים להיות מובחנים גם כשהמלל היחיד עליהם הוא היחידה */}
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          {field}
          {unit ? (
            <span
              aria-hidden="true"
              dir="rtl"
              className="mt-1 text-[0.625rem] leading-none font-semibold text-bone-500"
            >
              {unit}
            </span>
          ) : null}
        </div>
        <StepButton
          dir={1}
          tile
          disabled={!canStep || atMax}
          active={held === 1}
          ariaLabel={`הוסף ${label}`}
          onStart={startHold}
          onStop={stopHold}
        />
      </div>
    )
  }

  return (
    <div className={disabled ? 'opacity-45' : undefined}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="meta">
          {label}
        </label>
        {suffix ? <span className="text-xs font-medium text-bone-500">{suffix}</span> : null}
      </div>

      {/*
        חריגה מכוונת מ-RTL: המינוס תמיד בצד השמאלי הפיזי והפלוס בימני, בלי קשר
        לכיוון הכתיבה. באמצע סט האצבע הולכת לפי זיכרון שריר ולא לפי כיוון הטקסט,
        ושיקוף הכפתורים היה גורם להורדת משקל בטעות. התווית והיחידה נשארות RTL.
      */}
      <div dir="ltr" className="flex items-stretch gap-2">
        <StepButton
          dir={-1}
          disabled={!canStep || atMin}
          active={held === -1}
          ariaLabel={`הפחת ${label}`}
          onStart={startHold}
          onStop={stopHold}
        />

        {/*
          המספר הוא הדבר הכי גדול בשורה, ולא נכנע לכפתורים. min-w שומר לו רוחב
          מינימלי גם כשהפקד יושב בעמודה צרה, כדי ש-"22.5" לא ייחתך לאמצע.
        */}
        <div
          className={[
            'flex min-w-[5.5rem] flex-1 flex-col items-center justify-center rounded-2xl border border-ink-700 bg-ink-900/70 px-2 transition-colors focus-within:border-flame-500/60',
            hero ? 'min-h-20 py-1.5' : 'min-h-16 py-1',
          ].join(' ')}
        >
          {field}
          {unit ? (
            // aria-hidden: התווית והיחידה כבר נקראות מה-label של השדה, ואין
            // טעם שקורא מסך יגיד "חזרות" פעמיים על אותו מספר
            <span
              aria-hidden="true"
              dir="rtl"
              className="mt-1 text-[0.6875rem] leading-none font-bold text-bone-400"
            >
              {unit}
            </span>
          ) : null}
        </div>

        <StepButton
          dir={1}
          disabled={!canStep || atMax}
          active={held === 1}
          ariaLabel={`הוסף ${label}`}
          onStart={startHold}
          onStop={stopHold}
        />
      </div>

      {hint ? (
        <p id={hintId} className="mt-1.5 text-[0.6875rem] font-medium text-bone-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
