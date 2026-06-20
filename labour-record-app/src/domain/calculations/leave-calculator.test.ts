import { describe, expect, it } from 'vitest'
import { calculateEarnedLeaveClosing } from './leave-calculator'

describe('calculateEarnedLeaveClosing', () => {
  it('closing = opening + earned - availed', () => {
    expect(calculateEarnedLeaveClosing(10, 2, 5)).toBe(7)
  })
  it('never goes negative', () => {
    expect(calculateEarnedLeaveClosing(10, 1, 15)).toBe(0)
  })
  it('handles a fresh balance', () => {
    expect(calculateEarnedLeaveClosing(0, 1.5, 0)).toBe(1.5)
  })
})
