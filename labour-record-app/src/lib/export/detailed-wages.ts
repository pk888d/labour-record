// Pure builder for the INTERNAL Detailed Wages report (TEC-26).
//
// This is a NON-STATUTORY, internal working sheet for the accountant's own
// review before filing — NOT a statutory form (it deliberately carries no rule
// citation and no "Form" naming). It lays out every wage component per employee
// for a cycle plus a computed total-deductions column and a grand totals row.
//
// It is pure data shaping / summing only. All figures MUST be supplied by the
// caller from the same wage-derivation sources as the Wage Register and
// Overtime register (see src/lib/export/form-data.ts getWagesData /
// getOvertimeData) so this report always reconciles with the register and
// salary slips — nothing is recomputed here.
//
// There is deliberately no "leave wages" column: leave days are already paid
// through the normal wage-days proration (attendance-calculator.ts), and no
// separate rupee figure for "leave wages" exists anywhere in the data model.
// Inventing a column that would always read 0 would be misleading in a
// report whose whole purpose is completeness (same "never invent a figure"
// convention as TEC-30/TEC-38).
import { round2 } from '@/lib/money'

export type DetailedWagesInput = {
  name: string
  empId: string
  daysWorked: number
  basic: number
  da: number
  hra: number
  otherAllowances: number
  // Overtime earnings come from a separate register (getOvertimeData) and
  // are not part of the Wage Register's gross — optional, defaults to 0 for
  // employees with no overtime this cycle.
  otEarnings?: number
  grossEarnings: number
  pf: number
  esi: number
  lwf: number
  fineDeduction: number
  otherDeductions: number
  advanceRecovered: number
  netWage: number
  paymentDate: string
  receiptRef: string
}

export type DetailedWagesRow = {
  name: string
  empId: string
  daysWorked: number
  basic: number
  da: number
  hra: number
  otherAllowances: number
  otEarnings: number
  grossEarnings: number
  pf: number
  esi: number
  lwf: number
  fineDeduction: number
  otherDeductions: number
  advanceRecovered: number
  totalDeductions: number
  netWage: number
  paymentDate: string
  receiptRef: string
}

export type DetailedWagesTotals = {
  basic: number
  da: number
  hra: number
  otherAllowances: number
  otEarnings: number
  grossEarnings: number
  pf: number
  esi: number
  lwf: number
  fineDeduction: number
  otherDeductions: number
  advanceRecovered: number
  totalDeductions: number
  netWage: number
}

export type DetailedWagesResult = {
  rows: DetailedWagesRow[]
  totals: DetailedWagesTotals
}

const zeroTotals = (): DetailedWagesTotals => ({
  basic: 0,
  da: 0,
  hra: 0,
  otherAllowances: 0,
  otEarnings: 0,
  grossEarnings: 0,
  pf: 0,
  esi: 0,
  lwf: 0,
  fineDeduction: 0,
  otherDeductions: 0,
  advanceRecovered: 0,
  totalDeductions: 0,
  netWage: 0,
})

export function buildDetailedWagesRows(employees: DetailedWagesInput[]): DetailedWagesResult {
  const rows: DetailedWagesRow[] = []
  const totals = zeroTotals()

  for (const e of employees) {
    const otEarnings = e.otEarnings ?? 0
    const totalDeductions = round2(
      e.pf + e.esi + e.lwf + e.fineDeduction + e.otherDeductions + e.advanceRecovered,
    )

    rows.push({
      name: e.name,
      empId: e.empId,
      daysWorked: e.daysWorked,
      basic: e.basic,
      da: e.da,
      hra: e.hra,
      otherAllowances: e.otherAllowances,
      otEarnings,
      grossEarnings: e.grossEarnings,
      pf: e.pf,
      esi: e.esi,
      lwf: e.lwf,
      fineDeduction: e.fineDeduction,
      otherDeductions: e.otherDeductions,
      advanceRecovered: e.advanceRecovered,
      totalDeductions,
      netWage: e.netWage,
      paymentDate: e.paymentDate,
      receiptRef: e.receiptRef,
    })

    totals.basic += e.basic
    totals.da += e.da
    totals.hra += e.hra
    totals.otherAllowances += e.otherAllowances
    totals.otEarnings += otEarnings
    totals.grossEarnings += e.grossEarnings
    totals.pf += e.pf
    totals.esi += e.esi
    totals.lwf += e.lwf
    totals.fineDeduction += e.fineDeduction
    totals.otherDeductions += e.otherDeductions
    totals.advanceRecovered += e.advanceRecovered
    totals.totalDeductions += totalDeductions
    totals.netWage += e.netWage
  }

  // Round every money total once at the end to avoid float drift.
  for (const k of Object.keys(totals) as (keyof DetailedWagesTotals)[]) {
    totals[k] = round2(totals[k])
  }

  return { rows, totals }
}
