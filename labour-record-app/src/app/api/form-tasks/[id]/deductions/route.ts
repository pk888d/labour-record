import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.deductionRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { damageDate: 'asc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/deductions failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
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

    const b = body as {
      employeeId?: string
      damageDate?: string
      description?: string
      damageAmount?: number
      deductionAmount?: number
      recovered?: number
      pendingRecovery?: number
      remarks?: string
    }

    if (!b.employeeId?.trim()) {
      return NextResponse.json({ errors: ['employeeId is required'] }, { status: 422 })
    }
    if (!b.damageDate) {
      return NextResponse.json({ errors: ['damageDate is required'] }, { status: 422 })
    }
    if (!b.description?.trim()) {
      return NextResponse.json({ errors: ['description is required'] }, { status: 422 })
    }

    const record = await prisma.deductionRecord.create({
      data: {
        cycleId: formTask.cycleId,
        employeeId: b.employeeId,
        damageDate: new Date(b.damageDate),
        description: b.description,
        damageAmount: b.damageAmount ?? 0,
        deductionAmount: b.deductionAmount ?? 0,
        recovered: b.recovered ?? 0,
        pendingRecovery: b.pendingRecovery ?? 0,
        remarks: b.remarks?.trim() ?? null,
      },
    })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('POST /api/form-tasks/[id]/deductions failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
