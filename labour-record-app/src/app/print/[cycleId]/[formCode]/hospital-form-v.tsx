import type { CycleContext, MusterRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

export function HospitalFormV({ ctx, muster }: { ctx: CycleContext; muster: MusterRow[] }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>FORM No. V — REGISTER OF MUSTER ROLL</h2>
        <p>Prescribed under Rule 26 of Minimum Wages (Tamil Nadu) Rules, 1953</p>
        <p>Muster Roll for the Month of <strong>{period}</strong></p>
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
            <th colSpan={daysInMonth}>Daily attendance ({period})</th>
            <th rowSpan={2}>Days Worked</th>
            <th rowSpan={2}>Days Leave</th>
            <th rowSpan={2}>Days Absent</th>
            <th rowSpan={2}>Days counted for wages</th>
            <th rowSpan={2}>Remarks</th>
          </tr>
          <tr>
            {days.map((d) => <th key={d} style={{ minWidth: '13px', fontWeight: 'normal' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {muster.map((row, i) => {
            const leaveDays = row.dailyMarks.filter((m) => m === 'L').length
            const wageDays = row.dailyMarks.filter((m) => m === 'P' || m === 'OT' || m === 'H' || m === 'L').length
            return (
              <tr key={row.employeeId}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{row.name}</td>
                <td>{row.fatherSpouseName || 'Nil'}</td>
                <td style={{ textAlign: 'center' }}>{row.sex}</td>
                <td>{row.designation}</td>
                {row.dailyMarks.map((m, d) => (
                  <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{m || '-'}</td>
                ))}
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.totalPresent}</td>
                <td style={{ textAlign: 'center' }}>{leaveDays}</td>
                <td style={{ textAlign: 'center' }}>{row.totalAbsent}</td>
                <td style={{ textAlign: 'center' }}>{wageDays}</td>
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
