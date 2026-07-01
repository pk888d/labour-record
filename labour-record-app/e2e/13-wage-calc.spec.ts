import { test, expect, type APIRequestContext } from '@playwright/test'

// End-to-end CORRECTNESS test for the wage pipeline: UI/API → calculateWages →
// DB → GET. Uses the seeded "QA Bulk Hospital" (TN_MINIMUM_WAGES_HOSPITAL preset,
// fixedAllowance ₹360). A fresh cycle with NO attendance/OT entered means holiday
// bonus = 0 and overtime = 0, so the totals below are exact and deterministic.
const BULK_ESTABLISHMENT_ID = 'est_hospital_bulk'
const CYCLE_YEAR = 2096
const CYCLE_MONTH = 6

type CycleDetail = {
  id: string
  formTasks: { id: string; formCode: string }[]
  cycleEmployees: { employeeId: string }[]
}

async function createCycle(request: APIRequestContext): Promise<string> {
  const res = await request.post('/api/cycles', {
    data: { establishmentId: BULK_ESTABLISHMENT_ID, month: CYCLE_MONTH, year: CYCLE_YEAR, wagePeriodDays: 26 },
  })
  if (res.ok()) return ((await res.json()) as { id: string }).id
  const list = await request.get(`/api/cycles?establishmentId=${BULK_ESTABLISHMENT_ID}`)
  const cycles = (await list.json()) as { id: string; year: number; month: number }[]
  const existing = cycles.find((c) => c.year === CYCLE_YEAR && c.month === CYCLE_MONTH)
  if (!existing) throw new Error(`Could not create/find cycle (status ${res.status()}); is the DB seeded?`)
  return existing.id
}

test.describe('Wage calculation pipeline (correctness)', () => {
  let cycleId: string
  let wageTaskId: string
  let employeeId: string
  let createdEmployeeId: string | null = null

  test.beforeAll(async ({ request }) => {
    // Ensure at least one active employee exists in BULK so the cycle snapshot is non-empty.
    // The bulk seed employees may be absent if the DB was reset without re-seeding.
    const check = await request.get(`/api/employees?establishmentId=${BULK_ESTABLISHMENT_ID}&limit=1`)
    const existing = (await check.json()) as { id: string }[]
    if (!existing.length) {
      const emp = await request.post('/api/employees', {
        data: {
          name: 'Wage Calc Fixture Worker',
          defaultTotalSalary: 15000,
          establishmentId: BULK_ESTABLISHMENT_ID,
          paymentMode: 'CASH',
        },
      })
      createdEmployeeId = ((await emp.json()) as { id: string }).id
    }

    cycleId = await createCycle(request)
    const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
    wageTaskId = detail.formTasks[0].id
    employeeId = detail.cycleEmployees[0].employeeId
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    if (createdEmployeeId) await request.delete(`/api/employees/${createdEmployeeId}?mode=remove`)
  })

  test('persists exact computed totals for a hospital wage record', async ({ request }) => {
    const put = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: {
        records: [{
          employeeId, daysWorked: 26, basic: 10000, da: 5000, hra: 0, otherAllowances: 0,
          pf: 1800, esi: 0, lwf: 10, advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0,
        }],
      },
    })
    expect(put.ok()).toBeTruthy()

    const rows = (await (await request.get(`/api/form-tasks/${wageTaskId}/wages`)).json()) as Array<{
      employeeId: string; totalNormalWages: number; totalEarnings: number
      grossWages: number; totalDeductions: number; netWages: number
    }>
    const row = rows.find((r) => r.employeeId === employeeId)!
    expect(row).toBeTruthy()
    expect(row.totalNormalWages).toBe(15000) // basic + da
    expect(row.totalEarnings).toBe(15360) // + fixedAllowance 360 (bonus 0)
    expect(row.grossWages).toBe(15360) // overtime 0
    expect(row.totalDeductions).toBe(1810) // pf 1800 + lwf 10
    expect(row.netWages).toBe(13550) // gross - deductions
  })

  test('rejects a negative money input with 422 (no corrupt persist)', async ({ request }) => {
    const res = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: { records: [{ employeeId, daysWorked: 26, basic: -1, da: 5000, hra: 0, otherAllowances: 0, pf: 0, esi: 0, lwf: 0, advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0 }] },
    })
    expect(res.status()).toBe(422)
    const body = (await res.json()) as { errors: string[] }
    expect(body.errors.join(' ')).toMatch(/Basic cannot be negative/i)
  })

  test('rejects a NaN/non-numeric money input with 422', async ({ request }) => {
    const res = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: { records: [{ employeeId, daysWorked: 26, basic: 'abc', da: 5000, hra: 0, otherAllowances: 0, pf: 0, esi: 0, lwf: 0, advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0 }] },
    })
    expect(res.status()).toBe(422)
    const body = (await res.json()) as { errors: string[] }
    expect(body.errors.join(' ')).toMatch(/Basic must be a number/i)
  })
})
