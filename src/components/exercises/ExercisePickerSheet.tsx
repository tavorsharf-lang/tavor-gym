import { useEffect, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Plus, Search, X } from 'lucide-react'
import { compareByName, compareEntries, getCatalogEntries } from '@/db/catalog'
import type { CatalogEntry } from '@/db/catalog'
import { getLastPerformedMap } from '@/db/queries'
import type { MuscleGroup } from '@/db/types'
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, MUSCLE_GROUP_BY_SIZE } from '@/db/types'
import { isEntryHidden, useHiddenExerciseIds } from '@/db/hiddenExercises'
import { groupOf, subOf, useMuscleFixes } from '@/db/muscleFixes'
import { formatRelativeDay } from '@/lib/dates'
import { normalize } from '@/lib/text'
import { formatSetShort } from '@/domain/units'
import { BottomSheet, EmptyState } from '@/components/ui'
import { ExerciseThumb } from '@/components/media/ExerciseThumb'
import { VideoPlayer } from '@/components/media/VideoPlayer'
import { GroupCardButton } from './GroupCardButton'
import { SubTargetHeading } from './SubTargetHeading'
import { MuscleFilterChips, NO_MUSCLE_FILTER, resolveMuscleFilter } from './MuscleFilterChips'
import type { MuscleFilter } from './MuscleFilterChips'

/**
 * בורר התרגילים — הרשימה המאוחדת בתוך גיליון.
 *
 * זו אותה רשימה של מסך התרגילים, באותם שני מצבים ובאותה סמנטיקה, בגיליון
 * שאפשר לפתוח מבלי לעזוב את המסך שמתחת. הסיבה שהיא קיימת: הבחירה "איזה תרגיל
 * עכשיו" עולה גם *באמצע* אימון, ושם אי אפשר לנווט למסך אחר — האימון הפעיל,
 * הטיימר והסטים שכבר תועדו חיים על המסך שמתחת.
 *
 * מה שהוא **לא** עושה: הוא לא כותב למסד. `onPick` מקבל שורה ומחליט מה לעשות
 * בה, וכך אותו בורר משרת גם "הוסף לתור האימון" וגם כל יעד אחר בעתיד.
 *
 * שלוש החלטות שמועתקות ממסך התרגילים במכוון, כי הן נלמדו שם בדם:
 *   • "הכל" הוא `getCatalogEntries()` המלא ולא `LIBRARY_CATALOG` — 14 מ-28
 *     תרגילי הזריעה אין להם מקבילה במאגר, ורשימה שמגיעה מהמאגר הייתה מעלימה
 *     אותם בדיוק במצב שנקרא "הכל".
 *   • המיון ב"הכל" אלפביתי ובלי שום תלות בחברות. `useLiveQuery` מרענן בכל
 *     כתיבה, והוספה שמזיזה את השורה מתחת לאצבע פירושה שהלחיצה הבאה ברצף
 *     נוחתת על תרגיל אחר.
 *   • הגיליון **לא נסגר** אחרי הוספה. חמש הוספות ברצף הן התרחיש, לא החריג.
 */

export interface ExercisePickerSheetProps {
  open: boolean
  onClose: () => void
  title: string
  /**
   * מזהי תרגיל שכבר נמצאים ביעד. השורה מסומנת ✓ ו**מושבתת**.
   *
   * עד כאן היא נשארה לחיצה, בנימוק שסופרסט וסבב שני הם בקשה לגיטימית. הם
   * לגיטימיים — אבל לא כשתי שורות בתור: הסטים היו מתפצלים בין שתיהן, ואיתם
   * גם ספירת הסטים של התרגיל וגם קריאת השיאים. סבב שני הוא עוד סט באותה
   * שורה, וזו יכולת שכבר קיימת במסך האימון.
   */
  inTarget: ReadonlySet<string>
  /** מוסיף. הגיליון נשאר פתוח בכל מקרה — הקורא מודיע בטוסט מה קרה. */
  onPick: (entry: CatalogEntry) => Promise<void>
  /** חיווי קטן ליד שם קבוצת השריר, למשל כיסוי השריר בימים האחרונים */
  groupNote?: (group: MuscleGroup) => ReactNode
  /** שורה קבועה בתחתית — היעד שאינו "עוד תרגיל", כמו הבונה המלא */
  footer?: ReactNode
}

