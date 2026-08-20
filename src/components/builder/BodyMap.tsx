import type { JSX, ReactNode } from 'react'
import type { MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS } from '@/db/types'
import type { MuscleCoverage } from '@/domain/coverage'
import { coverageText } from '@/domain/coverage'
import { formatDayCount } from '@/lib/dates'

/**
 * מפת הגוף — אותו כיסוי שרירים של הרשימה, בצורה של גוף.
 *
 * הרשימה עונה על "על מה לא עבדתי" במילים, ומי שקורא אותה סורק תשע שורות
 * ומרכיב את התמונה בראש. המפה עונה על אותה שאלה בצורה: חצי גוף כבוי נראה
 * מיד, בלי לקרוא מספר אחד. זו תצוגה חלופית של אותן שורות בדיוק — היא לא
 * שולפת נתון משלה ולא מחשבת דבר, ולכן היא לא יכולה לסתור את מה שכתוב לידה.
 *
 * ההחלטות שלא מובנות מאליהן:
 *
 * ‏1. האזורים מצוירים בגסות ובגדול, יותר מהאנטומיה האמיתית. באצבע על מסך
 *    טלפון צריך לפגוע בשוק, ותאומים בגודלם האמיתי הם יעד של כמה פיקסלים.
 *    זה תרשים של החלטות ולא איור שרירים, ולכן קריאוּת ופגיעה גוברות על דיוק.
 *
 * ‏2. כתפיים ורגליים מופיעות בשני המבטים, וכל מופע לחיץ בפני עצמו — אבל
 *    שניהם אותה קבוצה ולכן נצבעים יחד. הפיצול הוא ציורי בלבד: `MuscleGroup`
 *    מכיר `legs` אחד, ואם המפה הייתה מתייחסת לארבע ראשי וירך אחורית כשני
 *    מצבים שונים היא הייתה ממציאה נתון שאינו קיים.
 *
 * ‏3. "מוזנח" גובר על "עבודה עקיפה". שריר שלא קיבל סט ישיר עשרה ימים נשאר
 *    קר גם אם חתירה נגעה בו — המפה קיימת כדי להצביע על הזנחה, וצביעה חמימה
 *    של אמות שמעולם לא אומנו ישירות הייתה מסתירה בדיוק את מה שבאנו לראות.
 *
 * ‏4. סף עשרת הימים הוא של התצוגה ולא של החישוב, ובכוונה אינו חלון הכיסוי
 *    (שמתכוונן בהגדרות). החלון עונה "כיסיתי בסבב הזה", והסף עונה "נטשתי" —
 *    שתי שאלות שונות, ומי שמאמן פעמיים בשבוע לא אמור לראות גוף קר כולו.
 *
 * ‏5. הצבע יושב על ה-`<g>` והצורות יורשות אותו. אזור שמורכב מארבע צורות
 *    (עכוז והמסטרינג) מתחלף כיחידה אחת, והמעבר קורה פעם אחת במקום ארבע.
 *    ההפחתת-תנועה מטופלת גלובלית ב-theme.css, שמקצר כל מעבר ל-0.01ms.
 */

/** מכמה ימים בלי סט ישיר שריר נחשב נטוש ומצויר קר */
const NEGLECTED_DAYS = 10

type Tone = 'direct' | 'indirect' | 'idle' | 'cold'

/**
 * הגוונים, מהטוקנים ולא מליטרלים — בדיוק כמו מסך המנוחה: שינוי צבע המבטא
 * לא אמור להשאיר את המפה על הכתום הישן.
 */
const TONES: Record<Tone, { fill: string; stroke: string; legend: string }> = {
  direct: {
    fill: 'color-mix(in srgb, var(--color-flame-500) 72%, transparent)',
    stroke: 'color-mix(in srgb, var(--color-flame-300) 60%, transparent)',
    legend: 'אומן',
  },
  indirect: {
    fill: 'color-mix(in srgb, var(--color-flame-500) 20%, transparent)',
    stroke: 'color-mix(in srgb, var(--color-flame-500) 38%, transparent)',
    legend: 'בעקיפין',
  },
  idle: {
    fill: 'var(--color-ink-600)',
    stroke: 'color-mix(in srgb, var(--color-bone-600) 45%, transparent)',
    legend: 'ממתין',
  },
  cold: {
    fill: 'var(--color-ink-950)',
    stroke: 'var(--color-bone-600)',
    legend: 'מוזנח',
  },
}

const TONE_ORDER: Tone[] = ['direct', 'indirect', 'idle', 'cold']

function toneOf(row: MuscleCoverage | undefined): Tone {
  if (!row) return 'cold'
  if (row.sets > 0) return 'direct'
  if (row.neverDone || (row.daysSince ?? 0) >= NEGLECTED_DAYS) return 'cold'
  if (row.indirectSets > 0) return 'indirect'
  return 'idle'
}

