import type { ButtonHTMLAttributes, JSX, ReactNode, Ref } from 'react'

/**
 * הכפתור של האפליקציה.
 *
 * flame הוא הכתום המלא היחיד — לכל היותר אחד כזה על המסך, תמיד הפעולה
 * הראשית. השאר כהים. גובה המינימום הוא 48px גם ב-sm, כי כל לחיצה כאן קורית
 * ביד אחת ובאמצע סט.
 */

export type ButtonVariant = 'flame' | 'ghost' | 'quiet' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'hero'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
  ref?: Ref<HTMLButtonElement>
}

const BASE = [
  'relative inline-flex items-center justify-center gap-2 select-none whitespace-nowrap',
  // ללא תפריט לחיצה-ארוכה של iOS על כפתורים שנלחצים הרבה
  '[-webkit-touch-callout:none]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500',
  // מצב מושבת: מעמעם וגם מנטרל את כיווץ הלחיצה של .btn-flame / .btn-ghost
  'disabled:opacity-40 disabled:shadow-none disabled:[transform:none] disabled:[filter:none]',
].join(' ')

const VARIANTS: Record<ButtonVariant, string> = {
  flame: 'btn-flame',
  ghost: 'btn-ghost',
  quiet: 'bg-transparent text-bone-400 transition-colors active:bg-ink-800',
  danger:
    'border border-hard-400/35 bg-hard-400/10 text-hard-400 transition-colors active:bg-hard-400/20',
}

// הרדיוס ומשקל הגופן נקבעים כאן ולא ב-BASE, כדי שלא יתנגשו בין מחלקות
const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-12 rounded-xl px-4 text-sm font-bold',
  md: 'min-h-13 rounded-2xl px-5 text-base font-bold',
  lg: 'min-h-15 rounded-2xl px-6 text-lg font-bold',
  hero: 'min-h-16 rounded-[1.125rem] px-7 text-xl font-extrabold',
}

function Spinner(): JSX.Element {
  return (
    <svg
      className="size-[1.15em] shrink-0 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Button({
  variant = 'ghost',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className,
  disabled,
  type,
  children,
  ...rest
}: ButtonProps): JSX.Element {
  const cls = [
    BASE,
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? 'w-full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type ?? 'button'}
      className={cls}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}
