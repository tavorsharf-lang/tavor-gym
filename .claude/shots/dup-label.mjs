/** בדיקה: האם שתי שורות באותה רשימה נושאות אותו שם נגיש */
export default async ({ page, shot, base }) => {
  await page.goto(`${base}#/freestyle`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  await page.getByRole('button', { name: /^יד קדמית —/ }).click()
  await page.waitForTimeout(1800)
  await shot('biceps-list')

  const labels = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-label^="אילו שרירים עובדים"]')].map((el) =>
      el.getAttribute('aria-label')
    )
  )
  const dupes = labels.filter((l, i) => labels.indexOf(l) !== i)
  console.log('תוויות ברשימה:', JSON.stringify(labels, null, 1))
  console.log('כפולות:', JSON.stringify([...new Set(dupes)]))
}
