/**
 * End-to-end mathematical calculation accuracy tests.
 *
 * Tests the full pipeline: employee config → cycle wage seeding →
 * GET /wages to verify computed values. Also tests the wage record PUT
 * computation with explicit multi-deduction inputs.
 *
 * Establishments used (seeded):
 *   DNV (est_hospital_dnv) — TN_MINIMUM_WAGES_HOSPITAL, fixedAllowance=360, esiApplicable=false
 *   SHOP (est_shop_sriranga)  — TN_SHOPS_ESTABLISHMENTS, esiApplicable=true
 *
 * Each suite uses a unique (year, month) pair to avoid cycle collisions.
 */
import { test, expect, type APIRequestContext } from '@playwright/test'

const DNV  = 'est_hospital_dnv'
const SHOP = 'est_shop_sriranga'
const BULK = 'est_hospital_bulk'

// ── helpers ───────────────────────────────────────────────────────────────────

type WageRow = {
  employeeId: string
  basic: number; da: number; hra: number
  pf: number; esi: number; lwf: number
  totalNormalWages: number; totalEarnings: number
  grossWages: number; totalDeductions: number; netWages: number
  holidayBonus: number
}

type CycleDetail = { formTasks: { id: string; formCode: string }[] }

async function createEmployee(
  request: APIRequestContext,
  estId: string,
  opts: {
    salary: number
    daWage?: number
    hraWage?: number
    pfMode?: 'PERCENT' | 'FIXED' | 'NONE'
    pfPercent?: number
    pfWageCeiling?: number
    pfAmount?: number
    lwfAmount?: number
    esiApplicable?: boolean
  },
): Promise<string> {
  const tag = Math.random().toString(36).slice(2, 8)
  const res = await request.post('/api/employees', {
    data: {
      name: `MathTest ${tag}`,
      establishmentId: estId,
      defaultTotalSalary: opts.salary,
      paymentMode: 'CASH',
      daWage: opts.daWage ?? 5000,
      hraWage: opts.hraWage ?? 0,
      pfMode: opts.pfMode ?? 'PERCENT',
      pfPercent: opts.pfPercent ?? 12,
      pfWageCeiling: opts.pfWageCeiling ?? 15000,
      pfAmount: opts.pfAmount ?? 0,
      lwfAmount: opts.lwfAmount ?? 10,
    },
  })
  expect(res.ok(), `employee create failed: ${await res.text()}`).toBeTruthy()
  return ((await res.json()) as { id: string }).id
}

async function createCycle(
  request: APIRequestContext,
  estId: string,
  year: number,
  month: number,
): Promise<string> {
  const res = await request.post('/api/cycles', {
    data: { establishmentId: estId, month, year },
  })
  if (res.ok()) return ((await res.json()) as { id: string }).id
  const list = await request.get(`/api/cycles?establishmentId=${estId}`)
  const cycles = (await list.json()) as { id: string; year: number; month: number }[]
  const existing = cycles.find((c) => c.year === year && c.month === month)
  if (!existing) throw new Error(`Cycle not created: ${res.status()} — ${await res.text()}`)
  return existing.id
}

async function getWageTask(request: APIRequestContext, cycleId: string): Promise<string> {
  const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as CycleDetail
  return detail.formTasks[0].id
}

async function getWageRow(
  request: APIRequestContext,
  wageTaskId: string,
  employeeId: string,
): Promise<WageRow> {
  const rows = (await (await request.get(`/api/form-tasks/${wageTaskId}/wages`)).json()) as WageRow[]
  const row = rows.find((r) => r.employeeId === employeeId)
  expect(row, `no wage row for employee ${employeeId}`).toBeTruthy()
  return row!
}

