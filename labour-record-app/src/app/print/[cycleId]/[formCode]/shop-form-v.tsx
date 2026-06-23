import type { CycleContext, MusterRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'
import { SplitRegister } from './split-register'

export function ShopFormV({ ctx, muster, startIndex = 0 }: { ctx: CycleContext; muster: MusterRow[]; startIndex?: number }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const legend = (
    <div style={{ marginTop: '10px', fontSize: '9px' }}>
      P = Present · A = Absent · H = Holiday / Weekly off · L = Leave · OT = Overtime
    </div>
  )
  return (
    <SplitRegister<MusterRow>
      title="FORM V — REGISTER OF EMPLOYMENT"
      ruleLine="Prescribed under Rule 38(1)(a) of the Tamil Nadu Shops and Establishments Rules, 1958"
      periodLine={`Register of Employment for the Month of ${period}`}
      establishment={establishment}
      rows={muster}
      startIndex={startIndex}
      daysInMonth={daysInMonth}
      dayGroupLabel={`Daily attendance (${period})`}
      rowKey={(r) => r.employeeId}
      legend={legend}
      identityHead={<>
        <th rowSpan={2}>S.No</th>
        <th rowSpan={2}>Name of the Employee</th>
        <th rowSpan={2}>EID No</th>
        <th rowSpan={2}>Time work begins</th>
        <th rowSpan={2}>Rest Interval</th>
        <th rowSpan={2}>Time work ends</th>
      </>}
      summaryHead={<>
        <th rowSpan={2}>Total Days Worked</th>
        <th rowSpan={2}>Total Days Absent</th>
        <th rowSpan={2}>Days on Leave</th>
        <th rowSpan={2}>Remarks</th>
      </>}
      identityCells={(row, sno) => <>
        <td style={{ textAlign: 'center' }}>{sno}</td>
        <td>{row.name}</td>
        <td>{row.empId}</td>
        <td style={{ textAlign: 'center' }}>{row.workStartTime || 'Nil'}</td>
        <td style={{ textAlign: 'center' }}>{row.restInterval || 'Nil'}</td>
        <td style={{ textAlign: 'center' }}>{row.workEndTime || 'Nil'}</td>
      </>}
      dayCell={(row, d) => (
        <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{row.dailyMarks[d] || '-'}</td>
      )}
      summaryCells={(row) => {
        const worked = row.dailyMarks.filter((m) => m === 'P' || m === 'OT').length
        const leave = row.dailyMarks.filter((m) => m === 'L').length
        const absent = row.dailyMarks.filter((m) => m === 'A').length
        return <>
          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{worked}</td>
          <td style={{ textAlign: 'center' }}>{absent}</td>
          <td style={{ textAlign: 'center' }}>{leave}</td>
          <td>{row.remarks || 'Nil'}</td>
        </>
      }}
    />
  )
}
