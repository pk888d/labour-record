import { describe, expect, it } from 'vitest'
import { calculateOvertimeTotals } from './overtime-calculator'

describe('calculateOvertimeTotals', () => {
  it('sums OT hours, clamps negatives, and computes earnings', () => {
    const r = calculateOvertimeTotals([2, 3, -1, 0], 10000, 100)
    expect(r.totalOtHours).toBe(5) // negative clamped to 0
    expect(r.otEarnings).toBe(500)
    expect(r.totalEarnings).toBe(10500)
  })

  it('handles a month with no overtime', () => {
    const r = calculateOvertimeTotals([], 8000, 120)
    expect(r.totalOtHours).toBe(0)
    expect(r.otEarnings).toBe(0)
    expect(r.totalEarnings).toBe(8000)
  })

  it('rounds fractional earnings to paise', () => {
    const r = calculateOvertimeTotals([1.5], 0, 33.33)
    expect(r.otEarnings).toBe(50) // 1.5 * 33.33 = 49.995 → 50.00
  })
})
