import { calculatePf, type PfConfig } from './pf-calculator'
import { round2 } from '@/lib/money'

export const ESI_DEFAULT_THRESHOLD = 21000
export const ESI_EMPLOYEE_PCT = 0.75

export type SalaryBreakdownInput = {
  totalSalary: number // the monthly gross target (Basic + DA + HRA + Other)
  daRate: number // DA value to use (defaults to firm rate; overridable per employee)
  hra?: number // editable
  otherAllowances?: number // editable
  lwf?: number // editable deduction
  pfConfig: PfConfig
  esiApplicable: boolean
  overtimeEarnings?: number // double-wage / OT added on top
  esiThreshold?: number
  esiEmployeePct?: number
}

export type SalaryBreakdown = {
  basic: number
  da: number
  hra: number
  otherAllowances: number
  pf: number
  esi: number
  lwf: number
  overtimeEarnings: number
  grossWages: number
  totalDeductions: number
  netSalary: number
}

export function computeSalaryBreakdown(input: SalaryBreakdownInput): SalaryBreakdown {
  const overtimeEarnings = round2(input.overtimeEarnings ?? 0)
  const hra = round2(input.hra ?? 0)
  const otherAllowances = round2(input.otherAllowances ?? 0)
  const lwf = round2(input.lwf ?? 0)

  // DA capped at total; Basic takes the remainder after DA, HRA and Other.
  const da = round2(Math.min(input.daRate, input.totalSalary))
  const basic = round2(Math.max(0, input.totalSalary - da - hra - otherAllowances))

  const pfWage = basic + da
  const pf = calculatePf(input.pfConfig, pfWage)

  const grossWages = round2(input.totalSalary + overtimeEarnings)

  const threshold = input.esiThreshold ?? ESI_DEFAULT_THRESHOLD
  const esiPct = input.esiEmployeePct ?? ESI_EMPLOYEE_PCT
  const esi =
    input.esiApplicable && grossWages <= threshold
      ? round2(grossWages * (esiPct / 100))
      : 0

  const totalDeductions = round2(pf + esi + lwf)
  const netSalary = round2(grossWages - totalDeductions)

  return { basic, da, hra, otherAllowances, pf, esi, lwf, overtimeEarnings, grossWages, totalDeductions, netSalary }
}
