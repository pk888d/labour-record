import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAttendanceTotals } from '@/domain/calculations/attendance-calculator'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.attendanceRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { employee: { name: 'asc' } },
    })

    return NextResponse.json(
      records.map((r) => ({
        ...r,
        dailyMarks: JSON.parse(r.dailyMarks) as string[],
      }))
    )
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/attendance failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type AttendanceRecordInput = {
  employeeId: string
  workStartTime?: string
  workEndTime?: string
  restInterval?: string
  dailyMarks: string[]
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

    const b = body as { records?: AttendanceRecordInput[] }
    if (!Array.isArray(b.records)) {
      return NextResponse.json({ errors: ['records must be an array'] }, { status: 422 })
    }

    const updated = await Promise.all(
      b.records.map((r) => {
        const totals = calculateAttendanceTotals(r.dailyMarks)
        const data = {
          workStartTime: r.workStartTime?.trim() ?? null,
          workEndTime: r.workEndTime?.trim() ?? null,
          restInterval: r.restInterval?.trim() ?? null,
          dailyMarks: JSON.stringify(r.dailyMarks),
          daysWorked: totals.daysWorked,
          leaveDays: totals.leaveDays,
          absentDays: totals.absentDays,
          wageDays: totals.wageDays,
          remarks: r.remarks?.trim() ?? null,
        }
        return prisma.attendanceRecord.upsert({
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

    return NextResponse.json(
      updated.map((r) => ({ ...r, dailyMarks: JSON.parse(r.dailyMarks) as string[] }))
    )
  } catch (error) {
    console.error('PUT /api/form-tasks/[id]/attendance failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
