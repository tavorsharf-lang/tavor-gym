import Dexie, { type Table } from 'dexie'
import type {
  ActiveWorkout,
  AppSettings,
  BodyWeightEntry,
  Block,
  Exercise,
  ExerciseRating,
  PersonalRecord,
  PlanItem,
  Routine,
  Session,
  SetLog,
  SettingsRow,
} from './types'
import {
  DEFAULT_REPS,
  DEFAULT_REST_SECONDS,
  DEFAULT_SETS,
  DEFAULT_SETTINGS,
  DEFAULT_TARGET_SETS,
  PLANK_RANGE,
  // ‏SEED_ROUTINES נשאר מיובא בשביל מיגרציה 2 בלבד — היא כותבת את F1/F2 עם
  // משקלי ההתחלה של תבור, והיא לא יכולה לרוץ על מסד בגרסה 12.
  SEED_ROUTINES,
  freshSeedBlocks,
  freshSeedExercises,
  freshSeedRoutines,
} from './seed'
import { CATALOG_FIXES_V5, CATALOG_FIXES_V10, CATALOG_FIXES_V11, applyCatalogFix } from './catalogFix'
import { markFirstRun, markFirstRunSeen } from './firstRun'
import { withLibraryLink } from './libraryLinks'
import { withSecondaryMuscles } from './muscleTags'
import { mergeCalfShelves, withoutCalves } from './calfMerge'
import { withInclineBench, withV10Fields } from './catalogV10'

/**
 * מסד הנתונים המובנה.
 *
 * הסרטונים יושבים ב-DB נפרד (mediaDb.ts) בכוונה: כתיבה של Blob של כמה
 * מגה-בייט לא מעירה שום liveQuery כאן, ייצוא נתונים לא גורר וידאו בזיכרון,
 * ומיגרציית סכמה לא נוגעת במדיה.
 */
class GymDatabase extends Dexie {
  exercises!: Table<Exercise, string>
  routines!: Table<Routine, string>
  blocks!: Table<Block, string>
  sessions!: Table<Session, string>
  setLogs!: Table<SetLog, number>
  ratings!: Table<ExerciseRating, number>
  prs!: Table<PersonalRecord, [string, string]>
  bodyWeights!: Table<BodyWeightEntry, number>
  settings!: Table<SettingsRow, string>
  activeWorkout!: Table<ActiveWorkout, string>

