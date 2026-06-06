import { test, expect } from '@playwright/test'

test.describe('Monthly Cycles', () => {
  test('cycles list page loads', async ({ page }) => {
    await page.goto('/cycles')
    await expect(page.getByRole('heading', { name: /cycles/i })).toBeVisible()
  })

  test('new cycle page loads', async ({ page }) => {
    await page.goto('/cycles/new')
    await expect(page.getByLabel('Establishment')).toBeVisible()
    await expect(page.getByLabel('Month')).toBeVisible()
    await expect(page.getByLabel('Year')).toBeVisible()
  })

  test('create a hospital cycle for June 2099', async ({ page }) => {
    await page.goto('/cycles/new')
    await page.getByLabel('Establishment').selectOption({ index: 1 })
    await page.getByLabel('Month').selectOption('6')
    await page.getByLabel('Year').fill('2099')
    await page.getByRole('button', { name: /Create Cycle/i }).click()
    // Navigate to cycles list (handles both success and duplicate-already-exists case)
    await page.goto('/cycles')
    await expect(page.locator('tr', { hasText: 'DNV Orthocare' }).first()).toBeVisible()
    await expect(page.getByText(/June.*2099|2099.*June/).first()).toBeVisible()
  })

  test('cycle detail shows form tasks', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await expect(page.getByText('Form Tasks')).toBeVisible()
    await expect(page.getByText(/Form XII|Wages Register/i)).toBeVisible()
    await expect(page.getByText(/Form V — Register|Register of Muster Roll/i).first()).toBeVisible()
  })

  test('cycle detail shows employees', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await expect(page.getByText(/Employees in this Cycle/i)).toBeVisible()
    await expect(page.getByText('Alagurani')).toBeVisible()
  })

  test('cycle detail has Print and Export buttons on form tasks', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await expect(page.getByRole('link', { name: 'Print' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Export DOCX/i }).first()).toBeVisible()
  })

  test('prevent duplicate cycle for same establishment + month + year', async ({ page }) => {
    await page.goto('/cycles/new')
    await page.getByLabel('Establishment').selectOption({ index: 1 })
    await page.getByLabel('Month').selectOption('6')
    await page.getByLabel('Year').fill('2099')
    await page.getByRole('button', { name: /Create Cycle/i }).click()
    await expect(page.getByText(/already exists|duplicate/i)).toBeVisible()
  })
})
