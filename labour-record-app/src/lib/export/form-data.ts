import { prisma } from '@/lib/prisma'
import type { WageFormulaConfig } from '@/types'

export const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December']

export type CycleContext = {
  cycleId: string
  cycle: { id: string; month: number; year: number; wagePeriodDays: number }
  establishment: {
    name: string
    address: string
    employerName: string
    managerName: string
    regCertNo: string
    type: 'HOSPITAL' | 'SHOP'
    wageFormulaConfig: WageFormulaConfig
  }
  employees: Array<{
    employeeId: string
    empId: string
    name: string
    sex: string
    designation: string
    department: string | null
    dateOfEntry: string
    uan: string | null
    esiNo: string | null
  }>
  daysInMonth: number
}

export type WagesRow = {
  employeeId: string
  empId: string
  name: string
  designation: string
  department: string | null
  daysWorked: number
  basic: number
  da: number
  hra: number
  otherAllowances: number
  grossEarnings: number
  pf: number
  esi: number
  lwf: number
  fineDeduction: number
  otherDeductions: number
  advanceRecovered: number
  netWage: number
  paymentDate: string
  receiptRef: string
}

export type MusterRow = {
  employeeId: string
  empId: string
  name: string
  designation: string
  dailyMarks: string[]
  totalPresent: number
  totalAbsent: number
  workStartTime: string
  workEndTime: string
  restInterval: string
  remarks: string
}

export type EmployeeRow = {
  employeeId: string
  empId: string
  name: string
  sex: string
  designation: string
  department: string | null
  dateOfEntry: string
  uan: string | null
  esiNo: string | null
  fatherSpouseName: string
  dob: string
  presentAddress: string
  permanentAddress: string
}

export type OvertimeRow = {
  employeeId: string
  empId: string
  name: string
  designation: string
  dailyOt: number[]
  totalOtHours: number
  normalHoursRate: number
  otRate: number
  normalEarnings: number
  otEarnings: number
}

export type FineRow = {
  id: string
  employeeId: string
  empId: string
  name: string
  offenceDate: string
  offenceDescription: string
  fineAmount: number
  recovered: number
  pendingRecovery: number
  remarks: string
}

export type DeductionRow = {
  id: string
  employeeId: string
  empId: string
  name: string
  damageDate: string
  description: string
  deductionAmount: number
  recovered: number
  pendingRecovery: number
  remarks: string
}

