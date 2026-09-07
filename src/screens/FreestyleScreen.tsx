import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Search, Wand2, X } from 'lucide-react'
import { getSettings } from '@/db/db'
import { ensureTrainable, getCatalogEntries, isMine } from '@/db/catalog'
import type { CatalogEntry } from '@/db/catalog'
import {
  getAllExercises,
  getExerciseHistory,
  getLastPerformedMap,
  getSessionsSince,
} from '@/db/queries'
import { isEntryHidden, useHiddenExerciseIds } from '@/db/hiddenExercises'
import { groupOf, subOf, useMuscleFixes } from '@/db/muscleFixes'
import type { Equipment, MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS } from '@/db/types'
import {
  coverageLookbackFrom,
  liveCoverageInput,
  muscleCoverage,
  suggestWorkout,
  uncoveredGroups,
} from '@/domain/coverage'
import type { MuscleCoverage } from '@/domain/coverage'
import { equipmentHidden, matchesEquipment, pctOfSub, sortedBy } from '@/domain/exerciseSort'
import type { SortState } from '@/domain/exerciseSort'
import { recommendWeight } from '@/domain/recommendation'
import type { WeightRecommendation } from '@/domain/recommendation'
import { normalize } from '@/lib/text'
import { useWorkout } from '@/state/activeWorkoutStore'
import { EmptyState, toast } from '@/components/ui'
import { HomeButton } from '@/components/shell/ScreenHeader'
import { useAudioCue } from '@/hooks/useAudioCue'
import { MuscleGrid } from '@/components/exercises/MuscleGrid'
import { ExercisePickList } from '@/components/exercises/ExercisePickList'
import type { PickRow } from '@/components/exercises/ExercisePickList'
import { SubTargetHeading } from '@/components/exercises/SubTargetHeading'
import { EquipmentNote, SortMenuButton } from '@/components/exercises/ListSortBar'
import {
  MuscleFilterChips,
  NO_MUSCLE_FILTER,
  resolveMuscleFilter,
} from '@/components/exercises/MuscleFilterChips'
import type { MuscleFilter } from '@/components/exercises/MuscleFilterChips'
import { VideoPlayer } from '@/components/media/VideoPlayer'

/**
 * בחירת תרגיל — שריר, תרגיל, תיעוד.
 *
 * זה גם המסלול השני להתחיל אימון (במקום הבונה) וגם **הדלת היחידה של "הוסף
 * תרגיל"** מכל מקום באפליקציה: מסך האימון, גיליון התור ומסך המנוחה כולם
 * נוחתים כאן. עד כאן ההוספה תוך כדי אימון הייתה גיליון עם רשימה מאוחדת, והמסך
 * הזה החליף אותו — כולל החיפוש, המיון וסינון הציוד שהיו בו.
 *
 * נקודת הפתיחה היא **שריר ולא תרגיל**, והשרירים מסודרים לפי התאוששות. זו לא
 * קוסמטיקה: "מה נח" היא השאלה שבאמת נשאלת בכניסה לחדר, והסדר עונה עליה לפני
 * שנקראה מילה אחת.
 *
 * המסך הוא **מסלול ולא גיליון**, גם כשנכנסים אליו מתוך אימון שרץ: רשת של
 * שמונה אריחים ורשימה של תרגילים לא נכנסות לגיליון בלי לגלול, ובאמצע אימון
 * גלילה היא בדיוק מה שאין סבלנות אליו. היציאה מחזירה למקום שממנו נכנסת.
 *
 * ‏`?add=queue` הוא ההבדל היחיד בין שתי הכניסות: בלעדיו הבחירה **מתחילה**
 * את התרגיל מיד (זו הזרימה של אימון חופשי), ואיתו היא רק דוחפת אותו לסוף
 * התור ומחזירה לאימון. מי שלוחץ `+` באמצע תרגיל שהוא בתוכו לא ביקש לצאת ממנו.
 */

/** "אחר" הוא הדלי של תרגיל בלי כרטיס שרירים, לא קטגוריה */
const OTHER = 'אחר'

