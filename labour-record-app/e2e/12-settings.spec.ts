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

  // TEC-52: a non-positive value is now rejected client-side, before any
  // network round trip — no raw "Not Found" / blank state, no PUT ever sent.
  test('rejects a non-positive value without hitting the network', async ({ page }) => {
    await page.goto('/settings')
    let putCalled = false
    await page.route('**/api/settings', (route) => {
      if (route.request().method() === 'PUT') putCalled = true
      return route.continue()
    })
    await page.getByLabel('Max employees per sheet').fill('0')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText(/positive whole number/i)).toBeVisible()
    expect(putCalled).toBe(false)
  })

  // TEC-52: root cause was `await res.json()` throwing on a non-JSON error
  // body and being left unhandled — the button silently re-enabled with no
  // feedback. Mock a raw HTML 500 (the shape a reverse-proxy / platform
  // error page would return) and assert the generic fallback message shows
  // instead of a silent dead end.
  test('a non-JSON (HTML) error response shows a generic message, not a silent failure', async ({ page }) => {
    await page.goto('/settings')
    await page.route('**/api/settings', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'text/html', body: '<html>Internal Server Error</html>' })
      }
      return route.continue()
    })
    await page.getByLabel('Max employees per sheet').fill('12')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText(/save failed/i)).toBeVisible()
  })
})
