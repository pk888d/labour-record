import { describe, expect, it } from 'vitest'
import { parseEmployeeRows } from './parse-employees'

describe('parseEmployeeRows', () => {
  it('maps headers case-insensitively and keeps valid rows', () => {
    const { valid, errors } = parseEmployeeRows([
      { Name: 'Asha', Salary: '15000', 'Emp ID': 'A1', 'Payment Mode': 'Cash' },
      { name: 'Bina', salary: '18000', Designation: 'Nurse' },
    ])
    expect(errors).toEqual([])
    expect(valid).toHaveLength(2)
    expect(valid[0]).toMatchObject({ name: 'Asha', empId: 'A1', defaultTotalSalary: 15000, paymentMode: 'CASH' })
    expect(valid[1]).toMatchObject({ name: 'Bina', defaultTotalSalary: 18000, designation: 'Nurse', paymentMode: 'BANK' })
  })

  it('reports row errors for missing name or salary (1-based, header = row 1)', () => {
    const { valid, errors } = parseEmployeeRows([
      { Name: '', Salary: '15000' },
      { Name: 'Cima', Salary: 'abc' },
    ])
    expect(valid).toHaveLength(0)
    expect(errors).toEqual([
      { row: 2, messages: ['name is required'] },
      { row: 3, messages: ['a salary figure is required'] },
    ])
  })
})
