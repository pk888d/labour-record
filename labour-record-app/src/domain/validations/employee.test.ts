import { describe, expect, it } from 'vitest'
import { validateEmployee, generateEmpId, type EmployeeInput } from './employee'

const base: EmployeeInput = {
  empId: '', name: 'Asha', sex: null, fatherSpouseName: null, dateOfEntry: null,
  designation: null, presentAddress: null, permanentAddress: null,
  establishmentId: 'est1', defaultTotalSalary: 15000,
}

describe('validateEmployee', () => {
  it('requires only name, salary, and establishment', () => {
    expect(validateEmployee(base)).toEqual([])
  })
  it('flags a missing name', () => {
    expect(validateEmployee({ ...base, name: '  ' })).toContain('name is required')
  })
  it('flags a missing / non-positive salary', () => {
    expect(validateEmployee({ ...base, defaultTotalSalary: 0 })).toContain('a salary figure is required')
  })
  it('flags a missing establishment', () => {
    expect(validateEmployee({ ...base, establishmentId: '' })).toContain('establishmentId is required')
  })
  it('still validates exit relationships when present', () => {
    expect(validateEmployee({ ...base, dateOfEntry: new Date('2020-01-01'), exitDate: new Date('2019-01-01') }))
      .toContain('exitDate must be after dateOfEntry')
    expect(validateEmployee({ ...base, exitDate: new Date('2020-01-01') }))
      .toContain('exitReason is required when exitDate is set')
  })
})

describe('generateEmpId', () => {
  it('zero-pads a sequence to EMP-####', () => {
    expect(generateEmpId(0)).toBe('EMP-0001')
    expect(generateEmpId(41)).toBe('EMP-0042')
  })
})
