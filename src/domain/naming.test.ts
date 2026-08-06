import { describe, expect, it } from 'vitest'
import type { Exercise } from '@/db/types'
import { SEED_EXERCISES } from '@/db/seed'
import { distinguisher, duplicateNames, metaLine } from './naming'

const base = SEED_EXERCISES[0]

function ex(patch: Partial<Exercise>): Exercise {
  return { ...base, ...patch }
}

describe('duplicateNames', () => {
  it('מחזיר רק שמות שיותר מתרגיל אחד נושא', () => {
    const found = duplicateNames([
      ex({ id: 'a', name: 'חתירה במכונה' }),
      ex({ id: 'b', name: 'חתירה במכונה' }),
      ex({ id: 'c', name: 'פלאנק' }),
    ])
    expect([...found]).toEqual(['חתירה במכונה'])
  })

  it('ריק כשכל השמות ייחודיים', () => {
    expect(duplicateNames([ex({ id: 'a', name: 'א' }), ex({ id: 'b', name: 'ב' })]).size).toBe(0)
  })

  it('מזהה בקטלוג האמיתי את שתי החתירות ואת שתי לחיצות החזה במכונה', () => {
    expect([...duplicateNames(SEED_EXERCISES)].sort()).toEqual([
      'חתירה במכונה',
      'לחיצת חזה במכונה',
    ])
  })
})

describe('distinguisher', () => {
  const dups = new Set(['חתירה במכונה'])

  it('מחזיר את המשקל כשהשם מתנגש', () => {
    const row = ex({ name: 'חתירה במכונה', weightMode: 'perSide', seedWeightKg: 60 })
    expect(distinguisher(row, dups)).toBe('60 ק״ג כל צד')
  })

  it('לא מוסיף כלום לשם ייחודי', () => {
    const row = ex({ name: 'פלאנק', weightMode: 'perSide', seedWeightKg: 60 })
    expect(distinguisher(row, dups)).toBeNull()
  })

  it('לא ממציא משקל כשאין', () => {
    const row = ex({ name: 'חתירה במכונה', weightMode: 'total', seedWeightKg: null })
    expect(distinguisher(row, dups)).toBeNull()
  })

  it('מפריד בין שתי החתירות שבקטלוג', () => {
    const all = SEED_EXERCISES
    const dupsReal = duplicateNames(all)
    const heavy = all.find((e) => e.id === 'seated-row-heavy')!
    const light = all.find((e) => e.id === 'seated-row-light')!
    expect(distinguisher(heavy, dupsReal)).toBe('60 ק״ג כל צד')
    expect(distinguisher(light, dupsReal)).toBe('50 ק״ג כל צד')
    expect(distinguisher(heavy, dupsReal)).not.toBe(distinguisher(light, dupsReal))
  })
})

describe('metaLine', () => {
  it('משרשר מיקוד, ציוד ומבדיל', () => {
    const row = ex({ name: 'חתירה במכונה', subTarget: 'לטיסימוס', weightMode: 'perSide', seedWeightKg: 60 })
    expect(metaLine(row, 'מכונה', new Set(['חתירה במכונה']))).toBe(
      'לטיסימוס · מכונה · 60 ק״ג כל צד'
    )
  })

  it('בלי מבדיל כשאין התנגשות', () => {
    const row = ex({ name: 'פלאנק', subTarget: 'core — בטן' })
    expect(metaLine(row, 'משקל גוף', new Set())).toBe('core — בטן · משקל גוף')
  })
})