/** "3 תרגילים · 11 סטים" · "לא נגעת 12 ימים" — אותו ניסוח כמו ברשימה */
function stateText(row: MuscleCoverage): string {
  if (row.sets > 0) return coverageText(row)
  if (row.neverDone) return 'לא נגעת מזמן'
  const days = row.daysSince ?? 0
  const gap = days > 0 ? `לא נגעת ${formatDayCount(days)}` : 'לא נגעת בחלון'
  return row.indirectSets > 0 ? `${gap} · רק עבודה עקיפה` : gap
}

function regionLabel(group: MuscleGroup, row: MuscleCoverage | undefined): string {
  if (!row) return `${MUSCLE_GROUPS[group].label} — אין נתונים`
  return `${row.label} — ${stateText(row)}`
}

/*
  הזרועות והרגליים מסובבות סביב מפרק הכתף והירך, ולא מצוירות עקומות אחת-אחת.
  הסיבוב יושב על כל צורה בנפרד ולא על קבוצה, כי אזור לחיץ אחד מחזיק את שני
  הצדדים — ‏`<g>` שעוטף יד ימין ושמאל לא יכול לשבת גם בתוך קבוצת סיבוב של יד אחת.
*/
const ARM_L = 'rotate(5 26 42)'
const ARM_R = 'rotate(-5 70 42)'
const LEG_L = 'rotate(3 40 104)'
const LEG_R = 'rotate(-3 56 104)'

const REGION_CLASS = [
  'cursor-pointer outline-none transition-colors duration-200',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500',
  // ספארי לא תמיד מציירת outline על אלמנט SVG — הקצה המואר הוא הגיבוי לפוקוס
  '[&:focus-visible>*]:stroke-flame-300 [&:focus-visible>*]:[stroke-width:2.25]',
].join(' ')

interface FigureProps {
  rows: ReadonlyMap<MuscleGroup, MuscleCoverage>
  onSelect: (group: MuscleGroup) => void
}

function Region({
  group,
  rows,
  onSelect,
  children,
}: FigureProps & { group: MuscleGroup; children: ReactNode }): JSX.Element {
  const row = rows.get(group)
  const tone = TONES[toneOf(row)]
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={regionLabel(group, row)}
      onClick={() => onSelect(group)}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        // רווח גולל את המסך, ו-Enter על אלמנט לא-כפתור לא עושה כלום מעצמו
        e.preventDefault()
        onSelect(group)
      }}
      fill={tone.fill}
      stroke={tone.stroke}
      strokeWidth={1.25}
      className={REGION_CLASS}
    >
      {children}
    </g>
  )
}

/** הגוף עצמו — ראש, גו, גפיים. אותו צללית לשני המבטים, ולא לחיץ. */
function Silhouette(): JSX.Element {
  return (
    <g aria-hidden="true" fill="var(--color-ink-800)" stroke="var(--color-ink-700)" strokeWidth={1}>
      <ellipse cx={48} cy={15} rx={11} ry={13} />
      <rect x={42.5} y={24} width={11} height={10} rx={4} />
      <path d="M26 40C26 33 32 30 39 30L57 30C64 30 70 33 70 40C70 54 64 60 63 74C62 86 66 92 66 104L30 104C30 92 34 86 33 74C32 60 26 54 26 40Z" />

      <rect x={8} y={40} width={16} height={40} rx={8} transform={ARM_L} />
      <rect x={9} y={78} width={14} height={36} rx={7} transform={ARM_L} />
      <ellipse cx={16} cy={118} rx={6.5} ry={7.5} transform={ARM_L} />
      <rect x={72} y={40} width={16} height={40} rx={8} transform={ARM_R} />
      <rect x={73} y={78} width={14} height={36} rx={7} transform={ARM_R} />
      <ellipse cx={80} cy={118} rx={6.5} ry={7.5} transform={ARM_R} />

      <rect x={29} y={100} width={18} height={54} rx={9} transform={LEG_L} />
      <rect x={31} y={150} width={15} height={44} rx={7} transform={LEG_L} />
      <ellipse cx={38} cy={197} rx={8} ry={5} transform={LEG_L} />
      <rect x={49} y={100} width={18} height={54} rx={9} transform={LEG_R} />
      <rect x={50} y={150} width={15} height={44} rx={7} transform={LEG_R} />
      <ellipse cx={58} cy={197} rx={8} ry={5} transform={LEG_R} />
    </g>
  )
}

