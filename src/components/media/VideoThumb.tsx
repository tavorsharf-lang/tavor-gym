import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { assetUrl, bundledVideosFor, loadThumbnailFor } from '@/db/mediaDb'
import { peekHiddenVideoIds, useHiddenVideosVersion } from '@/db/hiddenVideos'
import { peekVideoPrefs, useVideoPrefsVersion } from '@/db/videoPrefs'

/**
 * התמונה הממוזערת של סרטון ההדגמה, כפי שהיא מופיעה בכרטיס התרגיל.
 * לחיצה פותחת את הנגן. אם אין סרטון — לא מציגים כלום.
 *
 * בלי `onOpen` היא מרונדרת כ-span ולא כ-button, וזה הכרחי ולא סגנוני: ברשימות
 * התרגילים כל שורה היא כפתור בעצמה, וכפתור מקונן היה מפעיל את שני המטפלים
 * בלחיצה אחת — שתי רשומות היסטוריה זהות, ו"חזרה" ראשונה שנראית כאילו לא עשתה
 * כלום. זה גם HTML לא חוקי שקורא-מסך מכריז כשני פקדים.
 */
/** אותה רשת בדיוק כמו ב-`ExerciseThumb` — שני הרכיבים מחליפים זה את זה */
const BOX = {
  row: 'h-[34px] w-[34px]',
  xs: 'h-10 w-10',
  card: 'h-[46px] w-[46px]',
  sm: 'h-14 w-14',
  md: 'h-20 w-20',
} as const

