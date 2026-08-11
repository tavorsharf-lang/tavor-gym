import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
import { FLAME, flameAlpha } from '@/styles/tokens'

/**
 * ערכת העיצוב של הגרפים — "מכון בלילה" מתורגם ל-Chart.js.
 *
 * רושמים כאן רק את החלקים שבאמת בשימוש ולא את chart.js/auto, שגורר את כל סוגי
 * הגרפים אל תוך החבילה. הבקרים (LineController/BarController) חייבים להירשם גם
 * הם — בלעדיהם Chart.js זורק "line is not a registered controller" בזמן ריצה.
 */
Chart.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
)

export const CHART_COLORS = {
  flame: FLAME[500],
  flameSoft: flameAlpha(0.28),
  flameFade: flameAlpha(0),
  pr: '#4ADE80',
  prSoft: 'rgba(74, 222, 128, 0.24)',
  prFade: 'rgba(74, 222, 128, 0)',
  /** ink-600 — עמודת "השבוע הקודם", נוכחת אבל כבויה */
  muted: '#3D332D',
  grid: '#2E2622',
  text: '#A89F98',
  surface: '#1A1514',
  title: '#E0D9D3',
  point: '#0C0A09',
} as const

const FONT_FAMILY = "'Rubik Variable', Rubik, system-ui, sans-serif"

const NUMBERS = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 1 })

/** מספר קצר לציר ולטולטיפ. מעל 10,000 עוברים ל"אלף" כדי שהציר לא יתפוצץ. */
export function formatChartNumber(value: number | string): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return String(value)
  if (Math.abs(n) >= 10_000) return `${NUMBERS.format(n / 1000)} אלף`
  return NUMBERS.format(n)
}

export interface BaseOptionsInput {
  /** יחידה שנצמדת למספר בטולטיפ, למשל "ק״ג" */
  unit?: string
  /** גרף אופקי (indexAxis: 'y') — הקטגוריות עוברות לציר Y והערכים ל-X */
  horizontal?: boolean
}

/** ברירות המחדל המשותפות לכל הגרפים באפליקציה */
export function baseOptions(opts: BaseOptionsInput = {}): ChartOptions<'line' | 'bar'> {
  const { unit = '', horizontal = false } = opts
  const suffix = unit ? ` ${unit}` : ''

  const categoryAxis = {
    grid: { display: false },
    border: { display: false },
    ticks: {
      color: CHART_COLORS.text,
      font: { family: FONT_FAMILY, size: 11 },
      maxRotation: 0,
      autoSkip: true,
      maxTicksLimit: 6,
      padding: 6,
    },
  }

  const valueAxis = {
    beginAtZero: false,
    grid: { color: CHART_COLORS.grid, drawTicks: false },
    border: { display: false },
    ticks: {
      color: CHART_COLORS.text,
      font: { family: FONT_FAMILY, size: 11 },
      maxTicksLimit: 4,
      padding: 8,
      callback: (value: number | string) => formatChartNumber(value),
    },
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 420 },
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 8, bottom: 0 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        textDirection: 'rtl',
        backgroundColor: CHART_COLORS.surface,
        borderColor: CHART_COLORS.grid,
        borderWidth: 1,
        titleColor: CHART_COLORS.title,
        bodyColor: CHART_COLORS.text,
        titleFont: { family: FONT_FAMILY, size: 12, weight: 'bold' },
        bodyFont: { family: FONT_FAMILY, size: 13 },
        cornerRadius: 10,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (item) => {
            const raw = horizontal ? item.parsed.x : item.parsed.y
            // נקודה חסרה היא חור בסדרה ולא אפס — לא מציגים לה שורה בכלל
            if (raw === null) return ''
            const name = item.dataset.label ? `${item.dataset.label}: ` : ''
            return `${name}${formatChartNumber(raw)}${suffix}`
          },
        },
      },
    },
    scales: {
      // ציר הזמן נשאר משמאל לימין גם בעברית: הזמן זורם לשם, וכל גרף התקדמות
      // שראינו אי פעם נראה ככה — היפוך שלו היה מבלבל יותר מלעזור.
      x: horizontal ? valueAxis : categoryAxis,
      y: horizontal ? categoryAxis : valueAxis,
    },
  }
}
