import { test, expect } from '@playwright/test'

test.describe('Settings — print config', () => {
  // Always restore defaults so other specs see env/default behavior.
  test.afterAll(async ({ request }) => {
    await request.put('/api/settings', { data: { maxRowsPerSheet: '', minFillRows: '' } })
  })

  test('Settings page is reachable from the sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.locator('aside').getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings$/)
    await expect(page.getByText('Max employees per sheet')).toBeVisible()
  })

  test('saving a value persists it', async ({ page }) => {
    await page.goto('/settings')
    const maxInput = page.getByLabel('Max employees per sheet')
    await maxInput.fill('10')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Saved.')).toBeVisible()

    // Reload — the saved value is shown again.
    await page.goto('/settings')
    await expect(page.getByLabel('Max employees per sheet')).toHaveValue('10')
  })

  test('rejects a non-positive value', async ({ page }) => {
    await page.goto('/settings')
    await page.getByLabel('Max employees per sheet').fill('0')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText(/positive whole number/i)).toBeVisible()
  })

  test('clearing a value reverts to default (blank persists)', async ({ page }) => {
    await page.goto('/settings')
    await page.getByLabel('Max employees per sheet').fill('')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText('Saved.')).toBeVisible()
    await page.goto('/settings')
    await expect(page.getByLabel('Max employees per sheet')).toHaveValue('')
  })
})
