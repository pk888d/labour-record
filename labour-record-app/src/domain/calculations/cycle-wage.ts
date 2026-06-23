import { computeSalaryBreakdown } from './salary-breakdown'
import { round2 } from '@/lib/money'

// Employee's saved monthly wage configuration (defaults), used to derive a
// cycle's wages when there is no manually-entered WageRecord.
export interface CycleWageEmployee {
  defaultTotalSalary: number
  daWage: number // DA rate (₹)
  hraWage: number
  pfMode: string // 'PERCENT' | 'FIXED' | 'NONE'
  pfPercent: number
  pfWageCeiling: number
  pfAmount: number // used when pfMode === 'FIXED'
  lwfAmount: number
}

export interface CycleWageResult {
  daysWorked: number
  basic: number
  da: number
  hra: number
  holidayBonus: number
  totalNormalWages: number
  totalEarnings: number
  overtimeEarnings: number
  grossWages: number
  pf: number
  esi: number
  lwf: number
  totalDeductions: number
  netWages: number
}

// Derive a cycle's wage figures from the employee's saved salary + attendance.
// Holiday-worked days (Present on a govt-holiday day) are auto-paid at the
// holiday multiplier (default 2 = double wage). No manual deductions (fines /
// advances) are included — those only come from a manual WageRecord.
export function computeCycleWages(input: {
  employee: CycleWageEmployee
  attendance?: string[]
  holidayDays?: Set<number>
  holidayMultiplier?: number
  esiApplicable: boolean
  daysInMonth: number
  preset?: string // wage formula preset; controls the allowance in totalEarnings
  fixedAllowance?: number // hospital preset's fixed allowance (₹), added to earnings
}): CycleWageResult {
  const e = input.employee
  const multiplier = input.holidayMultiplier ?? 2

  const b = computeSalaryBreakdown({
    totalSalary: e.defaultTotalSalary,
    daRate: e.daWage,
    hra: e.hraWage,
    otherAllowances: 0,
    lwf: e.lwfAmount,
    pfConfig: {
      mode: e.pfMode as 'PERCENT' | 'FIXED' | 'NONE',
      percent: e.pfPercent,
      ceiling: e.pfWageCeiling,
      fixedAmount: e.pfAmount,
    },
    esiApplicable: input.esiApplicable,
  })

  const daysWorked = input.attendance
    ? input.attendance.filter((m) => m === 'P' || m === 'OT').length
    : input.daysInMonth

  const holidayWorkedDays =
    input.attendance && input.holidayDays
      ? input.attendance.filter((m, i) => m === 'P' && input.holidayDays!.has(i + 1)).length
      : 0
  const dailyRate = daysWorked > 0 ? (b.basic + b.da) / daysWorked : 0
  const holidayBonus = round2(dailyRate * (multiplier - 1) * holidayWorkedDays)

  const totalNormalWages = round2(b.basic + b.da)
  // Mirror calculateWages: the hospital minimum-wages preset adds a fixed
  // allowance (not HRA) on top of Basic+DA; all other presets use HRA.
  const allowance =
    input.preset === 'TN_MINIMUM_WAGES_HOSPITAL' ? input.fixedAllowance ?? 0 : b.hra
  const totalEarnings = round2(b.basic + b.da + allowance + holidayBonus)
  const overtimeEarnings = 0
  const grossWages = round2(totalEarnings + overtimeEarnings)
  // No deductions when there are no wages (avoids negative net for zero-salary employees).
  const totalDeductions = grossWages > 0 ? round2(b.pf + b.esi + b.lwf) : 0
  const netWages = round2(grossWages - totalDeductions)

  return {
    daysWorked,
    basic: b.basic,
    da: b.da,
    hra: b.hra,
    holidayBonus,
    totalNormalWages,
    totalEarnings,
    overtimeEarnings,
    grossWages,
    pf: b.pf,
    esi: b.esi,
    lwf: b.lwf,
    totalDeductions,
    netWages,
  }
}