  constructor() {
    super('tavor-gym')

    this.version(1).stores({
      exercises: 'id, muscleGroup, isActive, order',
      routines: 'id, order',
      blocks: 'id, order',
      // המערכים עם * הם multiEntry — הם מה שמאפשר סינון היסטוריה לפי
      // תרגיל או בלוק בלי לסרוק את כל הסטים.
      sessions: 'id, date, startedAt, routineId, *exerciseIds, *blockIds',
      setLogs: '++id, sessionId, exerciseId, [sessionId+exerciseId], [exerciseId+completedAt]',
      ratings: '++id, sessionId, exerciseId, [sessionId+exerciseId]',
      prs: '[exerciseId+kind], exerciseId',
      bodyWeights: '++id, &date',
      settings: '&key',
      activeWorkout: '&id',
    })

    /**
     * גרסה 2 — תוכניות פול-באדי לחזרה הדרגתית.
     *
     * מוסיפה שתי תוכניות חדשות, ומכבה את הפיצול A/B/C. זו החלטה מכוונת ולא
     * מחיקה: התוכניות נשארות במסד על כל ההיסטוריה שלהן, ומסך התוכניות מחזיר
     * אותן בלחיצה אחת. תוכנית כבויה לא מוצעת במסך הבית ולא מופיעה בבחירה,
     * כדי ששתי שיטות אימון שונות לא יתערבבו בהצעה של "מה מתאמנים היום".
     */
    this.version(2)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table<Routine, string>('routines')
        const existing = await table.toArray()

        for (const routine of existing) {
          await table.put({
            ...routine,
            isActive: false,
            suggestBlocks: routine.suggestBlocks ?? true,
            order: routine.order + 2,
            items: routine.items.map((it) => ({ ...it, startWeightKg: it.startWeightKg ?? null })),
          })
        }
        for (const fresh of SEED_ROUTINES) {
          if (fresh.id === 'F1' || fresh.id === 'F2') await table.put(fresh)
        }

        // הבלוקים לא משתנים, רק מקבלים את השדה החדש
        const blocks = tx.table<Block, string>('blocks')
        for (const block of await blocks.toArray()) {
          await blocks.put({
            ...block,
            items: block.items.map((it) => ({ ...it, startWeightKg: it.startWeightKg ?? null })),
          })
        }
      })

    /**
     * גרסה 3 — שמות התרגילים המתוקנים.
     *
     * הזריעה מרימה קטלוג רק בהתקנה ראשונה, ולכן שינוי ב-seed.ts לבדו לא היה
     * מגיע למכשיר שכבר מותקן. כאן זה מגיע — אבל רק לתרגילים שהמשתמש לא ערך
     * בעצמו, לפי השם הישן (`was`). המזהים לא נגעים: הם המפתח לכל ההיסטוריה,
     * לשיאים ולסרטונים.
     */
    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table<Exercise, string>('exercises')
        for (const exercise of await table.toArray()) {
          const fixed = applyCatalogFix(exercise)
          if (fixed) await table.put(fixed)
        }
      })

    /**
     * גרסה 4 — הקישור למאגר הלימודי עובר להיות נתון.
     *
     * עד כאן הקישור בין תרגיל בקטלוג לתרגיל במאגר חי רק ב-LIBRARY_LINKS,
     * טבלה בקוד שמישהו צריך לערוך. משם והלאה הוא שדה על התרגיל: כך אפשר
     * לאחד את שני הקטלוגים למסך אחד, וכך הוספת תרגיל מהמאגר לקטלוג יוצרת את
     * הקישור בעצמה במקום לדרוש שינוי קוד.
     *
     * המיגרציה שותלת את 12 הקישורים הקיימים ולא נוגעת ברשומה שכבר נושאת
     * קישור. libraryId נכנס גם לאינדקס — הוא מפתח חיפוש: מסך התרגיל המאוחד
     * מגיע ממזהה מאגר וצריך למצוא ממנו את התרגיל הקנוני.
     */
    this.version(4)
      .stores({ exercises: 'id, muscleGroup, isActive, order, libraryId' })
      .upgrade(async (tx) => {
        const table = tx.table<Exercise, string>('exercises')
        for (const exercise of await table.toArray()) {
          const linked = withLibraryLink(exercise)
          if (linked !== exercise) await table.put(linked)
        }
      })

    /**
     * גרסה 5 — שני סטים, שתי דקות מנוחה, פלאנק בזמן, וחימום שנגזר מהשריר.
     *
     * ארבעה שינויים שכולם מכוונים לאותו דבר — שהמספרים באפליקציה יהיו מה
     * שתבור באמת עושה, ולא מה שהוצע לו פעם:
     *
     *  1. `targetSets` ו-`restSeconds` נכפים על הקטלוג, על התוכניות ועל
     *     הבלוקים. הם היו מפוזרים בין 2 ל-4 סטים ובין 45 ל-120 שניות, וזה
     *     דרש לזכור מה מצפה בכל תרגיל. עכשיו אחיד, וניתן לשינוי בכל שלוש
     *     הרמות — כולל תוך כדי אימון על הכרטיס.
     *  2. הפלאנק עובר להימדד בזמן. הערך נשאר באותו שדה, ולכן כל ההיסטוריה
     *     שלו נשארת תקפה — רק היחידה שמוצגת משתנה.
     *  3. שכיבות הסמיכה יוצאות מראש שתי תוכניות הפול-באדי. חימום נקשר לשריר
     *     ולא לאימון, ו-`domain/warmup` כבר מציע אותו נכון בכל פתיחת קבוצת
     *     שריר. התרגיל עצמו נשאר בקטלוג ואפשר להחזיר אותו בעורך התוכניות.
     *  4. ההגדרות הגלובליות מיושרות. `mergeSettings` משלים רק שדות *חסרים*,
     *     ולכן משתמש קיים היה נשאר עם 90 שניות בלי הכתיבה המפורשת כאן.
     */
    this.version(5)
      .stores({})
      .upgrade(async (tx) => {
        const normalizeItems = (items: PlanItem[]): PlanItem[] =>
          items.map((it) => ({
            ...it,
            targetSets: DEFAULT_TARGET_SETS,
            restSeconds: DEFAULT_REST_SECONDS,
            targetReps: it.exerciseId === 'abs' ? { ...PLANK_RANGE } : it.targetReps,
          }))

        const exercises = tx.table<Exercise, string>('exercises')
        for (const exercise of await exercises.toArray()) {
          const renamed = applyCatalogFix(exercise, CATALOG_FIXES_V5) ?? exercise
          await exercises.put({
            ...renamed,
            targetSets: DEFAULT_TARGET_SETS,
            defaultRestSeconds: DEFAULT_REST_SECONDS,
            ...(renamed.id === 'abs'
              ? { metric: 'seconds' as const, targetReps: { ...PLANK_RANGE } }
              : {}),
            updatedAt: Date.now(),
          })
        }

        const routines = tx.table<Routine, string>('routines')
        for (const routine of await routines.toArray()) {
          // רק מתוכניות הפול-באדי הפעילות. הפיצול כבוי, ומחיקת תרגיל מתוכנית
          // שהמשתמש לא מסתכל עליה כרגע היא הפתעה ולא תיקון.
          const items =
            routine.id === 'F1' || routine.id === 'F2'
              ? routine.items.filter((it) => it.exerciseId !== 'pushup')
              : routine.items
          await routines.put({
            ...routine,
            items: normalizeItems(items).map((it, i) => ({ ...it, order: i })),
          })
        }

        const blocks = tx.table<Block, string>('blocks')
        for (const block of await blocks.toArray()) {
          await blocks.put({ ...block, items: normalizeItems(block.items) })
        }

        /*
          גם אימון שהיה פתוח כשהעדכון נחת.

          `hydrate` משחזרת את התור מהדיסק כמו שהוא ובונה מחדש רק את הסטים, ולכן
          פריט תור שנשמר לפני העדכון שומר את היעד הישן. לרוב זה נכון — התוכנית
          כפי שהייתה כשהאימון התחיל — אבל לפלאנק זה מייצר שקר גלוי: הקטלוג כבר
          אומר שהוא נמדד בשניות, והתור עדיין נושא טווח חזרות, אז הכרטיס מציג
          "0:12–0:20 להחזיק" ופותח את השדה על 12 שניות. רק היחידה מתוקנת כאן;
          מספר הסטים והמנוחה נשארים מה שתוכנן, כי שינוי שלהם באמצע אימון פתוח
          הוא הפתעה ולא תיקון.
        */
        const active = tx.table<ActiveWorkout, string>('activeWorkout')
        for (const workout of await active.toArray()) {
          const queue = workout.queue.map((q) =>
            q.exerciseId === 'abs' ? { ...q, targetReps: { ...PLANK_RANGE } } : q
          )
          if (queue.some((q, i) => q !== workout.queue[i])) {
            await active.put({ ...workout, queue })
          }
        }

        const settings = tx.table<SettingsRow, string>('settings')
        const row = await settings.get('app')
        if (row) {
          await settings.put({
            key: 'app',
            value: {
              ...row.value,
              defaultRestSeconds: DEFAULT_REST_SECONDS,
              defaultReps: DEFAULT_REPS,
              hiddenVideoIds: row.value.hiddenVideoIds ?? [],
            },
          })
        }
      })

    /**
     * גרסה 6 — קישורים למאגר שהתגלו כחסרים.
     *
     * `LIBRARY_LINKS` היא זריעה בלבד: מגרסה 4 הקישור חי כשדה על התרגיל. לכן
     * הוספת שורה לטבלה ההיא לא מגיעה למכשיר שכבר עבר את מיגרציה 4 — היא
     * משפיעה רק על התקנה חדשה. בלי המיגרציה הזאת שני הקישורים החדשים היו
     * עובדים אצל מי שמתקין מאפס ולא אצל מי שכבר משתמש.
     *
     * אותו לולאה בדיוק כמו בגרסה 4, ומאותה סיבה היא בטוחה: `withLibraryLink`
     * לא נוגע ברשומה שכבר נושאת קישור, ולכן תרגיל שהמשתמש הוסיף בעצמו מהמאגר
     * שומר על הקישור שלו.
     */
    this.version(6)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table<Exercise, string>('exercises')
        for (const exercise of await table.toArray()) {
          const linked = withLibraryLink(exercise)
          if (linked !== exercise) await table.put(linked)
        }
      })

    /**
     * גרסה 7 — סולם הדירוג עובר מ-3 דרגות ל-5.
     *
     * הסולם הישן (1 קל · 2 בינוני · 3 קשה) נכנס לאמצע הסולם החדש
     * (1 קל מאוד · 2 קל · 3 בינוני · 4 קשה · 5 קשה מאוד), ולכן כל דירוג
     * שמור עולה באחד: 1→2, 2→3, 3→4. בלי זה "בינוני" ישן היה נקרא "קל"
     * חדש — ומנוע ההמלצות היה מעלה משקל על סמך אימון שדורג אחרת.
     *
     * הריצה חייבת לכסות גם אימון שהיה פתוח בזמן העדכון: ratingsByKey שלו
     * נכתב לטבלת הדירוגים ב-finish, אחרי המיגרציה, עם הערכים שנשמרו לפניה.
     */
    this.version(7)
      .stores({})
      .upgrade(async (tx) => {
        const ratings = tx.table<ExerciseRating, number>('ratings')
        for (const row of await ratings.toArray()) {
          if (row.rating <= 3) {
            await ratings.put({ ...row, rating: (row.rating + 1) as ExerciseRating['rating'] })
          }
        }

        const active = tx.table<ActiveWorkout, string>('activeWorkout')
        for (const workout of await active.toArray()) {
          const entries = Object.entries(workout.ratingsByKey)
          if (!entries.length) continue
          const ratingsByKey = Object.fromEntries(
            entries.map(([key, r]) => [
              key,
              r.rating <= 3
                ? { ...r, rating: (r.rating + 1) as ExerciseRating['rating'] }
                : r,
            ])
          )
          await active.put({ ...workout, ratingsByKey })
        }
      })

    /**
     * גרסה 8 — בניית אימון: שני שדות שמסך הכיסוי והאימונים השמורים עומדים עליהם.
     *
     *  1. `Routine.kind` — עד כאן כל שורה בטבלת התוכניות הייתה תוכנית קבועה,
     *     כי לא הייתה דרך אחרת. עכשיו יש אימונים שמורים באותה טבלה, ובלי
     *     ההבחנה הזו מתג התוכניות היה מכבה אותם והצעת "מה מתאמנים היום" הייתה
     *     קופצת לאימון שמור חדש ברגע שנשמר (מה שמעולם לא בוצע גובר על כל ותק).
     *     המילוי הוא לפי *היעדר* השדה ולא לפי רשימת המזהים הידועים: שורה
     *     שנכנסה בדרך חריגה — גיבוי ערוך שיובא לפני העדכון — הייתה נשארת בלי
     *     `kind` לנצח.
     *  2. `Exercise.secondaryMuscles` — התיוג הידני מ-`muscleTags.ts` נשתל
     *     ברשומות הקיימות. השומר הוא היעדר השדה ולא השוואת שם כמו ב-
     *     `applyCatalogFix`: מערך ריק הוא החלטה לגיטימית של המשתמש ("אין לזה
     *     עבודה משנית"), ותרגיל ששמו נערך עדיין ראוי לתגיות שלו.
     *
     * שני השדות מקבלים גם תיקון-קדימה בייבוא גיבוי (backup.ts), כי מיגרציה
     * לא רצה שוב על מסד שכבר בגרסה 8 — וגיבוי ישן היה מחזיר שורות בלי השדות.
     */
    this.version(8)
      .stores({})
      .upgrade(async (tx) => {
        const routines = tx.table<Routine, string>('routines')
        for (const routine of await routines.toArray()) {
          if (routine.kind === undefined) await routines.put({ ...routine, kind: 'program' })
        }

        const exercises = tx.table<Exercise, string>('exercises')
        for (const exercise of await exercises.toArray()) {
          const tagged = withSecondaryMuscles(exercise)
          if (tagged !== exercise) await exercises.put(tagged)
        }
      })

    /**
     * גרסה 9 — "שוק" מפסיקה להיות קבוצת שריר ומתאחדת לתוך "רגליים".
     *
     * הפיצול היה נכון אנטומית ורע בפועל: תרגיל אחד בקטלוג, אפס תרגילים במאגר,
     * ולכן שורה תשיעית שכתובה "לא נגעת" לנצח — גם מיד אחרי אימון רגליים מלא.
     * היא דחקה למטה שרירים שבאמת הוזנחו, וזה בדיוק מה שמסך הכיסוי בא לענות.
     *
     * שלושה מקומות שמחזיקים את המחרוזת הזו על הדיסק:
     *
     *  1. `Exercise.muscleGroup` — הרמת עקבים, וכל תרגיל שהמשתמש יצר בעצמו
     *     תחת הקבוצה. בלי המרה הם היו נופלים מכל מסך: `MUSCLE_GROUPS['calves']`
     *     כבר לא קיים, ו-`MUSCLE_GROUPS[e.muscleGroup].label` הוא קריאה שחוזרת
     *     בשמונה מסכים. `subTarget` לא נוגעים בו — "שוק — תאומים" הוא המיקוד,
     *     והוא מה שממשיך להבדיל את התרגיל בתוך רגליים.
     *  2. `Exercise.secondaryMuscles` — סקוואט זיכה גם `legs` וגם `calves`.
     *     אחרי האיחוד `calves` *נמחק* ולא מומר: `legs` כבר הראשי שלו, וזיכוי
     *     משני לשריר הראשי הוא ספירה כפולה שמסך הכיסוי היה מציג כעבודה עקיפה
     *     על מה שכבר קיבל סט ישיר.
     *  3. `AppSettings.videoMoves` / `videoOrder` — סרטון שהמשתמש שייך למדף
     *     `group:calves`. המדף הזה כבר לא מרונדר, ולכן בלי ההמרה הסרטון היה
     *     נעלם מהאפליקציה בלי שנמחק. שתי רשימות סדר שנפגשות באותו מדף
     *     מתמזגות בלי כפילויות, כי סדר הוא רשימת מזהים ולא קבוצה.
     */
    this.version(9)
      .stores({})
      .upgrade(async (tx) => {
        const exercises = tx.table<Exercise, string>('exercises')
        for (const exercise of await exercises.toArray()) {
          const merged = withoutCalves(exercise)
          if (merged !== exercise) await exercises.put(merged)
        }

        const settings = tx.table<SettingsRow, string>('settings')
        const row = await settings.get('app')
        if (row) {
          const value = mergeCalfShelves(row.value)
          if (value !== row.value) await settings.put({ ...row, value })
        }
      })

    /**
     * גרסה 10 — הקטלוג מיושר מול מה שהסרטונים באמת מראים.
     *
     * ארבעה שינויים, כולם נגזרו מצפייה חוזרת בסרטונים פריים-פריים:
     *
     *  1. לחיצת החזה מתפצלת. רשומה אחת החזיקה "שיפוע חיובי ושטוח" עם ארבעה
     *     סרטונים — שלושה שטוח ואחד בשיפוע — וזה לא יכול היה להיות נכון בשני
     *     הצדדים: המוט יורד לחזה האמצעי בשטוח ולעליון בשיפוע, ולכן כל דגש
     *     שנכתב היה שגוי לחצי מהמקרים. `db-bench-press` נשאר השטוח *עם המזהה
     *     שלו* — הוא המפתח של ההיסטוריה, השיאים והתוכניות — ורשומת השיפוע
     *     נולדת חדשה לצידו. מי שכבר מתאמן ממשיך בדיוק במקום שבו הוא היה.
     *  2. `usesPlates` נדלק בלחיצת החזה. השם תוקן ל"מוט" כבר בגרסה 3 והשדה
     *     נשאר מאחור, כלומר מחשבון הפלטות היה כבוי בתרגיל היחיד בקטלוג שבו
     *     באמת מעמיסים פלטות על מוט.
     *  3. מקבילים במכונה עוברים מ-`chest` ל-`triceps`.
     *  4. דגשים שתיארו וריאציה אחרת מזו שבסרטון מוחלפים (CATALOG_FIXES_V10).
     *
     * הקישורים למאגר רצים שוב בסוף: הפיצול הוא שפתח אותם. כל עוד רשומה אחת
     * כיסתה גם שטוח וגם שיפוע, אף אחת משתי רשומות המאגר לא הייתה נכונה לה.
     */
    this.version(10)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table<Exercise, string>('exercises')
        for (const exercise of await table.toArray()) {
          const renamed = applyCatalogFix(exercise, CATALOG_FIXES_V10) ?? exercise
          const patched = withLibraryLink(withV10Fields(renamed))
          if (patched !== exercise) await table.put(patched)
        }

        // אחרי התיקונים ולא לפניהם: הסדר החדש נגזר מהסדר של הרשומה השטוחה
        const current = await table.toArray()
        const withTwin = withInclineBench(current)
        if (withTwin !== current) await table.bulkPut([...withTwin])
      })

    /**
     * גרסה 11 — הדגש של הרמת הכתפיים מיושר מול הסרטון.
     *
     * הדגש הישן ("למשוך ישר למעלה לכיוון האוזניים") הוא בדיוק מה שהסרטון מסמן
     * כ-"DON'T DO THIS" מעל עמידה זקופה. מה שהוא מלמד הוא הטיה קדימה וסחיטה
     * למעלה ואחורה. שינוי טקסט בלבד, ורק אם הדגשים עדיין המקוריים.
     */
    this.version(11)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table<Exercise, string>('exercises')
        for (const exercise of await table.toArray()) {
          const fixed = applyCatalogFix(exercise, CATALOG_FIXES_V11)
          if (fixed) await table.put(fixed)
        }
      })

    /**
     * גרסה 12 — "הרמת עקבים" מקבלת את דף המאגר שלה.
     *
     * `lib-calf_raise` נפתח באודיט המאגר מקליפ שישב תחת לחיצת רגליים, ולכן
     * `LIBRARY_LINKS` מכיר עכשיו קישור שלא היה קיים כשהמסד נזרע. אותה לולאה
     * בדיוק כמו בגרסאות 4 ו-10, ומאותה סיבה היא בטוחה: `withLibraryLink` לא
     * נוגע ברשומה שכבר יש לה `libraryId`, ולכן קישור שהמשתמש קבע בעצמו נשאר.
     */
    this.version(12)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table<Exercise, string>('exercises')
        for (const exercise of await table.toArray()) {
          const linked = withLibraryLink(exercise)
          if (linked !== exercise) await table.put(linked)
        }
      })

    /**
     * גרסה 13 — חותמת "משתמש קיים" לפני שמסך הפתיחה נכנס לאוויר.
     *
     * ‏Dexie מריץ `upgrade` אם ורק אם המסד כבר היה קיים בגרסה נמוכה יותר —
     * כלומר בדיוק על מכשיר ותיק. מסד חדש נוצר ישר בגרסה האחרונה ועובר דרך
     * `populate` בלי לראות את השורה הזו.
     *
     * זה מה שמבטיח שתבור לא יפגוש את מסך "ברוך הבא", וגם שהחתימה קורית לפני
     * שכל מסלול איפוס יכול לרוץ. הגוף הוא שורה אחת שלא נוגעת בשום טבלה
     * בכוונה: זריקה בתוך `upgrade` חוסמת את `db.open()`, והאפליקציה הייתה
     * נוחתת על מסך השגיאה במקום להיפתח. אין להוסיף לכאן עבודת קטלוג.
     */
    this.version(13)
      .stores({})
      .upgrade(() => {
        markFirstRunSeen()
      })

    /**
     * גרסה 14 — "סטים ברירת מחדל" נכנסת להגדרות.
     *
     * ‏`mergeSettings` כבר משלים שדה חסר בקריאה, ולכן המסך מציג 3 גם בלי
     * המיגרציה הזו. מה שהיא מוסיפה הוא שהערך *ייכתב* לשורה: בלעדיה
     * `defaultSets` היה נולד מחדש בכל קריאה ונעדר מהגיבוי, וייצוא ושחזור
     * היו מחזירים משתמש שכבר שינה את הערך אל ברירת המחדל בשקט.
     *
     * רק שדה חסר. מי שכבר שמר ערך משלו — למשל בין העדכון להרצת המיגרציה —
     * שומר עליו.
     */
    this.version(14)
      .stores({})
      .upgrade(async (tx) => {
        const settings = tx.table<SettingsRow, string>('settings')
        const row = await settings.get('app')
        if (!row) return
        if (typeof row.value.defaultSets === 'number') return
        await settings.put({ key: 'app', value: { ...row.value, defaultSets: DEFAULT_SETS } })
      })

    /*
      רץ פעם אחת בלבד, בפתיחה הראשונה של המסד.

      ‏`freshSeed*` ולא הקבועים: המשקלים ב-SEED_* הם המשקלים של תבור, והם לא
      נקודת פתיחה בטוחה לאף אחד אחר. ההסבר המלא יושב מעל `freshSeedExercises`
      ב-seed.ts. הקבועים עצמם נשארים במאגר כתיעוד וכפיקסטורה לבדיקות.
    */
    this.on('populate', async () => {
      markFirstRun()
      await this.exercises.bulkAdd(freshSeedExercises())
      await this.routines.bulkAdd(freshSeedRoutines())
      await this.blocks.bulkAdd(freshSeedBlocks())
      await this.settings.add({ key: 'app', value: DEFAULT_SETTINGS })
    })
  }
}

