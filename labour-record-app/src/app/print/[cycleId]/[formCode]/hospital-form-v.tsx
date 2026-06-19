import type { CycleContext, MusterRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function HospitalFormV({ ctx, muster, startIndex = 0 }: { ctx: CycleContext; muster: MusterRow[]; startIndex?: number }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const dash = '—'

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>FORM No. V — REGISTER OF MUSTER ROLL</h2>
        <p>Prescribed under Rule 27(5) of the Minimum Wages (Tamil Nadu) Rules, 1963</p>
        <p style={{ fontWeight: 'bold' }}>Register of Muster Roll for the Month of {period}</p>
        <p>Name and Address of the Establishment: <strong>{establishment.name}</strong>, {establishment.address}</p>
        <p>Name of the Manager/In-charge: {establishment.managerName} | Registration Certificate No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>S.No</th>
            <th rowSpan={2}>Name of the worker</th>
            <th rowSpan={2}>Father&apos;s / Husband&apos;s Name</th>
            <th rowSpan={2}>Sex</th>
            <th rowSpan={2}>Nature of work</th>
            <th rowSpan={2}>Period of Work</th>
            <th rowSpan={2}>Daily Hours of work done incl. overtime (if any)</th>
            <th rowSpan={2}>Time work commenced</th>
            <th rowSpan={2}>Time work ceased</th>
            <th rowSpan={2}>Rest Interval</th>
            <th rowSpan={2}>Days Worked</th>
            <th colSpan={daysInMonth}>Daily attendance ({period})</th>
            <th rowSpan={2}>No. of Days total Hrs worked incl. weekly holidays</th>
            <th rowSpan={2}>No. of Days leave granted with wages</th>
            <th rowSpan={2}>No. of Days Absent</th>
            <th rowSpan={2}>No. of Days counted for wages</th>
            <th rowSpan={2}>Remarks</th>
          </tr>
          <tr>
            {days.map((d) => <th key={d} style={{ minWidth: '13px', fontWeight: 'normal' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {muster.map((row, i) => {
            // Days actually worked (P / OT only — holidays are NOT worked days).
            const workedDays = row.dailyMarks.filter((m) => m === 'P' || m === 'OT').length
            const holidayDays = row.dailyMarks.filter((m) => m === 'H').length
            const leaveDays = row.dailyMarks.filter((m) => m === 'L').length
            const absentDays = row.dailyMarks.filter((m) => m === 'A').length
            // Counted for wages = worked + paid weekly-offs/holidays + paid leave.
            const wageDays = workedDays + holidayDays + leaveDays
            return (
              <tr key={row.employeeId}>
                <td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>
                <td>{row.name}</td>
                <td>{row.fatherSpouseName || 'Nil'}</td>
                <td style={{ textAlign: 'center' }}>{row.sex}</td>
                <td>{row.designation}</td>
                <td style={{ textAlign: 'center' }}>{dash}</td>
                <td style={{ textAlign: 'center' }}>{dash}</td>
                <td style={{ textAlign: 'center' }}>{row.workStartTime || dash}</td>
                <td style={{ textAlign: 'center' }}>{row.workEndTime || dash}</td>
                <td style={{ textAlign: 'center' }}>{row.restInterval || dash}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{workedDays}</td>
                {row.dailyMarks.map((m, d) => (
                  <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{m || '-'}</td>
                ))}
                <td style={{ textAlign: 'center' }}>{workedDays + holidayDays}</td>
                <td style={{ textAlign: 'center' }}>{leaveDays}</td>
                <td style={{ textAlign: 'center' }}>{absentDays}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{wageDays}</td>
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
