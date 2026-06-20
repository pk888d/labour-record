import { describe, expect, it } from 'vitest'
import {
  validateNonNegativeNumbers,
  validateWageRecords,
  validatePresentMoneyFields,
  FINE_MONEY_FIELDS,
  DEDUCTION_MONEY_FIELDS,
} from './record-numbers'

describe('validateNonNegativeNumbers', () => {
  const fields = [{ key: 'basic', label: 'Basic' }, { key: 'days', label: 'Days', max: 31 }]

  it('passes for finite non-negative numbers within max', () => {
    expect(validateNonNegativeNumbers({ basic: 100, days: 26 }, fields, 'Row 1')).toEqual([])
  })

  it('rejects non-numbers (string, NaN, missing)', () => {
    expect(validateNonNegativeNumbers({ basic: '100', days: 26 }, fields, 'Row 1'))
      .toContain('Row 1: Basic must be a number')
    expect(validateNonNegativeNumbers({ basic: NaN, days: 26 }, fields, 'Row 1'))
      .toContain('Row 1: Basic must be a number')
    expect(validateNonNegativeNumbers({ days: 26 }, fields, 'Row 1'))
      .toContain('Row 1: Basic must be a number')
  })

  it('rejects negatives', () => {
    expect(validateNonNegativeNumbers({ basic: -5, days: 26 }, fields, 'Row 1'))
      .toContain('Row 1: Basic cannot be negative')
  })

  it('rejects values above max', () => {
    expect(validateNonNegativeNumbers({ basic: 100, days: 40 }, fields, 'Row 1'))
      .toContain('Row 1: Days cannot exceed 31')
  })
})

describe('validateWageRecords', () => {
  const ok = {
    employeeId: 'e1', daysWorked: 26, basic: 10000, da: 5000, hra: 0, otherAllowances: 0,
    pf: 1800, esi: 0, lwf: 10, advanceRecovered: 0, fineDeduction: 0, otherDeductions: 0,
  }

  it('accepts a fully valid record', () => {
    expect(validateWageRecords([ok])).toEqual([])
  })

  it('flags a missing employeeId and a bad number, with row numbers', () => {
    const errs = validateWageRecords([ok, { ...ok, employeeId: '', basic: -1 }])
    expect(errs).toContain('Row 2: employeeId is required')
    expect(errs).toContain('Row 2: Basic cannot be negative')
  })

  it('rejects NaN net-pay inputs that would corrupt a register', () => {
    expect(validateWageRecords([{ ...ok, pf: NaN }])).toContain('Row 1: PF must be a number')
  })
})

describe('validatePresentMoneyFields (single-record fine/deduction routes)', () => {
  it('passes when present fields are valid and ignores omitted ones', () => {
    expect(validatePresentMoneyFields({ fineAmount: 50 }, FINE_MONEY_FIELDS)).toEqual([])
    expect(validatePresentMoneyFields({}, FINE_MONEY_FIELDS)).toEqual([]) // all default to 0
  })

  it('flags a supplied negative or NaN money field', () => {
    expect(validatePresentMoneyFields({ fineAmount: -1 }, FINE_MONEY_FIELDS))
      .toContain('Record: Fine amount cannot be negative')
    expect(validatePresentMoneyFields({ deductionAmount: NaN }, DEDUCTION_MONEY_FIELDS))
      .toContain('Record: Deduction amount must be a number')
  })
})