export const db = new GymDatabase()

// ─── הגדרות ────────────────────────────────────────────────────────────────

/**
 * קורא הגדרות ומשלים שדות חסרים מברירות המחדל. זה מה שמאפשר להוסיף הגדרה
 * חדשה בלי מיגרציה — משתמש ותיק פשוט מקבל את ברירת המחדל שלה.
 */
export async function getSettings(): Promise<AppSettings> {
  const row = await db.settings.get('app')
  return mergeSettings(row?.value)
}

export function mergeSettings(stored: Partial<AppSettings> | undefined): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(stored ?? {}),
    plates: { ...DEFAULT_SETTINGS.plates, ...(stored?.plates ?? {}) },
  }
}

/**
 * הכתיבות מסודרות בתור. השמירה היא קריאה-שינוי-כתיבה לא אטומית, ושני כותבים
 * במקביל — מחיקת סרטון (hiddenVideoIds) ושמירת סדר (videoOrder) באותה שנייה,
 * או שני מתגים ברצף מהיר — היו דורסים זה את זה: המאוחר קורא לפני שהמוקדם
 * כתב, ומחזיר את השדה שלו על גב הגדרות ישנות. תור בתוך התהליך פותר את זה
 * בלי טרנזקציה, כי כל הכותבים עוברים כאן.
 */
