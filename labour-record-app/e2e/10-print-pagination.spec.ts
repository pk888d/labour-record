import { test, expect, type APIRequestContext } from '@playwright/test'

// Validates the print pagination feature end-to-end: a register with more
// employees than fit on one sheet must split across multiple sheets, repeat the
// statutory header on each, and keep S.No continuous (no per-sheet restart).
//
// Fixture: the seeded "QA Bulk Hospital" (est_hospital_bulk) with 25 employees.
// 25 is above the landscape single-sheet ceiling (floor(150/6.5) = 23), so
// pagination triggers under ANY valid PRINT_MAX_ROWS_PER_SHEET. Keep these
// constants in sync with prisma/seed.ts.
const BULK_ESTABLISHMENT_ID = 'est_hospital_bulk'
const BULK_EMPLOYEE_COUNT = 25
// Distinctive period that no other spec uses (others use 2025 / 2026 / 2099).
const CYCLE_YEAR = 2097
const CYCLE_MONTH = 6

async function ensureBulkCycle(request: APIRequestContext): Promise<string> {
  // Creating a cycle snapshots all ACTIVE establishment employees into it.
  const res = await request.post('/api/cycles', {
    data: {
      establishmentId: BULK_ESTABLISHMENT_ID,
      month: CYCLE_MONTH,
      year: CYCLE_YEAR,
      wagePeriodDays: 26,
    },
  })
  if (res.ok()) {
    const cycle = (await res.json()) as { id: string }
    return cycle.id
  }
  // Left over from a previous interrupted run — find and reuse it.
  const list = await request.get(`/api/cycles?establishmentId=${BULK_ESTABLISHMENT_ID}`)
  const cycles = (await list.json()) as { id: string; year: number; month: number }[]
  const existing = cycles.find((c) => c.year === CYCLE_YEAR && c.month === CYCLE_MONTH)
  if (!existing) {
    throw new Error(
      `Could not create or find the bulk cycle (POST status ${res.status()}). ` +
        `Is the DB seeded with ${BULK_ESTABLISHMENT_ID}? Run: npx prisma db seed`,
    )
  }
  return existing.id
}

test.describe('Print Pagination — multi-sheet registers', () => {
  let cycleId: string

  test.beforeAll(async ({ request }) => {
    cycleId = await ensureBulkCycle(request)
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
  })

  test('Form XI splits across multiple sheets with the header repeated', async ({ page }) => {
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XI`)

    // Header must be visible at all.
    await expect(page.getByText(/REGISTER OF EMPLOYEES/i).first()).toBeVisible({ timeout: 20000 })

    // More than one printable sheet, and the statutory header repeats on each.
    expect(await page.locator('.form-page').count()).toBeGreaterThan(1)
    expect(
      await page.getByRole('heading', { name: /REGISTER OF EMPLOYEES/i }).count(),
    ).toBeGreaterThan(1)

    // At least the seeded bulk roster is listed across the sheets (tolerant of
    // extra employees other create-tests may have added to this establishment).
    expect(await page.locator('.form-page tbody tr').count()).toBeGreaterThanOrEqual(BULK_EMPLOYEE_COUNT)
  })

  test('S.No stays continuous across sheets (no per-sheet restart)', async ({ page }) => {
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_XI`)
    await expect(page.getByText(/REGISTER OF EMPLOYEES/i).first()).toBeVisible({ timeout: 20000 })

    // The S.No column is the first cell of each body row, in DOM (sheet) order.
    const snos = (await page.locator('.form-page tbody tr td:first-child').allTextContents()).map(
      (s) => s.trim(),
    )
    // Contiguous 1..N across all sheets proves continuity: a per-sheet restart
    // would repeat '1'. N (>= the seeded roster) is derived, not hardcoded, so the
    // assertion survives other tests adding employees to this establishment.
    expect(snos.length).toBeGreaterThanOrEqual(BULK_EMPLOYEE_COUNT)
    const expected = Array.from({ length: snos.length }, (_, i) => String(i + 1))
    expect(snos).toEqual(expected)
  })

  test('Form V (Muster Roll) also paginates across sheets', async ({ page }) => {
    await page.goto(`/print/${cycleId}/HOSPITAL_FORM_V`)
    await expect(page.getByText(/Muster Roll|Form V/i).first()).toBeVisible({ timeout: 20000 })

    expect(await page.locator('.form-page').count()).toBeGreaterThan(1)
    expect(await page.locator('.form-page tbody tr').count()).toBeGreaterThanOrEqual(BULK_EMPLOYEE_COUNT)
  })
})
