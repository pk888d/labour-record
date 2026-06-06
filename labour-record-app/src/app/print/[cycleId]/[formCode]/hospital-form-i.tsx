import type { CycleContext, FineRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => n === 0 ? 'Nil' : n.toFixed(2)

export function HospitalFormI({ ctx, fines }: { ctx: CycleContext; fines: FineRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>REGISTER OF FINES</h2>
        <p>Form I [Rule 3] — Tamil Nadu Payment of Wages Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      {fines.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>No fines recorded for this period.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Offence Date</th>
              <th>Offence Description</th>
              <th>Fine Amount (₹)</th>
              <th>Recovered (₹)</th>
              <th>Pending (₹)</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {fines.map((row, i) => (
              <tr key={row.id}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{row.empId}</td>
                <td>{row.name}</td>
                <td style={{ textAlign: 'center' }}>{row.offenceDate}</td>
                <td>{row.offenceDescription}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.fineAmount)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.recovered)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.pendingRecovery)}</td>
                <td>{row.remarks}</td>
              </tr>
            ))}
            <tr className="totals-row">
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL</td>
              <td style={{ textAlign: 'right' }}>{fmt(fines.reduce((s, r) => s + r.fineAmount, 0))}</td>
              <td style={{ textAlign: 'right' }}>{fmt(fines.reduce((s, r) => s + r.recovered, 0))}</td>
              <td style={{ textAlign: 'right' }}>{fmt(fines.reduce((s, r) => s + r.pendingRecovery, 0))}</td>
              <td />
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
