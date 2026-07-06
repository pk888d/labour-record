// Guards for client-submitted date fields (dob, dateOfEntry, exitDate, holiday
// date, calendar event date, offence/damage/payment dates, etc). Routes were
// doing `new Date(b.someDate)` and persisting whatever came out — including
// Invalid Date (which Prisma happily writes to SQLite) for garbage input, and
// silently-rolled-over dates like "2026-02-30" -> March 2 for calendar-invalid
// input. These validators are pure so they can be unit-tested and reused by
// every route that accepts a date from the request body or query string.

import { describe, expect, it } from 'vitest'
import { parseDateInput, validateDateFields } from './dates'

describe('parseDateInput', () => {
  it('accepts a valid full ISO datetime string', () => {
    const { date, error } = parseDateInput('2026-07-05T10:30:00.000Z', 'date')
    expect(error).toBeUndefined()
    expect(date).toBeInstanceOf(Date)
    expect(date!.toISOString()).toBe('2026-07-05T10:30:00.000Z')
  })

  it('accepts a valid YYYY-MM-DD date-only string', () => {
    const { date, error } = parseDateInput('2026-07-05', 'date')
    expect(error).toBeUndefined()
    expect(date).toBeInstanceOf(Date)
    expect(date!.getUTCFullYear()).toBe(2026)
    expect(date!.getUTCMonth()).toBe(6) // 0-indexed July
    expect(date!.getUTCDate()).toBe(5)
  })

  it('treats empty string, null, and undefined as "no date" (optional fields stay optional)', () => {
    expect(parseDateInput('', 'dob')).toEqual({ date: null })
    expect(parseDateInput(null, 'dob')).toEqual({ date: null })
    expect(parseDateInput(undefined, 'dob')).toEqual({ date: null })
  })

  it('rejects an unparseable string', () => {
    const { date, error } = parseDateInput('banana', 'date')
    expect(date).toBeNull()
    expect(error).toBe('date is not a valid date')
  })

  it('rejects an out-of-range calendar string that Date() also can\'t parse', () => {
    const { date, error } = parseDateInput('2026-13-45', 'date')
    expect(date).toBeNull()
    expect(error).toBe('date is not a valid date')
  })

  it('rejects "2026-02-30" instead of silently rolling over to March 2 (JS Date pitfall)', () => {
    const { date, error } = parseDateInput('2026-02-30', 'date')
    expect(date).toBeNull()
    expect(error).toBe('date is not a valid date')
  })

  it('rejects "2026-04-31" (April has 30 days) via the same round-trip check', () => {
    const { date, error } = parseDateInput('2026-04-31', 'date')
    expect(date).toBeNull()
    expect(error).toBe('date is not a valid date')
  })

  it('rejects a plain number (even though Date() would accept it as an epoch)', () => {
    const { date, error } = parseDateInput(1700000000000, 'date')
    expect(date).toBeNull()
    expect(error).toBe('date is not a valid date')
  })

  it('rejects an object', () => {
    const { date, error } = parseDateInput({ year: 2026 }, 'date')
    expect(date).toBeNull()
    expect(error).toBe('date is not a valid date')
  })

  it('rejects a boolean', () => {
    const { date, error } = parseDateInput(true, 'date')
    expect(date).toBeNull()
    expect(error).toBe('date is not a valid date')
  })

  it('rejects a whitespace-only string as empty (no error, optional stays optional)', () => {
    expect(parseDateInput('   ', 'dob')).toEqual({ date: null })
  })

  it('uses the given field name in the error message', () => {
    const { error } = parseDateInput('garbage', 'exitDate')
    expect(error).toBe('exitDate is not a valid date')
  })
})

describe('validateDateFields', () => {
  it('returns no errors when all listed fields are valid or absent', () => {
    const body = { dob: '1990-01-01', dateOfEntry: undefined, exitDate: '' }
    expect(validateDateFields(body, ['dob', 'dateOfEntry', 'exitDate'])).toEqual([])
  })

  it('collects one error per invalid field', () => {
    const body = { dob: 'banana', dateOfEntry: '2026-02-30' }
    const errors = validateDateFields(body, ['dob', 'dateOfEntry'])
    expect(errors).toContain('dob is not a valid date')
    expect(errors).toContain('dateOfEntry is not a valid date')
    expect(errors).toHaveLength(2)
  })

  it('ignores fields not listed', () => {
    const body = { dob: 'banana', unrelated: 'banana' }
    expect(validateDateFields(body, ['dob'])).toEqual(['dob is not a valid date'])
  })

  it('prefixes errors with a row reference when given (mirrors record-numbers rowRef pattern)', () => {
    const body = { paymentDate: 'banana' }
    expect(validateDateFields(body, ['paymentDate'], 'Row 1')).toEqual([
      'Row 1: paymentDate is not a valid date',
    ])
  })
})
