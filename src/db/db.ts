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
  DEFAULT_SETTINGS,
  DEFAULT_TARGET_SETS,
  PLANK_RANGE,
  SEED_BLOCKS,
  SEED_EXERCISES,
  SEED_ROUTINES,
} from './seed'
import { CATALOG_FIXES_V5, applyCatalogFix } from './catalogFix'
import { withLibraryLink } from './libraryLinks'
import { withSecondaryMuscles } from './muscleTags'

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

    // רץ פעם אחת בלבד, בפתיחה הראשונה של המסד
    this.on('populate', async () => {
      await this.exercises.bulkAdd(SEED_EXERCISES)
      await this.routines.bulkAdd(SEED_ROUTINES)
      await this.blocks.bulkAdd(SEED_BLOCKS)
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
  // ביטוח: אם הזריעה נכשלה באמצע בעבר, משלימים כאן
  if ((await db.exercises.count()) === 0) {
    await db.transaction('rw', db.exercises, db.routines, db.blocks, db.settings, async () => {
      await db.exercises.bulkPut(SEED_EXERCISES)
      await db.routines.bulkPut(SEED_ROUTINES)
      await db.blocks.bulkPut(SEED_BLOCKS)
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
