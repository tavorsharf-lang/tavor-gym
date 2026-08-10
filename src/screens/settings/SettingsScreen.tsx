import { useEffect, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell, HardDrive, Film, ListChecks, Plus, TriangleAlert } from 'lucide-react'
import { getSettings, saveSettings } from '@/db/db'
import type { AppSettings } from '@/db/types'
import { formatBytes, formatClock, formatKg, round2 } from '@/domain/units'
import { useStorageStatus } from '@/hooks/useStorageStatus'
import { Screen } from '@/components/shell/ScreenHeader'
import { Button, toast } from '@/components/ui'
import {
  SettingLink,
  SettingNumber,
  SettingRow,
  SettingToggle,
} from '@/components/settings/SettingRow'

/**
 * הגדרות.
 *
 * כל שינוי נכתב מיד ובשקט — אין כפתור שמירה ואין טוסט על כל מתג, כי אישור
 * חוזר על פעולה שרואים אותה קורית הוא רק רעש.
 */

const APP_VERSION = '1.0.0'

/** הפלטות הסטנדרטיות במכון, לכל צד */
const STANDARD_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="mb-5">
      <h2 className="meta mb-2 px-1">{title}</h2>
      <div className="card divide-y divide-ink-800/70 overflow-hidden">{children}</div>
    </section>
  )
}

