import { prisma } from '@/lib/prisma'
import { WageRulesClient } from './wage-rules-client'

export default async function WageRulesPage() {
  const establishments = await prisma.establishment.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
  return <WageRulesClient establishments={establishments} />
}
