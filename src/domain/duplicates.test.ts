import { describe, expect, it } from 'vitest'
import {
  DUPLICATE_MAX_DISTANCE,
  findDuplicateGroups,
  hammingDistance,
  type HashedClip,
} from '@/domain/duplicates'
import { VIDEO_HASHES } from '@/db/videoHashes'

function clip(id: string, poster: string, extra: Partial<HashedClip> = {}): HashedClip {
  return {
    id,
    poster,
    label: id,
    ownerId: 'ex',
    ownerName: 'תרגיל',
    durationSec: 10,
    sizeBytes: 1000,
    ...extra,
  }
}

describe('hammingDistance', () => {
  it('טביעות זהות — מרחק אפס', () => {
    expect(hammingDistance('ffffffffffffffff', 'ffffffffffffffff')).toBe(0)
  })

  it('סיבית אחת שונה — מרחק אחד', () => {
    expect(hammingDistance('0000000000000000', '0000000000000001')).toBe(1)
  })

  it('הפוכות לגמרי — 64', () => {
    expect(hammingDistance('0000000000000000', 'ffffffffffffffff')).toBe(64)
  })

  it('סופר סיביות גם בחצי העליון של המספר', () => {
    expect(hammingDistance('8000000000000000', '0000000000000000')).toBe(1)
  })
})

describe('findDuplicateGroups', () => {
  const hashes = {
    a: '0000000000000000',
    b: '0000000000000000', // זהה ל-a
    c: '0000000000000003', // שתי סיביות מ-a
    far: 'ffffffffffffffff',
  }

  it('מקבץ טביעות זהות', () => {
    const groups = findDuplicateGroups([clip('1', 'a'), clip('2', 'b')], hashes)
    expect(groups).toHaveLength(1)
    expect(groups[0].clips.map((c) => c.id).sort()).toEqual(['1', '2'])
    expect(groups[0].maxDistance).toBe(0)
  })

  it('לא מקבץ טביעות רחוקות', () => {
    expect(findDuplicateGroups([clip('1', 'a'), clip('2', 'far')], hashes)).toEqual([])
  })

  it('הקיבוץ טרנזיטיבי — שלושה עותקים הם החלטה אחת ולא שלושה זוגות', () => {
    const groups = findDuplicateGroups(
      [clip('1', 'a'), clip('2', 'b'), clip('3', 'c')],
      hashes
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].clips).toHaveLength(3)
  })

  it('קליפ בלי טביעה מדולג בשקט ולא מפיל את החישוב', () => {
    const groups = findDuplicateGroups(
      [clip('1', 'a'), clip('2', 'b'), clip('3', 'אין-כזה')],
      hashes
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].clips.map((c) => c.id).sort()).toEqual(['1', '2'])
  })

  it('הארוך ראשון בתוך הקבוצה — הוא זה שנשמר בדרך כלל', () => {
    const groups = findDuplicateGroups(
      [clip('קצר', 'a', { durationSec: 5 }), clip('ארוך', 'b', { durationSec: 20 })],
      hashes
    )
    expect(groups[0].clips[0].id).toBe('ארוך')
  })

  it('קבוצות ודאיות מוצגות לפני מועמדות', () => {
    const spread = { ...hashes, d: '000000000000003f' } // שש סיביות מ-a
    const groups = findDuplicateGroups(
      [clip('1', 'a'), clip('2', 'b'), clip('3', 'c'), clip('4', 'd')],
      // סף נמוך כדי לקבל שתי קבוצות נפרדות ולא אחת טרנזיטיבית
      spread,
      1
    )
    expect(groups[0].maxDistance).toBe(0)
  })

  it('רשימה ריקה או יחיד — אין קבוצות', () => {
    expect(findDuplicateGroups([], hashes)).toEqual([])
    expect(findDuplicateGroups([clip('1', 'a')], hashes)).toEqual([])
  })
})

/**
 * הרצה על הטביעות האמיתיות שנשלחות עם האפליקציה.
 *
 * זו לא בדיקת רגרסיה על מספר מדויק — מניפסט חדש ישנה אותו — אלא שער שפיות:
 * שהטבלה נוצרה, שהיא בפורמט הנכון, ושהסף לא מקבץ את חצי המאגר לקבוצה אחת
 * ענקית (הכשל האופייני של קיבוץ טרנזיטיבי עם סף רחב מדי).
 */
describe('הטביעות שנשלחות עם האפליקציה', () => {
  const posters = Object.keys(VIDEO_HASHES)

  it('קיימות, ובפורמט של 64 סיביות בהקסה', () => {
    expect(posters.length).toBeGreaterThan(100)
    for (const p of posters) expect(VIDEO_HASHES[p]).toMatch(/^[0-9a-f]{16}$/)
  })

  it('הסף לא בולע את המאגר לקבוצה אחת', () => {
    const clips = posters.map((poster, i) => clip(`v${i}`, poster))
    const groups = findDuplicateGroups(clips, VIDEO_HASHES, DUPLICATE_MAX_DISTANCE)
    const flagged = groups.reduce((n, g) => n + g.clips.length, 0)
    // מועמדים אמורים להיות מיעוט קטן; קבוצה שבולעת רבע מהמאגר היא סף שבור
    expect(flagged).toBeLessThan(posters.length / 4)
    for (const g of groups) expect(g.clips.length).toBeLessThan(posters.length / 10)
  })
})
