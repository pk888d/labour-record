import { describe, expect, it } from 'vitest'
import { calculatePf, PF_STATUTORY_CAP } from './pf-calculator'

describe('calculatePf', () => {
  it('returns 0 when mode is NONE', () => {
    expect(calculatePf({ mode: 'NONE' }, 20000)).toBe(0)
  })

  it('returns the fixed amount when mode is FIXED', () => {
    expect(calculatePf({ mode: 'FIXED', fixedAmount: 500 }, 20000)).toBe(500)
    expect(calculatePf({ mode: 'FIXED' }, 20000)).toBe(0)
  })

  it('caps PERCENT at the wage ceiling (₹15,000 → ₹1,800)', () => {
    expect(calculatePf({ mode: 'PERCENT', percent: 12, ceiling: 15000 }, 20000)).toBe(1800)
    expect(PF_STATUTORY_CAP).toBe(1800)
  })

  it('computes PERCENT below the ceiling', () => {
    expect(calculatePf({ mode: 'PERCENT', percent: 12, ceiling: 15000 }, 10000)).toBe(1200)
  })

  it('uses no ceiling (Infinity) when none provided', () => {
    expect(calculatePf({ mode: 'PERCENT', percent: 12 }, 20000)).toBe(2400)
  })

  it('defaults percent to 12 when omitted', () => {
    expect(calculatePf({ mode: 'PERCENT', ceiling: 15000 }, 15000)).toBe(1800)
  })
})
