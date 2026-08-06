import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ensureReady } from '@/db/db'
import { useWorkout } from '@/state/activeWorkoutStore'
import { ToastHost } from '@/components/ui'
import { TabBar } from '@/components/shell/TabBar'
import { UpdateBanner } from '@/components/shell/UpdateBanner'
import { HomeScreen } from '@/screens/HomeScreen'
import { WorkoutScreen } from '@/screens/WorkoutScreen'
import { SummaryScreen } from '@/screens/SummaryScreen'
import { HistoryScreen } from '@/screens/HistoryScreen'
import { SessionDetailScreen } from '@/screens/SessionDetailScreen'
import { ExerciseScreen } from '@/screens/ExerciseScreen'
import { ExerciseLibraryScreen } from '@/screens/ExerciseLibraryScreen'
import { StatsScreen } from '@/screens/StatsScreen'
import { SettingsScreen } from '@/screens/settings/SettingsScreen'
import { ExerciseCatalogScreen } from '@/screens/settings/ExerciseCatalogScreen'
import { ExerciseEditorScreen } from '@/screens/settings/ExerciseEditorScreen'
import { PlanEditorScreen } from '@/screens/settings/PlanEditorScreen'
import { MediaScreen } from '@/screens/settings/MediaScreen'
import { BackupScreen } from '@/screens/settings/BackupScreen'

/** המסכים שבהם מוצג סרגל הניווט התחתון. באימון פעיל הוא נעלם. */
const TAB_ROUTES = ['/', '/history', '/stats', '/settings']

function Shell() {
  const { pathname } = useLocation()
  const showTabs = TAB_ROUTES.includes(pathname)

  // גלילה לראש בכל מעבר מסך — בלי זה חוזרים לאמצע הרשימה
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <UpdateBanner />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/workout" element={<WorkoutScreen />} />
        <Route path="/summary/:sessionId" element={<SummaryScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/history/:sessionId" element={<SessionDetailScreen />} />
        <Route path="/exercises" element={<ExerciseLibraryScreen />} />
        <Route path="/exercise/:exerciseId" element={<ExerciseScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/settings/exercises" element={<ExerciseCatalogScreen />} />
        <Route path="/settings/exercises/:exerciseId" element={<ExerciseEditorScreen />} />
        <Route path="/settings/plans" element={<PlanEditorScreen />} />
        <Route path="/settings/media" element={<MediaScreen />} />
        <Route path="/settings/backup" element={<BackupScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showTabs && <TabBar />}
      <ToastHost />
    </>
  )
}

export function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hydrate = useWorkout((s) => s.hydrate)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureReady()
        await hydrate()
        if (!cancelled) setReady(true)
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'לא הצלחתי לפתוח את מסד הנתונים המקומי'
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrate])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-lg font-bold text-hard-400">משהו השתבש בפתיחת האפליקציה</p>
        <p className="text-sm text-bone-400">{error}</p>
        <p className="text-xs text-bone-600">
          אם זה חוזר, נסה לסגור את האפליקציה ולפתוח מחדש. הנתונים שמורים במכשיר.
        </p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-flame-500/30" />
      </div>
    )
  }

  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
