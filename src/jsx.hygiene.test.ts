/** @vitest-environment node */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * מאפיין שנשאר *מחוץ* לתגית.
 *
 * `<ScreenHeader title="גיבוי" />` ואחריו שורה `fallback="/settings"` הוא JSX
 * חוקי לחלוטין: התגית נסגרה, ולכן השורה שאחריה היא טקסט. TypeScript שותק,
 * הבדיקות עוברות, והמסך מדפיס למשתמש את המחרוזת `fallback="/settings"` —
 * וגרוע מזה, המאפיין שהתכוונו להעביר פשוט לא הועבר.
 *
 * זה בדיוק מה שקרה בארבעת מסכי המשנה של ההגדרות. הבדיקה כאן היא הרשת שתופסת
 * את זה, כי אף כלי אחר בפרויקט לא תופס אותו.
 */

const SRC = dirname(fileURLToPath(import.meta.url))

function tsxFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...tsxFiles(full))
    else if (entry.name.endsWith('.tsx')) out.push(full)
  }
  return out
}

/** `foo="..."`, `foo={...}` או `foo` לבד — שורה שנראית כמו מאפיין ותו לא */
const LOOKS_LIKE_ATTRIBUTE = /^\s*[a-zA-Z][\w:-]*(=("[^"]*"|\{.*\}|'[^']*'))?\s*$/

describe('היגיינת JSX', () => {
  it('אין מאפיין ששוטט אל מחוץ לתגית שנסגרה', () => {
    const strays: string[] = []

    for (const file of tsxFiles(SRC)) {
      const lines = readFileSync(file, 'utf8').split('\n')
      for (let i = 1; i < lines.length; i += 1) {
        const prev = lines[i - 1].trimEnd()
        // רק אחרי תגית שנסגרה על עצמה — שם המאפיין כבר לא יכול להשתייך לאיש
        if (!prev.endsWith('/>')) continue
        const line = lines[i]
        if (!LOOKS_LIKE_ATTRIBUTE.test(line)) continue
        // מילות מפתח של JS שיכולות לפתוח שורה תמימה אחרי סגירת תגית
        if (/^\s*(return|else|case|default|break|continue)\b/.test(line)) continue
        strays.push(`${file.slice(SRC.length + 1)}:${i + 1}: ${line.trim()}`)
      }
    }

    expect(strays).toEqual([])
  })
})
