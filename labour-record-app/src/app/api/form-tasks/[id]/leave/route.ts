import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateEarnedLeaveClosing } from '@/domain/calculations/leave-calculator'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.leaveRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { employee: { name: 'asc' } },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/leave failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type LeaveRecordInput = {
  employeeId: string
  earnedLeaveOpening: number
  earnedDuring: number
  earnedAvailed: number
  medicalLeave: number
  otherLeave: number
  maternityInfo?: string
  gratuityInfo?: string
  nominationInfo?: string
  remarks?: string
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as { records?: LeaveRecordInput[] }
    if (!Array.isArray(b.records)) {
      return NextResponse.json({ errors: ['records must be an array'] }, { status: 422 })
    }

    const updated = await Promise.all(
      b.records.map((r) => {
        const earnedClosing = calculateEarnedLeaveClosing(
          r.earnedLeaveOpening,
          r.earnedDuring,
          r.earnedAvailed
        )
        const data = {
          earnedLeaveOpening: r.earnedLeaveOpening,
          earnedDuring: r.earnedDuring,
          earnedAvailed: r.earnedAvailed,
          earnedClosing,
          medicalLeave: r.medicalLeave,
          otherLeave: r.otherLeave,
          maternityInfo: r.maternityInfo?.trim() ?? null,
          gratuityInfo: r.gratuityInfo?.trim() ?? null,
          nominationInfo: r.nominationInfo?.trim() ?? null,
          remarks: r.remarks?.trim() ?? null,
        }
        return prisma.leaveRecord.upsert({
          where: {
            cycleId_employeeId: {
              cycleId: formTask.cycleId,
              employeeId: r.employeeId,
            },
          },
          update: data,
          create: { cycleId: formTask.cycleId, employeeId: r.employeeId, ...data },
        })
      })
    )

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/form-tasks/[id]/leave failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