let settingsQueue: Promise<unknown> = Promise.resolve()

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  return mutateSettings(() => patch)
}

/**
 * שינוי הגדרות שנגזר מהערך *העדכני* שבמסד, בתוך אותו תור.
 *
 * ‏`saveSettings` מקבל תיקון מוכן, ולכן מי שצריך לקרוא לפני שהוא כותב —
 * להוסיף מזהה לרשימה, למשל — חייב לקרוא בעצמו לפני הקריאה, מחוץ לתור.
 * שם נפער החלון: שתי מחיקות סרטון מהירות קראו שתיהן את אותה רשימה, וכל אחת
 * כתבה אותה בתוספת המזהה שלה בלבד — כלומר המחיקה הראשונה נעלמה. כאן הקריאה
 * והכתיבה נעולות יחד, ולכן הפונקציה מקבלת תמיד את מה שבאמת במסד.
 */
export async function mutateSettings(
  fn: (current: AppSettings) => Partial<AppSettings>
): Promise<AppSettings> {
  const write = settingsQueue.then(async () => {
    const current = await getSettings()
    const next = mergeSettings({ ...current, ...fn(current) })
    await db.settings.put({ key: 'app', value: next })
    return next
  })
  // כישלון של כתיבה אחת לא נועל את התור לנצח
  settingsQueue = write.catch(() => undefined)
  return write
}

