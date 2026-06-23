import type { ReactNode } from 'react'
import { splitDays } from '@/lib/day-split'

export type SplitRegisterProps<T> = {
  title: string
  ruleLine: string
  periodLine: string
  establishment: { name: string; address: string; managerName: string; regCertNo: string }
  rows: T[]
  startIndex: number
  daysInMonth: number
  dayGroupLabel: string // header spanning the day columns
  identityHead: ReactNode // <th rowSpan={2}> cells for identity columns (both parts)
  summaryHead: ReactNode // <th rowSpan={2}> cells for summary columns (part 2 only)
  identityCells: (row: T, sno: number) => ReactNode // <td> identity cells
  dayCell: (row: T, dayIndex: number) => ReactNode // returns a KEYED <td key={dayIndex}> for one day (0-based index)
  summaryCells: (row: T) => ReactNode // <td> summary cells (part 2)
  rowKey: (row: T) => string
  legend?: ReactNode
}

export function SplitRegister<T>(props: SplitRegisterProps<T>) {
  const { first, second } = splitDays(props.daysInMonth)

  const header = (continued: boolean) => (
    <div className="form-header">
      <h2>{props.title}{continued ? ' (continued)' : ''}</h2>
      <p>{props.ruleLine}</p>
      <p style={{ fontWeight: 'bold' }}>{props.periodLine}</p>
      <p>Name and Address of the Establishment: <strong>{props.establishment.name}</strong>, {props.establishment.address}</p>
      <p>Name of the Manager/In-charge: {props.establishment.managerName} | Registration Certificate No.: {props.establishment.regCertNo}</p>
    </div>
  )

  const part = (days: number[], withSummary: boolean) => (
    <table>
      <thead>
        <tr>
          {props.identityHead}
          <th colSpan={days.length}>{props.dayGroupLabel}</th>
          {withSummary ? props.summaryHead : null}
        </tr>
        <tr>
          {days.map((d) => <th key={d} style={{ minWidth: '13px', fontWeight: 'normal' }}>{d}</th>)}
        </tr>
      </thead>
      <tbody>
        {props.rows.map((row, i) => (
          <tr key={props.rowKey(row)}>
            {props.identityCells(row, props.startIndex + i + 1)}
            {days.map((d) => props.dayCell(row, d - 1))}
            {withSummary ? props.summaryCells(row) : null}
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <>
      <div className="form-page" style={{ breakAfter: 'page' }}>
        {header(false)}
        {part(first, false)}
        {props.legend}
      </div>
      <div className="form-page">
        {header(true)}
        {part(second, true)}
        {props.legend}
      </div>
    </>
  )
}
