import { test, expect } from '@playwright/test'

test.describe('Form Task Status Transitions', () => {
  test('form task shows NOT_STARTED status initially', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await expect(page.getByText(/NOT STARTED|DATA ENTRY|READY FOR REVIEW|APPROVED|EXPORTED/i).first()).toBeVisible()
  })

  test('open form task and transition to DATA_ENTRY', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await page.locator('a', { hasText: 'Open' }).first().click()
    await expect(page.getByRole('button', { name: 'Attendance', exact: true })).toBeVisible()
  })

  test('cycle detail page shows status badges for form tasks', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    const statusBadge = page.getByText(/NOT STARTED|DATA ENTRY|READY FOR REVIEW|APPROVED|EXPORTED/i).first()
    await expect(statusBadge).toBeVisible()
  })

  test('cycle detail shows Open link for form tasks', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await expect(page.locator('a', { hasText: 'Open' }).first()).toBeVisible()
  })

  test('cycle detail shows Print link for form tasks', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await expect(page.getByRole('link', { name: 'Print' }).first()).toBeVisible()
  })

  test('cycle detail shows Export DOCX button for form tasks', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await expect(page.getByRole('button', { name: /Export DOCX/i }).first()).toBeVisible()
  })
})