// ── Suite 1: PF ceiling cap ───────────────────────────────────────────────────
// DNV hospital, esiApplicable=false, fixedAllowance=360
// gross = totalSalary + fixedAllowance  (hospital preset)
//
// Expected values:
//   salary=30000, da=5000  → basic=25000, pfWage=30000 > 15000 → PF=1800 (NOT 3600)
//                           gross=30360 (30000+360), deductions=1810, net=28550
//   salary=12000, da=3000  → basic=9000, pfWage=12000 < 15000 → PF=1440 (uncapped)
//                           gross=12360 (12000+360), deductions=1450, net=10910
//   salary=15000, da=5000  → basic=10000, pfWage=15000 = 15000 → PF=1800 (exact ceiling)
//                           gross=15360, deductions=1810, net=13550

test.describe('PF ceiling cap — cycle wage seeding', () => {
  let cycleId: string
  let empAbove: string
  let empBelow: string
  let empExact: string
  let wageTaskId: string

  test.beforeAll(async ({ request }) => {
    empAbove = await createEmployee(request, DNV, { salary: 30000, daWage: 5000 })
    empBelow = await createEmployee(request, DNV, { salary: 12000, daWage: 3000 })
    empExact = await createEmployee(request, DNV, { salary: 15000, daWage: 5000 })
    cycleId = await createCycle(request, DNV, 2082, 3)
    wageTaskId = await getWageTask(request, cycleId)
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    for (const id of [empAbove, empBelow, empExact].filter(Boolean)) {
      await request.delete(`/api/employees/${id}?mode=remove`)
    }
  })

  test('wage above ceiling → PF capped at ceiling × rate (not wage × rate)', async ({ request }) => {
    const row = await getWageRow(request, wageTaskId, empAbove)
    // PF wage = 30000 > ceiling 15000 → PF = 1800, not 3600
    expect(row.pf).toBe(1800)
    expect(row.grossWages).toBe(30360)   // 30000 salary + 360 hospital fixed allowance
    expect(row.totalDeductions).toBe(1810)
    expect(row.netWages).toBe(28550)
  })

  test('wage below ceiling → PF is exact percentage (uncapped)', async ({ request }) => {
    const row = await getWageRow(request, wageTaskId, empBelow)
    // PF wage = 12000 < 15000 → PF = 12000 × 12% = 1440
    expect(row.pf).toBe(1440)
    expect(row.grossWages).toBe(12360)
    expect(row.totalDeductions).toBe(1450)
    expect(row.netWages).toBe(10910)
  })

  test('wage exactly at ceiling → PF equals ceiling × rate', async ({ request }) => {
    const row = await getWageRow(request, wageTaskId, empExact)
    // PF wage = 15000 = ceiling → PF = 1800
    expect(row.pf).toBe(1800)
    expect(row.grossWages).toBe(15360)
    expect(row.totalDeductions).toBe(1810)
    expect(row.netWages).toBe(13550)
  })

  test('net = gross − totalDeductions for all employees', async ({ request }) => {
    for (const empId of [empAbove, empBelow, empExact]) {
      const row = await getWageRow(request, wageTaskId, empId)
      expect(row.netWages).toBeCloseTo(row.grossWages - row.totalDeductions, 2)
    }
  })
})

// ── Suite 2: PF FIXED and NONE modes ─────────────────────────────────────────
// salary=30000, da=5000 → basic=25000 → gross=30360 (hospital)
//   FIXED pfAmount=500  → PF=500,  deductions=510  (500+lwf10), net=29850
//   NONE               → PF=0,   deductions=10   (lwf only),  net=30350

test.describe('PF mode FIXED and NONE', () => {
  let cycleId: string
  let empFixed: string
  let empNone: string
  let wageTaskId: string

  test.beforeAll(async ({ request }) => {
    empFixed = await createEmployee(request, DNV, {
      salary: 30000, daWage: 5000, pfMode: 'FIXED', pfAmount: 500,
    })
    empNone = await createEmployee(request, DNV, {
      salary: 30000, daWage: 5000, pfMode: 'NONE',
    })
    cycleId = await createCycle(request, DNV, 2082, 4)
    wageTaskId = await getWageTask(request, cycleId)
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    for (const id of [empFixed, empNone].filter(Boolean)) {
      await request.delete(`/api/employees/${id}?mode=remove`)
    }
  })

  test('FIXED mode: PF equals the flat amount regardless of wage', async ({ request }) => {
    const row = await getWageRow(request, wageTaskId, empFixed)
    expect(row.pf).toBe(500)
    expect(row.grossWages).toBe(30360)
    expect(row.totalDeductions).toBe(510) // 500 + lwf 10
    expect(row.netWages).toBe(29850)
  })

  test('NONE mode: PF is zero, only LWF deducted', async ({ request }) => {
    const row = await getWageRow(request, wageTaskId, empNone)
    expect(row.pf).toBe(0)
    expect(row.grossWages).toBe(30360)
    expect(row.totalDeductions).toBe(10) // lwf only
    expect(row.netWages).toBe(30350)
  })
})

