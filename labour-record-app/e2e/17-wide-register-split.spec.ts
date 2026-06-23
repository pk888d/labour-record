import { test, expect, type Page } from '@playwright/test'

async function cycleId(page: Page): Promise<string> {
  await page.goto('/cycles')
  await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
  await page.waitForURL(/\/cycles\/[^/]+$/)
  return page.url().split('/').pop() ?? ''
}

// DNV has 6 employees (≤ max-per-sheet) → a single employee-chunk, so each wide
// register renders exactly 2 .form-page (part 1 + part 2).
test.describe('Wide register 2-page split', () => {
  test('Form IV (Overtime) splits into two pages with repeated identity + continued marker', async ({ page }) => {
    const id = await cycleId(page)
    await page.goto(`/print/${id}/HOSPITAL_FORM_IV`)
    await expect(page.getByText(/REGISTER OF OVERTIME/i).first()).toBeVisible({ timeout: 20000 })
    expect(await page.locator('.form-page').count()).toBe(2)
    await expect(page.getByText(/continued/i)).toBeVisible()
    // "Name" identity header appears on both parts.
    expect(await page.getByRole('columnheader', { name: 'Name', exact: true }).count()).toBeGreaterThanOrEqual(2)
  })

  test('Form V (Muster) splits into two pages', async ({ page }) => {
    const id = await cycleId(page)
    await page.goto(`/print/${id}/HOSPITAL_FORM_V`)
    await expect(page.getByText(/MUSTER ROLL/i).first()).toBeVisible({ timeout: 20000 })
    expect(await page.locator('.form-page').count()).toBe(2)
    await expect(page.getByText(/continued/i)).toBeVisible()
  })
})
