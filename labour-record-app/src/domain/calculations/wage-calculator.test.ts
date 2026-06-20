import { describe, expect, it } from 'vitest'
import { calculateWages, type WageInput } from './wage-calculator'
import type { WageFormulaConfig } from '@/types'

const zeroInput: WageInput = {
  basic: 0, da: 0, hra: 0, otherAllowances: 0, holidayBonus: 0, overtimeEarnings: 0,
  pf: 0, esi: 0, lwf: 0, advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0,
}

describe('calculateWages — hospital preset', () => {
  const config: WageFormulaConfig = { preset: 'TN_MINIMUM_WAGES_HOSPITAL', fixedAllowance: 360 } as WageFormulaConfig

  it('uses Basic+DA+fixedAllowance for earnings and nets out deductions', () => {
    const r = calculateWages(config, {
      ...zeroInput, basic: 10000, da: 5000, pf: 1800, lwf: 10,
    })
    expect(r.totalNormalWages).toBe(15000)
    expect(r.totalEarnings).toBe(15360) // basic + da + fixed(360)
    expect(r.grossWages).toBe(15360)
    expect(r.totalDeductions).toBe(1810)
    expect(r.netWages).toBe(13550)
  })

  it('adds holiday bonus and overtime into gross', () => {
    const r = calculateWages(config, {
      ...zeroInput, basic: 10000, da: 5000, holidayBonus: 500, overtimeEarnings: 1000,
    })
    expect(r.totalEarnings).toBe(15860) // + 360 fixed + 500 bonus
    expect(r.grossWages).toBe(16860) // + 1000 OT
  })
})

describe('calculateWages — shop preset', () => {
  const config: WageFormulaConfig = { preset: 'TN_SHOPS_ESTABLISHMENTS' } as WageFormulaConfig

  it('uses Basic+DA+HRA+Other for earnings (no fixed allowance)', () => {
    const r = calculateWages(config, {
      ...zeroInput, basic: 10000, da: 7353, hra: 500, otherAllowances: 200,
    })
    expect(r.totalNormalWages).toBe(17353)
    expect(r.totalEarnings).toBe(18053)
    expect(r.grossWages).toBe(18053)
  })

  it('sums all deduction components', () => {
    const r = calculateWages(config, {
      ...zeroInput, basic: 10000, da: 7353,
      pf: 1800, esi: 130, lwf: 10, advanceRecovered: 500, fineDeduction: 50, otherDeductions: 100,
    })
    expect(r.totalDeductions).toBe(2590)
    expect(r.netWages).toBe(17353 - 2590)
  })
})
