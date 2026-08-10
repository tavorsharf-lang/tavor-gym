import { NavLink } from 'react-router-dom'
import { Dumbbell, History, LineChart, Settings } from 'lucide-react'
import type { ComponentType } from 'react'

const TABS: { to: string; label: string; Icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { to: '/', label: 'בית', Icon: Dumbbell },
  { to: '/history', label: 'היסטוריה', Icon: History },
  { to: '/stats', label: 'נתונים', Icon: LineChart },
  { to: '/settings', label: 'הגדרות', Icon: Settings },
]

/**
 * סרגל ניווט תחתון. מעוגן לאזור האגודל ומרופד ל-safe area של האייפון.
 * נעלם לגמרי במסך האימון — שם כל פיקסל חשוב.
 */
export function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700/80 bg-ink-950/85 backdrop-blur-xl"
      style={{ paddingBottom: 'var(--safe-b)' }}
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex h-[4.5rem] flex-col items-center justify-center gap-1 transition-colors',
                  // bone-600 נתן 2.85:1 על הרקע הכהה, מתחת לכל סף — ובטקסט
                  // של 11px שנקרא גם באור שמש בדרך לחדר כושר
                  isActive ? 'text-flame-400' : 'text-bone-400',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} />
                  <span className="text-[0.6875rem] font-semibold">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
