import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFormCodes } from '@/domain/workflow/kanban-transitions'

// Financial year months in order: April (start year) → March (next year).
function fyMonths(startYear: number): { month: number; year: number }[] {
  const out: { month: number; year: number }[] = []
  for (let m = 4; m <= 12; m++) out.push({ month: m, year: startYear })
  for (let m = 1; m <= 3; m++) out.push({ month: m, year: startYear + 1 })
  return out
}

// Item 7: generate all 12 monthly cycles for a financial year (Apr–Mar) for an
// establishment, snapshotting active employees and seeding form tasks. Idempotent.
export async function POST(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as { establishmentId?: string; startYear?: number }
    if (!b.establishmentId) return NextResponse.json({ errors: ['establishmentId is required'] }, { status: 422 })
    const startYear = b.startYear ?? new Date().getFullYear()

    const establishment = await prisma.establishment.findUnique({ where: { id: b.establishmentId } })
    if (!establishment) return NextResponse.json({ errors: ['establishmentId not found'] }, { status: 422 })

    const formCodes = getFormCodes(establishment.type)
    let created = 0
    let skipped = 0
    const createdIds: string[] = []

    for (const { month, year } of fyMonths(startYear)) {
      const existing = await prisma.monthlyCycle.findUnique({
        where: { establishmentId_month_year: { establishmentId: b.establishmentId, month, year } },
      })
      if (existing) { skipped++; continue }

      const cycle = await prisma.monthlyCycle.create({
        data: { establishmentId: b.establishmentId, month, year, wagePeriodDays: 26 },
      })
      createdIds.push(cycle.id)

      const cycleStart = new Date(year, month - 1, 1)
      const employees = await prisma.employee.findMany({
        where: {
          establishmentId: b.establishmentId,
          status: 'ACTIVE',
          OR: [{ exitDate: null }, { exitDate: { gt: cycleStart } }],
        },
      })

      if (employees.length > 0) {
        await prisma.cycleEmployee.createMany({
          data: employees.map((emp) => ({
            cycleId: cycle.id,
            employeeId: emp.id,
            empDataSnapshot: JSON.stringify({
              empId: emp.empId, name: emp.name, sex: emp.sex,
              designation: emp.designation, department: emp.department,
              dateOfEntry: emp.dateOfEntry, uan: emp.uan, esiNo: emp.esiNo,
            }),
          })),
        })
      }

      await prisma.formTask.createMany({
        data: formCodes.map((formCode) => ({
          cycleId: cycle.id, formCode, status: 'NOT_STARTED' as const,
        })),
      })
      created++
    }

    return NextResponse.json({
      success: true,
      financialYear: `${startYear}-${(startYear + 1) % 100}`,
      created,
      skipped,
      cycleIds: createdIds,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/cycles/generate-fy failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
