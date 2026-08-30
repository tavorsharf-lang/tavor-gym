import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady, getSettings } from '@/db/db'
import { addFromLibrary, getCatalogEntries } from '@/db/catalog'
import type { CatalogEntry } from '@/db/catalog'
import {
  clearMuscleFix,
  groupOf,
  invalidateMuscleFixes,
  loadMuscleFixes,
  saveMuscleFix,
  secondaryOf,
  subOf,
} from '@/db/muscleFixes'
import { SUBS_BY_GROUP, subTargetFor } from '@/db/subTargets'
import { LIBRARY_CATALOG } from '@/db/libraryManifest'
import { MUSCLE_GROUP_ORDER } from '@/db/types'

/**
 * תיקון שיוך השריר.
 *
 * שלוש הנקודות שנופלות בשקט אם משהו נשבר, ולכן כולן נעולות כאן:
 *
 *  1. **החלוקה בין הרשומה לשכבה.** קבוצה של תרגיל בקטלוג נכתבת לרשומה
 *     ו*לא* לשכבה. אילו נשמרה בשניהם, שינוי עתידי בעורך המלא היה נדרס
 *     בחזרה בכל רינדור — באג שאין לו שום סימן חיצוני.
 *  2. **מה שמסכים עם הכרטיס לא נשמר.** ערך קפוא שמקרי מסכים היום היה
 *     מקפיא גם כרטיס שיוחלף מחר.
 *  3. **מלכודת הזהות.** המזהה הקנוני של שורת מאגר מתחלף כשהיא מקבלת כרטיס,
 *     ותיקון ששמר מזהה אחד היה מתאדה בהיפוך.
 */

async function entryById(id: string): Promise<CatalogEntry> {
  const entry = (await getCatalogEntries()).find((e) => e.id === id)
  if (!entry) throw new Error(`אין שורה ${id}`)
  return entry
}

