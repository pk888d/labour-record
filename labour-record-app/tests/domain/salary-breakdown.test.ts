import { describe, it, expect } from 'vitest'
import { computeSalaryBreakdown } from '@/domain/calculations/salary-breakdown'

const pfPercent = { mode: 'PERCENT' as const, percent: 12, ceiling: 15000 }

describe('computeSalaryBreakdown — basic split', () => {
  it('Basic = totalSalary - DA (DA fixed by firm type)', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 15000, daRate: 5544, pfConfig: pfPercent, esiApplicable: false,
    })
    expect(r.da).toBe(5544)
    expect(r.basic).toBe(9456)
  })

  it('caps DA at totalSalary when DA exceeds it', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 5000, daRate: 5544, pfConfig: pfPercent, esiApplicable: false,
    })
    expect(r.da).toBe(5000)
    expect(r.basic).toBe(0)
  })
})

describe('computeSalaryBreakdown — PF', () => {
  it('PF is 12% of Basic+DA, capped at 1800', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 15000, daRate: 5544, pfConfig: pfPercent, esiApplicable: false,
    })
    expect(r.pf).toBe(1800)
  })
  it('PF below the cap is exact percent', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 12000, daRate: 7353, pfConfig: pfPercent, esiApplicable: false,
    })
    expect(r.pf).toBe(1440)
  })
})

describe('computeSalaryBreakdown — ESI', () => {
  it('ESI is 0.75% of gross when applicable and gross <= 21000', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 12000, daRate: 7353, pfConfig: pfPercent, esiApplicable: true,
    })
    expect(r.esi).toBe(90)
  })
  it('ESI is 0 when gross exceeds 21000 threshold', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 22000, daRate: 5544, pfConfig: pfPercent, esiApplicable: true,
    })
    expect(r.esi).toBe(0)
  })
  it('ESI is 0 when not applicable', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 12000, daRate: 7353, pfConfig: pfPercent, esiApplicable: false,
    })
    expect(r.esi).toBe(0)
  })
  it('honours a custom ESI employee percentage', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 12000, daRate: 7353, pfConfig: pfPercent, esiApplicable: true,
      esiEmployeePct: 1.0,
    })
    expect(r.esi).toBe(120) // 1% of 12000
  })
  it('honours a custom ESI threshold (raises the eligibility cap)', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 25000, daRate: 5544, pfConfig: pfPercent, esiApplicable: true,
      esiThreshold: 30000,
    })
    expect(r.esi).toBe(187.5) // now applicable at 25000: 0.75% of 25000
  })
})

describe('computeSalaryBreakdown — editable HRA / Other Allowances / LWF', () => {
  it('HRA reduces Basic (Basic = total - DA - HRA - Other)', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 15000, daRate: 5544, pfConfig: pfPercent, esiApplicable: false,
      hra: 1000,
    })
    expect(r.hra).toBe(1000)
    expect(r.basic).toBe(8456) // 15000 - 5544 - 1000
  })
  it('Other Allowances also reduce Basic', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 15000, daRate: 5544, pfConfig: pfPercent, esiApplicable: false,
      hra: 1000, otherAllowances: 500,
    })
    expect(r.otherAllowances).toBe(500)
    expect(r.basic).toBe(7956) // 15000 - 5544 - 1000 - 500
  })
  it('Basic floors at 0 when components exceed total', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 6000, daRate: 5544, pfConfig: pfPercent, esiApplicable: false,
      hra: 1000,
    })
    expect(r.basic).toBe(0)
  })
  it('LWF is included in deductions and reduces net', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 12000, daRate: 7353, pfConfig: pfPercent, esiApplicable: false,
      lwf: 20,
    })
    expect(r.lwf).toBe(20)
    expect(r.totalDeductions).toBe(1460) // 1440 pf + 20 lwf
    expect(r.netSalary).toBe(10540) // 12000 - 1460
  })
  it('DA can be overridden below the firm rate', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 15000, daRate: 4000, pfConfig: pfPercent, esiApplicable: false,
    })
    expect(r.da).toBe(4000)
    expect(r.basic).toBe(11000)
  })
})

describe('computeSalaryBreakdown — overtime/double wages and totals', () => {
  it('adds overtime to gross and net', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 15000, daRate: 5544, pfConfig: pfPercent, esiApplicable: false,
      overtimeEarnings: 2000,
    })
    expect(r.grossWages).toBe(17000)
    expect(r.netSalary).toBe(15200) // 17000 - 1800 pf
  })
  it('net = gross - (pf + esi)', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 12000, daRate: 7353, pfConfig: pfPercent, esiApplicable: true,
    })
    expect(r.grossWages).toBe(12000)
    expect(r.totalDeductions).toBe(1530) // 1440 pf + 90 esi
    expect(r.netSalary).toBe(10470)
  })
})
