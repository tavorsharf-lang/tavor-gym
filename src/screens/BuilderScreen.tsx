import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, LayoutGrid, List, Play, Wand2 } from 'lucide-react'
import { getSettings } from '@/db/db'
import { assetUrl } from '@/db/mediaDb'
import { groupCardFor } from '@/db/muscleCards'
import { getAllExercises, getLastPerformedMap, getSessionsSince } from '@/db/queries'
import { MUSCLE_GROUPS } from '@/db/types'
import type { MuscleCoverage } from '@/domain/coverage'
import {
  coverageLookbackFrom,
  coverageText,
  muscleCoverage,
  suggestWorkout,
} from '@/domain/coverage'
import { formatDayCount } from '@/lib/dates'
import { countMasculine } from '@/lib/text'
import { useNow } from '@/hooks/useNow'
import { useAudioCue } from '@/hooks/useAudioCue'
import { useBasket } from '@/state/builderBasket'
import { useWorkout } from '@/state/activeWorkoutStore'
import { useHiddenExerciseIds } from '@/db/hiddenExercises'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { toast } from '@/components/ui'
import { BasketBar } from '@/components/builder/BasketBar'
import { BodyMap } from '@/components/builder/BodyMap'

/**
 * בניית אימון — מסך השרירים.
 *
 * השאלה שהוא עונה עליה היא ההפך מזו של מסך הבית: לא "מה התוכנית אומרת היום"
 * אלא "מה לא עשיתי". לכן הוא ממוין מהמוזנח ביותר ולא לפי סדר קבוע, וכל שמונה
 * הקבוצות מופיעות גם באפס — קבוצה שנעלמת מהמסך היא בדיוק זו שממשיכים לשכוח.
 *
 * המספר הגדול בכל שורה הוא כמה תרגילים *שונים* עבדו על השריר בחלון, כי זו
 * היחידה שבה חושבים כשבונים אימון. הסטים לצידו כי שני תרגילים בסט אחד כל אחד
 * הם לא אותו דבר כמו שניים בארבעה.
 */

/** כמה תרגילים ההצעה האוטומטית בונה */
const SUGGESTION_SIZE = 6

