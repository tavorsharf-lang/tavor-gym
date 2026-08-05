import type { JSX } from 'react'
import { Screen } from '@/components/shell/ScreenHeader'
import { VolumeDashboard } from '@/components/stats/VolumeDashboard'
import { BodyWeightPanel } from '@/components/stats/BodyWeightPanel'

/**
 * מסך הנתונים.
 *
 * אין כאן ScreenHeader — זה מסך שורש בסרגל הניווט ואין לאן לחזור ממנו,
 * ולכן כותרת פשוטה בלי חץ.
 */
export function StatsScreen(): JSX.Element {
  return (
    <Screen>
      <header className="pt-safe mb-5">
        <h1 className="mt-2 text-2xl font-extrabold text-bone-50">נתונים</h1>
        <p className="meta mt-1">מי עבד השבוע, מי נשאר מאחור, ולאן הולך המשקל</p>
      </header>

      <VolumeDashboard />

      <div className="mt-8">
        <BodyWeightPanel />
      </div>
    </Screen>
  )
}
