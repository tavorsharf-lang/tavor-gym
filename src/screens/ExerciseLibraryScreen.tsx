import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Clapperboard, Minus, Plus, Search, X } from 'lucide-react'
import {
  addFromLibrary,
  compareByName,
  compareEntries,
  createBlankExercise,
  detachFromPlans,
  findPlanUsage,
  getCatalogEntries,
  removeFromMine,
  restoreToMine,
} from '@/db/catalog'
import type { CatalogEntry, PlanUsage } from '@/db/catalog'
import { getLastPerformedMap } from '@/db/queries'
import type { Equipment, Exercise, MuscleGroup } from '@/db/types'
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, MUSCLE_GROUP_BY_SIZE } from '@/db/types'
import { formatSetShort } from '@/domain/units'
import {
  equipmentHidden,
  matchesEquipment,
  pctOfSub,
  sortedBy,
  touchesSub,
} from '@/domain/exerciseSort'
import type { SortState } from '@/domain/exerciseSort'
import { distinguisher, duplicateNames } from '@/domain/naming'
import { formatRelativeDay } from '@/lib/dates'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { EmptyState, IconButton, toast } from '@/components/ui'
import { ExerciseThumb } from '@/components/media/ExerciseThumb'
import { VideoPlayer } from '@/components/media/VideoPlayer'
import { RemoveExerciseSheet } from '@/components/exercises/RemoveExerciseSheet'
import { SubTargetHeading } from '@/components/exercises/SubTargetHeading'
import { ListSortBar, SubScopeToggle } from '@/components/exercises/ListSortBar'
import { GroupCardButton } from '@/components/exercises/GroupCardButton'
import {
  MuscleFilterChips,
  NO_MUSCLE_FILTER,
  resolveMuscleFilter,
} from '@/components/exercises/MuscleFilterChips'
import type { MuscleFilter } from '@/components/exercises/MuscleFilterChips'
import { clipById } from '@/db/mediaDb'
import { useHiddenVideoIds } from '@/db/hiddenVideos'
import { groupContextId, useVideoPrefs } from '@/db/videoPrefs'
import { cancelScrollRestore } from '@/hooks/useScrollMemory'
import { normalize } from '@/lib/text'
import { groupOf, secondaryOf, subOf, useMuscleFixes } from '@/db/muscleFixes'
import { FixEntrySheet } from '@/components/exercises/FixEntrySheet'
import { useLongPress } from '@/hooks/useLongPress'

/**
 * מסך התרגילים — רשימה אחת, שני מצבים.
 *
 * עד כאן היו כאן שני מסכים: "כל התרגילים" (הקטלוג של תבור, עם משקלים
 * והיסטוריה) ו"מאגר תרגילים" (62 תרגילים מיוצר תוכן, ללימוד). הפיצול היה לפי
 * *מקור* — מי יצר את הרשומה — וזו הבחנה שמעניינת את מי שבנה את האפליקציה ולא
 * את מי שעומד מול מכונה. המתג כאן מפצל לפי *תפקיד*: מה אני מרים מול מה קיים.
 *
 * ‏`isActive` הוא "בתרגילים שלי". זו לא סמנטיקה חדשה — כל חמשת המקומות שבהם
 * הדגל משנה התנהגות כבר עשו בדיוק את זה. מה שהיה חסר הוא המקום שבו מציירים
 * שורה שאיננה שלי, וזה מצב "הכל".
 *
 * "הכל" הוא `getCatalogEntries()` המלא ולא `LIBRARY_CATALOG`, וזה הכרחי:
 * ל-14 מ-28 תרגילי הזריעה אין מקבילה במאגר, וגם לא לאף תרגיל שהמשתמש יצר.
 * לו המצב היה מרנדר את קטלוג המאגר, הוצאת "לחיצת שוק" הייתה מוחקת אותה
 * מהאפליקציה במקום להעביר אותה למצב אחר.
 *
 * מה שהמסך הזה *לא* עושה: הוא לא מכניס תרגילי מאגר ל-`db.exercises`. האיחוד
 * הוא של הקריאה בלבד, ולכן תרגיל לימוד לא יכול להגיע לבחירת תרגיל באימון או
 * לסטטיסטיקה. `catalog.ts` נושא את הנימוק המלא.
 */

export type ExercisesMode = 'mine' | 'all'

