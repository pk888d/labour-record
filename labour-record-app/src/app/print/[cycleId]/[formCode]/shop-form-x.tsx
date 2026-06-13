import type { CycleContext, LeaveRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const n0 = (v: number) => (v ? String(v) : 'Nil')

export function ShopFormX({ ctx, leave }: { ctx: CycleContext; leave: LeaveRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>FORM X — REGISTER OF LEAVE AND SOCIAL SECURITY BENEFITS</h2>
        <p>Prescribed under Rule 16(1) of the Tamil Nadu Shops and Establishments Rules, 1948</p>
        <p style={{ fontWeight: 'bold' }}>Register for the Month of {period}</p>
        <p>Name and Address of the Establishment: <strong>{establishment.name}</strong>, {establishment.address}</p>
        <p>Name of the Manager/In-charge: {establishment.managerName} | Registration Certificate No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>S.No</th>
            <th rowSpan={2}>Name of the Employee</th>
            <th rowSpan={2}>EID</th>
            <th colSpan={4}>Earned Leaves</th>
            <th rowSpan={2}>Medical Leave</th>
            <th rowSpan={2}>Other Leave</th>
            <th rowSpan={2}>Remarks</th>
          </tr>
          <tr>
            <th>Leave at beginning of month</th>
            <th>Leave earned during period</th>
            <th>Leave availed this month</th>
            <th>Leave balance at end</th>
          </tr>
          <tr>{Array.from({ length: 9 }, (_, i) => <th key={i} style={{ fontWeight: 'normal' }}>({i + 1})</th>)}</tr>
        </thead>
        <tbody>
          {leave.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.name}</td>
              <td>{row.empId}</td>
              <td style={{ textAlign: 'center' }}>{n0(row.earnedLeaveOpening)}</td>
              <td style={{ textAlign: 'center' }}>{n0(row.earnedDuring)}</td>
              <td style={{ textAlign: 'center' }}>{n0(row.earnedAvailed)}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{n0(row.earnedClosing)}</td>
              <td style={{ textAlign: 'center' }}>{n0(row.medicalLeave)}</td>
              <td style={{ textAlign: 'center' }}>{n0(row.otherLeave)}</td>
              <td>{row.remarks || 'Nil'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
