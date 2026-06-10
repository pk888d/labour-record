import { describe, it, expect } from 'vitest'
import {
  validateEstablishment,
  validateWageFormulaConfig,
} from '@/domain/validations/establishment'

describe('validateEstablishment', () => {
  const base = {
    name: 'DNV Orthocare',
    address: '123 Main St, Palacode',
    employerName: 'Dr. Nagarajan',
    managerName: 'Ramesh Kumar',
    regCertNo: 'TN-HR-2021-001',
    type: 'HOSPITAL' as const,
  }

  it('passes a valid hospital establishment', () => {
    const errors = validateEstablishment(base)
    expect(errors).toEqual([])
  })

  it('requires name', () => {
    const errors = validateEstablishment({ ...base, name: '' })
    expect(errors).toContain('name is required')
  })

  it('requires employerName', () => {
    const errors = validateEstablishment({ ...base, employerName: '' })
    expect(errors).toContain('employerName is required')
  })

  it('requires managerName', () => {
    const errors = validateEstablishment({ ...base, managerName: '' })
    expect(errors).toContain('managerName is required')
  })

  it('requires regCertNo', () => {
    const errors = validateEstablishment({ ...base, regCertNo: '' })
    expect(errors).toContain('regCertNo is required')
  })

  it('rejects an unsupported type', () => {
    const errors = validateEstablishment({ ...base, type: 'OTHER' as any })
    expect(errors).toContain('type must be a supported establishment type')
  })

  it('accepts all six supported types', () => {
    for (const type of ['SHOP', 'HOSPITAL', 'HOTEL', 'PETROL_BUNK', 'MEDICAL', 'OIL_MILL']) {
      const errors = validateEstablishment({ ...base, type: type as any })
      expect(errors).toEqual([])
    }
  })
})

describe('validateWageFormulaConfig', () => {
  it('passes valid hospital config', () => {
    const errors = validateWageFormulaConfig({
      preset: 'TN_MINIMUM_WAGES_HOSPITAL',
      fixedAllowance: 360,
      esiApplicable: false,
      lwfApplicable: true,
      lwfRate: 0.25,
    })
    expect(errors).toEqual([])
  })

  it('passes valid shop config', () => {
    const errors = validateWageFormulaConfig({
      preset: 'TN_SHOPS_ESTABLISHMENTS',
      esiApplicable: true,
      lwfApplicable: true,
      lwfRate: 0.25,
    })
    expect(errors).toEqual([])
  })

  it('requires a valid preset', () => {
    const errors = validateWageFormulaConfig({ preset: 'UNKNOWN' as any })
    expect(errors).toContain('preset must be TN_MINIMUM_WAGES_HOSPITAL or TN_SHOPS_ESTABLISHMENTS')
  })

  it('requires fixedAllowance to be non-negative when provided', () => {
    const errors = validateWageFormulaConfig({
      preset: 'TN_MINIMUM_WAGES_HOSPITAL',
      fixedAllowance: -10,
    })
    expect(errors).toContain('fixedAllowance must be 0 or greater')
  })
})
