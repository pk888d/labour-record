import type { CycleContext, LeaveRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function ShopFormX({ ctx, leave }: { ctx: CycleContext; leave: LeaveRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>LEAVE REGISTER</h2>
        <p>Form X [Rule 16] — Tamil Nadu Shops and Establishments Act</p>
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
            <th>EL Opening</th>
            <th>EL Earned</th>
            <th>EL Availed</th>
            <th>EL Closing</th>
            <th>Medical Leave</th>
            <th>Other Leave</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {leave.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.empId}</td>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              <td style={{ textAlign: 'center' }}>{row.earnedLeaveOpening}</td>
              <td style={{ textAlign: 'center' }}>{row.earnedDuring}</td>
              <td style={{ textAlign: 'center' }}>{row.earnedAvailed}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.earnedClosing}</td>
              <td style={{ textAlign: 'center' }}>{row.medicalLeave}</td>
              <td style={{ textAlign: 'center' }}>{row.otherLeave}</td>
              <td>{row.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
