import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { parsePage, pageMeta } from '@/lib/paginate'

export const dynamic = 'force-dynamic'

const ACTION_COLORS: Record<string, string> = {
  CREATED: '#40c070',
  UPDATED: '#4a9eff',
  DELETED: '#f07070',
}

function preview(value: string | null): string {
  if (!value) return ''
  const text = value.length > 80 ? `${value.slice(0, 80)}…` : value
  return text
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; page?: string }>
}) {
  const { entityType, page } = await searchParams
  const where = entityType ? { entityType } : {}

  const { skip, take, page: currentPage } = parsePage(page)
  const [total, entries, typeGroups] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { changedAt: 'desc' }, skip, take }),
    prisma.auditLog.groupBy({ by: ['entityType'], _count: { _all: true } }),
  ])
  const meta = pageMeta(total, currentPage)
  const entityTypes = typeGroups.map((g) => g.entityType).sort()

  return (
    <div>
      <PageHeader title="Audit Log" subtitle={`${total} event${total !== 1 ? 's' : ''}`} />
      <div className="p-6">
        <div className="mb-4">
          <form method="GET" className="flex gap-2">
            <select
              name="entityType"
              defaultValue={entityType ?? ''}
              aria-label="Filter by entity type"
              className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
            >
              <option value="">All entity types</option>
              {entityTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button type="submit"
              className="px-3 py-1 bg-[#1a3050] text-[#4a9eff] text-xs rounded hover:bg-[#1a4060]">
              Filter
            </button>
          </form>
        </div>

        {total === 0 ? (
          <p className="text-[#4a6a8a] text-sm">No audit events recorded.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">When</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Entity</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Action</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-[#1a2332] hover:bg-[#111d2d] align-top">
                  <td className="py-2 px-3 text-[#7a9ab8] text-xs whitespace-nowrap">
                    {new Date(e.changedAt).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 px-3 text-[#c8d8e8] text-xs">
                    {e.entityType}
                    <span className="block font-mono text-[10px] text-[#4a6a8a]">{e.entityId}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-xs font-medium" style={{ color: ACTION_COLORS[e.action] ?? '#c8d8e8' }}>
                      {e.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[#7a9ab8] text-[11px] font-mono">
                    {preview(e.newValue ?? e.previousValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination meta={meta} basePath="/audit" params={{ entityType }} />
      </div>
    </div>
  )
}
