import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const cycle = await prisma.monthlyCycle.findUnique({
      where: { id },
      include: {
        establishment: {
          select: { name: true, type: true, employerName: true, managerName: true },
        },
        formTasks: { orderBy: { formCode: 'asc' } },
        cycleEmployees: {
          include: {
            employee: {
              select: { empId: true, name: true, designation: true, status: true },
            },
          },
        },
        _count: { select: { formTasks: true, cycleEmployees: true } },
      },
    })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(cycle)
  } catch (error) {
    console.error('GET /api/cycles/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as { status?: string; wagePeriodDays?: number }
    const cycle = await prisma.monthlyCycle.findUnique({ where: { id } })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const validStatuses = ['OPEN', 'LOCKED']
    if (b.status && !validStatuses.includes(b.status)) {
      return NextResponse.json({ errors: ['status must be OPEN or LOCKED'] }, { status: 422 })
    }

    const updated = await prisma.monthlyCycle.update({
      where: { id },
      data: {
        ...(b.status ? { status: b.status as 'OPEN' | 'LOCKED' } : {}),
        ...(b.wagePeriodDays ? { wagePeriodDays: b.wagePeriodDays } : {}),
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'MonthlyCycle',
          entityId: id,
          action: 'UPDATED',
          previousValue: JSON.stringify({ status: cycle.status }),
          newValue: JSON.stringify({ status: updated.status }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/cycles/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const cycle = await prisma.monthlyCycle.findUnique({ where: { id } })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Delete child records in dependency order
    const formTaskIds = await prisma.formTask.findMany({
      where: { cycleId: id },
      select: { id: true },
    })
    const taskIds = formTaskIds.map((t) => t.id)

    await prisma.formTaskStatusHistory.deleteMany({ where: { formTaskId: { in: taskIds } } })
    await prisma.generatedDocument.deleteMany({ where: { formTaskId: { in: taskIds } } })
    await prisma.formTask.deleteMany({ where: { cycleId: id } })
    await prisma.attendanceRecord.deleteMany({ where: { cycleId: id } })
    await prisma.wageRecord.deleteMany({ where: { cycleId: id } })
    await prisma.leaveRecord.deleteMany({ where: { cycleId: id } })
    await prisma.overtimeRecord.deleteMany({ where: { cycleId: id } })
    await prisma.fineRecord.deleteMany({ where: { cycleId: id } })
    await prisma.deductionRecord.deleteMany({ where: { cycleId: id } })
    await prisma.cycleEmployee.deleteMany({ where: { cycleId: id } })
    await prisma.monthlyCycle.delete({ where: { id } })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'MonthlyCycle',
          entityId: id,
          action: 'DELETED',
          previousValue: JSON.stringify({ month: cycle.month, year: cycle.year }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/cycles/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
