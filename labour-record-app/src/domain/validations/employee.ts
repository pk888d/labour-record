export type EmployeeInput = {
  empId?: string | null
  name: string
  sex?: string | null
  fatherSpouseName?: string | null
  dateOfEntry?: Date | null
  designation?: string | null
  presentAddress?: string | null
  permanentAddress?: string | null
  establishmentId: string
  defaultTotalSalary?: number | null
  exitDate?: Date | null
  exitReason?: string | null
}

// Phase-2 (#3): only Name + a salary figure are mandatory (plus the owning
// establishment). Everything else is optional and entered later / via import.
// requireSalary defaults true (enforced on CREATE); pass false for UPDATE so
// existing employees with legacy 0-salary can still be saved without changes.
export function validateEmployee(input: EmployeeInput, opts?: { requireSalary?: boolean }): string[] {
  const requireSalary = opts?.requireSalary ?? true
  const errors: string[] = []
  if (!input.name?.trim()) errors.push('name is required')
  if (requireSalary && !(typeof input.defaultTotalSalary === 'number' && input.defaultTotalSalary > 0)) {
    errors.push('a salary figure is required')
  }
  if (!input.establishmentId?.trim()) errors.push('establishmentId is required')

  if (input.exitDate && input.dateOfEntry && input.exitDate < input.dateOfEntry) {
    errors.push('exitDate must be after dateOfEntry')
  }
  if (input.exitDate && !input.exitReason?.trim()) {
    errors.push('exitReason is required when exitDate is set')
  }
  return errors
}

// Auto-generate an Employee ID when the operator leaves it blank (#3).
// `existingCount` is the current number of employees in the establishment.
export function generateEmpId(existingCount: number): string {
  return `EMP-${String(existingCount + 1).padStart(4, '0')}`
}
