import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { FORM_DISPLAY_NAMES } from '@/types'
import type { FormCode } from '@/types'
import { loadComplianceChecks } from '@/lib/compliance/load'
import type { PreflightFinding } from '@/domain/compliance/preflight'
import { ExportButton } from './export-button'
import { SyncEmployeesButton } from './sync-employees-button'
import { SyncWagesButton } from './sync-wages-button'

const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December']

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED:      'bg-[#1a2332] text-[#4a6a8a]',
  DATA_ENTRY:       'bg-[#1a2a50] text-[#4a9eff]',
  READY_FOR_REVIEW: 'bg-[#2a2010] text-[#c0a040]',
  NEEDS_CORRECTION: 'bg-[#2a1010] text-[#f07070]',
  APPROVED:         'bg-[#0f2a1a] text-[#40c070]',
  EXPORTED:         'bg-[#1a0f2a] text-[#c087f0]',
}

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cycle = await prisma.monthlyCycle.findUnique({
    where: { id },
    include: {
      establishment: { select: { name: true, type: true } },
      formTasks: { orderBy: { formCode: 'asc' } },
      cycleEmployees: {
        include: { employee: { select: { empId: true, name: true, designation: true, status: true } } },
        orderBy: { employee: { name: 'asc' } },
      },
    },
  })
  if (!cycle) notFound()

  const findings = (await loadComplianceChecks(id)) ?? []
  const preflightErrors = findings.filter((f) => f.severity === 'error')
  const preflightWarnings = findings.filter((f) => f.severity === 'warning')

  const periodLabel = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div>
      <PageHeader
        title={`${cycle.establishment.name} — ${periodLabel}`}
        subtitle={`${cycle.establishment.type} · ${cycle.cycleEmployees.length} employees · ${cycle.status}`}
      />
      <div className="p-6 space-y-6">
        <section data-testid="preflight-panel">
          <h2 className="text-xs font-semibold text-[#c8d8e8] uppercase tracking-wide mb-3">
            Compliance Pre-flight
          </h2>
          {findings.length === 0 ? (
            <div data-testid="preflight-pass"
              className="px-3 py-2 rounded bg-[#0f2a1a] border border-[#1a4a2a] text-sm text-[#40c070]">
              All checks passed — this cycle looks ready for print &amp; export.
            </div>
          ) : (
            <div className="space-y-2">
              {preflightErrors.length > 0 && (
                <div className="rounded bg-[#2a1010] border border-[#4a1a1a] px-3 py-2">
                  <p className="text-xs font-semibold text-[#f07070] uppercase tracking-wide mb-1">
                    Errors ({preflightErrors.length})
                  </p>
                  <ul className="space-y-0.5">
                    {preflightErrors.map((f, i) => (
                      <PreflightRow key={`e-${i}`} finding={f} textColor="text-[#f0a0a0]" />
                    ))}
                  </ul>
                </div>
              )}
              {preflightWarnings.length > 0 && (
                <div className="rounded bg-[#2a2010] border border-[#4a3a1a] px-3 py-2">
                  <p className="text-xs font-semibold text-[#c0a040] uppercase tracking-wide mb-1">
                    Warnings ({preflightWarnings.length})
                  </p>
                  <ul className="space-y-0.5">
                    {preflightWarnings.map((f, i) => (
                      <PreflightRow key={`w-${i}`} finding={f} textColor="text-[#d8c080]" />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[#c8d8e8] uppercase tracking-wide">Form Tasks</h2>
            {findings.length > 0 && (
              <span data-testid="preflight-export-warning"
                className={`text-xs px-2 py-0.5 rounded ${
                  preflightErrors.length > 0
                    ? 'bg-[#2a1010] text-[#f07070] border border-[#4a1a1a]'
                    : 'bg-[#2a2010] text-[#c0a040] border border-[#4a3a1a]'
                }`}>
                ⚠ {findings.length} compliance issue{findings.length === 1 ? '' : 's'} — review
                pre-flight before printing or exporting
              </span>
            )}
          </div>
          <div className="space-y-1">
            {cycle.formTasks.map((task) => {
              const display = FORM_DISPLAY_NAMES[task.formCode as FormCode]
              return (
                <div key={task.id}
                  className="flex items-center justify-between px-3 py-2 rounded bg-[#0f1923] border border-[#1e2d3d]">
                  <div>
                    <span className="text-sm text-white">{display?.name ?? task.formCode}</span>
                    <span className="ml-2 text-xs text-[#4a6a8a]">{display?.ref}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[task.status] ?? ''}`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                    <Link href={`/forms/${task.id}`}
                      className="text-xs text-[#4a9eff] hover:underline">Open</Link>
                    <Link href={`/print/${cycle.id}/${task.formCode}`} target="_blank"
                      className="text-xs text-[#7a9ab8] hover:text-[#c8d8e8] hover:underline">Print</Link>
                    {task.formCode === 'FORM_XVII' || task.formCode === 'FORM_U' ? (
                      <Link href={`/cycles/${cycle.id}/salary-slips`}
                        className="text-xs text-[#40c070] hover:underline">Slips</Link>
                    ) : null}
                    <ExportButton formTaskId={task.id} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[#c8d8e8] uppercase tracking-wide">
              Employees in this Cycle ({cycle.cycleEmployees.length})
            </h2>
            <div className="flex items-center gap-3">
              <Link href={`/cycles/${cycle.id}/salary-slips`}
                className="text-xs px-3 py-1 rounded bg-[#0f2a1a] text-[#40c070] border border-[#1a4a2a] hover:bg-[#1a3a20]">
                Salary Slips
              </Link>
              <a href={`/api/cycles/${cycle.id}/disbursement`}
                className="text-xs px-3 py-1 rounded bg-[#2a2010] text-[#c0a040] border border-[#4a3a1a] hover:bg-[#3a2c14]">
                ₹ Bank Disbursement
              </a>
              <SyncEmployeesButton cycleId={cycle.id} />
              <SyncWagesButton cycleId={cycle.id} />
            </div>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">ID</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Name</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Designation</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {cycle.cycleEmployees.map((ce) => (
                <tr key={ce.id} className="border-b border-[#1a2332]">
                  <td className="py-2 px-3 font-mono text-xs text-[#7a9ab8]">{ce.employee.empId}</td>
                  <td className="py-2 px-3 text-white">{ce.employee.name}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{ce.employee.designation}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      ce.employee.status === 'ACTIVE' ? 'bg-[#0f2a1a] text-[#40c070]' :
                      ce.employee.status === 'EXITED' ? 'bg-[#2a1a1a] text-[#f07070]' :
                      'bg-[#2a2010] text-[#c0a040]'
                    }`}>
                      {ce.employee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function PreflightRow({ finding, textColor }: { finding: PreflightFinding; textColor: string }) {
  return (
    <li data-testid="preflight-finding" data-severity={finding.severity}
      className={`text-sm ${textColor}`}>
      {finding.employeeName ? (
        <span className="font-medium text-white">{finding.employeeName}: </span>
      ) : null}
      {finding.message}
    </li>
  )
}
