import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Search, X } from 'lucide-react'
import { getAllExercises, getLastPerformedMap } from '@/db/queries'
import type { Exercise, MuscleGroup } from '@/db/types'
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, MUSCLE_GROUP_BY_SIZE } from '@/db/types'
import { formatSetShort } from '@/domain/units'
import { distinguisher, duplicateNames } from '@/domain/naming'
import { formatRelativeDay } from '@/lib/dates'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { EmptyState } from '@/components/ui'
import { VideoThumb } from '@/components/media/VideoThumb'

/**
 * ספריית התרגילים — כל מה שאפשר לעשות בחדר, במקום אחד.
 *
 * מסודר מהשריר הגדול לקטן, כי ככה גם בונים אימון וככה קל לסרוק.
 *
 * השם באנגלית יושב כשורה שנייה קטנה מתחת לעברי. הוא מה שכתוב על המדבקה של
 * המכונה ומה שמחפשים בו סרטון, והוא זה שמפריד בין "לחיצת חזה במכונה" אחת
 * לשנייה. כשגם הוא זהה — שתי החתירות — המשקל בשורת המשנה עושה את ההפרדה.
 *
 * כל שורה מראה גם כמה הרמת בפעם האחרונה, כי זו השאלה שבשבילה נכנסים לכאן.
 */

function normalize(text: string): string {
  return text.toLowerCase().replace(/[״׳"']/g, '').trim()
}

export function ExerciseLibraryScreen(): JSX.Element {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const exercises = useLiveQuery(() => getAllExercises(true), [], [])
  const lastPerformed = useLiveQuery(() => getLastPerformedMap(), [], new Map())

  // מחושב על כל הקטלוג ולא על תוצאות החיפוש — תרגיל לא משנה זהות לפי מה שהוקלד
  const duplicates = useMemo(() => duplicateNames(exercises), [exercises])

  const groups = useMemo(() => {
    const q = normalize(query)
    const byGroup = new Map<MuscleGroup, Exercise[]>()

    for (const ex of exercises) {
      const hit =
        !q ||
        normalize(ex.name).includes(q) ||
        normalize(ex.nameEn ?? '').includes(q) ||
        normalize(ex.subTarget).includes(q) ||
        normalize(MUSCLE_GROUPS[ex.muscleGroup].label).includes(q)
      if (!hit) continue
      const list = byGroup.get(ex.muscleGroup)
      if (list) list.push(ex)
      else byGroup.set(ex.muscleGroup, [ex])
    }

    return MUSCLE_GROUP_BY_SIZE.filter((g) => byGroup.has(g)).map((group) => ({
      group,
      // תרגילים כבויים יורדים לתחתית הקבוצה במקום להיעלם
      list: (byGroup.get(group) ?? []).sort(
        (a, b) => Number(b.isActive) - Number(a.isActive) || a.order - b.order
      ),
    }))
  }, [exercises, query])

  const total = groups.reduce((n, g) => n + g.list.length, 0)

  return (
    <Screen>
      <ScreenHeader
        title="כל התרגילים"
        subtitle={`${exercises.length} תרגילים · לפי קבוצת שריר`}
        onBack={() => navigate('/')}
      />

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
          placeholder="חיפוש תרגיל, שריר או מיקוד"
          aria-label="חיפוש תרגיל"
          className="h-13 w-full rounded-card border border-ink-700 bg-ink-900/70 pe-4 ps-11 text-bone-50 outline-none transition-colors placeholder:text-bone-600 focus:border-flame-500/60"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="נקה חיפוש"
            className="absolute inset-y-0 my-auto flex size-9 items-center justify-center rounded-full text-bone-500 active:bg-ink-800"
            style={{ insetInlineEnd: '0.5rem' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {total === 0 ? (
        <EmptyState
          title="לא נמצא תרגיל"
          hint={`אין תרגיל שמתאים ל"${query}". אפשר להוסיף תרגיל חדש בהגדרות ← קטלוג התרגילים.`}
        />
      ) : (
        <div className="space-y-7">
          {groups.map(({ group, list }) => (
            <section key={group} className="animate-rise">
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-sm font-extrabold text-bone-200">
                  {MUSCLE_GROUPS[group].label}
                </h2>
                <span className="meta">{list.length}</span>
              </div>

              <div className="card divide-y divide-ink-800/70 overflow-hidden">
                {list.map((ex) => {
                  const last = lastPerformed.get(ex.id)
                  const apart = distinguisher(ex, duplicates)
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => navigate(`/exercise/${ex.id}`)}
                      className={`flex w-full items-center gap-3 p-3 text-start transition-colors active:bg-ink-800 ${
                        ex.isActive ? '' : 'opacity-45'
                      }`}
                    >
                      <VideoThumb
                        exerciseId={ex.id}
                        libraryId={ex.libraryId}
                        size="sm"
                        onOpen={() => navigate(`/exercise/${ex.id}`)}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem] font-bold text-bone-50">
                          {ex.name}
                        </span>
                        {ex.nameEn ? (
                          // dir=ltr לריצת הטקסט, אבל היישור נשאר לקצה ההתחלתי
                          // של השורה העברית — אחרת השם קופץ לקצה הנגדי ומתנתק
                          // מהשם שהוא אמור לתייג
                          <span
                            dir="ltr"
                            className="mt-0.5 block truncate text-end text-[0.6875rem] font-semibold text-bone-500"
                          >
                            {ex.nameEn}
                          </span>
                        ) : null}
                        {/*
                          המבדיל יושב מחוץ למחרוזת הקטומה ובלי shrink. כשהוא היה
                          בסוף שורה אחת קטומה, דווקא הוא היה נחתך — ובשתי שורות
                          בעלות אותו שם זה בדיוק מה שצריך להישאר על המסך.
                        */}
                        <span className="meta mt-0.5 flex items-baseline gap-1.5">
                          {apart ? (
                            <span className="shrink-0 font-bold text-bone-400">{apart}</span>
                          ) : null}
                          <span className="truncate">
                            {ex.subTarget} · {EQUIPMENT_LABELS[ex.equipment]}
                            {ex.isActive ? '' : ' · כבוי'}
                          </span>
                        </span>
                      </span>

                      <span className="shrink-0 text-end">
                        {last ? (
                          <>
                            <span
                              dir="ltr"
                              className="tnum block text-sm font-extrabold text-bone-200"
                            >
                              {formatSetShort(last.weightKg, last.reps, ex.weightMode)}
                            </span>
                            <span className="meta mt-0.5 block">{formatRelativeDay(last.at)}</span>
                          </>
                        ) : (
                          <span className="meta">עוד לא בוצע</span>
                        )}
                      </span>

                      <ChevronLeft size={18} className="shrink-0 text-bone-600" />
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </Screen>
  )
}