export function BuilderScreen(): JSX.Element {
  const navigate = useNavigate()
  const now = useNow()
  const [asMap, setAsMap] = useState(false)

  const exercises = useLiveQuery(() => getAllExercises(true), [])
  const settings = useLiveQuery(() => getSettings(), [])
  /*
    שאילתה אחת מאונדקסת על startedAt, ולא סריקה של טבלת הסטים.
    הטווח רחב מהחלון בכוונה — שריר מוזנח הוא בדיוק זה שלא נגעו בו הרבה לפני
    כן, ובלי הטווח הרחב כל שריר שלא אומן השבוע היה נראה זהה.
  */
  const history = useLiveQuery(() => getSessionsSince(coverageLookbackFrom(Date.now())), [])
  const lastPerformed = useLiveQuery(() => getLastPerformedMap(), [], new Map())

  const basket = useBasket((s) => s.items)
  const toggle = useBasket((s) => s.toggle)
  const hidden = useHiddenExerciseIds()

  const workout = useWorkout((s) => s.workout)
  const { unlock } = useAudioCue(settings?.soundEnabled ?? true, settings?.soundVolume ?? 0.8)
  const [starting, setStarting] = useState(false)
  /** אימון פתוח נמחק בהתחלה חדשה — לכן הכפתור שואל לפני, כמו בפס הסל */

  const windowDays = settings?.coverageWindowDays ?? 4
  const ready = exercises !== undefined && history !== undefined && settings !== undefined

  const rows = useMemo(
    () =>
      muscleCoverage(exercises ?? [], history?.sessions ?? [], history?.sets ?? [], now, windowDays),
    [exercises, history, now, windowDays]
  )

  const uncovered = rows.filter((r) => r.uncovered)

  /**
   * ממלא את הסל בעצמו: השרירים המוזנחים ביותר, ולכל אחד התרגיל שהכי מזמן לא
   * בוצע. זו מטרת המסך בלחיצה אחת — מכאן זו כבר עריכה של הצעה ולא בנייה מאפס.
   */
  const buildForMe = (): void => {
    const lastAt = new Map([...lastPerformed].map(([id, l]) => [id, l.at]))
    // ההצעה מדלגת על מוסתרים — היא לא יכולה להכניס לסל שורה שלא רואים.
    // muscleCoverage לעומתה נשארת לא מסוננת: ייחוס היסטורי צריך את כולם.
    const picks = suggestWorkout(rows, exercises ?? [], lastAt, SUGGESTION_SIZE, hidden ?? undefined)
    const fresh = picks.filter((ex) => !basket.some((i) => i.id === ex.id))
    if (!fresh.length) {
      toast('כל מה שהייתי מציע כבר בסל')
      return
    }
    for (const ex of fresh) {
      toggle({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        needsCatalogEntry: false,
      })
    }
    toast(`${fresh.length} תרגילים נכנסו לסל`, { tone: 'success' })
  }

  /**
   * אימון בלי אף תרגיל, שנבנה כולו תוך כדי.
   *
   * זו הצורה השלישית של "מה אני עושה היום", לצד התוכנית הקבועה ולצד הסל:
   * *עוד לא החלטתי*. מי שמגיע לחדר ומחליט מול המכונה הפנויה לא צריך לבחור
   * שישה תרגילים מראש רק כדי לקבל מסך שאפשר לתעד בו — הוא מתחיל ריק ומוסיף
   * מהכפתור שבכותרת האימון, אחד-אחד, בקצב של החדר.
   *
   * ‏`startWithItems([])` ולא `start(null, [])`: השני קורא לתוכניות ולבלוקים
   * ובונה תור מהן, והראשון הוא בדיוק "אימון חופשי מהרשימה הזו" — עם רשימה
   * ריקה הוא נותן תור ריק ו-`currentKey: null`, שזה המצב הנכון.
   */
  const startEmpty = (): void => {
    if (starting) return
    /*
      שחרור האודיו חייב להיות המשפט הראשון. אחרי await המחווה של הלחיצה כבר
      נצרכה, וספארי מסרב לפתוח קול — כלומר טיימר המנוחה היה שותק לאורך כל
      האימון. אותו לקח בדיוק כמו בפס הסל.
    */
    unlock()
    setStarting(true)
    void useWorkout
      .getState()
      .startWithItems([])
      .then((outcome) => {
        /*
          אימון פתוח חוסם, ולא נדרס — והכפתור ממילא כבר לא מציע להתחיל
          כשיש אחד. השער נשאר בשביל המרוץ: אימון שנפתח בלשונית אחרת.
        */
        if (outcome === 'busy') toast('יש כבר אימון פתוח — סיים אותו קודם', { tone: 'warn' })
        navigate('/workout')
      })
      .catch(() => toast('לא הצלחתי להתחיל את האימון', { tone: 'warn' }))
      .finally(() => setStarting(false))
  }

  const openSetCount = workout
    ? Object.values(workout.setsByKey).reduce((n, sets) => n + sets.length, 0)
    : 0

  return (
    <Screen dock={false}>
      <ScreenHeader
        title="בניית אימון"
        subtitle={`${windowDays} הימים האחרונים · המוזנח ביותר למעלה`}
        action={
          <button
            type="button"
            onClick={() => setAsMap((v) => !v)}
            aria-label={asMap ? 'הסתר את מפת הגוף' : 'הצג מפת גוף'}
            aria-pressed={asMap}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-bone-400 active:bg-ink-800"
          >
            {asMap ? <List size={20} /> : <LayoutGrid size={20} />}
          </button>
        }
      />

      {!ready ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card h-16 animate-pulse opacity-50" />
          ))}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm leading-relaxed text-bone-400">
            {uncovered.length === 0
              ? 'כיסית את כל הגוף בימים האחרונים. יפה.'
              : `${
                  uncovered.length === 1
                    ? 'שריר אחד'
                    : `${countMasculine(uncovered.length)} שרירים`
                } לא קיבלו כלום: ${uncovered
                  .slice(0, 3)
                  .map((r) => r.label)
                  .join(' · ')}${uncovered.length > 3 ? ' ועוד' : ''}`}
          </p>

          <button
            type="button"
            onClick={buildForMe}
            className="mb-2 flex min-h-14 w-full items-center gap-3 rounded-card border border-flame-500/40 bg-flame-500/12 px-4 text-start active:bg-flame-500/20"
          >
            <Wand2 size={20} className="shrink-0 text-flame-300" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-flame-300">בנה לי אימון</span>
              <span className="meta block">
                {countMasculine(SUGGESTION_SIZE)} תרגילים מהשרירים והתרגילים המוזנחים ביותר
              </span>
            </span>
          </button>

          {/*
            שקט מ"בנה לי אימון" ובכוונה: זו לא ההצעה, זו הוויתור עליה. מי
            שיודע מה הוא רוצה בונה בסל, מי שלא יודע לוחץ על השרביט, ומי שרוצה
            להחליט מול המכונה מתחיל ריק.
          */}
          {/*
            כשיש אימון פתוח הכפתור לא מציע להתחיל ריק — הוא מחזיר אליו.
            אימון פתוח לא נדרס, והדרך לפנות מקום היא לסיים או לבטל אותו
            מתוכו, לא כתופעת לוואי של פתיחת אחר.
          */}
          <button
            type="button"
            onClick={workout ? () => navigate('/workout') : startEmpty}
            disabled={starting}
            className="mb-5 flex min-h-14 w-full items-center gap-3 rounded-card border border-ink-700 bg-ink-900/60 px-4 text-start active:bg-ink-800 disabled:opacity-50"
          >
            <Play size={20} className="shrink-0 text-bone-400" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-bone-100">
                {workout ? 'חזור לאימון שרץ' : 'אימון ריק — אבנה תוך כדי'}
              </span>
              <span className="meta block">
                {workout
                  ? openSetCount > 0
                    ? `${countMasculine(openSetCount)} סטים כבר תועדו — סיים אותו לפני שמתחילים חדש`
                    : 'סיים אותו לפני שמתחילים חדש'
                  : 'מתחילים בלי כלום, ומוסיפים תרגילים מהכפתור שבכותרת האימון'}
              </span>
            </span>
          </button>

          {/*
            המפה *מעל* הרשימה ולא במקומה.

            כשהיא הייתה תצוגה חלופית היא תפסה 270 פיקסלים והשאירה 358 ריקים
            מתחתיה — מסך שנראה כאילו לא סיים להיטען. היא גם לא מחליפה את
            הרשימה מבחינת תוכן: היא נותנת את התמונה במבט, והמספרים והלחיצה
            לפירוט חיים בשורות. המתג הוא "להראות אותה או לא", לא "או-או".
          */}
          {asMap ? (
            <div className="mb-5">
              <BodyMap rows={rows} onSelect={(group) => navigate(`/builder/${group}`)} />
            </div>
          ) : null}

          <div className="card divide-y divide-ink-800/70 overflow-hidden">
            {rows.map((row) => (
              <MuscleRow
                key={row.group}
                row={row}
                onOpen={() => navigate(`/builder/${row.group}`)}
              />
            ))}
          </div>
        </>
      )}

      <BasketBar />
    </Screen>
  )
}