/** מבטיח שהמסד נפתח והזריעה הושלמה */
export async function ensureReady(): Promise<void> {
  if (!db.isOpen()) await db.open()
  /*
    ביטוח: אם הזריעה נכשלה באמצע בעבר, משלימים כאן.

    גם כאן `freshSeed*`, ומאותה סיבה — הענף הזה **אינו** מוגבל להתקנה חדשה.
    התנאי היחיד שלו הוא "אין תרגילים", והוא מתקיים גם אחרי ייבוא גיבוי שמכיל
    `exercises: []` ואחרי מחיקת הקטלוג. השארת הקבועים כאן הייתה מחזירה את
    המשקלים של תבור למכשיר של מישהו אחר דרך הדלת האחורית. אצל תבור הענף לא
    יכול לרוץ בכלל — יש לו 29.
  */
  if ((await db.exercises.count()) === 0) {
    await db.transaction('rw', db.exercises, db.routines, db.blocks, db.settings, async () => {
      await db.exercises.bulkPut(freshSeedExercises())
      await db.routines.bulkPut(freshSeedRoutines())
      await db.blocks.bulkPut(freshSeedBlocks())
      if (!(await db.settings.get('app'))) {
        await db.settings.put({ key: 'app', value: DEFAULT_SETTINGS })
      }
    })
  }
}

/** מוחק הכל ומחזיר לזריעה. משמש בייבוא גיבוי ובאיפוס יזום. */
export async function resetDatabase(): Promise<void> {
  await db.delete()
  await db.open()
  await ensureReady()
}
