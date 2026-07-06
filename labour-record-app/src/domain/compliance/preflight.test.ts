import { describe, expect, it } from 'vitest'
import { runComplianceChecks, type PreflightEmployee, type PreflightInput } from './preflight'

// Convenience builder: a fully-compliant employee — every check should pass
// unless a test deliberately breaks a field.
function employee(overrides: Partial<PreflightEmployee> = {}): PreflightEmployee {
  return {
    id: 'emp-1',
    name: 'Alagurani',
    status: 'ACTIVE',
    exitDate: null,
    uan: '100200300400',
    esiNo: '5566778899',
    pfMode: 'PERCENT',
    pfPercent: 12,
    pfAmount: 0,
    esiAmount: 300,
    defaultTotalSalary: 12000,
    ...overrides,
  }
}

// A cycle where the (single) employee is fully compliant and all forms exported.
function input(overrides: Partial<PreflightInput> = {}): PreflightInput {
  return {
    cycle: { month: 6, year: 2026 },
    employees: [employee()],
    attendance: [{ employeeId: 'emp-1', dailyMarks: ['P', 'P', 'H', 'A'] }],
    wages: [{ employeeId: 'emp-1', grossWages: 12000 }],
    formTasks: [
      { formCode: 'HOSPITAL_FORM_V', status: 'EXPORTED' },
      { formCode: 'HOSPITAL_FORM_XII', status: 'EXPORTED' },
    ],
    ...overrides,
  }
}

function codes(findings: { code: string }[]): string[] {
  return findings.map((f) => f.code)
}

describe('runComplianceChecks — all green', () => {
  it('returns no findings for a fully compliant cycle', () => {
    expect(runComplianceChecks(input())).toEqual([])
  })

  it('returns no findings for an empty cycle with exported forms', () => {
    const out = runComplianceChecks(input({ employees: [], attendance: [], wages: [] }))
    expect(out).toEqual([])
  })
})

describe('NO_ATTENDANCE check', () => {
  it('warns when an employee has no attendance record at all', () => {
    const out = runComplianceChecks(input({ attendance: [] }))
    expect(codes(out)).toContain('NO_ATTENDANCE')
    const f = out.find((f) => f.code === 'NO_ATTENDANCE')!
    expect(f.severity).toBe('warning')
    expect(f.employeeName).toBe('Alagurani')
    expect(f.message).toMatch(/no attendance/i)
  })

  it('warns when dailyMarks is an empty array', () => {
    const out = runComplianceChecks(input({ attendance: [{ employeeId: 'emp-1', dailyMarks: [] }] }))
    expect(codes(out)).toContain('NO_ATTENDANCE')
  })

  it('warns when every mark is blank', () => {
    const out = runComplianceChecks(
      input({ attendance: [{ employeeId: 'emp-1', dailyMarks: ['', '', '  ', ''] }] })
    )
    expect(codes(out)).toContain('NO_ATTENDANCE')
  })

  it('passes when at least one real mark exists', () => {
    const out = runComplianceChecks(
      input({ attendance: [{ employeeId: 'emp-1', dailyMarks: ['', 'P', ''] }] })
    )
    expect(codes(out)).not.toContain('NO_ATTENDANCE')
  })
})

describe('ZERO_WAGES check', () => {
  it('warns when no wage record exists and default salary is zero', () => {
    const out = runComplianceChecks(
      input({ wages: [], employees: [employee({ defaultTotalSalary: 0 })] })
    )
    const f = out.find((f) => f.code === 'ZERO_WAGES')
    expect(f).toBeDefined()
    expect(f!.severity).toBe('warning')
    expect(f!.employeeName).toBe('Alagurani')
  })

  it('warns when the wage record has zero gross wages and default salary is zero', () => {
    const out = runComplianceChecks(
      input({
        wages: [{ employeeId: 'emp-1', grossWages: 0 }],
        employees: [employee({ defaultTotalSalary: 0 })],
      })
    )
    expect(codes(out)).toContain('ZERO_WAGES')
  })

  it('passes when no wage record exists but a default salary is set (register can be synced)', () => {
    const out = runComplianceChecks(input({ wages: [] }))
    expect(codes(out)).not.toContain('ZERO_WAGES')
  })

  it('passes when a wage record with positive gross wages exists', () => {
    const out = runComplianceChecks(input({ employees: [employee({ defaultTotalSalary: 0 })] }))
    expect(codes(out)).not.toContain('ZERO_WAGES')
  })
})

describe('MISSING_UAN check', () => {
  it('errors when PF is percent-based and UAN is missing', () => {
    const out = runComplianceChecks(input({ employees: [employee({ uan: null })] }))
    const f = out.find((f) => f.code === 'MISSING_UAN')
    expect(f).toBeDefined()
    expect(f!.severity).toBe('error')
    expect(f!.employeeName).toBe('Alagurani')
    expect(f!.message).toMatch(/UAN/)
  })

  it('errors when UAN is whitespace only', () => {
    const out = runComplianceChecks(input({ employees: [employee({ uan: '   ' })] }))
    expect(codes(out)).toContain('MISSING_UAN')
  })

  it('errors when PF is a fixed amount > 0 and UAN is missing', () => {
    const out = runComplianceChecks(
      input({ employees: [employee({ pfMode: 'FIXED', pfAmount: 500, uan: null })] })
    )
    expect(codes(out)).toContain('MISSING_UAN')
  })

  it('passes when pfMode is NONE even without a UAN', () => {
    const out = runComplianceChecks(
      input({ employees: [employee({ pfMode: 'NONE', uan: null })] })
    )
    expect(codes(out)).not.toContain('MISSING_UAN')
  })

  it('passes when PF is FIXED with a zero amount (no PF actually deducted)', () => {
    const out = runComplianceChecks(
      input({ employees: [employee({ pfMode: 'FIXED', pfAmount: 0, uan: null })] })
    )
    expect(codes(out)).not.toContain('MISSING_UAN')
  })

  it('passes when PF applies and UAN is present', () => {
    expect(codes(runComplianceChecks(input()))).not.toContain('MISSING_UAN')
  })
})

