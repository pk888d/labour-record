import { describe, it, expect } from 'vitest'
import { validateNewCycle } from '@/domain/validations/cycle'

describe('validateNewCycle', () => {
  const base = { establishmentId: 'est_123', month: 4, year: 2026 }

  it('passes a valid input', () => {
    expect(validateNewCycle(base)).toEqual([])
  })

  it('passes with wagePeriodDays', () => {
    expect(validateNewCycle({ ...base, wagePeriodDays: 26 })).toEqual([])
  })

  it('requires establishmentId', () => {
    expect(validateNewCycle({ ...base, establishmentId: '' }))
      .toContain('establishmentId is required')
  })

  it('rejects month 0', () => {
    expect(validateNewCycle({ ...base, month: 0 }))
      .toContain('month must be between 1 and 12')
  })

  it('rejects month 13', () => {
    expect(validateNewCycle({ ...base, month: 13 }))
      .toContain('month must be between 1 and 12')
  })

  it('rejects year 1999', () => {
    expect(validateNewCycle({ ...base, year: 1999 }).join())
      .toMatch(/year must be between 2000 and \d{4}/)
  })

  it('rejects an implausible far-future year (2099)', () => {
    expect(validateNewCycle({ ...base, year: 2099 }).join())
      .toMatch(/year must be between 2000 and \d{4}/)
  })

  it('accepts next year', () => {
    const nextYear = new Date().getFullYear() + 1
    expect(validateNewCycle({ ...base, year: nextYear })).toEqual([])
  })

  it('rejects wagePeriodDays 0', () => {
    expect(validateNewCycle({ ...base, wagePeriodDays: 0 }))
      .toContain('wagePeriodDays must be an integer between 1 and 31')
  })

  it('rejects wagePeriodDays 32', () => {
    expect(validateNewCycle({ ...base, wagePeriodDays: 32 }))
      .toContain('wagePeriodDays must be an integer between 1 and 31')
  })
})
