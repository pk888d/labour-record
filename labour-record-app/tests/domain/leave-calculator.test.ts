import { describe, it, expect } from 'vitest'
import { calculateEarnedLeaveClosing } from '@/domain/calculations/leave-calculator'

describe('calculateEarnedLeaveClosing', () => {
  it('closing = opening + during - availed', () => {
    expect(calculateEarnedLeaveClosing(10, 2, 5)).toBe(7)
  })

  it('closing is zero when availed exceeds accrued', () => {
    expect(calculateEarnedLeaveClosing(5, 0, 8)).toBe(0)
  })

  it('closing is zero when all leave is used', () => {
    expect(calculateEarnedLeaveClosing(10, 2, 12)).toBe(0)
  })

  it('opening only — no during or availed', () => {
    expect(calculateEarnedLeaveClosing(15, 0, 0)).toBe(15)
  })
})
