import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

export function HospitalFormXII({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const totals = {
    daysWorked: wages.reduce((s, r) => s + r.daysWorked, 0),
    basic: wages.reduce((s, r) => s + r.basic, 0),
    da: wages.reduce((s, r) => s + r.da, 0),
    hra: wages.reduce((s, r) => s + r.hra, 0),
    otherAllowances: wages.reduce((s, r) => s + r.otherAllowances, 0),
    grossEarnings: wages.reduce((s, r) => s + r.grossEarnings, 0),
    pf: wages.reduce((s, r) => s + r.pf, 0),
    esi: wages.reduce((s, r) => s + r.esi, 0),
    lwf: wages.reduce((s, r) => s + r.lwf, 0),
    fineDeduction: wages.reduce((s, r) => s + r.fineDeduction, 0),
    otherDeductions: wages.reduce((s, r) => s + r.otherDeductions, 0),
    advanceRecovered: wages.reduce((s, r) => s + r.advanceRecovered, 0),
    netWage: wages.reduce((s, r) => s + r.netWage, 0),
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF WAGES</h2>
        <p>Form XII [Rule 78(1)(a)(i)] — Tamil Nadu Shops and Establishments Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Designation</th>
            <th>Dept</th>
            <th>Days</th>
            <th>Basic</th>
            <th>DA</th>
            <th>HRA</th>
            <th>Other Allow</th>
            <th>Gross</th>
            <th>PF</th>
            <th>ESI</th>
            <th>LWF</th>
            <th>Fine Ded</th>
            <th>Other Ded</th>
            <th>Advance</th>
            <th>Net Wage</th>
            <th>Paid On</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {wages.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.empId}</td>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              <td>{row.department ?? ''}</td>
              <td style={{ textAlign: 'center' }}>{row.daysWorked}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.basic)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.da)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.hra)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otherAllowances)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.grossEarnings)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.pf)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.esi)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.lwf)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.fineDeduction)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otherDeductions)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.advanceRecovered)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.netWage)}</td>
              <td style={{ textAlign: 'center' }}>{row.paymentDate}</td>
              <td>{row.receiptRef}</td>
            </tr>
          ))}
          <tr className="totals-row">
            <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL</td>
            <td style={{ textAlign: 'center' }}>{totals.daysWorked}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.basic)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.da)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.hra)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.otherAllowances)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.grossEarnings)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.pf)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.esi)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.lwf)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.fineDeduction)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.otherDeductions)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.advanceRecovered)}</td>
            <td style={{ textAlign: 'right' }}>{fmt(totals.netWage)}</td>
            <td colSpan={2} />
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '9px' }}>
        <div>Manager/Employer Signature: ____________________________</div>
        <div>Date: ____________________________</div>
      </div>
    </div>
  )
}
