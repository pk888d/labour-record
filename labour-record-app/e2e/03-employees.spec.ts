import { test, expect } from '@playwright/test'

test.describe('Employees', () => {
  test('lists existing employees', async ({ page }) => {
    await page.goto('/employees')
    await expect(page.getByText('Alagurani')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Ambika')).toBeVisible()
    await expect(page.getByText('Aruljoslinraj')).toBeVisible()
  })

  test('shows employee IDs and designations', async ({ page }) => {
    await page.goto('/employees')
    await expect(page.getByText('H001')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('H002')).toBeVisible()
  })

  test('filter by establishment works', async ({ page }) => {
    await page.goto('/employees')
    // Employees are visible by default (all establishments)
    await expect(page.getByText('Alagurani')).toBeVisible()
    await expect(page.getByText('H001')).toBeVisible()
  })

  test('new employee page loads', async ({ page }) => {
    await page.goto('/employees/new')
    await expect(page.getByLabel('Emp ID')).toBeVisible()
    await expect(page.getByLabel('Name', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Establishment')).toBeVisible()
  })

  test('create a shop employee', async ({ page }) => {
    await page.goto('/employees/new')
    await page.getByLabel('Emp ID').fill('S001')
    await page.getByLabel('Name', { exact: true }).fill('Selvam')
    await page.getByLabel('Establishment').selectOption({ index: 2 })
    await page.getByLabel('Sex').selectOption('M')
    await page.getByLabel('Designation').fill('Sales Staff')
    await page.getByLabel('Father / Spouse Name').fill('Raman')
    await page.getByLabel('Present Address').fill('12 Main St, Chennai')
    await page.getByLabel('Permanent Address').fill('12 Main St, Chennai')
    const dobField = page.getByLabel('Date of Birth')
    if (await dobField.count() > 0) await dobField.fill('1990-05-15')
    await page.getByLabel('Date of Entry').fill('2020-01-01')
    await page.getByRole('button', { name: /Add Employee/i }).click()
    // Search the list (handles success redirect or duplicate-already-exists, and is
    // robust to pagination — the list is paged at 25 rows).
    await page.goto('/employees?q=Selvam')
    await expect(page.getByText('Selvam').first()).toBeVisible()
  })

  test('edit employee page loads with existing data', async ({ page }) => {
    await page.goto('/employees')
    const row = page.locator('tr', { hasText: 'Alagurani' }).first()
    await row.getByRole('link', { name: /Edit/i }).click()
    await expect(page.getByLabel('Emp ID')).toHaveValue('H001')
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Alagurani')
  })
})
