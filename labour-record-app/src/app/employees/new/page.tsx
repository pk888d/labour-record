import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { EmployeeForm } from '@/components/employee-form'

export default async function NewEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ establishmentId?: string }>
}) {
  const { establishmentId } = await searchParams
  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' },
  })
  return (
    <div>
      <PageHeader title="New Employee" />
      <EmployeeForm establishments={establishments} defaultEstablishmentId={establishmentId} />
    </div>
  )
}
