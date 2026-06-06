import type { CycleContext, DeductionRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => n === 0 ? 'Nil' : n.toFixed(2)

export function HospitalFormII({ ctx, deductions }: { ctx: CycleContext; deductions: DeductionRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF DEDUCTIONS FOR DAMAGE OR LOSS</h2>
        <p>Form II [Rule 4] — Tamil Nadu Payment of Wages Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      {deductions.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>No deductions recorded for this period.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Damage Date</th>
              <th>Description</th>
              <th>Deduction Amount (₹)</th>
              <th>Recovered (₹)</th>
              <th>Pending (₹)</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {deductions.map((row, i) => (
              <tr key={row.id}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{row.empId}</td>
                <td>{row.name}</td>
                <td style={{ textAlign: 'center' }}>{row.damageDate}</td>
                <td>{row.description}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.deductionAmount)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.recovered)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.pendingRecovery)}</td>
                <td>{row.remarks}</td>
              </tr>
            ))}
            <tr className="totals-row">
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL</td>
              <td style={{ textAlign: 'right' }}>{fmt(deductions.reduce((s, r) => s + r.deductionAmount, 0))}</td>
              <td style={{ textAlign: 'right' }}>{fmt(deductions.reduce((s, r) => s + r.recovered, 0))}</td>
              <td style={{ textAlign: 'right' }}>{fmt(deductions.reduce((s, r) => s + r.pendingRecovery, 0))}</td>
              <td />
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
