import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { db, ensureReady } from '@/db/db'
import { isFirstRun, markFirstRunSeen } from '@/db/firstRun'
import { repairAssetOrigins, repairReplacedBundled } from '@/db/mediaDb'
import { loadHiddenVideoIds } from '@/db/hiddenVideos'
import { loadVideoPrefs } from '@/db/videoPrefs'
import { loadHiddenExerciseIds } from '@/db/hiddenExercises'
import { loadMuscleFixes } from '@/db/muscleFixes'
import { useWorkout } from '@/state/activeWorkoutStore'
import { useScrollMemory } from '@/hooks/useScrollMemory'
import { useColdLaunchHome } from '@/hooks/useColdLaunchHome'
import { ensurePersisted } from '@/hooks/useStorageStatus'
import { ToastHost } from '@/components/ui'
import { TabBar } from '@/components/shell/TabBar'
import { UpdateBanner } from '@/components/shell/UpdateBanner'
import { WelcomeScreen } from '@/screens/WelcomeScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { BuilderScreen } from '@/screens/BuilderScreen'
import { FreestyleScreen } from '@/screens/FreestyleScreen'
import { BuilderMuscleScreen } from '@/screens/BuilderMuscleScreen'
import { WorkoutScreen } from '@/screens/WorkoutScreen'
import { SummaryScreen } from '@/screens/SummaryScreen'
import { HistoryScreen } from '@/screens/HistoryScreen'
import { SessionDetailScreen } from '@/screens/SessionDetailScreen'
import { ExerciseScreen } from '@/screens/ExerciseScreen'
import { ExerciseLibraryScreen } from '@/screens/ExerciseLibraryScreen'
import { LibraryExerciseScreen } from '@/screens/LibraryExerciseScreen'
import { StatsScreen } from '@/screens/StatsScreen'
import { SettingsScreen } from '@/screens/settings/SettingsScreen'
import { ExerciseEditorScreen } from '@/screens/settings/ExerciseEditorScreen'
import { PlanEditorScreen } from '@/screens/settings/PlanEditorScreen'
import { MediaScreen } from '@/screens/settings/MediaScreen'
import { BackupScreen } from '@/screens/settings/BackupScreen'

/** המסכים שבהם מוצג סרגל הניווט התחתון. באימון פעיל הוא נעלם. */
const TAB_ROUTES = ['/', '/history', '/stats', '/settings']

