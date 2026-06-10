import type { CycleContext, OvertimeRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

export function HospitalFormIV({ ctx, ot }: { ctx: CycleContext; ot: OvertimeRow[] }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>OVERTIME MUSTER ROLL</h2>
        <p>Form IV [Rule 25] — Tamil Nadu Factories Act</p>
        <p><strong>{establishment.name}</strong> — {period}</p>
        <p>Address: {establishment.address} | Reg. No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>S.No</th>
            <th rowSpan={2}>Emp ID</th>
            <th rowSpan={2}>Name</th>
            <th rowSpan={2}>Designation</th>
            <th colSpan={daysInMonth}>Daily OT Hours</th>
            <th rowSpan={2}>Total OT Hrs</th>
            <th rowSpan={2}>Normal Rate (₹/hr)</th>
            <th rowSpan={2}>OT Rate (₹/hr)</th>
            <th rowSpan={2}>Normal Earnings</th>
            <th rowSpan={2}>OT Earnings</th>
            <th rowSpan={2}>Total Earnings</th>
          </tr>
          <tr>
            {days.map((d) => <th key={d} style={{ minWidth: '14px' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {ot.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.empId}</td>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              {row.dailyOt.map((h, d) => (
                <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{h > 0 ? h : '-'}</td>
              ))}
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.totalOtHours}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.normalHoursRate)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otRate)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.normalEarnings)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otEarnings)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.normalEarnings + row.otEarnings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
