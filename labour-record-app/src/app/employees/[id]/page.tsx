import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/page-header'
import { EmployeeForm } from '@/components/employee-form'
import { DeleteEmployeeButton } from './delete-employee-button'

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [employee, establishments] = await Promise.all([
    prisma.employee.findUnique({ where: { id } }),
    prisma.establishment.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: 'asc' },
    }),
  ])
  if (!employee) notFound()
  return (
    <div>
      <PageHeader title={`Edit — ${employee.name}`} />
      <EmployeeForm employee={employee} establishments={establishments} />
      <div className="px-6 pb-6 border-t border-[#1e2d3d] pt-4 mt-2">
        <p className="text-xs text-[#5a8ab8] mb-2">Danger zone</p>
        <DeleteEmployeeButton employeeId={employee.id} name={employee.name} />
      </div>
    </div>
  )
}
