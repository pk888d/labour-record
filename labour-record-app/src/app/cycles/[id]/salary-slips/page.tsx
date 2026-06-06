import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCycleWithSlips, MONTH_NAMES } from './slip-data'
import { PrintAllButton } from './print-all-button'

function fmt(n: number) {
  return '₹' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default async function SalarySlipsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getCycleWithSlips(id)
  if (!result) notFound()

  const { cycle, slips } = result
  const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="min-h-screen bg-[#060d14]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d3d] print:hidden">
        <div>
          <p className="text-xs text-[#5a8ab8]">
            <Link href="/cycles" className="hover:underline">Cycles</Link>
            {' › '}
            <Link href={`/cycles/${id}`} className="hover:underline">{cycle.establishmentName} — {period}</Link>
            {' › Salary Slips'}
          </p>
          <h1 className="text-lg font-semibold text-white mt-0.5">Salary Slips — {period}</h1>
          <p className="text-xs text-[#4a6a8a] mt-0.5">{cycle.establishmentName} · {slips.length} employee(s)</p>
        </div>
        <PrintAllButton />
      </div>

      {/* Slips grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 print:grid-cols-2 print:gap-2 print:p-2">
        {slips.map((s) => (
          <div
            key={s.employeeId}
            className="bg-[#0a1520] border border-[#1e2d3d] rounded-lg overflow-hidden print:border-black print:rounded-none flex flex-col"
          >
            {/* Slip header */}
            <div className="bg-[#0f1f30] px-4 py-2 border-b border-[#1e2d3d] print:bg-white print:border-black">
              <div className="text-center text-xs font-bold text-white uppercase tracking-wide print:text-black">
                {cycle.establishmentName}
              </div>
              <div className="text-center text-[10px] text-[#5a8ab8] print:text-gray-600">
                Salary Slip — {period}
              </div>
            </div>

            {/* Employee info */}
            <div className="px-4 py-2 border-b border-[#1a2a3a] grid grid-cols-2 gap-x-4 gap-y-0.5 print:border-black">
              <div className="text-[10px]">
                <span className="text-[#4a6a8a]">Emp No: </span>
                <span className="text-white font-mono font-semibold">{s.empId}</span>
              </div>
              <div className="text-[10px]">
                <span className="text-[#4a6a8a]">Days Worked: </span>
                <span className="text-white font-semibold">{s.daysWorked}</span>
              </div>
              <div className="text-[10px] col-span-2">
                <span className="text-[#4a6a8a]">Name: </span>
                <span className="text-white font-semibold">{s.name}</span>
              </div>
              <div className="text-[10px]">
                <span className="text-[#4a6a8a]">Designation: </span>
                <span className="text-[#c8d8e8]">{s.designation}</span>
              </div>
              {s.department && (
                <div className="text-[10px]">
                  <span className="text-[#4a6a8a]">Dept: </span>
                  <span className="text-[#c8d8e8]">{s.department}</span>
                </div>
              )}
              {s.uan && (
                <div className="text-[10px]">
                  <span className="text-[#4a6a8a]">UAN: </span>
                  <span className="text-[#c8d8e8] font-mono">{s.uan}</span>
                </div>
              )}
              {s.esiNo && (
                <div className="text-[10px]">
                  <span className="text-[#4a6a8a]">ESI No: </span>
                  <span className="text-[#c8d8e8] font-mono">{s.esiNo}</span>
                </div>
              )}
            </div>

            {!s.hasData ? (
              <div className="px-4 py-6 text-center flex-1">
                <p className="text-[11px] text-[#c0a040]">No wage data entered yet.</p>
                <Link
                  href={`/employees/${s.employeeId}`}
                  className="text-[10px] text-[#4a9eff] hover:underline mt-1 block print:hidden"
                >
                  Set wage defaults →
                </Link>
              </div>
            ) : (
              <div className="px-4 py-2 text-[11px] space-y-0.5 flex-1">
                {/* Earnings */}
                <div className="text-[9px] text-[#5a8ab8] uppercase tracking-wider font-semibold pt-1">Earnings</div>
                {s.basic > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">Basic</span>
                    <span className="font-mono text-white">{fmt(s.basic)}</span>
                  </div>
                )}
                {s.da > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">DA</span>
                    <span className="font-mono text-white">{fmt(s.da)}</span>
                  </div>
                )}
                {s.hra > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">HRA</span>
                    <span className="font-mono text-white">{fmt(s.hra)}</span>
                  </div>
                )}
                {s.otherAllowances > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">Other Allowances</span>
                    <span className="font-mono text-white">{fmt(s.otherAllowances)}</span>
                  </div>
                )}
                {s.holidayBonus > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">Holiday Bonus</span>
                    <span className="font-mono text-[#c0a040]">{fmt(s.holidayBonus)}</span>
                  </div>
                )}
                {s.overtimeEarnings > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">OT Earnings</span>
                    <span className="font-mono text-[#c0a040]">{fmt(s.overtimeEarnings)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-t border-[#1e2d3d] font-semibold mt-1">
                  <span className="text-[#40c070]">Gross Wages</span>
                  <span className="font-mono text-[#40c070]">{fmt(s.grossWages)}</span>
                </div>

                {/* Deductions */}
                <div className="text-[9px] text-[#5a8ab8] uppercase tracking-wider font-semibold pt-2">Deductions</div>
                {s.pf > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">PF</span>
                    <span className="font-mono text-[#f09070]">{fmt(s.pf)}</span>
                  </div>
                )}
                {s.esi > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">ESI</span>
                    <span className="font-mono text-[#f09070]">{fmt(s.esi)}</span>
                  </div>
                )}
                {s.lwf > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">LWF</span>
                    <span className="font-mono text-[#f09070]">{fmt(s.lwf)}</span>
                  </div>
                )}
                {s.fineDeduction > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">Fine Deduction</span>
                    <span className="font-mono text-[#f07070]">{fmt(s.fineDeduction)}</span>
                  </div>
                )}
                {s.otherDeductions > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">Other Deductions</span>
                    <span className="font-mono text-[#f07070]">{fmt(s.otherDeductions)}</span>
                  </div>
                )}
                {s.advanceRecovered > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span className="text-[#8ab8d8]">Advance Recovered</span>
                    <span className="font-mono text-[#f07070]">{fmt(s.advanceRecovered)}</span>
                  </div>
                )}
                {s.totalDeductions > 0 && (
                  <div className="flex justify-between py-1 border-t border-[#1e2d3d] font-semibold mt-1">
                    <span className="text-[#f07070]">Total Deductions</span>
                    <span className="font-mono text-[#f07070]">{fmt(s.totalDeductions)}</span>
                  </div>
                )}

                {/* Net */}
                <div className="flex justify-between py-1.5 border-t-2 border-[#2a4a2a] mt-1">
                  <span className="text-sm font-bold text-white">Net Pay</span>
                  <span className="text-sm font-bold font-mono text-[#40c070]">{fmt(s.netWages)}</span>
                </div>

                {s.paymentDate && (
                  <div className="text-[10px] text-[#4a6a8a] pt-0.5">
                    Payment Date: {s.paymentDate}
                  </div>
                )}

                {/* Signature line */}
                <div className="pt-3 pb-1 border-t border-[#1a2a3a] mt-2">
                  <div className="text-[9px] text-[#3a5a7a]">Employee Signature: ___________________________</div>
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-t border-[#1a2a3a] bg-[#080f18] print:hidden">
              <Link
                href={`/cycles/${id}/salary-slips/${s.employeeId}`}
                className="flex-1 text-center text-xs py-1.5 bg-[#0f2040] text-[#4a9eff] rounded border border-[#1a3a6a] hover:bg-[#1a3060]"
              >
                View
              </Link>
              <Link
                href={`/cycles/${id}/salary-slips/${s.employeeId}?print=1`}
                target="_blank"
                className="flex-1 text-center text-xs py-1.5 bg-[#1a3a6a] text-[#8ac8ff] rounded border border-[#2a4a8a] hover:bg-[#1e4a7a]"
                onClick={undefined}
              >
                Print
              </Link>
            </div>
          </div>
        ))}
      </div>

      {slips.length === 0 && (
        <div className="px-6 py-12 text-center text-sm text-[#4a6a8a]">
          No employees in this cycle yet.{' '}
          <Link href={`/cycles/${id}`} className="text-[#4a9eff] hover:underline">Go back</Link>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          [class*="text-\\[#"] { color: black !important; }
          [class*="bg-\\[#"] { background: transparent !important; }
          .font-mono { font-family: monospace; }
        }
      `}</style>
    </div>
  )
}
