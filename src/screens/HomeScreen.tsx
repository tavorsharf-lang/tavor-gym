import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Blocks,
  BookOpen,
  ChevronLeft,
  CloudOff,
  Dumbbell,
  ListPlus,
  Shuffle,
  X,
} from 'lucide-react'
import { getSettings } from '@/db/db'
import {
  getActiveRoutines,
  getAllExercises,
  getBlocks,
  getCustomRoutines,
  getFinishedSessions,
  getRoutines,
  getSessionsSince,
} from '@/db/queries'
import { coverageLookbackFrom, muscleCoverage, uncoveredGroups } from '@/domain/coverage'
import type { RoutineId } from '@/db/types'
import { blockStatuses, routineStatuses, suggestRoutine } from '@/domain/staleness'
import { formatDuration, formatVolume } from '@/domain/units'
import { daysSince, formatDateLong, formatDayCount, formatRelativeDay, todayISO } from '@/lib/dates'
import { countMasculine } from '@/lib/text'
import { useNow } from '@/hooks/useNow'
import { useWorkout } from '@/state/activeWorkoutStore'
import { BottomSheet, Button, EmptyState, toast } from '@/components/ui'
import { Screen } from '@/components/shell/ScreenHeader'
import { StartWorkoutSheet } from '@/components/home/StartWorkoutSheet'
import { StreakRow } from '@/components/home/StreakRow'

/**
 * מסך הבית. השאלה היחידה שהוא צריך לענות עליה בחצי שנייה: מה מתאמנים היום.
 *
 * אין כאן ScreenHeader — זה מסך שורש בסרגל הניווט, ואין לאן לחזור ממנו.
 */

/** מעבר לזה מוצגת תזכורת גיבוי */
const BACKUP_NUDGE_DAYS = 30

