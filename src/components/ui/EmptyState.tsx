import type { JSX, ReactNode } from 'react'

/**
 * מצב ריק. בלי מסגרות ובלי איורים — רק שורה שמסבירה למה אין כאן כלום
 * ומה עושים עכשיו.
 */

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, hint, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon ? <div className="text-bone-600 [&>svg]:size-9">{icon}</div> : null}
      <p className="text-base font-semibold text-bone-400">{title}</p>
      {hint ? (
        <p className="max-w-[32ch] text-sm leading-relaxed text-bone-500">{hint}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