export type LeaveRow = {
  employeeId: string
  empId: string
  name: string
  designation: string
  earnedLeaveOpening: number
  earnedDuring: number
  earnedAvailed: number
  earnedClosing: number
  medicalLeave: number
  otherLeave: number
  remarks: string
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export async function getCycleContext(cycleId: string): Promise<CycleContext> {
  const cycle = await prisma.monthlyCycle.findUniqueOrThrow({
    where: { id: cycleId },
    include: {
      establishment: true,
      cycleEmployees: {
        include: { employee: true },
        orderBy: { employee: { name: 'asc' } },
      },
    },
  })

  const snap = (ce: typeof cycle.cycleEmployees[0]) => {
    const s = JSON.parse(ce.empDataSnapshot) as Record<string, string>
    return {
      employeeId: ce.employeeId,
      empId: s.empId ?? ce.employee.empId,
      name: s.name ?? ce.employee.name,
      sex: s.sex ?? ce.employee.sex,
      designation: s.designation ?? ce.employee.designation,
      department: s.department ?? ce.employee.department,
      dateOfEntry: s.dateOfEntry ?? (ce.employee.dateOfEntry ? new Date(ce.employee.dateOfEntry).toISOString().split('T')[0] : ''),
      uan: s.uan ?? ce.employee.uan ?? null,
      esiNo: s.esiNo ?? ce.employee.esiNo ?? null,
    }
  }

  const wageFormulaConfig = JSON.parse(cycle.establishment.wageFormulaConfig) as WageFormulaConfig

  return {
    cycleId,
    cycle: {
      id: cycle.id,
      month: cycle.month,
      year: cycle.year,
      wagePeriodDays: cycle.wagePeriodDays,
    },
    establishment: {
      name: cycle.establishment.name,
      address: cycle.establishment.address ?? '',
      employerName: cycle.establishment.employerName ?? '',
      managerName: cycle.establishment.managerName ?? '',
      regCertNo: cycle.establishment.regCertNo ?? '',
      type: cycle.establishment.type as 'HOSPITAL' | 'SHOP',
      wageFormulaConfig,
    },
    employees: cycle.cycleEmployees.map(snap),
    daysInMonth: getDaysInMonth(cycle.year, cycle.month),
  }
}

export async function getWagesData(ctx: CycleContext): Promise<WagesRow[]> {
  const wages = await prisma.wageRecord.findMany({ where: { cycleId: ctx.cycleId } })

  return ctx.employees.map((emp) => {
    const w = wages.find((r) => r.employeeId === emp.employeeId)
    const otherAllowances = w
      ? (JSON.parse(w.otherAllowances) as number[]).reduce((s, v) => s + v, 0)
      : 0
    const fineDeduction = w?.fineDeduction ?? 0
    const basic = w?.basic ?? 0
    const da = w?.da ?? 0
    const hra = w?.hra ?? 0
    const pf = w?.pf ?? 0
    const esi = w?.esi ?? 0
    const lwf = w?.lwf ?? 0
    const otherDeductions = w?.otherDeductions ?? 0
    const advanceRecovered = w?.advanceRecovered ?? 0
    const gross = basic + da + hra + otherAllowances
    const totalDed = pf + esi + lwf + fineDeduction + otherDeductions + advanceRecovered
    return {
      employeeId: emp.employeeId,
      empId: emp.empId,
      name: emp.name,
      designation: emp.designation,
      department: emp.department,
      daysWorked: w?.daysWorked ?? 0,
      basic,
      da,
      hra,
      otherAllowances,
      grossEarnings: w?.grossWages ?? gross,
      pf,
      esi,
      lwf,
      fineDeduction,
      otherDeductions,
      advanceRecovered,
      netWage: w?.netWages ?? (gross - totalDed),
      paymentDate: w?.paymentDate ? new Date(w.paymentDate).toISOString().split('T')[0] : '',
      receiptRef: w?.receiptRef ?? '',
    }
  })
}

export async function getMusterData(ctx: CycleContext): Promise<MusterRow[]> {
  const att = await prisma.attendanceRecord.findMany({ where: { cycleId: ctx.cycleId } })
  return ctx.employees.map((emp) => {
    const r = att.find((a) => a.employeeId === emp.employeeId)
    const storedMarks = r ? (JSON.parse(r.dailyMarks) as string[]) : []
    const marks = storedMarks.length >= ctx.daysInMonth
      ? storedMarks.slice(0, ctx.daysInMonth)
      : [...storedMarks, ...Array(ctx.daysInMonth - storedMarks.length).fill('')]
    const totalPresent = marks.filter((m) => m === 'P' || m === 'OT' || m === 'H').length
    const totalAbsent = marks.filter((m) => m === 'A').length
    return {
      employeeId: emp.employeeId,
      empId: emp.empId,
      name: emp.name,
      designation: emp.designation,
      dailyMarks: marks,
      totalPresent,
      totalAbsent,
      workStartTime: r?.workStartTime ?? '',
      workEndTime: r?.workEndTime ?? '',
      restInterval: r?.restInterval ?? '',
      remarks: r?.remarks ?? '',
    }
  })
}

export async function getEmployeeData(ctx: CycleContext): Promise<EmployeeRow[]> {
  const empIds = ctx.employees.map((e) => e.employeeId)
  const dbEmps = await prisma.employee.findMany({ where: { id: { in: empIds } } })
  return ctx.employees.map((emp) => {
    const db = dbEmps.find((e) => e.id === emp.employeeId)
    return {
      ...emp,
      fatherSpouseName: db?.fatherSpouseName ?? '',
      dob: db?.dob ? new Date(db.dob).toISOString().split('T')[0] : '',
      presentAddress: db?.presentAddress ?? '',
      permanentAddress: db?.permanentAddress ?? '',
    }
  })
}

export async function getOvertimeData(ctx: CycleContext): Promise<OvertimeRow[]> {
  const ot = await prisma.overtimeRecord.findMany({ where: { cycleId: ctx.cycleId } })
  return ctx.employees.map((emp) => {
    const r = ot.find((o) => o.employeeId === emp.employeeId)
    const storedDailyOt = r ? (JSON.parse(r.dailyOt) as number[]) : []
    const dailyOt = storedDailyOt.length >= ctx.daysInMonth
      ? storedDailyOt.slice(0, ctx.daysInMonth)
      : [...storedDailyOt, ...Array(ctx.daysInMonth - storedDailyOt.length).fill(0)]
    return {
      employeeId: emp.employeeId,
      empId: emp.empId,
      name: emp.name,
      designation: emp.designation,
      dailyOt,
      totalOtHours: r?.totalOtHours ?? 0,
      normalHoursRate: r?.normalHoursRate ?? 0,
      otRate: r?.otRate ?? 0,
      normalEarnings: r?.normalEarnings ?? 0,
      otEarnings: r?.otEarnings ?? 0,
    }
  })
}

export async function getFinesData(ctx: CycleContext): Promise<FineRow[]> {
  const fines = await prisma.fineRecord.findMany({
    where: { cycleId: ctx.cycleId },
    include: { employee: { select: { empId: true } } },
    orderBy: { offenceDate: 'asc' },
  })
  return fines.map((f) => {
    const emp = ctx.employees.find((e) => e.employeeId === f.employeeId)
    return {
      id: f.id,
      employeeId: f.employeeId,
      empId: emp?.empId ?? f.employee.empId,
      name: emp?.name ?? '',
      offenceDate: new Date(f.offenceDate).toISOString().split('T')[0],
      offenceDescription: f.offenceDescription,
      fineAmount: f.fineAmount,
      recovered: f.recovered,
      pendingRecovery: f.pendingRecovery,
      remarks: f.remarks ?? '',
    }
  })
}

export async function getDeductionsData(ctx: CycleContext): Promise<DeductionRow[]> {
  const ded = await prisma.deductionRecord.findMany({
    where: { cycleId: ctx.cycleId },
    include: { employee: { select: { empId: true } } },
    orderBy: { damageDate: 'asc' },
  })
  return ded.map((d) => {
    const emp = ctx.employees.find((e) => e.employeeId === d.employeeId)
    return {
      id: d.id,
      employeeId: d.employeeId,
      empId: emp?.empId ?? d.employee.empId,
      name: emp?.name ?? '',
      damageDate: new Date(d.damageDate).toISOString().split('T')[0],
      description: d.description,
      deductionAmount: d.deductionAmount,
      recovered: d.recovered,
      pendingRecovery: d.pendingRecovery,
      remarks: d.remarks ?? '',
    }
  })
}

export async function getLeaveData(ctx: CycleContext): Promise<LeaveRow[]> {
  const leave = await prisma.leaveRecord.findMany({ where: { cycleId: ctx.cycleId } })
  return ctx.employees.map((emp) => {
    const r = leave.find((l) => l.employeeId === emp.employeeId)
    return {
      employeeId: emp.employeeId,
      empId: emp.empId,
      name: emp.name,
      designation: emp.designation,
      earnedLeaveOpening: r?.earnedLeaveOpening ?? 0,
      earnedDuring: r?.earnedDuring ?? 0,
      earnedAvailed: r?.earnedAvailed ?? 0,
      earnedClosing: r?.earnedClosing ?? 0,
      medicalLeave: r?.medicalLeave ?? 0,
      otherLeave: r?.otherLeave ?? 0,
      remarks: r?.remarks ?? '',
    }
  })
}
