import type { CycleContext, OvertimeRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

export function HospitalFormIV({ ctx, ot, startIndex = 0 }: { ctx: CycleContext; ot: OvertimeRow[]; startIndex?: number }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>FORM No. IV — REGISTER OF OVERTIME (MUSTER ROLL CUM WAGES)</h2>
        <p>Prescribed under Rule 25(2) of Minimum Wages (Tamil Nadu) Rules, 1953</p>
        <p style={{ fontWeight: 'bold' }}>Overtime Register for the Month of {period}</p>
        <p>Name and Address of the Establishment: <strong>{establishment.name}</strong>, {establishment.address}</p>
        <p>Name of the Manager/In-charge: {establishment.managerName} | Registration Certificate No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>S.No</th>
            <th rowSpan={2}>Name</th>
            <th rowSpan={2}>Father&apos;s / Husband&apos;s Name</th>
            <th rowSpan={2}>Sex</th>
            <th rowSpan={2}>Designation &amp; Department</th>
            <th colSpan={daysInMonth}>Date on which Overtime Worked (hours)</th>
            <th rowSpan={2}>Total Overtime worked</th>
            <th rowSpan={2}>Normal Rate</th>
            <th rowSpan={2}>Overtime Rate</th>
            <th rowSpan={2}>Normal Earnings</th>
            <th rowSpan={2}>Overtime Earnings</th>
            <th rowSpan={2}>Total Earnings</th>
          </tr>
          <tr>
            {days.map((d) => <th key={d} style={{ minWidth: '13px', fontWeight: 'normal' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {ot.map((row, i) => {
            const hasOt = row.totalOtHours > 0
            return (
              <tr key={row.employeeId}>
                <td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>
                <td>{row.name}</td>
                <td>{row.fatherSpouseName || 'Nil'}</td>
                <td style={{ textAlign: 'center' }}>{row.sex}</td>
                <td>{row.designation}</td>
                {row.dailyOt.map((h, d) => (
                  <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{h > 0 ? h : '-'}</td>
                ))}
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{hasOt ? row.totalOtHours : 'Nil'}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.normalHoursRate)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.otRate)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.normalEarnings)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(row.otEarnings)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.normalEarnings + row.otEarnings)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
