import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { CycleForm } from '@/components/cycle-form'

// Data-driven (establishment dropdown): render per request to reflect live data.
export const dynamic = 'force-dynamic'

export default async function NewCyclePage() {
  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' },
  })
  return (
    <div>
      <PageHeader title="New Monthly Cycle" />
      <CycleForm establishments={establishments} />
    </div>
  )
}