describe('MISSING_ESI_NUMBER check', () => {
  it('errors when ESI is deducted but esiNo is missing', () => {
    const out = runComplianceChecks(input({ employees: [employee({ esiNo: null })] }))
    const f = out.find((f) => f.code === 'MISSING_ESI_NUMBER')
    expect(f).toBeDefined()
    expect(f!.severity).toBe('error')
    expect(f!.employeeName).toBe('Alagurani')
    expect(f!.message).toMatch(/ESI/)
  })

  it('errors when esiNo is whitespace only', () => {
    const out = runComplianceChecks(input({ employees: [employee({ esiNo: ' ' })] }))
    expect(codes(out)).toContain('MISSING_ESI_NUMBER')
  })

  it('passes when ESI does not apply (esiAmount 0) even without esiNo', () => {
    const out = runComplianceChecks(
      input({ employees: [employee({ esiAmount: 0, esiNo: null })] })
    )
    expect(codes(out)).not.toContain('MISSING_ESI_NUMBER')
  })

  it('passes when ESI applies and esiNo is present', () => {
    expect(codes(runComplianceChecks(input()))).not.toContain('MISSING_ESI_NUMBER')
  })
})

describe('FORMS_PENDING check', () => {
  it('warns once, listing every form not yet exported', () => {
    const out = runComplianceChecks(
      input({
        formTasks: [
          { formCode: 'HOSPITAL_FORM_V', status: 'NOT_STARTED' },
          { formCode: 'HOSPITAL_FORM_XII', status: 'APPROVED' },
          { formCode: 'HOSPITAL_FORM_XI', status: 'EXPORTED' },
        ],
      })
    )
    const pending = out.filter((f) => f.code === 'FORMS_PENDING')
    expect(pending).toHaveLength(1)
    expect(pending[0].severity).toBe('warning')
    expect(pending[0].message).toMatch(/Form V/)
    expect(pending[0].message).toMatch(/Form XII/)
    expect(pending[0].message).not.toMatch(/Form XI\b/)
  })

  it('passes when every form task is EXPORTED', () => {
    expect(codes(runComplianceChecks(input()))).not.toContain('FORMS_PENDING')
  })

  it('passes when the cycle has no form tasks', () => {
    const out = runComplianceChecks(input({ formTasks: [] }))
    expect(codes(out)).not.toContain('FORMS_PENDING')
  })
})

describe('EXITED_EMPLOYEE check', () => {
  it('warns when an EXITED employee is still on the cycle roster', () => {
    const out = runComplianceChecks(
      input({ employees: [employee({ status: 'EXITED', exitDate: new Date(2026, 5, 15) })] })
    )
    const f = out.find((f) => f.code === 'EXITED_EMPLOYEE')
    expect(f).toBeDefined()
    expect(f!.severity).toBe('warning')
    expect(f!.employeeName).toBe('Alagurani')
  })

  it('warns when exitDate is before the cycle start even if status is ACTIVE', () => {
    // Cycle is June 2026 → starts 2026-06-01; exit on 2026-05-20 predates it.
    const out = runComplianceChecks(
      input({ employees: [employee({ status: 'ACTIVE', exitDate: new Date(2026, 4, 20) })] })
    )
    expect(codes(out)).toContain('EXITED_EMPLOYEE')
  })

  it('passes when the exit date falls inside the cycle month (worked part of it)', () => {
    const out = runComplianceChecks(
      input({ employees: [employee({ status: 'ACTIVE', exitDate: new Date(2026, 5, 10) })] })
    )
    expect(codes(out)).not.toContain('EXITED_EMPLOYEE')
  })

  it('passes for an active employee with no exit date', () => {
    expect(codes(runComplianceChecks(input()))).not.toContain('EXITED_EMPLOYEE')
  })
})

describe('mixed cycles', () => {
  it('reports findings for each failing employee independently', () => {
    const bad = employee({ id: 'emp-2', name: 'Kumar', uan: null, esiNo: null })
    const out = runComplianceChecks(
      input({
        employees: [employee(), bad],
        attendance: [{ employeeId: 'emp-1', dailyMarks: ['P'] }], // emp-2 has none
        wages: [
          { employeeId: 'emp-1', grossWages: 12000 },
          { employeeId: 'emp-2', grossWages: 9000 },
        ],
      })
    )
    expect(out.filter((f) => f.employeeName === 'Alagurani')).toHaveLength(0)
    const kumar = out.filter((f) => f.employeeName === 'Kumar')
    expect(codes(kumar).sort()).toEqual(['MISSING_ESI_NUMBER', 'MISSING_UAN', 'NO_ATTENDANCE'])
  })

  it('orders errors before warnings', () => {
    const out = runComplianceChecks(
      input({
        employees: [employee({ uan: null })],
        attendance: [],
        formTasks: [{ formCode: 'HOSPITAL_FORM_V', status: 'DATA_ENTRY' }],
      })
    )
    expect(out.length).toBeGreaterThanOrEqual(3)
    const firstWarning = out.findIndex((f) => f.severity === 'warning')
    const lastError = out.map((f) => f.severity).lastIndexOf('error')
    expect(lastError).toBeLessThan(firstWarning)
  })
})
