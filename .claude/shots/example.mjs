/**
 * תרחיש לדוגמה — אימון חופשי מהמסך הראשי ועד הכרטיס.
 *
 * מעתיקים אותו, משנים, ומריצים. תרחישים הם חד-פעמיים במהותם: הם מתארים את
 * המסך שבודקים *עכשיו*, ואין טעם לתחזק אותם אחרי שהצילום נבדק.
 */
export default async ({ page, shot, store, base }) => {
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await shot('home')

  // דרך המסכים — כמו משתמש
  await page.getByRole('button', { name: /^אימון חופשי/ }).first().click()
  await page.waitForTimeout(1600)
  await shot('muscle-grid')

  await page.getByRole('button', { name: /^גב —/ }).click()
  await page.waitForTimeout(1600)
  await shot('exercise-list')

  // או דרך ה-store — מהיר ויציב כשרק המצב הסופי מעניין
  await store(async ({ useWorkout }) => {
    await useWorkout.getState().startWithItems(['lat-pulldown'])
  })
  await page.goto(`${base}#/workout`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await shot('card')
}
