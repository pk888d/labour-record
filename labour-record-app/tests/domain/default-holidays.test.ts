import { describe, it, expect } from 'vitest'
import {
  getDefaultHolidaysForYear,
  FIXED_HOLIDAYS,
} from '@/domain/holidays/default-holidays'

describe('getDefaultHolidaysForYear', () => {
  it('includes the national fixed holidays for any year', () => {
    const h = getDefaultHolidaysForYear(2026)
    const names = h.map((x) => x.name)
    expect(names).toContain('Republic Day')
    expect(names).toContain('May Day')
    expect(names).toContain('Independence Day')
    expect(names).toContain('Gandhi Jayanti')
  })

  it('fixed holidays roll forward automatically to future years', () => {
    const h2030 = getDefaultHolidaysForYear(2030)
    const republic = h2030.find((x) => x.name === 'Republic Day')
    expect(republic).toBeDefined()
    expect(republic!.month).toBe(1)
    expect(republic!.day).toBe(26)
    expect(republic!.year).toBe(2030)
  })

  it('national holidays are flagged as double-wage', () => {
    const h = getDefaultHolidaysForYear(2026)
    const republic = h.find((x) => x.name === 'Republic Day')
    expect(republic!.doubleWage).toBe(true)
  })

  it('returns ISO-style date components matching the requested year', () => {
    const h = getDefaultHolidaysForYear(2027)
    for (const x of h) {
      expect(x.year).toBe(2027)
      expect(x.month).toBeGreaterThanOrEqual(1)
      expect(x.month).toBeLessThanOrEqual(12)
      expect(x.day).toBeGreaterThanOrEqual(1)
      expect(x.day).toBeLessThanOrEqual(31)
    }
  })

  it('has no duplicate dates within a year', () => {
    const h = getDefaultHolidaysForYear(2026)
    const keys = h.map((x) => `${x.month}-${x.day}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('FIXED_HOLIDAYS', () => {
  it('every fixed holiday has month, day and name', () => {
    for (const f of FIXED_HOLIDAYS) {
      expect(f.month).toBeGreaterThanOrEqual(1)
      expect(f.day).toBeGreaterThanOrEqual(1)
      expect(f.name.length).toBeGreaterThan(0)
    }
  })
})
