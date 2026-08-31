import { beforeEach, describe, expect, it } from 'vitest'
import { lockBodyScroll } from './scrollLock'

/**
 * הבדיקה המרכזית כאן היא "שחרור בסדר הפוך" — היא זו שנכשלה בקוד הקודם, והיא
 * זו שמתארת את מה שקרה בפועל: הגיליון נסגר לפני הנגן שנפתח מעליו.
 *
 * כל בדיקה משחררת את מה שנעלה, כדי שהמונה שברמת המודול יחזור לאפס. בדיקה
 * שתשאיר נעילה פתוחה תרעיל את הבאות אחריה באותו קובץ.
 */

const overflow = (): string => document.body.style.overflow

beforeEach(() => {
  document.body.style.overflow = ''
})

describe('lockBodyScroll — נועל בודד', () => {
  it('נועל, ומחזיר בדיוק את מה שהיה', () => {
    expect(overflow()).toBe('')
    const release = lockBodyScroll()
    expect(overflow()).toBe('hidden')
    release()
    expect(overflow()).toBe('')
  })

  it('ערך קיים שאינו ריק נשמר ומוחזר', () => {
    document.body.style.overflow = 'scroll'
    const release = lockBodyScroll()
    expect(overflow()).toBe('hidden')
    release()
    expect(overflow()).toBe('scroll')
  })
})

/**
 * המבנה האמיתי: גיליון ההחלפה פתוח, ונגן הסרטונים נפתח מעליו כ-portal אח.
 */
describe('lockBodyScroll — שני נועלים מקוננים', () => {
  it('שחרור בסדר הפוך — הגיליון נסגר ראשון, ואחרי הנגן הדף נגלל', () => {
    const sheet = lockBodyScroll()
    const player = lockBodyScroll()
    expect(overflow()).toBe('hidden')

    // הגיליון נסגר בזמן שהנגן עדיין פתוח — הרקע חייב להישאר נעול
    sheet()
    expect(overflow()).toBe('hidden')

    // וכשגם הנגן נסגר, הדף חוזר להיות גליל. כאן הקוד הקודם השאיר 'hidden'
    player()
    expect(overflow()).toBe('')
  })

  it('שחרור בסדר הפתיחה — גם הוא לא משאיר נעילה תלויה', () => {
    const sheet = lockBodyScroll()
    const player = lockBodyScroll()
    player()
    expect(overflow()).toBe('hidden')
    sheet()
    expect(overflow()).toBe('')
  })

  it('הפנימי לא מאמץ את הנעילה של החיצוני כמצב הבסיס', () => {
    document.body.style.overflow = 'auto'
    const sheet = lockBodyScroll()
    const player = lockBodyScroll()
    sheet()
    player()
    // 'auto' ולא 'hidden' — הערך המקורי נקרא פעם אחת, לפני הנעילה הראשונה
    expect(overflow()).toBe('auto')
  })
})

describe('lockBodyScroll — שחרור כפול', () => {
  it('קריאה שנייה לאותו שחרור לא פותחת נעילה של מישהו אחר', () => {
    const sheet = lockBodyScroll()
    const player = lockBodyScroll()

    player()
    player() // הקריאה המיותרת — אסור שתשחרר את הגיליון
    expect(overflow()).toBe('hidden')

    sheet()
    expect(overflow()).toBe('')
  })

  it('שחרור אחרי שהכל כבר שוחרר לא משבש נעילה עתידית', () => {
    const first = lockBodyScroll()
    first()
    first()
    expect(overflow()).toBe('')

    const second = lockBodyScroll()
    expect(overflow()).toBe('hidden')
    second()
    expect(overflow()).toBe('')
  })
})
