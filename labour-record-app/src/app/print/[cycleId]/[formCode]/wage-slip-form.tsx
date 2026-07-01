import type { CycleContext, WagesRow } from '@/lib/export/form-data'
import { MONTH_NAMES } from '@/lib/export/form-data'

const fmt = (n: number) => { const v = Number(n); return v ? v.toFixed(2) : 'Nil' }

function Slip({ row, ctx, formTitle, rule, copyLabel }: {
  row: WagesRow
  ctx: CycleContext
  formTitle: string
  rule: string
  copyLabel: string
}) {
  const { establishment, cycle, daysInMonth } = ctx
  const m = String(cycle.month).padStart(2, '0')
  const yy = String(cycle.year).slice(-2)
  const from = `01/${m}/${yy}`
  const to = `${String(daysInMonth).padStart(2, '0')}/${m}/${yy}`
  const earningsA = row.grossEarnings
  const deductionsB = row.pf + row.esi + row.lwf + row.fineDeduction + row.otherDeductions + row.advanceRecovered
  const td: React.CSSProperties = { border: '1px solid #000', padding: '1px 4px', fontSize: '9px', verticalAlign: 'top' }
  const amt: React.CSSProperties = { ...td, textAlign: 'right' }
  const bold: React.CSSProperties = { ...td, fontWeight: 'bold' }

  return (
    <div style={{ height: '100%' }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
        {formTitle} <span style={{ fontWeight: 'bold' }}>[{copyLabel}]</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: '8px', marginBottom: '3px' }}>{rule}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td style={bold}>1. Name &amp; Address of the Establishment</td><td style={td} colSpan={3}>{establishment.name}, {establishment.address}</td></tr>
          <tr><td style={bold}>2. Name of the person employed</td><td style={td} colSpan={3}>{row.name}</td></tr>
          <tr><td style={bold}>3. Father&apos;s / Husband&apos;s Name</td><td style={td} colSpan={3}>{row.fatherSpouseName || 'Nil'}</td></tr>
          <tr><td style={bold}>4. Designation</td><td style={td} colSpan={3}>{row.designation}{row.department ? ` / ${row.department}` : ''}</td></tr>
          <tr><td style={bold}>5. Date of entry into service</td><td style={td} colSpan={3}>{row.dateOfEntry || 'Nil'}</td></tr>
          <tr><td style={bold}>6. Wage Period</td><td style={td} colSpan={3}>From: {from} &nbsp; To: {to} &nbsp; (Days worked: {row.daysWorked})</td></tr>
          <tr>
            <td style={bold} colSpan={2}>7. Wage Earned (A)</td>
            <td style={bold} colSpan={2}>Deductions (B)</td>
          </tr>
          <tr><td style={td}>a) Basic</td><td style={amt}>{fmt(row.basic)}</td><td style={td}>a) EPF</td><td style={amt}>{fmt(row.pf)}</td></tr>
          <tr><td style={td}>b) Dearness Allowance</td><td style={amt}>{fmt(row.da)}</td><td style={td}>b) ESI</td><td style={amt}>{fmt(row.esi)}</td></tr>
          <tr><td style={td}>c) House Rent Allowance</td><td style={amt}>{fmt(row.hra)}</td><td style={td}>c) LWF</td><td style={amt}>{fmt(row.lwf)}</td></tr>
          <tr><td style={td}>d) Overtime Wages</td><td style={amt}>Nil</td><td style={td}>d) Fine</td><td style={amt}>{fmt(row.fineDeduction)}</td></tr>
          <tr><td style={td}>e) Leave Wages</td><td style={amt}>Nil</td><td style={td}>e) Advance / Other</td><td style={amt}>{fmt(row.otherDeductions + row.advanceRecovered)}</td></tr>
          <tr><td style={td}>f) Other Allowances</td><td style={amt}>{fmt(row.otherAllowances)}</td><td style={bold}>Total (B)</td><td style={amt}>{fmt(deductionsB)}</td></tr>
          <tr>
            <td style={bold}>g) Gross Wages (A)</td><td style={amt}>{fmt(earningsA)}</td>
            <td style={bold}>Net Amount Paid (A&minus;B)</td><td style={amt}><strong>{fmt(row.netWage)}</strong></td>
          </tr>
        </tbody>
      </table>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2px' }}>
        <tbody>
          <tr><td style={bold} colSpan={9}>Leave Availed during the month</td></tr>
          <tr>
            <td style={td}>CL</td><td style={td}>Nil</td>
            <td style={td}>SL</td><td style={td}>Nil</td>
            <td style={td}>EL</td><td style={td}>Nil</td>
            <td style={td}>Maternity</td><td style={td}>Nil</td>
          </tr>
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginTop: '8px' }}>
        <span>Employee Signature: ______________</span>
        <span>{establishment.employerName || 'Authorised Signatory'}: ______________</span>
      </div>
    </div>
  )
}

// Each employee gets a LANDSCAPE half-sheet split horizontally:
// left = Original copy, right = Photocopy (duplicate) — as per the template.
// Two employees fill one page; the rest paginate cleanly. Employees are chunked
// into explicit page groups (instead of relying on :nth-of-type break rules,
// which let extra slips spill onto the same page — item #5).
export function WageSlipForm({ ctx, wages, formTitle, rule }: {
  ctx: CycleContext
  wages: WagesRow[]
  formTitle: string
  rule: string
}) {
  const pages: WagesRow[][] = []
  for (let i = 0; i < wages.length; i += 2) pages.push(wages.slice(i, i + 2))

  return (
    <div className="form-page">
      <style>{`@media print {
        @page { size: A4 landscape; margin: 0; }
        .ts-wageslip-page { page-break-inside: avoid; break-inside: avoid; page-break-after: always; break-after: page; }
        .ts-wageslip-page:last-child { page-break-after: auto; break-after: auto; }
      }`}</style>
      {pages.map((pair, p) => (
        <div key={p} className="ts-wageslip-page"
          style={{ display: 'flex', flexDirection: 'column', minHeight: '190mm', gap: '6px' }}>
          {pair.map((row, i) => (
            <div key={row.employeeId} className="ts-wageslip-sheet"
              style={{
                flex: 1, display: 'flex', alignItems: 'stretch',
                // dashed cut line between the two slips stacked on a page
                borderBottom: i === 0 && pair.length > 1 ? '1px dashed #888' : 'none',
                paddingBottom: '8px',
              }}>
              <div style={{ flex: 1, padding: '0 8px' }}>
                <Slip row={row} ctx={ctx} formTitle={formTitle} rule={rule} copyLabel="Original" />
              </div>
              <div style={{ borderLeft: '1px dashed #555' }} />
              <div style={{ flex: 1, padding: '0 8px' }}>
                <Slip row={row} ctx={ctx} formTitle={formTitle} rule={rule} copyLabel="Duplicate / Photocopy" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
