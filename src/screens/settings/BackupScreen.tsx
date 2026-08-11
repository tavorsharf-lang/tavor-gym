import { useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, FileDown, FileUp, HardDrive, Upload } from 'lucide-react'
import { getSettings, resetDatabase } from '@/db/db'
import { invalidateHiddenVideos } from '@/db/hiddenVideos'
import {
  backupFilename,
  backupNow,
  STALE_BACKUP_DAYS,
  exportMedia,
  importData,
  importMedia,
  saveBlob,
} from '@/db/backup'
import { mediaUsage } from '@/db/mediaDb'
import { formatBytes } from '@/domain/units'
import { daysSince, formatRelativeDay } from '@/lib/dates'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { BottomSheet, Button, toast } from '@/components/ui'

/**
 * גיבוי ושחזור.
 *
 * שני קבצים נפרדים: הנתונים הם JSON קטן, והסרטונים הם ZIP כבד. רוב הזמן
 * מספיק לייצא את הנתונים — הסרטונים תמיד אפשר להתקין מחדש.
 */

/** מעבר לזה השורה נצבעת באדום */

type Busy = 'data' | 'media' | 'import' | null
type PendingKind = 'data' | 'media'

function ActionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}): JSX.Element {
  return (
    <section className="card mb-4 p-4">
      <h2 className="text-base font-extrabold text-bone-50">{title}</h2>
      <p className="mt-1.5 mb-3 text-xs leading-relaxed text-bone-400">{description}</p>
      {children}
    </section>
  )
}

