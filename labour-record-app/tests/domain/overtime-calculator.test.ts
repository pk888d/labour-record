import { describe, it, expect } from 'vitest'
import { calculateOvertimeTotals } from '@/domain/calculations/overtime-calculator'

describe('calculateOvertimeTotals', () => {
  it('sums daily OT hours', () => {
    expect(calculateOvertimeTotals([2, 3, 0, 1.5], 0, 0).totalOtHours).toBe(6.5)
  })

  it('ignores negative values', () => {
    expect(calculateOvertimeTotals([-1, 2, 3], 0, 0).totalOtHours).toBe(5)
  })

  it('calculates otEarnings = totalOtHours × otRate', () => {
    expect(calculateOvertimeTotals([2, 3], 0, 100).otEarnings).toBe(500)
  })

  it('totalEarnings = normalEarnings + otEarnings', () => {
    expect(calculateOvertimeTotals([2], 1000, 100).totalEarnings).toBe(1200)
  })

  it('handles empty array', () => {
    expect(calculateOvertimeTotals([], 0, 100)).toEqual({
      totalOtHours: 0,
      otEarnings: 0,
      totalEarnings: 0,
    })
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateOvertimeTotals([0.005], 0, 1).otEarnings).toBe(0.01)
  })

  it('normalEarnings of zero keeps totalEarnings = otEarnings', () => {
    const r = calculateOvertimeTotals([4], 0, 50)
    expect(r.otEarnings).toBe(200)
    expect(r.totalEarnings).toBe(200)
  })
})
