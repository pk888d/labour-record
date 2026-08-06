import { test, expect } from '@playwright/test'

test.describe('Monthly Cycles', () => {
  // Clean up the far-future test cycle so it doesn't pollute print views / other tests.
  test.afterAll(async ({ request }) => {
    const res = await request.get('/api/cycles')
    if (!res.ok()) return
    const cycles = (await res.json()) as { id: string; year: number }[]
    for (const c of cycles.filter((c) => c.year === 2099)) {
      await request.delete(`/api/cycles/${c.id}`)
    }
  })

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
    // Wait for the create POST + client redirect to settle before asserting
    await page.waitForLoadState('networkidle')
    await page.goto('/cycles', { waitUntil: 'networkidle' })
    await expect(page.locator('tr', { hasText: 'DNV Orthocare' }).first()).toBeVisible()
    await expect(page.getByText(/June.*2099|2099.*June/).first()).toBeVisible({ timeout: 15000 })
  })

  test('cycle detail shows form tasks', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await expect(page.getByText('Form Tasks')).toBeVisible()
    // .first(): the compliance pre-flight panel may also mention form names
    await expect(page.getByText(/Form XII|Wages Register/i).first()).toBeVisible()
    await expect(page.getByText(/Form V — Register|Register of Muster Roll/i).first()).toBeVisible()
  })

  test('cycle detail shows employees', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await expect(page.getByText(/Employees in this Cycle/i)).toBeVisible()
    // Scope to the roster cell: the pre-flight panel may also name employees.
    await expect(page.getByRole('cell', { name: 'Alagurani' })).toBeVisible()
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

  // TEC-52: Sync Employees used a bare `await res.json()` on the error path
  // with no try/catch — a non-JSON error body threw an unhandled rejection
  // and the button silently re-enabled with zero feedback. Mock a raw HTML
  // error response and assert the generic message shows, proving the shared
  // readApiError() helper generalizes beyond Settings and doesn't leave the
  // button stuck silently busy.
  test('Sync Employees shows a generic message (not a silent failure) on a non-JSON error response', async ({ page }) => {
    await page.goto('/cycles')
    await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
    await page.route('**/api/cycles/*/sync-employees', (route) =>
      route.fulfill({ status: 502, contentType: 'text/html', body: '<html>Bad Gateway</html>' })
    )
    const syncButton = page.getByRole('button', { name: 'Sync Employees' })
    await syncButton.click()
    await expect(page.getByText(/sync failed/i)).toBeVisible()
    // The button must re-enable with visible feedback, not get stuck silently busy.
    await expect(syncButton).toBeEnabled()
  })
})
