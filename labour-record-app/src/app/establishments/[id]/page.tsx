import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { EstablishmentForm } from '@/components/establishment-form'

export default async function EditEstablishmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const establishment = await prisma.establishment.findUnique({ where: { id } })
  if (!establishment) notFound()

  return (
    <div>
      <PageHeader
        title={`Edit — ${establishment.name}`}
        action={{ label: '+ Add Employee', href: `/employees/new?establishmentId=${id}` }}
      />
      <div className="px-6 pt-3">
        <Link
          href={`/employees?establishmentId=${id}`}
          className="text-xs text-[#4a9eff] hover:underline"
        >
          ← View all employees for this establishment
        </Link>
      </div>
      <EstablishmentForm establishment={establishment} />
    </div>
  )
}
