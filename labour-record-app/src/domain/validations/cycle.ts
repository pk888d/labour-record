type CycleInput = {
  establishmentId: string
  month: number
  year: number
  wagePeriodDays?: number
}

export function validateNewCycle(input: CycleInput): string[] {
  const errors: string[] = []
  if (!input.establishmentId?.trim()) errors.push('establishmentId is required')
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12)
    errors.push('month must be between 1 and 12')
  const maxYear = new Date().getFullYear() + 1
  if (!Number.isInteger(input.year) || input.year < 2000 || input.year > maxYear)
    errors.push(`year must be between 2000 and ${maxYear}`)
  if (input.wagePeriodDays !== undefined &&
      (!Number.isInteger(input.wagePeriodDays) || input.wagePeriodDays < 1 || input.wagePeriodDays > 31))
    errors.push('wagePeriodDays must be an integer between 1 and 31')
  return errors
}
