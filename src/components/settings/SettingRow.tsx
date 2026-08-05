import { useCallback, useEffect, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { roundToIncrement } from '@/domain/units'

/**
 * אבני הבניין של ההגדרות: שורה, מתג, קישור ומספר.
 *
 * הכל נבנה כשורה אחת בגובה מגע נוח, גם כשהמסך מלא בהן — כי בהגדרות היד
 * עוברת מהר מלמעלה למטה ואסור שתפספס.
 */

export interface SettingRowProps {
  label: ReactNode
  description?: ReactNode
  /** הפקד בקצה השורה */
  control?: ReactNode
  /** הפקד יורד לשורה נפרדת מתחת לתווית */
  stacked?: boolean
}

export function SettingRow({
  label,
  description,
  control,
  stacked = false,
}: SettingRowProps): JSX.Element {
  return (
    <div
      className={[
        'flex min-h-14 gap-3 px-4 py-3',
        stacked ? 'flex-col' : 'items-center',
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug font-bold text-bone-50">{label}</p>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-bone-500">{description}</p>
        ) : null}
      </div>
      {control ? <div className={stacked ? 'w-full' : 'shrink-0'}>{control}</div> : null}
    </div>
  )
}

// ─── מתג ───────────────────────────────────────────────────────────────────

/** המסילה: 52×32. הכפתור נע לפי כיוון הכתיבה, ולכן inset-inline ולא translate */
function Switch({ checked }: { checked: boolean }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={[
        'relative block h-8 w-13 shrink-0 rounded-pill border transition-colors duration-200',
        checked
          ? 'border-flame-400 bg-flame-500 shadow-[0_0_18px_-6px_var(--color-flame-500)]'
          : 'border-ink-600 bg-ink-800',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-1/2 size-7 -translate-y-1/2 rounded-full transition-[inset-inline-start,background-color] duration-200',
          checked ? 'bg-bone-50' : 'bg-bone-500',
        ].join(' ')}
        style={{ insetInlineStart: checked ? 'calc(100% - 1.875rem)' : '0.125rem' }}
      />
    </span>
  )
}

export interface SettingToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: SettingToggleProps): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-start transition-colors active:bg-ink-800/60 disabled:opacity-40"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug font-bold text-bone-50">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-bone-500">{description}</span>
        ) : null}
      </span>
      <Switch checked={checked} />
    </button>
  )
}

// ─── קישור ─────────────────────────────────────────────────────────────────

export interface SettingLinkProps {
  label: string
  description?: string
  icon?: ReactNode
  /** ערך קצר בקצה, למשל מספר פריטים */
  value?: string
  onClick: () => void
}

export function SettingLink({
  label,
  description,
  icon,
  value,
  onClick,
}: SettingLinkProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-start transition-colors active:bg-ink-800/60"
    >
      {icon ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-flame-400">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-bone-50">{label}</span>
        {description ? (
          <span className="mt-0.5 block truncate text-xs text-bone-500">{description}</span>
        ) : null}
      </span>
      {value ? <span className="tnum shrink-0 text-xs text-bone-500">{value}</span> : null}
      {/* חץ שמאלה — ב-RTL זה הכיוון של "פנימה" */}
      <ChevronLeft size={18} className="shrink-0 text-bone-600" aria-hidden="true" />
    </button>
  )
}

// ─── מספר ──────────────────────────────────────────────────────────────────

const HOLD_DELAY_MS = 450
const HOLD_INTERVAL_MS = 110

export interface SettingNumberProps {
  label: string
  description?: string
  value: number
  onChange: (value: number) => void
  step: number
  min: number
  max: number
  /** עיצוב הערך המוצג — למשל formatClock לשניות */
  format?: (value: number) => string
  /** התווית מעל הפקד, לרשתות צרות */
  compact?: boolean
  disabled?: boolean
}

