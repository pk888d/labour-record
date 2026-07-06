// Guards for client-submitted numeric record fields (wages, overtime, fines,
// deductions). The form-task routes previously cast the body and used the numbers
// directly — a negative, NaN, string, or absurd value would corrupt a register and
// produce wrong net pay. These validators are pure so they can be unit-tested and
// reused by every financial route.

import { round2 } from '@/lib/money'

export type NumericFieldSpec = { key: string; label: string; max?: number }

// Every listed field must be a finite, non-negative number (and <= max if given).
export function validateNonNegativeNumbers(
  record: Record<string, unknown>,
  fields: NumericFieldSpec[],
  rowRef: string,
): string[] {
  const errors: string[] = []
  for (const f of fields) {
    const v = record[f.key]
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      errors.push(`${rowRef}: ${f.label} must be a number`)
    } else if (v < 0) {
      errors.push(`${rowRef}: ${f.label} cannot be negative`)
    } else if (f.max !== undefined && v > f.max) {
      errors.push(`${rowRef}: ${f.label} cannot exceed ${f.max}`)
    }
  }
  return errors
}

function requireEmployeeId(record: Record<string, unknown>, rowRef: string): string[] {
  return typeof record.employeeId === 'string' && record.employeeId.trim()
    ? []
    : [`${rowRef}: employeeId is required`]
}

// otherAllowances is validated separately by validateOtherAllowances() below —
// it accepts either a plain number (current form-entry shape) or an array of
// numbers (the shape actually persisted in the DB), so it can't reuse the
// plain-number check the other WAGE_FIELDS share.
const WAGE_FIELDS: NumericFieldSpec[] = [
  { key: 'daysWorked', label: 'Days worked', max: 31 },
  { key: 'basic', label: 'Basic' },
  { key: 'da', label: 'DA' },
  { key: 'hra', label: 'HRA' },
  { key: 'pf', label: 'PF' },
  { key: 'esi', label: 'ESI' },
  { key: 'lwf', label: 'LWF' },
  { key: 'advanceRecovered', label: 'Advance recovered' },
  { key: 'fineDeduction', label: 'Fine deduction' },
  { key: 'otherDeductions', label: 'Other deductions' },
]

// WageRecord.otherAllowances is stored as a JSON-serialized array of numbers
// (see the wages PUT route), but the form-entry client currently only ever
// sends a single plain number per row. This validator accepts both shapes and
// always returns a normalized number[] ready to JSON.stringify() and persist.
//
// On 2026-06-10 a corrupt value — `["[]"]`, a stringified empty array nested
// INSIDE the allowances array — was written and crashed statutory form
// rendering downstream. That specific shape (a non-numeric string element
// inside the array) is rejected here as a per-element error.
//
// `normalized` always contains the valid numeric entries found, even when
// `errors` is non-empty — callers that must reject on any error (the wages
// route) check `errors.length` themselves; callers that want a best-effort
// cleanup of legacy corrupt data (the read path, the one-off fix script) can
// use `normalized` directly to drop the junk and keep the good values.
export function validateOtherAllowances(
  value: unknown,
  rowRef?: string,
): { errors: string[]; normalized: number[] } {
  const label = 'Other allowances'
  const prefix = (msg: string) => (rowRef ? `${rowRef}: ${msg}` : msg)

  if (value === undefined || value === null) return { errors: [], normalized: [] }

  const items = Array.isArray(value) ? value : [value]
  const errors: string[] = []
  const normalized: number[] = []

  for (const item of items) {
    if (typeof item === 'object' && item !== null) {
      // Catches nested arrays (e.g. [[1, 2]]) and plain objects — never valid.
      errors.push(prefix(`${label} must be a number`))
      continue
    }

    let n: number
    if (typeof item === 'number') {
      n = item
    } else if (typeof item === 'string' && item.trim() !== '') {
      n = Number(item.trim())
    } else {
      n = NaN
    }

    if (!Number.isFinite(n)) {
      // Catches NaN, Infinity, and non-numeric strings — including the
      // historical corruption shape "[]" (Number('[]') is NaN).
      errors.push(prefix(`${label} must be a number`))
    } else if (n < 0) {
      errors.push(prefix(`${label} cannot be negative`))
    } else {
      normalized.push(round2(n))
    }
  }

  return { errors, normalized }
}

export function validateWageRecords(records: unknown[]): string[] {
  const errors: string[] = []
  records.forEach((rec, i) => {
    const r = (rec ?? {}) as Record<string, unknown>
    const rowRef = `Row ${i + 1}`
    errors.push(...requireEmployeeId(r, rowRef))
    errors.push(...validateNonNegativeNumbers(r, WAGE_FIELDS, rowRef))
  })
  return errors
}

// Single-record money fields for the fine and deduction POST routes. The route
// passes the parsed body straight in; employeeId is already checked separately there.
export const FINE_MONEY_FIELDS: NumericFieldSpec[] = [
  { key: 'wagesOnDate', label: 'Wages on date' },
  { key: 'fineAmount', label: 'Fine amount' },
  { key: 'recovered', label: 'Recovered' },
  { key: 'pendingRecovery', label: 'Pending recovery' },
]

export const DEDUCTION_MONEY_FIELDS: NumericFieldSpec[] = [
  { key: 'damageAmount', label: 'Damage amount' },
  { key: 'deductionAmount', label: 'Deduction amount' },
  { key: 'recovered', label: 'Recovered' },
  { key: 'pendingRecovery', label: 'Pending recovery' },
]

// Validate only the numeric fields that are actually present (the route fields
// are optional and default to 0 when omitted, so a missing field is fine — but a
// supplied negative/NaN value is not).
export function validatePresentMoneyFields(
  record: Record<string, unknown>,
  fields: NumericFieldSpec[],
): string[] {
  const present = fields.filter((f) => record[f.key] !== undefined && record[f.key] !== null)
  return validateNonNegativeNumbers(record, present, 'Record')
}
