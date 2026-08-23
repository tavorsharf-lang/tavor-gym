/**
 * זיהוי סרטונים כפולים.
 *
 * המאגר צמח מייבוא אוטומטי, ואותו סרטון נכנס אליו יותר מפעם אחת תחת שמות
 * שונים. פעם אחת כבר נמחקו 33 כפילויות ידנית, אחת-אחת, בהשוואת פריימים.
 *
 * ההשוואה היא על טביעת אצבע תפיסתית של התמונה הממוזערת (`db/videoHashes.ts`,
 * נוצר ב-`scripts/gen-video-hashes.mjs`), ולא על גודל הקובץ ומשך הסרטון —
 * הבחירה הזו נמדדה ולא הונחה: על 488 הקליפים שבמניפסטים אין אף זוג עם אותו
 * גודל ואותו משך, כי כל עותק עבר קידוד מחדש בפרמטרים אחרים. השוואת מטא-דאטה
 * הייתה מחזירה אפס כפילויות אמיתיות ועשרות שגויות.
 *
 * המילה "מועמד" חוזרת כאן בכוונה: תמונה ממוזערת דומה אינה הוכחה. שני סרטונים
 * של אותו תרגיל, מאותה זווית, בתחילת אותה תנועה — ייראו כמעט זהים בפריים אחד
 * ויהיו שני סרטונים שונים לגמרי. לכן הפונקציות כאן *מציעות* ולעולם לא מוחקות.
 */

/**
 * מרחק המינג מקסימלי שנחשב מועמד.
 *
 * 0 הוא תמונה זהה בייט-בייט אחרי הקטנה; עד 8 סיביות מתוך 64 סופג קידוד מחדש,
 * חיתוך קל ושינוי בהירות. מעל זה מתחילים להיכנס סרטונים שונים של אותו תרגיל,
 * וברשימה של "מה למחוק" מחיר של מועמד שגוי גבוה ממחיר של כפילות שנשארה.
 */
export const DUPLICATE_MAX_DISTANCE = 8

/** זהה לחלוטין — הרמה שבה אפשר להיות בטוחים */
export const IDENTICAL_DISTANCE = 0

export interface HashedClip {
  /** מזהה הנכס (`bundled:<src>`) */
  id: string
  /** נתיב ה-poster — המפתח בטבלת ההאשים */
  poster: string
  label: string
  /** התרגיל שהסרטון מוצג תחתיו כרגע */
  ownerId: string
  ownerName: string
  durationSec: number
  sizeBytes: number
}

export interface DuplicateGroup {
  /** הקליפים שזוהו כאותו סרטון, מהארוך לקצר */
  clips: HashedClip[]
  /** המרחק הגדול ביותר בתוך הקבוצה — 0 הוא זהות מוחלטת */
  maxDistance: number
}

/**
 * טביעה מפורקת לשני חצאים של 32 סיביות.
 *
 * ‏BigInt הוא הדרך המתבקשת לייצג 64 סיביות ב-JS, והוא גם היה איטי פי עשרים
 * מכדי לרוץ כאן: המסך משווה כל קליפ לכל קליפ, כלומר ~119 אלף השוואות, וזה
 * נמדד ב-239ms על מחשב — כלומר קפיאה מורגשת בפתיחת המסך בטלפון. שני מספרים
 * רגילים ו-popcount בשלוש פעולות עושים את אותו דבר בסדר גודל פחות.
 * ‏8 ספרות הקסה נכנסות בדיוק ב-32 סיביות, ולכן הפירוק מדויק ולא מקורב.
 */
type Bits64 = readonly [hi: number, lo: number]

function parseHash(hex: string): Bits64 {
  return [parseInt(hex.slice(0, 8), 16) >>> 0, parseInt(hex.slice(8, 16), 16) >>> 0]
}

/** ספירת סיביות דלוקות ב-32 סיביות, בלי לולאה */
function popcount(value: number): number {
  let n = value - ((value >>> 1) & 0x55555555)
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333)
  n = (n + (n >>> 4)) & 0x0f0f0f0f
  return (Math.imul(n, 0x01010101) >>> 24) & 0xff
}