function Shell() {
  /*
    כל ההוקים כאן, מעל ה-return המוקדם של מסך הפתיחה — וזה לא סגנון.

    ‏`done` הופך את `welcome` מ-true ל-false על אותו מופע Shell, ולכן הוק
    שיישב מתחת ל-return היה עובר מ"לא נקרא" ל"נקרא" בין שני רינדורים. React
    זורק על זה "Rendered more hooks than during the previous render" — בדיוק
    בלחיצה היחידה שכל הזרימה הזו קיימת בשבילה.
  */
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // מסך חדש נפתח מלמעלה, חזרה אחורה חוזרת למקום שבו היינו
  useScrollMemory()
  // פתיחה קרה של האפליקציה המותקנת נוחתת בבית ולא בפרגמנט שנלכד בהתקנה
  useColdLaunchHome()

  const [welcome, setWelcome] = useState(false)
  useEffect(() => {
    /*
      השער הסינכרוני קודם, ובכוונה: אצל מי שכבר משתמש באפליקציה המפתח אינו
      'new', ולכן המכשיר שלו אפילו לא שולח את ספירת האימונים. ספירת האימונים
      היא החגורה השנייה — מסד שנזרע זה עתה אבל כבר יש בו היסטוריה הוא סימן
      שמשהו לא צפוי קרה, ואז עדיף לא להציג כלום.
    */
    if (!isFirstRun()) return
    void (async () => {
      if ((await db.sessions.count()) === 0) setWelcome(true)
    })()
  }, [])

  const finishWelcome = (to: string): void => {
    markFirstRunSeen()
    setWelcome(false)
    /*
      ‏`ensurePersisted` כאן הוא תיקון תזמון אמיתי: הקריאה האוטומטית היחידה
      עד היום הייתה בסוף אימון שלם, בזמן שהכתיבה הגדולה ביותר של משתמש חדש —
      "התקן סרטונים למכשיר" — לא ביקשה קביעות בכלל. בלשונית זה מחזיר false
      ולא עולה כלום; באפליקציה מותקנת ספארי מאשרת בשקט בלי דיאלוג.
    */
    void ensurePersisted()
    // הניווט מנקה גם פרגמנט ש"הוסף למסך הבית" לכד לפני שהמסך נסגר
    navigate(to, { replace: true })
  }

  if (welcome) {
    return (
      <>
        <WelcomeScreen onDone={finishWelcome} />
        <ToastHost />
      </>
    )
  }

  const showTabs = TAB_ROUTES.includes(pathname)

  return (
    <>
      <UpdateBanner />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/workout" element={<WorkoutScreen />} />
        <Route path="/summary/:sessionId" element={<SummaryScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/history/:sessionId" element={<SessionDetailScreen />} />
        <Route path="/freestyle" element={<FreestyleScreen />} />
        <Route path="/builder" element={<BuilderScreen />} />
        <Route path="/builder/:muscleGroup" element={<BuilderMuscleScreen />} />
        <Route path="/exercises" element={<ExerciseLibraryScreen />} />
        <Route path="/exercise/:exerciseId" element={<ExerciseScreen />} />
        {/*
          ‏/library נשאר חי ומרנדר את אותו מסך במצב "הכל". הנתיב מוזכר
          כ-fallback בשני מקומות במסך תרגיל המאגר, ו-`path="*"` כאן מנווט
          הביתה בשקט — כלומר קישור מיותם לא מייצר שגיאה אלא נחיתה מבלבלת.
        */}
        <Route path="/library" element={<ExerciseLibraryScreen initialMode="all" />} />
        <Route path="/library/:libId" element={<LibraryExerciseScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        {/*
          קטלוג התרגילים שבהגדרות היה עותק שלישי של אותה רשימה, וההבדל היחיד
          היה שהשורות הובילו לעורך במקום למסך התרגיל — מרחק של לחיצה אחת דרך
          "ערוך". הוא נמחק, והנתיב נשאר כהפניה: מחיקת תרגיל בעורך מנווטת לכאן,
          וגם כפתור "לקטלוג" במצב "תרגיל לא נמצא".
        */}
        <Route path="/settings/exercises" element={<Navigate to="/exercises" replace />} />
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
        /*
          מחמם את רשימת הסרטונים המוסתרים לפני הרינדור הראשון.

          `VideoThumb` מציג את הפוסטר מהמניפסט סינכרונית, אבל רק אם
          `peekHiddenVideoIds()` כבר יודע מה נמחק — אחרת הוא מוותר על הקיצור
          וכל שורה מתחילה ריקה וקופצת כשהתשובה חוזרת. עד כאן שום דבר לא חימם
          את המטמון ב-boot, ולכן פתיחה קרה ישר על רשימת תרגילים החזירה את
          קפיצת הגובה ש-`useScrollMemory` נאלץ להילחם בה.
        */
        await loadHiddenVideoIds()
        // ומאותה סיבה בדיוק — גם סדר הסרטונים והעברות: בלי החימום, הפוסטר
        // בקימה קרה מחושב לפי סדר המניפסט ומציג סרטון שהמשתמש העביר או הזיז
        await loadVideoPrefs()
        // ומאותה סיבה — התרגילים המוסתרים: בלי החימום שורה מוסתרת מבליחה ונעלמת
        await loadHiddenExerciseIds()
        // ומאותה סיבה — תיקוני שיוך השריר: בלי החימום השורה מרונדרת תחת
        // הכותרת שהמשתמש כבר תיקן, וקופצת לכותרת הנכונה פריים אחר-כך
        await loadMuscleFixes()
        if (!cancelled) setReady(true)
        // אחרי שהמסך כבר עולה — אלה תיקונים של מדיה ישנה ולא תנאי לפתיחה
        void repairReplacedBundled()
        void repairAssetOrigins()
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
        <p className="text-xs text-bone-500">
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
