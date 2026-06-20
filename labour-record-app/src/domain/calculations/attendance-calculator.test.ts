import { describe, expect, it } from 'vitest'
import {
  calculateAttendanceTotals,
  computeWeeklyOffDays,
  applyAttendanceDefaults,
} from './attendance-calculator'

describe('calculateAttendanceTotals', () => {
  it('counts P/OT as worked, L as leave, A as absent; wageDays = worked + leave', () => {
    const t = calculateAttendanceTotals(['P', 'P', 'OT', 'L', 'A', 'H', ''])
    expect(t.daysWorked).toBe(3)
    expect(t.leaveDays).toBe(1)
    expect(t.absentDays).toBe(1)
    expect(t.wageDays).toBe(4)
  })

  it('returns zeros for an empty month', () => {
    expect(calculateAttendanceTotals([])).toEqual({
      daysWorked: 0, leaveDays: 0, absentDays: 0, wageDays: 0,
    })
  })
})

describe('computeWeeklyOffDays', () => {
  it('gives one off-day for a 6-day week, staggered by employee+week index', () => {
    expect([...computeWeeklyOffDays(6, 0, 0)]).toEqual([0])
    expect([...computeWeeklyOffDays(6, 1, 0)]).toEqual([1])
    expect([...computeWeeklyOffDays(6, 6, 1)]).toEqual([0]) // wraps mod 7
  })

  it('gives two off-days for a 5-day week', () => {
    expect([...computeWeeklyOffDays(5, 0, 0)].sort()).toEqual([0, 1])
  })

  it('gives no off-days for a 7-day week', () => {
    expect(computeWeeklyOffDays(7, 0, 0).size).toBe(0)
  })
})

describe('applyAttendanceDefaults', () => {
  it('preserves existing marks, sets Sunday off, and converts holidays to H', () => {
    // Dec 2024: the 1st is a Sunday → with a 6-day week day 1 (index 0) becomes H.
    // holidayDays is 1-based day numbers; day 4 (index 3) is a holiday.
    const marks = applyAttendanceDefaults(['', '', 'A', ''], 2024, 12, new Set([4]), 6)
    expect(marks[0]).toBe('H') // day 1, Sunday weekly off
    expect(marks[1]).toBe('P') // day 2, Monday, worked
    expect(marks[2]).toBe('A') // day 3, explicit mark preserved
    expect(marks[3]).toBe('H') // day 4, government holiday
  })

  it('marks government holidays as H regardless of weekday', () => {
    const marks = applyAttendanceDefaults(['', '', '', ''], 2024, 12, new Set([2]), 6)
    expect(marks[1]).toBe('H') // day 2 is a holiday
  })
})
