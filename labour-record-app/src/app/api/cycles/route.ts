import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateNewCycle } from '@/domain/validations/cycle'
import { getFormCodes } from '@/domain/workflow/kanban-transitions'
import { computeCycleWages } from '@/domain/calculations/cycle-wage'
import type { WageFormulaConfig } from '@/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishmentId')

    const cycles = await prisma.monthlyCycle.findMany({
      where: establishmentId ? { establishmentId } : undefined,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        establishment: { select: { name: true, type: true } },
        _count: { select: { formTasks: true, cycleEmployees: true } },
      },
    })
    return NextResponse.json(cycles)
  } catch (error) {
    console.error('GET /api/cycles failed:', error)
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

    const b = body as { establishmentId?: string; month?: number; year?: number; wagePeriodDays?: number }
    const errors = validateNewCycle({
      establishmentId: b.establishmentId ?? '',
      month: b.month ?? 0,
      year: b.year ?? 0,
      wagePeriodDays: b.wagePeriodDays,
    })
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

    const establishment = await prisma.establishment.findUnique({
      where: { id: b.establishmentId! },
    })
    if (!establishment) return NextResponse.json({ errors: ['establishmentId not found'] }, { status: 422 })

    const existing = await prisma.monthlyCycle.findUnique({
      where: {
        establishmentId_month_year: {
          establishmentId: b.establishmentId!,
          month: b.month!,
          year: b.year!,
        },
      },
    })
    if (existing) {
      return NextResponse.json(
        { errors: ['A cycle already exists for this establishment, month, and year'] },
        { status: 422 }
      )
    }

    const cycle = await prisma.monthlyCycle.create({
      data: {
        establishmentId: b.establishmentId!,
        month: b.month!,
        year: b.year!,
        wagePeriodDays: b.wagePeriodDays ?? 26,
      },
    })

    const cycleStart = new Date(b.year!, b.month! - 1, 1)
    const employees = await prisma.employee.findMany({
      where: {
        establishmentId: b.establishmentId!,
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
            empId: emp.empId,
            name: emp.name,
            sex: emp.sex,
            designation: emp.designation,
            department: emp.department,
            dateOfEntry: emp.dateOfEntry,
            uan: emp.uan,
            esiNo: emp.esiNo,
          }),
        })),
      })
    }

    // Seed a WageRecord per employee from their saved salary so the wages
    // register / slips reflect it immediately (#7). No attendance yet at
    // creation → holidayBonus 0; the Wages tab / Sync recompute later.
    const cfg = JSON.parse(establishment.wageFormulaConfig) as WageFormulaConfig
    const daysInMonth = new Date(b.year!, b.month!, 0).getDate()
    const seedRows = employees
      .filter((emp) => emp.defaultTotalSalary > 0)
      .map((emp) => {
        const c = computeCycleWages({
          employee: {
            defaultTotalSalary: emp.defaultTotalSalary,
            daWage: emp.daWage,
            hraWage: emp.hraWage,
            pfMode: emp.pfMode,
            pfPercent: emp.pfPercent,
            pfWageCeiling: emp.pfWageCeiling,
            pfAmount: emp.pfAmount,
            lwfAmount: emp.lwfAmount,
          },
          esiApplicable: !!cfg.esiApplicable,
          preset: cfg.preset,
          fixedAllowance: cfg.fixedAllowance,
          daysInMonth,
        })
        return {
          cycleId: cycle.id,
          employeeId: emp.id,
          daysWorked: c.daysWorked,
          basic: c.basic,
          da: c.da,
          hra: c.hra,
          totalNormalWages: c.totalNormalWages,
          totalEarnings: c.totalEarnings,
          overtimeEarnings: c.overtimeEarnings,
          grossWages: c.grossWages,
          pf: c.pf,
          esi: c.esi,
          lwf: c.lwf,
          totalDeductions: c.totalDeductions,
          netWages: c.netWages,
          holidayBonus: c.holidayBonus,
        }
      })
    if (seedRows.length > 0) {
      await prisma.wageRecord.createMany({ data: seedRows })
    }

    const formCodes = getFormCodes(establishment.type)
    await prisma.formTask.createMany({
      data: formCodes.map((formCode) => ({
        cycleId: cycle.id,
        formCode,
        status: 'NOT_STARTED' as const,
      })),
    })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'MonthlyCycle',
          entityId: cycle.id,
          action: 'CREATED',
          newValue: JSON.stringify({
            month: cycle.month,
            year: cycle.year,
            establishmentId: cycle.establishmentId,
          }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json(cycle, { status: 201 })
  } catch (error) {
    console.error('POST /api/cycles failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
