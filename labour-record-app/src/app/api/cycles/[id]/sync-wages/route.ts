import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeCycleWages } from '@/domain/calculations/cycle-wage'
import { getWageRuleValue } from '@/domain/calculations/wage-defaults'
import type { WageFormulaConfig } from '@/types'

type Params = { params: Promise<{ id: string }> }

// Re-pull every employee's saved salary (+ current attendance double-wage) into
// the cycle's WageRecords. Overwrites computed earnings; preserves manually
// entered fine/advance/other-deduction figures.
export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const cycle = await prisma.monthlyCycle.findUnique({
      where: { id },
      include: { establishment: true, cycleEmployees: { include: { employee: true } } },
    })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const cfg = JSON.parse(cycle.establishment.wageFormulaConfig) as WageFormulaConfig
    const daysInMonth = new Date(cycle.year, cycle.month, 0).getDate()

    const [rules, holidays, attendance, existing] = await Promise.all([
      prisma.wageRule.findMany({ where: { establishmentId: cycle.establishmentId } }),
      prisma.govtHoliday.findMany({
        where: {
          date: {
            gte: new Date(cycle.year, cycle.month - 1, 1),
            lte: new Date(cycle.year, cycle.month - 1, daysInMonth),
          },
        },
      }),
      prisma.attendanceRecord.findMany({ where: { cycleId: id } }),
      prisma.wageRecord.findMany({ where: { cycleId: id } }),
    ])
    const holidayDays = new Set(holidays.map((h) => new Date(h.date).getUTCDate()))
    const multiplier = getWageRuleValue(rules, 'HOLIDAY_MULTIPLIER')
    const attByEmp = new Map(attendance.map((a) => [a.employeeId, JSON.parse(a.dailyMarks) as string[]]))
    const existingByEmp = new Map(existing.map((w) => [w.employeeId, w]))

    let synced = 0
    for (const ce of cycle.cycleEmployees) {
      const e = ce.employee
      if (e.defaultTotalSalary <= 0) continue
      const c = computeCycleWages({
        employee: {
          defaultTotalSalary: e.defaultTotalSalary, daWage: e.daWage, hraWage: e.hraWage,
          pfMode: e.pfMode, pfPercent: e.pfPercent, pfWageCeiling: e.pfWageCeiling,
          pfAmount: e.pfAmount, lwfAmount: e.lwfAmount,
        },
        attendance: attByEmp.get(ce.employeeId),
        holidayDays,
        holidayMultiplier: multiplier,
        esiApplicable: !!cfg.esiApplicable,
        daysInMonth,
      })
      const prev = existingByEmp.get(ce.employeeId)
      const fineDeduction = prev?.fineDeduction ?? 0
      const otherDeductions = prev?.otherDeductions ?? 0
      const advanceRecovered = prev?.advanceRecovered ?? 0
      const totalDeductions = c.totalDeductions + fineDeduction + otherDeductions + advanceRecovered
      const netWages = c.grossWages - totalDeductions
      const data = {
        daysWorked: c.daysWorked, basic: c.basic, da: c.da, hra: c.hra,
        totalNormalWages: c.totalNormalWages, totalEarnings: c.totalEarnings,
        overtimeEarnings: c.overtimeEarnings, grossWages: c.grossWages,
        pf: c.pf, esi: c.esi, lwf: c.lwf, holidayBonus: c.holidayBonus,
        fineDeduction, otherDeductions, advanceRecovered, totalDeductions, netWages,
      }
      await prisma.wageRecord.upsert({
        where: { cycleId_employeeId: { cycleId: id, employeeId: ce.employeeId } },
        update: data,
        create: { cycleId: id, employeeId: ce.employeeId, ...data },
      })
      synced++
    }

    return NextResponse.json({ synced })
  } catch (error) {
    console.error('POST /api/cycles/[id]/sync-wages failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
