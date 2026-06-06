import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCycleWithSlips, MONTH_NAMES } from '../slip-data'
import { PrintButton } from './print-button'

function fmt(n: number) {
  return '₹' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[#1a2a3a] last:border-0 print:border-gray-200">
      <span className="text-sm text-[#8ab8d8] print:text-gray-600">{label}</span>
      <span className={`text-sm font-mono font-medium ${accent ?? 'text-white'} print:text-black`}>{value}</span>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#0f1f30] px-4 py-1.5 mt-4 first:mt-0 print:bg-gray-100">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5a8ab8] print:text-gray-500">
        {title}
      </span>
    </div>
  )
}

export default async function IndividualSlipPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; employeeId: string }>
  searchParams: Promise<{ print?: string }>
}) {
  const { id, employeeId } = await params
  const { print: autoPrint } = await searchParams
  const result = await getCycleWithSlips(id)
  if (!result) notFound()

  const { cycle, slips } = result
  const slip = slips.find((s) => s.employeeId === employeeId)
  if (!slip) notFound()

  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  // prev / next navigation
  const idx = slips.findIndex((s) => s.employeeId === employeeId)
  const prev = idx > 0 ? slips[idx - 1] : null
  const next = idx < slips.length - 1 ? slips[idx + 1] : null

  return (
    <div className="min-h-screen bg-[#060d14] print:bg-white">
      {/* Nav bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e2d3d] print:hidden">
        <div className="flex items-center gap-4">
          <Link href={`/cycles/${id}/salary-slips`}
            className="text-xs text-[#4a9eff] hover:underline flex items-center gap-1">
            ← All Slips
          </Link>
          <p className="text-xs text-[#4a6a8a]">
            {cycle.establishmentName} — {period} — {slip.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {prev && (
            <Link href={`/cycles/${id}/salary-slips/${prev.employeeId}`}
              className="text-xs px-3 py-1.5 border border-[#2a3a50] text-[#7a9ab8] rounded hover:border-[#4a6a8a]">
              ← {prev.name}
            </Link>
          )}
          {next && (
            <Link href={`/cycles/${id}/salary-slips/${next.employeeId}`}
              className="text-xs px-3 py-1.5 border border-[#2a3a50] text-[#7a9ab8] rounded hover:border-[#4a6a8a]">
              {next.name} →
            </Link>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Slip */}
      <div className="max-w-lg mx-auto my-8 print:my-0 print:max-w-none">
        <div className="bg-[#0a1520] border border-[#1e2d3d] rounded-xl overflow-hidden shadow-2xl print:border-black print:rounded-none print:shadow-none">

          {/* Slip header */}
          <div className="bg-[#0f2040] px-6 py-4 text-center print:bg-white print:border-b print:border-black">
            <h1 className="text-base font-bold text-white uppercase tracking-wide print:text-black">
              {cycle.establishmentName}
            </h1>
            {cycle.address && (
              <p className="text-[11px] text-[#5a8ab8] mt-0.5 print:text-gray-500">{cycle.address}</p>
            )}
            <p className="text-sm font-semibold text-[#4a9eff] mt-2 print:text-black">
              SALARY SLIP — {period.toUpperCase()}
            </p>
          </div>

          {/* Employee details */}
          <div className="px-6 py-3 grid grid-cols-2 gap-x-8 gap-y-1 border-b border-[#1e2d3d] print:border-black">
            {[
              { label: 'Emp No',      value: slip.empId },
              { label: 'Days Worked', value: String(slip.daysWorked) },
              { label: 'Name',        value: slip.name },
              { label: 'Designation', value: slip.designation },
              ...(slip.department ? [{ label: 'Department', value: slip.department }] : []),
              ...(slip.uan   ? [{ label: 'UAN',    value: slip.uan }]   : []),
              ...(slip.esiNo ? [{ label: 'ESI No', value: slip.esiNo }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="text-xs py-0.5">
                <span className="text-[#4a6a8a] print:text-gray-500">{label}: </span>
                <span className="text-white font-medium print:text-black">{value}</span>
              </div>
            ))}
          </div>

          {!slip.hasData ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#c0a040]">No wage data entered for this employee yet.</p>
              <Link href={`/cycles/${id}/salary-slips`}
                className="text-xs text-[#4a9eff] hover:underline mt-2 block">
                ← Back to all slips
              </Link>
            </div>
          ) : (
            <div className="px-6 pb-6">
              {/* Earnings */}
              <SectionHeader title="Earnings" />
              <div className="px-2">
                {slip.basic > 0 && <Row label="Basic" value={fmt(slip.basic)} />}
                {slip.da > 0 && <Row label="DA (Dearness Allowance)" value={fmt(slip.da)} />}
                {slip.hra > 0 && <Row label="HRA" value={fmt(slip.hra)} />}
                {slip.otherAllowances > 0 && <Row label="Other Allowances" value={fmt(slip.otherAllowances)} />}
                {slip.holidayBonus > 0 && <Row label="Holiday Bonus" value={fmt(slip.holidayBonus)} accent="text-[#c0a040]" />}
                {slip.overtimeEarnings > 0 && <Row label="Overtime Earnings" value={fmt(slip.overtimeEarnings)} accent="text-[#c0a040]" />}
              </div>
              <div className="flex justify-between items-center px-2 py-2 mt-1 bg-[#0f2a18] rounded print:bg-gray-50">
                <span className="text-sm font-bold text-[#40c070] print:text-black">Gross Wages</span>
                <span className="text-sm font-bold font-mono text-[#40c070] print:text-black">{fmt(slip.grossWages)}</span>
              </div>

              {/* Deductions */}
              <SectionHeader title="Deductions" />
              <div className="px-2">
                {slip.pf > 0 && <Row label="Provident Fund (Employee)" value={fmt(slip.pf)} accent="text-[#f09070]" />}
                {slip.esi > 0 && <Row label="ESI (Employee)" value={fmt(slip.esi)} accent="text-[#f09070]" />}
                {slip.lwf > 0 && <Row label="Labour Welfare Fund" value={fmt(slip.lwf)} accent="text-[#f09070]" />}
                {slip.fineDeduction > 0 && <Row label="Fine Deduction" value={fmt(slip.fineDeduction)} accent="text-[#f07070]" />}
                {slip.otherDeductions > 0 && <Row label="Other Deductions" value={fmt(slip.otherDeductions)} accent="text-[#f07070]" />}
                {slip.advanceRecovered > 0 && <Row label="Advance Recovered" value={fmt(slip.advanceRecovered)} accent="text-[#f07070]" />}
                {slip.totalDeductions === 0 && (
                  <p className="text-xs text-[#4a6a8a] py-2 text-center">No deductions</p>
                )}
              </div>
              {slip.totalDeductions > 0 && (
                <div className="flex justify-between items-center px-2 py-2 mt-1 bg-[#2a1010] rounded print:bg-gray-50">
                  <span className="text-sm font-bold text-[#f07070] print:text-black">Total Deductions</span>
                  <span className="text-sm font-bold font-mono text-[#f07070] print:text-black">{fmt(slip.totalDeductions)}</span>
                </div>
              )}

              {/* Net Pay */}
              <div className="flex justify-between items-center px-4 py-3 mt-4 bg-[#0a2a18] border-2 border-[#2a5a30] rounded-lg print:border-black print:bg-white">
                <span className="text-lg font-bold text-white print:text-black">Net Pay</span>
                <span className="text-xl font-bold font-mono text-[#40c070] print:text-black">{fmt(slip.netWages)}</span>
              </div>

              {slip.paymentDate && (
                <p className="text-xs text-[#4a6a8a] mt-2 px-1">Payment Date: {slip.paymentDate}</p>
              )}

              {/* Signatures */}
              <div className="mt-6 pt-4 border-t border-[#1e2d3d] grid grid-cols-2 gap-8 print:border-black">
                <div>
                  <div className="h-8 border-b border-[#2a3a50] print:border-black" />
                  <p className="text-[10px] text-[#4a6a8a] mt-1 print:text-gray-500">Employee Signature</p>
                </div>
                <div>
                  <div className="h-8 border-b border-[#2a3a50] print:border-black" />
                  <p className="text-[10px] text-[#4a6a8a] mt-1 text-right print:text-gray-500">
                    {cycle.employerName || 'Authorised Signatory'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Employee counter */}
        <p className="text-center text-xs text-[#3a5a7a] mt-3 print:hidden">
          {idx + 1} of {slips.length} employees
        </p>
      </div>

      {autoPrint === '1' && (
        <script dangerouslySetInnerHTML={{ __html: 'window.onload = () => { window.print(); }' }} />
      )}

      <style>{`
        @media print {
          body { background: white !important; }
          [class*="text-\\[#"] { color: black !important; }
          [class*="bg-\\[#"] { background: transparent !important; }
          [class*="border-\\[#"] { border-color: #ccc !important; }
        }
      `}</style>
    </div>
  )
}
