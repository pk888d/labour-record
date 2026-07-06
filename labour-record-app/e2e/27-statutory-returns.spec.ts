import { test, expect, type APIRequestContext } from '@playwright/test'

// TEC-30: PF ECR / ESI return file generation per cycle.
// Request-level suite (mirrors 23-disbursement): creates its own employees at
// the ESI-applicable shop establishment plus a fresh cycle, derives every
// expectation from live API data (seed-drift tolerant), and cleans up after.
const SHOP = 'est_shop_sriranga' // wageFormulaConfig.esiApplicable = true in seed
const CYCLE_YEAR = 2094
const CYCLE_MONTH = 3

type CycleDetail = { formTasks: { id: string }[]; cycleEmployees: { employeeId: string }[] }
type Employee = {
  id: string; empId: string; name: string; status: string
  uan: string | null; esiNo: string | null; esiAmount: number
}
type WageRow = { employeeId: string; esi: number; grossWages: number }

async function getCycleEmpIds(request: APIRequestContext, cycleId: string): Promise<string[]> {
  const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
  return detail.cycleEmployees.map((c) => c.employeeId)
}

async function getWagesByEmp(request: APIRequestContext, cycleId: string): Promise<Map<string, WageRow>> {
  const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
  const wages = (await (await request.get(`/api/form-tasks/${detail.formTasks[0].id}/wages`)).json()) as WageRow[]
  return new Map(wages.map((w) => [w.employeeId, w]))
}

