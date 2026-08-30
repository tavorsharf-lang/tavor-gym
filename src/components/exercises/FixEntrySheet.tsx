import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { RotateCcw } from 'lucide-react'
import { assetUrl } from '@/db/mediaDb'
import { muscleCardFor } from '@/db/muscleCards'
import { SUBS_BY_GROUP, subTargetFor } from '@/db/subTargets'
import { addFromLibrary, renameExercise } from '@/db/catalog'
import {
  clearMuscleFix,
  fixForEntry,
  groupOf,
  saveMuscleFix,
  subOf,
  useMuscleFixes,
} from '@/db/muscleFixes'
import type { CatalogEntry } from '@/db/catalog'
import type { MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS, MUSCLE_GROUP_BY_SIZE } from '@/db/types'
import { useBasket } from '@/state/builderBasket'
import { BottomSheet, Button, toast } from '@/components/ui'

/**
 * תיקון שורה ברשימת התרגילים — השם, קבוצת השריר וראש השריר.
 *
 * שלושת הערכים האלה חולקים תכונה אחת: הם *מזהים* את התרגיל ברשימה, וכל
 * אחד מהם יכול להיות פשוט שגוי. השם מגיע מהמניפסט המג׳ונרט או מרשומה ותיקה,
 * הקבוצה מהמניפסט, וראש השריר נגזר מכרטיס השרירים (השריר בעל האחוז הגבוה
 * ביותר בקבוצה). עד כאן טעות באחד מהם הייתה סופית.
 *
 * מה שבכוונה *לא* כאן וחי ב`QuickEditSheet` ובעורך המלא: סטים, חזרות, מנוחה,
 * ציוד ואופן משקל. אלה פרמטרים של אימון ולא של זהות — הם נערכים תוך כדי
 * בנייה של אימון, לא תוך כדי סידור הרשימה, ושני גיליונות קצרים עדיפים על
 * אחד שגולל.
 *
 * הראשים מוצגים עם הכרטיס האנטומי שלהם ולא כטקסט: השאלה "רגע, מה זה חזה
 * עליון" עולה בדיוק ברגע הבחירה, ותשובה שדורשת לסגור את הגיליון כדי לחפש
 * אותה היא תשובה שלא תינתן. אותו ריבוע ומאותו מקור כמו בכותרות הרשימה.
 *
 * הראש שנגזר מהכרטיס מסומן "מהכרטיס", ובחירה *בו* אינה שומרת תיקון אלא
 * מוחקת אותו — כך שהשורה חוזרת להיות תלויה בכרטיס ולא בערך קפוא שיישאר
 * מאחור כשהכרטיס יוחלף. הנימוק המלא של החלוקה בין הרשומה לשכבה יושב
 * ב-`db/muscleFixes.ts`.
 */

export interface FixEntrySheetProps {
  /** null = סגור */
  entry: CatalogEntry | null
  onClose: () => void
}

