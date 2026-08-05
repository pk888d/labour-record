import { test, expect, type APIRequestContext } from '@playwright/test'

// TEC-31: Compliance pre-flight checklist per cycle.
// Builds a deliberately-incomplete fixture cycle via the API (an employee with
// PF applicable but no UAN, ESI deducted but no ESI number, and no attendance)
// and asserts the cycle page surfaces the findings; then fixes the employee
// and asserts the findings shrink. Uses year 2098 to stay clear of seed data
// and of 04-cycles' 2099 fixtures.

const FIXTURE_YEAR = 2098
const FIXTURE_MONTH = 7
const EMP_NAME = 'TEC31 Preflight Fixture'

let establishmentId: string
let employeeId: string
let cycleId: string

async function cleanup(request: APIRequestContext) {
  const res = await request.get('/api/cycles')
  if (res.ok()) {
    const cycles = (await res.json()) as { id: string; year: number }[]
    for (const c of cycles.filter((c) => c.year === FIXTURE_YEAR)) {
      await request.delete(`/api/cycles/${c.id}`)
    }
  }
  const emps = await request.get('/api/employees')
  if (emps.ok()) {
    const list = (await emps.json()) as { id: string; name: string }[]
    for (const e of list.filter((e) => e.name === EMP_NAME)) {
      await request.delete(`/api/employees/${e.id}?mode=remove`)
    }
  }
}

test.describe('Compliance Pre-flight (TEC-31)', () => {
  test.beforeAll(async ({ request }) => {
    await cleanup(request) // clear leftovers from a previous aborted run

    const estRes = await request.get('/api/establishments')
    expect(estRes.ok()).toBeTruthy()
    const establishments = (await estRes.json()) as { id: string }[]
    expect(establishments.length).toBeGreaterThan(0)
    establishmentId = establishments[0].id

    // PF applies (PERCENT) but no UAN; ESI deducted but no ESI number.
    const empRes = await request.post('/api/employees', {
      data: {
        name: EMP_NAME,
        establishmentId,
        defaultTotalSalary: 9000,
        pfMode: 'PERCENT',
        esiAmount: 300,
      },
    })
    expect(empRes.status()).toBe(201)
    employeeId = ((await empRes.json()) as { id: string }).id

    // Fresh cycle: fixture employee auto-enrolled, no attendance yet,
    // all form tasks NOT_STARTED.
    const cycleRes = await request.post('/api/cycles', {
      data: { establishmentId, month: FIXTURE_MONTH, year: FIXTURE_YEAR },
    })
    expect(cycleRes.status()).toBe(201)
    cycleId = ((await cycleRes.json()) as { id: string }).id
  })

  test.afterAll(async ({ request }) => {
    await cleanup(request)
  })

  test('incomplete cycle surfaces errors and warnings in the pre-flight panel', async ({ page }) => {
    await page.goto(`/cycles/${cycleId}`)

    const panel = page.getByTestId('preflight-panel')
    await expect(panel.getByRole('heading', { name: /Compliance Pre-flight/i })).toBeVisible()

    // Errors: missing UAN + missing ESI number for the fixture employee.
    const errorRows = panel.locator('[data-testid="preflight-finding"][data-severity="error"]')
    await expect(errorRows.filter({ hasText: EMP_NAME }).filter({ hasText: /UAN/ })).toHaveCount(1)
    await expect(errorRows.filter({ hasText: EMP_NAME }).filter({ hasText: /ESI/ })).toHaveCount(1)

    // Warnings: pending forms (a fresh cycle always has every form task
    // NOT_STARTED). Attendance is now auto-generated at cycle creation
    // (TEC-42), so NO_ATTENDANCE no longer fires for a freshly created cycle.
    const warningRows = panel.locator('[data-testid="preflight-finding"][data-severity="warning"]')
    await expect(
      warningRows.filter({ hasText: EMP_NAME }).filter({ hasText: /no attendance/i })
    ).toHaveCount(0)
    await expect(warningRows.filter({ hasText: /not yet exported/i })).toHaveCount(1)

    // No green state on a broken cycle.
    await expect(page.getByTestId('preflight-pass')).toHaveCount(0)
  })

  test('warning appears near the print/export buttons without blocking them', async ({ page }) => {
    await page.goto(`/cycles/${cycleId}`)
    await expect(page.getByTestId('preflight-export-warning')).toBeVisible()
    await expect(page.getByTestId('preflight-export-warning')).toContainText(/compliance issue/i)
    // Warn, don't block: Print links and Export buttons stay usable.
    await expect(page.getByRole('link', { name: 'Print' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Export DOCX/i }).first()).toBeEnabled()
  })

  test('fixing the employee removes its errors and shrinks the findings list', async ({ page, request }) => {
    await page.goto(`/cycles/${cycleId}`)
    const rows = page.locator('[data-testid="preflight-finding"]')
    const before = await rows.count()
    expect(before).toBeGreaterThan(0)

    // Derive the fix from API data: fetch the live employee, fill in the two
    // missing statutory identifiers, and PUT the record back unchanged
    // otherwise (the PUT endpoint is a full replace).
    const empRes = await request.get(`/api/employees/${employeeId}`)
    expect(empRes.ok()).toBeTruthy()
    const emp = await empRes.json()
    const putRes = await request.put(`/api/employees/${employeeId}`, {
      data: { ...emp, uan: '100999888777', esiNo: '5501234567' },
    })
    expect(putRes.ok()).toBeTruthy()

    await page.reload()
    const after = await rows.count()
    expect(after).toBeLessThan(before)

    // The fixture employee must no longer appear under errors at all.
    await expect(
      page.locator('[data-testid="preflight-finding"][data-severity="error"]', { hasText: EMP_NAME })
    ).toHaveCount(0)
  })
})
