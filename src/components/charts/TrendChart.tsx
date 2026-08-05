import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { JSX } from 'react'
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js'
import { CHART_COLORS, baseOptions } from './chartTheme'

/**
 * גרף קו להתקדמות לאורך זמן.
 *
 * ירוק שמור לשיאים בלבד, ולכן color='pr' מיועד רק לסדרות שמייצגות הישג
 * (נפח מצטבר), וכל השאר בכתום.
 */

export interface TrendPointView {
  label: string
  value: number
}

const PALETTE = {
  flame: { line: CHART_COLORS.flame, soft: CHART_COLORS.flameSoft, fade: CHART_COLORS.flameFade },
  pr: { line: CHART_COLORS.pr, soft: CHART_COLORS.prSoft, fade: CHART_COLORS.prFade },
} as const

export function TrendChart({
  points,
  unit,
  color = 'flame',
  height = 168,
  area = true,
}: {
  points: { label: string; value: number }[]
  unit?: string
  color?: 'flame' | 'pr'
  height?: number
  area?: boolean
}): JSX.Element {
  const tone = PALETTE[color]

  const data = useMemo<ChartData<'line', number[], string>>(() => {
    // הגרדיאנט נבנה מהקנבס עצמו ולכן חייב להיות פונקציה: בציור הראשון עוד אין
    // chartArea, ואז נופלים לצבע שטוח במקום לזרוק.
    const fill = (ctx: ScriptableContext<'line'>): CanvasGradient | string => {
      const { chartArea, ctx: canvas } = ctx.chart
      if (!chartArea) return tone.soft
      const gradient = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
      gradient.addColorStop(0, tone.soft)
      gradient.addColorStop(1, tone.fade)
      return gradient
    }

    return {
      labels: points.map((p) => p.label),
      datasets: [
        {
          data: points.map((p) => p.value),
          borderColor: tone.line,
          borderWidth: 2.5,
          tension: 0.35,
          fill: area,
          backgroundColor: area ? fill : 'transparent',
          pointRadius: points.length > 14 ? 0 : 3,
          pointHoverRadius: 6,
          pointBackgroundColor: CHART_COLORS.point,
          pointBorderColor: tone.line,
          pointBorderWidth: 2,
          pointHitRadius: 18,
        },
      ],
    }
  }, [points, tone, area])

  // baseOptions מוגדר לשני סוגי הגרפים; ההצרה ל-line בטוחה כי כל השדות משותפים
  const options = useMemo(() => baseOptions({ unit }) as ChartOptions<'line'>, [unit])

  if (points.length < 2) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-ink-700/80"
        style={{ height }}
      >
        <span className="h-px w-24 bg-ink-600" />
        <p className="text-xs text-bone-600">צריך לפחות שני אימונים כדי לצייר קו</p>
      </div>
    )
  }

  return (
    <div style={{ height }} className="relative">
      <Line data={data} options={options} />
    </div>
  )
}