export function FixEntrySheet({ entry, onClose }: FixEntrySheetProps): JSX.Element {
  const fixes = useMuscleFixes()
  const renameInBasket = useBasket((s) => s.renameItem)
  const [name, setName] = useState('')
  const [group, setGroup] = useState<MuscleGroup>('chest')
  const [sub, setSub] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const current = entry ? groupOf(entry, fixes) : null
  const currentSub = entry && current ? subOf(entry, current, fixes) : null
  const hasFix = entry ? fixForEntry(entry, fixes) !== null : false

  // טיוטה מקומית שמאופסת בכל פתיחה — הגיליון לא כותב כלום עד "שמור"
  useEffect(() => {
    if (!entry) return
    const g = groupOf(entry, fixes)
    setName(entry.name)
    setGroup(g)
    setSub(subOf(entry, g, fixes))
    // מכוון: רק פתיחה מאפסת. תלות ב-fixes הייתה דורסת את הבחירה תוך כדי.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry])

  /** מה הכרטיס אומר על הקבוצה שנבחרה כרגע — משתנה עם החלפת קבוצה */
  const derived = entry
    ? subTargetFor(entry.exercise?.id ?? entry.id, group, entry.exercise?.libraryId)
    : null

  /*
    החלפת קבוצה מאפסת את הראש למה שהכרטיס אומר על הקבוצה החדשה. ראש של קבוצה
    אחרת ("חזה עליון" תחת יד אחורית) אינו בחירה תקפה — הכותרת הייתה שייכת
    למסך אחר מזה שהיא מופיעה בו.
  */
  const pickGroup = (next: MuscleGroup): void => {
    setGroup(next)
    if (!entry) return
    setSub(subTargetFor(entry.exercise?.id ?? entry.id, next, entry.exercise?.libraryId))
  }

  const renamed = entry !== null && name.trim() !== entry.name
  const dirty = entry !== null && (renamed || group !== current || sub !== currentSub)
  /** הקבוצה תיכתב לרשומה עצמה, כלומר גם לנפח ולחימום — וזה מה שצריך להיאמר */
  const movesData = entry?.exercise != null && group !== current
  /** שינוי שם לשורת מאגר חייב כרטיס — אין מניפסט שאפשר לכתוב אליו */
  const willAdopt = entry?.exercise == null && renamed

  const save = async (): Promise<void> => {
    if (!entry || busy) return
    const clean = name.trim()
    if (!clean) {
      toast('צריך לתת לתרגיל שם', { tone: 'warn' })
      return
    }
    setBusy(true)
    try {
      /*
        השיוך קודם, והסדר הזה הוא מה שמאפשר לשורת מאגר לקבל את שניהם בפעולה
        אחת: `saveMuscleFix` מניח את התיקון בשכבה, ו-`addFromLibrary` הוא זה
        שמעביר אותו לכרטיס שהוא יוצר. הפוך — הכרטיס היה נוצר עם הקבוצה
        שבמניפסט, ואז גובר עליה לנצח.
      */
      await saveMuscleFix(entry, { group, sub })

      if (entry.exercise) {
        if (renamed) {
          await renameExercise(entry.exercise.id, clean)
          // הסל שומר תצלום שם — בלי הרענון הגלולה הייתה מציגה את השם הישן
          renameInBasket(entry.exercise.id, clean)
        }
      } else if (renamed && entry.library) {
        const { exercise } = await addFromLibrary(entry.library)
        await renameExercise(exercise.id, clean)
      }

      toast(
        willAdopt
          ? `${clean} נוסף לתרגילים שלך`
          : `${clean} — ${MUSCLE_GROUPS[group].label}${sub ? ` · ${sub}` : ''}`,
        { tone: 'success' }
      )
      onClose()
    } catch {
      toast('לא הצלחתי לשמור', { tone: 'warn' })
    } finally {
      setBusy(false)
    }
  }

  const reset = async (): Promise<void> => {
    if (!entry || busy) return
    setBusy(true)
    try {
      await clearMuscleFix(entry)
      toast('השיוך חזר למה שנגזר מהכרטיס')
      onClose()
    } catch {
      toast('לא הצלחתי לבטל את התיקון', { tone: 'warn' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={entry !== null} onClose={onClose} title={entry?.name ?? ''}>
      {entry ? (
        <div key={entry.id} className="flex flex-col gap-4">
          <label className="block">
            <span className="meta mb-1.5 block px-1">שם התרגיל</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full rounded-xl border border-ink-700 bg-ink-850 px-4 text-bone-50 placeholder:text-bone-500 focus:border-flame-500/50 focus:outline-none"
            />
          </label>

          <div>
            <p className="meta mb-2 px-1">קבוצת שריר</p>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUP_BY_SIZE.map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={group === g}
                  onClick={() => pickGroup(g)}
                  className={[
                    'min-h-11 rounded-pill border px-3.5 text-sm font-bold transition-colors',
                    group === g
                      ? 'border-flame-500 bg-flame-500 text-ink-950'
                      : 'border-ink-700 bg-ink-850 text-bone-300 active:bg-ink-800',
                  ].join(' ')}
                >
                  {MUSCLE_GROUPS[g].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="meta mb-2 px-1">ראש השריר</p>
            <div className="flex flex-col gap-1">
              {SUBS_BY_GROUP[group].map((option) => {
                const card = muscleCardFor(option)
                const on = sub === option
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSub(on ? null : option)}
                    className={[
                      'flex min-h-12 items-center gap-2.5 rounded-xl border px-2.5 text-start transition-colors',
                      on
                        ? 'border-flame-500/50 bg-flame-500/12'
                        : 'border-transparent active:bg-ink-800',
                    ].join(' ')}
                  >
                    {card ? (
                      <img
                        src={assetUrl(card.thumb)}
                        alt=""
                        className="size-8 shrink-0 rounded-md border border-ink-700 bg-bone-50 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="size-8 shrink-0" />
                    )}
                    <span
                      className={[
                        'min-w-0 flex-1 truncate text-sm font-bold',
                        on ? 'text-flame-300' : 'text-bone-200',
                      ].join(' ')}
                    >
                      {option}
                    </span>
                    {option === derived ? <span className="meta shrink-0">מהכרטיס</span> : null}
                  </button>
                )
              })}
            </div>
          </div>

          {/*
            שתי ההשלכות שאסור להן לקרות בלי שנאמרו. שתיהן מוצגות רק כשהן
            באמת עומדות לקרות — הערה קבועה על כל פתיחה היא רעש שנקרא פעם אחת.
          */}
          {movesData ? (
            <p className="rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-xs leading-relaxed text-bone-400">
              שינוי הקבוצה נכתב לתרגיל עצמו — הוא ישנה גם את גרף הנפח, את סטי החימום ואת
              מועמדי ההחלפה באימון.
            </p>
          ) : null}

          {willAdopt ? (
            <p className="rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-xs leading-relaxed text-bone-400">
              לתרגיל מהמאגר אין רשומה משלו לשמור בה שם — השמירה תוסיף אותו לתרגילים שלך,
              עם השם החדש.
            </p>
          ) : null}

          <Button size="lg" fullWidth disabled={!dirty} loading={busy} onClick={() => void save()}>
            שמור
          </Button>

          {hasFix ? (
            <button
              type="button"
              onClick={() => void reset()}
              className="-mt-2 mb-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-2 text-sm font-bold text-bone-400 active:bg-ink-800"
            >
              <RotateCcw size={16} className="text-bone-500" />
              בטל את תיקון השיוך
            </button>
          ) : null}
        </div>
      ) : null}
    </BottomSheet>
  )
}
