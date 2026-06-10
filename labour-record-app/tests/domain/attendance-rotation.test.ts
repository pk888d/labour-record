import { describe, it, expect } from 'vitest'
import {
  computeWeeklyOffDays,
  applyRotatingAttendanceDefaults,
} from '@/domain/calculations/attendance-calculator'

describe('computeWeeklyOffDays', () => {
  it('6-day week: first employee is off Sunday (dow 0)', () => {
    expect(computeWeeklyOffDays(6, 0, 0)).toEqual(new Set([0]))
  })
  it('6-day week: second employee is staggered to Monday (dow 1)', () => {
    expect(computeWeeklyOffDays(6, 1, 0)).toEqual(new Set([1]))
  })
  it('6-day week: off day rotates by week for the same employee', () => {
    expect(computeWeeklyOffDays(6, 0, 1)).toEqual(new Set([1]))
  })
  it('7-day week: no weekly off', () => {
    expect(computeWeeklyOffDays(7, 0, 0).size).toBe(0)
  })
  it('5-day week: two consecutive off days', () => {
    expect(computeWeeklyOffDays(5, 0, 0)).toEqual(new Set([0, 1]))
  })
  it('5-day week: staggered for third employee', () => {
    expect(computeWeeklyOffDays(5, 3, 0)).toEqual(new Set([3, 4]))
  })
  it('5-day week: wraps around the week', () => {
    expect(computeWeeklyOffDays(5, 6, 0)).toEqual(new Set([6, 0]))
  })
})

describe('applyRotatingAttendanceDefaults', () => {
  // June 2026: day 1 = Monday (dow 1), day 7 = Sunday (dow 0)
  it('first employee (offset 0) is off Sunday', () => {
    const marks = new Array(30).fill('')
    const r = applyRotatingAttendanceDefaults(marks, 2026, 6, new Set(), 6, 0)
    expect(r[6]).toBe('H') // June 7 Sunday → off
    expect(r[0]).toBe('P') // June 1 Monday → working
  })

  it('second employee (offset 1) is off Monday, works Sunday — firm not fully closed', () => {
    const marks = new Array(30).fill('')
    const r = applyRotatingAttendanceDefaults(marks, 2026, 6, new Set(), 6, 1)
    expect(r[0]).toBe('H') // June 1 Monday → off for employee 1
    expect(r[6]).toBe('P') // June 7 Sunday → working for employee 1
  })

  it('off day rotates week to week for the same employee', () => {
    const marks = new Array(30).fill('')
    const r = applyRotatingAttendanceDefaults(marks, 2026, 6, new Set(), 6, 0)
    // week 1 (days 8-14): off rotates to Monday → June 8 (dow 1) is H, June 14 (Sunday) is P
    expect(r[7]).toBe('H')  // June 8 Monday
    expect(r[13]).toBe('P') // June 14 Sunday
  })

  it('holiday always wins regardless of rotation', () => {
    const marks = new Array(30).fill('')
    const r = applyRotatingAttendanceDefaults(marks, 2026, 6, new Set([3]), 6, 0)
    expect(r[2]).toBe('H') // June 3 holiday
  })

  it('7-day week: no offs, all working except holidays', () => {
    const marks = new Array(30).fill('')
    const r = applyRotatingAttendanceDefaults(marks, 2026, 6, new Set(), 7, 0)
    expect(r[6]).toBe('P') // Sunday working
  })

  it('does not overwrite existing marks', () => {
    const marks = ['A', ...new Array(29).fill('')]
    const r = applyRotatingAttendanceDefaults(marks, 2026, 6, new Set(), 6, 0)
    expect(r[0]).toBe('A')
  })
})
