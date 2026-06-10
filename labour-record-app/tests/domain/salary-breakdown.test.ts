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
