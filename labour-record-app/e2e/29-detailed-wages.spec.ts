import { test, expect, type APIRequestContext } from '@playwright/test'

// TEC-26: internal, NON-statutory Detailed Wages export per cycle — a full
// component breakdown per employee for the accountant's own review before
// filing. Self-contained: creates an employee with a salary, a fresh cycle
// (which seeds wage rows), then derives every expectation from live API data so
// the suite stays robust to seed-data drift.
const DNV = 'est_hospital_dnv'
const CYCLE_YEAR = 2094
const CYCLE_MONTH = 6

type CycleDetail = { formTasks: { id: string }[]; cycleEmployees: { employeeId: string }[] }
type Employee = { id: string; empId: string; name: string }
type WageRow = {
  employeeId: string
  basic: number
  da: number
  hra: number
  otherAllowances: number | string
  grossWages: number
  pf: number
  esi: number
  lwf: number
  fineDeduction: number
  otherDeductions: number
  advanceRecovered: number
  netWages: number
}

async function getWageByEmp(request: APIRequestContext, cycleId: string): Promise<Map<string, WageRow>> {
  const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
  const wages = (await (await request.get(`/api/form-tasks/${detail.formTasks[0].id}/wages`)).json()) as WageRow[]
  return new Map(wages.map((w) => [w.employeeId, w]))
}

async function getCycleEmpIds(request: APIRequestContext, cycleId: string): Promise<string[]> {
  const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
  return detail.cycleEmployees.map((c) => c.employeeId)
}

async function getOtEarningsByEmp(request: APIRequestContext, cycleId: string): Promise<Map<string, number>> {
  const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
  const records = (await (await request.get(`/api/form-tasks/${detail.formTasks[0].id}/overtime`)).json()) as {
    employeeId: string; otEarnings: number
  }[]
  // getOvertimeData (used by the detailed-wages route) sources otEarnings —
  // the OT-hours-only portion — NOT totalEarnings (which also includes
  // normalEarnings), so the test must compare against the same field.
  return new Map(records.map((r) => [r.employeeId, r.otEarnings]))
}

