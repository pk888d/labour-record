import { describe, expect, it } from 'vitest'
import {
  validateNonNegativeNumbers,
  validateWageRecords,
  validatePresentMoneyFields,
  validateOtherAllowances,
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

describe('validateOtherAllowances', () => {
  it('treats undefined/null/empty array as no allowances', () => {
    expect(validateOtherAllowances(undefined)).toEqual({ errors: [], normalized: [] })
    expect(validateOtherAllowances(null)).toEqual({ errors: [], normalized: [] })
    expect(validateOtherAllowances([])).toEqual({ errors: [], normalized: [] })
  })

  it('accepts a plain scalar number (current form-entry shape) and wraps it', () => {
    expect(validateOtherAllowances(0)).toEqual({ errors: [], normalized: [0] })
    expect(validateOtherAllowances(150)).toEqual({ errors: [], normalized: [150] })
  })

  it('accepts an array of finite numbers and rounds to 2dp', () => {
    expect(validateOtherAllowances([100, 50.555])).toEqual({ errors: [], normalized: [100, 50.56] })
  })

  it('accepts numeric strings like "150"', () => {
    expect(validateOtherAllowances(['150', '20.5'])).toEqual({ errors: [], normalized: [150, 20.5] })
  })

  it('rejects the historical corruption shape ["[]"] (stringified empty array inside an array)', () => {
    const result = validateOtherAllowances(['[]'], 'Row 1')
    expect(result.errors).toContain('Row 1: Other allowances must be a number')
  })

  it('rejects a bare "[]" string scalar', () => {
    const result = validateOtherAllowances('[]', 'Row 1')
    expect(result.errors).toContain('Row 1: Other allowances must be a number')
  })

  it('rejects nested arrays', () => {
    const result = validateOtherAllowances([[1, 2]], 'Row 1')
    expect(result.errors).toContain('Row 1: Other allowances must be a number')
  })

  it('rejects objects', () => {
    const result = validateOtherAllowances([{ amount: 5 }], 'Row 1')
    expect(result.errors).toContain('Row 1: Other allowances must be a number')
  })

  it('rejects NaN/Infinity', () => {
    expect(validateOtherAllowances([NaN], 'Row 1').errors).toContain('Row 1: Other allowances must be a number')
    expect(validateOtherAllowances([Infinity], 'Row 1').errors).toContain('Row 1: Other allowances must be a number')
  })

  it('rejects negative allowances, like other money fields', () => {
    expect(validateOtherAllowances(-1, 'Row 1').errors).toContain('Row 1: Other allowances cannot be negative')
    expect(validateOtherAllowances([10, -5], 'Row 1').errors).toContain('Row 1: Other allowances cannot be negative')
  })

  it('still normalizes the valid entries alongside errors (best-effort, for read-path/cleanup reuse)', () => {
    const result = validateOtherAllowances([100, '[]', 50], 'Row 1')
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.normalized).toEqual([100, 50])
  })

  it('omits the row prefix when rowRef is not given', () => {
    expect(validateOtherAllowances('[]').errors).toContain('Other allowances must be a number')
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