/**
 * שורת שריר.
 *
 * הצבע הוא הרמזור: מה שלא קיבל כלום בחלון נצבע, והשאר שקט. עבודה עקיפה
 * מוצגת קטן ובנפרד — היא משנה החלטה ("היד כבר קיבלה מהחתירה") אבל היא לא
 * "אימנתי את זה", ומספר אחד שמאחד את השניים היה מוחק בדיוק את ההבדל הזה.
 *
 * הכרטיס האנטומי הוא תמונה ולא כפתור, וזו החלטה ולא קיצור: כל השורה כבר
 * נלחצת ומובילה לרשימת התרגילים של אותו שריר, וכפתור מקונן בתוכה היה מפעיל
 * שני מטפלים בלחיצה אחת. הכרטיס בגדול נמצא צעד אחד פנימה, בכותרת של אותו מסך.
 */
function MuscleRow({ row, onOpen }: { row: MuscleCoverage; onOpen: () => void }): JSX.Element {
  const card = groupCardFor(row.group)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 p-3.5 text-start transition-colors active:bg-ink-800"
    >
      <span
        aria-hidden="true"
        className={[
          'size-2.5 shrink-0 rounded-full',
          row.uncovered ? 'bg-flame-400' : 'bg-ink-600',
        ].join(' ')}
      />

      {card ? (
        <img
          src={assetUrl(card.thumb)}
          alt=""
          className="size-11 shrink-0 rounded-lg border border-ink-700 bg-bone-50 object-contain"
          loading="lazy"
        />
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-extrabold text-bone-50">
          {MUSCLE_GROUPS[row.group].label}
        </span>
        <span className="meta mt-0.5 block truncate">
          {row.neverDone
            ? 'לא נמצא בחודשים האחרונים'
            : `לאחרונה ${formatDayCount(row.daysSince ?? 0)}`}
        </span>
      </span>

      <span className="shrink-0 text-end">
        <span
          className={[
            'block text-sm font-extrabold',
            row.uncovered ? 'text-flame-300' : 'text-bone-200',
          ].join(' ')}
        >
          <span className="tnum">{coverageText(row)}</span>
        </span>
        {row.indirectSets > 0 ? (
          <span className="meta tnum mt-0.5 block">+{row.indirectSets} עקיף</span>
        ) : null}
      </span>

      <ChevronLeft size={18} className="shrink-0 text-bone-600" aria-hidden="true" />
    </button>
  )
}
