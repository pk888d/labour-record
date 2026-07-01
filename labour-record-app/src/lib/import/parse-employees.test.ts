import { describe, expect, it } from 'vitest'
import { parseEmployeeRows } from './parse-employees'

describe('parseEmployeeRows', () => {
  it('parses ADD rows with name + salary', () => {
    const { valid, errors } = parseEmployeeRows([
      { Action: 'ADD', Name: 'Asha', Salary: '15000', 'Emp ID': 'A1', 'Payment Mode': 'Cash' },
      { action: 'add', name: 'Bina', salary: '18000', Designation: 'Nurse' },
    ])
    expect(errors).toEqual([])
    expect(valid).toHaveLength(2)
    expect(valid[0]).toMatchObject({
      action: 'ADD', name: 'Asha', empId: 'A1', defaultTotalSalary: 15000, paymentMode: 'CASH',
    })
    expect(valid[1]).toMatchObject({
      action: 'ADD', name: 'Bina', defaultTotalSalary: 18000, designation: 'Nurse',
    })
  })

  it('reports row errors for ADD missing name or salary', () => {
    const { valid, errors } = parseEmployeeRows([
      { Action: 'ADD', Name: '', Salary: '15000' },
      { Action: 'ADD', Name: 'Cima', Salary: 'abc' },
    ])
    expect(valid).toHaveLength(0)
    expect(errors).toEqual([
      { row: 2, messages: ['name is required for ADD'] },
      { row: 3, messages: ['salary is required for ADD'] },
    ])
  })

  it('parses UPDATE rows — empId required, fields optional', () => {
    const { valid, errors } = parseEmployeeRows([
      { Action: 'UPDATE', 'Emp ID': 'EMP-001', Name: 'Asha K', Salary: '18000' },
    ])
    expect(errors).toEqual([])
    expect(valid[0]).toMatchObject({ action: 'UPDATE', empId: 'EMP-001', name: 'Asha K', defaultTotalSalary: 18000 })
  })

  it('errors for UPDATE missing empId', () => {
    const { valid, errors } = parseEmployeeRows([
      { Action: 'UPDATE', 'Emp ID': '', Name: 'Asha K' },
    ])
    expect(valid).toHaveLength(0)
    expect(errors[0].messages).toContain('Emp ID is required for UPDATE')
  })

  it('parses DELETE rows — only empId required', () => {
    const { valid, errors } = parseEmployeeRows([
      { Action: 'DELETE', 'Emp ID': 'EMP-002' },
    ])
    expect(errors).toEqual([])
    expect(valid[0]).toMatchObject({ action: 'DELETE', empId: 'EMP-002' })
  })

  it('skips blank and notes rows silently', () => {
    const { valid, errors } = parseEmployeeRows([
      // typical template notes row — no valid action value
      { Action: 'ADD / UPDATE / DELETE', 'Emp ID': 'Optional (auto-generated)', Name: 'Mandatory' },
      { Action: '', 'Emp ID': '', Name: '' },
    ])
    expect(valid).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })

  it('parses all extra fields', () => {
    const { valid } = parseEmployeeRows([
      {
        Action: 'ADD', Name: 'Dev', Salary: '20000',
        Email: 'dev@example.com', 'Present Address': '1 Park St',
        'Basic Wage': '9000', DA: '1500', HRA: '800',
        'PF Mode': 'percent', 'PF %': '12', 'PF Wage Ceiling': '15000',
        'PF Amount': '1080', 'ESI Amount': '112', LWF: '10',
        '480 Days': '2021-06-01', 'Date Made Permanent': '2022-01-01',
        Remarks: 'test',
      },
    ])
    expect(valid[0]).toMatchObject({
      email: 'dev@example.com',
      presentAddress: '1 Park St',
      basicWage: 9000, daWage: 1500, hraWage: 800,
      pfMode: 'PERCENT', pfPercent: 12, pfWageCeiling: 15000,
      pfAmount: 1080, esiAmount: 112, lwfAmount: 10,
      completionOf480Days: '2021-06-01',
      dateMadePermanent: '2022-01-01',
      remarks: 'test',
    })
  })
})