/** "אחר" הוא הדלי של תרגיל בלי כרטיס שרירים, לא קטגוריה */
const OTHER = 'אחר'

export function ExercisePickerSheet({
  open,
  onClose,
  title,
  inTarget,
  onPick,
  groupNote,
  footer,
}: ExercisePickerSheetProps): JSX.Element {
  const [mode, setMode] = useState<'mine' | 'all'>('mine')
  const [query, setQuery] = useState('')
  /** הסינון בשורת הצ׳יפים: קבוצת שריר, ובתוכה תת-שריר. שניהם null = הכל. */
  const [filter, setFilter] = useState<MuscleFilter>(NO_MUSCLE_FILTER)
  /** השורה שהריבוע שלה נלחץ — הגלריה נפתחת על כרטיס השרירים שלה */
  const [gallery, setGallery] = useState<CatalogEntry | null>(null)
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set())

  const hidden = useHiddenExerciseIds()
  // אותה שכבת תיקונים כמו במסך התרגילים ובבונה — הבורר הוא אותה רשימה
  const fixes = useMuscleFixes()

  /*
    סגירה מנקה את החיפוש ואת הגלריה, אבל **לא** את המתג.

    הרכיב לא מתפרק בסגירה — `BottomSheet` מפסיק לרנדר, המצב נשאר — ולכן בלי
    האיפוס הזה פתיחה שנייה, עשרים דקות אחר כך, הייתה נפתחת על רשימה מסוננת
    לפי מילה שנשכחה. המצב לעומת זאת הוא העדפה ולא הקשר: מי שעבר ל"הכל"
    מתכוון לזה גם בפעם הבאה.
  */
  useEffect(() => {
    if (open) return
    setQuery('')
    setGallery(null)
    /*
      הסינון מתאפס עם החיפוש ולא נשמר כמו המתג: "עוד תרגיל לגב" הוא הקשר של
      הרגע הזה באימון, ופתיחה שנייה בעוד עשרים דקות היא כבר שאלה אחרת. גיליון
      שנפתח מסונן לקבוצה שנשכחה נראה בדיוק כמו גיליון שחסרים בו תרגילים.
    */
    setFilter(NO_MUSCLE_FILTER)
  }, [open])

  /*
    שתי השאילתות רצות רק כשהגיליון פתוח.

    `getLastPerformedMap` סורקת את כל טבלת הסטים, ואין שום סיבה שהיא תרוץ
    ברקע של מסך האימון כשהבורר סגור. אותו שער בדיוק שהיה על `picking`
    בגיליון סדר האימון, רק שעכשיו הוא על פתיחת הגיליון עצמו.
  */
  const entries = useLiveQuery(
    () => (open ? getCatalogEntries() : Promise.resolve([] as CatalogEntry[])),
    [open],
    [] as CatalogEntry[]
  )
  const lastPerformed = useLiveQuery(
    () => (open ? getLastPerformedMap() : Promise.resolve(new Map())),
    [open],
    new Map()
  )

  const q = normalize(query)

  const matches = (entry: CatalogEntry): boolean =>
    !q ||
    normalize(entry.name).includes(q) ||
    normalize(entry.nameEn ?? '').includes(q) ||
    normalize(entry.exercise?.subTarget ?? '').includes(q) ||
    normalize(MUSCLE_GROUPS[groupOf(entry, fixes)].label).includes(q)

  /*
    ההסתרה חלה על "שלי" בלבד, בדיוק כמו בבונה: היא אומרת "לעולם לא אעשה את
    זה", ולכן היא מנקה את הרשימה שממנה בוחרים. "הכל" נשאר מלא — הוא עוגן
    הניהול שלא משקר, וזו הדרך היחידה למצוא תרגיל שהוסתר בטעות.
  */
  const pool = useMemo(() => {
    if (mode === 'all') return entries
    if (hidden === null) return []
    return entries.filter((e) => e.state === 'mine' && !isEntryHidden(e, hidden))
  }, [entries, mode, hidden])

  const sections = useMemo(() => {
    const byGroup = new Map<MuscleGroup, CatalogEntry[]>()
    for (const entry of pool) {
      if (!matches(entry)) continue
      const group = groupOf(entry, fixes)
      const list = byGroup.get(group)
      if (list) list.push(entry)
      else byGroup.set(group, [entry])
    }
    return MUSCLE_GROUP_BY_SIZE.filter((g) => byGroup.has(g)).map((group) => {
      const list = (byGroup.get(group) ?? []).sort(
        mode === 'mine' ? compareEntries : compareByName
      )
      // תת-קטגוריות באותו סדר בדיוק שבו הרשימה כבר ממוינת, בלי מיון מחדש בתוכן
      const bySub = new Map<string, CatalogEntry[]>()
      for (const entry of list) {
        const sub = subOf(entry, group, fixes) ?? OTHER
        const bucket = bySub.get(sub)
        if (bucket) bucket.push(entry)
        else bySub.set(sub, [entry])
      }
      const subs = [...bySub.entries()]
        .sort((a, b) => (a[0] === OTHER ? 1 : b[0] === OTHER ? -1 : b[1].length - a[1].length))
        .map(([sub, items]) => ({ sub, items }))
      return { group, count: list.length, subs }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, mode, q, fixes])

  /*
    שורת הצ׳יפים — אותה שורה בדיוק כמו במסך התרגילים, ובכוונה: הבורר הזה הוא
    אותה רשימה, ומי שלמד לנווט בה שם לא צריך ללמוד אותה שוב באמצע אימון.
  */
  const filterOptions = useMemo(
    () =>
      sections.map(({ group, count, subs }) => ({
        group,
        count,
        subs: subs
          .filter(({ sub }) => sub !== OTHER)
          .map(({ sub, items }) => ({ sub, count: items.length })),
      })),
    [sections]
  )

  const active = useMemo(() => resolveMuscleFilter(filterOptions, filter), [filterOptions, filter])

  const visible = useMemo(
    () =>
      sections
        .filter(({ group }) => !active.group || group === active.group)
        .map(({ group, subs }) => {
          const kept = active.sub ? subs.filter((x) => x.sub === active.sub) : subs
          return { group, subs: kept, count: kept.reduce((n, x) => n + x.items.length, 0) }
        })
        .filter((s) => s.subs.length > 0),
    [sections, active]
  )

  /** יש כבר במה לצייר: הקטלוג חזר, ובמצב "שלי" גם רשימת ההסתרות */
  const ready = entries.length > 0 && (mode === 'all' || hidden !== null)

  const total = sections.reduce((n, s) => n + s.count, 0)
  /** כמה תוצאות מחכות בצד השני — מה שהופך "לא נמצא" להצעה ולא לקיר */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allHits = useMemo(() => entries.filter(matches).length, [entries, q, fixes])

  const pick = (entry: CatalogEntry): void => {
    if (busy.has(entry.id)) return
    setBusy((prev) => new Set(prev).add(entry.id))
    void onPick(entry).finally(() =>
      setBusy((prev) => {
        const next = new Set(prev)
        next.delete(entry.id)
        return next
      })
    )
  }

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title={title} maxHeightVh={92}>
      {/*
        aria-pressed ולא role=tab: אין כאן tabpanel ואין ניווט חצים. אותה צורה
        ואותו נימוק כמו במסך התרגילים, וזה מכוון — זה אותו מתג.
      */}
      <div
        role="group"
        aria-label="אילו תרגילים להציע"
        className="mb-3 flex gap-1 rounded-pill border border-ink-700 bg-ink-950 p-1"
      >
        {([
          { key: 'mine' as const, label: 'שלי' },
          { key: 'all' as const, label: 'הכל' },
        ]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={mode === tab.key}
            onClick={() => setMode(tab.key)}
            className={[
              'min-h-12 flex-1 rounded-pill text-sm font-bold transition-colors',
              mode === tab.key
                ? 'border border-flame-500/40 bg-flame-500/12 text-flame-300'
                : 'text-bone-400 active:bg-ink-800',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search
          size={18}
          className="pointer-events-none absolute inset-y-0 my-auto text-bone-600"
          style={{ insetInlineStart: '0.875rem' }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === 'mine' ? 'חיפוש בתרגילים שלי' : 'חיפוש בכל התרגילים'}
          aria-label="חיפוש תרגיל להוספה"
          className="h-13 w-full rounded-card border border-ink-700 bg-ink-950/70 pe-4 ps-11 text-bone-50 outline-none transition-colors placeholder:text-bone-500 focus:border-flame-500/60"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="נקה חיפוש"
            className="absolute inset-y-0 my-auto flex size-11 items-center justify-center rounded-full text-bone-500 active:bg-ink-800"
            style={{ insetInlineEnd: '0.5rem' }}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {/* סינון לפי שריר — קבוצות, ובתוך קבוצה תת-השרירים שלה */}
      {ready ? (
        <MuscleFilterChips options={filterOptions} value={active} onChange={setFilter} />
      ) : null}

      {!ready ? (
        /*
          שלד ולא "לא נמצא תרגיל".

          רשימת ההסתרות נטענת אסינכרונית, ובמצב "שלי" הכל נחשב מוסתר-פוטנציאלית
          עד שהיא חוזרת. בלי השלד הזה הגיליון נפתח על הודעת "אין תרגילים" ורק
          פריים אחר-כך מתמלא — כלומר משקר בדיוק ברגע הראשון שמסתכלים עליו.
        */
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card h-16 animate-pulse opacity-50" />
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState
          title="לא נמצא תרגיל"
          hint={
            mode === 'mine' && allHits > 0
              ? `יש ${allHits} תרגילים שמתאימים${query ? ` ל"${query}"` : ''} — הם פשוט לא בתרגילים שלך.`
              : query
                ? `אין תרגיל שמתאים ל"${query}" — לא אצלך ולא במאגר.`
                : 'אין תרגילים להציע כרגע.'
          }
          action={
            mode === 'mine' && allHits > 0 ? (
              <button
                type="button"
                onClick={() => setMode('all')}
                className="min-h-12 rounded-pill border border-flame-500/40 bg-flame-500/12 px-5 text-sm font-bold text-flame-300"
              >
                חפש בהכל
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {visible.map(({ group, count, subs }) => (
            <section key={group}>
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <div className="flex min-w-0 items-center gap-1">
                  <h3 className="text-sm font-extrabold text-bone-200">
                    {MUSCLE_GROUPS[group].label}
                  </h3>
                  {/* כרטיס הסקירה של הקבוצה — כל תת-השרירים שלה בתמונה אחת */}
                  <GroupCardButton group={group} />
                </div>
                <span className="meta tnum shrink-0">{groupNote?.(group) ?? count}</span>
              </div>

              <div className="space-y-3">
                {subs.map(({ sub, items }) => (
                  <div key={sub}>
                    {subs.length > 1 ? <SubTargetHeading sub={sub} count={items.length} /> : null}
                    <ul className="card divide-y divide-ink-800/70 overflow-hidden">
                      {items.map((entry) => (
                        <li key={entry.id}>
                          <PickerRow
                            entry={entry}
                            already={entry.exercise ? inTarget.has(entry.exercise.id) : false}
                            busy={busy.has(entry.id)}
                            last={entry.exercise ? lastPerformed.get(entry.exercise.id) : undefined}
                            onPick={() => pick(entry)}
                            onGallery={() => setGallery(entry)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {footer ? <div className="mt-6 mb-2">{footer}</div> : <div className="pb-4" />}
      </BottomSheet>

      {/*
        הנגן הוא **אח** של הגיליון ולא ילד שלו — אותה צורה כמו בגיליון ההחלפה.

        במקור זו הייתה הגנה על נעילת הגלילה: שני הרכיבים שמרו כל אחד לעצמו את
        ה-overflow הקודם, וסדר השחרור בעץ מקונן היה משאיר את הדף תקוע. זה כבר
        לא הנימוק — `lib/scrollLock.ts` פתר את זה מרכזית בספירת עומק, ושתי
        הצורות בטוחות היום.

        מה שנשאר, ובגללו הסידור לא חוזר לאחור: מחזור החיים של הנגן תלוי
        ב-`gallery` בלבד. כילד הוא היה מתפרק יחד עם תוכן הגיליון ברגע ש-`open`
        מתהפך, כלומר הגלריה הייתה נעלמת באמצע צפייה בכל מסלול שסוגר את
        הגיליון — ויש שניים כאלה, פעולת הטוסט וכפתור הבונה שבתחתית.
      */}
      {gallery ? (
        <VideoPlayer
          exerciseId={gallery.exercise?.id ?? gallery.id}
          libraryId={gallery.exercise?.libraryId ?? gallery.library?.id}
          exerciseName={gallery.name}
          open
          startOnImage
          onClose={() => setGallery(null)}
        />
      ) : null}
    </>
  )
}

/**
 * שורה אחת בבורר — שני יעדי מגע.
 *
 * הריבוע הוא כפתור **אח** ולא ילד של כפתור ההוספה, ומאותה סיבה שתועדה בשני
 * המסכים האחרים: כפתור מקונן היה מפעיל את שני המטפלים בלחיצה אחת, ו-jsdom לא
 * תופס את זה. הריבוע פותח את כרטיס השרירים ואת סרטוני ההסבר, וכל השאר מוסיף.
 */
function PickerRow({
  entry,
  already,
  busy,
  last,
  onPick,
  onGallery,
}: {
  entry: CatalogEntry
  already: boolean
  busy: boolean
  last: { weightKg: number; reps: number; at: number; sets: number } | undefined
  onPick: () => void
  onGallery: () => void
}): JSX.Element {
  const ex = entry.exercise
  const out = entry.state === 'removed' || entry.state === 'removedOwn'

  return (
    <div className={['flex items-center', out ? 'opacity-60' : ''].join(' ')}>
      {/* המזהים לפני שאר ה-props — הרגקס של workoutVideos.test נעצר ב-'>' הראשון */}
      <span className="shrink-0 ps-3">
        <ExerciseThumb
          exerciseId={ex?.id ?? entry.id}
          libraryId={ex?.libraryId ?? entry.library?.id}
          size="sm"
          keepFrame
          onOpen={onGallery}
        />
      </span>

      {/*
        מושבת ולא מוסתר: "כבר באימון" היא תשובה שהמשתמש בא לחפש, ושורה
        שנעלמת מהרשימה קוראים כ"התרגיל איננו" ומחפשים אותו שוב.
      */}
      <button
        type="button"
        disabled={busy || already}
        onClick={onPick}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 p-3 text-start transition-colors active:bg-ink-800 disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className={[
            'flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors',
            already
              ? 'border-flame-500/50 bg-flame-500/20 text-flame-300'
              : 'border-ink-700 text-bone-500',
          ].join(' ')}
        >
          {already ? <Check size={16} /> : <Plus size={16} />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-bold text-bone-50">
            {entry.name}
          </span>
          <span className="meta mt-0.5 block truncate">
            {ex
              ? `${ex.subTarget} · ${EQUIPMENT_LABELS[ex.equipment]}${out ? ' · לא בתרגילים שלי' : ''}`
              : `${entry.library?.videos.length ?? 0} סרטוני הסבר · מהמאגר`}
          </span>
        </span>

        <span className="shrink-0 text-end">
          {already ? (
            <span className="meta">כבר באימון</span>
          ) : ex && last ? (
            <>
              <span dir="ltr" className="tnum block text-sm font-extrabold text-bone-200">
                {formatSetShort(last.weightKg, last.reps, ex.weightMode, ex.metric)}
              </span>
              <span className="meta mt-0.5 block">{formatRelativeDay(last.at)}</span>
            </>
          ) : ex ? (
            <span className="meta">עוד לא בוצע</span>
          ) : (
            <span className="meta">חדש</span>
          )}
        </span>
      </button>
    </div>
  )
}