test.describe('Detailed Wages export (TEC-26)', () => {
  let empId: string
  let cycleId: string

  test.beforeAll(async ({ request }) => {
    const created = await request.post('/api/employees', {
      data: { name: 'Detail Wage Deepa', establishmentId: DNV, defaultTotalSalary: 21000, paymentMode: 'BANK' },
    })
    empId = ((await created.json()) as { id: string }).id

    const cyc = await request.post('/api/cycles', {
      data: { establishmentId: DNV, month: CYCLE_MONTH, year: CYCLE_YEAR },
    })
    if (cyc.ok()) {
      cycleId = ((await cyc.json()) as { id: string }).id
    } else {
      const list = (await (await request.get(`/api/cycles?establishmentId=${DNV}`)).json()) as {
        id: string; year: number; month: number
      }[]
      cycleId = list.find((c) => c.year === CYCLE_YEAR && c.month === CYCLE_MONTH)!.id
    }

    // Seed a real overtime record so the "Overtime Earnings" column can be
    // proven to come from the Overtime register, not hardcoded to 0.
    const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
    await request.put(`/api/form-tasks/${detail.formTasks[0].id}/overtime`, {
      data: {
        records: [
          {
            employeeId: empId,
            dailyOt: Array(31).fill(0).map((_, i) => (i < 2 ? 2 : 0)),
            normalHoursRate: 50,
            otRate: 75,
            normalEarnings: 700,
          },
        ],
      },
    })
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    if (empId) await request.delete(`/api/employees/${empId}?mode=remove`)
  })

  test('endpoint returns 200 with xlsx content-type and a non-empty body', async ({ request }) => {
    const res = await request.get(`/api/cycles/${cycleId}/detailed-wages`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    expect(res.headers()['content-disposition']).toContain('.xlsx')
    const body = Buffer.from(await res.body())
    expect(body.length).toBeGreaterThan(0)
  })

  test('Detailed Wages sheet lists one row per cycle employee with figures matching the live wages API', async ({ request }) => {
    const [emps, wageByEmp, cycleEmpIds, otByEmp] = await Promise.all([
      request.get(`/api/employees?establishmentId=${DNV}`).then((r) => r.json()) as Promise<Employee[]>,
      getWageByEmp(request, cycleId),
      getCycleEmpIds(request, cycleId),
      getOtEarningsByEmp(request, cycleId),
    ])
    const empById = new Map(emps.map((e) => [e.id, e]))

    // Our seeded employee must be part of this cycle.
    expect(cycleEmpIds).toContain(empId)

    const XLSX = await import('xlsx')
    const res = await request.get(`/api/cycles/${cycleId}/detailed-wages`)
    const wb = XLSX.read(Buffer.from(await res.body()), { type: 'buffer' })
    expect(wb.SheetNames).toEqual(['Detailed Wages'])
    // Internal report: sheet name must not masquerade as a statutory Form.
    expect(wb.SheetNames[0]).not.toMatch(/form/i)

    const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets['Detailed Wages'], { header: 1 })

    expect(aoa[0]).toEqual([
      'S.No', 'Employee Name', 'Emp ID', 'Days Worked', 'Basic', 'DA', 'HRA',
      'Other Allowances', 'Overtime Earnings', 'Gross Wages',
      'PF', 'ESI', 'LWF', 'Fine Deduction', 'Other Deductions', 'Advance Recovered',
      'Total Deductions', 'Net Wage', 'Payment Date', 'Receipt Ref',
    ])

    const totalRow = aoa[aoa.length - 1]
    expect(totalRow[1]).toBe('TOTAL')

    const dataRows = aoa.slice(1, -1)
    // One row per cycle employee.
    expect(dataRows).toHaveLength(cycleEmpIds.length)

    // Seeded employee's row must reconcile with the live wages API figures.
    const rowByEmpId = new Map(dataRows.map((r) => [String(r[2]), r]))
    const seededEmpCode = empById.get(empId)!.empId
    const seededRow = rowByEmpId.get(seededEmpCode)
    expect(seededRow).toBeTruthy()

    // Overtime Earnings must come from the Overtime register (getOvertimeData),
    // not a hardcoded 0 — this employee has a seeded overtime record.
    const expectedOt = otByEmp.get(empId)
    expect(expectedOt).toBeGreaterThan(0)
    expect(Number(seededRow![8])).toBeCloseTo(expectedOt!, 2)

    // Where a wage record exists (the live wages API only returns those), the
    // sheet figures must reconcile with it exactly — same source, no recompute.
    const w = wageByEmp.get(empId)
    if (w) {
      expect(Number(seededRow![4])).toBeCloseTo(w.basic, 2) // Basic
      expect(Number(seededRow![9])).toBeCloseTo(w.grossWages, 2) // Gross Wages
      expect(Number(seededRow![17])).toBeCloseTo(w.netWages, 2) // Net Wage
      // Total Deductions column = pf + esi + lwf + fine + other + advance.
      const expectedTd = w.pf + w.esi + w.lwf + w.fineDeduction + w.otherDeductions + w.advanceRecovered
      expect(Number(seededRow![16])).toBeCloseTo(expectedTd, 2)
    }
  })

  test('TOTAL row sums the money columns of the sheet', async ({ request }) => {
    const XLSX = await import('xlsx')
    const res = await request.get(`/api/cycles/${cycleId}/detailed-wages`)
    const wb = XLSX.read(Buffer.from(await res.body()), { type: 'buffer' })
    const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets['Detailed Wages'], { header: 1 })

    const dataRows = aoa.slice(1, -1)
    const totalRow = aoa[aoa.length - 1]

    // Every money column (Basic..Net Wage, index 4..17) must equal the sum of its data cells.
    for (const col of [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]) {
      const colSum = dataRows.reduce((s, r) => s + Number(r[col] || 0), 0)
      expect(Number(totalRow[col])).toBeCloseTo(colSum, 2)
    }
  })

  test('returns 404 for a bogus cycle id', async ({ request }) => {
    const res = await request.get('/api/cycles/does-not-exist-xyz/detailed-wages')
    expect(res.status()).toBe(404)
  })

  test('cycle page shows the Detailed Wages link', async ({ page }) => {
    await page.goto(`/cycles/${cycleId}`)
    const link = page.getByRole('link', { name: /Detailed Wages/i })
    await expect(link).toBeVisible()
    const href = await link.getAttribute('href')
    expect(href).toContain(`/api/cycles/${cycleId}/detailed-wages`)
  })
})