export function BackupScreen(): JSX.Element {
  const navigate = useNavigate()

  const settings = useLiveQuery(() => getSettings(), [])
  const media = useLiveQuery(() => mediaUsage(), [], { count: 0, bytes: 0 })

  const [busy, setBusy] = useState<Busy>(null)
  const [mediaProgress, setMediaProgress] = useState<{ done: number; total: number } | null>(null)
  const [pending, setPending] = useState<{ kind: PendingKind; file: File } | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetStep, setResetStep] = useState<1 | 2>(1)

  const dataInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  const lastBackupAt = settings?.lastBackupAt ?? null
  const backupDays = lastBackupAt === null ? null : daysSince(lastBackupAt)
  const backupStale = backupDays === null || backupDays >= STALE_BACKUP_DAYS

  const exportDataFile = async (): Promise<void> => {
    setBusy('data')
    try {
      // ביטול בגיליון השיתוף = אין קובץ בשום מקום. `backupNow` לא מסמן תאריך
      // במקרה הזה, אחרת האזהרה בבית הייתה נשתקת לחודש על גיבוי שלא קיים.
      const how = await backupNow()
      if (how === 'cancelled') {
        toast('הייצוא בוטל')
        return
      }
      toast(
        how === 'shared'
          ? 'הגיבוי נשלח לגיליון השיתוף — שמור אותו ב״קבצים״'
          : 'קובץ הגיבוי ירד למכשיר',
        { tone: 'success' }
      )
    } catch {
      toast('הייצוא נכשל', { tone: 'warn' })
    } finally {
      setBusy(null)
    }
  }

  const exportMediaFile = async (): Promise<void> => {
    setBusy('media')
    setMediaProgress({ done: 0, total: media.count })
    try {
      const blob = await exportMedia((done, total) => setMediaProgress({ done, total }))
      const how = await saveBlob(blob, backupFilename(Date.now(), 'media'))
      if (how === 'cancelled') {
        toast('הייצוא בוטל')
        return
      }
      toast(how === 'shared' ? 'ארכיון הסרטונים נשלח לשיתוף' : 'ארכיון הסרטונים ירד למכשיר', {
        tone: 'success',
      })
    } catch {
      toast('ייצוא הסרטונים נכשל', { tone: 'warn' })
    } finally {
      setMediaProgress(null)
      setBusy(null)
    }
  }

  const runImport = async (): Promise<void> => {
    if (!pending) return
    const { kind, file } = pending
    setPending(null)
    setBusy('import')
    try {
      if (kind === 'data') {
        const result = await importData(file)
        if (!result.ok) {
          toast(result.error, { tone: 'warn' })
          return
        }
        const summary = Object.entries(result.counts)
          .filter(([, n]) => n > 0)
          .map(([label, n]) => `${n} ${label}`)
          .join(' · ')
        toast(summary ? `יובאו ${summary}` : 'הגיבוי יובא — אבל הוא היה ריק', { tone: 'success' })
      } else {
        setMediaProgress({ done: 0, total: 0 })
        const result = await importMedia(file, (done, total) => setMediaProgress({ done, total }))
        if (!result.ok) {
          toast(result.error, { tone: 'warn' })
          return
        }
        toast(`יובאו ${result.count} סרטונים`, { tone: 'success' })
      }
      // טעינה מחדש: החנות של האימון הפעיל והמסכים הפתוחים מחזיקים נתונים
      // שכבר לא קיימים אחרי החלפת המסד.
      window.setTimeout(() => navigate(0), 1600)
    } catch {
      toast('הייבוא נכשל', { tone: 'warn' })
    } finally {
      setMediaProgress(null)
      setBusy(null)
    }
  }

  const runReset = async (): Promise<void> => {
    setResetOpen(false)
    try {
      await resetDatabase()
      // ההגדרות נמחקו יחד עם המסד, ואיתן רשימת הסרטונים שנמחקו
      invalidateHiddenVideos()
      toast('הכל אופס. האפליקציה חוזרת לנתוני ההתחלה')
      window.setTimeout(() => navigate(0), 1600)
    } catch {
      toast('האיפוס נכשל', { tone: 'warn' })
    }
  }

  const percent =
    mediaProgress && mediaProgress.total > 0
      ? (mediaProgress.done / mediaProgress.total) * 100
      : 0

  return (
    <Screen dock={false}>
      <ScreenHeader title="גיבוי ושחזור" fallback="/settings" />

      <section className="card animate-rise mb-4 border-flame-500/25 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-flame-400">
            <HardDrive size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-bone-50">הנתונים חיים רק כאן</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-bone-400">
              אין שרת ואין ענן. כל האימונים, השיאים והמשקלים שמורים בתוך הדפדפן במכשיר הזה —
              ומחיקת האפליקציה, ניקוי אתרים או מכשיר חדש מוחקים אותם. קובץ גיבוי הוא הדבר
              היחיד ששורד את זה.
            </p>
          </div>
        </div>

        <p
          className={[
            'tnum mt-3 border-t border-ink-800/70 pt-3 text-sm font-bold',
            backupStale ? 'text-hard-400' : 'text-bone-200',
          ].join(' ')}
        >
          {lastBackupAt === null
            ? 'עוד לא גיבית אף פעם'
            : `הגיבוי האחרון: ${formatRelativeDay(lastBackupAt)}`}
        </p>
      </section>

      <ActionCard
        title="ייצוא"
        description="קובץ אחד עם כל האימונים, הסטים, השיאים, הקטלוג וההגדרות. קטן מספיק לשלוח לעצמך בוואטסאפ."
      >
        <Button
          variant="flame"
          size="lg"
          fullWidth
          icon={<FileDown size={20} />}
          loading={busy === 'data'}
          disabled={busy !== null}
          onClick={() => void exportDataFile()}
        >
          ייצא נתונים
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          className="mt-2"
          icon={<Download size={18} />}
          loading={busy === 'media'}
          disabled={busy !== null || media.count === 0}
          onClick={() => void exportMediaFile()}
        >
          {media.count === 0
            ? 'אין סרטונים לייצוא'
            : `ייצא סרטונים · ${formatBytes(media.bytes)}`}
        </Button>

        {busy === 'media' && mediaProgress ? (
          <>
            <div
              className="mt-3 h-2 overflow-hidden rounded-pill bg-ink-800"
              role="progressbar"
              aria-label="התקדמות הייצוא"
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-pill bg-flame-500 transition-[width] duration-300"
                style={{ width: `${Math.max(2, percent)}%` }}
              />
            </div>
            <p className="meta tnum mt-2">
              {mediaProgress.done} מתוך {mediaProgress.total}
            </p>
          </>
        ) : null}
      </ActionCard>

      <ActionCard
        title="ייבוא"
        description="שחזור מקובץ גיבוי. ייבוא נתונים מוחק את כל מה שקיים ומחליף אותו — ייבוא סרטונים רק מוסיף."
      >
        <Button
          variant="ghost"
          size="md"
          fullWidth
          icon={<FileUp size={18} />}
          disabled={busy !== null}
          onClick={() => dataInputRef.current?.click()}
        >
          ייבא נתונים
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          className="mt-2"
          icon={<Upload size={18} />}
          disabled={busy !== null}
          onClick={() => mediaInputRef.current?.click()}
        >
          ייבא סרטונים
        </Button>

        <input
          ref={dataInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) setPending({ kind: 'data', file })
          }}
        />
        <input
          ref={mediaInputRef}
          type="file"
          accept="application/zip,.zip"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) setPending({ kind: 'media', file })
          }}
        />

        {busy === 'import' && mediaProgress ? (
          <p className="meta tnum mt-3">
            מייבא {mediaProgress.done} מתוך {mediaProgress.total}
          </p>
        ) : null}
      </ActionCard>

      <section className="mb-4">
        <h2 className="meta mb-2 px-1">אזור מסוכן</h2>
        <div className="card border-hard-400/25 p-4">
          <p className="text-xs leading-relaxed text-bone-400">
            איפוס מוחק את כל האימונים, השיאים והמשקלים ומחזיר את הקטלוג והתוכניות לנתוני
            ההתחלה. הסרטונים שהותקנו נשארים.
          </p>
          <Button
            variant="danger"
            size="md"
            fullWidth
            className="mt-3"
            disabled={busy !== null}
            onClick={() => {
              setResetStep(1)
              setResetOpen(true)
            }}
          >
            אפס הכל
          </Button>
        </div>
      </section>

      <BottomSheet
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.kind === 'media' ? 'לייבא את הסרטונים?' : 'הייבוא מחליף הכל'}
      >
        <p className="text-sm leading-relaxed text-bone-400">
          {pending?.kind === 'media'
            ? 'הסרטונים מהארכיון יתווספו למכשיר. סרטון עם אותו מזהה יידרס בגרסה מהארכיון.'
            : 'כל האימונים, הסטים, השיאים, הקטלוג וההגדרות שקיימים עכשיו יימחקו ויוחלפו בתוכן הקובץ. אין דרך לבטל את זה — אם לא גיבית את המצב הנוכחי, כדאי לעשות את זה קודם.'}
        </p>
        {pending ? (
          <p className="meta mt-3 truncate">
            {pending.file.name} · {formatBytes(pending.file.size)}
          </p>
        ) : null}
        <div className="mt-5 mb-2 flex flex-col gap-2">
          <Button
            variant={pending?.kind === 'media' ? 'flame' : 'danger'}
            size="lg"
            fullWidth
            onClick={() => void runImport()}
          >
            {pending?.kind === 'media' ? 'ייבא סרטונים' : 'כן, החלף הכל'}
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => setPending(null)}>
            ביטול
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={resetStep === 1 ? 'לאפס את הכל?' : 'בטוח לגמרי?'}
      >
        {resetStep === 1 ? (
          <>
            <p className="text-sm leading-relaxed text-bone-400">
              כל היסטוריית האימונים, השיאים ומשקלי הגוף יימחקו. הקטלוג, התוכניות וההגדרות
              יחזרו לנתוני ההתחלה.
            </p>
            <div className="mt-5 mb-2 flex flex-col gap-2">
              <Button variant="danger" size="lg" fullWidth onClick={() => setResetStep(2)}>
                המשך
              </Button>
              <Button variant="ghost" size="lg" fullWidth onClick={() => setResetOpen(false)}>
                ביטול
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-hard-400">
              אין דרך לשחזר את זה בלי קובץ גיבוי.
            </p>
            <div className="mt-5 mb-2 flex flex-col gap-2">
              <Button variant="danger" size="lg" fullWidth onClick={() => void runReset()}>
                כן, מחק הכל
              </Button>
              <Button variant="ghost" size="lg" fullWidth onClick={() => setResetOpen(false)}>
                לא, השאר הכל
              </Button>
            </div>
          </>
        )}
      </BottomSheet>
    </Screen>
  )
}