/** מלפנים: חזה, בטן, יד קדמית, אמות, ארבע ראשי — וכתפיים שמשותפות לשני המבטים */
function FrontFigure({ rows, onSelect }: FigureProps): JSX.Element {
  return (
    <g>
      <Silhouette />

      <Region group="shoulders" rows={rows} onSelect={onSelect}>
        <ellipse cx={25} cy={44} rx={10} ry={11} />
        <ellipse cx={71} cy={44} rx={10} ry={11} />
      </Region>

      <Region group="chest" rows={rows} onSelect={onSelect}>
        <path d="M47 43L36 43C30 43 29 47 29 53C29 62 33 69 41 69C45 69 47 66 47 62Z" />
        <path d="M49 43L60 43C66 43 67 47 67 53C67 62 63 69 55 69C51 69 49 66 49 62Z" />
      </Region>

      <Region group="abs" rows={rows} onSelect={onSelect}>
        <path d="M40 72H56Q58 72 58 75L57 95Q57 102 48 102Q39 102 39 95L38 75Q38 72 40 72Z" />
      </Region>

      <Region group="biceps" rows={rows} onSelect={onSelect}>
        <ellipse cx={16} cy={58} rx={7} ry={14} transform={ARM_L} />
        <ellipse cx={80} cy={58} rx={7} ry={14} transform={ARM_R} />
      </Region>

      <Region group="forearms" rows={rows} onSelect={onSelect}>
        <ellipse cx={16} cy={94} rx={6.5} ry={15} transform={ARM_L} />
        <ellipse cx={80} cy={94} rx={6.5} ry={15} transform={ARM_R} />
      </Region>

      <Region group="legs" rows={rows} onSelect={onSelect}>
        <ellipse cx={38} cy={126} rx={7.5} ry={20} transform={LEG_L} />
        <ellipse cx={58} cy={126} rx={7.5} ry={20} transform={LEG_R} />
      </Region>
    </g>
  )
}

/** מאחור: גב, יד אחורית, שוק — והרגליים והכתפיים שוב, כאותה קבוצה */
function BackFigure({ rows, onSelect }: FigureProps): JSX.Element {
  return (
    <g>
      <Silhouette />

      <Region group="shoulders" rows={rows} onSelect={onSelect}>
        <ellipse cx={25} cy={44} rx={10} ry={11} />
        <ellipse cx={71} cy={44} rx={10} ry={11} />
      </Region>

      <Region group="back" rows={rows} onSelect={onSelect}>
        <path d="M33 41C40 36 56 36 63 41L65 62C60 74 54 78 48 79C42 78 36 74 31 62Z" />
        <path d="M41 82C45 80 51 80 55 82L54 97C51 99 45 99 42 97Z" />
      </Region>

      <Region group="triceps" rows={rows} onSelect={onSelect}>
        <ellipse cx={16} cy={58} rx={7} ry={14} transform={ARM_L} />
        <ellipse cx={80} cy={58} rx={7} ry={14} transform={ARM_R} />
      </Region>

      <Region group="legs" rows={rows} onSelect={onSelect}>
        <ellipse cx={39} cy={108} rx={9} ry={8} />
        <ellipse cx={57} cy={108} rx={9} ry={8} />
        <ellipse cx={38} cy={134} rx={7.5} ry={16} transform={LEG_L} />
        <ellipse cx={58} cy={134} rx={7.5} ry={16} transform={LEG_R} />
      </Region>

      <Region group="calves" rows={rows} onSelect={onSelect}>
        <ellipse cx={38} cy={166} rx={7} ry={15} transform={LEG_L} />
        <ellipse cx={58} cy={166} rx={7} ry={15} transform={LEG_R} />
      </Region>
    </g>
  )
}

export function BodyMap({
  rows,
  onSelect,
}: {
  rows: readonly MuscleCoverage[]
  onSelect: (group: MuscleGroup) => void
}): JSX.Element {
  const byGroup = new Map<MuscleGroup, MuscleCoverage>(rows.map((row) => [row.group, row]))

  return (
    <div className="w-full">
      {/*
        שני המבטים ב-viewBox אחד ולא בשני קבצים: הם חייבים לשמור על אותו קנה
        מידה בדיוק, אחרת אותה כתף נראית גדולה יותר מאחור מאשר מלפנים.
        המבט הקדמי בחצי הימני — בעברית מתחילים לקרוא משם.
      */}
      <svg
        viewBox="0 0 224 210"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="מפת שרירים — לפי כמה מזמן אימנת כל קבוצה"
        className="mx-auto block h-auto w-full max-w-[18rem]"
      >
        <g transform="translate(120 3)">
          <FrontFigure rows={byGroup} onSelect={onSelect} />
        </g>
        <g transform="translate(8 3)">
          <BackFigure rows={byGroup} onSelect={onSelect} />
        </g>
      </svg>

      {/* התוויות ב-HTML ולא כ-<text>: ככה הן באותו גודל בדיוק כמו כל שאר תוויות
          המטא במסך, במקום להתנפח ולהתכווץ עם קנה המידה של ה-SVG */}
      <div className="mx-auto flex max-w-[18rem]">
        <p className="meta flex-1 text-center">מלפנים</p>
        <p className="meta flex-1 text-center">מאחור</p>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        {TONE_ORDER.map((tone) => (
          <span key={tone} className="meta flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full border"
              style={{ background: TONES[tone].fill, borderColor: TONES[tone].stroke }}
            />
            {TONES[tone].legend}
          </span>
        ))}
      </div>
    </div>
  )
}
