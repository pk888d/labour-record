import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

export function ShopFormW({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>FORM W — REGISTER OF WAGES</h2>
        <p>Prescribed under Rule 18 of the Tamil Nadu Shops and Establishments Rules</p>
        <p>Register of Wages for the Month of <strong>{period}</strong></p>
        <p>Name and Address of the Establishment: <strong>{establishment.name}</strong>, {establishment.address}</p>
        <p>Name of the Manager/In-charge: {establishment.managerName} | Registration Certificate No.: {establishment.regCertNo}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Name of the Employee</th>
            <th>Employee ID</th>
            <th>Number of Days Worked</th>
            <th>Basic Wages</th>
            <th>Dearness Allowance</th>
            <th>House Rent Allowance</th>
            <th>Other Allowances</th>
            <th>Overtime Wages</th>
            <th>Leave Wages</th>
            <th>Gross Wages</th>
            <th>PF</th>
            <th>ESI</th>
            <th>Labour Welfare Fund</th>
          </tr>
          <tr>{Array.from({ length: 14 }, (_, i) => <th key={i} style={{ fontWeight: 'normal' }}>({i + 1})</th>)}</tr>
        </thead>
        <tbody>
          {wages.map((row, i) => (
            <tr key={row.employeeId}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{row.name}</td>
              <td>{row.empId}</td>
              <td style={{ textAlign: 'center' }}>{row.daysWorked}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.basic)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.da)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.hra)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.otherAllowances)}</td>
              <td style={{ textAlign: 'right' }}>Nil</td>
              <td style={{ textAlign: 'right' }}>Nil</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.grossEarnings)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.pf)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.esi)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(row.lwf)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
