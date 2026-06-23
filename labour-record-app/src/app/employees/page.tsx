import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { parsePage, pageMeta } from '@/lib/paginate'

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ establishmentId?: string; status?: string; q?: string; page?: string }>
}) {
  const { establishmentId, status, q, page } = await searchParams

  const VALID_STATUSES = ['ACTIVE', 'SUSPENDED', 'EXITED']
  const statusFilter = status && VALID_STATUSES.includes(status) ? status : 'ACTIVE'
  const search = q?.trim() ?? ''

  const where = {
    ...(establishmentId ? { establishmentId } : {}),
    status: statusFilter as 'ACTIVE' | 'SUSPENDED' | 'EXITED',
    ...(search
      ? { OR: [{ name: { contains: search } }, { empId: { contains: search } }] }
      : {}),
  }

  const { skip, take, page: currentPage } = parsePage(page)
  const [total, employees] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { establishment: { select: { name: true, type: true } } },
      skip,
      take,
    }),
  ])
  const meta = pageMeta(total, currentPage)

  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const activeEstablishment = establishmentId
    ? establishments.find((e) => e.id === establishmentId)
    : null

  const newEmployeeHref = establishmentId
    ? `/employees/new?establishmentId=${establishmentId}`
    : '/employees/new'

  return (
    <div>
      <PageHeader
        title={activeEstablishment ? `Employees — ${activeEstablishment.name}` : 'Employees'}
        subtitle={`${total} employee${total !== 1 ? 's' : ''}`}
        action={{ label: '+ New Employee', href: newEmployeeHref }}
      />
      <div className="p-6">
        <div className="flex gap-3 mb-4">
          <form method="GET" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search name or ID…"
              aria-label="Search employees"
              className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8] w-48"
            />
            <select
              name="establishmentId"
              defaultValue={establishmentId ?? ''}
              className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
            >
              <option value="">All Establishments</option>
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
            >
              <option value="ACTIVE">Active</option>
              <option value="EXITED">Exited</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <button type="submit"
              className="px-3 py-1 bg-[#1a3050] text-[#4a9eff] text-xs rounded hover:bg-[#1a4060]">
              Filter
            </button>
          </form>
          <Link href="/employees/import"
            className="px-3 py-1 bg-[#1a3050] text-[#4a9eff] text-xs rounded hover:bg-[#1a4060]">
            ↥ Import
          </Link>
        </div>

        {total === 0 ? (
          <p className="text-[#4a6a8a] text-sm">No employees found.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">ID</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Name</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Sex</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Designation</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Establishment</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Entry Date</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-[#1a2332] hover:bg-[#111d2d]">
                  <td className="py-2 px-3 font-mono text-xs text-[#7a9ab8]">{emp.empId}</td>
                  <td className="py-2 px-3 font-medium text-white">{emp.name}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{emp.sex}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{emp.designation}</td>
                  <td className="py-2 px-3 text-[#7a9ab8] text-xs">{emp.establishment.name}</td>
                  <td className="py-2 px-3 text-[#7a9ab8] text-xs">
                    {emp.dateOfEntry ? new Date(emp.dateOfEntry).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      emp.status === 'ACTIVE' ? 'bg-[#0f2a1a] text-[#40c070]' :
                      emp.status === 'EXITED' ? 'bg-[#2a1a1a] text-[#f07070]' :
                      'bg-[#2a2010] text-[#c0a040]'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <Link href={`/employees/${emp.id}`}
                      className="text-xs text-[#4a9eff] hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination
          meta={meta}
          basePath="/employees"
          params={{ establishmentId, status: statusFilter, q: search }}
        />
      </div>
    </div>
  )
}
