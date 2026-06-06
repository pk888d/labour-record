import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { CycleForm } from '@/components/cycle-form'

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
