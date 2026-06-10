import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCycleWithSlips, MONTH_NAMES } from '../slip-data'
import { PrintButton } from './print-button'
import { SlipCard } from './slip-card'
import { Watermark } from '@/components/print-brand'

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

      <Watermark />

      {/* One landscape sheet: Original (left) + Photocopy (right) */}
      <div className="ts-sheet max-w-5xl mx-auto my-8 print:my-0 print:max-w-none grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3 items-start">
        <SlipCard slip={slip} cycle={cycle} period={period} copyLabel="Original" />
        <SlipCard slip={slip} cycle={cycle} period={period} copyLabel="Duplicate (Photocopy)" />
      </div>

      {/* Counter (screen only) */}
      <p className="text-center text-xs text-[#3a5a7a] mt-3 print:hidden">
        {idx + 1} of {slips.length} employees · Original + Photocopy side-by-side (landscape)
      </p>

      {autoPrint === '1' && (
        <script dangerouslySetInnerHTML={{ __html: 'window.onload = () => { window.print(); }' }} />
      )}

      <style>{`
        @page { size: A4 landscape; margin: 10mm; }
        @media print {
          aside { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; }
          .ts-sheet { page-break-inside: avoid; }
          .ts-watermark { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}
