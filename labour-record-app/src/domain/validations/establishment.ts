import type { WageFormulaConfig } from '@/types'
import { ESTABLISHMENT_TYPES } from '@/domain/calculations/da-rates'

type EstablishmentInput = {
  name: string
  address: string
  employerName: string
  managerName: string
  regCertNo: string
  type: string
}

export function validateEstablishment(input: EstablishmentInput): string[] {
  const errors: string[] = []
  if (!input.name?.trim()) errors.push('name is required')
  if (!input.address?.trim()) errors.push('address is required')
  if (!input.employerName?.trim()) errors.push('employerName is required')
  if (!input.managerName?.trim()) errors.push('managerName is required')
  if (!input.regCertNo?.trim()) errors.push('regCertNo is required')
  if (!ESTABLISHMENT_TYPES.includes(input.type as (typeof ESTABLISHMENT_TYPES)[number])) {
    errors.push('type must be a supported establishment type')
  }
  return errors
}

export function validateWageFormulaConfig(config: Partial<WageFormulaConfig>): string[] {
  const errors: string[] = []
  const validPresets = ['TN_MINIMUM_WAGES_HOSPITAL', 'TN_SHOPS_ESTABLISHMENTS']
  if (!config.preset || !validPresets.includes(config.preset)) {
    errors.push('preset must be TN_MINIMUM_WAGES_HOSPITAL or TN_SHOPS_ESTABLISHMENTS')
  }
  if (config.fixedAllowance !== undefined && config.fixedAllowance < 0) {
    errors.push('fixedAllowance must be 0 or greater')
  }
  if (config.lwfRate !== undefined && config.lwfRate < 0) {
    errors.push('lwfRate must be 0 or greater')
  }
  return errors
}
