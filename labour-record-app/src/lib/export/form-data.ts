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
  fatherSpouseName: string
  sex: string
  designation: string
  department: string | null
  dateOfEntry: string
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
  fatherSpouseName: string
  sex: string
  designation: string
  dailyMarks: string[]
  totalPresent: number // days actually worked (P / OT) — excludes holidays
  totalAbsent: number
  leaveDays: number
  holidayDays: number
  wageDays: number // worked + paid holidays + paid leave
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
  fatherSpouseName: string
  sex: string
  designation: string
  dailyOt: number[]
  totalOtHours: number
  normalHoursRate: number
  otRate: number
  normalEarnings: number
  otEarnings: number
}

// Registers list EVERY employee; columns with no entry read "Nil" (per the
// statutory template). All fields are display strings.
export type FineRow = {
  sno: number
  empId: string
  name: string
  fatherSpouseName: string
  sex: string
  department: string
  offenceDescription: string // Nature & date of offence
  showCause: string          // Whether show-cause notice served
  heard: string              // Whether workman showed cause
  rate: string               // Rate of wages
  fineAmount: string         // Date & amount of fine imposed
  dateRealised: string       // Date fine realised
  remarks: string
}

export type DeductionRow = {
  sno: number
  empId: string
  name: string
  fatherSpouseName: string
  sex: string
  department: string
  description: string        // Damage/loss caused with date
  showCause: string          // Whether worker showed cause
  damageDate: string         // Date of deduction imposed
  deductionAmount: string    // Amount of deduction imposed
  installments: string       // No. of installments
  dateRealised: string       // Date total amount realised
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

// Normalise any date value (Date, ISO datetime string, or empty) to YYYY-MM-DD
// — statutory registers show the date only, never a time component.
function dateOnly(v: string | Date | null | undefined): string {
  if (!v) return ''
  if (typeof v === 'string') return v.split('T')[0]
  try {
    return new Date(v).toISOString().split('T')[0]
  } catch {
    return ''
  }
}

// Sum a JSON-encoded allowances array defensively (legacy data may hold strings
// like ["[]"] or nested values), coercing each element to a number.
function sumNumeric(json: string): number {
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return 0
    return arr.reduce((s: number, v: unknown) => s + (Number(v) || 0), 0)
  } catch {
    return 0
  }
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
      sex: s.sex ?? ce.employee.sex ?? '',
      designation: s.designation ?? ce.employee.designation ?? '',
      department: s.department ?? ce.employee.department,
      dateOfEntry: dateOnly(s.dateOfEntry ?? ce.employee.dateOfEntry),
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
  const fathers = await getFatherNames(ctx)

  return ctx.employees.map((emp) => {
    const w = wages.find((r) => r.employeeId === emp.employeeId)
    const otherAllowances = w ? sumNumeric(w.otherAllowances) : 0
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
      fatherSpouseName: fathers.get(emp.employeeId) || '',
      sex: emp.sex,
      designation: emp.designation,
      department: emp.department,
      dateOfEntry: emp.dateOfEntry,
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
  const fathers = await getFatherNames(ctx)
  return ctx.employees.map((emp) => {
    const r = att.find((a) => a.employeeId === emp.employeeId)
    const storedMarks = r ? (JSON.parse(r.dailyMarks) as string[]) : []
    const marks = storedMarks.length >= ctx.daysInMonth
      ? storedMarks.slice(0, ctx.daysInMonth)
      : [...storedMarks, ...Array(ctx.daysInMonth - storedMarks.length).fill('')]
    // Days worked = actual attendance (P / OT). Holidays (H) are paid but NOT worked.
    const totalPresent = marks.filter((m) => m === 'P' || m === 'OT').length
    const totalAbsent = marks.filter((m) => m === 'A').length
    const leaveDays = marks.filter((m) => m === 'L').length
    const holidayDays = marks.filter((m) => m === 'H').length
    const wageDays = totalPresent + holidayDays + leaveDays
    return {
      employeeId: emp.employeeId,
      empId: emp.empId,
      name: emp.name,
      fatherSpouseName: fathers.get(emp.employeeId) || '',
      sex: emp.sex,
      designation: emp.designation,
      dailyMarks: marks,
      totalPresent,
      totalAbsent,
      leaveDays,
      holidayDays,
      wageDays,
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
  const fathers = await getFatherNames(ctx)
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
      fatherSpouseName: fathers.get(emp.employeeId) || '',
      sex: emp.sex,
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

const NIL = 'Nil'
const isoDate = (d: Date) => new Date(d).toISOString().split('T')[0]

async function getFatherNames(ctx: CycleContext): Promise<Map<string, string>> {
  const dbEmps = await prisma.employee.findMany({
    where: { id: { in: ctx.employees.map((e) => e.employeeId) } },
    select: { id: true, fatherSpouseName: true },
  })
  return new Map(dbEmps.map((e) => [e.id, e.fatherSpouseName ?? '']))
}

export async function getFinesData(ctx: CycleContext): Promise<FineRow[]> {
  const fines = await prisma.fineRecord.findMany({
    where: { cycleId: ctx.cycleId },
    orderBy: { offenceDate: 'asc' },
  })
  const fathers = await getFatherNames(ctx)

  // One row per employee; "Nil" wherever there is no fine entry.
  return ctx.employees.map((emp, i) => {
    const ef = fines.filter((f) => f.employeeId === emp.employeeId)
    const has = ef.length > 0
    return {
      sno: i + 1,
      empId: emp.empId,
      name: emp.name,
      fatherSpouseName: fathers.get(emp.employeeId) || NIL,
      sex: emp.sex || NIL,
      department: emp.department || NIL,
      offenceDescription: has
        ? ef.map((f) => `${f.offenceDescription} (${isoDate(f.offenceDate)})`).join('; ')
        : NIL,
      showCause: has ? (ef.some((f) => f.showCauseDate) ? 'Yes' : 'No') : NIL,
      heard: NIL,
      rate: NIL,
      fineAmount: has ? `₹${ef.reduce((s, f) => s + f.fineAmount, 0).toFixed(2)}` : NIL,
      dateRealised: NIL,
      remarks: has ? (ef.map((f) => f.remarks).filter(Boolean).join('; ') || NIL) : NIL,
    }
  })
}

export async function getDeductionsData(ctx: CycleContext): Promise<DeductionRow[]> {
  const ded = await prisma.deductionRecord.findMany({
    where: { cycleId: ctx.cycleId },
    orderBy: { damageDate: 'asc' },
  })
  const fathers = await getFatherNames(ctx)

  return ctx.employees.map((emp, i) => {
    const ed = ded.filter((d) => d.employeeId === emp.employeeId)
    const has = ed.length > 0
    return {
      sno: i + 1,
      empId: emp.empId,
      name: emp.name,
      fatherSpouseName: fathers.get(emp.employeeId) || NIL,
      sex: emp.sex || NIL,
      department: emp.department || NIL,
      description: has
        ? ed.map((d) => `${d.description} (${isoDate(d.damageDate)})`).join('; ')
        : NIL,
      showCause: NIL,
      damageDate: has ? ed.map((d) => isoDate(d.damageDate)).join('; ') : NIL,
      deductionAmount: has ? `₹${ed.reduce((s, d) => s + d.deductionAmount, 0).toFixed(2)}` : NIL,
      installments: NIL,
      dateRealised: NIL,
      remarks: has ? (ed.map((d) => d.remarks).filter(Boolean).join('; ') || NIL) : NIL,
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