export function SettingNumber({
  label,
  description,
  value,
  onChange,
  step,
  min,
  max,
  format,
  compact = false,
  disabled = false,
}: SettingNumberProps): JSX.Element {
  const [shown, setShown] = useState(value)
  const shownRef = useRef(value)
  const holdingRef = useRef(false)
  const timerRef = useRef<number | null>(null)
  const changeRef = useRef(onChange)

  useEffect(() => {
    changeRef.current = onChange
  })

  // בזמן לחיצה ממושכת הערך שחוזר מבחוץ עוד רודף אחרי הכתיבה למסד, וסנכרון
  // כזה היה מושך את המונה אחורה באמצע הספירה.
  useEffect(() => {
    if (holdingRef.current) return
    shownRef.current = value
    setShown(value)
  }, [value])

  const bump = useCallback(
    (dir: -1 | 1) => {
      const raw = roundToIncrement(shownRef.current + dir * step, step)
      const next = Math.min(max, Math.max(min, raw))
      if (next === shownRef.current) return
      shownRef.current = next
      setShown(next)
      changeRef.current(next)
    },
    [max, min, step]
  )

  const stop = useCallback(() => {
    holdingRef.current = false
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(
    (dir: -1 | 1) => {
      stop()
      holdingRef.current = true
      bump(dir)
      // setTimeout רקורסיבי: ההשהיה הראשונה ארוכה כדי שלחיצה בודדת לא תרוץ
      const tick = () => {
        bump(dir)
        timerRef.current = window.setTimeout(tick, HOLD_INTERVAL_MS)
      }
      timerRef.current = window.setTimeout(tick, HOLD_DELAY_MS)
    },
    [bump, stop]
  )

  useEffect(() => stop, [stop])

  const stepper = (
    /* המינוס תמיד בצד השמאלי הפיזי והפלוס בימני — אותה מוסכמה כמו במסך האימון */
    <div dir="ltr" className="flex items-center gap-1">
      <StepButton
        dir={-1}
        ariaLabel={`הפחת ${label}`}
        disabled={disabled || shown <= min}
        onStart={start}
        onStop={stop}
      />
      <span
        className={[
          'tnum text-center text-base font-extrabold text-bone-50',
          compact ? 'min-w-0 flex-1' : 'min-w-16',
        ].join(' ')}
      >
        {format ? format(shown) : shown}
      </span>
      <StepButton
        dir={1}
        ariaLabel={`הוסף ${label}`}
        disabled={disabled || shown >= max}
        onStart={start}
        onStop={stop}
      />
    </div>
  )

  if (compact) {
    return (
      <div className={disabled ? 'opacity-45' : undefined}>
        <p className="meta mb-1.5 truncate">{label}</p>
        {stepper}
      </div>
    )
  }

  return (
    <SettingRow
      label={<span className={disabled ? 'opacity-45' : undefined}>{label}</span>}
      description={description}
      control={stepper}
    />
  )
}

function StepButton({
  dir,
  ariaLabel,
  disabled,
  onStart,
  onStop,
}: {
  dir: -1 | 1
  ariaLabel: string
  disabled: boolean
  onStart: (dir: -1 | 1) => void
  onStop: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className="btn-ghost flex size-12 shrink-0 items-center justify-center rounded-xl [-webkit-touch-callout:none] disabled:opacity-30 disabled:[transform:none]"
      onPointerDown={(e) => {
        // תפיסת המצביע: גם אם האצבע מחליקה מהכפתור, ה-pointerup עדיין מגיע לכאן
        e.currentTarget.setPointerCapture(e.pointerId)
        onStart(dir)
      }}
      onPointerUp={onStop}
      onPointerCancel={onStop}
      onLostPointerCapture={onStop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault()
          onStart(dir)
        }
      }}
      onKeyUp={onStop}
    >
      {dir === 1 ? <Plus size={20} strokeWidth={3} /> : <Minus size={20} strokeWidth={3} />}
    </button>
  )
}
