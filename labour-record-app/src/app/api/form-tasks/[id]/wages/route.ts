import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateWages } from '@/domain/calculations/wage-calculator'
import { getWageRuleValue } from '@/domain/calculations/wage-defaults'
import type { WageFormulaConfig } from '@/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const formTask = await prisma.formTask.findUnique({ where: { id } })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const records = await prisma.wageRecord.findMany({
      where: { cycleId: formTask.cycleId },
      include: { employee: { select: { empId: true, name: true } } },
      orderBy: { employee: { name: 'asc' } },
    })

    return NextResponse.json(
      records.map((r) => ({
        ...r,
        otherAllowances: Number((JSON.parse(r.otherAllowances) as number[])[0] ?? 0),
      }))
    )
  } catch (error) {
    console.error('GET /api/form-tasks/[id]/wages failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type WageRecordInput = {
  employeeId: string
  daysWorked: number
  basic: number
  da: number
  hra: number
  otherAllowances: number
  pf: number
  esi: number
  lwf: number
  advanceRecovered: number
  fineDeduction: number
  otherDeductions: number
  paymentDate?: string
  receiptRef?: string
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params

    const formTask = await prisma.formTask.findUnique({
      where: { id },
      include: { cycle: { include: { establishment: true } } },
    })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as { records?: WageRecordInput[] }
    if (!Array.isArray(b.records)) {
      return NextResponse.json({ errors: ['records must be an array'] }, { status: 422 })
    }

    const config = JSON.parse(
      formTask.cycle.establishment.wageFormulaConfig
    ) as WageFormulaConfig

    const cycleYear = formTask.cycle.year
    const cycleMonth = formTask.cycle.month
    const daysInMonth = new Date(cycleYear, cycleMonth, 0).getDate()

    const [wageRules, govtHolidays, attendanceRecords] = await Promise.all([
      prisma.wageRule.findMany({ where: { establishmentId: formTask.cycle.establishment.id } }),
      prisma.govtHoliday.findMany({
        where: {
          date: {
            gte: new Date(cycleYear, cycleMonth - 1, 1),
            lte: new Date(cycleYear, cycleMonth - 1, daysInMonth),
          },
        },
      }),
      prisma.attendanceRecord.findMany({ where: { cycleId: formTask.cycleId } }),
    ])

    const holidayDaySet = new Set(govtHolidays.map((h) => new Date(h.date).getUTCDate()))
    const multiplier = getWageRuleValue(wageRules, 'HOLIDAY_MULTIPLIER')

    const updated = await Promise.all(
      b.records.map(async (r) => {
        const otRec = await prisma.overtimeRecord.findUnique({
          where: {
            cycleId_employeeId: {
              cycleId: formTask.cycleId,
              employeeId: r.employeeId,
            },
          },
        })
        const overtimeEarnings = otRec?.totalEarnings ?? 0

        const attRec = attendanceRecords.find((a) => a.employeeId === r.employeeId)
        const dailyMarks = attRec ? (JSON.parse(attRec.dailyMarks) as string[]) : []
        const holidayWorkedDays = dailyMarks.filter((mark, i) => mark === 'P' && holidayDaySet.has(i + 1)).length
        const dailyRate = r.daysWorked > 0 ? (r.basic + r.da) / r.daysWorked : 0
        const holidayBonus = Math.round(dailyRate * (multiplier - 1) * holidayWorkedDays * 100) / 100

        const calc = calculateWages(config, {
          basic: r.basic,
          da: r.da,
          hra: r.hra,
          otherAllowances: r.otherAllowances,
          holidayBonus,
          overtimeEarnings,
          pf: r.pf,
          esi: r.esi,
          lwf: r.lwf,
          advanceRecovered: r.advanceRecovered,
          fineDeduction: r.fineDeduction,
          otherDeductions: r.otherDeductions,
        })

        const data = {
          daysWorked: r.daysWorked,
          basic: r.basic,
          da: r.da,
          hra: r.hra,
          otherAllowances: JSON.stringify([r.otherAllowances]),
          holidayBonus,
          totalNormalWages: calc.totalNormalWages,
          totalEarnings: calc.totalEarnings,
          overtimeEarnings,
          grossWages: calc.grossWages,
          pf: r.pf,
          esi: r.esi,
          lwf: r.lwf,
          advanceRecovered: r.advanceRecovered,
          fineDeduction: r.fineDeduction,
          otherDeductions: r.otherDeductions,
          totalDeductions: calc.totalDeductions,
          netWages: calc.netWages,
          paymentDate: r.paymentDate ? new Date(r.paymentDate) : null,
          receiptRef: r.receiptRef?.trim() ?? null,
        }

        return prisma.wageRecord.upsert({
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
      updated.map((r) => ({
        ...r,
        otherAllowances: Number((JSON.parse(r.otherAllowances) as number[])[0] ?? 0),
      }))
    )
  } catch (error) {
    console.error('PUT /api/form-tasks/[id]/wages failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
