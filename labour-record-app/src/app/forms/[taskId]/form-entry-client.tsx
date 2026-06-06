'use client'
import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { calculateWages } from '@/domain/calculations/wage-calculator'
import { applyAttendanceDefaults } from '@/domain/calculations/attendance-calculator'
import type { WageFormulaConfig } from '@/types'
import { Info } from '@/components/info-tooltip'

type Employee = { employeeId: string; empId: string; name: string }

type AttendanceRow = {
  marks: string[]
  workStartTime: string
  workEndTime: string
  restInterval: string
  remarks: string
}

type WageRow = {
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
  paymentDate: string
  receiptRef: string
}

type OtRow = {
  dailyOt: number[]
  normalHoursRate: number
  otRate: number
  normalEarnings: number
}

type FineEntry = {
  id: string
  employeeId: string
  employeeName: string
  offenceDate: string
  offenceDescription: string
  fineAmount: number
  recovered: number
  pendingRecovery: number
  remarks: string
}

type DeductionEntry = {
  id: string
  employeeId: string
  employeeName: string
  damageDate: string
  description: string
  deductionAmount: number
  recovered: number
  pendingRecovery: number
  remarks: string
}

type LeaveRow = {
  earnedLeaveOpening: number
  earnedDuring: number
  earnedAvailed: number
  medicalLeave: number
  otherLeave: number
  remarks: string
}

type Props = {
  formTaskId: string
  formTaskStatus: string
  month: number
  year: number
  daysInMonth: number
  employees: Employee[]
  formulaConfig: WageFormulaConfig
  isHospital: boolean
  holidayDays: number[]
  initialAttendance: Record<string, AttendanceRow>
  initialWages: Record<string, WageRow>
  initialOt: Record<string, OtRow>
  initialFines: FineEntry[]
  initialDeductions: DeductionEntry[]
  initialLeave: Record<string, LeaveRow>
}

const MARK_CYCLE: Record<string, string> = {
  '': 'P', P: 'A', A: 'L', L: 'H', H: 'OT', OT: '',
}

const MARK_STYLE: Record<string, string> = {
  P:   'bg-[#0f2a1a] text-[#40c070]',
  P_H: 'bg-[#2a1500] text-[#ff8c40]',  // P on a govt holiday = worked holiday
  A:   'bg-[#2a1010] text-[#f07070]',
  L:   'bg-[#1a2a50] text-[#4a9eff]',
  H:   'bg-[#2a2010] text-[#c0a040]',
  OT:  'bg-[#1a0f2a] text-[#c087f0]',
  '':  'bg-[#0f1923] text-[#2a3a4a]',
}

function numInput(value: number, onChange: (v: number) => void) {
  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-20 bg-[#1a2a3a] border border-[#2a3a50] rounded px-1 py-0.5 text-xs text-[#c8d8e8] text-right"
    />
  )
}

