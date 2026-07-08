import { computeSalaryBreakdown, ESI_DEFAULT_THRESHOLD, ESI_EMPLOYEE_PCT } from './salary-breakdown'
import { calculatePf } from './pf-calculator'
import { calculateAttendanceTotals } from './attendance-calculator'
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

  // wageDays (worked + leave + paid-holiday) is what Basic/DA/HRA are prorated
  // against — same formula the interactive Wage Data tab uses (prorate() in
  // src/app/forms/[taskId]/page.tsx), so a partial-attendance employee doesn't
  // get paid a full unprorated month via cycle creation / Sync Wages.
  const wageDays = input.attendance ? calculateAttendanceTotals(input.attendance).wageDays : input.daysInMonth
  const prorate = (monthly: number) =>
    wageDays > 0 ? round2((monthly * wageDays) / input.daysInMonth) : 0

  const basic = prorate(b.basic)
  const da = prorate(b.da)
  const hra = prorate(b.hra)

  const holidayWorkedDays =
    input.attendance && input.holidayDays
      ? input.attendance.filter((m, i) => m === 'P' && input.holidayDays!.has(i + 1)).length
      : 0
  const dailyRate = daysWorked > 0 ? (b.basic + b.da) / daysWorked : 0
  const holidayBonus = round2(dailyRate * (multiplier - 1) * holidayWorkedDays)

  const totalNormalWages = round2(basic + da)
  // Mirror calculateWages: the hospital minimum-wages preset adds a fixed
  // allowance (not HRA) on top of Basic+DA; all other presets use HRA.
  const allowance =
    input.preset === 'TN_MINIMUM_WAGES_HOSPITAL' ? input.fixedAllowance ?? 0 : hra
  const totalEarnings = round2(basic + da + allowance + holidayBonus)
  const overtimeEarnings = 0
  const grossWages = round2(totalEarnings + overtimeEarnings)

  // PF/ESI are computed on the prorated wage, not the full-month figure —
  // otherwise a partial-attendance employee would be over-deducted.
  const pf = calculatePf(
    {
      mode: e.pfMode as 'PERCENT' | 'FIXED' | 'NONE',
      percent: e.pfPercent,
      ceiling: e.pfWageCeiling,
      fixedAmount: e.pfAmount,
    },
    basic + da
  )
  const esi =
    input.esiApplicable && grossWages <= ESI_DEFAULT_THRESHOLD
      ? round2(grossWages * (ESI_EMPLOYEE_PCT / 100))
      : 0
  const lwf = b.lwf // statutory LWF is a flat monthly amount, not prorated

  // No deductions when there are no wages (avoids negative net for zero-salary employees).
  const totalDeductions = grossWages > 0 ? round2(pf + esi + lwf) : 0
  const netWages = round2(grossWages - totalDeductions)

  return {
    daysWorked,
    basic,
    da,
    hra,
    holidayBonus,
    totalNormalWages,
    totalEarnings,
    overtimeEarnings,
    grossWages,
    pf,
    esi,
    lwf,
    totalDeductions,
    netWages,
  }
}
