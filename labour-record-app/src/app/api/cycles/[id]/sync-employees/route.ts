import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params

    const cycle = await prisma.monthlyCycle.findUnique({
      where: { id },
      include: {
        cycleEmployees: { select: { employeeId: true } },
      },
    })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const cycleStart = new Date(cycle.year, cycle.month - 1, 1)
    const existingIds = new Set(cycle.cycleEmployees.map((ce) => ce.employeeId))

    const newEmployees = await prisma.employee.findMany({
      where: {
        establishmentId: cycle.establishmentId,
        status: 'ACTIVE',
        OR: [{ exitDate: null }, { exitDate: { gt: cycleStart } }],
        id: { notIn: [...existingIds] },
      },
    })

    if (newEmployees.length === 0) {
      return NextResponse.json({ added: 0 })
    }

    await prisma.cycleEmployee.createMany({
      data: newEmployees.map((emp) => ({
        cycleId: id,
        employeeId: emp.id,
        empDataSnapshot: JSON.stringify({
          empId: emp.empId,
          name: emp.name,
          sex: emp.sex,
          designation: emp.designation,
          department: emp.department,
          dateOfEntry: emp.dateOfEntry,
          uan: emp.uan,
          esiNo: emp.esiNo,
        }),
      })),
    })

    return NextResponse.json({ added: newEmployees.length })
  } catch (error) {
    console.error('POST /api/cycles/[id]/sync-employees failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
