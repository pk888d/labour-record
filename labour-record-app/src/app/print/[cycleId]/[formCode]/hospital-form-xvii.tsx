import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

function WageSlipCard({ row, establishment, period }: {
  row: WagesRow
  establishment: CycleContext['establishment']
  period: string
}) {
  return (
    <div style={{
      border: '1px solid #000',
      padding: '6px',
      fontSize: '9px',
      pageBreakInside: 'avoid',
    }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '4px' }}>
        WAGE SLIP — {establishment.name} — {period}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '4px' }}>
        <div>Emp No: <strong>{row.empId}</strong></div>
        <div>Name: <strong>{row.name}</strong></div>
        <div>Designation: {row.designation}</div>
        <div>Dept: {row.department ?? '-'}</div>
        <div>Days Worked: {row.daysWorked}</div>
        <div>Payment Date: {row.paymentDate || '-'}</div>
      </div>
      <table style={{ width: '100%', marginBottom: '4px' }}>
        <thead>
          <tr>
            <th colSpan={2}>Earnings</th>
            <th colSpan={2}>Deductions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic</td><td style={{ textAlign: 'right' }}>{fmt(row.basic)}</td>
            <td>PF</td><td style={{ textAlign: 'right' }}>{fmt(row.pf)}</td>
          </tr>
          <tr>
            <td>DA</td><td style={{ textAlign: 'right' }}>{fmt(row.da)}</td>
            <td>ESI</td><td style={{ textAlign: 'right' }}>{fmt(row.esi)}</td>
          </tr>
          <tr>
            <td>HRA</td><td style={{ textAlign: 'right' }}>{fmt(row.hra)}</td>
            <td>LWF</td><td style={{ textAlign: 'right' }}>{fmt(row.lwf)}</td>
          </tr>
          <tr>
            <td>Other Allow</td><td style={{ textAlign: 'right' }}>{fmt(row.otherAllowances)}</td>
            <td>Fine Ded</td><td style={{ textAlign: 'right' }}>{fmt(row.fineDeduction)}</td>
          </tr>
          <tr>
            <td></td><td></td>
            <td>Other Ded</td><td style={{ textAlign: 'right' }}>{fmt(row.otherDeductions)}</td>
          </tr>
          <tr>
            <td></td><td></td>
            <td>Advance</td><td style={{ textAlign: 'right' }}>{fmt(row.advanceRecovered)}</td>
          </tr>
          <tr style={{ fontWeight: 'bold', borderTop: '1px solid #000' }}>
            <td>Gross</td><td style={{ textAlign: 'right' }}>{fmt(row.grossEarnings)}</td>
            <td>Net Wage</td><td style={{ textAlign: 'right' }}>{fmt(row.netWage)}</td>
          </tr>
        </tbody>
      </table>
      <div>Employee Signature: ________________________</div>
    </div>
  )
}

export function HospitalFormXVII({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header no-print">
        <h2>WAGE SLIPS</h2>
        <p>Form XVII [Rule 78(1)(a)(ii)] — {establishment.name} — {period}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {wages.map((row) => (
          <WageSlipCard key={row.employeeId} row={row} establishment={establishment} period={period} />
        ))}
      </div>
    </div>
  )
}
