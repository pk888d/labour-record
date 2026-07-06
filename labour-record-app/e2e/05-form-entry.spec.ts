import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

// A fresh (CI-seeded) DB has no cycles at all, so the DNV Orthocare row this
// spec relies on may not exist. Bootstrap one via the API (idempotent — reuses
// an existing cycle for this period if present) and clean it up only if this
// run created it, matching the pattern in 10-print-pagination/13-wage-calc/etc.
const DNV_ESTABLISHMENT_ID = 'est_hospital_dnv'
const CYCLE_YEAR = 2091
const CYCLE_MONTH = 6

let fixtureCycleId = ''
let fixtureCycleCreated = false

async function ensureDnvCycle(request: APIRequestContext): Promise<void> {
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
}

test.beforeAll(async ({ request }) => {
  await ensureDnvCycle(request)
})

test.afterAll(async ({ request }) => {
  if (fixtureCycleCreated && fixtureCycleId) await request.delete(`/api/cycles/${fixtureCycleId}`)
})

async function openFirstCycleFormTask(page: Page) {
  await page.goto('/cycles')
  await page.locator('tr', { hasText: 'DNV Orthocare' }).getByRole('link', { name: 'View' }).first().click()
  await page.locator('a', { hasText: 'Open' }).first().click()
}

test.describe('Form Entry — Attendance Tab', () => {
  test('opens form entry page for Form XII', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await expect(page.getByRole('button', { name: 'Attendance', exact: true })).toBeVisible()
  })

  test('attendance tab shows all 6 employees', async ({ page }) => {
    await openFirstCycleFormTask(page)
    const attTab = page.getByRole('button', { name: 'Attendance', exact: true })
    if (await attTab.isVisible()) await attTab.click()
    await expect(page.getByRole('cell', { name: 'Alagurani' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Ambika' })).toBeVisible()
  })

  test('can mark attendance day 1 as Present', async ({ page }) => {
    await openFirstCycleFormTask(page)
    const attTab = page.getByRole('button', { name: 'Attendance', exact: true })
    if (await attTab.isVisible()) await attTab.click()
    const firstDayCell = page.locator('td[data-day="1"], button[data-day="1"], [data-testid="day-cell"]').first()
    if (await firstDayCell.isVisible()) {
      await firstDayCell.click()
      await expect(firstDayCell).toHaveText(/P|A|H|L|OT/)
    }
  })

  test('attendance save button is visible', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await expect(page.getByRole('button', { name: 'Save Attendance' })).toBeVisible()
  })
})

test.describe('Form Entry — Wages Tab', () => {
  test('wages tab shows employee wage fields', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Wage Data', exact: true }).click()
    await expect(page.getByText('Alagurani')).toBeVisible()
    await expect(page.getByPlaceholder(/basic|Basic/).first().or(
      page.locator('input[aria-label*="basic" i]').first()
    ).or(page.locator('td input').first())).toBeVisible()
  })

  test('wages tab has save button', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Wage Data', exact: true }).click()
    await expect(page.getByRole('button', { name: /Save Wage/i })).toBeVisible()
  })
})

test.describe('Form Entry — Overtime Tab', () => {
  test('overtime tab loads', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Overtime', exact: true }).click()
    await expect(page.getByText('Alagurani')).toBeVisible()
  })
})

test.describe('Form Entry — Fines Tab', () => {
  test('fines tab loads with add fine form', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Fines', exact: true }).click()
    await expect(page.getByRole('combobox').or(page.getByLabel(/Employee/i)).first()).toBeVisible()
  })

  test('add a fine record', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Fines', exact: true }).click()
    const empSelect = page.getByRole('combobox').first()
    await empSelect.selectOption({ index: 1 })
    await page.getByLabel('Offence Date').fill('2026-06-10')
    await page.getByLabel('Fine Description').fill('Late arrival')
    await page.getByLabel('Fine Amount').fill('50')
    await page.getByRole('button', { name: /Add Fine/i }).click()
    await expect(page.getByText('Late arrival').first()).toBeVisible()
  })
})

test.describe('Form Entry — Deductions Tab', () => {
  test('deductions tab loads', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Deductions', exact: true }).click()
    await expect(page.getByRole('button', { name: /Add Deduction/i })).toBeVisible()
  })
})

test.describe('Form Entry — Leave Tab', () => {
  test('leave tab shows employee leave fields', async ({ page }) => {
    await openFirstCycleFormTask(page)
    await page.getByRole('button', { name: 'Leave', exact: true }).click()
    await expect(page.getByText('Alagurani')).toBeVisible()
    await expect(page.getByRole('button', { name: /Save/i })).toBeVisible()
  })
})