export function HomeScreen(): JSX.Element {
  const navigate = useNavigate()
  const now = useNow()

  const workout = useWorkout((s) => s.workout)
  const discard = useWorkout((s) => s.discard)

  const routines = useLiveQuery(() => getActiveRoutines(), [])
  const customs = useLiveQuery(() => getCustomRoutines(), [])
  /*
    רשימה מלאה, לפתרון שמות בלבד.

    `getActiveRoutines` מסננת החוצה את האימונים השמורים — נכון להצעה היומית
    ולרשת התוכניות, ושגוי לחלוטין ל"כבר סיימת היום את…": אימון שמור שבוצע
    היה נקרא שם "אימון חופשי", כלומר האפליקציה שוכחת את השם שהמשתמש נתן.
  */
  const allRoutines = useLiveQuery(() => getRoutines(), [])
  const blocks = useLiveQuery(() => getBlocks(), [])
  const sessions = useLiveQuery(() => getFinishedSessions(), [])
  const settings = useLiveQuery(() => getSettings(), [])
  const exercises = useLiveQuery(() => getAllExercises(true), [])
  const history = useLiveQuery(() => getSessionsSince(coverageLookbackFrom(Date.now())), [])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetRoutine, setSheetRoutine] = useState<RoutineId | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [backupHidden, setBackupHidden] = useState(false)

  /*
    ‏`exercises` ו-`history` בשער הטעינה ולא רק ארבעת הראשונים.

    כרטיס בניית האימון מכריז כמה שרירים לא כוסו, והמספר הזה מחושב משניהם.
    לפני שהם נפתרים `muscleCoverage` מקבל מערכים ריקים ומחזיר שמונה קבוצות
    מוזנחות — כלומר כל פתיחה של האפליקציה הבזיקה "9 שרירים לא כוסו" לרגע,
    גם למי שהתאמן הבוקר.
  */
  const ready =
    routines !== undefined &&
    blocks !== undefined &&
    sessions !== undefined &&
    settings !== undefined &&
    exercises !== undefined &&
    history !== undefined

  const rStatuses = routineStatuses(routines ?? [], sessions ?? [], now)
  const suggested = suggestRoutine(rStatuses)
  const suggestedRoutine = (routines ?? []).find((r) => r.id === suggested) ?? null
  const bStatuses = blockStatuses(blocks ?? [], sessions ?? [], now, settings?.blockStaleDays ?? 7)

  const doneToday = (sessions ?? []).find((s) => s.date === todayISO(now))
  const lastSession = (sessions ?? [])[0] ?? null

  const elapsedSeconds = workout ? Math.max(0, Math.round((now - workout.startedAt) / 1000)) : 0
  const elapsedText =
    elapsedSeconds < 60 ? 'התחיל ממש עכשיו' : `התחיל לפני ${formatDuration(elapsedSeconds)}`

  const lastBackupAt = settings?.lastBackupAt ?? null
  const backupDays = lastBackupAt === null ? null : daysSince(lastBackupAt, now)
  const showBackupNudge =
    settings !== undefined && !backupHidden && (backupDays === null || backupDays >= BACKUP_NUDGE_DAYS)

  const openSheet = (routineId: RoutineId | null) => {
    setSheetRoutine(routineId)
    setSheetOpen(true)
  }

  const handleDiscard = async () => {
    await discard()
    setConfirmOpen(false)
    toast('האימון בוטל')
  }

  const routineNameOf = (id: RoutineId | null): string =>
    (allRoutines ?? []).find((r) => r.id === id)?.name ?? 'אימון חופשי'

  const cStatuses = routineStatuses(customs ?? [], sessions ?? [], now)
  // ממוזכר: המסך מתרנדר מחדש בכל פעימה של `useNow` ובכל כתיבה למסד, והחישוב
  // עובר על כל הסטים של ארבעת החודשים האחרונים
  const uncovered = useMemo(
    () =>
      uncoveredGroups(
        muscleCoverage(
          exercises ?? [],
          history?.sessions ?? [],
          history?.sets ?? [],
          now,
          settings?.coverageWindowDays ?? 4
        )
      ),
    [exercises, history, now, settings]
  )

  /*
    שורת הכיסוי — הסיבה להיכנס לבונה, נקראת לפני הלחיצה ולא אחריה. מוצגת רק
    אחרי ready: לפני שהשאילתות נפתרות muscleCoverage מחזיר שמונה קבוצות
    מוזנחות, וכל פתיחה הייתה מבזיקה "9 שרירים לא כוסו" גם למי שהתאמן הבוקר.
  */
  const coverageLine =
    uncovered.length === 0
      ? 'כל הגוף כוסה בימים האחרונים'
      : `${
          uncovered.length === 1
            ? 'שריר אחד לא כוסה'
            : `${countMasculine(uncovered.length)} שרירים לא כוסו`
        }: ${uncovered
          .slice(0, 3)
          .map((r) => r.label)
          .join(' · ')}`

  return (
    <Screen>
      <header className="pt-safe mb-5">
        <p className="meta mt-2">{formatDateLong(now)}</p>
        {doneToday ? (
          <p className="mt-1 text-sm text-bone-400">
            כבר סיימת היום את {routineNameOf(doneToday.routineId)}
          </p>
        ) : null}
      </header>

      {workout ? (
        <section className="card card-active animate-rise relative mb-6 p-4">
          <p className="text-lg font-extrabold text-bone-50">יש אימון פתוח</p>
          <p className="meta mt-1">{elapsedText}</p>
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="flame"
              size="lg"
              className="flex-1"
              onClick={() => navigate('/workout')}
            >
              המשך אימון
            </Button>
            <Button variant="quiet" size="lg" onClick={() => setConfirmOpen(true)}>
              בטל אימון
            </Button>
          </div>
        </section>
      ) : (
        <section className="animate-rise mb-6">
          {/*
            הדלת הראשית היא הבונה — תבור מתאמן בעיקר דרכו. הכפתור נושא את שני
            השמות ואת שורת הכיסוי יחד: "התחל אימון" הוא הפעולה, "בניית אימון"
            הוא לאן, והשרירים שלא כוסו הם למה. שורת הכיסוי רק אחרי ready —
            רגרסיית ההבזק מתועדת ליד coverageLine. התוכניות הקבועות ירדו
            לרשת שלהן, לחיצה אחת משם.
          */}
          <Button
            variant="flame"
            size="hero"
            fullWidth
            icon={<Dumbbell size={26} strokeWidth={2.4} />}
            style={{ minHeight: '5rem' }}
            onClick={() => navigate('/builder')}
          >
            <span className="flex flex-col items-center gap-0.5">
              <span>התחל אימון</span>
              <span className="text-xs font-semibold opacity-85">
                {ready ? `בניית אימון — ${coverageLine}` : '\u00a0'}
              </span>
            </span>
          </Button>

          {/*
            המסלול השני, ובכוונה שקט יותר: הבונה הוא מסך תכנון, וזה מסלול למי
            שמחליט ביום עצמו. שריר → תרגיל → מתעד, בלי סל ובלי אישור.
          */}
          <button
            type="button"
            onClick={() => navigate('/freestyle')}
            className="mt-2 flex min-h-14 w-full items-center gap-3 rounded-card border border-ink-700 bg-ink-900/60 px-4 text-start active:bg-ink-800"
          >
            <Shuffle size={18} className="shrink-0 text-bone-400" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-bone-100">אימון חופשי</span>
              <span className="meta block">בלי תוכנית — בוחר שריר, והתור נבנה תוך כדי</span>
            </span>
            <ChevronLeft size={16} className="shrink-0 text-bone-600" aria-hidden="true" />
          </button>
        </section>
      )}

      {!ready ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <div className="card h-24 animate-pulse opacity-50" />
          <div className="card h-16 animate-pulse opacity-50" />
          <div className="card h-20 animate-pulse opacity-50" />
        </div>
      ) : (
        <>
          <section className="mb-5">
            <p className="meta mb-2">
              התוכניות
              {suggestedRoutine ? ` · מוצע היום: ${suggestedRoutine.name}` : ''}
            </p>
            {/* הרשת מתאימה את עצמה למספר התוכניות — פול-באדי הוא שתיים, פיצול שלוש */}
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${Math.min(rStatuses.length, 3)}, minmax(0, 1fr))` }}
            >
              {rStatuses.map((status, i) => {
                const routine = (routines ?? []).find((r) => r.id === status.routineId)
                const isSuggested = status.routineId === suggested
                // אות בודדת לפיצול; לתוכנית עם שם אמיתי מציגים את השם
                const glyph = status.routineId.length === 1 ? status.routineId : null
                return (
                  <button
                    key={status.routineId}
                    type="button"
                    onClick={() => openSheet(status.routineId)}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className={[
                      'card animate-rise relative flex min-h-24 flex-col items-start gap-1 p-3 text-start',
                      isSuggested ? 'card-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span
                      className={[
                        glyph ? 'numeral-hero text-3xl' : 'text-sm leading-tight font-extrabold',
                        isSuggested ? 'text-flame-400' : 'text-bone-200',
                      ].join(' ')}
                    >
                      {glyph ?? routine?.name ?? status.routineId}
                    </span>
                    <span className="text-[0.6875rem] leading-tight text-bone-400">
                      {routine?.subtitle}
                    </span>
                    <span className="meta tnum mt-auto">
                      {status.neverDone ? 'עוד לא בוצע' : formatDayCount(status.daysSince ?? 0)}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {bStatuses.length > 0 ? (
            <section className="mb-5">
              <p className="meta mb-2">בלוקים נלווים</p>
              <div className="flex flex-wrap gap-2">
                {bStatuses.map((status) => (
                  <span
                    key={status.blockId}
                    className={[
                      'flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold',
                      status.stale
                        ? 'border-flame-500/45 bg-flame-500/8 text-flame-300'
                        : 'border-ink-700 bg-ink-900 text-bone-400',
                    ].join(' ')}
                  >
                    {status.stale ? (
                      <span className="size-1.5 rounded-full bg-flame-400" aria-hidden="true" />
                    ) : null}
                    {status.name}
                    <span className="meta tnum">
                      {status.neverDone ? 'עוד לא' : formatDayCount(status.daysSince ?? 0)}
                    </span>
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/*
            שתי הכניסות שרוצים מהר מהבית: לראות מה עושים בתרגיל מסוים, ולשנות
            את מה שנכנס לאימון. שתיהן היו קבורות בהגדרות.

            עד כאן היו כאן שלוש: "כל התרגילים" והמאגר הלימודי ישבו בנפרד, עם
            צורות שונות, כדי שההבדל ביניהם ייקרא מהצורה. הם התאחדו למסך אחד עם
            מתג — ההבדל נקרא עכשיו מהמתג, והשורה הרוחבית מתפנה.
          */}
          {/*
            האימונים שהמשתמש בנה ושמר. מדור נפרד ולא ברשת התוכניות: תוכנית
            קבועה ואימון שמור הם שני דברים שונים — האחת מתחלפת במתג ומוצעת
            אוטומטית, השני נבחר במפורש — וערבוב שלהם היה הופך את "מה מתאמנים
            היום" לרשימה שגדלה בלי גבול.
          */}
          {cStatuses.length > 0 ? (
            <section className="mb-5">
              <p className="meta mb-2">האימונים שלי</p>
              <div className="flex flex-col gap-2">
                {cStatuses.map((status) => (
                  <button
                    key={status.routineId}
                    type="button"
                    onClick={() => openSheet(status.routineId)}
                    className="card animate-rise flex items-center gap-3 p-3 text-start active:bg-ink-800"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold text-bone-50">
                        {status.name}
                      </span>
                      <span className="meta block truncate">
                        {(customs ?? []).find((r) => r.id === status.routineId)?.subtitle}
                      </span>
                    </span>
                    <span className="meta tnum shrink-0">
                      {status.neverDone ? 'עוד לא בוצע' : formatDayCount(status.daysSince ?? 0)}
                    </span>
                    <ChevronLeft size={18} className="shrink-0 text-bone-600" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mb-5 grid grid-cols-2 gap-3">
            {/*
              הבונה הוא ההירו, ולכן הכרטיס הרוחבי שלו מרונדר רק כשאימון פתוח
              והירו התחלף ב"המשך אימון" — אחרת היו שני כפתורי "בניית אימון"
              על המסך, ו-findByRole לפי השם היה נשבר בכל טסטי הבונה. או-או
              קשיח על workout: בדיוק כפתור אחד בכל מצב, והבונה נגיש גם באמצע
              אימון (הסל יודע להוסיף לאימון הפתוח).
            */}
            {workout ? (
              <button
                type="button"
                onClick={() => navigate('/builder')}
                className="card col-span-2 flex min-h-20 flex-col justify-center gap-1 p-4 text-start active:bg-ink-800"
              >
                <Blocks size={20} className="text-flame-400" />
                <span className="text-sm font-extrabold text-bone-50">בניית אימון</span>
                <span className="meta">{coverageLine}</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/exercises')}
              className="card flex min-h-20 flex-col justify-center gap-1 p-4 text-start active:bg-ink-800"
            >
              <BookOpen size={20} className="text-flame-400" />
              <span className="text-sm font-extrabold text-bone-50">תרגילים</span>
              <span className="meta">משקלים, סרטונים ומה שאפשר להוסיף</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings/plans')}
              className="card flex min-h-20 flex-col justify-center gap-1 p-4 text-start active:bg-ink-800"
            >
              <ListPlus size={20} className="text-flame-400" />
              <span className="text-sm font-extrabold text-bone-50">עריכת האימונים</span>
              <span className="meta">הוספה, הסרה ושינוי</span>
            </button>
          </section>

          <section className="mb-5">
            <StreakRow sessions={sessions ?? []} goal={settings?.weeklyGoal ?? 3} />
          </section>

          <section className="mb-5">
            <p className="meta mb-2">האימון האחרון</p>
            {lastSession ? (
              <button
                type="button"
                onClick={() => navigate(`/history/${lastSession.id}`)}
                className="card flex w-full items-center gap-3 p-4 text-start"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-extrabold text-bone-50">
                    {routineNameOf(lastSession.routineId)}
                    {lastSession.blockIds.length > 0 ? (
                      <span className="font-semibold text-bone-400">
                        {' + '}
                        {lastSession.blockIds
                          .map((id) => (blocks ?? []).find((b) => b.id === id)?.name ?? id)
                          .join(' · ')}
                      </span>
                    ) : null}
                  </span>
                  <span className="meta mt-1 block">
                    {formatRelativeDay(lastSession.startedAt, now)} ·{' '}
                    <span className="tnum">{formatDuration(lastSession.durationSeconds)}</span> ·{' '}
                    <span className="tnum">{formatVolume(lastSession.totalVolumeKg)}</span> ·{' '}
                    <span className="tnum">{lastSession.totalSets}</span> סטים
                  </span>
                </span>
                <ChevronLeft size={20} className="shrink-0 text-bone-600" aria-hidden="true" />
              </button>
            ) : (
              <div className="card">
                <EmptyState
                  icon={<Dumbbell />}
                  title="עוד לא נרשם כאן אימון"
                  hint="הראשון תמיד הכי קשה. תלחץ על התחל אימון והברזל כבר ידאג לשאר."
                />
              </div>
            )}
          </section>

          {showBackupNudge ? (
            <section className="mb-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate('/settings/backup')}
                className="flex min-h-12 flex-1 items-center gap-2 rounded-2xl px-2 text-start text-xs leading-relaxed text-bone-500 active:bg-ink-900"
              >
                <CloudOff size={16} className="shrink-0 text-bone-600" aria-hidden="true" />
                <span>
                  {backupDays === null
                    ? 'עוד לא גיבית — הנתונים קיימים רק במכשיר הזה'
                    : `לא גיבית כבר ${formatDayCount(backupDays)} — הנתונים קיימים רק במכשיר הזה`}
                </span>
              </button>
              <button
                type="button"
                aria-label="הסתר את תזכורת הגיבוי"
                onClick={() => setBackupHidden(true)}
                className="flex size-12 shrink-0 items-center justify-center rounded-full text-bone-600 active:bg-ink-900"
              >
                <X size={18} />
              </button>
            </section>
          ) : null}
        </>
      )}

      <StartWorkoutSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialRoutineId={sheetRoutine}
      />

      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="לבטל את האימון?">
        <p className="text-sm leading-relaxed text-bone-400">
          כל הסטים שנרשמו באימון הזה יימחקו ולא יופיעו בהיסטוריה. אין דרך לשחזר אותם.
        </p>
        <div className="mt-5 mb-2 flex flex-col gap-2">
          <Button variant="danger" size="lg" fullWidth onClick={() => void handleDiscard()}>
            כן, בטל את האימון
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => setConfirmOpen(false)}>
            השאר פתוח
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  )
}