export function VideoThumb({
  exerciseId,
  libraryId,
  onOpen,
  size = 'md',
  keepFrame = false,
}: {
  exerciseId: string
  /** התרגיל המקביל במאגר — כדי שגם תרגיל בלי הדגמה משלו יציג תמונה */
  libraryId?: string
  /** חסר = התמונה דקורטיבית, והשורה שמסביבה היא זו שנלחצת */
  onOpen?: () => void
  /** xs לשורות צפופות — חייב להתקיים גם כאן, אחרת שורה בלי כרטיס שרירים
   *  מקבלת ריבוע גדול יותר משכנותיה וגובה השורה קופץ */
  /**
   * ‏`row` ו-`card` הם שני גדלים נעוצים לרשת של מסך האימון (34 ו-46), להבדיל
   * מהסולם הכללי. הם קיימים כדי ששורת התור והכרטיס הפעיל יישבו על הגובה
   * שנמדד להם, בלי להזיז אף ריבוע אחר באפליקציה.
   */
  size?: 'row' | 'xs' | 'card' | 'sm' | 'md'
  /**
   * שומר על התיבה גם כשאין תמונה.
   *
   * ברשימה ארוכה זה ההבדל בין שורות בגובה אחיד לשורות שקופצות: תמונות המאגר
   * אינן ב-precache, ולכן אופליין הן נכשלות ושורה מאבדת את התיבה כולה ולא רק
   * את התוכן שלה. `useScrollMemory` נלחם בדיוק בשינויי הגובה האלה בלולאת
   * ה-settle. במסך יחיד זה לא מורגש, ולכן זו בחירה של הקורא ולא ברירת מחדל.
   */
  keepFrame?: boolean
}) {
  /*
    הפוסטר מהמניפסט מוצג *מיד*, בלי להמתין ל-IndexedDB.

    כל שורה ברשימה הריצה שאילתה נפרדת ורנדרה ריק עד שהיא חזרה — בספריית המאגר
    אלה עשרות שאילתות מקבילות, וכל תשובה שחוזרת קופצת פנימה ומזיזה את הגובה.
    זו בדיוק קפיצת הגובה ש-useScrollMemory נאלץ להילחם בה בלולאת settle.
    הנתיב ידוע סינכרונית, והתמונה ממילא ב-precache — אין סיבה להמתין.
  */
  const staticPoster = (id: string, libId?: string): string | null => {
    // ההצצה מונעת הבלחה של סרטון שנמחק; לפני שהרשימה נטענה מוותרים על הקיצור
    const hidden = peekHiddenVideoIds()
    if (hidden === null) return null
    // הסדר המותאם קובע גם את התמונה — "הסרטון הראשון" הוא החלטה של המשתמש
    const first = bundledVideosFor(id, libId, hidden, peekVideoPrefs())[0]
    return first ? assetUrl(first.poster) : null
  }

  const [url, setUrl] = useState<string | null>(() => staticPoster(exerciseId, libraryId))
  // מחיקת הסרטון האחרון של תרגיל צריכה להעלים את התמונה מיד, בלי רענון מסך
  const hiddenVersion = useHiddenVideosVersion()
  // וגם שינוי סדר או העברה — התמונה עוקבת אחרי "מי ראשון עכשיו"
  const prefsVersion = useVideoPrefsVersion()
  // ה-blob המקומי נוצר רק כשצריך אותו, ולכן הניקוי שלו חי מחוץ ל-effect
  const blobRef = useRef<string | null>(null)

  const releaseBlob = (): void => {
    if (blobRef.current?.startsWith('blob:')) URL.revokeObjectURL(blobRef.current)
    blobRef.current = null
  }

  /*
    ‏IndexedDB נקרא רק כשאין פוסטר סטטי, או כשהפוסטר נכשל.

    ‏`loadThumbnailFor` מסתיים בשני מקרים ב-`assetUrl(poster)` — בדיוק המחרוזת
    שכבר חושבה כאן סינכרונית. כלומר עבור שורה עם סרטון מצורף הקריאה
    האסינכרונית לא מוסיפה כלום *כשהרשת עובדת*, ומצד שני היא מושכת רשומת וידאו
    שלמה: סכמת המדיה היא `videos: 'id, exerciseId, origin'` בלי projection, ולכן
    כל `get` גורר את ה-Blob של הסרטון. ברשימה המאוחדת אלה 76 שורות, וב-
    StrictMode 152.

    לכן: הפוסטר הסטטי מוצג מיד, וה-blob המקומי נטען רק בנתיב שבו הוא באמת
    התשובה היחידה — תרגיל בלי סרטון מצורף, או `onError` של פוסטר שלא נטען
    (בדיוק המצב האופליין שבשבילו ה-blob נשמר מלכתחילה).
  */
  const cancelRef = useRef<(() => void) | null>(null)
  // מונע לולאה: פוסטר שנכשל לא יוגש שוב כתשובה ל-onError של עצמו
  const triedLocal = useRef(false)

  const loadLocal = (blobOnly: boolean): void => {
    if (triedLocal.current) return
    triedLocal.current = true
    let cancelled = false
    cancelRef.current = () => {
      cancelled = true
    }
    void loadThumbnailFor(exerciseId, libraryId).then((u) => {
      const usable = blobOnly && !u?.startsWith('blob:') ? null : u
      if (cancelled || usable !== u) {
        if (u?.startsWith('blob:')) URL.revokeObjectURL(u)
        if (cancelled) return
      }
      releaseBlob()
      blobRef.current = usable
      setUrl(usable)
    })
  }

  useEffect(() => {
    releaseBlob()
    triedLocal.current = false
    const poster = staticPoster(exerciseId, libraryId)
    setUrl(poster)
    if (!poster) loadLocal(false)
    return () => {
      cancelRef.current?.()
      cancelRef.current = null
      releaseBlob()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, libraryId, hiddenVersion, prefsVersion])

  const box = BOX[size]

  if (!url) {
    if (!keepFrame) return null
    return (
      <span
        className={`shrink-0 rounded-xl border border-ink-800 bg-ink-900/60 ${box}`}
        aria-hidden="true"
      />
    )
  }

  const inner = (
    <>
      {/*
        תמונות המאגר אינן ב-precache (6.9MB), ולכן אופליין הן פשוט לא נטענות.
        בלי onError הדפדפן היה מצייר ריבוע תמונה שבורה בכל שורה — גרוע יותר
        משורה בלי תמונה בכלל.

        זו גם הנקודה שבה שווה לשלם על קריאת IndexedDB: הפוסטר נכשל, ולכן
        ה-blob המקומי הוא באמת התשובה היחידה. כשהוא לא קיים — התמונה נעלמת
        כמו קודם.
      */}
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => {
          if (triedLocal.current) setUrl(null)
          else loadLocal(true)
        }}
      />
      <span className="absolute inset-0 flex items-center justify-center bg-ink-950/35">
        <Play
          size={size === 'md' ? 20 : size === 'sm' || size === 'card' ? 16 : 12}
          className="text-bone-50 drop-shadow"
          fill="currentColor"
        />
      </span>
    </>
  )
  const frame = `relative shrink-0 overflow-hidden rounded-xl border border-ink-700 ${box}`

  if (!onOpen) {
    return (
      <span className={frame} aria-hidden="true">
        {inner}
      </span>
    )
  }

  return (
    <button
      onClick={onOpen}
      aria-label="פתח סרטון הדגמה"
      className={`${frame} active:scale-95 transition-transform`}
    >
      {inner}
    </button>
  )
}
