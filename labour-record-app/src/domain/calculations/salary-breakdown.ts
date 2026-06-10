import { calculatePf, type PfConfig } from './pf-calculator'

export const ESI_DEFAULT_THRESHOLD = 21000
export const ESI_EMPLOYEE_PCT = 0.75

export type SalaryBreakdownInput = {
  totalSalary: number // the default monthly gross target (Basic + DA)
  daRate: number // fixed DA from firm type (da-rates)
  pfConfig: PfConfig
  esiApplicable: boolean
  overtimeEarnings?: number // double-wage / OT added on top
  esiThreshold?: number
  esiEmployeePct?: number
}

export type SalaryBreakdown = {
  basic: number
  da: number
  pf: number
  esi: number
  overtimeEarnings: number
  grossWages: number
  totalDeductions: number
  netSalary: number
}

export function computeSalaryBreakdown(input: SalaryBreakdownInput): SalaryBreakdown {
  const overtimeEarnings = round2(input.overtimeEarnings ?? 0)

  const da = round2(Math.min(input.daRate, input.totalSalary))
  const basic = round2(input.totalSalary - da)

  const pfWage = basic + da
  const pf = calculatePf(input.pfConfig, pfWage)

  const grossWages = round2(input.totalSalary + overtimeEarnings)

  const threshold = input.esiThreshold ?? ESI_DEFAULT_THRESHOLD
  const esiPct = input.esiEmployeePct ?? ESI_EMPLOYEE_PCT
  const esi =
    input.esiApplicable && grossWages <= threshold
      ? round2(grossWages * (esiPct / 100))
      : 0

  const totalDeductions = round2(pf + esi)
  const netSalary = round2(grossWages - totalDeductions)

  return { basic, da, pf, esi, overtimeEarnings, grossWages, totalDeductions, netSalary }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
