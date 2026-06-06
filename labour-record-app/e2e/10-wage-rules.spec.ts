import { test, expect } from '@playwright/test'

test.describe('Wage Rules Page', () => {
  test('wage rules page loads', async ({ page }) => {
    await page.goto('/wage-rules')
    await expect(page.getByRole('heading', { name: 'Wage Rules' })).toBeVisible()
  })

  test('shows establishment selector', async ({ page }) => {
    await page.goto('/wage-rules')
    await expect(page.getByLabel('Establishment')).toBeVisible()
  })

  test('selecting an establishment shows the rules table', async ({ page }) => {
    await page.goto('/wage-rules')
    await page.getByLabel('Establishment').selectOption({ index: 1 })
    await expect(page.getByText('HOLIDAY_MULTIPLIER')).toBeVisible()
    await expect(page.getByText('2').first()).toBeVisible()
  })

  test('can edit a wage rule', async ({ page }) => {
    await page.goto('/wage-rules')
    await page.getByLabel('Establishment').selectOption({ index: 1 })
    await page.locator('tr', { hasText: 'HOLIDAY_MULTIPLIER' }).getByRole('button', { name: 'Edit' }).click()
    const input = page.locator('tr', { hasText: 'HOLIDAY_MULTIPLIER' }).getByRole('spinbutton')
    await input.fill('1.5')
    await page.locator('tr', { hasText: 'HOLIDAY_MULTIPLIER' }).getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('1.5').first()).toBeVisible()
  })

  test('reset to defaults restores default values', async ({ page }) => {
    await page.goto('/wage-rules')
    await page.getByLabel('Establishment').selectOption({ index: 1 })
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Reset to Defaults' }).click()
    await expect(page.getByText('2').first()).toBeVisible()
  })
})
