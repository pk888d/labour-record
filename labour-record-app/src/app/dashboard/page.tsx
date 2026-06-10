import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { getDaRate } from '@/domain/calculations/da-rates'
import type { EstablishmentType } from '@/types'
import { DashboardEstablishments, type EstRow } from './dashboard-establishments'

export default async function DashboardPage() {
  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true, monthlyCycles: true } } },
  })

  const rows: EstRow[] = establishments.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type as EstablishmentType,
    address: e.address,
    employerName: e.employerName,
    managerName: e.managerName,
    regCertNo: e.regCertNo,
    contactPhone: e.contactPhone,
    contactEmail: e.contactEmail,
    processingFee: e.processingFee,
    serviceStartDate: e.serviceStartDate ? e.serviceStartDate.toISOString().split('T')[0] : null,
    employees: e._count.employees,
    cycles: e._count.monthlyCycles,
    daRate: getDaRate(e.type as EstablishmentType),
  }))

  const totalEmployees = rows.reduce((s, e) => s + e.employees, 0)
  const totalCycles = rows.reduce((s, e) => s + e.cycles, 0)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`${rows.length} firm${rows.length !== 1 ? 's' : ''} · ${totalEmployees} employees`}
        action={{ label: '+ New Establishment', href: '/establishments/new' }}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Registered Firms" value={rows.length} accent="var(--ts-gold)" />
          <SummaryCard label="Total Employees" value={totalEmployees} accent="var(--ts-green)" />
          <SummaryCard label="Monthly Cycles" value={totalCycles} accent="var(--ts-blue)" />
        </div>

        <DashboardEstablishments establishments={rows} />
      </div>
    </div>
  )
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="p-4 rounded-lg bg-[var(--ts-navy-mid)] border border-[var(--ts-border)]">
      <p className="text-3xl font-bold leading-none" style={{ color: accent }}>{value}</p>
      <p className="text-xs text-[var(--ts-text-muted)] mt-2">{label}</p>
    </div>
  )
}
