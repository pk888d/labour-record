import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

function Slip({ row, ctx, formTitle, rule }: {
  row: WagesRow
  ctx: CycleContext
  formTitle: string
  rule: string
}) {
  const { establishment, cycle, daysInMonth } = ctx
  const monthName = MONTH_NAMES[cycle.month]
  const from = `01 ${monthName} ${cycle.year}`
  const to = `${daysInMonth} ${monthName} ${cycle.year}`
  const td: React.CSSProperties = { border: '1px solid #000', padding: '2px 5px', fontSize: '10px', verticalAlign: 'top' }
  const lbl: React.CSSProperties = { ...td, width: '32%' }
  const amt: React.CSSProperties = { ...td, textAlign: 'right', width: '18%' }

  return (
    <div className="ts-slip" style={{ pageBreakInside: 'avoid', marginBottom: '14px' }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>{formTitle}</div>
      <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '4px' }}>{rule}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td style={lbl}>1. Name &amp; Address of the Establishment</td><td style={td} colSpan={3}>{establishment.name}, {establishment.address}</td></tr>
          <tr><td style={lbl}>2. Name of the person employed</td><td style={td} colSpan={3}>{row.name}</td></tr>
          <tr><td style={lbl}>3. Father&apos;s / Husband&apos;s Name</td><td style={td} colSpan={3}>{row.fatherSpouseName || 'Nil'}</td></tr>
          <tr><td style={lbl}>4. Designation</td><td style={td} colSpan={3}>{row.designation}{row.department ? ` / ${row.department}` : ''}</td></tr>
          <tr><td style={lbl}>5. Date of entry into service</td><td style={td} colSpan={3}>{row.dateOfEntry || 'Nil'}</td></tr>
          <tr><td style={lbl}>6. Wage period</td><td style={td} colSpan={3}>From: {from} &nbsp; To: {to} &nbsp; (Days worked: {row.daysWorked})</td></tr>
          <tr>
            <td style={{ ...td, fontWeight: 'bold' }} colSpan={2}>7. Wage Earned</td>
            <td style={{ ...td, fontWeight: 'bold' }} colSpan={2}>Deductions</td>
          </tr>
          <tr><td style={td}>(a) Basic</td><td style={amt}>{fmt(row.basic)}</td><td style={td}>(i) Provident Fund (PF)</td><td style={amt}>{fmt(row.pf)}</td></tr>
          <tr><td style={td}>(b) Dearness Allowance</td><td style={amt}>{fmt(row.da)}</td><td style={td}>(ii) Employee State Insurance (ESI)</td><td style={amt}>{fmt(row.esi)}</td></tr>
          <tr><td style={td}>(c) House Rent Allowance</td><td style={amt}>{fmt(row.hra)}</td><td style={td}>(iii) Labour Welfare Fund (LWF)</td><td style={amt}>{fmt(row.lwf)}</td></tr>
          <tr><td style={td}>(d) Overtime Wages</td><td style={amt}>Nil</td><td style={td}>(iv) Fine</td><td style={amt}>{fmt(row.fineDeduction)}</td></tr>
          <tr><td style={td}>(e) Leave Wages</td><td style={amt}>Nil</td><td style={td}>(v) Advance / Other</td><td style={amt}>{fmt(row.otherDeductions + row.advanceRecovered)}</td></tr>
          <tr><td style={td}>(f) Other Allowances</td><td style={amt}>{fmt(row.otherAllowances)}</td><td style={td} /><td style={amt} /></tr>
          <tr style={{ fontWeight: 'bold' }}>
            <td style={td}>(g) Gross Wages</td><td style={amt}>{fmt(row.grossEarnings)}</td>
            <td style={td}>Net Amount Paid</td><td style={amt}>{fmt(row.netWage)}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: '10px' }}>
        <span>Employee Signature: ______________________</span>
        <span>{establishment.employerName || 'Authorised Signatory'}: ______________________</span>
      </div>
    </div>
  )
}

export function WageSlipForm({ ctx, wages, formTitle, rule }: {
  ctx: CycleContext
  wages: WagesRow[]
  formTitle: string
  rule: string
}) {
  return (
    <div className="form-page">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {wages.map((row) => (
          <Slip key={row.employeeId} row={row} ctx={ctx} formTitle={formTitle} rule={rule} />
        ))}
      </div>
    </div>
  )
}
