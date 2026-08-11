import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Search, X } from 'lucide-react'
import { LIBRARY_CATALOG, LIBRARY_COUNT } from '@/db/libraryManifest'
import type { LibraryExercise } from '@/db/libraryManifest'
import type { MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS, MUSCLE_GROUP_BY_SIZE } from '@/db/types'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { EmptyState } from '@/components/ui'
import { VideoThumb } from '@/components/media/VideoThumb'
import { normalize } from '@/lib/text'

/**
 * מאגר התרגילים — שכבת הלימוד.
 *
 * זה לא הקטלוג של תבור. הקטלוג ("כל התרגילים") הוא מה שהוא מתאמן בו, עם משקלים
 * והיסטוריה; כאן יושבים 62 תרגילים מיוצר תוכן, כולל כאלה שהוא לא עושה, ורק כדי
 * ללמוד איך מבצעים אותם ואילו טעויות להימנע מהן.
 *
 * הפרדה מלאה בכוונה: לו התרגילים האלה היו נכנסים לקטלוג, הם היו משתלטים על
 * בחירת תרגיל באימון ועל הסטטיסטיקות — 62 תרגילים בלי היסטוריה מול 28 עם.
 */

export function LibraryScreen(): JSX.Element {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = normalize(query)
    const byGroup = new Map<MuscleGroup, LibraryExercise[]>()

    for (const ex of LIBRARY_CATALOG) {
      const hit =
        !q ||
        normalize(ex.nameHe).includes(q) ||
        normalize(ex.nameEn).includes(q) ||
        normalize(MUSCLE_GROUPS[ex.muscleGroup].label).includes(q)
      if (!hit) continue
      const list = byGroup.get(ex.muscleGroup)
      if (list) list.push(ex)
      else byGroup.set(ex.muscleGroup, [ex])
    }

    return MUSCLE_GROUP_BY_SIZE.filter((g) => byGroup.has(g)).map((group) => ({
      group,
      // הכי הרבה חומר קודם — שם גם התרגילים המרכזיים
      list: (byGroup.get(group) ?? []).sort(
        (a, b) => b.totalAvailable - a.totalAvailable || a.nameHe.localeCompare(b.nameHe, 'he')
      ),
    }))
  }, [query])

  const total = groups.reduce((n, g) => n + g.list.length, 0)

  return (
    <Screen>
      <ScreenHeader
        title="מאגר תרגילים"
        subtitle={`${LIBRARY_CATALOG.length} תרגילים · ${LIBRARY_COUNT} סרטוני הסבר`}

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
          placeholder="חיפוש תרגיל או שריר"
          aria-label="חיפוש במאגר"
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

      {total === 0 ? (
        <EmptyState
          title="לא נמצא תרגיל"
          hint={`אין במאגר תרגיל שמתאים ל"${query}".`}
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
                {list.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => navigate(`/library/${ex.id}`)}
                    className="flex w-full items-center gap-3 p-3 text-start transition-colors active:bg-ink-800"
                  >
                    {/* השורה כולה נלחצת — התמונה דקורטיבית ולא כפתור בתוך כפתור */}
                    <VideoThumb exerciseId={ex.id} size="sm" />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.9375rem] font-bold text-bone-50">
                        {ex.nameHe}
                      </span>
                      {/* dir=ltr לריצת הטקסט, היישור נשאר לקצה של השורה העברית */}
                      <span
                        dir="ltr"
                        className="mt-0.5 block truncate text-end text-[0.6875rem] font-semibold text-bone-500"
                      >
                        {ex.nameEn}
                      </span>
                    </span>

                    <span className="meta tnum shrink-0">
                      {ex.videos.length} סרטונים
                    </span>

                    <ChevronLeft size={18} className="shrink-0 text-bone-600" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Screen>
  )
}
