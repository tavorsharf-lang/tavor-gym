import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, EyeOff, MoreVertical, Plus, Search, X } from 'lucide-react'
import { getCatalogEntries, isMine } from '@/db/catalog'
import type { CatalogEntry } from '@/db/catalog'
import { getLastPerformedMap } from '@/db/queries'
import type { Equipment, Exercise, MuscleGroup } from '@/db/types'
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, MUSCLE_GROUP_BY_SIZE } from '@/db/types'
import { distinguisher, duplicateNames } from '@/domain/naming'
import {
  equipmentHidden,
  matchesEquipment,
  pctOfSub,
  sortedBy,
  touchesSub,
} from '@/domain/exerciseSort'
import type { SortState } from '@/domain/exerciseSort'
import { LAYOFF_DAYS } from '@/domain/recommendation'
import { formatSetShort } from '@/domain/units'
import { daysSince, formatRelativeDay } from '@/lib/dates'
import { normalize } from '@/lib/text'
import { useNow } from '@/hooks/useNow'
import { useBasket } from '@/state/builderBasket'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { EmptyState, IconButton, toast } from '@/components/ui'
import { ExerciseThumb } from '@/components/media/ExerciseThumb'
import { GroupCardButton } from '@/components/exercises/GroupCardButton'
import { SubTargetHeading } from '@/components/exercises/SubTargetHeading'
import { ListSortBar, SubScopeToggle } from '@/components/exercises/ListSortBar'
import {
  MuscleFilterChips,
  NO_MUSCLE_FILTER,
  resolveMuscleFilter,
} from '@/components/exercises/MuscleFilterChips'
import type { MuscleFilter } from '@/components/exercises/MuscleFilterChips'
import { groupOf, subOf, useMuscleFixes } from '@/db/muscleFixes'
import { VideoPlayer } from '@/components/media/VideoPlayer'
import { BasketBar } from '@/components/builder/BasketBar'
import { QuickEditSheet } from '@/components/exercises/QuickEditSheet'
import { isEntryHidden, unhideExercises, entryHiddenIds, useHiddenExerciseIds } from '@/db/hiddenExercises'

/**
 * בניית אימון — התרגילים של שריר אחד.
 *
 * הסדר הוא לב המסך: מה שלא בוצע מעולם קודם, ואחריו מהישן לחדש. זו בדיוק
 * הסיבה שנכנסים לכאן — לתפוס את התרגיל שנשכח — והמיון עושה את העבודה במקום
 * לדרוש סריקה של הרשימה.
 *
 * הרשימה כוללת גם את תרגילי המאגר שאין להם עדיין כרטיס. הם מסומנים, ובחירה
 * שלהם יוצרת להם כרטיס בשליחה (`ensureTrainable`) ולא כאן — כך לחיצה על שורה
 * לא כותבת למסד, והסל נשאר הפיך עד הרגע האחרון.
 */

function isMuscleGroup(value: string | undefined): value is MuscleGroup {
  return value !== undefined && (MUSCLE_GROUP_BY_SIZE as string[]).includes(value)
}

/** מה שממיין: מעולם קודם, אחר כך מהישן לחדש */
function stalenessOf(entry: CatalogEntry, lastAt: ReadonlyMap<string, number>): number {
  const at = entry.exercise ? lastAt.get(entry.exercise.id) : undefined
  return at ?? -Infinity
}

