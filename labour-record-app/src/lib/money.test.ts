import { describe, expect, it } from 'vitest'
import { round2, formatINR } from './money'

describe('round2', () => {
  it('rounds to 2 decimals half-up', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(1.004)).toBe(1.0)
    expect(round2(2.345)).toBe(2.35)
  })

  it('leaves clean values unchanged', () => {
    expect(round2(1800)).toBe(1800)
    expect(round2(0)).toBe(0)
  })

  it('handles repeating decimals', () => {
    expect(round2(10 / 3)).toBe(3.33)
  })

  it('guards against NaN / Infinity (returns 0)', () => {
    expect(round2(NaN)).toBe(0)
    expect(round2(Infinity)).toBe(0)
    expect(round2(-Infinity)).toBe(0)
  })
})

describe('formatINR', () => {
  it('formats as INR with 2 decimals', () => {
    const s = formatINR(1234.5)
    expect(s).toContain('1,234.50')
    expect(s).toContain('₹')
  })
  it('renders 0 for non-finite input', () => {
    expect(formatINR(NaN)).toContain('0.00')
  })
})
