import { describe, it, expect } from 'vitest'
import { validateEmployee } from '@/domain/validations/employee'

describe('validateEmployee', () => {
  const base = {
    empId: 'EMP001',
    name: 'Alagurani',
    sex: 'F',
    fatherSpouseName: 'Angappan',
    dateOfEntry: new Date('2020-01-01'),
    designation: 'Nurse',
    presentAddress: '12 Gandhi St, Palacode',
    permanentAddress: '12 Gandhi St, Palacode',
    establishmentId: 'est_001',
  }

  it('passes a valid employee', () => {
    expect(validateEmployee(base)).toEqual([])
  })

  it('requires empId', () => {
    expect(validateEmployee({ ...base, empId: '' })).toContain('empId is required')
  })

  it('requires name', () => {
    expect(validateEmployee({ ...base, name: '' })).toContain('name is required')
  })

  it('requires sex', () => {
    expect(validateEmployee({ ...base, sex: '' })).toContain('sex is required')
  })

  it('requires fatherSpouseName', () => {
    expect(validateEmployee({ ...base, fatherSpouseName: '' }))
      .toContain('fatherSpouseName is required')
  })

  it('requires dateOfEntry', () => {
    expect(validateEmployee({ ...base, dateOfEntry: null as any }))
      .toContain('dateOfEntry is required')
  })

  it('requires designation', () => {
    expect(validateEmployee({ ...base, designation: '' }))
      .toContain('designation is required')
  })

  it('requires presentAddress', () => {
    expect(validateEmployee({ ...base, presentAddress: '' }))
      .toContain('presentAddress is required')
  })

  it('requires permanentAddress', () => {
    expect(validateEmployee({ ...base, permanentAddress: '' }))
      .toContain('permanentAddress is required')
  })

  it('requires establishmentId', () => {
    expect(validateEmployee({ ...base, establishmentId: '' }))
      .toContain('establishmentId is required')
  })

  it('validates exitDate is after dateOfEntry when both present', () => {
    const errors = validateEmployee({
      ...base,
      exitDate: new Date('2019-01-01'),
    })
    expect(errors).toContain('exitDate must be after dateOfEntry')
  })

  it('requires exitReason when exitDate is set', () => {
    const errors = validateEmployee({
      ...base,
      exitDate: new Date('2024-01-01'),
      exitReason: '',
    })
    expect(errors).toContain('exitReason is required when exitDate is set')
  })

  it('allows exitDate equal to dateOfEntry (same-day exit)', () => {
    const errors = validateEmployee({
      ...base,
      exitDate: new Date('2020-01-01'),
      exitReason: 'Probation rejected',
    })
    expect(errors).not.toContain('exitDate must be after dateOfEntry')
  })

  it('rejects invalid sex value', () => {
    expect(validateEmployee({ ...base, sex: 'X' })).toContain('sex must be M or F')
  })

  it('rejects whitespace-only name', () => {
    expect(validateEmployee({ ...base, name: '   ' })).toContain('name is required')
  })
})
