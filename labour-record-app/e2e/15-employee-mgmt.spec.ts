import { test, expect } from '@playwright/test'

test.describe('Employee management (phase-2 wave A)', () => {
  test('create an employee with only name + salary (auto empId)', async ({ page }) => {
    await page.goto('/employees/new')
    await page.getByLabel('Name', { exact: true }).fill('Minimal Mary')
    await page.getByLabel('Establishment').selectOption({ index: 1 })
    await page.getByLabel('Default Total Salary').fill('15000')
    await page.getByRole('button', { name: /Add Employee/i }).click()
    await page.goto('/employees?q=Minimal Mary')
    await expect(page.getByText('Minimal Mary').first()).toBeVisible()
  })

  test('payment mode Cash disables the bank fields', async ({ page }) => {
    await page.goto('/employees/new')
    await page.getByLabel('Payment Mode').selectOption('CASH')
    const bankSection = page.locator('section').filter({ hasText: 'Bank Details' })
    await expect(bankSection.getByPlaceholder('Stored encrypted')).toBeDisabled()
  })

  test('import page is reachable and shows the sample link', async ({ page }) => {
    await page.goto('/employees')
    await page.getByRole('link', { name: /Import/i }).click()
    await expect(page).toHaveURL(/\/employees\/import/)
    await expect(page.getByRole('link', { name: /Download Template/i })).toBeVisible()
  })
})