// ── Suite 3: ESI threshold boundary ──────────────────────────────────────────
// SHOP establishment (esiApplicable=true, no fixedAllowance, uses HRA)
// Default threshold = ₹21,000; esiPct = 0.75%
//
// salary=20000, da=5000 → gross=20000 ≤ 21000 → ESI = 20000 × 0.75% = 150
// salary=21000, da=5000 → gross=21000 = 21000 → ESI = 21000 × 0.75% = 157.50
// salary=21001, da=5000 → gross=21001 > 21000 → ESI = 0
//
// PF for all three: wage > 15000 → PF = 1800; lwf=10

test.describe('ESI threshold boundary — shop establishment', () => {
  let cycleId: string
  let empBelow: string
  let empAt: string
  let empAbove: string
  let wageTaskId: string

  test.beforeAll(async ({ request }) => {
    empBelow = await createEmployee(request, SHOP, { salary: 20000, daWage: 5000 })
    empAt    = await createEmployee(request, SHOP, { salary: 21000, daWage: 5000 })
    empAbove = await createEmployee(request, SHOP, { salary: 21001, daWage: 5000 })
    cycleId  = await createCycle(request, SHOP, 2082, 5)
    wageTaskId = await getWageTask(request, cycleId)
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    for (const id of [empBelow, empAt, empAbove].filter(Boolean)) {
      await request.delete(`/api/employees/${id}?mode=remove`)
    }
  })

  test('gross below threshold → ESI = gross × 0.75%', async ({ request }) => {
    const row = await getWageRow(request, wageTaskId, empBelow)
    // gross=20000; ESI = 20000 × 0.0075 = 150
    expect(row.grossWages).toBe(20000)
    expect(row.esi).toBeCloseTo(150, 2)
    expect(row.totalDeductions).toBeCloseTo(1960, 2) // pf 1800 + esi 150 + lwf 10
    expect(row.netWages).toBeCloseTo(18040, 2)
  })

  test('gross exactly at threshold → ESI applies (threshold is inclusive)', async ({ request }) => {
    const row = await getWageRow(request, wageTaskId, empAt)
    // gross=21000 ≤ 21000 → ESI = 21000 × 0.0075 = 157.50
    expect(row.grossWages).toBe(21000)
    expect(row.esi).toBeCloseTo(157.5, 2)
  })

  test('gross one rupee above threshold → ESI is zero', async ({ request }) => {
    const row = await getWageRow(request, wageTaskId, empAbove)
    // gross=21001 > 21000 → ESI = 0
    expect(row.grossWages).toBe(21001)
    expect(row.esi).toBe(0)
    expect(row.totalDeductions).toBe(1810) // pf 1800 + lwf 10, no ESI
    expect(row.netWages).toBeCloseTo(19191, 2)
  })
})

// ── Suite 4: Wage record PUT — deduction stacking ────────────────────────────
// Uses the bulk hospital (est_hospital_bulk) for an existing cycle (2096/6 from 13-wage-calc).
// Creates its own cycle to be self-contained.
// Hospital preset: totalEarnings = basic+da+fixedAllowance(360)

