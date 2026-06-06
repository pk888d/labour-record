import { describe, it, expect } from 'vitest'
import { calculateWages } from '@/domain/calculations/wage-calculator'
import { getWageRuleValue, WAGE_RULE_DEFAULTS } from '@/domain/calculations/wage-defaults'
import type { WageFormulaConfig } from '@/types'

const hospitalConfig: WageFormulaConfig = {
  preset: 'TN_MINIMUM_WAGES_HOSPITAL',
  fixedAllowance: 360,
}

const shopConfig: WageFormulaConfig = {
  preset: 'TN_SHOPS_ESTABLISHMENTS',
}

const baseInput = {
  basic: 5000,
  da: 1000,
  hra: 0,
  otherAllowances: 0,
  holidayBonus: 0,
  overtimeEarnings: 0,
  pf: 600,
  esi: 0,
  lwf: 10,
  advanceRecovered: 0,
  fineDeduction: 0,
  otherDeductions: 0,
}

describe('calculateWages — TN_MINIMUM_WAGES_HOSPITAL', () => {
  it('totalNormalWages = basic + da', () => {
    expect(calculateWages(hospitalConfig, baseInput).totalNormalWages).toBe(6000)
  })

  it('totalEarnings = basic + da + fixedAllowance', () => {
    expect(calculateWages(hospitalConfig, baseInput).totalEarnings).toBe(6360)
  })

  it('grossWages = totalEarnings + overtimeEarnings', () => {
    const r = calculateWages(hospitalConfig, { ...baseInput, overtimeEarnings: 500 })
    expect(r.grossWages).toBe(6860)
  })

  it('totalDeductions sums all deduction fields', () => {
    expect(calculateWages(hospitalConfig, baseInput).totalDeductions).toBe(610)
  })

  it('netWages = grossWages - totalDeductions', () => {
    expect(calculateWages(hospitalConfig, baseInput).netWages).toBe(5750)
  })

  it('uses zero fixedAllowance when not configured', () => {
    const r = calculateWages({ preset: 'TN_MINIMUM_WAGES_HOSPITAL' }, baseInput)
    expect(r.totalEarnings).toBe(6000)
  })
})

describe('calculateWages — TN_SHOPS_ESTABLISHMENTS', () => {
  it('totalEarnings includes hra + otherAllowances', () => {
    const r = calculateWages(shopConfig, { ...baseInput, hra: 800, otherAllowances: 200 })
    expect(r.totalEarnings).toBe(7000)
  })

  it('netWages calculated correctly for shop', () => {
    const r = calculateWages(shopConfig, { ...baseInput, hra: 1000 })
    expect(r.netWages).toBe(6390)
  })
})

describe('calculateWages — rounding', () => {
  it('rounds to 2 decimal places', () => {
    const r = calculateWages(hospitalConfig, { ...baseInput, basic: 5000.555, da: 1000 })
    expect(r.totalNormalWages).toBe(6000.56)
  })
})

describe('getWageRuleValue', () => {
  it('returns custom value when rule exists', () => {
    const rules = [{ ruleKey: 'HOLIDAY_MULTIPLIER', ruleValue: 1.5 }]
    expect(getWageRuleValue(rules, 'HOLIDAY_MULTIPLIER')).toBe(1.5)
  })
  it('returns default value when no custom rule', () => {
    expect(getWageRuleValue([], 'HOLIDAY_MULTIPLIER')).toBe(2.0)
  })
  it('returns 0 for unknown key with no default', () => {
    expect(getWageRuleValue([], 'UNKNOWN_KEY')).toBe(0)
  })
})

describe('calculateWages — holidayBonus', () => {
  it('includes holidayBonus in totalEarnings for hospital config', () => {
    const r = calculateWages(hospitalConfig, { ...baseInput, holidayBonus: 500 })
    expect(r.totalEarnings).toBe(6860) // 6000 + 360 fixedAllowance + 500 bonus
  })
  it('includes holidayBonus in totalEarnings for shop config', () => {
    const r = calculateWages(shopConfig, { ...baseInput, holidayBonus: 200 })
    expect(r.totalEarnings).toBe(6200) // 5000 + 1000 + 200
  })
  it('holidayBonus zero has no effect', () => {
    const r = calculateWages(hospitalConfig, { ...baseInput, holidayBonus: 0 })
    expect(r.totalEarnings).toBe(6360)
  })
})
