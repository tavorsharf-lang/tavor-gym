import { Suspense, lazy } from 'react'
import type { ComponentProps, JSX } from 'react'
import type { TrendChart as TrendChartType } from './TrendChart'
import type { GroupBarChart as GroupBarChartType } from './GroupBarChart'

/**
 * הגרפים נטענים רק כשבאמת מסתכלים עליהם.
 *
 * Chart.js הוא הרכיב הכבד ביותר בפרויקט, והוא נחוץ בשני מסכים בלבד. טעינה
 * עצלה מוציאה אותו מהצ'אנק הראשי, וכך מסך הבית ומסך האימון — שני המסכים
 * שנפתחים בפועל בחדר כושר — עולים מהר יותר.
 */

const TrendChartImpl = lazy(async () => ({
  default: (await import('./TrendChart')).TrendChart,
}))

const GroupBarChartImpl = lazy(async () => ({
  default: (await import('./GroupBarChart')).GroupBarChart,
}))

/** מציין מקום בגובה הגרף, כדי שהפריסה לא תקפוץ כשהוא נוחת */
function ChartSkeleton({ height }: { height?: number }): JSX.Element {
  return (
    <div
      className="animate-pulse rounded-card bg-ink-800/60"
      style={{ height: height ?? 180 }}
      aria-hidden="true"
    />
  )
}

export function TrendChart(props: ComponentProps<typeof TrendChartType>): JSX.Element {
  return (
    <Suspense fallback={<ChartSkeleton height={props.height} />}>
      <TrendChartImpl {...props} />
    </Suspense>
  )
}

export function GroupBarChart(props: ComponentProps<typeof GroupBarChartType>): JSX.Element {
  return (
    <Suspense fallback={<ChartSkeleton height={props.height} />}>
      <GroupBarChartImpl {...props} />
    </Suspense>
  )
}
