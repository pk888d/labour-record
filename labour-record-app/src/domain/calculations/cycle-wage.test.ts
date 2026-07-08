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
    // Full 30-day month, all Present (day 5 is also a govt holiday worked) —
    // wageDays === daysInMonth so proration is a no-op (factor 1), isolating
    // the holiday-bonus calculation from proration.
    const attendance = Array.from({ length: 30 }, () => 'P')
    const r = computeCycleWages({
      employee: emp, attendance, holidayDays: new Set([5]),
      holidayMultiplier: 2, esiApplicable: false, daysInMonth: 30,
    })
    expect(r.daysWorked).toBe(30)
    // dailyRate = (basic+da) / daysWorked = 20000 / 30 = 666.67; bonus = dailyRate * 1 extra unit
    expect(r.holidayBonus).toBe(666.67)
    expect(r.grossWages).toBe(20666.67)
    expect(r.netWages).toBe(18846.67)
  })

  it('prorates Basic/DA/HRA by wageDays/daysInMonth for partial attendance', () => {
    // 20 Present + 5 Leave + 5 Absent out of a 30-day month: wageDays = 25
    // (worked + leave; paid), so Basic+DA should scale to 25/30 of the full
    // month figure — this is the TEC-40 fix (gross wages must not silently
    // pay a full month when attendance is partial).
    const attendance = [
      ...Array.from({ length: 20 }, () => 'P'),
      ...Array.from({ length: 5 }, () => 'L'),
      ...Array.from({ length: 5 }, () => 'A'),
    ]
    const r = computeCycleWages({
      employee: emp, attendance, esiApplicable: false, daysInMonth: 30,
    })
    expect(r.daysWorked).toBe(20)
    // Full month da=5544, basic=14456 (from the first test) -> * 25/30
    expect(r.da).toBe(4620) // round2(5544 * 25 / 30)
    expect(r.basic).toBe(12046.67) // round2(14456 * 25 / 30)
    expect(r.grossWages).toBe(16666.67)
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

  it('adds the hospital fixed allowance to earnings (matches calculateWages)', () => {
    const r = computeCycleWages({
      employee: { ...emp, defaultTotalSalary: 15000, daWage: 5544, hraWage: 0 },
      esiApplicable: false, daysInMonth: 30,
      preset: 'TN_MINIMUM_WAGES_HOSPITAL', fixedAllowance: 360,
    })
    expect(r.grossWages).toBe(15360) // basic+da (15000) + fixed allowance (360)
  })
})
