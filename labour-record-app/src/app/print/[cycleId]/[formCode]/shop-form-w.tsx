import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

// Statutory columns (15)-(29): Advance Paid, Advance Recovery Pending at
// beginning, Advance Recovered, Pending Recovery, Deduction imposed on
// Damages/Loss/Fines, Deduction Pending at beginning, Deduction made on
// Damages/Loss/Fines, Pending Recovery, Any other Deductions, Total
// Deductions, Net Wages, Date of Payment, Unpaid accumulations, Rate at which
// subsistence allowance calculated, Receipt by Employee/Bank Transaction.
//
// WagesRow has no separate "opening/pending" balances or a distinct
// "amount imposed" vs "amount recovered" split for advances or damages/loss —
// those render Nil rather than inventing figures. Total Deductions (24) is
// the SAME full amount (PF+ESI+LWF+Fine+Other+Advance) already shown in Part
// 1's PF/ESI/LWF columns, so it reconciles arithmetically with Gross Wages
// (11) − Total Deductions (24) = Net Wages (25) = row.netWage.
function totalDeductions(r: WagesRow): number {
  return r.pf + r.esi + r.lwf + r.fineDeduction + r.otherDeductions + r.advanceRecovered
}

export function ShopFormW({ ctx, wages, startIndex = 0 }: { ctx: CycleContext; wages: WagesRow[]; startIndex?: number }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  const header = (continued: boolean) => (
    <div className="form-header">
      <h2>FORM W — REGISTER OF WAGES{continued ? ' (continued)' : ''}</h2>
      <p>Prescribed under Rule 16(1) of the Tamil Nadu Shops and Establishments Rules, 1948</p>
      <p style={{ fontWeight: 'bold' }}>Register of Wages for the Month of {period}</p>
      <p>Name and Address of the Establishment: <strong>{establishment.name}</strong>, {establishment.address}</p>
      <p>Name of the Manager/In-charge: {establishment.managerName} | Registration Certificate No.: {establishment.regCertNo}</p>
    </div>
  )

  return (
    <>
      <div className="form-page" style={{ breakAfter: 'page' }}>
        {header(false)}
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name of the Employee</th>
              <th>Employee ID</th>
              <th>Number of Days Worked</th>
              <th>Basic Wages</th>
              <th>Dearness Allowance</th>
              <th>House Rent Allowance</th>
              <th>Other Allowances</th>
              <th>Overtime Wages</th>
              <th>Leave Wages</th>
              <th>Gross Wages</th>
              <th>PF</th>
              <th>ESI</th>
              <th>Labour Welfare Fund</th>
            </tr>
            <tr>{Array.from({ length: 14 }, (_, i) => <th key={i} style={{ fontWeight: 'normal' }}>({i + 1})</th>)}</tr>
          </thead>
          <tbody>
            {wages.map((row, i) => (
              <tr key={row.employeeId}>
                <td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>
                <td>{row.name}</td>
                <td>{row.empId}</td>
                <td style={{ textAlign: 'center' }}>{row.daysWorked}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.basic)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.da)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.hra)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.otherAllowances)}</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.grossEarnings)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.pf)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.esi)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.lwf)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-page">
        {header(true)}
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name of the Employee</th>
              <th>Employee ID</th>
              <th>Advance Paid</th>
              <th>Advance Recovery Pending at Beginning of Month</th>
              <th>Advance Recovered</th>
              <th>Pending Recovery</th>
              <th>Deduction Imposed on Damages, Loss or Fines</th>
              <th>Deduction Pending at Beginning of Month</th>
              <th>Deduction Made on Damages, Loss or Fines</th>
              <th>Pending Recovery</th>
              <th>Any Other Deductions</th>
              <th>Total Deductions</th>
              <th>Net Wages</th>
              <th>Date of Payment</th>
              <th>Unpaid Accumulations</th>
              <th>Rate at Which Subsistence Allowance Calculated and Amount Paid</th>
              <th>Receipt by Employee / Bank Transaction I.O. and Dates</th>
            </tr>
            <tr>{Array.from({ length: 15 }, (_, i) => <th key={i} style={{ fontWeight: 'normal' }}>({i + 15})</th>)}</tr>
          </thead>
          <tbody>
            {wages.map((row, i) => (
              <tr key={row.employeeId}>
                <td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>
                <td>{row.name}</td>
                <td>{row.empId}</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.advanceRecovered)}</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.fineDeduction)}</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.otherDeductions)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(totalDeductions(row))}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.netWage)}</td>
                <td style={{ textAlign: 'center' }}>{row.paymentDate || 'Nil'}</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td>{row.receiptRef || 'Nil'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
