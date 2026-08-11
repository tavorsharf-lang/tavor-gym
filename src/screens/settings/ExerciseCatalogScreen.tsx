import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Film, Plus, Search, SearchX, X } from 'lucide-react'
import { db } from '@/db/db'
import { getAllExercises } from '@/db/queries'
import { bundledVideosFor, mediaDb } from '@/db/mediaDb'
import { useHiddenVideoIds } from '@/db/hiddenVideos'
import { DEFAULT_REST_SECONDS, DEFAULT_TARGET_SETS } from '@/db/seed'
import type { Exercise, MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS, MUSCLE_GROUP_ORDER, WEIGHT_MODE_LABELS } from '@/db/types'
import { newId } from '@/domain/units'
import { distinguisher, duplicateNames } from '@/domain/naming'
import { Screen, ScreenHeader } from '@/components/shell/ScreenHeader'
import { Button, EmptyState, toast } from '@/components/ui'
import { normalize } from '@/lib/text'

/**
 * קטלוג התרגילים — הרשימה המלאה, כולל תרגילים כבויים.
 *
 * תרגיל כבוי לא נמחק אלא יורד לתחתית הקבוצה ומתעמעם: ההיסטוריה שלו עדיין
 * צריכה את השם שלו.
 */

export function ExerciseCatalogScreen(): JSX.Element {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const hidden = useHiddenVideoIds()

  const exercises = useLiveQuery(() => getAllExercises(true), [], [])

  // סופרים רק סרטונים שיובאו — המצורפים מגיעים מהמניפסט ולא מהמסד, וספירה
  // של שניהם מהמסד הייתה מונה כל סרטון מותקן פעמיים.
  const importedCounts = useLiveQuery(
    async () => {
      const counts = new Map<string, number>()
      await mediaDb.videos.each((v) => {
        if (v.origin !== 'imported') return
        counts.set(v.exerciseId, (counts.get(v.exerciseId) ?? 0) + 1)
      })
      return counts
    },
    [],
    new Map<string, number>()
  )

  const duplicates = useMemo(() => duplicateNames(exercises), [exercises])

  const groups = useMemo(() => {
    const q = normalize(query)
    const byGroup = new Map<MuscleGroup, Exercise[]>()
    for (const ex of exercises) {
      const hit =
        !q ||
        normalize(ex.name).includes(q) ||
        normalize(ex.nameEn ?? '').includes(q) ||
        normalize(ex.subTarget).includes(q)
      if (!hit) continue
      const list = byGroup.get(ex.muscleGroup)
      if (list) list.push(ex)
      else byGroup.set(ex.muscleGroup, [ex])
    }
    return MUSCLE_GROUP_ORDER.filter((g) => byGroup.has(g)).map((group) => ({
      group,
      items: (byGroup.get(group) ?? []).sort(
        (a, b) => Number(b.isActive) - Number(a.isActive) || a.order - b.order
      ),
    }))
  }, [exercises, query])

  const createExercise = async (): Promise<void> => {
    const now = Date.now()
    const maxOrder = exercises.reduce((max, e) => Math.max(max, e.order), -1)
    const exercise: Exercise = {
      id: newId('ex-'),
      name: 'תרגיל חדש',
      nameEn: '',
      muscleGroup: 'chest',
      subTarget: '',
      equipment: 'machine',
      weightMode: 'total',
      weightIncrementKg: 2.5,
      defaultRestSeconds: DEFAULT_REST_SECONDS,
      targetSets: DEFAULT_TARGET_SETS,
      targetReps: { min: 8, max: 12 },
      cues: [],
      usesPlates: false,
      barWeightKg: null,
      seedWeightKg: null,
      isActive: true,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    }
    try {
      await db.exercises.put(exercise)
      navigate(`/settings/exercises/${exercise.id}`)
    } catch {
      toast('לא הצלחתי ליצור תרגיל חדש', { tone: 'warn' })
    }
  }

  return (
    <Screen dock={false}>
      <ScreenHeader
        title="קטלוג התרגילים"
        subtitle={`${exercises.length} תרגילים`}
        fallback="/settings"
      />

      <div className="relative mb-3">
        <Search
          size={18}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-bone-600"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חפש תרגיל"
          aria-label="חיפוש בקטלוג"
          enterKeyHint="search"
          className="h-12 w-full rounded-2xl border border-ink-700 bg-ink-850 ps-10 pe-11 text-bone-50 placeholder:text-bone-500 focus:border-flame-500/50 focus:outline-none"
        />
        {query.length > 0 ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="נקה חיפוש"
            className="absolute end-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-bone-500 active:bg-ink-800"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <Button
        variant="flame"
        size="md"
        fullWidth
        className="mb-5"
        icon={<Plus size={20} strokeWidth={3} />}
        onClick={() => void createExercise()}
      >
        תרגיל חדש
      </Button>

      {groups.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="אין תרגיל בשם הזה"
          hint="נסה מילה חלקית, או את השם באנגלית. אפשר גם פשוט להוסיף אותו."
        />
      ) : (
        groups.map(({ group, items }) => (
          <section key={group} className="mb-5">
            <h2 className="meta mb-2 px-1">{MUSCLE_GROUPS[group].label}</h2>
            <div className="card divide-y divide-ink-800/70 overflow-hidden">
              {items.map((ex) => {
                const videos =
                  bundledVideosFor(ex.id, undefined, hidden).length +
                  (importedCounts.get(ex.id) ?? 0)
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => navigate(`/settings/exercises/${ex.id}`)}
                    className={[
                      'flex min-h-16 w-full items-center gap-2.5 px-4 py-3 text-start transition-colors active:bg-ink-800/60',
                      ex.isActive ? '' : 'opacity-45',
                    ].join(' ')}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-bone-50">{ex.name}</span>
                        {!ex.isActive ? (
                          <span className="shrink-0 rounded-pill border border-ink-600 px-2 py-0.5 text-[0.625rem] font-bold text-bone-500">
                            כבוי
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block truncate text-xs text-bone-500">
                        {ex.subTarget ? `${ex.subTarget} · ` : ''}
                        {WEIGHT_MODE_LABELS[ex.weightMode]}
                        {/* שם כפול בקטלוג הוא בכוונה — המשקל הוא מה שמפריד */}
                        {distinguisher(ex, duplicates) ? ` · ${distinguisher(ex, duplicates)}` : ''}
                      </span>
                    </span>

                    {videos > 0 ? (
                      <span
                        className="flex shrink-0 items-center gap-1 rounded-pill border border-ink-700 bg-ink-850 px-2 py-1 text-[0.6875rem] font-bold text-bone-400"
                        title={`${videos} סרטונים`}
                      >
                        <Film size={12} aria-hidden="true" />
                        <span className="tnum">{videos}</span>
                      </span>
                    ) : null}

                    <ChevronLeft size={18} className="shrink-0 text-bone-600" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </section>
        ))
      )}
    </Screen>
  )
}
