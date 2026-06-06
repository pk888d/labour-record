import type { WageFormulaConfig } from '@/types'

export type WageInput = {
  basic: number
  da: number
  hra: number
  otherAllowances: number
  holidayBonus: number
  overtimeEarnings: number
  pf: number
  esi: number
  lwf: number
  advanceRecovered: number
  fineDeduction: number
  otherDeductions: number
}

export type WageCalcResult = {
  totalNormalWages: number
  totalEarnings: number
  grossWages: number
  totalDeductions: number
  netWages: number
}

export function calculateWages(config: WageFormulaConfig, input: WageInput): WageCalcResult {
  let totalNormalWages: number
  let totalEarnings: number
  let grossWages: number

  if (config.preset === 'TN_MINIMUM_WAGES_HOSPITAL') {
    const fixed = config.fixedAllowance ?? 0
    totalNormalWages = round2(input.basic + input.da)
    totalEarnings = round2(input.basic + input.da + fixed + input.holidayBonus)
    grossWages = round2(totalEarnings + input.overtimeEarnings)
  } else {
    totalNormalWages = round2(input.basic + input.da)
    totalEarnings = round2(input.basic + input.da + input.hra + input.otherAllowances + input.holidayBonus)
    grossWages = round2(totalEarnings + input.overtimeEarnings)
  }

  const totalDeductions = round2(
    input.pf + input.esi + input.lwf +
    input.advanceRecovered + input.fineDeduction + input.otherDeductions
  )

  return {
    totalNormalWages,
    totalEarnings,
    grossWages,
    totalDeductions,
    netWages: round2(grossWages - totalDeductions),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