describe('תיקון שיוך שריר', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureReady()
    invalidateMuscleFixes()
  })

  it('כל קבוצה מציעה ראשי שריר לבחירה', () => {
    for (const group of MUSCLE_GROUP_ORDER) {
      expect(SUBS_BY_GROUP[group]?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('תיקון ראש שריר נשמר תחת כל מזהי הזהות ומחליף את מה שנגזר', async () => {
    const entry = await entryById('dips')
    const group = groupOf(entry, await loadMuscleFixes())
    const derived = subOf(entry, group, await loadMuscleFixes())
    const other = SUBS_BY_GROUP[group].find((s) => s !== derived)!

    await saveMuscleFix(entry, { group, sub: other })

    const fixes = await loadMuscleFixes()
    expect(subOf(entry, group, fixes)).toBe(other)
    // גם מזהה הקטלוג וגם מזהה המאגר — לשני הכיוונים של ההיפוך
    expect(Object.keys((await getSettings()).muscleFixes)).toContain('dips')
    if (entry.exercise?.libraryId) {
      expect(Object.keys((await getSettings()).muscleFixes)).toContain(entry.exercise.libraryId)
    }
  })

  it('בחירת הראש שממילא נגזר מהכרטיס לא שומרת כלום', async () => {
    const entry = await entryById('dips')
    const group = groupOf(entry, await loadMuscleFixes())
    const derived = subOf(entry, group, await loadMuscleFixes())
    expect(derived).not.toBeNull()

    await saveMuscleFix(entry, { group, sub: derived })

    expect((await getSettings()).muscleFixes).toEqual({})
  })

  /**
   * הנקודה שכל הקובץ נבנה סביבה: קבוצה של תרגיל שיש לו כרטיס בקטלוג היא
   * נתון ולא תצוגה, ולכן היא נכתבת לרשומה — משם קוראים הנפח, החימום
   * ומועמדי ההחלפה — ולא לשכבה שרק מזיזה שורה ברשימה.
   */
  it('קבוצה של תרגיל בקטלוג נכתבת לרשומה, לא לשכבה', async () => {
    const before = await db.exercises.get('dips')
    expect(before?.muscleGroup).toBe('triceps')
    expect(before?.secondaryMuscles).toContain('chest')

    const entry = await entryById('dips')
    await saveMuscleFix(entry, { group: 'chest', sub: 'חזה עליון' })

    const after = await db.exercises.get('dips')
    expect(after?.muscleGroup).toBe('chest')
    // השריר הראשי מנוקה מהמשניים באותה פעולה — אחרת סט אחד נספר פעמיים
    expect(after?.secondaryMuscles).not.toContain('chest')
    expect(after?.subTarget).toBe('חזה עליון')

    // רק הראש בשכבה. קבוצה כפולה הייתה דורסת בחזרה שינוי מהעורך המלא.
    const stored = (await getSettings()).muscleFixes['dips']
    expect(stored?.group).toBeUndefined()
    expect(stored?.sub).toBe('חזה עליון')

    // והשורה באמת עברה קבוצה ברשימה
    expect(groupOf(await entryById('dips'), await loadMuscleFixes())).toBe('chest')
  })

  it('קבוצה של שורת מאגר בלי כרטיס נשמרת בשכבה ולא נוגעת בטבלה', async () => {
    const entry = await entryById('lib-lunge')
    expect(entry.exercise).toBeNull()
    const countBefore = await db.exercises.count()

    await saveMuscleFix(entry, { group: 'abs', sub: null })

    const fixes = await loadMuscleFixes()
    expect(groupOf(await entryById('lib-lunge'), fixes)).toBe('abs')
    expect(await db.exercises.count()).toBe(countBefore)
  })

  /**
   * מלכודת הזהות: שורת מאגר שתוקנה ואז קיבלה כרטיס. `groupOf` נותן לכרטיס
   * לגבור על השכבה — ולכן אם ההוספה לא מעבירה את התיקון לרשומה, הוא מתאדה
   * בשקט בדיוק ברגע שבו התרגיל הופך למשהו שמתאמנים בו.
   */
  it('תיקון על שורת מאגר עובר לכרטיס שנוצר ממנה', async () => {
    const entry = await entryById('lib-lunge')
    await saveMuscleFix(entry, { group: 'abs', sub: null })

    const lib = LIBRARY_CATALOG.find((e) => e.id === 'lib-lunge')!
    const { exercise } = await addFromLibrary(lib)

    expect(exercise.muscleGroup).toBe('abs')
    expect(groupOf(await entryById(exercise.id), await loadMuscleFixes())).toBe('abs')
  })

  it('ביטול התיקון מחזיר את השורה למה שנגזר', async () => {
    const entry = await entryById('lib-lunge')
    await saveMuscleFix(entry, { group: 'abs', sub: null })
    await clearMuscleFix(await entryById('lib-lunge'))

    expect((await getSettings()).muscleFixes).toEqual({})
    expect(groupOf(await entryById('lib-lunge'), await loadMuscleFixes())).toBe(
      entry.muscleGroup
    )
  })

  /**
   * רגרסיה מהמשפחה של hideVideo: קרא-שנה-כתוב מחוץ לתור איבד את הכתיבה
   * הראשונה כששתי פעולות מהירות רצו יחד. כאן שתי שורות שונות מתוקנות במקביל.
   */
  it('שני תיקונים במקביל לא דורסים זה את זה', async () => {
    const [a, b] = [await entryById('lib-lunge'), await entryById('lib-pull_up')]
    await Promise.all([
      saveMuscleFix(a, { group: 'abs', sub: null }),
      saveMuscleFix(b, { group: 'chest', sub: null }),
    ])

    const stored = (await getSettings()).muscleFixes
    expect(stored['lib-lunge']?.group).toBe('abs')
    expect(stored['lib-pull_up']?.group).toBe('chest')
  })

  /**
   * הכותרת לא חוזרת כתגית. `secondaryFor` מסנן את הראש ה*נגזר*, ולכן שורה
   * מתוקנת הייתה מציגה את הראש הישן לצד החדש כאילו הם שני דברים.
   */
  it('הראש שמוצג ככותרת לא חוזר בתגיות המשניות', async () => {
    const entry = await entryById('dips')
    const group = groupOf(entry, await loadMuscleFixes())
    const derived = subTargetFor('dips', group)
    const other = SUBS_BY_GROUP[group].find((s) => s !== derived)!

    await saveMuscleFix(entry, { group, sub: other })
    const fresh = await entryById('dips')
    const sub = subOf(fresh, group, await loadMuscleFixes())

    expect(sub).toBe(other)
    expect(secondaryOf(fresh, group, sub).map((m) => m.he)).not.toContain(other)
  })
})
