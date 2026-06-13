import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { DeleteCycleButton } from './delete-cycle-button'
import { GenerateFyButton } from './generate-fy-button'

const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December']

// Data-driven list: render per request so newly created records appear without a rebuild.
export const dynamic = 'force-dynamic'

export default async function CyclesPage() {
  const cycles = await prisma.monthlyCycle.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: {
      establishment: { select: { name: true, type: true } },
      _count: { select: { formTasks: true, cycleEmployees: true } },
    },
  })

  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <PageHeader
        title="Monthly Cycles"
        subtitle={`${cycles.length} cycle${cycles.length !== 1 ? 's' : ''}`}
        action={{ label: '+ New Cycle', href: '/cycles/new' }}
      />
      {establishments.length > 0 && (
        <div className="px-6 pt-3">
          <GenerateFyButton establishments={establishments} />
        </div>
      )}
      <div className="p-6">
        {cycles.length === 0 ? (
          <p className="text-[#4a6a8a] text-sm">
            No cycles yet.{' '}
            <Link href="/cycles/new" className="text-[#4a9eff] hover:underline">
              Create the first one.
            </Link>
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Period</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Establishment</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Employees</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Forms</th>
                <th className="text-left py-2 px-3 text-[#5a8ab8] font-medium text-xs uppercase">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => (
                <tr key={cycle.id} className="border-b border-[#1a2332] hover:bg-[#111d2d]">
                  <td className="py-2 px-3 font-medium text-white">
                    {MONTH_NAMES[cycle.month]} {cycle.year}
                  </td>
                  <td className="py-2 px-3 text-[#7a9ab8]">
                    {cycle.establishment.name}
                    <span className="ml-2 text-[10px] text-[#4a6a8a]">{cycle.establishment.type}</span>
                  </td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{cycle._count.cycleEmployees}</td>
                  <td className="py-2 px-3 text-[#7a9ab8]">{cycle._count.formTasks}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      cycle.status === 'OPEN'
                        ? 'bg-[#0f2a1a] text-[#40c070]'
                        : 'bg-[#2a2010] text-[#c0a040]'
                    }`}>
                      {cycle.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/cycles/${cycle.id}`}
                        className="text-xs text-[#4a9eff] hover:underline">View</Link>
                      <DeleteCycleButton
                        cycleId={cycle.id}
                        label={`${MONTH_NAMES[cycle.month]} ${cycle.year}`}
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
