import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { ImportClient } from './import-client'

export const dynamic = 'force-dynamic'

export default async function ImportEmployeesPage() {
  const establishments = await prisma.establishment.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  return (
    <div>
      <PageHeader title="Import Employees" subtitle="Upload a CSV, TXT, or Excel file" />
      <ImportClient establishments={establishments} />
    </div>
  )
}