function distanceOf(a: Bits64, b: Bits64): number {
  return popcount((a[0] ^ b[0]) >>> 0) + popcount((a[1] ^ b[1]) >>> 0)
}

/** מספר הסיביות השונות בין שתי טביעות הקסדצימליות בנות 64 סיביות */
export function hammingDistance(a: string, b: string): number {
  return distanceOf(parseHash(a), parseHash(b))
}

/**
 * מקבץ קליפים לקבוצות של "כנראה אותו סרטון".
 *
 * הקיבוץ הוא טרנזיטיבי (union-find פשוט): אם A דומה ל-B ו-B דומה ל-C, שלושתם
 * קבוצה אחת גם כשהמרחק בין A ל-C גדול מהסף. זה נכון למה שמחפשים — שלושה
 * עותקים של אותו סרטון — ומחזיר החלטה אחת למשתמש במקום שלושה זוגות חופפים.
 *
 * @param clips הקליפים לבדיקה. חובה שיהיו כבר מסוננים ממה שהמשתמש מחק.
 * @param hashes טבלת ההאשים לפי נתיב poster. קליפ בלי טביעה מדולג בשקט —
 *   תמונה שלא הייתה בדיסק כשהסקריפט רץ אינה שגיאה שהמשתמש צריך לראות.
 */
export function findDuplicateGroups(
  clips: readonly HashedClip[],
  hashes: Readonly<Record<string, string>>,
  maxDistance: number = DUPLICATE_MAX_DISTANCE
): DuplicateGroup[] {
  // הפירוק קורה פעם אחת לכל קליפ ולא בכל השוואה — שם היה כל ההפרש
  const hashed = clips
    .map((clip) => {
      const hex = hashes[clip.poster]
      return hex && /^[0-9a-f]{16}$/i.test(hex) ? { clip, bits: parseHash(hex) } : null
    })
    .filter((c): c is { clip: HashedClip; bits: Bits64 } => c !== null)

  const parent = hashed.map((_, i) => i)
  const find = (i: number): number => {
    let root = i
    while (parent[root] !== root) root = parent[root]
    // כיווץ מסלול — הרשימה קטנה, אבל זה גם מונע שרשרת עמוקה
    let walk = i
    while (parent[walk] !== root) {
      const next = parent[walk]
      parent[walk] = root
      walk = next
    }
    return root
  }

  /** המרחק הגדול ביותר שנצפה בתוך כל קבוצה, לפי השורש */
  const worst = new Map<number, number>()

  for (let i = 0; i < hashed.length; i++) {
    for (let j = i + 1; j < hashed.length; j++) {
      const distance = distanceOf(hashed[i].bits, hashed[j].bits)
      if (distance > maxDistance) continue
      const a = find(i)
      const b = find(j)
      if (a !== b) parent[b] = a
      const root = find(i)
      worst.set(root, Math.max(worst.get(root) ?? 0, distance))
    }
  }

  const byRoot = new Map<number, HashedClip[]>()
  for (let i = 0; i < hashed.length; i++) {
    const root = find(i)
    const list = byRoot.get(root)
    if (list) list.push(hashed[i].clip)
    else byRoot.set(root, [hashed[i].clip])
  }

  const groups: DuplicateGroup[] = []
  for (const [root, list] of byRoot) {
    if (list.length < 2) continue
    groups.push({
      // הארוך ראשון: כשמוחקים כפילות שומרים בדרך כלל את הגרסה השלמה
      clips: [...list].sort((a, b) => b.durationSec - a.durationSec),
      maxDistance: worst.get(root) ?? 0,
    })
  }

  // הוודאיות קודם — קבוצה במרחק 0 היא החלטה קלה, וכדאי שהיא תהיה ראשונה
  return groups.sort((a, b) => a.maxDistance - b.maxDistance || b.clips.length - a.clips.length)
}
