import { useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BookOpen,
  ChevronLeft,
  CloudOff,
  Dumbbell,
  GraduationCap,
  ListPlus,
  X,
} from 'lucide-react'
import { getSettings } from '@/db/db'
import { getActiveRoutines, getBlocks, getFinishedSessions } from '@/db/queries'
import type { RoutineId } from '@/db/types'
import { blockStatuses, routineStatuses, suggestRoutine } from '@/domain/staleness'
import { formatDuration, formatVolume } from '@/domain/units'
import { daysSince, formatDateLong, formatDayCount, formatRelativeDay, todayISO } from '@/lib/dates'
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
  const blocks = useLiveQuery(() => getBlocks(), [])
  const sessions = useLiveQuery(() => getFinishedSessions(), [])
  const settings = useLiveQuery(() => getSettings(), [])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetRoutine, setSheetRoutine] = useState<RoutineId | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [backupHidden, setBackupHidden] = useState(false)

  const ready =
    routines !== undefined && blocks !== undefined && sessions !== undefined && settings !== undefined

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
    (routines ?? []).find((r) => r.id === id)?.name ?? 'אימון חופשי'

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
          <p className="mb-3 text-center text-sm text-bone-400">
            {suggestedRoutine
              ? `מוצע היום: ${suggestedRoutine.name} — ${suggestedRoutine.subtitle}`
              : 'בחר תוכנית ותתחיל'}
          </p>
          <Button
            variant="flame"
            size="hero"
            fullWidth
            icon={<Dumbbell size={26} strokeWidth={2.4} />}
            style={{ minHeight: '5rem' }}
            onClick={() => openSheet(suggested)}
          >
            התחל אימון
          </Button>
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
            <p className="meta mb-2">התוכניות</p>
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
          */}
          <section className="mb-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate('/exercises')}
              className="card flex min-h-20 flex-col justify-center gap-1 p-4 text-start active:bg-ink-800"
            >
              <BookOpen size={20} className="text-flame-400" />
              <span className="text-sm font-extrabold text-bone-50">כל התרגילים</span>
              <span className="meta">סרטון, דגשים ומשקלים</span>
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

            {/*
              המאגר יושב כאן ולא ליד "כל התרגילים" למרות הדמיון, כי הוא עונה על
              שאלה אחרת: לא "כמה הרמתי" אלא "איך עושים את זה". שורה רוחבית כדי
              שההבדל ייקרא מהצורה ולא רק מהטקסט.
            */}
            <button
              type="button"
              onClick={() => navigate('/library')}
              className="card col-span-2 flex min-h-16 items-center gap-3 p-4 text-start active:bg-ink-800"
            >
              <GraduationCap size={20} className="shrink-0 text-flame-400" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-bone-50">מאגר תרגילים</span>
                <span className="meta">איך מבצעים ואילו טעויות להימנע מהן</span>
              </span>
              <ChevronLeft size={18} className="shrink-0 text-bone-600" />
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