/** מה שנטען לכל שורה מהמסד — ההיסטוריה שבגללה בוחרים דווקא בה */
interface RowMeta {
  previous: { weightKg: number; reps: number } | null
  recommendation: WeightRecommendation | null
}

export function FreestyleScreen(): JSX.Element | null {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const workout = useWorkout((s) => s.workout)
  const hidden = useHiddenExerciseIds()
  const fixes = useMuscleFixes()

  const [group, setGroup] = useState<MuscleGroup | null>(null)
  const [busy, setBusy] = useState(false)
  const [now] = useState(() => Date.now())

  /* פקדי הרשימה — אותם שלושה בדיוק שיושבים בבונה ובמסך התרגילים */
  const [mode, setMode] = useState<'mine' | 'all'>('mine')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MuscleFilter>(NO_MUSCLE_FILTER)
  const [sort, setSort] = useState<SortState>({ key: 'default', desc: true })
  const [equipment, setEquipment] = useState<ReadonlySet<Equipment>>(new Set())
  /** נגן אחד למסך ולא אחד לשורה — הוא מריץ מנויים גם כשהוא סגור */
  const [gallery, setGallery] = useState<CatalogEntry | null>(null)

  /**
   * ‏"הוסף לתור" ולא "התחל עכשיו".
   *
   * נקרא מהכתובת ולא נגזר מהמצב: המצב לא יודע *למה* נכנסנו. מי שלחץ `+`
   * בכותרת של אימון מתוכנן ביקש עוד תרגיל להמשך, ומי שנכנס מרשת השרירים של
   * אימון חופשי ביקש להתחיל אותו עכשיו — ואותו תרגיל, אותו מצב, שתי כוונות.
   */
  const appendMode = params.get('add') === 'queue'

  /*
    מאיפה נכנסנו — ולאן `ביטול` מחזיר.

    נלכד פעם אחת בפתיחה ולא נגזר מ-`workout` בזמן אמת: בחירת תרגיל *יוצרת*
    אימון, ומקור שנקרא אחריה היה אומר "מתוך אימון" על מסך שנפתח מהבית.
  */
  const [origin] = useState<'home' | 'workout'>(() => (workout ? 'workout' : 'home'))

  const settings = useLiveQuery(() => getSettings(), [])
  const exercises = useLiveQuery(() => getAllExercises(), [], [])
  const lastPerformed = useLiveQuery(() => getLastPerformedMap(), [], undefined)
  const history = useLiveQuery(() => getSessionsSince(coverageLookbackFrom(Date.now())), [], undefined)
  /*
    הרשימה המאוחדת נטענת רק אחרי שנבחר שריר. היא סורקת את כל הקטלוג ומצליבה
    אותו מול המאגר, ולרשת השרירים אין בה שום שימוש.
  */
  const entries = useLiveQuery(
    () => (group === null ? Promise.resolve([] as CatalogEntry[]) : getCatalogEntries()),
    [group],
    [] as CatalogEntry[]
  )

  const { unlock } = useAudioCue(settings?.soundEnabled ?? true, settings?.soundVolume ?? 0.8)

  /*
    הכיסוי כולל את האימון שרץ עכשיו (`liveCoverageInput`).

    בלעדיו אריח "גב" היה ממשיך להאיר "לא נגעת" אחרי שלושה סטים של חתירה
    שנרשמו לפני דקה — כלומר הרשת הייתה משקרת בדיוק ברגע שבו חוזרים אליה
    כדי לבחור מה הלאה.
  */
  const rows: MuscleCoverage[] = useMemo(() => {
    if (!history || !settings) return []
    const live = liveCoverageInput(workout, now)
    return muscleCoverage(
      exercises,
      [...history.sessions, ...live.sessions],
      [...history.sets, ...live.sets],
      now,
      settings.coverageWindowDays
    )
  }, [exercises, history, settings, workout, now])

  /** כל השורות של השריר שנבחר, לפני חיפוש ולפני המתג */
  const groupEntries = useMemo(
    () => (group === null ? [] : entries.filter((e) => groupOf(e, fixes) === group)),
    [entries, group, fixes]
  )

  /*
    ההיסטוריה של השורות — מהמנוע ולא מחישוב שני.

    נטענת לשריר כולו ולא לרשימה המסוננת, וזו בחירה: כך הקלדה בחיפוש ומעבר בין
    "שלי" ל"הכל" לא מפילים את הרשימה לשלד בכל לחיצה. `recommendWeight` דורש
    היסטוריה מלאה לכל תרגיל, ולכן היא בכל מקרה לא נטענת לכל הקטלוג.
  */
  const [meta, setMeta] = useState<ReadonlyMap<string, RowMeta> | null>(null)
  useEffect(() => {
    if (group === null) {
      setMeta(null)
      return
    }
    // בלי המפה `previous` היה יוצא null לכל השורות ונצרב ככה עד שינוי שריר
    if (lastPerformed === undefined) return
    let cancelled = false
    void Promise.all(
      groupEntries
        .filter((entry) => entry.exercise !== null)
        .map(async (entry) => {
          const exercise = entry.exercise!
          const history = await getExerciseHistory(exercise.id, 4)
          const previous = lastPerformed.get(exercise.id) ?? null
          return [
            entry.id,
            {
              previous: previous ? { weightKg: previous.weightKg, reps: previous.reps } : null,
              recommendation: recommendWeight(exercise, history, exercise.targetReps, now),
            },
          ] as const
        })
    )
      .then((pairs) => {
        if (!cancelled) setMeta(new Map(pairs))
      })
      // ‏catch: מסד שנסגר תחת המסך דוחה כל שאילתה שהייתה באוויר, וההמלצות
      // הן ליטוש — היעדרן לעולם לא אמור להפיל משהו
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [group, groupEntries, lastPerformed, now])

  // מסך שנפתח מתוך אימון שהסתיים בינתיים אינו "מתוך אימון" יותר
  useEffect(() => {
    if (origin === 'workout' && !workout) navigate('/', { replace: true })
  }, [origin, workout, navigate])

  const leaveTo = origin === 'workout' ? '/workout' : '/'

  /** מה שכבר בתור — השורה מסומנת "כבר באימון" ומושבתת */
  const inWorkout = useMemo(
    () => new Set((workout?.queue ?? []).map((q) => q.exerciseId)),
    [workout]
  )

  /*
    הרשימה אחרי חיפוש, ציוד והמתג.

    ההסתרה חלה על "שלי" בלבד, בדיוק כמו בבונה ובמסך התרגילים: היא אומרת
    "לעולם לא אעשה את זה", ולכן היא מנקה את הרשימה שממנה בוחרים. "הכל" נשאר
    מלא — הוא העוגן שלא משקר.
  */
  const { list, otherModeHits, noEquipment } = useMemo(() => {
    if (group === null || hidden === null) return { list: [], otherModeHits: 0, noEquipment: 0 }
    const q = normalize(query)
    const found = groupEntries.filter(
      (e) =>
        !q ||
        normalize(e.name).includes(q) ||
        normalize(e.nameEn ?? '').includes(q) ||
        normalize(e.exercise?.subTarget ?? '').includes(q)
    )
    const inGroup = found.filter((e) => matchesEquipment(e, equipment))
    const mine = inGroup.filter((e) => isMine(e) && !isEntryHidden(e, hidden))
    return {
      list: mode === 'mine' ? mine : inGroup,
      // כמה מחכים בצד השני של המתג — מה שהופך "לא נמצא" להצעה ולא לקיר
      otherModeHits: mode === 'mine' ? inGroup.length : mine.length,
      // שורות מאגר שנפלו רק מפני שאין להן סיווג ציוד — נאמרות ולא נעלמות
      noEquipment: equipmentHidden(found, equipment),
    }
  }, [group, groupEntries, hidden, query, equipment, mode])

  /** מתי בוצע לאחרונה, לפי מזהה — מה שהמיון "לאחרונה" קורא */
  const lastAt = useMemo(
    () => new Map([...(lastPerformed ?? [])].map(([id, l]) => [id, l.at as number])),
    [lastPerformed]
  )

  /*
    חלוקה לתת-שרירים, וכל מקטע ממוין מול השריר שלו.

    ‏`default` הוא הסדר של התוכנית (`exercise.order`), ושורת מאגר שאין לה
    כרטיס יורדת לסוף — היא הצעה להוסיף, לא תרגיל שמחכה.
  */
  const sections = useMemo(() => {
    if (group === null) return []
    const byDefault = (a: CatalogEntry, b: CatalogEntry): number =>
      (a.exercise?.order ?? Number.MAX_SAFE_INTEGER) - (b.exercise?.order ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name, 'he')
    const bySub = new Map<string, CatalogEntry[]>()
    for (const entry of [...list].sort(byDefault)) {
      const sub = subOf(entry, group, fixes) ?? OTHER
      const bucket = bySub.get(sub)
      if (bucket) bucket.push(entry)
      else bySub.set(sub, [entry])
    }
    return [...bySub.entries()]
      .sort((a, b) => (a[0] === OTHER ? 1 : b[0] === OTHER ? -1 : b[1].length - a[1].length))
      .map(([sub, items]) => ({
        sub,
        items: sortedBy(items, sort, {
          sub: sub === OTHER ? null : sub,
          lastAt,
          fallback: byDefault,
        }),
      }))
  }, [list, group, fixes, sort, lastAt])

  const filterOptions = useMemo(
    () =>
      group === null
        ? []
        : [
            {
              group,
              count: list.length,
              subs: sections
                .filter(({ sub }) => sub !== OTHER)
                .map(({ sub, items }) => ({ sub, count: items.length })),
            },
          ],
    [group, list, sections]
  )

  /*
    הצ׳יפ נשאר לחוץ רק כל עוד הוא קיים: החיפוש והמתג מזיזים את הרשימה מתחתיו,
    ובחירה שנשארה תלויה על תת-שריר שהתרוקן הייתה מרוקנת את המסך בלי להסביר.
  */
  const active = useMemo(
    () => resolveMuscleFilter(filterOptions, { group, sub: filter.sub }),
    [filterOptions, group, filter.sub]
  )
  const visible = useMemo(
    () => (active.sub ? sections.filter((x) => x.sub === active.sub) : sections),
    [sections, active.sub]
  )

  /** האחוז נכנס לשורה רק כשהוא זה שקובע את הסדר — אחרת הוא עמודה בלי שאלה */
  const rowOf = (entry: CatalogEntry, sub: string): PickRow => ({
    entry,
    previous: meta?.get(entry.id)?.previous ?? null,
    recommendation: meta?.get(entry.id)?.recommendation ?? null,
    inWorkout: entry.exercise ? inWorkout.has(entry.exercise.id) : false,
    pct: sort.key === 'pct' && sub !== OTHER ? pctOfSub(entry, sub) : undefined,
  })

  /**
   * בחירת תרגיל.
   *
   * שלושה מסלולים לאותה לחיצה, וההבדל ביניהם הוא רק מה כבר קיים: פתיחה של
   * אימון חופשי חדש, הוספה לתור של אימון שרץ ומעבר אליו, או — ב-`?add=queue`
   * — הוספה לסוף התור וחזרה לאימון בלי לזוז ממנו.
   *
   * ‏`ensureTrainable` קודם לכל אלה: הוא הנקודה שבה שורה ברשימה המאוחדת הופכת
   * למשהו שאפשר לתעד בו סטים. תרגיל פעיל חוזר כמו שהוא, תרגיל שהוצא מ"שלי"
   * חוזר פנימה, ומזהה מאגר מקבל כרטיס.
   */
  const start = async (entry: CatalogEntry): Promise<void> => {
    if (busy) return
    // המחווה הזו היא ההזדמנות לפתוח אודיו ב-iOS. חייבת לקדום לכל await.
    unlock()
    setBusy(true)
    try {
      let exercise
      try {
        exercise = await ensureTrainable(entry.id)
      } catch {
        exercise = null
      }
      if (!exercise) {
        toast('לא הצלחתי להוסיף את התרגיל', { tone: 'warn' })
        return
      }

      const state = useWorkout.getState()
      if (!state.workout) {
        if ((await state.startWithItems([exercise.id])) === 'busy') {
          toast('יש כבר אימון פתוח — סיים אותו קודם', { tone: 'warn' })
        }
        /*
          ‏`replace` ולא רשומה חדשה: המסך הזה סיים את תפקידו ברגע שהתרגיל
          נבחר, וחזרה אחורה אליו הייתה נוחתת על רשת שרירים שכבר ענו עליה.
          הוא גם מה ששומר על ערימת ההיסטוריה שטוחה כשמוסיפים חמישה תרגילים
          באימון אחד — ראה `useBack`.
        */
        navigate('/workout', { replace: true })
        return
      }

      const outcome = await state.addExercise(exercise.id)
      if (outcome === 'failed') {
        toast('לא הצלחתי להוסיף את התרגיל', { tone: 'warn' })
        return
      }
      /*
        גם על `duplicate` ממשיכים: התרגיל כבר בתור, וזה בדיוק מה שהלחיצה
        התכוונה אליו. סירוב שקט היה נראה כמו מסך תקוע.
      */
      const queue = useWorkout.getState().workout?.queue ?? []
      const key =
        outcome === 'duplicate'
          ? (queue.find((q) => q.exerciseId === exercise.id)?.key ?? null)
          : (queue.at(-1)?.key ?? null)

      if (appendMode) {
        /*
          התרגיל נכנס לסוף התור והאימון ממשיך מאיפה שהיה. "התחל עכשיו" הוא
          הדרך לקפוץ אליו בכל זאת — בלחיצה אחת, ובבחירה של המשתמש.
        */
        toast(`${exercise.name} נוסף לאימון`, {
          tone: 'success',
          actionLabel: 'התחל עכשיו',
          onAction: () => {
            if (key) void useWorkout.getState().setCurrent(key)
          },
        })
        navigate('/workout', { replace: true })
        return
      }

      if (key) await useWorkout.getState().setCurrent(key)
      navigate('/workout', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  /** "בנה לי אימון" — ארבעה תרגילים לשרירים הטריים, בלחיצה אחת */
  const buildForMe = async (): Promise<void> => {
    if (busy || !rows.length) return
    unlock()
    setBusy(true)
    try {
      const lastAtById = new Map<string, number>()
      for (const [id, entry] of lastPerformed ?? []) lastAtById.set(id, entry.at)
      const chosen = suggestWorkout(rows, exercises, lastAtById, 4, hidden ?? undefined)
      if (!chosen.length) {
        toast('אין תרגילים להציע — אפשר לבחור שריר ידנית', { tone: 'warn' })
        return
      }
      if ((await useWorkout.getState().startWithItems(chosen.map((e) => e.id))) === 'busy') {
        toast('יש כבר אימון פתוח — סיים אותו קודם', { tone: 'warn' })
      }
      navigate('/workout', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  /** חזרה לרשת — ואיתה איפוס הפקדים, שהם ההקשר של השריר שעזבנו */
  const backToGrid = (): void => {
    setGroup(null)
    setQuery('')
    setFilter(NO_MUSCLE_FILTER)
    setSort({ key: 'default', desc: true })
    setEquipment(new Set())
  }

  if (!settings) return null

  const fresh = uncoveredGroups(rows)

  // ── פאזה שנייה: רשימת התרגילים של השריר ────────────────────────────────
  if (group !== null) {
    /*
      עד שרשימת ההסתרות והיסטוריית התרגילים חוזרות אין מה לצייר: רשימה שתופיע
      בלי "קודם 40×8" ותקבל אותו פריים אחר-כך היא בדיוק הקפיצה שמזיזה את
      השורה מתחת לאצבע.
    */
    const ready = hidden !== null && meta !== null

    return (
      <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-safe">
        <header className="flex items-center gap-2 pt-safe pb-1">
          <button
            type="button"
            aria-label="חזרה לרשת השרירים"
            onClick={backToGrid}
            className="relative -ms-1 flex size-[34px] shrink-0 items-center justify-center rounded-[11px] border border-ink-700 bg-ink-900 text-bone-400 after:absolute after:-inset-[5px] after:content-[''] active:bg-ink-800"
          >
            <ChevronRight size={18} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-xl leading-tight font-extrabold text-bone-50">
            {MUSCLE_GROUPS[group].label}
          </h1>
          <SortMenuButton
            sort={sort}
            onSort={setSort}
            equipment={equipment}
            onEquipment={setEquipment}
          />
          <HomeButton className="-me-2" />
        </header>

        {/*
          אותו מתג, אותה סמנטיקה ואותה צורה כמו בבונה ובמסך התרגילים — ובכוונה.
          שני פקדים שנראים אותו דבר ומתנהגים אותו דבר הם פקד אחד שנלמד פעם.
        */}
        <div
          role="group"
          aria-label="אילו תרגילים להציג"
          className="mt-2 flex gap-1 rounded-pill border border-ink-700 bg-ink-900 p-1"
        >
          {(
            [
              { key: 'mine' as const, label: 'שלי' },
              { key: 'all' as const, label: 'הכל' },
            ]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={mode === tab.key}
              onClick={() => setMode(tab.key)}
              className={[
                'min-h-11 flex-1 rounded-pill text-sm font-bold transition-colors',
                mode === tab.key
                  ? 'border border-flame-500/40 bg-flame-500/12 text-flame-300'
                  : 'text-bone-400 active:bg-ink-800',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative my-3">
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
            className="h-12 w-full rounded-card border border-ink-700 bg-ink-950/70 pe-4 ps-11 text-bone-50 outline-none transition-colors placeholder:text-bone-500 focus:border-flame-500/60"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="נקה חיפוש"
              className="absolute inset-y-0 my-auto flex size-11 items-center justify-center rounded-full text-bone-500 active:bg-ink-800"
              style={{ insetInlineEnd: '0.25rem' }}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {ready ? (
          <>
            {/* הקבוצה נבחרה בניווט, ולכן זו הרמה השנייה בלבד — תת-השרירים שלה */}
            <MuscleFilterChips
              options={filterOptions}
              value={active}
              onChange={setFilter}
              fixed
            />
            <EquipmentNote count={noEquipment} />
          </>
        ) : null}

        {!ready ? (
          <div className="flex flex-col gap-[7px]" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-[70px] animate-pulse rounded-2xl bg-ink-900/60" />
            ))}
          </div>
        ) : list.length === 0 ? (
          /*
            מצב אמיתי ולא קישוט: בהתקנה נקייה יד אחורית, בטן או אמות יכולות
            להיות ריקות ב"שלי" לגמרי, וזה בדיוק המסך שנפגוש שם.
          */
          <EmptyState
            title={query ? 'לא נמצא תרגיל' : 'אין תרגילים לשריר הזה'}
            hint={
              mode === 'mine' && otherModeHits > 0
                ? `יש ${otherModeHits} תרגילים לשריר הזה${query ? ` שמתאימים ל"${query}"` : ''} — הם פשוט לא בתרגילים שלך.`
                : query
                  ? `אין תרגיל שמתאים ל"${query}" — לא אצלך ולא במאגר.`
                  : 'אפשר לבחור שריר אחר.'
            }
            action={
              mode === 'mine' && otherModeHits > 0 ? (
                <button
                  type="button"
                  onClick={() => setMode('all')}
                  className="min-h-12 rounded-pill border border-flame-500/40 bg-flame-500/12 px-5 text-sm font-bold text-flame-300"
                >
                  חפש בכל המאגר
                </button>
              ) : (
                <button
                  type="button"
                  onClick={backToGrid}
                  className="btn-ghost flex min-h-12 items-center rounded-pill px-5 text-sm font-bold"
                >
                  שריר אחר
                </button>
              )
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {visible.map(({ sub, items }) => (
              <div key={sub}>
                {visible.length > 1 ? <SubTargetHeading sub={sub} count={items.length} /> : null}
                <ExercisePickList
                  rows={items.map((entry) => rowOf(entry, sub))}
                  onPick={(entry) => void start(entry)}
                  onGallery={setGallery}
                />
              </div>
            ))}
          </div>
        )}

        {/*
          הנגן הוא אח של הרשימה ולא ילד של שורה: מחזור החיים שלו תלוי ב-`gallery`
          בלבד, ולכן שינוי ברשימה מתחתיו לא סוגר אותו באמצע צפייה.
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
      </div>
    )
  }

  // ── פאזה ראשונה: רשת השרירים ───────────────────────────────────────────
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg pb-safe">
      <header className="px-4 pt-safe">
        <div className="flex items-start gap-2">
          <h1 className="min-w-0 flex-1 text-[1.375rem] leading-tight font-extrabold tracking-[-0.02em] text-bone-50">
            {origin === 'workout' ? 'הוסף תרגיל' : 'אימון חופשי'}
          </h1>
          <button
            type="button"
            onClick={() => navigate(leaveTo)}
            className="relative shrink-0 px-1.5 py-2 text-[0.8125rem] font-semibold text-bone-500 after:absolute after:inset-x-0 after:-inset-y-[7px] after:content-['']"
          >
            ביטול
          </button>
          {/* מהבית "ביטול" *הוא* הבית — כפתור שני לאותו יעד היה רעש */}
          {origin === 'workout' ? <HomeButton className="-me-2" /> : null}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-pretty text-bone-500">
          {origin === 'workout'
            ? 'בחר שריר, ואחר כך את התרגיל — מהתרגילים שלך או מכל המאגר.'
            : 'אין תוכנית להיום. בחר שריר, והתור ייבנה תוך כדי.'}
        </p>

        <div className="mt-3.5 flex items-center gap-[7px]">
          <span className="shrink-0 text-[0.625rem] leading-none font-bold tracking-[0.12em] text-bone-500">
            מסודר לפי התאוששות
          </span>
          <span className="h-px flex-1 bg-ink-800" aria-hidden="true" />
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="size-[5px] rounded-full bg-pr-400" aria-hidden="true" />
            <span className="text-[0.625rem] leading-none font-bold text-pr-400">טרי</span>
          </span>
        </div>
      </header>

      <div className="px-3.5 pt-3">
        <MuscleGrid rows={rows} onPick={(row) => setGroup(row.group)} />

        {/*
          המסלול השלישי: לא תוכנית, ולא בחירה ידנית. `suggestWorkout` בוחר
          לרוחב — שריר אחד בכל סיבוב — ולכן ארבעת התרגילים אף פעם לא נופלים
          כולם על אותה קבוצה. באמצע אימון שרץ הוא יורד מהמסך: שם השאלה היא
          "עוד תרגיל אחד", ולא "מה לעשות היום".
        */}
        {origin === 'home' ? (
          <button
            type="button"
            disabled={busy || fresh.length === 0}
            onClick={() => void buildForMe()}
            className="mt-3.5 flex w-full items-start gap-3 rounded-2xl border border-dashed border-ink-700 px-3 py-3 text-start active:border-ink-600 disabled:opacity-50"
          >
            <Wand2 size={17} className="mt-0.5 shrink-0 text-bone-400" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-bone-300">אין לך מושג מה לעשות?</span>
              <span className="mt-1 block text-[0.71875rem] leading-relaxed text-bone-500">
                {fresh.length === 0
                  ? 'עברת על כל השרירים הטריים — בחר שריר מהרשת.'
                  : '"בנה לי אימון" בוחר 4 תרגילים לשרירים הטריים — ואפשר לשנות כל אחד מהם.'}
              </span>
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