export function FormEntryClient({
  formTaskId,
  formTaskStatus,
  month,
  year,
  daysInMonth,
  employees,
  formulaConfig,
  isHospital,
  holidayDays,
  initialAttendance,
  initialWages,
  initialOt,
  initialFines,
  initialDeductions,
  initialLeave,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'attendance' | 'wages' | 'overtime' | 'fines' | 'deductions' | 'leave'>('attendance')
  const [attendance, setAttendance] = useState<Record<string, AttendanceRow>>(initialAttendance)
  const [wages, setWages] = useState<Record<string, WageRow>>(initialWages)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [ot, setOt] = useState<Record<string, OtRow>>(initialOt)
  const [fines, setFines] = useState<FineEntry[]>(initialFines)
  const [deductions, setDeductions] = useState<DeductionEntry[]>(initialDeductions)
  const [leave, setLeave] = useState<Record<string, LeaveRow>>(initialLeave)
  const [newFine, setNewFine] = useState({ employeeId: '', offenceDate: '', offenceDescription: '', fineAmount: 0 })
  const [newDeduction, setNewDeduction] = useState({ employeeId: '', damageDate: '', description: '', deductionAmount: 0 })

  const holidayDaySet = useMemo(() => new Set(holidayDays), [holidayDays])

  function applyDefaults() {
    setAttendance((prev) => {
      const next = { ...prev }
      for (const emp of employees) {
        const row = prev[emp.employeeId]
        next[emp.employeeId] = {
          ...row,
          marks: applyAttendanceDefaults(row.marks, year, month, holidayDaySet),
        }
      }
      return next
    })
  }

  const toggleMark = useCallback((employeeId: string, dayIndex: number) => {
    setAttendance((prev) => {
      const row = prev[employeeId]
      const newMarks = [...row.marks]
      newMarks[dayIndex] = MARK_CYCLE[newMarks[dayIndex] ?? ''] ?? 'P'
      return { ...prev, [employeeId]: { ...row, marks: newMarks } }
    })
  }, [])

  const setAttendanceField = useCallback(
    (employeeId: string, field: keyof AttendanceRow, value: string) => {
      setAttendance((prev) => ({
        ...prev,
        [employeeId]: { ...prev[employeeId], [field]: value },
      }))
    },
    []
  )

  const setWageField = useCallback(
    (employeeId: string, field: keyof WageRow, value: number | string) => {
      setWages((prev) => ({
        ...prev,
        [employeeId]: { ...prev[employeeId], [field]: value },
      }))
    },
    []
  )

  async function saveAttendance() {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/attendance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: employees.map((emp) => {
          const row = attendance[emp.employeeId]
          return {
            employeeId: emp.employeeId,
            dailyMarks: row.marks,
            workStartTime: row.workStartTime || undefined,
            workEndTime: row.workEndTime || undefined,
            restInterval: row.restInterval || undefined,
            remarks: row.remarks || undefined,
          }
        }),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
    } else {
      router.refresh()
    }
  }

  async function saveWages() {
    for (const emp of employees) {
      const w = wages[emp.employeeId]
      if (w.daysWorked < 0 || w.daysWorked > daysInMonth) {
        setErrors([`${emp.name}: days worked must be between 0 and ${daysInMonth}`])
        return
      }
      if (w.basic < 0 || w.da < 0 || w.hra < 0) {
        setErrors([`${emp.name}: wage amounts cannot be negative`])
        return
      }
    }
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/wages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: employees.map((emp) => ({
          employeeId: emp.employeeId,
          ...wages[emp.employeeId],
        })),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
    } else {
      router.refresh()
    }
  }

  async function transition(to: string, comment?: string) {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, comment }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Transition failed'])
    } else if (to === 'READY_FOR_REVIEW') {
      router.push('/')
      router.refresh()
    } else {
      router.refresh()
    }
  }

  const setOtField = useCallback(
    (employeeId: string, field: keyof OtRow, value: number | number[]) => {
      setOt((prev) => ({ ...prev, [employeeId]: { ...prev[employeeId], [field]: value } }))
    },
    []
  )

  const setOtDay = useCallback((employeeId: string, dayIndex: number, value: number) => {
    setOt((prev) => {
      const row = prev[employeeId]
      const newDailyOt = [...row.dailyOt]
      newDailyOt[dayIndex] = Math.max(0, value)
      return { ...prev, [employeeId]: { ...row, dailyOt: newDailyOt } }
    })
  }, [])

  const setLeaveField = useCallback(
    (employeeId: string, field: keyof LeaveRow, value: number | string) => {
      setLeave((prev) => ({ ...prev, [employeeId]: { ...prev[employeeId], [field]: value } }))
    },
    []
  )

  async function saveOt() {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/overtime`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: employees.map((emp) => ({
          employeeId: emp.employeeId,
          ...ot[emp.employeeId],
        })),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
    } else {
      router.refresh()
    }
  }

  async function saveLeave() {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/leave`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: employees.map((emp) => ({
          employeeId: emp.employeeId,
          ...leave[emp.employeeId],
        })),
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
    } else {
      router.refresh()
    }
  }

  async function addFine() {
    if (!newFine.employeeId || !newFine.offenceDate || !newFine.offenceDescription) {
      setErrors(['Employee, offence date, and description are required'])
      return
    }
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/fines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFine),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Add failed'])
    } else {
      const created = await res.json() as { id: string }
      const emp = employees.find((e) => e.employeeId === newFine.employeeId)
      setFines((prev) => [...prev, {
        id: created.id,
        employeeId: newFine.employeeId,
        employeeName: emp?.name ?? '',
        offenceDate: newFine.offenceDate,
        offenceDescription: newFine.offenceDescription,
        fineAmount: newFine.fineAmount,
        recovered: 0,
        pendingRecovery: newFine.fineAmount,
        remarks: '',
      }])
      setNewFine({ employeeId: '', offenceDate: '', offenceDescription: '', fineAmount: 0 })
    }
  }

  async function deleteFine(fineId: string) {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/fine-records/${fineId}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Delete failed'])
    } else {
      setFines((prev) => prev.filter((f) => f.id !== fineId))
    }
  }

  async function addDeduction() {
    if (!newDeduction.employeeId || !newDeduction.damageDate || !newDeduction.description) {
      setErrors(['Employee, damage date, and description are required'])
      return
    }
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/form-tasks/${formTaskId}/deductions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDeduction),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Add failed'])
    } else {
      const created = await res.json() as { id: string }
      const emp = employees.find((e) => e.employeeId === newDeduction.employeeId)
      setDeductions((prev) => [...prev, {
        id: created.id,
        employeeId: newDeduction.employeeId,
        employeeName: emp?.name ?? '',
        damageDate: newDeduction.damageDate,
        description: newDeduction.description,
        deductionAmount: newDeduction.deductionAmount,
        recovered: 0,
        pendingRecovery: newDeduction.deductionAmount,
        remarks: '',
      }])
      setNewDeduction({ employeeId: '', damageDate: '', description: '', deductionAmount: 0 })
    }
  }

  async function deleteDeduction(deductionId: string) {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/deduction-records/${deductionId}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Delete failed'])
    } else {
      setDeductions((prev) => prev.filter((d) => d.id !== deductionId))
    }
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const tabClass = (t: string) =>
    `px-4 py-1.5 text-xs font-medium rounded-t ${
      tab === t
        ? 'bg-[#0f1923] text-white border-b-2 border-[#4a9eff]'
        : 'text-[#5a8ab8] hover:text-white'
    }`

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 border-b border-[#1e2d3d]">
        <button className={tabClass('attendance')} onClick={() => setTab('attendance')}>
          Attendance
        </button>
        <button className={tabClass('wages')} onClick={() => setTab('wages')}>
          Wage Data
        </button>
        <button className={tabClass('overtime')} onClick={() => setTab('overtime')}>
          Overtime
        </button>
        <button className={tabClass('fines')} onClick={() => setTab('fines')}>
          Fines
        </button>
        <button className={tabClass('deductions')} onClick={() => setTab('deductions')}>
          Deductions
        </button>
        <button className={tabClass('leave')} onClick={() => setTab('leave')}>
          Leave
        </button>
      </div>

      {/* Error banner */}
      {errors.length > 0 && (
        <div className="mx-4 mt-3 bg-[#2a1010] border border-[#5a2020] rounded p-2 text-xs text-[#f07070]">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 'attendance' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-2 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-[#5a8ab8]">Click a cell to cycle marks:</span>
            {['P', 'A', 'L', 'H', 'OT'].map((m) => (
              <span key={m} className={`text-[10px] px-1.5 py-0.5 rounded ${MARK_STYLE[m]}`}>{m}</span>
            ))}
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${MARK_STYLE['P_H']}`}>P★ worked holiday</span>
            <button
              type="button"
              onClick={applyDefaults}
              className="ml-auto px-3 py-1 bg-[#1a3050] text-[#4a9eff] text-xs rounded hover:bg-[#1a4060]"
            >
              Apply Defaults
            </button>
          </div>
          <div className="mb-3 bg-[#0a1520] border border-[#1e2d3d] rounded p-2 text-[10px] text-[#5a8ab8] leading-relaxed">
            <span className="text-[#7a9ab8] font-semibold">Attendance Marks: </span>
            <span className="text-[#40c070]">P</span> = Present (Mon–Sat default) &nbsp;|&nbsp;
            <span className="text-[#f07070]">A</span> = Absent (no pay) &nbsp;|&nbsp;
            <span className="text-[#4a9eff]">L</span> = Leave (paid leave) &nbsp;|&nbsp;
            <span className="text-[#c0a040]">H</span> = Holiday/Off (paid) &nbsp;|&nbsp;
            <span className="text-[#c087f0]">OT</span> = Overtime day
            <br />
            <span className="text-[#ff8c40]">P★</span> = Present on govt holiday → earns double wages.
            &nbsp; Sunday defaults to H (weekly off, paid). Govt holidays default to H (paid).
          </div>

          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="sticky left-0 bg-[#0d1620] text-left px-2 py-1.5 text-[#5a8ab8] font-medium min-w-[130px]">
                    Employee
                  </th>
                  {days.map((d) => (
                    <th key={d} className={`px-0 py-1.5 font-medium w-8 text-center ${holidayDaySet.has(d) ? 'text-[#c0a040]' : 'text-[#5a8ab8]'}`}>
                      {holidayDaySet.has(d) ? `${d}★` : d}
                    </th>
                  ))}
                  <th className="px-2 py-1.5 text-[#40c070] font-medium text-center">Wkd</th>
                  <th className="px-2 py-1.5 text-[#4a9eff] font-medium text-center">Lv</th>
                  <th className="px-2 py-1.5 text-[#f07070] font-medium text-center">Ab</th>
                  <th className="px-2 py-1.5 text-white font-medium text-center">Wage</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium min-w-[70px]">Start</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium min-w-[70px]">End</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const row = attendance[emp.employeeId]
                  let daysWorked = 0, leaveDays = 0, absentDays = 0
                  for (const m of row.marks) {
                    if (m === 'P' || m === 'OT' || m === 'H') daysWorked++
                    else if (m === 'L') leaveDays++
                    else if (m === 'A') absentDays++
                  }
                  return (
                    <tr key={emp.employeeId} className="border-b border-[#1a2332]">
                      <td className="sticky left-0 bg-[#0d1620] px-2 py-1 min-w-[130px]">
                        <div className="font-medium text-white truncate max-w-[120px]">{emp.name}</div>
                        <div className="text-[10px] text-[#4a6a8a]">{emp.empId}</div>
                      </td>
                      {days.map((d) => {
                        const mark = row.marks[d - 1] ?? ''
                        const styleKey = (mark === 'P' && holidayDaySet.has(d)) ? 'P_H' : mark
                        return (
                          <td key={d} className="p-0 border-r border-[#1a2332]">
                            <button
                              type="button"
                              onClick={() => toggleMark(emp.employeeId, d - 1)}
                              className={`w-8 h-7 text-[10px] font-semibold ${MARK_STYLE[styleKey] ?? MARK_STYLE['']}`}
                            >
                              {mark || '—'}
                            </button>
                          </td>
                        )
                      })}
                      <td className="px-2 py-1 text-center text-[#40c070]">{daysWorked}</td>
                      <td className="px-2 py-1 text-center text-[#4a9eff]">{leaveDays}</td>
                      <td className="px-2 py-1 text-center text-[#f07070]">{absentDays}</td>
                      <td className="px-2 py-1 text-center font-medium text-white">{daysWorked + leaveDays}</td>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          placeholder="09:00"
                          value={row.workStartTime}
                          onChange={(e) => setAttendanceField(emp.employeeId, 'workStartTime', e.target.value)}
                          className="w-16 bg-[#1a2a3a] border border-[#2a3a50] rounded px-1 py-0.5 text-xs text-[#c8d8e8]"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          placeholder="18:00"
                          value={row.workEndTime}
                          onChange={(e) => setAttendanceField(emp.employeeId, 'workEndTime', e.target.value)}
                          className="w-16 bg-[#1a2a3a] border border-[#2a3a50] rounded px-1 py-0.5 text-xs text-[#c8d8e8]"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}

      {/* Wage Data Tab */}
      {tab === 'wages' && (
        <div className="flex-1 overflow-auto p-4">
          {employees.some((emp) => wages[emp.employeeId]?.basic === 0 && wages[emp.employeeId]?.da === 0) && (
            <div className="mb-3 bg-[#2a2010] border border-[#4a3a10] rounded px-3 py-2 text-xs text-[#c0a040]">
              Some employees have no wage defaults set (Basic = 0, DA = 0). Click &ldquo;Set wage defaults&rdquo; on their row to open their profile in a new tab and fill in the Monthly Wage Defaults section, then reload this page.
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="sticky left-0 bg-[#0d1620] text-left px-2 py-1.5 text-[#5a8ab8] font-medium min-w-[130px]">
                    Employee
                  </th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">
                    Days<Info text="Wage days = P+OT+H+L days. Used to prorate Basic and DA." />
                  </th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">
                    Basic<Info text="Prorated basic wage = (monthly basic × wage days) ÷ days in month" />
                  </th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">
                    DA<Info text="Prorated dearness allowance" />
                  </th>
                  {!isHospital && (
                    <>
                      <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">HRA</th>
                      <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">Other</th>
                    </>
                  )}
                  <th className="px-2 py-1.5 text-[#40c070] font-medium text-right">
                    Gross<Info text="Total earnings = Basic + DA + Fixed Allowance + Holiday Bonus + OT" />
                  </th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">
                    PF<Info text="12% of prorated Basic" />
                  </th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">
                    ESI<Info text="0.75% of prorated gross wages" />
                  </th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">LWF</th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">Adv</th>
                  <th className="px-1 py-1.5 text-[#5a8ab8] font-medium text-right">Fine</th>
                  <th className="px-2 py-1.5 text-[#40c070] font-medium text-right">
                    Net<Info text="Gross − (PF + ESI + LWF + Advance + Fines + Other Deductions)" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const w = wages[emp.employeeId]
                  const noWageDefaults = w.basic === 0 && w.da === 0
                  const calc = calculateWages(formulaConfig, {
                    basic: w.basic, da: w.da, hra: w.hra,
                    otherAllowances: w.otherAllowances,
                    holidayBonus: 0,   // live preview; actual bonus computed server-side on save
                    overtimeEarnings: 0,
                    pf: w.pf, esi: w.esi, lwf: w.lwf,
                    advanceRecovered: w.advanceRecovered,
                    fineDeduction: w.fineDeduction,
                    otherDeductions: w.otherDeductions,
                  })
                  return (
                    <tr key={emp.employeeId} className="border-b border-[#1a2332]">
                      <td className="sticky left-0 bg-[#0d1620] px-2 py-1 min-w-[130px]">
                        <div className="font-medium text-white truncate max-w-[120px]">{emp.name}</div>
                        <div className="text-[10px] text-[#4a6a8a]">{emp.empId}</div>
                        {noWageDefaults && (
                          <a
                            href={`/employees/${emp.employeeId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-[#c0a040] hover:underline"
                          >
                            ⚠ Set wage defaults
                          </a>
                        )}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.daysWorked, (v) => setWageField(emp.employeeId, 'daysWorked', Math.round(v)))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.basic, (v) => setWageField(emp.employeeId, 'basic', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.da, (v) => setWageField(emp.employeeId, 'da', v))}
                      </td>
                      {!isHospital && (
                        <>
                          <td className="px-1 py-1">
                            {numInput(w.hra, (v) => setWageField(emp.employeeId, 'hra', v))}
                          </td>
                          <td className="px-1 py-1">
                            {numInput(w.otherAllowances, (v) => setWageField(emp.employeeId, 'otherAllowances', v))}
                          </td>
                        </>
                      )}
                      <td className="px-2 py-1 text-right font-medium text-[#40c070]">
                        {calc.grossWages.toFixed(2)}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.pf, (v) => setWageField(emp.employeeId, 'pf', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.esi, (v) => setWageField(emp.employeeId, 'esi', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.lwf, (v) => setWageField(emp.employeeId, 'lwf', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.advanceRecovered, (v) => setWageField(emp.employeeId, 'advanceRecovered', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(w.fineDeduction, (v) => setWageField(emp.employeeId, 'fineDeduction', v))}
                      </td>
                      <td className="px-2 py-1 text-right font-medium text-[#40c070]">
                        {calc.netWages.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <button
              onClick={saveWages}
              disabled={saving}
              className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Wage Data'}
            </button>
          </div>
        </div>
      )}

      {/* Overtime Tab */}
      {tab === 'overtime' && (
        <div className="flex-1 overflow-auto p-4">
          <p className="text-xs text-[#5a8ab8] mb-3">Enter daily OT hours. Leave 0 for non-OT days.</p>
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="sticky left-0 bg-[#0d1620] text-left px-2 py-1.5 text-[#5a8ab8] font-medium min-w-[130px]">
                    Employee
                  </th>
                  {days.map((d) => (
                    <th key={d} className="px-0 py-1.5 text-[#5a8ab8] font-medium w-10 text-center">{d}</th>
                  ))}
                  <th className="px-2 py-1.5 text-[#c087f0] font-medium text-right">Total Hrs</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">OT Rate</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">Normal Earn</th>
                  <th className="px-2 py-1.5 text-[#40c070] font-medium text-right">OT Earn</th>
                  <th className="px-2 py-1.5 text-[#40c070] font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const row = ot[emp.employeeId]
                  const totalOtHours = row.dailyOt.reduce((s, h) => s + Math.max(0, h), 0)
                  const otEarnings = Math.round(totalOtHours * row.otRate * 100) / 100
                  const totalEarnings = Math.round((row.normalEarnings + otEarnings) * 100) / 100
                  return (
                    <tr key={emp.employeeId} className="border-b border-[#1a2332]">
                      <td className="sticky left-0 bg-[#0d1620] px-2 py-1 min-w-[130px]">
                        <div className="font-medium text-white truncate max-w-[120px]">{emp.name}</div>
                        <div className="text-[10px] text-[#4a6a8a]">{emp.empId}</div>
                      </td>
                      {days.map((d) => (
                        <td key={d} className="p-0.5 border-r border-[#1a2332]">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={row.dailyOt[d - 1] ?? 0}
                            onChange={(e) => setOtDay(emp.employeeId, d - 1, parseFloat(e.target.value) || 0)}
                            className="w-9 bg-[#1a2a3a] border border-[#2a3a50] rounded px-0.5 py-0.5 text-xs text-[#c8d8e8] text-right"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1 text-right text-[#c087f0]">{totalOtHours.toFixed(1)}</td>
                      <td className="px-1 py-1">
                        {numInput(row.otRate, (v) => setOtField(emp.employeeId, 'otRate', v))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(row.normalEarnings, (v) => setOtField(emp.employeeId, 'normalEarnings', v))}
                      </td>
                      <td className="px-2 py-1 text-right text-[#40c070]">{otEarnings.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right font-medium text-[#40c070]">{totalEarnings.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button
              onClick={saveOt}
              disabled={saving}
              className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Overtime'}
            </button>
          </div>
        </div>
      )}

      {/* Fines Tab */}
      {tab === 'fines' && (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {fines.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Employee</th>
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Offence Date</th>
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Description</th>
                  <th className="text-right px-2 py-1.5 text-[#5a8ab8]">Amount</th>
                  <th className="text-right px-2 py-1.5 text-[#5a8ab8]">Recovered</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr key={f.id} className="border-b border-[#1a2332]">
                    <td className="px-2 py-1.5 text-white">{f.employeeName}</td>
                    <td className="px-2 py-1.5 text-[#7a9ab8]">{f.offenceDate}</td>
                    <td className="px-2 py-1.5 text-[#7a9ab8]">{f.offenceDescription}</td>
                    <td className="px-2 py-1.5 text-right text-[#f07070]">{f.fineAmount.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right text-[#40c070]">{f.recovered.toFixed(2)}</td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => deleteFine(f.id)}
                        disabled={saving}
                        className="text-[10px] text-[#f07070] hover:text-[#ff9090] disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-[#4a6a8a]">No fine records.</p>
          )}

          <div className="border border-[#2a3a50] rounded p-3 space-y-2 max-w-lg">
            <p className="text-xs font-semibold text-[#c8d8e8]">Add Fine Record</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Employee *</label>
                <select
                  value={newFine.employeeId}
                  onChange={(e) => setNewFine((p) => ({ ...p, employeeId: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                >
                  <option value="">Select</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Offence Date *</label>
                <input
                  type="date"
                  aria-label="Offence Date"
                  value={newFine.offenceDate}
                  onChange={(e) => setNewFine((p) => ({ ...p, offenceDate: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Description *</label>
                <input
                  type="text"
                  aria-label="Fine Description"
                  value={newFine.offenceDescription}
                  onChange={(e) => setNewFine((p) => ({ ...p, offenceDescription: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Fine Amount</label>
                <input
                  type="number"
                  aria-label="Fine Amount"
                  step="0.01"
                  min="0"
                  value={newFine.fineAmount}
                  onChange={(e) => setNewFine((p) => ({ ...p, fineAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
            </div>
            <button
              onClick={addFine}
              disabled={saving}
              className="px-3 py-1 bg-[#1a5adc] text-white text-xs rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add Fine'}
            </button>
          </div>
        </div>
      )}

      {/* Deductions Tab */}
      {tab === 'deductions' && (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {deductions.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Employee</th>
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Damage Date</th>
                  <th className="text-left px-2 py-1.5 text-[#5a8ab8]">Description</th>
                  <th className="text-right px-2 py-1.5 text-[#5a8ab8]">Deduction</th>
                  <th className="text-right px-2 py-1.5 text-[#5a8ab8]">Recovered</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {deductions.map((d) => (
                  <tr key={d.id} className="border-b border-[#1a2332]">
                    <td className="px-2 py-1.5 text-white">{d.employeeName}</td>
                    <td className="px-2 py-1.5 text-[#7a9ab8]">{d.damageDate}</td>
                    <td className="px-2 py-1.5 text-[#7a9ab8]">{d.description}</td>
                    <td className="px-2 py-1.5 text-right text-[#f07070]">{d.deductionAmount.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right text-[#40c070]">{d.recovered.toFixed(2)}</td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => deleteDeduction(d.id)}
                        disabled={saving}
                        className="text-[10px] text-[#f07070] hover:text-[#ff9090] disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-[#4a6a8a]">No deduction records.</p>
          )}

          <div className="border border-[#2a3a50] rounded p-3 space-y-2 max-w-lg">
            <p className="text-xs font-semibold text-[#c8d8e8]">Add Deduction Record</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Employee *</label>
                <select
                  value={newDeduction.employeeId}
                  onChange={(e) => setNewDeduction((p) => ({ ...p, employeeId: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                >
                  <option value="">Select</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Damage Date *</label>
                <input
                  type="date"
                  value={newDeduction.damageDate}
                  onChange={(e) => setNewDeduction((p) => ({ ...p, damageDate: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Description *</label>
                <input
                  type="text"
                  value={newDeduction.description}
                  onChange={(e) => setNewDeduction((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#5a8ab8] mb-1">Deduction Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newDeduction.deductionAmount}
                  onChange={(e) => setNewDeduction((p) => ({ ...p, deductionAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
                />
              </div>
            </div>
            <button
              onClick={addDeduction}
              disabled={saving}
              className="px-3 py-1 bg-[#1a5adc] text-white text-xs rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add Deduction'}
            </button>
          </div>
        </div>
      )}

      {/* Leave Tab */}
      {tab === 'leave' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e2d3d]">
                  <th className="sticky left-0 bg-[#0d1620] text-left px-2 py-1.5 text-[#5a8ab8] font-medium min-w-[130px]">
                    Employee
                  </th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">EL Open</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">EL Earned</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">EL Availed</th>
                  <th className="px-2 py-1.5 text-[#40c070] font-medium text-right">EL Closing</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">Medical</th>
                  <th className="px-2 py-1.5 text-[#5a8ab8] font-medium text-right">Other</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const row = leave[emp.employeeId]
                  const closing = Math.max(0, row.earnedLeaveOpening + row.earnedDuring - row.earnedAvailed)
                  return (
                    <tr key={emp.employeeId} className="border-b border-[#1a2332]">
                      <td className="sticky left-0 bg-[#0d1620] px-2 py-1 min-w-[130px]">
                        <div className="font-medium text-white truncate max-w-[120px]">{emp.name}</div>
                        <div className="text-[10px] text-[#4a6a8a]">{emp.empId}</div>
                      </td>
                      <td className="px-1 py-1">
                        {numInput(row.earnedLeaveOpening, (v) => setLeaveField(emp.employeeId, 'earnedLeaveOpening', Math.round(v)))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(row.earnedDuring, (v) => setLeaveField(emp.employeeId, 'earnedDuring', Math.round(v)))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(row.earnedAvailed, (v) => setLeaveField(emp.employeeId, 'earnedAvailed', Math.round(v)))}
                      </td>
                      <td className="px-2 py-1 text-right font-medium text-[#40c070]">{closing}</td>
                      <td className="px-1 py-1">
                        {numInput(row.medicalLeave, (v) => setLeaveField(emp.employeeId, 'medicalLeave', Math.round(v)))}
                      </td>
                      <td className="px-1 py-1">
                        {numInput(row.otherLeave, (v) => setLeaveField(emp.employeeId, 'otherLeave', Math.round(v)))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button
              onClick={saveLeave}
              disabled={saving}
              className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Leave Data'}
            </button>
          </div>
        </div>
      )}

      {/* Footer toolbar */}
      <div className="border-t border-[#1e2d3d] px-4 py-2 flex items-center justify-between bg-[#0d1620]">
        <span className="text-[10px] text-[#4a6a8a]">
          Status: <span className="text-[#c8d8e8]">{formTaskStatus.replace(/_/g, ' ')}</span>
        </span>
        <div className="flex gap-2">
          {formTaskStatus === 'NOT_STARTED' && (
            <button
              onClick={() => transition('DATA_ENTRY')}
              disabled={saving}
              className="px-3 py-1 bg-[#1a3050] text-[#4a9eff] text-xs rounded hover:bg-[#1a4060] disabled:opacity-50"
            >
              Start Entry
            </button>
          )}
          {formTaskStatus === 'DATA_ENTRY' && (
            <button
              onClick={() => transition('READY_FOR_REVIEW')}
              disabled={saving}
              className="px-3 py-1 bg-[#1a4020] text-[#40c070] text-xs rounded hover:bg-[#1a5030] disabled:opacity-50"
            >
              Move to Review
            </button>
          )}
          {formTaskStatus === 'NEEDS_CORRECTION' && (
            <button
              onClick={() => transition('DATA_ENTRY')}
              disabled={saving}
              className="px-3 py-1 bg-[#2a1010] text-[#f07070] text-xs rounded hover:bg-[#3a1010] disabled:opacity-50"
            >
              Reopen for Entry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
