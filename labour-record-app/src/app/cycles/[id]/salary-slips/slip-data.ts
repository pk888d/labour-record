import { prisma } from '@/lib/prisma'

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
      establishment: { select: { name: true, type: true, employerName: true, address: true } },
      cycleEmployees: {
        include: {
          employee: { select: { empId: true, name: true, designation: true, department: true, uan: true, esiNo: true } },
        },
        orderBy: { employee: { name: 'asc' } },
      },
      wageRecords: true,
    },
  })

  if (!cycle) return null

  const slips: SlipData[] = cycle.cycleEmployees.map((ce) => {
    const w = cycle.wageRecords.find((r) => r.employeeId === ce.employeeId)
    const basic = w?.basic ?? 0
    const da = w?.da ?? 0
    const hra = w?.hra ?? 0
    const otherAllowances = w ? sumNumeric(w.otherAllowances ?? '[]') : 0
    const holidayBonus = w?.holidayBonus ?? 0
    const overtimeEarnings = w?.overtimeEarnings ?? 0
    const grossWages = w?.grossWages ?? (basic + da + hra + otherAllowances)
    const pf = w?.pf ?? 0
    const esi = w?.esi ?? 0
    const lwf = w?.lwf ?? 0
    const fineDeduction = w?.fineDeduction ?? 0
    const otherDeductions = w?.otherDeductions ?? 0
    const advanceRecovered = w?.advanceRecovered ?? 0
    const totalDeductions = w?.totalDeductions ?? (pf + esi + lwf + fineDeduction + otherDeductions + advanceRecovered)
    const netWages = w?.netWages ?? (grossWages - totalDeductions)

    return {
      employeeId: ce.employeeId,
      empId: ce.employee.empId,
      name: ce.employee.name,
      designation: ce.employee.designation,
      department: ce.employee.department,
      uan: ce.employee.uan,
      esiNo: ce.employee.esiNo,
      daysWorked: w?.daysWorked ?? 0,
      basic, da, hra, otherAllowances, holidayBonus, overtimeEarnings,
      grossWages, pf, esi, lwf, fineDeduction, otherDeductions, advanceRecovered,
      totalDeductions, netWages,
      paymentDate: w?.paymentDate ? new Date(w.paymentDate).toLocaleDateString('en-IN') : null,
      hasData: !!w,
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