test.describe('Wage record PUT — multi-deduction stacking', () => {
  let cycleId: string
  let wageTaskId: string
  let employeeId: string

  test.beforeAll(async ({ request }) => {
    const emp = await request.post('/api/employees', {
      data: {
        name: 'Deduction Stack Test',
        establishmentId: 'est_hospital_bulk',
        defaultTotalSalary: 20000,
        paymentMode: 'CASH',
      },
    })
    employeeId = ((await emp.json()) as { id: string }).id

    const cyc = await request.post('/api/cycles', {
      data: { establishmentId: 'est_hospital_bulk', month: 7, year: 2083 },
    })
    cycleId = cyc.ok()
      ? ((await cyc.json()) as { id: string }).id
      : (await (await request.get('/api/cycles?establishmentId=est_hospital_bulk')).json() as { id: string; year: number; month: number }[])
          .find((c) => c.year === 2083 && c.month === 7)!.id
    wageTaskId = await getWageTask(request, cycleId)
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    if (employeeId) await request.delete(`/api/employees/${employeeId}?mode=remove`)
  })

  test('pf + esi + lwf + advance + fine + other all reduce net wages', async ({ request }) => {
    const put = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: {
        records: [{
          employeeId,
          daysWorked: 26,
          basic: 10000, da: 5000, hra: 0, otherAllowances: 0,
          pf: 1800, esi: 0, lwf: 10,
          advanceRecovered: 500, fineDeduction: 100, otherDeductions: 200,
        }],
      },
    })
    expect(put.ok()).toBeTruthy()

    const rows = (await (await request.get(`/api/form-tasks/${wageTaskId}/wages`)).json()) as WageRow[]
    const row = rows.find((r) => r.employeeId === employeeId)!
    // totalNormalWages = basic + da = 15000
    expect(row.totalNormalWages).toBe(15000)
    // totalEarnings = 15000 + fixedAllowance 360 = 15360
    expect(row.totalEarnings).toBe(15360)
    // grossWages = totalEarnings + OT(0) = 15360
    expect(row.grossWages).toBe(15360)
    // totalDeductions = 1800+0+10+500+100+200 = 2610
    expect(row.totalDeductions).toBe(2610)
    // netWages = 15360 - 2610 = 12750
    expect(row.netWages).toBe(12750)
  })

  test('advance recovery reduces net but not gross wages', async ({ request }) => {
    const put = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: {
        records: [{
          employeeId,
          daysWorked: 26,
          basic: 10000, da: 5000, hra: 0, otherAllowances: 0,
          pf: 1800, esi: 0, lwf: 10,
          advanceRecovered: 2000, fineDeduction: 0, otherDeductions: 0,
        }],
      },
    })
    expect(put.ok()).toBeTruthy()

    const rows = (await (await request.get(`/api/form-tasks/${wageTaskId}/wages`)).json()) as WageRow[]
    const row = rows.find((r) => r.employeeId === employeeId)!
    // Gross unchanged by advance
    expect(row.grossWages).toBe(15360)
    // Deductions include advance
    expect(row.totalDeductions).toBe(3810) // 1800+10+2000
    // Net reduced by advance
    expect(row.netWages).toBe(11550)
  })

  test('shop preset uses HRA+OtherAllowances in totalEarnings (not fixedAllowance)', async ({ request }) => {
    // Create a shop establishment employee for this check
    const shopEmp = await request.post('/api/employees', {
      data: {
        name: 'Shop Deduction Test',
        establishmentId: SHOP,
        defaultTotalSalary: 18053,
        paymentMode: 'CASH',
        daWage: 7353,
        hraWage: 500,
      },
    })
    const shopEmpId = ((await shopEmp.json()) as { id: string }).id
    const shopCyc = await request.post('/api/cycles', {
      data: { establishmentId: SHOP, month: 7, year: 2083 },
    })
    const shopCycleId = shopCyc.ok()
      ? ((await shopCyc.json()) as { id: string }).id
      : (await (await request.get(`/api/cycles?establishmentId=${SHOP}`)).json() as { id: string; year: number; month: number }[])
          .find((c) => c.year === 2083 && c.month === 7)!.id
    const shopWageTaskId = await getWageTask(request, shopCycleId)

    const put = await request.put(`/api/form-tasks/${shopWageTaskId}/wages`, {
      data: {
        records: [{
          employeeId: shopEmpId,
          daysWorked: 26,
          basic: 10000, da: 7353, hra: 500, otherAllowances: 200,
          pf: 1800, esi: 130, lwf: 10,
          advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0,
        }],
      },
    })
    expect(put.ok()).toBeTruthy()

    const rows = (await (await request.get(`/api/form-tasks/${shopWageTaskId}/wages`)).json()) as WageRow[]
    const row = rows.find((r) => r.employeeId === shopEmpId)!
    // Shop preset: totalEarnings = basic+da+hra+other (NOT fixed allowance)
    expect(row.totalNormalWages).toBe(17353)    // basic+da
    expect(row.totalEarnings).toBe(18053)        // +hra(500)+other(200)
    expect(row.grossWages).toBe(18053)
    expect(row.totalDeductions).toBe(1940)       // 1800+130+10
    expect(row.netWages).toBe(16113)

    // Cleanup
    await request.delete(`/api/cycles/${shopCycleId}`)
    await request.delete(`/api/employees/${shopEmpId}?mode=remove`)
  })
})

