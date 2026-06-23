import { prisma } from '@/lib/prisma'
import { computeCycleWages } from '@/domain/calculations/cycle-wage'
import type { WageFormulaConfig } from '@/types'

export const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December']

function sumNumeric(json: string): number {
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return 0
    return arr.reduce((s: number, v: unknown) => s + (Number(v) || 0), 0)
  } catch {
    return 0
  }
}

export type SlipData = {
  employeeId: string
  empId: string
  name: string
  designation: string | null
  department: string | null
  uan: string | null
  esiNo: string | null
  daysWorked: number
  basic: number
  da: number
  hra: number
  otherAllowances: number
  holidayBonus: number
  overtimeEarnings: number
  grossWages: number
  pf: number
  esi: number
  lwf: number
  fineDeduction: number
  otherDeductions: number
  advanceRecovered: number
  totalDeductions: number
  netWages: number
  paymentDate: string | null
  hasData: boolean
}

export type CycleInfo = {
  id: string
  month: number
  year: number
  establishmentName: string
  employerName: string
  address: string
}

export async function getCycleWithSlips(cycleId: string): Promise<{ cycle: CycleInfo; slips: SlipData[] } | null> {
  const cycle = await prisma.monthlyCycle.findUnique({
    where: { id: cycleId },
    include: {
      establishment: { select: { name: true, type: true, employerName: true, address: true, wageFormulaConfig: true } },
      cycleEmployees: {
        include: {
          employee: { select: { empId: true, name: true, designation: true, department: true, uan: true, esiNo: true, defaultTotalSalary: true, daWage: true, hraWage: true, pfMode: true, pfPercent: true, pfWageCeiling: true, pfAmount: true, lwfAmount: true } },
        },
        orderBy: { employee: { name: 'asc' } },
      },
      wageRecords: true,
    },
  })

  if (!cycle) return null

  const daysInMonth = new Date(cycle.year, cycle.month, 0).getDate()
  const cfg = JSON.parse(cycle.establishment.wageFormulaConfig) as WageFormulaConfig
  const [attendance, holidays] = await Promise.all([
    prisma.attendanceRecord.findMany({ where: { cycleId } }),
    prisma.govtHoliday.findMany({ where: { date: { gte: new Date(cycle.year, cycle.month - 1, 1), lte: new Date(cycle.year, cycle.month - 1, daysInMonth) } } }),
  ])
  const holidayDays = new Set(holidays.map((h) => new Date(h.date).getUTCDate()))
  const attByEmp = new Map(attendance.map((a) => [a.employeeId, JSON.parse(a.dailyMarks) as string[]]))

  const slips: SlipData[] = cycle.cycleEmployees.map((ce) => {
    const w = cycle.wageRecords.find((r) => r.employeeId === ce.employeeId)
    const fb = w ? null : computeCycleWages({
      employee: {
        defaultTotalSalary: ce.employee.defaultTotalSalary, daWage: ce.employee.daWage,
        hraWage: ce.employee.hraWage, pfMode: ce.employee.pfMode, pfPercent: ce.employee.pfPercent,
        pfWageCeiling: ce.employee.pfWageCeiling, pfAmount: ce.employee.pfAmount, lwfAmount: ce.employee.lwfAmount,
      },
      attendance: attByEmp.get(ce.employeeId), holidayDays,
      esiApplicable: !!cfg.esiApplicable, daysInMonth,
    })
    const basic = w?.basic ?? fb?.basic ?? 0
    const da = w?.da ?? fb?.da ?? 0
    const hra = w?.hra ?? fb?.hra ?? 0
    const otherAllowances = w ? sumNumeric(w.otherAllowances ?? '[]') : 0
    const holidayBonus = w?.holidayBonus ?? fb?.holidayBonus ?? 0
    const overtimeEarnings = w?.overtimeEarnings ?? fb?.overtimeEarnings ?? 0
    const grossWages = w?.grossWages ?? fb?.grossWages ?? (basic + da + hra + otherAllowances)
    const pf = w?.pf ?? fb?.pf ?? 0
    const esi = w?.esi ?? fb?.esi ?? 0
    const lwf = w?.lwf ?? fb?.lwf ?? 0
    const fineDeduction = w?.fineDeduction ?? 0
    const otherDeductions = w?.otherDeductions ?? 0
    const advanceRecovered = w?.advanceRecovered ?? 0
    const totalDeductions = w?.totalDeductions ?? fb?.totalDeductions ?? (pf + esi + lwf + fineDeduction + otherDeductions + advanceRecovered)
    const netWages = w?.netWages ?? fb?.netWages ?? (grossWages - totalDeductions)

    return {
      employeeId: ce.employeeId,
      empId: ce.employee.empId,
      name: ce.employee.name,
      designation: ce.employee.designation,
      department: ce.employee.department,
      uan: ce.employee.uan,
      esiNo: ce.employee.esiNo,
      daysWorked: w?.daysWorked ?? fb?.daysWorked ?? 0,
      basic, da, hra, otherAllowances, holidayBonus, overtimeEarnings,
      grossWages, pf, esi, lwf, fineDeduction, otherDeductions, advanceRecovered,
      totalDeductions, netWages,
      paymentDate: w?.paymentDate ? new Date(w.paymentDate).toLocaleDateString('en-IN') : null,
      hasData: !!w || !!fb,
    }
  })

  return {
    cycle: {
      id: cycle.id,
      month: cycle.month,
      year: cycle.year,
      establishmentName: cycle.establishment.name,
      employerName: cycle.establishment.employerName ?? '',
      address: cycle.establishment.address ?? '',
    },
    slips,
  }
}
