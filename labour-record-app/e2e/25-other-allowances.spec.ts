import { test, expect, type APIRequestContext } from '@playwright/test'

// TEC-23: corrupt WageRecord.otherAllowances JSON can still be written.
//
// On 2026-06-10 a value shaped like `["[]"]` — a stringified empty array
// nested INSIDE the allowances array — was persisted by the wages PUT route
// and crashed statutory form rendering downstream. This spec proves the
// write path now rejects that exact corruption shape with 422, and that a
// legitimate multi-value array is normalized (rounded to 2dp) and round-trips
// correctly through GET.
const BULK_ESTABLISHMENT_ID = 'est_hospital_bulk'
const CYCLE_YEAR = 2097
const CYCLE_MONTH = 3

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

test.describe('WageRecord.otherAllowances write-path validation (TEC-23)', () => {
  let cycleId: string
  let wageTaskId: string
  let employeeId: string
  let createdEmployeeId: string | null = null

  test.beforeAll(async ({ request }) => {
    const check = await request.get(`/api/employees?establishmentId=${BULK_ESTABLISHMENT_ID}&limit=1`)
    const existing = (await check.json()) as { id: string }[]
    if (!existing.length) {
      const emp = await request.post('/api/employees', {
        data: {
          name: 'Other Allowances Fixture Worker',
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

  test('rejects the historical corruption shape ["[]"] with 422 (no corrupt persist)', async ({ request }) => {
    const res = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: {
        records: [{
          employeeId, daysWorked: 26, basic: 10000, da: 5000, hra: 0, otherAllowances: ['[]'],
          pf: 0, esi: 0, lwf: 0, advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0,
        }],
      },
    })
    expect(res.status()).toBe(422)
    const body = (await res.json()) as { errors: string[] }
    expect(body.errors.join(' ')).toMatch(/Other allowances must be a number/i)
  })

  test('accepts an array of allowances, rounds to 2dp, and round-trips through GET', async ({ request }) => {
    const put = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: {
        records: [{
          employeeId, daysWorked: 26, basic: 10000, da: 5000, hra: 0, otherAllowances: [100, 50.555],
          pf: 0, esi: 0, lwf: 0, advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0,
        }],
      },
    })
    expect(put.ok(), `PUT failed: ${await put.text()}`).toBeTruthy()

    const rows = (await (await request.get(`/api/form-tasks/${wageTaskId}/wages`)).json()) as Array<{
      employeeId: string; otherAllowances: number[]
    }>
    const row = rows.find((r) => r.employeeId === employeeId)!
    expect(row).toBeTruthy()
    expect(row.otherAllowances).toEqual([100, 50.56])

    // Clean up: restore to a single-value scalar (the current form-entry shape)
    // so this cycle's data doesn't linger in an unusual shape after the test.
    const restore = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: {
        records: [{
          employeeId, daysWorked: 26, basic: 10000, da: 5000, hra: 0, otherAllowances: 0,
          pf: 0, esi: 0, lwf: 0, advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0,
        }],
      },
    })
    expect(restore.ok()).toBeTruthy()
  })
})
