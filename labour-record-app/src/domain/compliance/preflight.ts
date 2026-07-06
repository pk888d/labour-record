// Pure compliance pre-flight checks for a monthly cycle. Takes already-shaped
// plain rows (no Prisma here, same split as src/lib/calendar/events.ts vs
// load.ts) and returns the list of problems an inspector would spot on the
// printed statutory registers — so the operator sees them BEFORE printing.

export type PreflightSeverity = 'error' | 'warning'

export type PreflightCode =
  | 'MISSING_UAN'
  | 'MISSING_ESI_NUMBER'
  | 'NO_ATTENDANCE'
  | 'ZERO_WAGES'
  | 'FORMS_PENDING'
  | 'EXITED_EMPLOYEE'

export interface PreflightFinding {
  severity: PreflightSeverity
  code: PreflightCode
  message: string
  employeeName?: string
}

export interface PreflightEmployee {
  id: string
  name: string
  status: string // ACTIVE | SUSPENDED | EXITED
  exitDate: Date | null
  uan: string | null
  esiNo: string | null
  pfMode: string // PERCENT | FIXED | NONE
  pfPercent: number
  pfAmount: number
  esiAmount: number
  defaultTotalSalary: number
}

export interface PreflightInput {
  cycle: { month: number; year: number } // month is 1-based
  employees: PreflightEmployee[]
  attendance: { employeeId: string; dailyMarks: string[] }[]
  wages: { employeeId: string; grossWages: number }[]
  formTasks: { formCode: string; status: string }[]
}

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim() === ''
}

// PF is actually deducted when the mode computes a non-zero contribution
// (mirrors calculatePf in src/domain/calculations/pf-calculator.ts:
// NONE → 0, FIXED → pfAmount, PERCENT → pfPercent% of wage).
function pfApplies(e: PreflightEmployee): boolean {
  if (e.pfMode === 'NONE') return false
  if (e.pfMode === 'FIXED') return e.pfAmount > 0
  return e.pfPercent > 0 // PERCENT (default)
}

// Short label for a statutory form code (HOSPITAL_FORM_XII → "Form XII"),
// same convention as src/lib/calendar/events.ts.
function formLabel(formCode: string): string {
  return `Form ${formCode.replace(/^(HOSPITAL|SHOP)_FORM_/, '')}`
}

export function runComplianceChecks(input: PreflightInput): PreflightFinding[] {
  const errors: PreflightFinding[] = []
  const warnings: PreflightFinding[] = []

  const attendanceByEmployee = new Map(input.attendance.map((a) => [a.employeeId, a]))
  const wagesByEmployee = new Map(input.wages.map((w) => [w.employeeId, w]))
  const cycleStart = new Date(input.cycle.year, input.cycle.month - 1, 1)

  for (const emp of input.employees) {
    // Statutory-identifier errors: the printed register would carry a PF/ESI
    // deduction with no account number to remit it against.
    if (pfApplies(emp) && isBlank(emp.uan)) {
      errors.push({
        severity: 'error',
        code: 'MISSING_UAN',
        message: 'PF is deducted but the employee has no UAN',
        employeeName: emp.name,
      })
    }
    if (emp.esiAmount > 0 && isBlank(emp.esiNo)) {
      errors.push({
        severity: 'error',
        code: 'MISSING_ESI_NUMBER',
        message: 'ESI is deducted but the employee has no ESI number',
        employeeName: emp.name,
      })
    }

    // Attendance: no record, or a record whose marks are all blank, means the
    // muster roll would print empty for this employee.
    const att = attendanceByEmployee.get(emp.id)
    if (!att || att.dailyMarks.every((m) => m.trim() === '')) {
      warnings.push({
        severity: 'warning',
        code: 'NO_ATTENDANCE',
        message: 'No attendance recorded for this cycle',
        employeeName: emp.name,
      })
    }

    // Wages: the register would show zero — no wage row (or a zero-gross row)
    // and no default salary to sync one from.
    const wage = wagesByEmployee.get(emp.id)
    if ((!wage || wage.grossWages <= 0) && emp.defaultTotalSalary <= 0) {
      warnings.push({
        severity: 'warning',
        code: 'ZERO_WAGES',
        message: 'No wages recorded and no default salary set — register would show zero wages',
        employeeName: emp.name,
      })
    }

    // Roster hygiene: an employee who exited before the cycle started (or is
    // flagged EXITED) should normally not appear on this cycle's registers.
    if (emp.status === 'EXITED' || (emp.exitDate !== null && emp.exitDate < cycleStart)) {
      warnings.push({
        severity: 'warning',
        code: 'EXITED_EMPLOYEE',
        message: 'Exited employee is still included in the cycle roster',
        employeeName: emp.name,
      })
    }
  }

  // Workflow: EXPORTED is the terminal kanban state (see VALID_TRANSITIONS in
  // src/domain/workflow/kanban-transitions.ts); anything else is unfinished.
  const pending = input.formTasks.filter((t) => t.status !== 'EXPORTED')
  if (pending.length > 0) {
    warnings.push({
      severity: 'warning',
      code: 'FORMS_PENDING',
      message: `${pending.length} form(s) not yet exported: ${pending.map((t) => formLabel(t.formCode)).join(', ')}`,
    })
  }

  return [...errors, ...warnings]
}
