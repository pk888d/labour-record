import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePresentMoneyFields, FINE_MONEY_FIELDS } from '@/domain/validations/record-numbers'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.fineRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { offenceDate: 'asc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/fines failed:', error)
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
      offenceDate?: string
      offenceDescription?: string
      showCauseDate?: string
      wagePeriod?: string
      wagesOnDate?: number
      fineAmount?: number
      recovered?: number
      pendingRecovery?: number
      remarks?: string
    }

    if (!b.employeeId?.trim()) {
      return NextResponse.json({ errors: ['employeeId is required'] }, { status: 422 })
    }
    if (!b.offenceDate) {
      return NextResponse.json({ errors: ['offenceDate is required'] }, { status: 422 })
    }
    if (!b.offenceDescription?.trim()) {
      return NextResponse.json({ errors: ['offenceDescription is required'] }, { status: 422 })
    }
    const moneyErrors = validatePresentMoneyFields(b as Record<string, unknown>, FINE_MONEY_FIELDS)
    if (moneyErrors.length > 0) {
      return NextResponse.json({ errors: moneyErrors }, { status: 422 })
    }

    const record = await prisma.fineRecord.create({
      data: {
        cycleId: formTask.cycleId,
        employeeId: b.employeeId,
        offenceDate: new Date(b.offenceDate),
        offenceDescription: b.offenceDescription,
        showCauseDate: b.showCauseDate ? new Date(b.showCauseDate) : null,
        wagePeriod: b.wagePeriod?.trim() ?? null,
        wagesOnDate: b.wagesOnDate ?? 0,
        fineAmount: b.fineAmount ?? 0,
        recovered: b.recovered ?? 0,
        pendingRecovery: b.pendingRecovery ?? 0,
        remarks: b.remarks?.trim() ?? null,
      },
    })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('POST /api/form-tasks/[id]/fines failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