export function SettingsScreen(): JSX.Element {
  const navigate = useNavigate()
  const storage = useStorageStatus()

  const stored = useLiveQuery(() => getSettings(), [])
  // שכבה אופטימית מעל מה שבמסד: הכתיבה אסינכרונית, ובלעדיה המתג היה "קופץ
  // אחורה" לרגע בכל לחיצה.
  const [pending, setPending] = useState<Partial<AppSettings>>({})
  const settings = stored ? { ...stored, ...pending } : undefined

  const [newPlate, setNewPlate] = useState('')
  const platesToldRef = useRef(false)

  // פלטות לא סטנדרטיות נשארות כשבב גם אחרי כיבוי, אחרת פלטה שהמשתמש הוסיף
  // הייתה נעלמת מהמסך ברגע שהוא מכבה אותה ולא היה אפשר להחזיר אותה.
  const [extraPlates, setExtraPlates] = useState<number[]>([])
  const extrasSeededRef = useRef(false)
  useEffect(() => {
    if (!stored || extrasSeededRef.current) return
    extrasSeededRef.current = true
    setExtraPlates(stored.plates.perSideKg.filter((p) => !STANDARD_PLATES.includes(p)))
  }, [stored])

  const update = (patch: Partial<AppSettings>): void => {
    setPending((prev) => ({ ...prev, ...patch }))
    void saveSettings(patch)
  }

  const updatePlates = (patch: Partial<AppSettings['plates']>): void => {
    if (!settings) return
    update({ plates: { ...settings.plates, ...patch } })
    // מסבירים פעם אחת מה השינוי עושה, ואז שותקים
    if (!platesToldRef.current) {
      platesToldRef.current = true
      toast('מחשבון הפלטות יציע מעכשיו רק את מה שסימנת')
    }
  }

  const togglePlate = (kg: number): void => {
    if (!settings) return
    const current = settings.plates.perSideKg
    const next = current.includes(kg) ? current.filter((p) => p !== kg) : [...current, kg]
    updatePlates({ perSideKg: next.sort((a, b) => b - a) })
  }

  const addPlate = (): void => {
    if (!settings) return
    const value = round2(Number(newPlate.replace(',', '.').trim()))
    if (!Number.isFinite(value) || value <= 0) {
      toast('צריך מספר גדול מאפס', { tone: 'warn' })
      return
    }
    if (settings.plates.perSideKg.includes(value)) {
      toast('הפלטה הזו כבר ברשימה')
      setNewPlate('')
      return
    }
    setExtraPlates((prev) => (prev.includes(value) ? prev : [...prev, value]))
    updatePlates({ perSideKg: [...settings.plates.perSideKg, value].sort((a, b) => b - a) })
    setNewPlate('')
  }

  const askPersist = async (): Promise<void> => {
    const granted = await storage.requestPersist()
    await saveSettings({ storagePromptSeenAt: Date.now() })
    toast(
      granted
        ? 'האחסון הקבוע אושר — הנתונים לא יימחקו מאליהם'
        : 'הדפדפן לא אישר אחסון קבוע. הגיבוי חשוב עוד יותר עכשיו',
      { tone: granted ? 'success' : 'warn' }
    )
  }

  const usage = storage.usageBytes
  const quota = storage.quotaBytes
  const usedPercent =
    usage !== null && quota !== null && quota > 0 ? Math.min(100, (usage / quota) * 100) : null

  const allPlates = settings
    ? [...new Set([...STANDARD_PLATES, ...extraPlates, ...settings.plates.perSideKg])].sort(
        (a, b) => b - a
      )
    : STANDARD_PLATES

  return (
    <Screen>
      <header className="pt-safe mb-5">
        <h1 className="mt-2 text-2xl font-extrabold text-bone-50">הגדרות</h1>
      </header>

      {!settings ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <div className="card h-44 animate-pulse opacity-40" />
          <div className="card h-28 animate-pulse opacity-40" />
        </div>
      ) : (
        <>
          <Section title="אימון">
            <SettingNumber
              label="זמן מנוחה ברירת מחדל"
              description="בתרגיל שיש לו זמן משלו, הזמן שלו מנצח. אפשר לשנות גם תוך כדי אימון"
              value={settings.defaultRestSeconds}
              onChange={(v) => update({ defaultRestSeconds: v })}
              step={15}
              min={15}
              max={600}
              format={formatClock}
            />
            <SettingNumber
              label="חזרות ברירת מחדל"
              description="מה מוצע בשדה כשאין עדיין היסטוריה. ברגע שיש, היא מנצחת"
              value={settings.defaultReps}
              onChange={(v) => update({ defaultReps: v })}
              step={1}
              min={1}
              max={50}
            />
            <SettingToggle
              label="צליל בסיום מנוחה"
              description="גם הבזק על המסך, למקרה שהטלפון מושתק"
              checked={settings.soundEnabled}
              onChange={(v) => update({ soundEnabled: v })}
            />
            {settings.soundEnabled ? (
              <SettingRow
                stacked
                label="עוצמת צליל"
                control={
                  <div dir="ltr" className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round(settings.soundVolume * 100)}
                      onChange={(e) => update({ soundVolume: Number(e.target.value) / 100 })}
                      aria-label="עוצמת צליל"
                      className="h-12 min-w-0 flex-1 accent-flame-500"
                    />
                    <span className="tnum w-12 shrink-0 text-end text-sm font-bold text-bone-200">
                      {Math.round(settings.soundVolume * 100)}%
                    </span>
                  </div>
                }
              />
            ) : null}
            <SettingToggle
              label="השארת המסך דלוק"
              description="המסך לא ייכבה כל עוד יש אימון פתוח"
              checked={settings.wakeLockEnabled}
              onChange={(v) => update({ wakeLockEnabled: v })}
            />
            <SettingToggle
              label="סט חימום אוטומטי"
              description="מוצע בתרגיל הראשון של כל קבוצת שריר"
              checked={settings.autoWarmup}
              onChange={(v) => update({ autoWarmup: v })}
            />
            {settings.autoWarmup ? (
              <SettingNumber
                label="אחוז החימום"
                description="ממשקל העבודה הצפוי"
                value={settings.warmupPercent}
                onChange={(v) => update({ warmupPercent: v })}
                step={5}
                min={40}
                max={70}
                format={(v) => `${v}%`}
              />
            ) : null}
            <SettingToggle
              label="שאל RIR אחרי הדירוג"
              description="כמה חזרות נשארו במחסנית — מדייק את ההמלצה למשקל הבא"
              checked={settings.askRir}
              onChange={(v) => update({ askRir: v })}
            />
            <SettingToggle
              label="קונפטי בשיאים"
              checked={settings.confettiEnabled}
              onChange={(v) => update({ confettiEnabled: v })}
            />
          </Section>

          <Section title="יעדים">
            <SettingNumber
              label="אימונים בשבוע"
              description="היעד שממנו נספר הרצף"
              value={settings.weeklyGoal}
              onChange={(v) => update({ weeklyGoal: v })}
              step={1}
              min={1}
              max={7}
            />
            <SettingNumber
              label="ימים עד שבלוק נחשב מוזנח"
              description="בלוק מוזנח מוצע מעצמו במסך הפתיחה"
              value={settings.blockStaleDays}
              onChange={(v) => update({ blockStaleDays: v })}
              step={1}
              min={3}
              max={21}
              format={(v) => `${v} ימים`}
            />
          </Section>

          <Section title="פלטות">
            <SettingNumber
              label="משקל המוט"
              value={settings.plates.barWeightKg}
              onChange={(v) => updatePlates({ barWeightKg: v })}
              step={2.5}
              min={0}
              max={40}
              format={(v) => `${formatKg(v)} ק״ג`}
            />
            <div className="px-4 py-3">
              <p className="text-sm font-bold text-bone-50">הפלטות שיש במכון</p>
              <p className="mt-1 mb-3 text-xs leading-relaxed text-bone-500">
                מחשבון הפלטות מציע רק את מה שמסומן כאן. המספרים הם לכל צד.
              </p>
              <div className="flex flex-wrap gap-2">
                {allPlates.map((kg) => {
                  const on = settings.plates.perSideKg.includes(kg)
                  return (
                    <button
                      key={kg}
                      type="button"
                      aria-pressed={on}
                      onClick={() => togglePlate(kg)}
                      className={[
                        'tnum flex min-h-12 min-w-14 items-center justify-center rounded-pill border px-3 text-sm font-extrabold transition-colors',
                        on
                          ? 'border-flame-500/50 bg-flame-500/12 text-flame-300'
                          : 'border-ink-700 bg-ink-850 text-bone-500 active:bg-ink-800',
                      ].join(' ')}
                    >
                      {formatKg(kg)}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPlate()
                    }
                  }}
                  placeholder="7.5"
                  aria-label="משקל פלטה חדשה"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-ink-700 bg-ink-850 px-4 text-center text-bone-50 placeholder:text-bone-600 focus:border-flame-500/50 focus:outline-none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Plus size={16} strokeWidth={3} />}
                  onClick={addPlate}
                >
                  הוסף
                </Button>
              </div>
            </div>
          </Section>

          <Section title="ניהול">
            <SettingLink
              label="קטלוג התרגילים"
              description="שמות, דגשי ביצוע, קפיצות משקל"
              icon={<Dumbbell size={18} />}
              onClick={() => navigate('/settings/exercises')}
            />
            <SettingLink
              label="תוכניות ובלוקים"
              description="מה נכנס ל-A, ל-B, ל-C ולבלוקים"
              icon={<ListChecks size={18} />}
              onClick={() => navigate('/settings/plans')}
            />
            <SettingLink
              label="סרטונים ואחסון"
              description="התקנת סרטוני ההדגמה למכשיר"
              icon={<Film size={18} />}
              onClick={() => navigate('/settings/media')}
            />
            <SettingLink
              label="גיבוי ושחזור"
              description="ייצוא וייבוא של כל הנתונים"
              icon={<HardDrive size={18} />}
              onClick={() => navigate('/settings/backup')}
            />
          </Section>

          <section className="mb-5">
            <h2 className="meta mb-2 px-1">אחסון</h2>
            <div className="card p-4">
              {usage !== null && quota !== null && usedPercent !== null ? (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="tnum text-sm font-bold text-bone-50">{formatBytes(usage)}</p>
                    <p className="meta tnum">מתוך {formatBytes(quota)}</p>
                  </div>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-pill bg-ink-800"
                    role="progressbar"
                    aria-label="ניצול האחסון"
                    aria-valuenow={Math.round(usedPercent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-pill bg-flame-500 transition-[width] duration-500"
                      style={{ width: `${Math.max(1.5, usedPercent)}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-bone-400">
                  הדפדפן הזה לא מדווח כמה מקום האפליקציה תופסת
                </p>
              )}

              {storage.persisted === true ? (
                <p className="mt-3 text-xs leading-relaxed text-bone-500">
                  האחסון מסומן כקבוע — הדפדפן לא ימחק את הנתונים כשנגמר המקום.
                </p>
              ) : null}

              {storage.persisted === false ? (
                <div className="mt-4 rounded-card border border-flame-500/40 bg-flame-500/8 p-4">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-flame-300">
                    <TriangleAlert size={16} aria-hidden="true" />
                    ספארי עלולה למחוק את הנתונים
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-bone-400">
                    בלי אחסון קבוע, הדפדפן רשאי לפנות את כל היסטוריית האימונים כשנגמר המקום
                    במכשיר, בלי לשאול.
                  </p>
                  <Button
                    variant="flame"
                    size="md"
                    fullWidth
                    className="mt-3"
                    onClick={() => void askPersist()}
                  >
                    בקש אחסון קבוע
                  </Button>
                  <p className="mt-3 text-xs leading-relaxed text-bone-500">
                    גם אם יאושר — קובץ גיבוי הוא רשת הביטחון האמיתית, כי הוא היחיד ששורד מחיקת
                    אפליקציה או החלפת מכשיר.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <footer className="mt-8 mb-2 text-center">
            <p className="meta">אימוני כושר · גרסה {APP_VERSION}</p>
            <p className="mt-1.5 text-xs text-bone-600">כל הנתונים נשמרים רק במכשיר הזה</p>
          </footer>
        </>
      )}
    </Screen>
  )
}
