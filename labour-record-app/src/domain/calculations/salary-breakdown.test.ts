import { describe, expect, it } from 'vitest'
import { computeSalaryBreakdown } from './salary-breakdown'

describe('computeSalaryBreakdown', () => {
  it('splits total into DA (capped at rate) + Basic remainder, PF on Basic+DA', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 20000,
      daRate: 5544,
      lwf: 20,
      pfConfig: { mode: 'PERCENT', percent: 12, ceiling: 15000 },
      esiApplicable: false,
    })
    expect(r.da).toBe(5544)
    expect(r.basic).toBe(14456) // 20000 - 5544
    expect(r.pf).toBe(1800) // capped
    expect(r.grossWages).toBe(20000)
    expect(r.esi).toBe(0)
    expect(r.totalDeductions).toBe(1820) // pf + lwf
    expect(r.netSalary).toBe(18180)
  })

  it('applies ESI at 0.75% when applicable and gross <= threshold', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 15000,
      daRate: 5544,
      pfConfig: { mode: 'NONE' },
      esiApplicable: true,
    })
    expect(r.esi).toBe(112.5) // 15000 * 0.75%
  })

  it('skips ESI when gross exceeds the threshold', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 25000,
      daRate: 5544,
      pfConfig: { mode: 'NONE' },
      esiApplicable: true,
    })
    expect(r.esi).toBe(0)
  })

  it('subtracts HRA and Other from Basic; never goes negative', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 6000,
      daRate: 5544,
      hra: 400,
      otherAllowances: 300,
      pfConfig: { mode: 'NONE' },
      esiApplicable: false,
    })
    expect(r.da).toBe(5544)
    expect(r.basic).toBe(0) // max(0, 6000 - 5544 - 400 - 300) clamped
  })

  it('adds overtime on top of gross', () => {
    const r = computeSalaryBreakdown({
      totalSalary: 20000,
      daRate: 5544,
      overtimeEarnings: 1500,
      pfConfig: { mode: 'NONE' },
      esiApplicable: false,
    })
    expect(r.grossWages).toBe(21500)
  })
})
