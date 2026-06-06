import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateOvertimeTotals } from '@/domain/calculations/overtime-calculator'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.overtimeRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { employee: { name: 'asc' } },
    })

    return NextResponse.json(
      records.map((r) => ({
        ...r,
        dailyOt: JSON.parse(r.dailyOt) as number[],
      }))
    )
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/overtime failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type OvertimeRecordInput = {
  employeeId: string
  dailyOt: number[]
  normalHoursRate: number
  otRate: number
  normalEarnings: number
  paymentDate?: string
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

    const b = body as { records?: OvertimeRecordInput[] }
    if (!Array.isArray(b.records)) {
      return NextResponse.json({ errors: ['records must be an array'] }, { status: 422 })
    }

    const updated = await Promise.all(
      b.records.map((r) => {
        const calc = calculateOvertimeTotals(r.dailyOt, r.normalEarnings, r.otRate)
        const data = {
          dailyOt: JSON.stringify(r.dailyOt),
          normalHoursRate: r.normalHoursRate,
          otRate: r.otRate,
          normalEarnings: r.normalEarnings,
          totalOtHours: calc.totalOtHours,
          otEarnings: calc.otEarnings,
          totalEarnings: calc.totalEarnings,
          paymentDate: r.paymentDate ? new Date(r.paymentDate) : null,
        }
        return prisma.overtimeRecord.upsert({
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
      updated.map((r) => ({ ...r, dailyOt: JSON.parse(r.dailyOt) as number[] }))
    )
  } catch (error) {
    console.error('PUT /api/form-tasks/[id]/overtime failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
