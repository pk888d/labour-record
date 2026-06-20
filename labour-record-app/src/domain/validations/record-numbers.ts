// Guards for client-submitted numeric record fields (wages, overtime, fines,
// deductions). The form-task routes previously cast the body and used the numbers
// directly — a negative, NaN, string, or absurd value would corrupt a register and
// produce wrong net pay. These validators are pure so they can be unit-tested and
// reused by every financial route.

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

const WAGE_FIELDS: NumericFieldSpec[] = [
  { key: 'daysWorked', label: 'Days worked', max: 31 },
  { key: 'basic', label: 'Basic' },
  { key: 'da', label: 'DA' },
  { key: 'hra', label: 'HRA' },
  { key: 'otherAllowances', label: 'Other allowances' },
  { key: 'pf', label: 'PF' },
  { key: 'esi', label: 'ESI' },
  { key: 'lwf', label: 'LWF' },
  { key: 'advanceRecovered', label: 'Advance recovered' },
  { key: 'fineDeduction', label: 'Fine deduction' },
  { key: 'otherDeductions', label: 'Other deductions' },
]

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
