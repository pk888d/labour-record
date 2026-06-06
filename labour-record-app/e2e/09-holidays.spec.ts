import { test, expect } from '@playwright/test'

const TEST_DATES = ['2099-03-21', '2099-04-14', '2099-05-05']

test.beforeAll(async ({ request }) => {
  // Clean up any leftover test holidays
  const res = await request.get('/api/holidays?year=2099')
  const holidays = await res.json() as Array<{ id: string; date: string }>
  for (const h of holidays) {
    const d = h.date.substring(0, 10)
    if (TEST_DATES.includes(d)) {
      await request.delete(`/api/holidays/${h.id}`)
    }
  }
})

test.afterAll(async ({ request }) => {
  // Clean up test holidays we created
  const res = await request.get('/api/holidays?year=2099')
  const holidays = await res.json() as Array<{ id: string; date: string }>
  for (const h of holidays) {
    const d = h.date.substring(0, 10)
    if (TEST_DATES.includes(d)) {
      await request.delete(`/api/holidays/${h.id}`)
    }
  }
})

test.describe('Holidays Page', () => {
  test('holidays page loads', async ({ page }) => {
    await page.goto('/holidays')
    await expect(page.getByRole('heading', { name: 'Government Holidays' })).toBeVisible()
  })

  test('can add a holiday', async ({ page }) => {
    await page.goto('/holidays')
    await page.getByLabel('Date').fill('2099-03-21')
    await page.getByLabel('Holiday Name').fill('Test Holiday March')
    await page.getByRole('button', { name: 'Add Holiday' }).click()
    await expect(page.getByText('Test Holiday March').first()).toBeVisible()
  })

  test('duplicate holiday date shows error', async ({ page }) => {
    await page.goto('/holidays')
    // First add
    await page.getByLabel('Date').fill('2099-04-14')
    await page.getByLabel('Holiday Name').fill('Holiday A')
    await page.getByRole('button', { name: 'Add Holiday' }).click()
    await expect(page.getByText('Holiday A').first()).toBeVisible()
    // Duplicate add
    await page.getByLabel('Date').fill('2099-04-14')
    await page.getByLabel('Holiday Name').fill('Holiday B')
    await page.getByRole('button', { name: 'Add Holiday' }).click()
    await expect(page.getByText(/already exists/i)).toBeVisible()
  })

  test('can delete a holiday', async ({ page }) => {
    await page.goto('/holidays')
    // Add then delete
    await page.getByLabel('Date').fill('2099-05-05')
    await page.getByLabel('Holiday Name').fill('Delete Me Holiday')
    await page.getByRole('button', { name: 'Add Holiday' }).click()
    await expect(page.getByText('Delete Me Holiday').first()).toBeVisible()
    await page.locator('tr', { hasText: 'Delete Me Holiday' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Delete Me Holiday')).not.toBeVisible()
  })
})
