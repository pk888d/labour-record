import { test, expect } from '@playwright/test'

test.describe('Admin views — audit log, search, pagination', () => {
  test('Audit Log is reachable from the sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.locator('aside').getByRole('link', { name: 'Audit Log' }).click()
    await expect(page).toHaveURL(/\/audit/)
    await expect(page.getByRole('heading', { name: /Audit Log/i })).toBeVisible()
  })

  test('employee search narrows the list', async ({ page }) => {
    await page.goto('/employees?q=Alagurani')
    await expect(page.getByText('Alagurani')).toBeVisible()
    // A non-matching seeded name should not appear in the filtered result.
    await expect(page.getByText('Ambika')).toHaveCount(0)
  })

  test('dashboard shows the form workload panel', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/Form workload/i)).toBeVisible()
  })
})
