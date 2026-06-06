import { describe, it, expect } from 'vitest'
import { calculateAttendanceTotals, applyAttendanceDefaults } from '@/domain/calculations/attendance-calculator'

describe('calculateAttendanceTotals', () => {
  it('counts P as daysWorked', () => {
    const r = calculateAttendanceTotals(['P', 'P', 'P'])
    expect(r.daysWorked).toBe(3)
    expect(r.wageDays).toBe(3)
    expect(r.leaveDays).toBe(0)
    expect(r.absentDays).toBe(0)
  })

  it('counts OT as daysWorked', () => {
    const r = calculateAttendanceTotals(['OT', 'OT'])
    expect(r.daysWorked).toBe(2)
    expect(r.wageDays).toBe(2)
  })

  it('counts H (holiday) as daysWorked', () => {
    const r = calculateAttendanceTotals(['H'])
    expect(r.daysWorked).toBe(1)
    expect(r.wageDays).toBe(1)
  })

  it('counts L as leaveDays (not daysWorked)', () => {
    const r = calculateAttendanceTotals(['L', 'L'])
    expect(r.daysWorked).toBe(0)
    expect(r.leaveDays).toBe(2)
    expect(r.wageDays).toBe(2)
  })

  it('counts A as absentDays — no wages', () => {
    const r = calculateAttendanceTotals(['A', 'A'])
    expect(r.absentDays).toBe(2)
    expect(r.wageDays).toBe(0)
  })

  it('ignores empty strings', () => {
    const r = calculateAttendanceTotals(['P', '', ''])
    expect(r.daysWorked).toBe(1)
    expect(r.absentDays).toBe(0)
  })

  it('wageDays = daysWorked + leaveDays (A does not contribute)', () => {
    const r = calculateAttendanceTotals(['P', 'P', 'L', 'A', 'H'])
    expect(r.daysWorked).toBe(3)
    expect(r.leaveDays).toBe(1)
    expect(r.absentDays).toBe(1)
    expect(r.wageDays).toBe(4)
  })

  it('handles empty array', () => {
    expect(calculateAttendanceTotals([])).toEqual({
      daysWorked: 0,
      leaveDays: 0,
      absentDays: 0,
      wageDays: 0,
    })
  })
})

describe('applyAttendanceDefaults', () => {
  // June 2026: day 1 = Monday, day 6 = Saturday, day 7 = Sunday
  it('fills empty weekdays with P', () => {
    const marks = new Array(30).fill('')
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set())
    expect(result[0]).toBe('P') // June 1 = Monday
    expect(result[1]).toBe('P') // June 2 = Tuesday
  })

  it('fills Saturday with P, Sunday with H (weekly holiday = paid)', () => {
    const marks = new Array(30).fill('')
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set())
    expect(result[5]).toBe('P') // June 6 = Saturday → working day
    expect(result[6]).toBe('H') // June 7 = Sunday → weekly holiday (paid)
  })

  it('fills holiday days with H regardless of day of week', () => {
    const marks = new Array(30).fill('')
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set([15]))
    expect(result[14]).toBe('H') // June 15
  })

  it('holiday wins over weekend when day is both', () => {
    // June 7, 2026 is a Sunday. Mark it as a holiday too.
    const marks = new Array(30).fill('')
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set([7]))
    expect(result[6]).toBe('H') // holiday takes priority over A
  })

  it('does not overwrite existing non-empty marks', () => {
    const marks = ['A', ...new Array(29).fill('')]
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set())
    expect(result[0]).toBe('A') // kept as-is, even though Monday = would be P
  })

  it('handles all-filled marks (no-op)', () => {
    const marks = new Array(30).fill('P')
    const result = applyAttendanceDefaults(marks, 2026, 6, new Set())
    expect(result).toEqual(marks)
  })
})
