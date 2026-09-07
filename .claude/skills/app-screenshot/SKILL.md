---
name: app-screenshot
description: מריץ את האפליקציה בדפדפן אמיתי, מנווט בה ומצלם מסכים במסגרת אייפון. להשתמש כשצריך לראות שינוי עיצוב בפועל, לאמת שמסך נכנס בלי גלילה, לבדוק RTL, או לצלם מצב שקשה להגיע אליו ידנית. עדיף על בניית סקריפט Playwright מאפס.
---

# צילום האפליקציה החיה

`npm test` מוכיח שהלוגיקה נכונה. הוא לא מראה שהמסך **נכנס**, שהטקסט לא נחתך,
שהמספר לא התהפך ב-RTL, ושהכפתור הכתום יושב איפה שהוא אמור. את זה רואים רק
בצילום — ובפרויקט הזה, שכל העיצוב בו נמדד על מסגרת 390×846, זה חלק מהעבודה
ולא ליטוש.

**אל תבנה סקריפט Playwright מאפס.** `scripts/shoot.mjs` כבר פותר את ארבעת
הדברים שנשברים בכל פעם מחדש: איתור הבינארי במטמון של Playwright (שם התיקייה
משתנה עם הגרסה, והבינארי נקרא "Google Chrome for Testing" ולא "Chromium"),
מסגרת האייפון, דילוג על מסך הפתיחה, וגישה ל-store ול-DB מתוך הדף.

## הרצה

```bash
npm run dev                                       # בטרמינל נפרד, חייב לרוץ
node scripts/shoot.mjs .claude/shots/<name>.mjs   # התרחיש
```

הצילומים נשמרים ליד קובץ התרחיש (או ב-`--out DIR`), ממוספרים לפי סדר הצילום.
**קרא אותם עם `Read`** — צילום שלא הסתכלו בו לא הוכיח כלום, ומסך ריק הוא כישלון
טעינה ולא "אין מה לראות".

היציאה היא בקוד 1 אם נזרקה שגיאה בדף. כלומר הצילום הוא גם בדיקת עשן — לא רק תמונה.

## כתיבת תרחיש

להעתיק את `.claude/shots/example.mjs` ולשנות. תרחישים הם חד-פעמיים במהותם:
הם מתארים את המסך שבודקים *עכשיו*, ואין טעם לתחזק אותם אחרי שהצילום נבדק.

```js
export default async ({ page, shot, store, base }) => {
  // דרך ה-store — כשרק המצב הסופי מעניין
  await store(async ({ useWorkout }) => {
    await useWorkout.getState().startWithItems(['lat-pulldown'])
    const key = useWorkout.getState().workout.currentKey
    await useWorkout.getState().logSet(key, 'work', 45, 10)
  })
  await page.goto(`${base}#/workout`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await shot('after-set')

  // דרך המסכים — כשהמסלול עצמו הוא מה שבודקים
  await page.getByRole('button', { name: /^סיים סט$/ }).click()
  await page.waitForTimeout(1500)
  await shot('rest')
}
```

`store(fn)` מקבל את `useWorkout`, את `db` ואת כל `db/queries` — זה הקיצור שחוסך
את רוב עבודת ההכנה. הוא רץ בתוך הדף, ולכן ה-`fn` חייב להיות עצמאי (בלי סגור על
משתנים מבחוץ).

## מלכודות שכבר עלו

- **`getByLabel('משקל')` תופס גם את כפתורי ה-±** (`aria-label="הפחת משקל"`).
  להשתמש ב-`getByRole('textbox', { name: 'משקל' })`.
- **`strict mode violation` על שמות שהם תחילית של אחרים** — `'קשה'` תופס גם
  `'קשה מאוד'`. להוסיף `{ exact: true }`.
- **שאלון הקושי דלוק כברירת מחדל**, ולכן "סיים סט אחרון" מוביל לדירוג ולא
  למנוחה. לכבות ב-`store` (`saveSettings({ askRating: false })`) או לענות עליו.
- `waitForTimeout` אחרי כל ניווט — `useLiveQuery` נפתר אחרי הציור הראשון,
  וצילום מוקדם מדי תופס שלד טעינה.
