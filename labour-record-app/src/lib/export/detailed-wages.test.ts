import { describe, expect, it } from 'vitest'
import { buildDetailedWagesRows, type DetailedWagesInput } from './detailed-wages'

const emp = (over: Partial<DetailedWagesInput> = {}): DetailedWagesInput => ({
  name: 'Asha Rao',
  empId: 'E001',
  daysWorked: 26,
  basic: 12000,
  da: 3000,
  hra: 2000,
  otherAllowances: 1000,
  otEarnings: 0,
  grossEarnings: 18000,
  pf: 1800,
  esi: 135,
  lwf: 20,
  fineDeduction: 50,
  otherDeductions: 100,
  advanceRecovered: 500,
  netWage: 15395,
  paymentDate: '2026-06-05',
  receiptRef: 'RCP-001',
  ...over,
})

describe('buildDetailedWagesRows', () => {
  it('emits one row per employee preserving every component', () => {
    const res = buildDetailedWagesRows([emp()])
    expect(res.rows).toHaveLength(1)
    expect(res.rows[0]).toMatchObject({
      name: 'Asha Rao',
      empId: 'E001',
      daysWorked: 26,
      basic: 12000,
      da: 3000,
      hra: 2000,
      otherAllowances: 1000,
      otEarnings: 0,
      grossEarnings: 18000,
      pf: 1800,
      esi: 135,
      lwf: 20,
      fineDeduction: 50,
      otherDeductions: 100,
      advanceRecovered: 500,
      netWage: 15395,
      paymentDate: '2026-06-05',
      receiptRef: 'RCP-001',
    })
  })

  it('computes totalDeductions = pf + esi + lwf + fine + other + advance per row', () => {
    const res = buildDetailedWagesRows([emp()])
    // 1800 + 135 + 20 + 50 + 100 + 500
    expect(res.rows[0].totalDeductions).toBe(2605)
  })

  it('defaults optional otEarnings to 0 when omitted', () => {
    const { otEarnings, ...rest } = emp()
    void otEarnings
    const res = buildDetailedWagesRows([rest as DetailedWagesInput])
    expect(res.rows[0].otEarnings).toBe(0)
  })

  it('carries a non-zero otEarnings through to the row and totals', () => {
    const res = buildDetailedWagesRows([emp({ otEarnings: 450 })])
    expect(res.rows[0].otEarnings).toBe(450)
    expect(res.totals.otEarnings).toBe(450)
  })

  it('sums every money column into the totals row', () => {
    const res = buildDetailedWagesRows([
      emp(),
      emp({
        empId: 'E002',
        name: 'Ravi Kumar',
        basic: 8000,
        da: 2000,
        hra: 1000,
        otherAllowances: 500,
        otEarnings: 400,
        grossEarnings: 12200,
        pf: 1200,
        esi: 90,
        lwf: 20,
        fineDeduction: 0,
        otherDeductions: 0,
        advanceRecovered: 0,
        netWage: 10890,
      }),
    ])
    expect(res.totals.basic).toBe(20000)
    expect(res.totals.da).toBe(5000)
    expect(res.totals.hra).toBe(3000)
    expect(res.totals.otherAllowances).toBe(1500)
    expect(res.totals.otEarnings).toBe(400)
    expect(res.totals.grossEarnings).toBe(30200)
    expect(res.totals.pf).toBe(3000)
    expect(res.totals.esi).toBe(225)
    expect(res.totals.lwf).toBe(40)
    expect(res.totals.fineDeduction).toBe(50)
    expect(res.totals.otherDeductions).toBe(100)
    expect(res.totals.advanceRecovered).toBe(500)
    expect(res.totals.totalDeductions).toBe(3915) // 2605 + 1310
    expect(res.totals.netWage).toBe(26285)
  })

  it('rounds money sums to 2 decimals (no float drift)', () => {
    const res = buildDetailedWagesRows([
      emp({ netWage: 0.1, grossEarnings: 0.1, basic: 0.1 }),
      emp({ empId: 'E9', netWage: 0.2, grossEarnings: 0.2, basic: 0.2 }),
    ])
    expect(res.totals.netWage).toBe(0.3)
    expect(res.totals.grossEarnings).toBe(0.3)
    expect(res.totals.basic).toBe(0.3)
  })

  it('returns empty rows and zeroed totals for an empty cycle', () => {
    const res = buildDetailedWagesRows([])
    expect(res.rows).toEqual([])
    expect(res.totals).toEqual({
      basic: 0,
      da: 0,
      hra: 0,
      otherAllowances: 0,
      otEarnings: 0,
      grossEarnings: 0,
      pf: 0,
      esi: 0,
      lwf: 0,
      fineDeduction: 0,
      otherDeductions: 0,
      advanceRecovered: 0,
      totalDeductions: 0,
      netWage: 0,
    })
  })
})
