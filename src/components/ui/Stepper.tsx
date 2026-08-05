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
  decimals?: 0 | 1 | 2
  size?: 'md' | 'hero'
  disabled?: boolean
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

/** '60' ולא '60.0', אבל '22.5' נשאר מדויק */
function display(value: number, decimals: 0 | 1 | 2): string {
  if (!Number.isFinite(value)) return '0'
  const fixed = value.toFixed(decimals)
  return decimals === 0 ? fixed : fixed.replace(/\.?0+$/, '')
}

interface StepButtonProps {
  dir: -1 | 1
  disabled: boolean
  active: boolean
  ariaLabel: string
  onStart: (dir: -1 | 1) => void
  onStop: () => void
}

function StepButton({ dir, disabled, active, ariaLabel, onStart, onStop }: StepButtonProps): JSX.Element {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        'btn-ghost flex size-16 shrink-0 select-none items-center justify-center rounded-2xl',
        '[-webkit-touch-callout:none]',
        'disabled:opacity-30 disabled:[transform:none]',
        active ? 'border-flame-500/60 bg-ink-700 text-flame-400' : '',
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
      {dir === 1 ? <Plus size={30} strokeWidth={3} /> : <Minus size={30} strokeWidth={3} />}
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
  decimals,
  size = 'md',
  disabled = false,
}: StepperProps): JSX.Element {
  const inputId = useId()
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

  /** מעגל לצעד, חוסם לתחום, ולעולם לא פולט NaN */
  const commitNumber = useCallback((n: number) => {
    const s = latest.current
    if (!Number.isFinite(n)) return
    let next = s.step > 0 ? roundToIncrement(n, s.step) : round2(n)
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
          : roundToIncrement(s.value, s.step, dir === 1 ? 'up' : 'down')
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

  const commitDraft = useCallback(
    (raw: string) => {
      const normalized = raw.replace(',', '.').trim()
      const n = Number(normalized)
      // קלט לא תקין נזרק בשקט והערך האחרון הטוב חוזר לתצוגה
      if (normalized !== '' && Number.isFinite(n)) commitNumber(n)
      setDraft(null)
    },
    [commitNumber]
  )

  const canStep = step > 0 && !disabled
  const atMin = min !== undefined && value <= min
  const atMax = max !== undefined && value >= max
  const hero = size === 'hero'

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
      <div dir="ltr" className="flex items-center gap-2">
        <StepButton
          dir={-1}
          disabled={!canStep || atMin}
          active={held === -1}
          ariaLabel={`הפחת ${label}`}
          onStart={startHold}
          onStop={stopHold}
        />

        <div className="flex h-16 min-w-0 flex-1 items-center justify-center rounded-2xl border border-ink-700 bg-ink-900/70 px-2 transition-colors focus-within:border-flame-500/60">
          <input
            id={inputId}
            inputMode="decimal"
            dir="ltr"
            type="text"
            autoComplete="off"
            disabled={disabled}
            className={[
              'numeral-hero tnum w-full appearance-none border-0 bg-transparent text-center text-bone-50 outline-none',
              hero ? 'text-[2.75rem]' : 'text-3xl',
            ].join(' ')}
            value={draft ?? display(value, dec)}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => {
              // בחירת הכל כדי שהקלדה תחליף במקום להוסיף. ספארי מאבד את
              // הבחירה בפריים הראשון של הפוקוס, ולכן חוזרים עליה ב-rAF.
              const el = e.currentTarget
              el.select()
              requestAnimationFrame(() => el.select())
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
    </div>
  )
}
