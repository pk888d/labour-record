import { test, expect, type APIRequestContext } from '@playwright/test'

// Verifies #7/#5: an employee's saved salary flows into the cycle's wages without
// manual entry. Self-contained — creates an employee WITH a salary, a fresh
// cycle (which seeds wage rows), asserts non-zero gross, then re-syncs.
const DNV = 'est_hospital_dnv'
const CYCLE_YEAR = 2094
const CYCLE_MONTH = 6

type CycleDetail = { formTasks: { id: string }[]; cycleEmployees: { employeeId: string }[] }

test.describe('Wage sync (phase-2 wave B)', () => {
  let employeeId: string
  let cycleId: string

  test.beforeAll(async ({ request }) => {
    const emp = await request.post('/api/employees', {
      data: { name: 'Sync Test Sam', establishmentId: DNV, defaultTotalSalary: 20000, paymentMode: 'CASH' },
    })
    employeeId = ((await emp.json()) as { id: string }).id

    const cyc = await request.post('/api/cycles', {
      data: { establishmentId: DNV, month: CYCLE_MONTH, year: CYCLE_YEAR },
    })
    if (cyc.ok()) {
      cycleId = ((await cyc.json()) as { id: string }).id
    } else {
      const list = await request.get(`/api/cycles?establishmentId=${DNV}`)
      const cycles = (await list.json()) as { id: string; year: number; month: number }[]
      cycleId = cycles.find((c) => c.year === CYCLE_YEAR && c.month === CYCLE_MONTH)!.id
    }
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    if (employeeId) await request.delete(`/api/employees/${employeeId}?mode=remove`)
  })

  test('creating a cycle seeds wages from the employee salary (non-zero gross)', async ({ request }) => {
    const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
    const wageTaskId = detail.formTasks[0].id
    const rows = (await (await request.get(`/api/form-tasks/${wageTaskId}/wages`)).json()) as Array<{
      employeeId: string; grossWages: number; basic: number; da: number
    }>
    const row = rows.find((r) => r.employeeId === employeeId)
    expect(row).toBeTruthy()
    expect(row!.grossWages).toBeGreaterThan(0)
    expect(row!.basic + row!.da).toBeGreaterThan(0)
  })

  test('sync-wages endpoint re-pulls and reports a count', async ({ request }) => {
    const res = await request.post(`/api/cycles/${cycleId}/sync-wages`)
    expect(res.ok()).toBeTruthy()
    const data = (await res.json()) as { synced: number }
    expect(data.synced).toBeGreaterThan(0)
  })
})