test.describe('Statutory return files (TEC-30)', () => {
  let fullEmpId: string // UAN + ESI number → appears on both returns
  let noUanEmpId: string // PF applies but no UAN → skipped from ECR
  let noEsiEmpId: string // ESI applies but no ESI number → Skipped sheet on ESI return
  let cycleId: string

  test.beforeAll(async ({ request }) => {
    const full = await request.post('/api/employees', {
      data: {
        name: 'Statret Full Kumar', establishmentId: SHOP, defaultTotalSalary: 12000,
        uan: '100234567890', esiNo: '3100456789', esiAmount: 90,
      },
    })
    fullEmpId = ((await full.json()) as { id: string }).id

    const noUan = await request.post('/api/employees', {
      data: {
        name: 'Statret NoUan Nila', establishmentId: SHOP, defaultTotalSalary: 11000,
        esiNo: '3100456790', esiAmount: 82.5,
      },
    })
    noUanEmpId = ((await noUan.json()) as { id: string }).id

    const noEsi = await request.post('/api/employees', {
      data: {
        name: 'Statret NoEsi Elan', establishmentId: SHOP, defaultTotalSalary: 12000,
        uan: '100234567891', esiAmount: 90,
      },
    })
    noEsiEmpId = ((await noEsi.json()) as { id: string }).id

    const cyc = await request.post('/api/cycles', {
      data: { establishmentId: SHOP, month: CYCLE_MONTH, year: CYCLE_YEAR },
    })
    if (cyc.ok()) {
      cycleId = ((await cyc.json()) as { id: string }).id
    } else {
      const list = (await (await request.get(`/api/cycles?establishmentId=${SHOP}`)).json()) as {
        id: string; year: number; month: number
      }[]
      cycleId = list.find((c) => c.year === CYCLE_YEAR && c.month === CYCLE_MONTH)!.id
    }
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    for (const id of [fullEmpId, noUanEmpId, noEsiEmpId]) {
      if (id) await request.delete(`/api/employees/${id}?mode=remove`)
    }
  })

  test('PF ECR endpoint returns 200 text/plain with well-formed #~# lines and a UAN per line', async ({ request }) => {
    const res = await request.get(`/api/cycles/${cycleId}/pf-ecr`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('text/plain')
    expect(res.headers()['content-disposition']).toContain('.txt')

    const body = (await res.body()).toString('utf-8')
    expect(body.length).toBeGreaterThan(0)
    const lines = body.split('\r\n')
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      // exactly 10 #~# separators = 11 fields
      expect(line.split('#~#')).toHaveLength(11)
      // every emitted line starts with a numeric UAN
      expect(line).toMatch(/^\d{6,}#~#/)
    }

    // Our fully-configured employees appear; the UAN-less one is skipped.
    expect(lines.some((l) => l.startsWith('100234567890#~#STATRET FULL KUMAR#~#'))).toBe(true)
    expect(lines.some((l) => l.startsWith('100234567891#~#STATRET NOESI ELAN#~#'))).toBe(true)
    expect(body).not.toContain('NOUAN')
    expect(Number(res.headers()['x-skipped-count'] ?? 0)).toBeGreaterThanOrEqual(1)
  })

  test('PF ECR figures reconcile with the wage register (whole-rupee gross, PF contribution, NCP days)', async ({ request }) => {
    const wagesByEmp = await getWagesByEmp(request, cycleId)
    const w = wagesByEmp.get(fullEmpId)!

    const res = await request.get(`/api/cycles/${cycleId}/pf-ecr`)
    const lines = (await res.body()).toString('utf-8').split('\r\n')
    const line = lines.find((l) => l.startsWith('100234567890#~#'))!
    const f = line.split('#~#')

    expect(Number(f[2])).toBe(Math.round(w.grossWages)) // gross wages
    const epfWages = Number(f[3])
    expect(epfWages).toBeLessThanOrEqual(15000) // seeded salary is under the ceiling anyway
    expect(Number(f[4])).toBe(Math.min(epfWages, 15000)) // EPS wages
    expect(Number(f[5])).toBe(Number(f[4])) // EDLI = EPS wages
    expect(Number(f[7])).toBe(Math.round(Number(f[4]) * 0.0833)) // EPS contribution
    expect(Number(f[8])).toBe(Math.max(0, Math.round(epfWages * 0.12) - Number(f[7]))) // diff
    expect(Number(f[9])).toBeGreaterThanOrEqual(0) // NCP days
    expect(f[10]).toBe('0') // refund of advances
  })

  test('ESI return endpoint returns 200 xlsx whose rows match the ESI-applicable employees with an ESI number', async ({ request }) => {
    const res = await request.get(`/api/cycles/${cycleId}/esi-return`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    expect(res.headers()['content-disposition']).toContain('.xlsx')

    // Expected IP set derived from live data: cycle roster ∩ ACTIVE ∩ has esiNo
    // ∩ ESI applies (cycle deducted ESI, or employee configured with esiAmount).
    const [emps, cycleEmpIds, wagesByEmp] = await Promise.all([
      request.get(`/api/employees?establishmentId=${SHOP}`).then((r) => r.json()) as Promise<Employee[]>,
      getCycleEmpIds(request, cycleId),
      getWagesByEmp(request, cycleId),
    ])
    const empById = new Map(emps.map((e) => [e.id, e]))
    const expectedIps = new Set(
      cycleEmpIds
        .map((id) => empById.get(id))
        .filter((e): e is Employee => !!e && e.status === 'ACTIVE')
        .filter((e) => ((wagesByEmp.get(e.id)?.esi ?? 0) > 0 || e.esiAmount > 0) && !!e.esiNo?.trim())
        .map((e) => e.esiNo!.trim()),
    )
    expect(expectedIps.has('3100456789')).toBe(true) // our seeded ESI employee

    const XLSX = await import('xlsx')
    const wb = XLSX.read(Buffer.from(await res.body()), { type: 'buffer' })
    expect(wb.SheetNames).toContain('ESI Return')
    const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets['ESI Return'], { header: 1 })
    expect(String(aoa[0][0])).toBe('IP Number')

    const dataRows = aoa.slice(1)
    const ipsInSheet = new Set(dataRows.map((r) => String(r[0])))
    expect(ipsInSheet).toEqual(expectedIps)

    // Our seeded employee's row: full-month wage days, register gross, reason 0.
    const row = dataRows.find((r) => String(r[0]) === '3100456789')!
    expect(String(row[1])).toBe('Statret Full Kumar')
    expect(Number(row[2])).toBeGreaterThan(0)
    expect(Number(row[3])).toBe(Math.round(wagesByEmp.get(fullEmpId)!.grossWages))
    expect(Number(row[4])).toBe(0)
  })

  test('ESI return carries a Skipped sheet for ESI-applicable employees without an ESI number', async ({ request }) => {
    const res = await request.get(`/api/cycles/${cycleId}/esi-return`)
    expect(Number(res.headers()['x-skipped-count'] ?? 0)).toBeGreaterThanOrEqual(1)

    const XLSX = await import('xlsx')
    const wb = XLSX.read(Buffer.from(await res.body()), { type: 'buffer' })
    expect(wb.SheetNames).toContain('Skipped')
    const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets['Skipped'], { header: 1 })
    const names = aoa.slice(1).map((r) => String(r[1]))
    expect(names).toContain('Statret NoEsi Elan')
  })

  test('both endpoints return 404 for a bogus cycle id', async ({ request }) => {
    expect((await request.get('/api/cycles/does-not-exist-xyz/pf-ecr')).status()).toBe(404)
    expect((await request.get('/api/cycles/does-not-exist-xyz/esi-return')).status()).toBe(404)
  })

  test('cycle page shows the PF ECR and ESI Return links', async ({ page }) => {
    await page.goto(`/cycles/${cycleId}`)

    const ecrLink = page.getByRole('link', { name: 'PF ECR' })
    await expect(ecrLink).toBeVisible()
    expect(await ecrLink.getAttribute('href')).toContain(`/api/cycles/${cycleId}/pf-ecr`)

    const esiLink = page.getByRole('link', { name: 'ESI Return' })
    await expect(esiLink).toBeVisible()
    expect(await esiLink.getAttribute('href')).toContain(`/api/cycles/${cycleId}/esi-return`)
  })
})