export function ExerciseLibraryScreen({
  initialMode = 'mine',
}: {
  initialMode?: ExercisesMode
} = {}): JSX.Element {
  const navigate = useNavigate()
  const [mode, setMode] = useState<ExercisesMode>(initialMode)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set())
  const [pending, setPending] = useState<{ entry: CatalogEntry; usage: PlanUsage[] } | null>(null)
  /** מדף הסרטונים של קבוצה שפתוח כרגע בנגן */
  const [playingGroup, setPlayingGroup] = useState<MuscleGroup | null>(null)
  /** השורה שהריבוע שלה נלחץ — הגלריה נפתחת על כרטיס השרירים שלה */
  const [gallery, setGallery] = useState<CatalogEntry | null>(null)
  /** הסינון בשורת הצ׳יפים: קבוצת שריר, ובתוכה תת-שריר. שניהם null = הכל. */
  const [filter, setFilter] = useState<MuscleFilter>(NO_MUSCLE_FILTER)
  /*
    מיון וסינון. ‏`default` הוא הסדר שהמסך הזה תמיד היה בו — סדר התוכנית
    ב"שלי", אלפביתי ב"הכל" — ולכן הפתיחה זהה למה שהייתה, והמיונים הם תוספת.
  */
  const [sort, setSort] = useState<SortState>({ key: 'default', desc: true })
  const [equipment, setEquipment] = useState<ReadonlySet<Equipment>>(new Set())
  const [scope, setScope] = useState<'primary' | 'touching'>('primary')
  /** השורה שנלחצה לחיצה ארוכה — גיליון התיקון נפתח עליה */
  const [fixing, setFixing] = useState<CatalogEntry | null>(null)

  /*
    תיקוני השיוך. הם נכנסים כאן ולא ב-`getCatalogEntries` בכוונה: השכבה היא
    תצוגה של הרשימה הזו ושל הבונה, ולא נתון של הקטלוג — הנפח, השיאים והחימום
    ממשיכים לקרוא את `Exercise.muscleGroup` בלבד, ולכן תיקון שנכתב לרשומה
    מגיע אליהם דרך המסד ותיקון של שורת מאגר לא נוגע בהם בכלל.
  */
  const fixes = useMuscleFixes()

  /*
    מדפי הסרטונים של קבוצות השריר: סרטון שהועבר אל `group:<שריר>` (מתוך פאנל
    הניהול בנגן) מופיע כאן, בכרטיס אחד בראש הקבוצה. הספירה סינכרונית לגמרי —
    ההעברות חיות בהגדרות, והאינדקס של המניפסטים בזיכרון — ולכן אין כאן שאילתה
    לכל קבוצה ואין קפיצת גובה שנלחמת בשחזור הגלילה.
  */
  const videoPrefs = useVideoPrefs()
  const hiddenVideos = useHiddenVideoIds()
  const shelfCounts = useMemo(() => {
    const counts = new Map<MuscleGroup, number>()
    for (const [assetId, target] of Object.entries(videoPrefs.moves)) {
      if (!target.startsWith('group:')) continue
      if (hiddenVideos.has(assetId)) continue
      // מזהה מצורף חייב להתקיים במניפסט הנוכחי; מזהה מיובא תמיד חי (מחיקה מנקה אותו)
      if (assetId.startsWith('bundled:') && !clipById(assetId)) continue
      const group = target.slice('group:'.length) as MuscleGroup
      counts.set(group, (counts.get(group) ?? 0) + 1)
    }
    return counts
  }, [videoPrefs, hiddenVideos])

  /*
    ערך התחלה [] ולא LIBRARY_CATALOG. `useLiveQuery` מחזיר undefined גם ל"טוען"
    וגם ל"אין תוצאה", ורשימה שמתחילה מהמאגר הייתה מציגה כפתור "הוסף" על תרגילים
    שכבר קיימים — בדיוק הבאג שהוליד את שער `linkKnown` במסך תרגיל המאגר.
    כאן זה מובטח מבנית: כפתור קיים רק על שורה שהגיעה מהמסד.
  */
  const entries = useLiveQuery(() => getCatalogEntries(), [], [] as CatalogEntry[])
  // פעם אחת לרשימה. הפונקציה סורקת את כל טבלת הסטים — קריאה לשורה הייתה אסון.
  const lastPerformed = useLiveQuery(() => getLastPerformedMap(), [], new Map())

  const catalogExercises = useMemo(
    () => entries.map((e) => e.exercise).filter((e): e is Exercise => e !== null),
    [entries]
  )
  // מחושב על כל הקטלוג ולא על תוצאות החיפוש — תרגיל לא משנה זהות לפי מה שהוקלד
  const duplicates = useMemo(() => duplicateNames(catalogExercises), [catalogExercises])

  /** מתי בוצע לאחרונה, לפי מזהה — מה שהמיון "לאחרונה" קורא */
  const lastAt = useMemo(
    () => new Map([...lastPerformed].map(([id, l]) => [id, l.at as number])),
    [lastPerformed]
  )

  const matches = (entry: CatalogEntry, q: string, group: MuscleGroup): boolean =>
    !q ||
    normalize(entry.name).includes(q) ||
    normalize(entry.nameEn ?? '').includes(q) ||
    normalize(entry.exercise?.subTarget ?? '').includes(q) ||
    // הקבוצה שאחרי תיקון, לא זו שבמניפסט — אחרת חיפוש "חזה" לא היה מוצא
    // שורה שהמשתמש בעצמו העביר לחזה
    normalize(MUSCLE_GROUPS[group].label).includes(q)

  const q = normalize(query)
  const mine = useMemo(() => entries.filter((e) => e.state === 'mine'), [entries])

  const groups = useMemo(() => {
    const source = mode === 'mine' ? mine : entries
    const byGroup = new Map<MuscleGroup, CatalogEntry[]>()
    for (const entry of source) {
      const group = groupOf(entry, fixes)
      if (!matches(entry, q, group)) continue
      /*
        סינון הציוד כאן ולא בשלב הציור: `filterOptions` נספר מהתוצאה, ו-
        `resolveMuscleFilter` מכריע לפיה. סינון מאוחר יותר היה משאיר צ׳יפ
        שמבטיח שבעה תרגילים ומוביל למקטע עם שניים.
      */
      if (!matchesEquipment(entry, equipment)) continue
      const list = byGroup.get(group)
      if (list) list.push(entry)
      else byGroup.set(group, [entry])
    }
    return MUSCLE_GROUP_BY_SIZE.filter((g) => byGroup.has(g)).map((group) => ({
      group,
      /*
        "שלי" ממוין לפי סדר הקטלוג — הוא רשימת התוכנית. "הכל" ממוין אלפביתית
        בלי שום תלות בחברות, כי `useLiveQuery` מרענן את הרשימה בכל כתיבה:
        מיון "שלי קודם" היה מזיז את השורה מתחת לאצבע ברגע ההוספה, כלומר
        הלחיצה הבאה ברצף נוחתת על תרגיל אחר.
      */
      list: (byGroup.get(group) ?? []).sort(mode === 'mine' ? compareEntries : compareByName),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, mine, mode, q, fixes, equipment])

  /*
    חלוקה לתת-קטגוריות לפי כרטיס השרירים.

    התת-קטגוריה נגזרת ולא נשמרת: היא תמיד השריר בעל האחוז הגבוה ביותר בכרטיס,
    מתוך קבוצת השריר של התרגיל. כך היא לא יכולה להתיישן מול הכרטיס, וכרטיס
    שיוחלף מזיז את התרגיל לכותרת הנכונה בלי מיגרציה.

    תרגיל בלי כרטיס — תרגיל שהמשתמש יצר — נופל ל"אחר" ולא נעלם.
  */
  const OTHER = 'אחר'
  const sectioned = useMemo(
    () =>
      groups.map(({ group, list }) => {
        const bySub = new Map<string, CatalogEntry[]>()
        for (const entry of list) {
          const sub = subOf(entry, group, fixes) ?? OTHER
          const bucket = bySub.get(sub)
          if (bucket) bucket.push(entry)
          else bySub.set(sub, [entry])
        }
        // הגדולה קודם, ו"אחר" תמיד אחרונה — היא שארית ולא קטגוריה
        const order = new Map(list.map((entry, i) => [entry.id, i]))
        const byListOrder = (a: CatalogEntry, b: CatalogEntry): number =>
          (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
        const subs = [...bySub.entries()]
          .sort((a, b) => (a[0] === OTHER ? 1 : b[0] === OTHER ? -1 : b[1].length - a[1].length))
          .map(([sub, items]) => ({
            sub,
            /*
              כל מקטע ממוין מול השריר שלו: תחת "חזה עליון" האחוז נמדד על חזה
              עליון, ושורה למטה תחת "חזה אמצעי" הוא נמדד על חזה אמצעי. מיון
              גלובלי אחד היה נותן מספר שאין לו מקום בכותרת שמעליו.
            */
            items: sortedBy(items, sort, {
              sub: sub === OTHER ? null : sub,
              lastAt,
              fallback: byListOrder,
            }),
          }))
        return { group, list, subs }
      }),
    [groups, fixes, sort, lastAt]
  )

  /*
    מה שממלא את שורת הצ׳יפים: הקבוצות שיש להן תרגילים כרגע, וכל אחת נושאת את
    תת-השרירים שלה. הסדר יורש מ-`sectioned`, כלומר מהגדול לקטן — אותו סדר שבו
    הרשימה עצמה מסודרת, כדי שהצ׳יפ והמקטע שהוא מוביל אליו יהיו באותו מקום.
  */
  const filterOptions = useMemo(
    () =>
      sectioned.map(({ group, list, subs }) => ({
        group,
        count: list.length,
        subs: subs
          .filter(({ sub }) => sub !== OTHER)
          .map(({ sub, items }) => ({ sub, count: items.length })),
      })),
    [sectioned]
  )

  // סינון שהתרוקן אחרי חיפוש או החלפת מצב היה משאיר מסך ריק בלי הסבר
  const active = useMemo(() => resolveMuscleFilter(filterOptions, filter), [filterOptions, filter])

  const visible = useMemo(
    () =>
      sectioned
        .filter(({ group }) => !active.group || group === active.group)
        .map(({ group, subs }) => ({
          group,
          subs: active.sub ? subs.filter((x) => x.sub === active.sub) : subs,
        }))
        .filter((x) => x.subs.length > 0),
    [sectioned, active]
  )

  /*
    האפשרות השנייה — "כל מי שנוגע".

    הרשימה למעלה מקבצת תרגיל תחת השריר החזק שלו בלבד, ולכן סקוואט חי תחת
    "עכוז גדול" וה-45% שלו על ארבע-ראשי אינם מופיעים בשום מקום שמישהו יחפש
    בו. כאן נופלים גם הקיבוץ וגם גבול קבוצת השריר: מה שנשאר הוא כל מי
    שהכרטיס שלו מזכיר את השריר, מסודר לפי כמה.

    נבנה גם כשהמתג כבוי, כי המספר עליו הוא מה שמזמין ללחוץ.
  */
  const touching = useMemo(() => {
    if (!active.sub) return []
    const source = mode === 'mine' ? mine : entries
    const pool = source.filter(
      (entry) =>
        matches(entry, q, groupOf(entry, fixes)) &&
        matchesEquipment(entry, equipment) &&
        touchesSub(entry, active.sub as string)
    )
    // ‏"רגיל" הוא סדר של רשימה מקובצת; לרשימה הזו הוא לא אומר כלום
    const effective = sort.key === 'default' ? ({ key: 'pct', desc: true } as const) : sort
    return sortedBy(pool, effective, { sub: active.sub, lastAt })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, mine, mode, q, fixes, equipment, active.sub, sort, lastAt])

  const wide = scope === 'touching' && active.sub !== null

  /*
    כמה שורות מאגר נפלו רק מפני שאין להן סיווג ציוד.

    נספר על התוצאה שאחרי החיפוש ולא על הרשימה המלאה: אחרת חיפוש שמצא שתי
    שורות היה נושא הודעה על שבע-עשרה שנפלו במקום אחר במסך.
  */
  const noEquipment = useMemo(
    () =>
      equipmentHidden(
        (mode === 'mine' ? mine : entries).filter((e) => matches(e, q, groupOf(e, fixes))),
        equipment
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, mine, mode, q, fixes, equipment]
  )

  const total = groups.reduce((n, g) => n + g.list.length, 0)
  // כמה תוצאות יש בצד השני — מה שהופך "לא נמצא" להצעה ולא לקיר
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allHits = useMemo(
    () => entries.filter((e) => matches(e, q, groupOf(e, fixes))).length,
    [entries, q, fixes]
  )

  const switchMode = (next: ExercisesMode): void => {
    if (next === mode) return
    setMode(next)
    /*
      מצב הוא state ולא ניווט: `navigate` בלי replace היה גורם ל"חזרה" לבטל
      החלפות מתג, ועם replace שני המצבים חולקים location.key אחד — ואז
      useScrollMemory משחזר אופסט של רשימת 76 לתוך רשימת 28. איפוס מפורש הוא
      מה שמחליף את השחזור, כי הרשימה מתחלפת ולא נגללת.

      הביטול לפני האיפוס הכרחי: אם המתג נלחץ בזמן ששחזור-אחורה עוד רץ
      (הרשימה נטענת מ-IndexedDB עד 2.5 שניות), לולאת ה-settle הייתה דורסת
      את האיפוס בפריים הבא ומנחיתה עמוק ברשימה הלא-נכונה.
    */
    cancelScrollRestore()
    window.scrollTo(0, 0)
  }

  const withBusy = async (id: string, work: () => Promise<void>): Promise<void> => {
    if (busy.has(id)) return
    setBusy((prev) => new Set(prev).add(id))
    try {
      await work()
    } finally {
      setBusy((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleAdd = (entry: CatalogEntry): void => {
    void withBusy(entry.id, async () => {
      try {
        if (entry.exercise) {
          await restoreToMine(entry.exercise.id)
          toast(`${entry.name} חזר לתרגילים שלך`, { tone: 'success' })
          return
        }
        if (!entry.library) return
        const { exercise, outcome } = await addFromLibrary(entry.library)
        if (outcome === 'already') {
          toast(`${exercise.name} כבר בתרגילים שלך`)
          return
        }
        toast(outcome === 'restored' ? `${exercise.name} חזר לתרגילים שלך` : `${exercise.name} נוסף`, {
          tone: 'success',
          actionLabel: 'לעריכה',
          onAction: () => navigate(`/settings/exercises/${exercise.id}`),
        })
      } catch {
        toast('לא הצלחתי להוסיף את התרגיל', { tone: 'warn' })
      }
    })
  }

  const handleCreate = async (): Promise<void> => {
    try {
      const created = await createBlankExercise()
      // ישר לעורך: לרשומה ריקה אין שם, שריר או ציוד, ובלעדיהם היא לא שווה כלום
      navigate(`/settings/exercises/${created.id}`)
    } catch {
      toast('לא הצלחתי ליצור תרגיל חדש', { tone: 'warn' })
    }
  }

  const handleRemoveTap = (entry: CatalogEntry): void => {
    if (!entry.exercise) return
    void withBusy(entry.id, async () => {
      const usage = await findPlanUsage(entry.exercise!.id)
      // בלי חברות בתוכנית אין החלטה לקבל — הטוסט עם "בטל" הוא כל הרשת שצריך
      if (usage.length === 0) {
        await doRemove(entry, false)
        return
      }
      setPending({ entry, usage })
    })
  }

  const doRemove = async (entry: CatalogEntry, detach: boolean): Promise<void> => {
    if (!entry.exercise) return
    const id = entry.exercise.id
    try {
      await removeFromMine(id)
      if (detach) await detachFromPlans(id)
      toast(`${entry.name} הוצא מהתרגילים שלך`, {
        actionLabel: 'בטל',
        // הביטול מחזיר רק את הדגל. פריט תוכנית שנותק כבר לא חוזר, ולכן
        // "הוצא גם מהתוכניות" הוא הכפתור המשני בגיליון ולא ברירת המחדל.
        onAction: () => void restoreToMine(id),
      })
    } catch {
      toast('לא הצלחתי להוציא את התרגיל', { tone: 'warn' })
    }
  }

  // הגיליון נסגר לפני הכתיבה כדי שהאישור לא יישאר תלוי מעל הרשימה שמשתנה
  const confirmRemove = (detach: boolean): void => {
    const target = pending
    setPending(null)
    if (target) void doRemove(target.entry, detach)
  }

  const subtitle =
    mode === 'mine'
      ? `${mine.length} תרגילים · לפי קבוצת שריר`
      : `${entries.length} תרגילים · שלי ומה שאפשר להוסיף`

  return (
    <Screen dock={false}>
      <ScreenHeader title="תרגילים" subtitle={subtitle} />

      {/*
        aria-pressed ולא role=tab: אין כאן tabpanel ואין ניווט חצים, ולכן
        סמנטיקת טאבים הייתה מבטיחה לקורא-מסך התנהגות שלא קיימת. אותו נימוק
        ואותה צורה כמו בורר הטווח במסך הנתונים.
      */}
      <div
        role="group"
        aria-label="אילו תרגילים"
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
            onClick={() => switchMode(tab.key)}
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
          placeholder={mode === 'mine' ? 'חיפוש בתרגילים שלי' : 'חיפוש בכל התרגילים'}
          aria-label="חיפוש תרגיל"
          className="h-13 w-full rounded-card border border-ink-700 bg-ink-900/70 pe-4 ps-11 text-bone-50 outline-none transition-colors placeholder:text-bone-500 focus:border-flame-500/60"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="נקה חיפוש"
            className="absolute inset-y-0 my-auto flex size-11 items-center justify-center rounded-full text-bone-500 active:bg-ink-800"
            style={{ insetInlineEnd: '0.5rem' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* סינון לפי שריר — קבוצות, ובתוך קבוצה תת-השרירים שלה */}
      <MuscleFilterChips options={filterOptions} value={active} onChange={setFilter} />

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
          primaryCount={visible.reduce(
            (n, g) => n + g.subs.reduce((m, x) => m + x.items.length, 0),
            0
          )}
          touchingCount={touching.length}
        />
      ) : null}

      {total === 0 ? (
        <EmptyStateFor
          mode={mode}
          query={query}
          allHits={allHits}
          onGoAll={() => switchMode('all')}
          onCreate={() => void handleCreate()}
        />
      ) : wide ? (
        /*
          התצוגה הרחבה: רשימה אחת, בלי קבוצות ובלי כותרות. כל שורה כאן עונה
          על אותה שאלה, וההבדל ביניהן הוא המספר בקצה.
        */
        <div className="animate-rise">
          <p className="meta mb-2 px-1">
            כל התרגילים שהכרטיס שלהם מזכיר {active.sub} — לפי כמה
          </p>
          {touching.length === 0 ? (
            <p className="card px-4 py-5 text-center text-sm font-semibold text-bone-400">
              אין תרגיל שנוגע ב{active.sub} במה שמוצג כרגע.
            </p>
          ) : (
            <div className="card divide-y divide-ink-800/70 overflow-hidden">
              {touching.map((entry) => (
                <Row
                  key={entry.id}
                  entry={entry}
                  group={groupOf(entry, fixes)}
                  sub={active.sub}
                  pct={pctOfSub(entry, active.sub as string)}
                  mode={mode}
                  duplicates={duplicates}
                  lastPerformed={lastPerformed}
                  busy={busy.has(entry.id)}
                  onOpen={() =>
                    entry.exercise
                      ? navigate(`/exercise/${entry.exercise.id}`)
                      : navigate(`/library/${entry.id}`)
                  }
                  onPlay={() => setGallery(entry)}
                  onAdd={() => handleAdd(entry)}
                  onRemove={() => handleRemoveTap(entry)}
                  onFix={() => setFixing(entry)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          {visible.map(({ group, subs }) => (
            <section key={group} className="animate-rise">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-1">
                  <h2 className="text-sm font-extrabold text-bone-200">
                    {MUSCLE_GROUPS[group].label}
                  </h2>
                  {/* כרטיס הסקירה של הקבוצה — כל תת-השרירים שלה בתמונה אחת */}
                  <GroupCardButton group={group} />
                </div>
                <span className="meta">{subs.reduce((n, x) => n + x.items.length, 0)}</span>
              </div>

              {(shelfCounts.get(group) ?? 0) > 0 ? (
                <button
                  type="button"
                  onClick={() => setPlayingGroup(group)}
                  className="mb-2 flex min-h-13 w-full items-center gap-3 rounded-card border border-flame-500/25 bg-flame-500/[0.06] px-3 text-start active:bg-flame-500/10"
                >
                  <Clapperboard size={18} className="shrink-0 text-flame-400" />
                  <span className="min-w-0 flex-1 text-sm font-bold text-bone-100">
                    סרטוני {MUSCLE_GROUPS[group].label} — כמה תרגילים בסרטון אחד
                  </span>
                  <span className="meta tnum shrink-0">{shelfCounts.get(group)}</span>
                  <ChevronLeft size={16} className="shrink-0 text-bone-600" />
                </button>
              ) : null}

              {/*
                כותרת תת-קטגוריה מוצגת רק כשיש יותר מאחת. קבוצה שכל תרגיליה
                תחת אותו שריר — הבטן, למשל — הייתה מקבלת כותרת שחוזרת על שם
                הקבוצה ולא מוסיפה כלום.
              */}
              <div className="space-y-3">
                {subs.map(({ sub, items }) => (
                  <div key={sub}>
                    {subs.length > 1 ? <SubTargetHeading sub={sub} count={items.length} /> : null}
                    <div className="card divide-y divide-ink-800/70 overflow-hidden">
                {items.map((entry) => (
                  <Row
                    key={entry.id}
                    entry={entry}
                    group={group}
                    sub={sub === OTHER ? null : sub}
                    /* המספר מופיע רק כשהוא זה שקובע את הסדר */
                    pct={sort.key === 'pct' && sub !== OTHER ? pctOfSub(entry, sub) : undefined}
                    mode={mode}
                    duplicates={duplicates}
                    lastPerformed={lastPerformed}
                    busy={busy.has(entry.id)}
                    onOpen={() =>
                      navigate(
                        entry.exercise ? `/exercise/${entry.exercise.id}` : `/library/${entry.id}`
                      )
                    }
                    onPlay={() => setGallery(entry)}
                    onAdd={() => handleAdd(entry)}
                    onRemove={() => handleRemoveTap(entry)}
                    onFix={() => setFixing(entry)}
                  />
                ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/*
            תרגיל שאינו מהמאגר — כפיפת פטיש, לחיצת שוק, מקבילים. זה המסלול
            היחיד ליצור אותו, והוא היה קבור בהגדרות ← קטלוג התרגילים, מסך
            שלא היה אלא עותק שלישי של אותה רשימה.

            בתחתית ולא בראש: רוב הכניסות לכאן הן לחפש משהו שכבר קיים, ורק מי
            שגלל עד הסוף ולא מצא באמת צריך אותו. ורק במצב "הכל" — "שלי" הוא
            רשימת עיון נקייה.
          */}
          {mode === 'all' ? (
            <button
              type="button"
              onClick={() => void handleCreate()}
              className="card flex min-h-14 w-full items-center justify-center gap-2 p-3 text-sm font-bold text-bone-400 active:bg-ink-800"
            >
              <Plus size={16} />
              תרגיל חדש משלי
            </button>
          ) : null}
        </div>
      )}

      <FixEntrySheet entry={fixing} onClose={() => setFixing(null)} />

      <RemoveExerciseSheet
        open={pending !== null}
        onClose={() => setPending(null)}
        exerciseName={pending?.entry.name ?? ''}
        usage={pending?.usage ?? []}
        onConfirm={confirmRemove}
      />

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

      {playingGroup ? (
        <VideoPlayer
          exerciseId={groupContextId(playingGroup)}
          exerciseName={`סרטוני ${MUSCLE_GROUPS[playingGroup].label}`}
          open
          onClose={() => setPlayingGroup(null)}
        />
      ) : null}
    </Screen>
  )
}

/**
 * שורה אחת. אותו מבנה בשני המצבים — מה שמתחלף הוא רק הפקד האחרון, כך שגובה
 * השורה לא זז כשמחליפים מצב.
 *
 * העוטף הוא div והכפתור בפנים, כי `IconButton` לא יכול לשבת בתוך כפתור אחר.
 *
 * הריבוע הוא כפתור **אח** לגוף השורה ולא ילד שלו, ומאותה סיבה בדיוק: כפתור
 * מקונן היה מפעיל את שני המטפלים בלחיצה אחת. הפיצול הוא גם מה שנותן לשורה שני
 * יעדים — הריבוע פותח את הגלריה, והשאר פותח את מסך התרגיל.
 *
 * והיעד השלישי הוא לחיצה ארוכה על גוף השורה — תיקון השם ושיוך השריר. הוא לא
 * קיבל פקד משלו בכוונה: זו פעולה שנעשית פעם בחודש ("טעיתי, זה לא יושב שם"),
 * ואייקון שלישי היה מכווץ את שני היעדים שנלחצים כל יום.
 */
function Row({
  entry,
  group,
  sub,
  pct,
  mode,
  duplicates,
  lastPerformed,
  busy,
  onOpen,
  onPlay,
  onAdd,
  onRemove,
  onFix,
}: {
  entry: CatalogEntry
  group: MuscleGroup
  /** ראש השריר שהשורה יושבת תחתיו כרגע. null = "אחר", בלי כרטיס. */
  sub: string | null
  /**
   * האחוז על השריר שהרשימה ממוינת לפיו — שלושה מצבים.
   *
   * ‏`undefined` = הרשימה לא ממוינת לפי אחוז ואין עמודה; `null` = ממוינת,
   * ולשורה הזו אין נתון על הכרטיס; מספר = האחוז. ההפרדה בין השניים האחרונים
   * היא מה שמונע ממנה להיקרא כמו אפס.
   */
  pct?: number | null
  mode: ExercisesMode
  duplicates: ReadonlySet<string>
  lastPerformed: Map<string, { weightKg: number; reps: number; at: number; sets: number }>
  busy: boolean
  onOpen: () => void
  /** הריבוע — פותח את הגלריה: כרטיס השרירים ואחריו סרטוני ההדגמה */
  onPlay: () => void
  onAdd: () => void
  onRemove: () => void
  /** לחיצה ארוכה — גיליון תיקון השם והשיוך */
  onFix: () => void
}): JSX.Element {
  const ex = entry.exercise
  const last = ex ? lastPerformed.get(ex.id) : undefined
  const apart = ex ? distinguisher(ex, duplicates) : null
  const out = entry.state === 'removed' || entry.state === 'removedOwn'
  /*
    מה עוד עובד בתרגיל, לפי הכרטיס. שניים ולא כולם: השורה כבר נושאת שם, שם
    באנגלית, תת-מיקוד, ציוד וביצוע אחרון, וחמש תגיות היו הופכות אותה לקיר.
    השניים הראשונים הם בעלי האחוז הגבוה, ולכן גם המעניינים.
  */
  const secondary = secondaryOf(entry, group, sub).slice(0, 2)
  const press = useLongPress(onOpen, onFix)

  return (
    <div className={['flex items-center', out ? 'opacity-60' : ''].join(' ')}>
      <span className="shrink-0 ps-3">
        <ExerciseThumb
          exerciseId={ex?.id ?? entry.id}
          libraryId={ex?.libraryId}
          size="sm"
          keepFrame
          onOpen={onPlay}
        />
      </span>
      <button
        type="button"
        {...press}
        aria-description="לחיצה ארוכה — תיקון השם ושיוך השריר"
        /* בלי select-none ובלי הביטול של הקאלאאוט, לחיצה ארוכה באייפון מרימה
           את תפריט הבחירה של הדפדפן מעל הגיליון שהיא בדיוק פתחה */
        style={{ WebkitTouchCallout: 'none' }}
        className="flex min-w-0 flex-1 select-none items-center gap-3 p-3 text-start transition-colors active:bg-ink-800"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-bold text-bone-50">
            {entry.name}
          </span>
          {entry.nameEn ? (
            // dir=ltr לריצת הטקסט, אבל היישור נשאר לקצה ההתחלתי של השורה
            // העברית — אחרת השם קופץ לקצה הנגדי ומתנתק מהשם שהוא מתייג
            <span
              dir="ltr"
              className="mt-0.5 block truncate text-end text-[0.6875rem] font-semibold text-bone-500"
            >
              {entry.nameEn}
            </span>
          ) : null}
          {/*
            המבדיל יושב מחוץ למחרוזת הקטומה ובלי shrink: כשהוא היה בסוף שורה
            אחת קטומה, דווקא הוא היה נחתך — ובשתי שורות בעלות אותו שם זה בדיוק
            מה שצריך להישאר על המסך.
          */}
          <span className="meta mt-0.5 flex items-baseline gap-1.5">
            {apart ? <span className="shrink-0 font-bold text-bone-400">{apart}</span> : null}
            <span className="truncate">
              {ex
                ? `${ex.subTarget} · ${EQUIPMENT_LABELS[ex.equipment]}${out ? ' · לא בתרגילים שלי' : ''}`
                : `${entry.library?.videos.length ?? 0} סרטוני הסבר`}
            </span>
          </span>
          {secondary.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {secondary.map((mus) => (
                <span
                  key={mus.he}
                  className="rounded-pill border border-ink-700 bg-ink-850 px-1.5 py-px text-[0.625rem] font-semibold text-bone-400"
                >
                  {mus.he} <span className="tnum text-bone-500">{mus.pct}%</span>
                </span>
              ))}
            </span>
          ) : null}
        </span>

        <span className="shrink-0 text-end">
          {/*
            כשהרשימה ממוינת לפי אחוז, המספר שקובע את הסדר הוא זה שצריך להיות
            בקצה השורה — משקל אחרון מתחתיו, קטן, כי הוא כבר לא השאלה.
          */}
          {pct !== undefined ? (
            pct === null ? (
              <span className="meta">אין נתון</span>
            ) : (
              <span className="tnum block text-sm font-extrabold text-flame-400">{pct}%</span>
            )
          ) : ex ? (
            last ? (
              <>
                <span dir="ltr" className="tnum block text-sm font-extrabold text-bone-200">
                  {formatSetShort(last.weightKg, last.reps, ex.weightMode, ex.metric)}
                </span>
                <span className="meta mt-0.5 block">{formatRelativeDay(last.at)}</span>
              </>
            ) : (
              <span className="meta">עוד לא בוצע</span>
            )
          ) : null}
          {pct !== undefined && ex && last ? (
            <span className="meta mt-0.5 block">{formatRelativeDay(last.at)}</span>
          ) : null}
        </span>

        {mode === 'mine' ? <ChevronLeft size={18} className="shrink-0 text-bone-600" /> : null}
      </button>

      {mode === 'all' ? (
        entry.state === 'mine' ? (
          <IconButton
            label={`הוצא את ${entry.name} מהתרגילים שלי`}
            disabled={busy}
            outlined
            onClick={onRemove}
          >
            <Minus size={18} />
          </IconButton>
        ) : (
          <IconButton
            label={`הוסף את ${entry.name} לתרגילים שלי`}
            disabled={busy}
            active
            onClick={onAdd}
          >
            <Plus size={18} />
          </IconButton>
        )
      ) : null}
    </div>
  )
}

/**
 * "לא נמצא" הוא המקום שבו האיחוד משתלם: חיפוש שנכשל ב"שלי" ומצליח ב"הכל" הוא
 * בדיוק הרגע שבו המשתמש מגלה שהתרגיל קיים ורק לא אצלו. שתי הרשימות המסוננות
 * ממילא מחושבות, אז המספר בחינם.
 */
function EmptyStateFor({
  mode,
  query,
  allHits,
  onGoAll,
  onCreate,
}: {
  mode: ExercisesMode
  query: string
  allHits: number
  onGoAll: () => void
  onCreate: () => void
}): JSX.Element {
  if (!query) {
    return (
      <EmptyState
        title="אין לך עדיין תרגילים"
        hint="כל מה שהוצאת נמצא ב״הכל״, עם המשקלים וההיסטוריה שלו."
        action={
          <button
            type="button"
            onClick={onGoAll}
            className="min-h-12 rounded-pill border border-flame-500/40 bg-flame-500/12 px-5 text-sm font-bold text-flame-300"
          >
            עבור להכל
          </button>
        }
      />
    )
  }

  if (mode === 'mine' && allHits > 0) {
    return (
      <EmptyState
        title="לא נמצא בתרגילים שלך"
        hint={`יש ${allHits} תרגילים שמתאימים ל"${query}" — הם פשוט לא אצלך.`}
        action={
          <button
            type="button"
            onClick={onGoAll}
            className="min-h-12 rounded-pill border border-flame-500/40 bg-flame-500/12 px-5 text-sm font-bold text-flame-300"
          >
            חפש בהכל
          </button>
        }
      />
    )
  }

  /*
    חיפוש שנכשל גם ב"הכל" הוא הרגע היחיד שבו באמת מגלים שהתרגיל חסר — ולכן
    כאן הכפתור ליצירה, ולא בראש המסך שבו הוא רק רעש.
  */
  return (
    <EmptyState
      title="לא נמצא תרגיל"
      hint={`אין תרגיל שמתאים ל"${query}" — לא אצלך ולא במאגר.`}
      action={
        <button
          type="button"
          onClick={onCreate}
          className="min-h-12 rounded-pill border border-flame-500/40 bg-flame-500/12 px-5 text-sm font-bold text-flame-300"
        >
          צור תרגיל משלי
        </button>
      }
    />
  )
}