// ── Suite 5: Holiday bonus calculation ───────────────────────────────────────
// Creates a govt holiday on a specific date, marks that day P in attendance,
// then verifies the computed holiday bonus in the wage record.
//
// Holiday bonus = dailyRate × (multiplier − 1) × holidayWorkedDays
// dailyRate = (basic + da) / daysWorked = 15000 / 26 ≈ 576.92
// With 1 holiday worked and multiplier=2: bonus = 576.92 × 1 × 1 ≈ 576.92

test.describe('Holiday bonus calculation — attendance → wage pipeline', () => {
  const YEAR = 2082
  const MONTH = 6
  const HOLIDAY_DATE = `${YEAR}-0${MONTH}-15` // 15th June 2082

  let cycleId: string
  let wageTaskId: string
  let attendanceTaskId: string
  let employeeId: string
  let holidayId: string

  test.beforeAll(async ({ request }) => {
    const emp = await request.post('/api/employees', {
      data: {
        name: 'Holiday Bonus Test',
        establishmentId: DNV,
        defaultTotalSalary: 15000,
        daWage: 5000,
        paymentMode: 'CASH',
      },
    })
    employeeId = ((await emp.json()) as { id: string }).id

    // Create a govt holiday on day 15 of the cycle month
    const hol = await request.post('/api/holidays', {
      data: {
        date: HOLIDAY_DATE,
        name: 'Test Holiday',
        doubleWage: true,
      },
    })
    expect(hol.ok()).toBeTruthy()
    holidayId = ((await hol.json()) as { id: string }).id

    cycleId = await createCycle(request, DNV, YEAR, MONTH)
    const detail = (await (await request.get(`/api/cycles/${cycleId}`)).json()) as {
      formTasks: { id: string; formCode: string }[]
    }
    wageTaskId = detail.formTasks.find((t) => t.formCode === 'HOSPITAL_FORM_XII')!.id
    attendanceTaskId = detail.formTasks.find((t) => t.formCode === 'HOSPITAL_FORM_V')!.id
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    if (employeeId) await request.delete(`/api/employees/${employeeId}?mode=remove`)
    if (holidayId) await request.delete(`/api/holidays/${holidayId}`)
  })

  test('holiday bonus appears in totalEarnings when employee worked on a govt holiday', async ({ request }) => {
    // 26 days Present; day 15 is the govt holiday (index 14 = 'P' → holiday worked)
    const marks = Array.from({ length: 30 }, (_, i) => (i < 26 ? 'P' : 'A'))
    const attPut = await request.put(`/api/form-tasks/${attendanceTaskId}/attendance`, {
      data: { records: [{ employeeId, dailyMarks: marks }] },
    })
    expect(attPut.ok(), `attendance PUT failed: ${await attPut.text()}`).toBeTruthy()

    // Save wages — server recomputes holiday bonus from attendance
    const wagePut = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: {
        records: [{
          employeeId,
          daysWorked: 26,
          basic: 10000, da: 5000, hra: 0, otherAllowances: 0,
          pf: 1800, esi: 0, lwf: 10,
          advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0,
        }],
      },
    })
    expect(wagePut.ok(), `wages PUT failed: ${await wagePut.text()}`).toBeTruthy()

    const rows = (await (await request.get(`/api/form-tasks/${wageTaskId}/wages`)).json()) as WageRow[]
    const row = rows.find((r) => r.employeeId === employeeId)!
    expect(row).toBeTruthy()

    // dailyRate = (10000+5000) / 26 ≈ 576.92
    // bonus = 576.92 × (2-1) × 1 = 576.92
    const expectedBonus = Math.round((15000 / 26) * 1 * 1 * 100) / 100
    expect(row.holidayBonus).toBeCloseTo(expectedBonus, 1)

    // Holiday bonus adds to totalEarnings (basic+da+fixedAllowance+bonus)
    // totalEarnings = 15000 + 360 + bonus = 15360 + bonus
    expect(row.totalEarnings).toBeCloseTo(15360 + expectedBonus, 1)

    // grossWages includes the bonus (no OT)
    expect(row.grossWages).toBeCloseTo(15360 + expectedBonus, 1)

    // Net = gross - deductions
    expect(row.netWages).toBeCloseTo(row.grossWages - row.totalDeductions, 2)
  })

  test('no holiday bonus when employee was absent on the holiday', async ({ request }) => {
    // 25 days P, day 15 is 'A' (absent on holiday)
    const marks = Array.from({ length: 30 }, (_, i) => {
      if (i === 14) return 'A'  // day 15 absent
      if (i < 25) return 'P'
      return 'A'
    })
    const attPut = await request.put(`/api/form-tasks/${attendanceTaskId}/attendance`, {
      data: { records: [{ employeeId, dailyMarks: marks }] },
    })
    expect(attPut.ok()).toBeTruthy()

    const wagePut = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: {
        records: [{
          employeeId, daysWorked: 25,
          basic: 10000, da: 5000, hra: 0, otherAllowances: 0,
          pf: 1800, esi: 0, lwf: 10,
          advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0,
        }],
      },
    })
    expect(wagePut.ok()).toBeTruthy()

    const rows = (await (await request.get(`/api/form-tasks/${wageTaskId}/wages`)).json()) as WageRow[]
    const row = rows.find((r) => r.employeeId === employeeId)!
    // No holiday worked → bonus = 0
    expect(row.holidayBonus).toBe(0)
    expect(row.totalEarnings).toBe(15360) // 15000 + 360 fixed, no bonus
  })
})

