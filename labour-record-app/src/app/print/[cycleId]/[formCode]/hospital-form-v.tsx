import type { CycleContext, MusterRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'
import { SplitRegister } from './split-register'

export function HospitalFormV({ ctx, muster, startIndex = 0 }: { ctx: CycleContext; muster: MusterRow[]; startIndex?: number }) {
  const { establishment, cycle, daysInMonth } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
  const dash = '—'
  const legend = (
    <div style={{ marginTop: '10px', fontSize: '9px' }}>
      P = Present · A = Absent · H = Holiday / Weekly off · L = Leave · OT = Overtime
    </div>
  )
  // Faithful to the pre-split Form V: same identity + summary columns (including the
  // statutory "Period of Work" and "Daily Hours of work done incl. overtime"
  // columns and the "Days Worked" column) — only the day grid is split across 2 pages.
  return (
    <SplitRegister<MusterRow>
      title="FORM No. V — REGISTER OF MUSTER ROLL"
      ruleLine="Prescribed under Rule 27(5) of the Minimum Wages (Tamil Nadu) Rules, 1963"
      periodLine={`Register of Muster Roll for the Month of ${period}`}
      establishment={establishment}
      rows={muster}
      startIndex={startIndex}
      daysInMonth={daysInMonth}
      dayGroupLabel={`Daily attendance (${period})`}
      rowKey={(r) => r.employeeId}
      legend={legend}
      identityHead={<>
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
      </>}
      summaryHead={<>
        <th rowSpan={2}>No. of Days total Hrs worked incl. weekly holidays</th>
        <th rowSpan={2}>No. of Days leave granted with wages</th>
        <th rowSpan={2}>No. of Days Absent</th>
        <th rowSpan={2}>No. of Days counted for wages</th>
        <th rowSpan={2}>Remarks</th>
      </>}
      identityCells={(row, sno) => {
        const worked = row.dailyMarks.filter((m) => m === 'P' || m === 'OT').length
        return <>
          <td style={{ textAlign: 'center' }}>{sno}</td>
          <td>{row.name}</td>
          <td>{row.fatherSpouseName || 'Nil'}</td>
          <td style={{ textAlign: 'center' }}>{row.sex}</td>
          <td>{row.designation}</td>
          <td style={{ textAlign: 'center' }}>{dash}</td>
          <td style={{ textAlign: 'center' }}>{dash}</td>
          <td style={{ textAlign: 'center' }}>{row.workStartTime || dash}</td>
          <td style={{ textAlign: 'center' }}>{row.workEndTime || dash}</td>
          <td style={{ textAlign: 'center' }}>{row.restInterval || dash}</td>
          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{worked}</td>
        </>
      }}
      dayCell={(row, d) => (
        <td key={d} style={{ textAlign: 'center', fontSize: '8px' }}>{row.dailyMarks[d] || '-'}</td>
      )}
      summaryCells={(row) => {
        const worked = row.dailyMarks.filter((m) => m === 'P' || m === 'OT').length
        const holiday = row.dailyMarks.filter((m) => m === 'H').length
        const leave = row.dailyMarks.filter((m) => m === 'L').length
        const absent = row.dailyMarks.filter((m) => m === 'A').length
        return <>
          <td style={{ textAlign: 'center' }}>{worked + holiday}</td>
          <td style={{ textAlign: 'center' }}>{leave}</td>
          <td style={{ textAlign: 'center' }}>{absent}</td>
          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{worked + holiday + leave}</td>
          <td>{row.remarks || 'Nil'}</td>
        </>
      }}
    />
  )
}
