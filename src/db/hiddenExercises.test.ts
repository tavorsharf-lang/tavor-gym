import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureReady, getSettings } from '@/db/db'
import {
  entryHiddenIds,
  hideExercise,
  invalidateHiddenExercises,
  isEntryHidden,
  loadHiddenExerciseIds,
  unhideExercises,
} from '@/db/hiddenExercises'
import { getCatalogEntries } from '@/db/catalog'

/**
 * הסתרת תרגילים מבניית האימון.
 *
 * שתי הנקודות הקשות: המרוץ (שתי הסתרות מהירות ברצף — בדיוק הבאג שנתפס
 * ב-hideVideo ותוקן ב-mutateSettings), ומלכודת הזהות — המזהה הקנוני של שורה
 * מקושרת מתחלף כשהיא מקבלת או מאבדת כרטיס, ולכן ההסתרה שומרת שלישייה.
 */
describe('תרגילים מוסתרים', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensureReady()
    invalidateHiddenExercises()
  })

  it('הסתרה נשמרת בהגדרות וההחזרה מנקה אותה', async () => {
    await hideExercise(['lib-lunge'])
    expect((await getSettings()).hiddenExerciseIds).toContain('lib-lunge')
    expect((await loadHiddenExerciseIds()).has('lib-lunge')).toBe(true)

    await unhideExercises(['lib-lunge'])
    expect((await getSettings()).hiddenExerciseIds).toEqual([])
    expect((await loadHiddenExerciseIds()).size).toBe(0)
  })

  /**
   * רגרסיה: hideVideo עשה קרא-שנה-כתוב מחוץ לתור, ושתי מחיקות מהירות איבדו
   * את הראשונה. המודול הזה נולד אחרי התיקון וחייב לרשת אותו.
   */
  it('שתי הסתרות במקביל לא מאבדות אף אחת', async () => {
    await Promise.all([hideExercise(['lib-lunge']), hideExercise(['hammer-curl'])])
    const hidden = await loadHiddenExerciseIds()
    expect(hidden.has('lib-lunge')).toBe(true)
    expect(hidden.has('hammer-curl')).toBe(true)
  })

  it('שלישיית הזהות שורדת את היפוך המזהה הקנוני', async () => {
    const entries = await getCatalogEntries()
    // תרגיל מקושר: מזהה הקטלוג הוא הקנוני, אבל השלישייה מכילה גם את המאגר
    const linked = entries.find((e) => e.id === 'leg-press')!
    const ids = entryHiddenIds(linked)
    expect(ids).toContain('leg-press')
    expect(ids).toContain('lib-leg_press')

    await hideExercise(ids)
    const hidden = await loadHiddenExerciseIds()

    // גם הרשומה הקנונית וגם רשומת מאגר יתומה באותו מזהה — שתיהן מוסתרות
    expect(isEntryHidden(linked, hidden)).toBe(true)
    const libTwin = { ...linked, id: 'lib-leg_press', exercise: null }
    expect(isEntryHidden(libTwin, hidden)).toBe(true)
  })

  it('תרגיל בלי תאום נשמר במזהה בודד, בלי כפילויות', async () => {
    const entries = await getCatalogEntries()
    const own = entries.find((e) => e.id === 'hammer-curl')!
    expect(entryHiddenIds(own)).toEqual(['hammer-curl'])
  })

  it('גיבוי ישן בלי השדה נקרא כרשימה ריקה', async () => {
    // mergeSettings משלים שדות חסרים — זה מה שמאפשר שדה חדש בלי מיגרציה
    const row = await db.settings.get('app')
    const value = { ...row!.value } as Record<string, unknown>
    delete value.hiddenExerciseIds
    await db.settings.put({ key: 'app', value: value as never })
    invalidateHiddenExercises()

    expect((await loadHiddenExerciseIds()).size).toBe(0)
    // וכתיבה ראשונה עובדת מעל השדה החסר
    await hideExercise(['lib-lunge'])
    expect((await getSettings()).hiddenExerciseIds).toEqual(['lib-lunge'])
  })
})