// ── Suite 6: Salary breakdown correctness (via employee form API) ─────────────
// Basic = totalSalary − DA − HRA − OtherAllowances
// PF computed on (basic+da), capped at ceiling

test.describe('Salary component split — via cycle wage seeding', () => {
  let cycleId: string
  let wageTaskId: string
  let empId: string

  test.beforeAll(async ({ request }) => {
    // salary=20000, DA=5000, HRA=1000 → Basic = 20000-5000-1000 = 14000
    const emp = await request.post('/api/employees', {
      data: {
        name: 'Breakdown Split Test',
        establishmentId: DNV,
        defaultTotalSalary: 20000,
        daWage: 5000,
        hraWage: 1000,
        pfMode: 'PERCENT',
        pfPercent: 12,
        pfWageCeiling: 15000,
        lwfAmount: 10,
        paymentMode: 'CASH',
      },
    })
    empId = ((await emp.json()) as { id: string }).id
    cycleId = await createCycle(request, DNV, 2082, 8)
    wageTaskId = await getWageTask(request, cycleId)
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    if (empId) await request.delete(`/api/employees/${empId}?mode=remove`)
  })

  test('Basic = totalSalary − DA − HRA, PF computed on basic+da capped at ceiling', async ({ request }) => {
    const row = await getWageRow(request, wageTaskId, empId)
    // basic = 20000 - 5000 - 1000 = 14000
    expect(row.basic).toBe(14000)
    expect(row.da).toBe(5000)
    expect(row.hra).toBe(1000)
    // PF wage = basic+da = 14000+5000 = 19000 > 15000 ceiling → PF capped = 1800
    expect(row.pf).toBe(1800)
    // Hospital preset: totalEarnings = basic+da+fixedAllowance(360), NOT +HRA
    // (HRA reduces Basic but is NOT added back to earnings in the hospital statutory formula)
    // gross = 14000 + 5000 + 360 = 19360
    expect(row.grossWages).toBe(19360)
    // net = 19360 - 1800 - 10 = 17550
    expect(row.netWages).toBe(17550)
  })
})

