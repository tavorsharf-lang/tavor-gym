import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { JSX } from 'react'
import type { ChartData, ChartDataset, ChartOptions } from 'chart.js'
import { CHART_COLORS, baseOptions } from './chartTheme'

/**
 * נפח לפי קבוצת שריר — השבוע מול הקודם.
 *
 * הגרף אופקי כי שמות קבוצות השריר בעברית ארוכים מכדי להסתובב מתחת לעמודות.
 */

export function GroupBarChart({
  bars,
  height,
}: {
  bars: { label: string; current: number; previous?: number }[]
  height?: number
}): JSX.Element {
  const hasPrevious = bars.some((b) => b.previous !== undefined)

  const data = useMemo<ChartData<'bar', number[], string>>(() => {
    const shared: Omit<ChartDataset<'bar', number[]>, 'data'> = {
      borderRadius: 5,
      borderSkipped: false,
      barPercentage: 0.82,
      categoryPercentage: 0.74,
      maxBarThickness: 16,
    }
    const datasets: ChartDataset<'bar', number[]>[] = [
      {
        ...shared,
        label: 'השבוע',
        data: bars.map((b) => b.current),
        backgroundColor: CHART_COLORS.flame,
      },
    ]
    if (hasPrevious) {
      datasets.push({
        ...shared,
        label: 'שבוע שעבר',
        data: bars.map((b) => b.previous ?? 0),
        backgroundColor: CHART_COLORS.muted,
      })
    }
    return { labels: bars.map((b) => b.label), datasets }
  }, [bars, hasPrevious])

  const options = useMemo<ChartOptions<'bar'>>(() => {
    const base = baseOptions({ unit: 'ק״ג', horizontal: true }) as ChartOptions<'bar'>
    return {
      ...base,
      indexAxis: 'y',
      scales: {
        // ציר הערכים הפוך: האפס יושב בקצה הימני, ליד התוויות, והעמודות גדלות
        // שמאלה — כיוון הקריאה בעברית.
        x: { ...base.scales?.x, reverse: true, beginAtZero: true },
        // התוויות בצד ימין, ובלי reverse: ב-CategoryScale אנכי הפריט הראשון
        // ממילא יושב למעלה, והפעלת reverse הייתה הופכת את הסדר על הראש.
        y: { ...base.scales?.y, position: 'right', reverse: false },
      },
    }
  }, [])

  if (bars.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-ink-700/80">
        <span className="h-px w-24 bg-ink-600" />
        <p className="text-xs text-bone-500">אין עדיין נפח לשבוע הזה</p>
      </div>
    )
  }

  return (
    <div>
      {hasPrevious && (
        <div className="mb-2 flex items-center justify-end gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-bone-500">
            <span className="size-2 rounded-full bg-flame-500" />
            השבוע
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-bone-500">
            <span className="size-2 rounded-full bg-ink-600" />
            שבוע שעבר
          </span>
        </div>
      )}
      <div style={{ height: height ?? Math.max(180, bars.length * 34 + 16) }} className="relative">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
