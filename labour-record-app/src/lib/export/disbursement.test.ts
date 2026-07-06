import { describe, expect, it } from 'vitest'
import { buildDisbursementRows, type DisbursementInput } from './disbursement'

const bankEmp = (over: Partial<DisbursementInput> = {}): DisbursementInput => ({
  name: 'Asha Rao',
  empId: 'E001',
  paymentMode: 'BANK',
  bankAccount: '1234567890',
  ifsc: 'HDFC0001234',
  bankName: 'HDFC Bank',
  netPay: 20000,
  ...over,
})

const cashEmp = (over: Partial<DisbursementInput> = {}): DisbursementInput => ({
  name: 'Ravi Kumar',
  empId: 'E002',
  paymentMode: 'CASH',
  bankAccount: null,
  ifsc: null,
  bankName: null,
  netPay: 15000,
  ...over,
})

describe('buildDisbursementRows', () => {
  it('splits BANK-mode and CASH-mode employees into separate lists', () => {
    const res = buildDisbursementRows([bankEmp(), cashEmp()])
    expect(res.bank).toHaveLength(1)
    expect(res.cash).toHaveLength(1)
    expect(res.bank[0]).toMatchObject({
      name: 'Asha Rao',
      empId: 'E001',
      bankAccount: '1234567890',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank',
      netPay: 20000,
    })
    expect(res.cash[0]).toMatchObject({ name: 'Ravi Kumar', empId: 'E002', netPay: 15000 })
  })

  it('computes bank / cash / grand totals correctly', () => {
    const res = buildDisbursementRows([
      bankEmp({ netPay: 20000 }),
      bankEmp({ empId: 'E003', name: 'B', netPay: 10000.5 }),
      cashEmp({ netPay: 15000 }),
      cashEmp({ empId: 'E004', name: 'C', netPay: 500.25 }),
    ])
    expect(res.totals.bank).toBe(30000.5)
    expect(res.totals.cash).toBe(15500.25)
    expect(res.totals.grand).toBe(45500.75)
  })

  it('includes zero / negative net pay employees but warns for each', () => {
    const res = buildDisbursementRows([
      bankEmp({ name: 'Zero Zoe', empId: 'E010', netPay: 0 }),
      cashEmp({ name: 'Neg Ned', empId: 'E011', netPay: -50 }),
    ])
    // still present, never silently dropped
    expect(res.bank).toHaveLength(1)
    expect(res.cash).toHaveLength(1)
    expect(res.warnings.some((w) => w.includes('Zero Zoe'))).toBe(true)
    expect(res.warnings.some((w) => w.includes('Neg Ned'))).toBe(true)
    // negative counts toward totals as-is
    expect(res.totals.cash).toBe(-50)
  })

  it('warns for BANK-mode employees missing bankAccount or IFSC but still includes them', () => {
    const res = buildDisbursementRows([
      bankEmp({ name: 'No Acct', empId: 'E020', bankAccount: null }),
      bankEmp({ name: 'No Ifsc', empId: 'E021', ifsc: '' }),
    ])
    expect(res.bank).toHaveLength(2)
    expect(res.warnings.some((w) => w.includes('No Acct'))).toBe(true)
    expect(res.warnings.some((w) => w.includes('No Ifsc'))).toBe(true)
  })

  it('treats unknown / missing payment mode as BANK by default', () => {
    const res = buildDisbursementRows([bankEmp({ paymentMode: '' })])
    expect(res.bank).toHaveLength(1)
    expect(res.cash).toHaveLength(0)
  })

  it('returns empty lists, zero totals and no warnings for an empty cycle', () => {
    const res = buildDisbursementRows([])
    expect(res.bank).toEqual([])
    expect(res.cash).toEqual([])
    expect(res.warnings).toEqual([])
    expect(res.totals).toEqual({ bank: 0, cash: 0, grand: 0 })
  })
})
