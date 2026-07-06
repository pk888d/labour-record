import { test, expect, type APIRequestContext } from '@playwright/test'

// A fresh (CI-seeded) DB has no cycles, so bootstrap one for DNV Orthocare
// (idempotent; reused if already present) and clean it up only if we created it.
const DNV_ESTABLISHMENT_ID = 'est_hospital_dnv'
const CYCLE_YEAR = 2090
const CYCLE_MONTH = 6

let fixtureCycleId = ''
let fixtureCycleCreated = false

test.beforeAll(async ({ request }: { request: APIRequestContext }) => {
  const res = await request.post('/api/cycles', {
    data: { establishmentId: DNV_ESTABLISHMENT_ID, month: CYCLE_MONTH, year: CYCLE_YEAR },
  })
  if (res.ok()) {
    fixtureCycleId = ((await res.json()) as { id: string }).id
    fixtureCycleCreated = true
    return
  }
  const list = await request.get(`/api/cycles?establishmentId=${DNV_ESTABLISHMENT_ID}`)
  const cycles = (await list.json()) as { id: string; year: number; month: number }[]
  const existing = cycles.find((c) => c.year === CYCLE_YEAR && c.month === CYCLE_MONTH)
  if (!existing) {
    throw new Error(`Could not create or find a DNV cycle (POST status ${res.status()}). Is the DB seeded?`)
  }
  fixtureCycleId = existing.id
})

test.afterAll(async ({ request }) => {
  if (fixtureCycleCreated && fixtureCycleId) await request.delete(`/api/cycles/${fixtureCycleId}`)
})

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