export function BuilderMuscleScreen(): JSX.Element {
  const { muscleGroup } = useParams<{ muscleGroup: string }>()
  const now = useNow()
  const [query, setQuery] = useState('')
  /*
    "שלי" הוא ברירת המחדל, ולא "הכל" כפי שהיה כאן עד עכשיו.

    הרשימה הזו הייתה מערבבת 28 תרגילים שיש להם היסטוריה ומשקלים עם 48 רשומות
    לימוד, בלי שום דרך להפריד — ובחדר כושר, מול מכונה, השאלה כמעט תמיד היא
    "מה אני עושה על השריר הזה" ולא "מה קיים בעולם". המתג הוא אותו מתג של מסך
    התרגילים, באותה סמנטיקה: `isActive` הוא "בתרגילים שלי".
  */
  const [mode, setMode] = useState<'mine' | 'all'>('mine')
  /*
    סינון לפי תת-שריר. אין כאן רמת קבוצות — הקבוצה נבחרה בניווט לתוך המסך —
    ולכן זו הרמה השנייה של אותה שורה בדיוק שבמסך התרגילים ובבורר.
  */
  const [filter, setFilter] = useState<MuscleFilter>(NO_MUSCLE_FILTER)
  /*
    מיון וסינון. ברירת המחדל היא `default`, כלומר בדיוק הסדר שהמסך הזה נבנה
    עליו — "הכי מזמן שלא עשית" — ולכן פתיחת המסך נראית כמו שהיא נראתה תמיד.
    שאר המיונים הם מה שנוסף, לא מה שהחליף.
  */
  const [sort, setSort] = useState<SortState>({ key: 'default', desc: true })
  const [equipment, setEquipment] = useState<ReadonlySet<Equipment>>(new Set())
  /*
    ‏`touching` פורש את הרשימה לכל מי שהכרטיס שלו מזכיר את תת-השריר, גם מחוץ
    לקבוצה שנכנסנו אליה: "כתף אחורית" מקבלת גם חתירות שיושבות תחת גב. זו
    היציאה היחידה מהקבוצה במסך הזה, והיא תמיד מפורשת ובלחיצה.
  */
  const [scope, setScope] = useState<'primary' | 'touching'>('primary')
  /*
    נגן אחד לכל המסך, לא אחד לשורה: VideoPlayer מריץ שני מנויים גם כשהוא
    סגור, ורשימת שריר יכולה להגיע לתריסר שורות. אותו דפוס כמו מסך התרגילים.
  */
  const [playing, setPlaying] = useState<CatalogEntry | null>(null)
  const [editing, setEditing] = useState<CatalogEntry | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  // null = עוד לא נטען; מתייחסים כטעינה כדי ששורה מוסתרת לא תבליח
  const hidden = useHiddenExerciseIds()
  // תיקוני שיוך השריר — אותה שכבה שמזיזה שורות במסך התרגילים, וכאן היא
  // חייבת לחול באותה מידה: אחרת אותו תרגיל יושב תחת שתי כותרות שונות
  const fixes = useMuscleFixes()

  const entries = useLiveQuery(() => getCatalogEntries(), [], [] as CatalogEntry[])
  // פעם אחת לרשימה — הפונקציה סורקת את כל טבלת הסטים
  const lastPerformed = useLiveQuery(() => getLastPerformedMap(), [], new Map())

  const items = useBasket((s) => s.items)
  const toggle = useBasket((s) => s.toggle)

  const group = isMuscleGroup(muscleGroup) ? muscleGroup : null

  const catalogExercises = useMemo(
    () => entries.map((e) => e.exercise).filter((e): e is Exercise => e !== null),
    [entries]
  )
  const duplicates = useMemo(() => duplicateNames(catalogExercises), [catalogExercises])

  const { list, hiddenList, otherModeHits, noEquipment } = useMemo(() => {
    if (!group) return { list: [], hiddenList: [], otherModeHits: 0, noEquipment: 0 }
    const q = normalize(query)
    const lastAt = new Map([...lastPerformed].map(([id, l]) => [id, l.at]))
    /*
      סינון הציוד חל **לפני** החלוקה לתת-שרירים ולפני `filterOptions`, ולא
      אחריהם: הוא מצמצם את הרשימה בדיוק כמו החיפוש, וצ׳יפ שנספר על רשימה
      רחבה יותר ממה שבאמת מוצג היה מבטיח מספר שאין לו כיסוי.
    */
    const found = entries
      .filter((e) => groupOf(e, fixes) === group)
      .filter(
        (e) =>
          !q ||
          normalize(e.name).includes(q) ||
          normalize(e.nameEn ?? '').includes(q) ||
          normalize(e.exercise?.subTarget ?? '').includes(q)
      )
    const inGroup = found
      .filter((e) => matchesEquipment(e, equipment))
      .sort(
        (a, b) =>
          stalenessOf(a, lastAt) - stalenessOf(b, lastAt) || a.name.localeCompare(b.name, 'he')
      )
    const matches = mode === 'mine' ? inGroup.filter(isMine) : inGroup
    /*
      עד שרשימת ההסתרות נטענת הכל נחשב מוסתר-פוטנציאלית ולכן לא מוצג —
      ההפך היה מבליח שורות מוסתרות ומעלים אותן פריים אחר-כך, בדיוק הקפיצה
      ש-useScrollMemory נלחם בה. בפועל App.tsx מחמם את הרשימה ב-boot.
    */
    if (hidden === null) return { list: [], hiddenList: [], otherModeHits: 0, noEquipment: 0 }
    /*
      מקטע "מוסתרים" נגזר מ-`inGroup` ולא מ-`matches` — כלומר הוא **לא** מסונן
      לפי המתג.

      זה המקום היחיד בכל האפליקציה שמחזיר תרגיל שהוסתר. אילו הוא היה יורש את
      מצב "שלי", שורת מאגר שהוסתרה הייתה נעלמת משם לחלוטין: היא אינה ב"שלי"
      מעצם הגדרתה, ולכן לא הייתה לה שום דרך לחזור. ההסתרה תמיד הפיכה, בלי קשר
      לאיזה צד של המתג עומדים.
    */
    const shownIn = (m: 'mine' | 'all'): CatalogEntry[] =>
      (m === 'mine' ? inGroup.filter(isMine) : inGroup).filter((e) => !isEntryHidden(e, hidden))
    return {
      list: matches.filter((e) => !isEntryHidden(e, hidden)),
      hiddenList: inGroup.filter((e) => isEntryHidden(e, hidden)),
      // מה שבאמת יופיע בצד השני — אחרי ההסתרה, אחרת ההצעה מבטיחה שורות שאין
      otherModeHits: shownIn(mode === 'mine' ? 'all' : 'mine').length,
      // שורות שנפלו רק מפני שאין להן סיווג ציוד — נאמרות ולא נעלמות
      noEquipment: equipmentHidden(found, equipment),
    }
  }, [entries, group, lastPerformed, query, hidden, mode, fixes, equipment])

  /** מיפוי הזמן האחרון לפי מזהה — המיון לפי "לאחרונה" קורא אותו, לא את המשקל */
  const lastAt = useMemo(
    () => new Map([...lastPerformed].map(([id, l]) => [id, l.at as number])),
    [lastPerformed]
  )

  /*
    חלוקה לתת-קטגוריות, וכל מקטע ממוין בפני עצמו.

    זו האפשרות הראשונה מהשתיים: הכותרות נשארות, ובתוך "ארבע-ראשי" הסדר הוא
    לפי האחוז על ארבע-ראשי דווקא. לכן העוגן של המיון הוא ה-sub של המקטע ולא
    בחירה גלובלית — אותה רשימה עונה על ארבע שאלות שונות בו-זמנית, כל אחת
    בכותרת שלה.

    ‏`default` שומר על סדר `list`, שכבר ממוין לפי "הכי מזמן שלא עשית": העברה
    של הסדר הזה כמשווה אינדקסים היא מה שמונע ממנו להתפרק בחלוקה לדליים.
  */
  const sections = useMemo(() => {
    if (!group) return []
    const order = new Map(list.map((entry, i) => [entry.id, i]))
    const byListOrder = (a: CatalogEntry, b: CatalogEntry): number =>
      (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)

    const bySub = new Map<string, typeof list>()
    for (const entry of list) {
      const sub = subOf(entry, group, fixes) ?? 'אחר'
      const bucket = bySub.get(sub)
      if (bucket) bucket.push(entry)
      else bySub.set(sub, [entry])
    }
    return [...bySub.entries()]
      .sort((a, b) => (a[0] === 'אחר' ? 1 : b[0] === 'אחר' ? -1 : b[1].length - a[1].length))
      .map(([sub, items]) => ({
        sub,
        items: sortedBy(items, sort, {
          sub: sub === 'אחר' ? null : sub,
          lastAt,
          fallback: byListOrder,
        }),
      }))
  }, [list, group, fixes, sort, lastAt])

  const filterOptions = useMemo(
    () =>
      group
        ? [
            {
              group,
              count: list.length,
              subs: sections
                .filter(({ sub }) => sub !== 'אחר')
                .map(({ sub, items }) => ({ sub, count: items.length })),
            },
          ]
        : [],
    [group, list, sections]
  )

  /*
    הצ׳יפ נשאר לחוץ רק כל עוד הוא קיים: החיפוש והמתג מזיזים את הרשימה מתחתיו,
    ובחירה שנשארה תלויה על תת-שריר שהתרוקן הייתה מרוקנת את המסך בלי להסביר.
    הקבוצה עצמה תמיד ברשימה — היא הניווט — ולכן רק התת-שריר יכול ליפול.
  */
  const active = useMemo(
    () => resolveMuscleFilter(filterOptions, { group, sub: filter.sub }),
    [filterOptions, group, filter.sub]
  )

  const visible = useMemo(
    () => (active.sub ? sections.filter((x) => x.sub === active.sub) : sections),
    [sections, active.sub]
  )

  /*
    האפשרות השנייה: כל מי שנוגע בתת-השריר, גם אם הוא לא הראש שלו וגם אם הוא
    יושב בקבוצה אחרת. "כתף אחורית" מחזירה כאן גם את החתירות שמסווגות תחת גב,
    ו-45% ארבע-ראשי של הסקוואט מפסיקים להיות מוסתרים תחת הכותרת "עכוז גדול".

    נבנה תמיד ולא רק כשהמתג דלוק, כי המספר על המתג הוא חלק מהשאלה — "יש עוד
    שבעה שנוגעים" הוא מה שמזמין ללחוץ. החישוב הוא סריקה של תשעים שורות מול
    מפה בזיכרון.
  */
  const touching = useMemo(() => {
    if (!active.sub || hidden === null) return []
    const q = normalize(query)
    const pool = entries
      .filter(
        (e) =>
          !q ||
          normalize(e.name).includes(q) ||
          normalize(e.nameEn ?? '').includes(q) ||
          normalize(e.exercise?.subTarget ?? '').includes(q)
      )
      .filter((e) => matchesEquipment(e, equipment))
      .filter((e) => (mode === 'mine' ? isMine(e) : true))
      .filter((e) => !isEntryHidden(e, hidden))
      .filter((e) => touchesSub(e, active.sub as string))
    /*
      ‏`default` הוא סדר של מסך קבוצה, ולרשימה חוצת-קבוצות אין אותו. הכניסה
      למתג היא בדיוק השאלה "מי הכי מעמיס", ולכן היא נופלת לאחוז.
    */
    const effective = sort.key === 'default' ? ({ key: 'pct', desc: true } as const) : sort
    return sortedBy(pool, effective, { sub: active.sub, lastAt })
  }, [entries, active.sub, hidden, query, equipment, mode, sort, lastAt])

  /* מתג שנשאר דלוק אחרי שהסינון התרוקן היה מציג רשימה ריקה בלי הסבר */
  const wide = scope === 'touching' && active.sub !== null

  if (!group) return <Navigate to="/builder" replace />


  const selected = new Set(items.map((i) => i.id))

  return (
    <Screen dock={false}>
      <ScreenHeader
        title={MUSCLE_GROUPS[group].label}
        subtitle="הכי מזמן שלא עשית — למעלה"
        fallback="/builder"
        action={<GroupCardButton group={group} />}
      />

      {/*
        אותו מתג, אותה סמנטיקה ואותה צורה כמו במסך התרגילים — ובכוונה. שני
        פקדים שנראים אותו דבר ומתנהגים אותו דבר הם פקד אחד שהמשתמש לומד פעם.
      */}
      <div
        role="group"
        aria-label="אילו תרגילים להציג"
        className="mb-4 flex gap-1 rounded-pill border border-ink-700 bg-ink-900 p-1"
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

      <div className="relative mb-5">
        <Search
          size={18}
          className="pointer-events-none absolute inset-y-0 my-auto text-bone-600"
          style={{ insetInlineStart: '0.875rem' }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`חיפוש בתרגילי ${MUSCLE_GROUPS[group].label}`}
          aria-label="חיפוש תרגיל"
          className="h-13 w-full rounded-card border border-ink-700 bg-ink-900/70 pe-4 ps-11 text-bone-50 outline-none transition-colors placeholder:text-bone-500 focus:border-flame-500/60"
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

      {/* סינון לפי תת-שריר בתוך הקבוצה */}
      {list.length > 0 ? (
        <MuscleFilterChips options={filterOptions} value={active} onChange={setFilter} fixed />
      ) : null}

      {/*
        שורת המיון **לא** מותנית ברשימה, בניגוד לצ׳יפים.

        הצ׳יפים מרפאים את עצמם — `resolveMuscleFilter` מוותר על בחירה שהתרוקנה
        — אבל סינון ציוד לא. סינון שמרוקן את הרשימה לגמרי היה מעלים יחד איתה
        את הכפתור היחיד שמבטל אותו, והמסך היה נתקע ריק עד שיוצאים ממנו.
      */}
      <ListSortBar
        sort={sort}
        onSort={setSort}
        equipment={equipment}
        onEquipment={setEquipment}
        hiddenNoEquipment={noEquipment}
      />

      {active.sub ? (
        <SubScopeToggle
          sub={active.sub}
          scope={scope}
          onScope={setScope}
          primaryCount={visible.reduce((n, x) => n + x.items.length, 0)}
          touchingCount={touching.length}
        />
      ) : null}

      {list.length === 0 ? (
        <EmptyState
          title={mode === 'mine' ? 'לא נמצא בתרגילים שלך' : 'לא נמצא תרגיל'}
          hint={
            mode === 'mine' && otherModeHits > 0
              ? `יש ${otherModeHits} תרגילים ל${MUSCLE_GROUPS[group].label}${
                  query ? ` שמתאימים ל"${query}"` : ''
                } — הם פשוט לא בתרגילים שלך.`
              : query
                ? `אין תרגיל ל${MUSCLE_GROUPS[group].label} שמתאים ל"${query}".`
                : `אין עדיין תרגילים ל${MUSCLE_GROUPS[group].label}. אפשר להוסיף במסך התרגילים.`
          }
          action={
            mode === 'mine' && otherModeHits > 0 ? (
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
      ) : wide ? (
        /*
          התצוגה הרחבה: רשימה שטוחה, בלי כותרות תת-שריר. הקיבוץ הוא בדיוק מה
          שהמתג ביטל — כל השורות כאן עונות על אותה שאלה אחת, וההבדל ביניהן הוא
          המספר.
        */
        <div>
          <p className="meta mb-2 px-1">
            כל התרגילים שהכרטיס שלהם מזכיר {active.sub} — כולל מקבוצות אחרות
          </p>
          {touching.length === 0 ? (
            <p className="card px-4 py-5 text-center text-sm font-semibold text-bone-400">
              אין תרגיל שנוגע ב{active.sub} במה שמוצג כרגע.
            </p>
          ) : (
            <ul className="card divide-y divide-ink-800/70 overflow-hidden">
              {touching.map((entry) => (
                <li key={entry.id}>
                  <ExerciseRow
                    entry={entry}
                    duplicates={duplicates}
                    last={entry.exercise ? lastPerformed.get(entry.exercise.id) : undefined}
                    now={now}
                    pct={pctOfSub(entry, active.sub as string)}
                    picked={selected.has(entry.id)}
                    onToggle={() =>
                      toggle({
                        id: entry.id,
                        name: entry.name,
                        muscleGroup: entry.muscleGroup,
                        needsCatalogEntry: entry.exercise === null,
                      })
                    }
                    onPlay={() => setPlaying(entry)}
                    onEdit={() => setEditing(entry)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(({ sub, items }) => (
            <div key={sub}>
              {/*
                כותרת תת-קטגוריה, מאותו מקור בדיוק כמו במסך התרגילים: השריר
                בעל האחוז הגבוה בכרטיס, מתוך הקבוצה של התרגיל. מוצגת רק כשיש
                יותר מאחת — כותרת יחידה הייתה חוזרת על שם הקבוצה שבראש המסך.
              */}
              {visible.length > 1 ? <SubTargetHeading sub={sub} count={items.length} /> : null}
              <ul className="card divide-y divide-ink-800/70 overflow-hidden">
          {items.map((entry) => (
            <li key={entry.id}>
              <ExerciseRow
                entry={entry}
                duplicates={duplicates}
                last={entry.exercise ? lastPerformed.get(entry.exercise.id) : undefined}
                now={now}
                /* המספר מופיע רק כשהוא מה שקובע את הסדר — אחרת הוא רעש */
                pct={sort.key === 'pct' && sub !== 'אחר' ? pctOfSub(entry, sub) : undefined}
                picked={selected.has(entry.id)}
                onToggle={() =>
                  toggle({
                    id: entry.id,
                    name: entry.name,
                    muscleGroup: entry.muscleGroup,
                    needsCatalogEntry: entry.exercise === null,
                  })
                }
                onPlay={() => setPlaying(entry)}
                onEdit={() => setEditing(entry)}
              />
            </li>
          ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {hiddenList.length > 0 ? (
        <section className="mt-5 mb-2">
          {/*
            השחזור איפה שהסתרת. נפתח לבד כשחיפוש מתאים לשורה מוסתרת — תרגיל
            מוסתר תמיד ניתן למציאה בשם, גם אם שכחת שהסתרת אותו.
          */}
          <button
            type="button"
            aria-expanded={showHidden || query.length > 0}
            onClick={() => setShowHidden((v) => !v)}
            className="meta flex min-h-12 w-full items-center justify-between rounded-xl px-2 active:bg-ink-800"
          >
            <span>מוסתרים ({hiddenList.length})</span>
            <span aria-hidden="true">{showHidden || query.length > 0 ? '−' : '+'}</span>
          </button>
          {showHidden || query.length > 0 ? (
            <ul className="card divide-y divide-ink-800/70 overflow-hidden">
              {hiddenList.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() =>
                      void unhideExercises(entryHiddenIds(entry)).then(() =>
                        toast(`${entry.name} הוחזר לרשימה`)
                      )
                    }
                    className="flex min-h-12 w-full items-center gap-3 p-3 text-start opacity-60 transition-colors active:bg-ink-800 active:opacity-100"
                  >
                    <EyeOff size={16} className="shrink-0 text-bone-500" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-bone-200">
                      {entry.name}
                    </span>
                    <span className="meta shrink-0">הקש להחזרה</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <BasketBar />

      <QuickEditSheet entry={editing} onClose={() => setEditing(null)} />

      {playing ? (
        <VideoPlayer
          exerciseId={playing.exercise?.id ?? playing.id}
          libraryId={playing.exercise?.libraryId}
          exerciseName={playing.name}
          open
          startOnImage
          onClose={() => setPlaying(null)}
        />
      ) : null}
    </Screen>
  )
}

/**
 * שורת תרגיל — שלושה יעדי מגע, הבחירה שולטת.
 *
 * רוב שטח השורה הוא עדיין כפתור הבחירה לסל — ביד אחת, בזמן שהשנייה מחזיקה
 * משקולת. שני היוצאים היחידים יושבים בקצוות: התמונה פותחת את הסרטון מיד
 * (זו הדרך להבין מה התרגיל בלי לצאת מהבנייה), וה-⋯ פותח עריכה והסתרה.
 *
 * המבנה — עוטף div, כפתור בחירה flex-1, ושני פקדים אחים — הוא האנטומיה
 * שהוכחה במסך התרגילים: כפתור בתוך כפתור היה מפעיל את שני המטפלים בלחיצה
 * אחת, ו-jsdom לא תופס את זה (הטסט לוחץ על שם התרגיל, ורק בדפדפן אמיתי
 * שתי הפעולות יורות יחד). רקע הבחירה עבר לעוטף כדי שכל השורה תיקרא מסומנת.
 *
 * תווית ה-⋯ גנרית בכוונה — תווית עם שם התרגיל הייתה מכפילה את התוצאה של
 * findByRole לפי שם בטסטים של המסך.
 *
 * תג "הפסקה ארוכה" מופיע מעל שלושה שבועות, כי בדיוק מהשלב הזה מנוע ההמלצות
 * מתחיל להוריד את משקל הפתיחה. המסך הזה מכוון מטבעו לתרגילים הישנים ביותר,
 * ולכן זה המקום שבו האזהרה הזו הכי נדרשת.
 */
function ExerciseRow({
  entry,
  duplicates,
  last,
  now,
  pct,
  picked,
  onToggle,
  onPlay,
  onEdit,
}: {
  entry: CatalogEntry
  duplicates: ReadonlySet<string>
  last: { weightKg: number; reps: number; at: number; sets: number } | undefined
  now: number
  /**
   * כמה השורה עובדת על השריר שהרשימה ממוינת לפיו.
   *
   * שלושה מצבים ולא שניים, וזו ההבחנה שהמסך חי ממנה: `undefined` = הרשימה לא
   * ממוינת לפי אחוז ואין עמודה בכלל; `null` = ממוינת, ולשורה הזו אין נתון על
   * הכרטיס; מספר = האחוז עצמו. שורה בלי מספר בתוך רשימה של אחוזים נקראת כמו
   * אפס, ולכן היא אומרת "אין נתון" במפורש.
   */
  pct?: number | null
  picked: boolean
  onToggle: () => void
  onPlay: () => void
  onEdit: () => void
}): JSX.Element {
  const ex = entry.exercise
  const apart = ex ? distinguisher(ex, duplicates) : null
  const layoff = last !== undefined && daysSince(last.at, now) >= LAYOFF_DAYS
  const showPct = pct !== undefined

  return (
    <div className={['flex items-center', picked ? 'bg-flame-500/10' : ''].join(' ')}>
      {/* המזהים לפני ה-arrow props — הרגקס של workoutVideos.test נעצר ב-'>' הראשון */}
      <ExerciseThumb
        exerciseId={ex?.id ?? entry.id}
        libraryId={ex?.libraryId}
        size="sm"
        keepFrame
        onOpen={onPlay}
      />

      <button
        type="button"
        aria-pressed={picked}
        onClick={onToggle}
        className={[
          'flex min-w-0 flex-1 items-center gap-3 p-3 text-start transition-colors',
          picked ? '' : 'active:bg-ink-800',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors',
            picked
              ? 'border-flame-500/50 bg-flame-500/20 text-flame-300'
              : 'border-ink-700 text-bone-600',
          ].join(' ')}
        >
          {picked ? <Check size={16} /> : <Plus size={16} />}
        </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-bold text-bone-50">{entry.name}</span>
        <span className="meta mt-0.5 flex items-baseline gap-1.5">
          {apart ? <span className="shrink-0 font-bold text-bone-400">{apart}</span> : null}
          <span className="truncate">
            {ex
              ? `${ex.subTarget} · ${EQUIPMENT_LABELS[ex.equipment]}`
              : `${entry.library?.videos.length ?? 0} סרטוני הסבר · מהמאגר`}
          </span>
        </span>
      </span>

      {showPct ? (
        <span className="shrink-0 text-end">
          {pct === null ? (
            <span className="meta">אין נתון</span>
          ) : (
            <span className="tnum text-sm font-extrabold text-flame-400">{pct}%</span>
          )}
        </span>
      ) : null}

      <span className="shrink-0 text-end">
        {ex ? (
          last ? (
            <>
              <span dir="ltr" className="tnum block text-sm font-extrabold text-bone-200">
                {formatSetShort(last.weightKg, last.reps, ex.weightMode, ex.metric)}
              </span>
              <span
                className={['meta mt-0.5 block', layoff ? 'text-flame-300' : ''].join(' ')}
              >
                {formatRelativeDay(last.at, now)}
              </span>
            </>
          ) : (
            <span className="text-xs font-bold text-flame-300">עוד לא בוצע</span>
          )
        ) : (
          <span className="meta">חדש</span>
        )}
      </span>
      </button>

      <IconButton label="עריכה והסתרה" onClick={onEdit}>
        <MoreVertical size={18} />
      </IconButton>
    </div>
  )
}
