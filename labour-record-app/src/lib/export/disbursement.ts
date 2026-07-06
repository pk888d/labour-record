// Pure builder for the bank disbursement / salary-transfer sheet (TEC-29).
//
// Given each employee's payment mode, bank details and NET pay for a cycle, it
// splits them into a bank-transfer list and a cash-payment list, tallies totals,
// and collects human-readable warnings. Nobody is ever silently dropped: zero /
// negative net pay and BANK-mode employees with missing bank details are still
// listed, but each raises a warning so the operator can act before paying.
//
// Net pay MUST be supplied by the caller from the same wage-derivation source as
// the Wage Register (see src/lib/export/form-data.ts getWagesData) so the
// disbursement file always reconciles with the register and salary slips.
import { round2 } from '@/lib/money'

export type DisbursementInput = {
  name: string
  empId: string
  paymentMode: string // 'BANK' | 'CASH' (anything not 'CASH' is treated as BANK)
  bankAccount?: string | null
  ifsc?: string | null
  bankName?: string | null
  netPay: number
}

export type DisbursementRow = {
  name: string
  empId: string
  bankAccount: string
  ifsc: string
  bankName: string
  netPay: number
}

export type DisbursementResult = {
  bank: DisbursementRow[]
  cash: DisbursementRow[]
  warnings: string[]
  totals: { bank: number; cash: number; grand: number }
}

const label = (e: DisbursementInput) => `${e.name} (${e.empId})`

export function buildDisbursementRows(employees: DisbursementInput[]): DisbursementResult {
  const bank: DisbursementRow[] = []
  const cash: DisbursementRow[] = []
  const warnings: string[] = []
  let bankTotal = 0
  let cashTotal = 0

  for (const e of employees) {
    const netPay = round2(e.netPay)
    const isCash = e.paymentMode === 'CASH'

    if (netPay <= 0) {
      warnings.push(`${label(e)} has zero or negative net pay (₹${netPay}) — verify before paying.`)
    }

    if (isCash) {
      cash.push({ name: e.name, empId: e.empId, bankAccount: '', ifsc: '', bankName: '', netPay })
      cashTotal += netPay
    } else {
      const bankAccount = (e.bankAccount ?? '').trim()
      const ifsc = (e.ifsc ?? '').trim()
      const bankName = (e.bankName ?? '').trim()
      const missing: string[] = []
      if (!bankAccount) missing.push('bank account')
      if (!ifsc) missing.push('IFSC')
      if (missing.length) {
        warnings.push(`${label(e)} is BANK-mode but missing ${missing.join(' & ')} — cannot be paid via this file.`)
      }
      bank.push({ name: e.name, empId: e.empId, bankAccount, ifsc, bankName, netPay })
      bankTotal += netPay
    }
  }

  const bankSum = round2(bankTotal)
  const cashSum = round2(cashTotal)
  return {
    bank,
    cash,
    warnings,
    totals: { bank: bankSum, cash: cashSum, grand: round2(bankSum + cashSum) },
  }
}
