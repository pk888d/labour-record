import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEstablishment } from '@/domain/validations/establishment'
import type { EstablishmentType } from '@/generated/prisma/enums'

export async function GET() {
  try {
    const establishments = await prisma.establishment.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { employees: true } } },
    })
    return NextResponse.json(establishments)
  } catch (error) {
    console.error('GET /api/establishments failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = validateEstablishment(body as any)
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = body as any
    const establishment = await prisma.establishment.create({
      data: {
        name: b.name.trim(),
        address: b.address.trim(),
        employerName: b.employerName.trim(),
        managerName: b.managerName.trim(),
        regCertNo: b.regCertNo.trim(),
        type: b.type as EstablishmentType,
        contactPhone: b.contactPhone?.trim() || null,
        contactEmail: b.contactEmail?.trim() || null,
        processingFee: parseFloat(b.processingFee) || 0,
        serviceStartDate: b.serviceStartDate ? new Date(b.serviceStartDate) : null,
        workWeekDays: b.workWeekDays === 5 ? 5 : 6,
        wageFormulaConfig: b.wageFormulaConfig
          ? JSON.stringify(b.wageFormulaConfig)
          : '{}',
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'Establishment',
          entityId: establishment.id,
          action: 'CREATED',
          newValue: JSON.stringify({ name: establishment.name, type: establishment.type }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json(establishment, { status: 201 })
  } catch (error) {
    console.error('POST /api/establishments failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
