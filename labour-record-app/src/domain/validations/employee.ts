export type EmployeeInput = {
  empId: string
  name: string
  sex: string
  fatherSpouseName: string
  dateOfEntry: Date | null
  designation: string
  presentAddress: string
  permanentAddress: string
  establishmentId: string
  exitDate?: Date | null
  exitReason?: string | null
}

export function validateEmployee(input: EmployeeInput): string[] {
  const errors: string[] = []
  if (!input.empId?.trim()) errors.push('empId is required')
  if (!input.name?.trim()) errors.push('name is required')
  const VALID_SEX_VALUES = ['M', 'F', 'Male', 'Female']
  if (!input.sex?.trim()) {
    errors.push('sex is required')
  } else if (!VALID_SEX_VALUES.includes(input.sex.trim())) {
    errors.push('sex must be M or F')
  }
  if (!input.fatherSpouseName?.trim()) errors.push('fatherSpouseName is required')
  if (!input.dateOfEntry) errors.push('dateOfEntry is required')
  if (!input.designation?.trim()) errors.push('designation is required')
  if (!input.presentAddress?.trim()) errors.push('presentAddress is required')
  if (!input.permanentAddress?.trim()) errors.push('permanentAddress is required')
  if (!input.establishmentId?.trim()) errors.push('establishmentId is required')

  if (input.exitDate && input.dateOfEntry && input.exitDate < input.dateOfEntry) {
    errors.push('exitDate must be after dateOfEntry')
  }
  if (input.exitDate && !input.exitReason?.trim()) {
    errors.push('exitReason is required when exitDate is set')
  }
  return errors
}
