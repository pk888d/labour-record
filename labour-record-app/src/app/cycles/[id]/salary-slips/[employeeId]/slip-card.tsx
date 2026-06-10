import type { SlipData, CycleInfo } from '../slip-data'

function fmt(n: number) {
  return '₹' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-[#1a2a3a] last:border-0 print:border-gray-200">
      <span className="text-xs text-[#8ab8d8] print:text-gray-600">{label}</span>
      <span className={`text-xs font-mono font-medium ${accent ?? 'text-white'} print:text-black`}>{value}</span>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#0f1f30] px-3 py-1 mt-2 first:mt-0 print:bg-gray-100">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-[#5a8ab8] print:text-gray-500">
        {title}
      </span>
    </div>
  )
}

// One salary slip. `copyLabel` distinguishes the Original from the Photocopy
// when two are printed on the same sheet (item 11).
export function SlipCard({
  slip,
  cycle,
  period,
  copyLabel,
}: {
  slip: SlipData
  cycle: CycleInfo
  period: string
  copyLabel: string
}) {
  return (
    <div className="bg-[#0a1520] border border-[#1e2d3d] rounded-lg overflow-hidden print:border-black print:rounded-none relative z-[1]">
      {/* Header */}
      <div className="bg-[#0f2040] px-4 py-2 text-center print:bg-white print:border-b print:border-black relative">
        <h1 className="text-sm font-bold text-white uppercase tracking-wide print:text-black">
          {cycle.establishmentName}
        </h1>
        {cycle.address && (
          <p className="text-[10px] text-[#5a8ab8] mt-0.5 print:text-gray-500">{cycle.address}</p>
        )}
        <p className="text-xs font-semibold text-[#4a9eff] mt-1 print:text-black">
          SALARY SLIP — {period.toUpperCase()}
        </p>
        <span className="absolute top-1 right-2 text-[9px] font-bold uppercase tracking-wider text-[#c0a040] print:text-gray-500 border border-[#c0a040] print:border-gray-400 rounded px-1">
          {copyLabel}
        </span>
      </div>

      {/* Employee details */}
      <div className="px-4 py-2 grid grid-cols-2 gap-x-6 gap-y-0.5 border-b border-[#1e2d3d] print:border-black">
        {[
          { label: 'Emp No', value: slip.empId },
          { label: 'Days Worked', value: String(slip.daysWorked) },
          { label: 'Name', value: slip.name },
          { label: 'Designation', value: slip.designation },
          ...(slip.department ? [{ label: 'Department', value: slip.department }] : []),
          ...(slip.uan ? [{ label: 'UAN', value: slip.uan }] : []),
          ...(slip.esiNo ? [{ label: 'ESI No', value: slip.esiNo }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="text-[11px] py-0.5">
            <span className="text-[#4a6a8a] print:text-gray-500">{label}: </span>
            <span className="text-white font-medium print:text-black">{value}</span>
          </div>
        ))}
      </div>

      {!slip.hasData ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-[#c0a040] print:text-gray-600">No wage data entered yet.</p>
        </div>
      ) : (
        <div className="px-4 pb-3">
          <SectionHeader title="Earnings" />
          <div className="px-1">
            {slip.basic > 0 && <Row label="Basic" value={fmt(slip.basic)} />}
            {slip.da > 0 && <Row label="DA" value={fmt(slip.da)} />}
            {slip.hra > 0 && <Row label="HRA" value={fmt(slip.hra)} />}
            {slip.otherAllowances > 0 && <Row label="Other Allowances" value={fmt(slip.otherAllowances)} />}
            {slip.holidayBonus > 0 && <Row label="Holiday Bonus" value={fmt(slip.holidayBonus)} accent="text-[#c0a040]" />}
            {slip.overtimeEarnings > 0 && <Row label="Overtime Earnings" value={fmt(slip.overtimeEarnings)} accent="text-[#c0a040]" />}
          </div>
          <div className="flex justify-between items-center px-1 py-1 mt-1 bg-[#0f2a18] rounded print:bg-gray-50">
            <span className="text-xs font-bold text-[#40c070] print:text-black">Gross Wages</span>
            <span className="text-xs font-bold font-mono text-[#40c070] print:text-black">{fmt(slip.grossWages)}</span>
          </div>

          <SectionHeader title="Deductions" />
          <div className="px-1">
            {slip.pf > 0 && <Row label="Provident Fund" value={fmt(slip.pf)} accent="text-[#f09070]" />}
            {slip.esi > 0 && <Row label="ESI" value={fmt(slip.esi)} accent="text-[#f09070]" />}
            {slip.lwf > 0 && <Row label="Labour Welfare Fund" value={fmt(slip.lwf)} accent="text-[#f09070]" />}
            {slip.fineDeduction > 0 && <Row label="Fine Deduction" value={fmt(slip.fineDeduction)} accent="text-[#f07070]" />}
            {slip.otherDeductions > 0 && <Row label="Other Deductions" value={fmt(slip.otherDeductions)} accent="text-[#f07070]" />}
            {slip.advanceRecovered > 0 && <Row label="Advance Recovered" value={fmt(slip.advanceRecovered)} accent="text-[#f07070]" />}
            {slip.totalDeductions === 0 && (
              <p className="text-[11px] text-[#4a6a8a] py-1 text-center print:text-gray-500">No deductions</p>
            )}
          </div>
          {slip.totalDeductions > 0 && (
            <div className="flex justify-between items-center px-1 py-1 mt-1 bg-[#2a1010] rounded print:bg-gray-50">
              <span className="text-xs font-bold text-[#f07070] print:text-black">Total Deductions</span>
              <span className="text-xs font-bold font-mono text-[#f07070] print:text-black">{fmt(slip.totalDeductions)}</span>
            </div>
          )}

          <div className="flex justify-between items-center px-3 py-2 mt-2 bg-[#0a2a18] border-2 border-[#2a5a30] rounded-lg print:border-black print:bg-white">
            <span className="text-sm font-bold text-white print:text-black">Net Pay</span>
            <span className="text-base font-bold font-mono text-[#40c070] print:text-black">{fmt(slip.netWages)}</span>
          </div>

          {slip.paymentDate && (
            <p className="text-[10px] text-[#4a6a8a] mt-1 px-1 print:text-gray-500">Payment Date: {slip.paymentDate}</p>
          )}

          <div className="mt-3 pt-2 border-t border-[#1e2d3d] grid grid-cols-2 gap-6 print:border-black">
            <div>
              <div className="h-6 border-b border-[#2a3a50] print:border-black" />
              <p className="text-[9px] text-[#4a6a8a] mt-0.5 print:text-gray-500">Employee Signature</p>
            </div>
            <div>
              <div className="h-6 border-b border-[#2a3a50] print:border-black" />
              <p className="text-[9px] text-[#4a6a8a] mt-0.5 text-right print:text-gray-500">
                {cycle.employerName || 'Authorised Signatory'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
