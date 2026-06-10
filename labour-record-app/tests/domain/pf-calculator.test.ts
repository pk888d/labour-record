import { describe, it, expect } from 'vitest'
import {
  calculatePf,
  PF_DEFAULT_PERCENT,
  PF_DEFAULT_CEILING,
  PF_STATUTORY_CAP,
} from '@/domain/calculations/pf-calculator'

describe('calculatePf — PERCENT mode', () => {
  it('computes percent of pf wage', () => {
    expect(calculatePf({ mode: 'PERCENT', percent: 12 }, 10000)).toBe(1200)
  })
  it('caps the pf wage at the ceiling (15000 -> 1800 default)', () => {
    expect(calculatePf({ mode: 'PERCENT', percent: 12, ceiling: 15000 }, 50000)).toBe(1800)
  })
  it('uses 12% default percent when not supplied', () => {
    expect(calculatePf({ mode: 'PERCENT' }, 10000)).toBe(1200)
  })
  it('rounds to 2 decimals', () => {
    expect(calculatePf({ mode: 'PERCENT', percent: 12 }, 6001)).toBe(720.12)
  })
})

describe('calculatePf — FIXED mode', () => {
  it('returns the fixed amount regardless of wage', () => {
    expect(calculatePf({ mode: 'FIXED', fixedAmount: 1800 }, 50000)).toBe(1800)
  })
  it('returns 0 when no fixed amount set', () => {
    expect(calculatePf({ mode: 'FIXED' }, 10000)).toBe(0)
  })
})

describe('calculatePf — NONE mode', () => {
  it('returns 0', () => {
    expect(calculatePf({ mode: 'NONE' }, 10000)).toBe(0)
  })
})

describe('PF defaults', () => {
  it('default percent is 12', () => {
    expect(PF_DEFAULT_PERCENT).toBe(12)
  })
  it('default ceiling is 15000', () => {
    expect(PF_DEFAULT_CEILING).toBe(15000)
  })
  it('statutory cap equals 12% of 15000 = 1800', () => {
    expect(PF_STATUTORY_CAP).toBe(1800)
  })
})
