import type { CycleContext, OvertimeRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'
import { SplitRegister } from './split-register'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

export function HospitalFormIV({ ctx, ot, startIndex = 0 }: { ctx: CycleContext; ot: OvertimeRow[]; startIndex?: number }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  return (
    <SplitRegister<OvertimeRow>
      title="FORM No. IV — REGISTER OF OVERTIME (MUSTER ROLL CUM WAGES)"
      ruleLine="Prescribed under Rule 25(2) of Minimum Wages (Tamil Nadu) Rules, 1953"
      periodLine={`Overtime Register for the Month of ${period}`}
      establishment={establishment}
      rows={ot}
      startIndex={startIndex}
      daysInMonth={daysInMonth}
      dayGroupLabel="Date on which Overtime Worked (hours)"
      rowKey={(r) => r.employeeId}
      identityHead={<>
        <th rowSpan={2}>S.No</th>
        <th rowSpan={2}>Name</th>
        <th rowSpan={2}>Father&apos;s / Husband&apos;s Name</th>
        <th rowSpan={2}>Sex</th>
        <th rowSpan={2}>Designation &amp; Department</th>
      </>}
      summaryHead={<>
        <th rowSpan={2}>Total Overtime worked</th>
        <th rowSpan={2}>Normal Rate</th>
        <th rowSpan={2}>Overtime Rate</th>
        <th rowSpan={2}>Normal Earnings</th>
        <th rowSpan={2}>Overtime Earnings</th>
        <th rowSpan={2}>Total Earnings</th>
      </>}
      identityCells={(row, sno) => <>
        <td style={{ textAlign: 'center' }}>{sno}</td>
        <td>{row.name}</td>
        <td>{row.fatherSpouseName || 'Nil'}</td>
        <td style={{ textAlign: 'center' }}>{row.sex}</td>
        <td>{row.designation}</td>
      </>}
      dayCell={(row, d) => (
        <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{row.dailyOt[d] > 0 ? row.dailyOt[d] : '-'}</td>
      )}
      summaryCells={(row) => <>
        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.totalOtHours > 0 ? row.totalOtHours : 'Nil'}</td>
        <td style={{ textAlign: 'right' }}>{fmt(row.normalHoursRate)}</td>
        <td style={{ textAlign: 'right' }}>{fmt(row.otRate)}</td>
        <td style={{ textAlign: 'right' }}>{fmt(row.normalEarnings)}</td>
        <td style={{ textAlign: 'right' }}>{fmt(row.otEarnings)}</td>
        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.normalEarnings + row.otEarnings)}</td>
      </>}
    />
  )
}
