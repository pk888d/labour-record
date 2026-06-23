import { describe, expect, it } from 'vitest'
import { computeCycleWages, type CycleWageEmployee } from './cycle-wage'

const emp: CycleWageEmployee = {
  defaultTotalSalary: 20000, daWage: 5544, hraWage: 0,
  pfMode: 'PERCENT', pfPercent: 12, pfWageCeiling: 15000, pfAmount: 0, lwfAmount: 20,
}

describe('computeCycleWages', () => {
  it('derives wages from the employee salary when there is no attendance', () => {
    const r = computeCycleWages({ employee: emp, esiApplicable: false, daysInMonth: 30 })
    expect(r.da).toBe(5544)
    expect(r.basic).toBe(14456)
    expect(r.pf).toBe(1800)
    expect(r.holidayBonus).toBe(0)
    expect(r.grossWages).toBe(20000)
    expect(r.totalDeductions).toBe(1820)
    expect(r.netWages).toBe(18180)
    expect(r.daysWorked).toBe(30)
  })

  it('auto-pays a holiday-worked day at 2x (double wage)', () => {
    const attendance = Array.from({ length: 10 }, () => 'P')
    const r = computeCycleWages({
      employee: emp, attendance, holidayDays: new Set([5]),
      holidayMultiplier: 2, esiApplicable: false, daysInMonth: 30,
    })
    expect(r.daysWorked).toBe(10)
    expect(r.holidayBonus).toBe(2000)
    expect(r.grossWages).toBe(22000)
    expect(r.netWages).toBe(20180)
  })

  it('applies ESI at 0.75% when applicable and within threshold', () => {
    const r = computeCycleWages({
      employee: { ...emp, defaultTotalSalary: 15000, daWage: 5544 },
      esiApplicable: true, daysInMonth: 30,
    })
    expect(r.esi).toBe(112.5)
  })

  it('returns zeros for a zero-salary employee', () => {
    const r = computeCycleWages({
      employee: { ...emp, defaultTotalSalary: 0, daWage: 0 },
      esiApplicable: false, daysInMonth: 30,
    })
    expect(r.grossWages).toBe(0)
    expect(r.netWages).toBe(0)
  })
})
