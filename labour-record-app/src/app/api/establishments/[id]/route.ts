import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEstablishment } from '@/domain/validations/establishment'
import type { EstablishmentType } from '@/generated/prisma/enums'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const establishment = await prisma.establishment.findUnique({
      where: { id },
      include: { _count: { select: { employees: true, monthlyCycles: true } } },
    })
    if (!establishment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(establishment)
  } catch (error) {
    console.error('GET /api/establishments/[id] failed:', error)
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = validateEstablishment(body as any)
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

    const previous = await prisma.establishment.findUnique({ where: { id } })
    if (!previous) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = body as any
    const updated = await prisma.establishment.update({
      where: { id },
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
        isActive: b.isActive ?? previous.isActive,
        wageFormulaConfig: b.wageFormulaConfig
          ? JSON.stringify(b.wageFormulaConfig)
          : '{}',
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'Establishment',
          entityId: id,
          action: 'UPDATED',
          previousValue: JSON.stringify({ name: previous.name }),
          newValue: JSON.stringify({ name: updated.name }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/establishments/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const establishment = await prisma.establishment.findUnique({
      where: { id },
      include: { _count: { select: { employees: true, monthlyCycles: true } } },
    })
    if (!establishment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (establishment._count.employees > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${establishment._count.employees} employee(s) are linked to this establishment. Remove them first.` },
        { status: 409 }
      )
    }
    if (establishment._count.monthlyCycles > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${establishment._count.monthlyCycles} monthly cycle(s) are linked to this establishment. Delete them first.` },
        { status: 409 }
      )
    }

    await prisma.wageRule.deleteMany({ where: { establishmentId: id } })
    await prisma.establishment.delete({ where: { id } })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'Establishment',
          entityId: id,
          action: 'DELETED',
          previousValue: JSON.stringify({ name: establishment.name }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/establishments/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
