import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FORM_DISPLAY_NAMES } from '@/types'
import type { FormCode, WageFormulaConfig } from '@/types'
import { applyAttendanceDefaults, calculateAttendanceTotals } from '@/domain/calculations/attendance-calculator'
import { getWageRuleValue } from '@/domain/calculations/wage-defaults'
import { FormEntryClient } from './form-entry-client'

const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export default async function FormEntryPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params

  const formTask = await prisma.formTask.findUnique({
    where: { id: taskId },
    include: {
      cycle: {
        include: {
          establishment: {
            select: { id: true, name: true, type: true, wageFormulaConfig: true },
          },
          cycleEmployees: {
            include: {
              employee: {
                select: {
                  empId: true, name: true,
                  basicWage: true, daWage: true, hraWage: true,
                  pfAmount: true, esiAmount: true, lwfAmount: true,
                },
              },
            },
            orderBy: { employee: { name: 'asc' } },
          },
        },
      },
    },
  })

  if (!formTask) notFound()

  const { cycle } = formTask
  const { establishment } = cycle
  const isHospital = establishment.type === 'HOSPITAL'
  const formulaConfig = JSON.parse(establishment.wageFormulaConfig) as WageFormulaConfig
  const daysInMonth = getDaysInMonth(cycle.year, cycle.month)

  const employees = cycle.cycleEmployees.map((ce) => {
    const snap = JSON.parse(ce.empDataSnapshot) as { empId?: string; name?: string }
    return {
      employeeId: ce.employeeId,
      empId: snap.empId ?? ce.employee.empId,
      name: snap.name ?? ce.employee.name,
      basicWage: ce.employee.basicWage,
      daWage: ce.employee.daWage,
      hraWage: ce.employee.hraWage,
      pfAmount: ce.employee.pfAmount,
      esiAmount: ce.employee.esiAmount,
      lwfAmount: ce.employee.lwfAmount,
    }
  })

  const govtHolidays = await prisma.govtHoliday.findMany({
    where: {
      date: {
        gte: new Date(cycle.year, cycle.month - 1, 1),
        lte: new Date(cycle.year, cycle.month - 1, daysInMonth),
      },
    },
  })
  const holidayDays = govtHolidays.map((h) => new Date(h.date).getUTCDate())

  const existingAttendance = await prisma.attendanceRecord.findMany({
    where: { cycleId: cycle.id },
  })

  const existingWages = await prisma.wageRecord.findMany({
    where: { cycleId: cycle.id },
  })

  const existingOt = await prisma.overtimeRecord.findMany({
    where: { cycleId: cycle.id },
  })

  const existingFines = await prisma.fineRecord.findMany({
    where: { cycleId: cycle.id },
    include: { employee: { select: { empId: true, name: true } } },
    orderBy: { offenceDate: 'asc' },
  })

  const existingDeductions = await prisma.deductionRecord.findMany({
    where: { cycleId: cycle.id },
    include: { employee: { select: { empId: true, name: true } } },
    orderBy: { damageDate: 'asc' },
  })

  const existingLeave = await prisma.leaveRecord.findMany({
    where: { cycleId: cycle.id },
  })

  const wageRules = await prisma.wageRule.findMany({
    where: { establishmentId: cycle.establishment.id },
  })

  const holidayDaySet = new Set(holidayDays)

  // Compute defaulted marks once — shared by initialAttendance and initialWages
  const defaultedMarksMap = new Map(
    employees.map((emp) => {
      const attRec = existingAttendance.find((r) => r.employeeId === emp.employeeId)
      const storedMarks = attRec ? (JSON.parse(attRec.dailyMarks) as string[]) : []
      const raw = storedMarks.length >= daysInMonth
        ? storedMarks.slice(0, daysInMonth)
        : [...storedMarks, ...Array(daysInMonth - storedMarks.length).fill('')]
      return [emp.employeeId, applyAttendanceDefaults(raw, cycle.year, cycle.month, holidayDaySet)]
    })
  )

  const initialAttendance = Object.fromEntries(
    employees.map((emp) => {
      const rec = existingAttendance.find((r) => r.employeeId === emp.employeeId)
      return [
        emp.employeeId,
        {
          marks: defaultedMarksMap.get(emp.employeeId)!,
          workStartTime: rec?.workStartTime ?? '',
          workEndTime: rec?.workEndTime ?? '',
          restInterval: rec?.restInterval ?? '',
          remarks: rec?.remarks ?? '',
        },
      ]
    })
  )

  const pfPct = getWageRuleValue(wageRules, 'PF_EMPLOYEE_PCT') / 100
  const esiPct = getWageRuleValue(wageRules, 'ESI_EMPLOYEE_PCT') / 100
  const fixedAllowance = isHospital ? ((formulaConfig as { fixedAllowance?: number }).fixedAllowance ?? 0) : 0
  const round2 = (n: number) => Math.round(n * 100) / 100

  const initialWages = Object.fromEntries(
    employees.map((emp) => {
      const rec = existingWages.find((r) => r.employeeId === emp.employeeId)
      const { wageDays } = calculateAttendanceTotals(defaultedMarksMap.get(emp.employeeId)!)
      const prorate = (monthly: number) => wageDays > 0 ? round2(monthly * wageDays / daysInMonth) : 0
      const proratedBasic = prorate(emp.basicWage)
      const proratedDa = prorate(emp.daWage)
      const proratedGross = proratedBasic + proratedDa + fixedAllowance
      return [
        emp.employeeId,
        {
          daysWorked: rec?.daysWorked ?? wageDays,
          basic: rec?.basic ?? proratedBasic,
          da: rec?.da ?? proratedDa,
          hra: rec?.hra ?? prorate(emp.hraWage),
          otherAllowances: rec
            ? Number((JSON.parse(rec.otherAllowances) as number[])[0] ?? 0)
            : 0,
          pf: rec?.pf ?? round2(proratedBasic * pfPct),
          esi: rec?.esi ?? round2(proratedGross * esiPct),
          lwf: rec?.lwf ?? emp.lwfAmount,
          advanceRecovered: rec?.advanceRecovered ?? 0,
          fineDeduction: rec?.fineDeduction ?? 0,
          otherDeductions: rec?.otherDeductions ?? 0,
          paymentDate: rec?.paymentDate
            ? new Date(rec.paymentDate).toISOString().split('T')[0]
            : '',
          receiptRef: rec?.receiptRef ?? '',
        },
      ]
    })
  )

  const initialOt = Object.fromEntries(
    employees.map((emp) => {
      const rec = existingOt.find((r) => r.employeeId === emp.employeeId)
      const storedDailyOt = rec ? (JSON.parse(rec.dailyOt) as number[]) : []
      const dailyOt = storedDailyOt.length >= daysInMonth
        ? storedDailyOt.slice(0, daysInMonth)
        : [...storedDailyOt, ...Array(daysInMonth - storedDailyOt.length).fill(0)]
      return [
        emp.employeeId,
        {
          dailyOt,
          normalHoursRate: rec?.normalHoursRate ?? 0,
          otRate: rec?.otRate ?? 0,
          normalEarnings: rec?.normalEarnings ?? 0,
        },
      ]
    })
  )

  const initialFines = existingFines.map((f) => ({
    id: f.id,
    employeeId: f.employeeId,
    employeeName: f.employee.name,
    offenceDate: new Date(f.offenceDate).toISOString().split('T')[0],
    offenceDescription: f.offenceDescription,
    fineAmount: f.fineAmount,
    recovered: f.recovered,
    pendingRecovery: f.pendingRecovery,
    remarks: f.remarks ?? '',
  }))

  const initialDeductions = existingDeductions.map((d) => ({
    id: d.id,
    employeeId: d.employeeId,
    employeeName: d.employee.name,
    damageDate: new Date(d.damageDate).toISOString().split('T')[0],
    description: d.description,
    deductionAmount: d.deductionAmount,
    recovered: d.recovered,
    pendingRecovery: d.pendingRecovery,
    remarks: d.remarks ?? '',
  }))

  const initialLeave = Object.fromEntries(
    employees.map((emp) => {
      const rec = existingLeave.find((r) => r.employeeId === emp.employeeId)
      return [
        emp.employeeId,
        {
          earnedLeaveOpening: rec?.earnedLeaveOpening ?? 0,
          earnedDuring: rec?.earnedDuring ?? 0,
          earnedAvailed: rec?.earnedAvailed ?? 0,
          medicalLeave: rec?.medicalLeave ?? 0,
          otherLeave: rec?.otherLeave ?? 0,
          remarks: rec?.remarks ?? '',
        },
      ]
    })
  )

  const display = FORM_DISPLAY_NAMES[formTask.formCode as FormCode]
  const periodLabel = `${MONTH_NAMES[cycle.month]} ${cycle.year}`

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-3 border-b border-[#1e2d3d] bg-[#0f1923]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-white">
              {display?.name ?? formTask.formCode}
            </h1>
            <p className="text-xs text-[#5a8ab8] mt-0.5">
              {establishment.name} · {periodLabel} · {display?.ref ?? ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#4a6a8a]">Preset</p>
            <p className="text-xs text-[#c8d8e8]">{formulaConfig.preset}</p>
          </div>
        </div>
      </div>

      <FormEntryClient
        formTaskId={taskId}
        formTaskStatus={formTask.status}
        month={cycle.month}
        year={cycle.year}
        daysInMonth={daysInMonth}
        employees={employees}
        formulaConfig={formulaConfig}
        isHospital={isHospital}
        holidayDays={holidayDays}
        initialAttendance={initialAttendance}
        initialWages={initialWages}
        initialOt={initialOt}
        initialFines={initialFines}
        initialDeductions={initialDeductions}
        initialLeave={initialLeave}
      />
    </div>
  )
}
