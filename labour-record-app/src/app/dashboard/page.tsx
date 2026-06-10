import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { ESTABLISHMENT_TYPE_LABELS, getDaRate } from '@/domain/calculations/da-rates'
import type { EstablishmentType } from '@/types'

export default async function DashboardPage() {
  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { employees: true, monthlyCycles: true } },
    },
  })

  const totalEmployees = establishments.reduce((s, e) => s + e._count.employees, 0)
  const totalCycles = establishments.reduce((s, e) => s + e._count.monthlyCycles, 0)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`${establishments.length} firm${establishments.length !== 1 ? 's' : ''} · ${totalEmployees} employees`}
        action={{ label: '+ New Establishment', href: '/establishments/new' }}
      />

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Registered Firms" value={establishments.length} accent="#4a9eff" />
          <SummaryCard label="Total Employees" value={totalEmployees} accent="#40c070" />
          <SummaryCard label="Monthly Cycles" value={totalCycles} accent="#c087f0" />
        </div>

        {/* Firm grid */}
        {establishments.length === 0 ? (
          <p className="text-[#4a6a8a] text-sm">
            No firms yet.{' '}
            <Link href="/establishments/new" className="text-[#4a9eff] hover:underline">
              Register the first one.
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {establishments.map((est) => (
              <Link
                key={est.id}
                href={`/establishments/${est.id}/employees`}
                className="block p-4 rounded-lg bg-[#0a1520] border border-[#1e2d3d] hover:border-[#2a4060] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-white leading-tight">{est.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a2a50] text-[#7a9ab8] whitespace-nowrap ml-2">
                    {ESTABLISHMENT_TYPE_LABELS[est.type as EstablishmentType] ?? est.type}
                  </span>
                </div>
                <p className="text-[11px] text-[#4a6a8a] mt-1">{est.employerName}</p>

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1a2332]">
                  <div>
                    <p className="text-lg font-bold text-[#40c070] leading-none">{est._count.employees}</p>
                    <p className="text-[10px] text-[#4a6a8a] mt-1">Employees</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#c087f0] leading-none">{est._count.monthlyCycles}</p>
                    <p className="text-[10px] text-[#4a6a8a] mt-1">Cycles</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm font-semibold text-[#7a9ab8] leading-none">
                      ₹{getDaRate(est.type as EstablishmentType).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-[#4a6a8a] mt-1">DA rate</p>
                  </div>
                </div>

                <p className="text-[10px] text-[#4a9eff] mt-3">View employees →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="p-4 rounded-lg bg-[#0a1520] border border-[#1e2d3d]">
      <p className="text-3xl font-bold leading-none" style={{ color: accent }}>{value}</p>
      <p className="text-xs text-[#5a8ab8] mt-2">{label}</p>
    </div>
  )
}
