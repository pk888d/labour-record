import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { getDaRate } from '@/domain/calculations/da-rates'
import type { EstablishmentType } from '@/types'
import { DashboardEstablishments, type EstRow } from './dashboard-establishments'
import { RemindersPanel } from './reminders-panel'
import { loadReminders } from '@/lib/calendar/load'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true, monthlyCycles: true } } },
  })
  const reminders = await loadReminders()

  const taskGroups = await prisma.formTask.groupBy({ by: ['status'], _count: { _all: true } })
  const taskCountByStatus = Object.fromEntries(
    taskGroups.map((t) => [t.status, t._count._all]),
  ) as Record<string, number>

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

        <WorkloadPanel countByStatus={taskCountByStatus} />

        <RemindersPanel reminders={reminders} />

        <DashboardEstablishments establishments={rows} />
      </div>
    </div>
  )
}

const WORKFLOW_STATUSES: { key: string; label: string; color: string }[] = [
  { key: 'NOT_STARTED', label: 'Not Started', color: '#7a9ab8' },
  { key: 'DATA_ENTRY', label: 'Data Entry', color: '#4a9eff' },
  { key: 'READY_FOR_REVIEW', label: 'Review', color: '#c0a040' },
  { key: 'NEEDS_CORRECTION', label: 'Correction', color: '#f07070' },
  { key: 'APPROVED', label: 'Approved', color: '#40c070' },
  { key: 'EXPORTED', label: 'Exported', color: '#5fd38a' },
]

function WorkloadPanel({ countByStatus }: { countByStatus: Record<string, number> }) {
  const open = WORKFLOW_STATUSES
    .filter((s) => s.key !== 'EXPORTED')
    .reduce((sum, s) => sum + (countByStatus[s.key] ?? 0), 0)
  return (
    <div className="p-4 rounded-lg bg-[var(--ts-navy-mid)] border border-[var(--ts-border)]">
      <p className="text-xs text-[var(--ts-text-muted)] mb-3">
        Form workload — <span className="text-[var(--ts-gold)] font-semibold">{open} open</span> task{open !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {WORKFLOW_STATUSES.map((s) => (
          <div key={s.key} className="text-center">
            <p className="text-2xl font-bold leading-none" style={{ color: s.color }}>
              {countByStatus[s.key] ?? 0}
            </p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">{s.label}</p>
          </div>
        ))}
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
