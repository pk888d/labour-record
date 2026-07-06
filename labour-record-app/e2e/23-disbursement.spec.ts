import { test, expect, type APIRequestContext } from '@playwright/test'

// TEC-29: bank disbursement / salary-transfer sheet per cycle.
// Self-contained: creates a BANK-mode and a CASH-mode employee (each with a
// salary), a fresh cycle (which seeds wage rows), then derives every expectation
// from live API data so the suite stays robust to seed-data drift.
const DNV = 'est_hospital_dnv'
const CYCLE_YEAR = 2093
const CYCLE_MONTH = 5

type CycleDetail = { formTasks: { id: string }[]; cycleEmployees: { employeeId: string }[] }
type Employee = {
  id: string; empId: string; name: string; status: string
  paymentMode: string; bankAccount: string | null; ifsc: string | null
}
type WageRow = { employeeId: string; netWages: number }

async function getWageNetByEmp(request: APIRequestContext, cycleId: string): Promise<Map<string, number>> {
  const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
  const wages = (await (await request.get(`/api/form-tasks/${detail.formTasks[0].id}/wages`)).json()) as WageRow[]
  return new Map(wages.map((w) => [w.employeeId, w.netWages]))
}

async function getCycleEmpIds(request: APIRequestContext, cycleId: string): Promise<string[]> {
  const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
  return detail.cycleEmployees.map((c) => c.employeeId)
}

test.describe('Bank disbursement export (TEC-29)', () => {
  let bankEmpId: string
  let cashEmpId: string
  let cycleId: string

  test.beforeAll(async ({ request }) => {
    const bank = await request.post('/api/employees', {
      data: {
        name: 'Disb Bank Bala', establishmentId: DNV, defaultTotalSalary: 24000,
        paymentMode: 'BANK', bankAccount: '9988776655', ifsc: 'ICIC0004321', bankName: 'ICICI Bank',
      },
    })
    bankEmpId = ((await bank.json()) as { id: string }).id

    const cash = await request.post('/api/employees', {
      data: { name: 'Disb Cash Chandra', establishmentId: DNV, defaultTotalSalary: 18000, paymentMode: 'CASH' },
    })
    cashEmpId = ((await cash.json()) as { id: string }).id

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
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    if (bankEmpId) await request.delete(`/api/employees/${bankEmpId}?mode=remove`)
    if (cashEmpId) await request.delete(`/api/employees/${cashEmpId}?mode=remove`)
  })

  test('endpoint returns 200 with xlsx content-type and a non-empty body', async ({ request }) => {
    const res = await request.get(`/api/cycles/${cycleId}/disbursement`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    expect(res.headers()['content-disposition']).toContain('.xlsx')
    const body = Buffer.from(await res.body())
    expect(body.length).toBeGreaterThan(0)
  })

  test('Bank Transfer sheet lists every BANK-mode ACTIVE cycle employee with matching net pay and a correct TOTAL', async ({ request }) => {
    const [emps, netByEmp, cycleEmpIds] = await Promise.all([
      request.get(`/api/employees?establishmentId=${DNV}`).then((r) => r.json()) as Promise<Employee[]>,
      getWageNetByEmp(request, cycleId),
      getCycleEmpIds(request, cycleId),
    ])
    const empById = new Map(emps.map((e) => [e.id, e]))

    // Expected = every ACTIVE BANK-mode cycle employee (derive from API, never
    // hardcode). knownNet is the wage-register net where a wage record exists;
    // salary-0 employees have no record so we assert only their presence.
    const expected = cycleEmpIds
      .map((id) => empById.get(id))
      .filter((e): e is Employee => !!e && e.status === 'ACTIVE' && e.paymentMode !== 'CASH')
      .map((e) => ({ empId: e.empId, knownNet: netByEmp.has(e.id) ? netByEmp.get(e.id)! : null }))

    // Our seeded BANK employee must be present.
    expect(expected.some((e) => e.empId === empById.get(bankEmpId)!.empId)).toBe(true)

    const XLSX = await import('xlsx')
    const res = await request.get(`/api/cycles/${cycleId}/disbursement`)
    const wb = XLSX.read(Buffer.from(await res.body()), { type: 'buffer' })
    expect(wb.SheetNames).toContain('Bank Transfer')
    const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets['Bank Transfer'], { header: 1 })

    const header = aoa[0]
    expect(header).toEqual(['S.No', 'Employee Name', 'Emp ID', 'Bank Account', 'IFSC', 'Bank Name', 'Net Pay ₹'])

    const totalRow = aoa[aoa.length - 1]
    expect(totalRow[1]).toBe('TOTAL')

    const dataRows = aoa.slice(1, -1)
    expect(dataRows).toHaveLength(expected.length)

    const netInSheet = new Map(dataRows.map((r) => [String(r[2]), Number(r[6])]))
    // Every expected BANK employee appears; where wage data exists, net matches it.
    for (const e of expected) {
      expect(netInSheet.has(e.empId)).toBe(true)
      if (e.knownNet !== null) expect(netInSheet.get(e.empId)!).toBeCloseTo(e.knownNet, 2)
    }
    // TOTAL row reconciles with the sum of the sheet's own net-pay column.
    const sheetSum = dataRows.reduce((s, r) => s + Number(r[6]), 0)
    expect(Number(totalRow[6])).toBeCloseTo(sheetSum, 2)

    // Our seeded BANK employee shows its bank details.
    const balaRow = dataRows.find((r) => String(r[2]) === empById.get(bankEmpId)!.empId)!
    expect(balaRow[3]).toBe('9988776655')
    expect(balaRow[4]).toBe('ICIC0004321')
  })

  test('Cash Payment sheet lists CASH-mode employees', async ({ request }) => {
    const emps = (await (await request.get(`/api/employees?establishmentId=${DNV}`)).json()) as Employee[]
    const empById = new Map(emps.map((e) => [e.id, e]))

    const XLSX = await import('xlsx')
    const res = await request.get(`/api/cycles/${cycleId}/disbursement`)
    const wb = XLSX.read(Buffer.from(await res.body()), { type: 'buffer' })
    expect(wb.SheetNames).toContain('Cash Payment')
    const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets['Cash Payment'], { header: 1 })
    expect(aoa[0]).toEqual(['S.No', 'Employee Name', 'Emp ID', 'Net Pay ₹'])

    const empIdsInSheet = aoa.slice(1, -1).map((r) => String(r[2]))
    expect(empIdsInSheet).toContain(empById.get(cashEmpId)!.empId)
  })

  test('returns 404 for a bogus cycle id', async ({ request }) => {
    const res = await request.get('/api/cycles/does-not-exist-xyz/disbursement')
    expect(res.status()).toBe(404)
  })

  test('cycle page shows the Bank Disbursement link', async ({ page }) => {
    await page.goto(`/cycles/${cycleId}`)
    const link = page.getByRole('link', { name: /Bank Disbursement/i })
    await expect(link).toBeVisible()
    const href = await link.getAttribute('href')
    expect(href).toContain(`/api/cycles/${cycleId}/disbursement`)
  })
})
