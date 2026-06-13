import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { DeleteEstablishmentButton } from './delete-establishment-button'
import { ESTABLISHMENT_TYPE_LABELS } from '@/domain/calculations/da-rates'
import type { EstablishmentType } from '@/types'

// Data-driven list: render per request so newly created records appear without a rebuild.
export const dynamic = 'force-dynamic'

export default async function EstablishmentsPage() {
  const establishments = await prisma.establishment.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true, monthlyCycles: true } } },
  })

  return (
    <div>
      <PageHeader
        title="Establishments"
        subtitle={`${establishments.length} establishment${establishments.length !== 1 ? 's' : ''}`}
        action={{ label: '+ New Establishment', href: '/establishments/new' }}
      />
      <div className="p-6">
        {establishments.length === 0 ? (
          <p className="text-[#4a6a8a] text-sm">
            No establishments yet.{' '}
            <Link href="/establishments/new" className="text-[#4a9eff] hover:underline">
              Create the first one.
            </Link>
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Name</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Type</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Employer</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Reg. No.</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Employees</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {establishments.map((est) => (
                <tr key={est.id} className="border-b border-[#1a2332] hover:bg-[#111d2d]">
                  <td className="py-2 px-3 font-medium">
                    <Link href={`/establishments/${est.id}/employees`} className="text-white hover:text-[#4a9eff] hover:underline">
                      {est.name}
                    </Link>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      est.type === 'HOSPITAL'
                        ? 'bg-[#1a2a50] text-[#4a9eff]'
                        : 'bg-[#2a1a40] text-[#c087f0]'
                    }`}>
                      {ESTABLISHMENT_TYPE_LABELS[est.type as EstablishmentType] ?? est.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{est.employerName}</td>
                  <td className="py-2 px-3 text-[#7a9ab8] font-mono text-xs">{est.regCertNo}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{est._count.employees}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      est.isActive ? 'bg-[#0f2a1a] text-[#40c070]' : 'bg-[#2a1a1a] text-[#f07070]'
                    }`}>
                      {est.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/establishments/${est.id}`}
                        className="text-xs text-[#4a9eff] hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteEstablishmentButton
                        establishmentId={est.id}
                        name={est.name}
                      />
                    </div>
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
