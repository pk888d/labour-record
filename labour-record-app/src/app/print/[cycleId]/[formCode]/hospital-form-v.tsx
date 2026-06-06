import type { CycleContext, MusterRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function HospitalFormV({ ctx, muster }: { ctx: CycleContext; muster: MusterRow[] }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>MUSTER ROLL</h2>
        <p>Form V [Rule 77] — Tamil Nadu Payment of Wages Act</p>
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
            <th colSpan={daysInMonth}>Attendance ({period})</th>
            <th rowSpan={2}>Total P</th>
            <th rowSpan={2}>Total A</th>
            <th rowSpan={2}>Work Hrs</th>
            <th rowSpan={2}>Rest</th>
            <th rowSpan={2}>Remarks</th>
          </tr>
          <tr>
            {days.map((d) => (
              <th key={d} style={{ minWidth: '14px' }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {muster.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.empId}</td>
              <td>{row.name}</td>
              <td>{row.designation}</td>
              {row.dailyMarks.map((m, d) => (
                <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{m || '-'}</td>
              ))}
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.totalPresent}</td>
              <td style={{ textAlign: 'center' }}>{row.totalAbsent}</td>
              <td style={{ textAlign: 'center' }}>{row.workStartTime}{row.workEndTime ? `–${row.workEndTime}` : ''}</td>
              <td style={{ textAlign: 'center' }}>{row.restInterval}</td>
              <td>{row.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '16px', fontSize: '9px' }}>
        P=Present A=Absent H=Half-day HO=Holiday WO=Week Off L=Leave OT=Overtime PH=Public Holiday
      </div>
    </div>
  )
}
