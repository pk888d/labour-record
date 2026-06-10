import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { ESTABLISHMENT_TYPE_LABELS } from '@/domain/calculations/da-rates'
import type { EstablishmentType } from '@/types'
import { ApplyPfButton } from './apply-pf-button'

export default async function EstablishmentEmployeesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const establishment = await prisma.establishment.findUnique({
    where: { id },
    include: {
      employees: { orderBy: { name: 'asc' } },
    },
  })
  if (!establishment) notFound()

  const employees = establishment.employees
  const fmt = (n: number | null | undefined) => '₹' + (n ?? 0).toLocaleString('en-IN')

  return (
    <div>
      <PageHeader
        title={establishment.name}
        subtitle={`${ESTABLISHMENT_TYPE_LABELS[establishment.type as EstablishmentType] ?? establishment.type} · ${employees.length} employee${employees.length !== 1 ? 's' : ''}`}
        action={{ label: '+ Add Employee', href: `/employees/new?establishmentId=${id}` }}
      />

      <div className="px-6 pt-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-xs text-[#4a6a8a] hover:text-[#7a9ab8]">← Dashboard</Link>
        <Link href={`/establishments/${id}`} className="text-xs text-[#4a9eff] hover:underline">Edit firm details</Link>
        <div className="ml-auto">
          <ApplyPfButton establishmentId={id} />
        </div>
      </div>

      <div className="p-6">
        {employees.length === 0 ? (
          <p className="text-[#4a6a8a] text-sm">
            No employees yet.{' '}
            <Link href={`/employees/new?establishmentId=${id}`} className="text-[#4a9eff] hover:underline">
              Add the first one.
            </Link>
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Emp ID</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Name</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Designation</th>
                <th className="text-right py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Total Salary</th>
                <th className="text-right py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">PF</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-[#1a2332] hover:bg-[#111d2d]">
                  <td className="py-2 px-3 font-mono text-xs text-[#7a9ab8]">{emp.empId}</td>
                  <td className="py-2 px-3 font-medium text-white">{emp.name}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{emp.designation}</td>
                  <td className="py-2 px-3 text-right text-[#c8d8e8] font-mono">{fmt(emp.defaultTotalSalary)}</td>
                  <td className="py-2 px-3 text-right text-[#f09070] font-mono">{fmt(emp.pfAmount)}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      emp.status === 'ACTIVE' ? 'bg-[#0f2a1a] text-[#40c070]'
                        : emp.status === 'SUSPENDED' ? 'bg-[#2a2410] text-[#c0a040]'
                        : 'bg-[#2a1a1a] text-[#f07070]'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <Link href={`/employees/${emp.id}`} className="text-xs text-[#4a9eff] hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
