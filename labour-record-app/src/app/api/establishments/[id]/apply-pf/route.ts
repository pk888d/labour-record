import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculatePf, type PfMode } from '@/domain/calculations/pf-calculator'

type Params = { params: Promise<{ id: string }> }

// Item 5: apply a PF configuration to every employee in the establishment,
// recomputing each employee's pfAmount from their Basic + DA.
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = body as any
    const mode: PfMode = ['PERCENT', 'FIXED', 'NONE'].includes(b.pfMode) ? b.pfMode : 'PERCENT'
    const percent = parseFloat(b.pfPercent) || 12
    const ceiling = parseFloat(b.pfWageCeiling) || 15000
    const fixedAmount = parseFloat(b.pfFixedAmount) || 0

    const establishment = await prisma.establishment.findUnique({ where: { id } })
    if (!establishment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const employees = await prisma.employee.findMany({
      where: { establishmentId: id, status: 'ACTIVE' },
    })

    let updated = 0
    for (const emp of employees) {
      const pfWage = emp.basicWage + emp.daWage
      const pfAmount = calculatePf({ mode, percent, ceiling, fixedAmount }, pfWage)
      await prisma.employee.update({
        where: { id: emp.id },
        data: { pfMode: mode, pfPercent: percent, pfWageCeiling: ceiling, pfAmount },
      })
      updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error('POST /api/establishments/[id]/apply-pf failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
