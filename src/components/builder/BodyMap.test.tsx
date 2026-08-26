import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { MuscleCoverage } from '@/domain/coverage'
import type { MuscleGroup } from '@/db/types'
import { MUSCLE_GROUPS, MUSCLE_GROUP_BY_SIZE } from '@/db/types'
import { BodyMap } from './BodyMap'

/**
 * מה שנבדק כאן הוא *כיוון* הצבע ולא הגוון עצמו.
 *
 * המפה והרשימה יושבות באותו מסך במרחק לחיצת מתג, ובגרסה הראשונה הן קידדו את
 * אותו נתון הפוך: ברשימה שריר מוזנח נצבע כתום, ובמפה דווקא שריר *שאומן* היה
 * הכתום. שתי צורות של אותה אמת שסותרות זו את זו, ו-jsdom לא צועק על זה — רק
 * עין אנושית מול המסך תפסה את זה.
 *
 * לכן הטענה כאן היא היחס ולא הערך: מוזנח חייב להיות חם יותר מכוסה. הבדיקה
 * שורדת כל שינוי פלטה, ונופלת בדיוק על ההיפוך.
 */

function row(group: MuscleGroup, over: Partial<MuscleCoverage> = {}): MuscleCoverage {
  return {
    group,
    label: MUSCLE_GROUPS[group].label,
    exercises: 0,
    sets: 0,
    indirectSets: 0,
    indirectExercises: 0,
    lastDirectAt: null,
    daysSince: null,
    neverDone: true,
    uncovered: true,
    ...over,
  }
}

/** ה-fill של האזור הראשון שנושא את שם הקבוצה */
function fillOf(group: MuscleGroup): string {
  const region = screen.getAllByRole('button', {
    name: new RegExp(`^${MUSCLE_GROUPS[group].label}`),
  })[0]
  return region.getAttribute('fill') ?? ''
}

function draw(rows: MuscleCoverage[]): void {
  const all = new Map(MUSCLE_GROUP_BY_SIZE.map((g) => [g, row(g)]))
  for (const r of rows) all.set(r.group, r)
  render(<BodyMap rows={[...all.values()]} onSelect={vi.fn()} />)
}

const isWarm = (fill: string): boolean => fill.includes('flame')

describe('BodyMap', () => {
  it('צובע מוזנח חם וכוסה שקט — ולא להפך', () => {
    draw([
      row('chest', { sets: 4, exercises: 2, uncovered: false, neverDone: false, daysSince: 0 }),
      row('back'), // מעולם לא, בטווח החיפוש
    ])
    expect(isWarm(fillOf('back'))).toBe(true)
    expect(isWarm(fillOf('chest'))).toBe(false)
  })

  it('עבודה עקיפה חמה פחות מהזנחה מלאה', () => {
    draw([
      row('biceps', { indirectSets: 5, indirectExercises: 1, neverDone: false, daysSince: 2 }),
      row('back'),
    ])
    expect(isWarm(fillOf('biceps'))).toBe(true)
    // שניהם חמים, אבל המוזנח חייב לבלוט יותר
    expect(fillOf('back')).not.toBe(fillOf('biceps'))
  })

  it('כל הקבוצות לחיצות ונושאות תווית קריאה', () => {
    draw([])
    for (const group of MUSCLE_GROUP_BY_SIZE) {
      const regions = screen.getAllByRole('button', {
        name: new RegExp(`^${MUSCLE_GROUPS[group].label}`),
      })
      expect(regions.length).toBeGreaterThan(0)
    }
  })

  it('שריר שמופיע בשני המבטים נצבע אותו דבר בשניהם', () => {
    draw([row('legs', { sets: 3, uncovered: false, neverDone: false, daysSince: 1 })])
    const both = screen.getAllByRole('button', {
      name: new RegExp(`^${MUSCLE_GROUPS.legs.label}`),
    })
    expect(both.length).toBeGreaterThan(1)
    const fills = new Set(both.map((el) => el.getAttribute('fill')))
    expect(fills.size).toBe(1)
  })
})
