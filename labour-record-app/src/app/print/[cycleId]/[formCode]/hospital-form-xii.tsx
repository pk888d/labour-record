import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

function kindOf(r: WagesRow): string {
  const parts: string[] = []
  if (r.pf) parts.push('PF')
  if (r.esi) parts.push('ESI')
  if (r.lwf) parts.push('LWF')
  if (r.fineDeduction) parts.push('Fine')
  if (r.otherDeductions) parts.push('Other')
  if (r.advanceRecovered) parts.push('Advance')
  return parts.length ? parts.join(', ') : 'Nil'
}

export function HospitalFormXII({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
  const { establishment, cycle } = ctx
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>FORM No. XII — REGISTER OF WAGES</h2>
        <p>Prescribed under Rule 27(1) of Minimum Wages (Tamil Nadu) Rules, 1963</p>
        <p>Register of Wages for the Month of <strong>{period}</strong></p>
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
            <th rowSpan={2}>Minimum Rate of Wages Fixed</th>
            <th rowSpan={2}>No. of Days/Hours counted for payment</th>
            <th rowSpan={2}>Total Overtime hours worked</th>
            <th colSpan={3}>Total Earnings</th>
            <th rowSpan={2}>Earned Overtime Earnings</th>
            <th rowSpan={2}>Gross wages for the wage period</th>
            <th colSpan={2}>Deductions</th>
            <th rowSpan={2}>Net wages paid</th>
            <th rowSpan={2}>Date, Signature / Thumb impression</th>
          </tr>
          <tr>
            <th>Minimum of Wages</th>
            <th>Dearness Allowance</th>
            <th>Total Normal Wages</th>
            <th>Amount Deducted</th>
            <th>Kind of Deduction</th>
          </tr>
          <tr>{Array.from({ length: 17 }, (_, i) => <th key={i} style={{ fontWeight: 'normal' }}>({i + 1})</th>)}</tr>
        </thead>
        <tbody>
          {wages.map((r, i) => {
            const totalNormal = r.basic + r.da
            const amountDeducted = r.pf + r.esi + r.lwf + r.fineDeduction + r.otherDeductions + r.advanceRecovered
            return (
              <tr key={r.employeeId}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.fatherSpouseName || 'Nil'}</td>
                <td style={{ textAlign: 'center' }}>{r.sex}</td>
                <td>{r.designation}{r.department ? ` / ${r.department}` : ''}</td>
                <td style={{ textAlign: 'right' }}>{fmt(totalNormal)}</td>
                <td style={{ textAlign: 'center' }}>{r.daysWorked}</td>
                <td style={{ textAlign: 'center' }}>Nil</td>
                <td style={{ textAlign: 'right' }}>{fmt(r.basic)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(r.da)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(totalNormal)}</td>
                <td style={{ textAlign: 'right' }}>Nil</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(r.grossEarnings)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(amountDeducted)}</td>
                <td style={{ textAlign: 'center' }}>{kindOf(r)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(r.netWage)}</td>
                <td />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