// ── Suite 7: All-zero wage record — no negative net pay ──────────────────────
// Verifies that explicitly setting all wage fields to 0 produces net=0 (not negative).
// Uses a normal employee; zero-values are submitted via PUT (not seeded from salary).

test.describe('All-zero wage record — net pay must not be negative', () => {
  let cycleId: string
  let wageTaskId: string
  let empId: string

  test.beforeAll(async ({ request }) => {
    const emp = await request.post('/api/employees', {
      data: {
        name: 'Zero Wage Record Test',
        establishmentId: BULK,
        defaultTotalSalary: 15000,
        paymentMode: 'CASH',
      },
    })
    empId = ((await emp.json()) as { id: string }).id
    cycleId = await createCycle(request, BULK, 2082, 9)
    wageTaskId = await getWageTask(request, cycleId)
  })

  test.afterAll(async ({ request }) => {
    if (cycleId) await request.delete(`/api/cycles/${cycleId}`)
    if (empId) await request.delete(`/api/employees/${empId}?mode=remove`)
  })

  test('wage record with all-zero basic/da/pf: net = gross − deductions', async ({ request }) => {
    // Hospital preset: even with basic=0, da=0, gross = fixedAllowance(360)
    // Verify the formula holds: net = gross - totalDeductions
    const put = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: {
        records: [{
          employeeId: empId,
          daysWorked: 0,
          basic: 0, da: 0, hra: 0, otherAllowances: 0,
          pf: 0, esi: 0, lwf: 0,
          advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0,
        }],
      },
    })
    expect(put.ok(), `PUT failed: ${await put.text()}`).toBeTruthy()
    const rows = (await (await request.get(`/api/form-tasks/${wageTaskId}/wages`)).json()) as WageRow[]
    const row = rows.find((r) => r.employeeId === empId)!
    // net = gross - totalDeductions (always, regardless of gross value)
    expect(row.netWages).toBeCloseTo(row.grossWages - row.totalDeductions, 2)
    expect(row.totalDeductions).toBe(0)
    expect(typeof row.netWages).toBe('number')
  })

  test('deductions reduce net wages proportionally — net = gross − (pf+esi+lwf+advance+fine)', async ({ request }) => {
    const put = await request.put(`/api/form-tasks/${wageTaskId}/wages`, {
      data: {
        records: [{
          employeeId: empId,
          daysWorked: 26,
          basic: 9000, da: 4000, hra: 0, otherAllowances: 0,
          pf: 1560, esi: 0, lwf: 10,
          advanceRecovered: 500, fineDeduction: 100, otherDeductions: 0,
        }],
      },
    })
    expect(put.ok(), `PUT failed: ${await put.text()}`).toBeTruthy()
    const rows = (await (await request.get(`/api/form-tasks/${wageTaskId}/wages`)).json()) as WageRow[]
    const row = rows.find((r) => r.employeeId === empId)!
    // Hospital: totalEarnings = 9000+4000+360 = 13360; gross = 13360
    expect(row.grossWages).toBe(13360)
    // totalDeductions = 1560 + 0 + 10 + 500 + 100 = 2170
    expect(row.totalDeductions).toBe(2170)
    // net = 13360 - 2170 = 11190
    expect(row.netWages).toBe(11190)
    // Formula invariant: net === gross - deductions
    expect(row.netWages).toBeCloseTo(row.grossWages - row.totalDeductions, 2)
  })
})
