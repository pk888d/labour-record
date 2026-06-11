import type { CycleContext, MusterRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function ShopFormV({ ctx, muster }: { ctx: CycleContext; muster: MusterRow[] }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>FORM V — REGISTER OF EMPLOYMENT</h2>
        <p>Prescribed under Rule 15 of the Tamil Nadu Shops and Establishments Rules, 1948</p>
        <p style={{ fontWeight: 'bold' }}>Register of Employment for the Month of {period}</p>
        <p>Name and Address of the Establishment: <strong>{establishment.name}</strong>, {establishment.address}</p>
        <p>Name of the Manager/In-charge: {establishment.managerName} | Registration Certificate No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>S.No</th>
            <th rowSpan={2}>Name of the Employee</th>
            <th rowSpan={2}>EID No</th>
            <th rowSpan={2}>Time work begins</th>
            <th rowSpan={2}>Rest Interval</th>
            <th rowSpan={2}>Time work ends</th>
            <th colSpan={daysInMonth}>Daily attendance ({period})</th>
            <th rowSpan={2}>Total Days Worked</th>
            <th rowSpan={2}>Total Days Absent</th>
            <th rowSpan={2}>Days on Leave</th>
            <th rowSpan={2}>Remarks</th>
          </tr>
          <tr>
            {days.map((d) => <th key={d} style={{ minWidth: '13px', fontWeight: 'normal' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {muster.map((row, i) => {
            const workedDays = row.dailyMarks.filter((m) => m === 'P' || m === 'OT').length
            const leaveDays = row.dailyMarks.filter((m) => m === 'L').length
            const absentDays = row.dailyMarks.filter((m) => m === 'A').length
            return (
              <tr key={row.employeeId}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{row.name}</td>
                <td>{row.empId}</td>
                <td style={{ textAlign: 'center' }}>{row.workStartTime || 'Nil'}</td>
                <td style={{ textAlign: 'center' }}>{row.restInterval || 'Nil'}</td>
                <td style={{ textAlign: 'center' }}>{row.workEndTime || 'Nil'}</td>
                {row.dailyMarks.map((m, d) => (
                  <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{m || '-'}</td>
                ))}
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{workedDays}</td>
                <td style={{ textAlign: 'center' }}>{absentDays}</td>
                <td style={{ textAlign: 'center' }}>{leaveDays}</td>
                <td>{row.remarks || 'Nil'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div style={{ marginTop: '10px', fontSize: '9px' }}>
        P = Present · A = Absent · H = Holiday / Weekly off · L = Leave · OT = Overtime
      </div>
    </div>
  )
}
