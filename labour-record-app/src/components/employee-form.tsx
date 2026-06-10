'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Employee, Establishment } from '@/generated/prisma/client'
import { Info } from '@/components/info-tooltip'
import { getDaRate } from '@/domain/calculations/da-rates'
import { computeSalaryBreakdown } from '@/domain/calculations/salary-breakdown'
import type { PfMode } from '@/domain/calculations/pf-calculator'

type Props = {
  employee?: Employee
  establishments: Pick<Establishment, 'id' | 'name' | 'type'>[]
  defaultEstablishmentId?: string
}

export function EmployeeForm({ employee, establishments, defaultEstablishmentId }: Props) {
  const router = useRouter()
  const isEdit = !!employee

  const initialType = establishments.find(
    (e) => e.id === (employee?.establishmentId ?? defaultEstablishmentId)
  )?.type
  const initialFirmDa = initialType ? getDaRate(initialType) : 0

  const [form, setForm] = useState({
    empId: employee?.empId ?? '',
    name: employee?.name ?? '',
    sex: employee?.sex ?? '',
    fatherSpouseName: employee?.fatherSpouseName ?? '',
    dob: employee?.dob ? new Date(employee.dob).toISOString().split('T')[0] : '',
    dateOfEntry: employee?.dateOfEntry
      ? new Date(employee.dateOfEntry).toISOString().split('T')[0] : '',
    designation: employee?.designation ?? '',
    department: employee?.department ?? '',
    presentAddress: employee?.presentAddress ?? '',
    permanentAddress: employee?.permanentAddress ?? '',
    uan: employee?.uan ?? '',
    esiNo: employee?.esiNo ?? '',
    aadhaar: employee?.aadhaar ?? '',
    bankAccount: employee?.bankAccount ?? '',
    ifsc: employee?.ifsc ?? '',
    bankName: employee?.bankName ?? '',
    mobile: employee?.mobile ?? '',
    email: employee?.email ?? '',
    completionOf480Days: employee?.completionOf480Days
      ? new Date(employee.completionOf480Days).toISOString().split('T')[0] : '',
    dateMadePermanent: employee?.dateMadePermanent
      ? new Date(employee.dateMadePermanent).toISOString().split('T')[0] : '',
    periodOfSuspension: employee?.periodOfSuspension ?? '',
    status: employee?.status ?? 'ACTIVE',
    exitDate: employee?.exitDate
      ? new Date(employee.exitDate).toISOString().split('T')[0] : '',
    exitReason: employee?.exitReason ?? '',
    remarks: employee?.remarks ?? '',
    establishmentId: employee?.establishmentId ?? defaultEstablishmentId ?? '',
    defaultTotalSalary: String(employee?.defaultTotalSalary ?? 0),
    basicWage: String(employee?.basicWage ?? 0),
    daWage: String(employee?.daWage ?? 0),
    hraWage: String(employee?.hraWage ?? 0),
    // Salary Setup drivers (editable; DA defaults to the firm rate)
    setupDa: String(employee?.daWage || initialFirmDa),
    setupHra: String(employee?.hraWage ?? 0),
    setupOther: '0',
    setupOvertime: '0',
    pfMode: (employee?.pfMode ?? 'PERCENT') as PfMode,
    pfPercent: String(employee?.pfPercent ?? 12),
    pfWageCeiling: String(employee?.pfWageCeiling ?? 15000),
    pfFixedAmount: String(employee?.pfAmount || 1800),
    esiApplicable: true,
    esiPercent: '0.75',
    esiThreshold: '21000',
    pfAmount: String(employee?.pfAmount ?? 0),
    esiAmount: String(employee?.esiAmount ?? 0),
    lwfAmount: String(employee?.lwfAmount ?? 0),
  })

  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const selectedType = establishments.find((e) => e.id === form.establishmentId)?.type
  const firmDa = selectedType ? getDaRate(selectedType) : 0

  // Live breakdown from the current Salary Setup inputs (recomputed each render).
  const preview = computeSalaryBreakdown({
    totalSalary: parseFloat(form.defaultTotalSalary) || 0,
    daRate: parseFloat(form.setupDa) || 0,
    hra: parseFloat(form.setupHra) || 0,
    otherAllowances: parseFloat(form.setupOther) || 0,
    lwf: parseFloat(form.lwfAmount) || 0,
    overtimeEarnings: parseFloat(form.setupOvertime) || 0,
    pfConfig: {
      mode: form.pfMode,
      percent: parseFloat(form.pfPercent) || 0,
      ceiling: parseFloat(form.pfWageCeiling) || undefined,
      fixedAmount: parseFloat(form.pfFixedAmount) || 0,
    },
    esiApplicable: form.esiApplicable,
    esiEmployeePct: parseFloat(form.esiPercent) || 0,
    esiThreshold: parseFloat(form.esiThreshold) || 0,
  })

  // Item 10: auto-fill the Monthly Wage Defaults from the live preview (still editable).
  function applyBreakdown() {
    setForm((prev) => ({
      ...prev,
      basicWage: String(preview.basic),
      daWage: String(preview.da),
      hraWage: String(preview.hra),
      pfAmount: String(preview.pf),
      esiAmount: String(preview.esi),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors([])

    const clientErrors: string[] = []
    if (form.name.trim().length < 2) clientErrors.push('Name must be at least 2 characters')
    if (form.empId.trim().length < 1) clientErrors.push('Employee ID is required')

    if (form.dob) {
      const dob = new Date(form.dob)
      const minAge = new Date()
      minAge.setFullYear(minAge.getFullYear() - 14)
      if (dob > minAge) clientErrors.push('Employee must be at least 14 years old')
    }

    if (form.dateOfEntry && form.dob) {
      const entryDate = new Date(form.dateOfEntry)
      const dob = new Date(form.dob)
      if (entryDate < dob) clientErrors.push('Date of Entry cannot be before Date of Birth')
    }

    if (form.exitDate && form.dateOfEntry) {
      const exit = new Date(form.exitDate)
      const entry = new Date(form.dateOfEntry)
      if (exit < entry) clientErrors.push('Exit Date cannot be before Date of Entry')
    }

    if (isEdit && form.exitDate && !form.exitReason.trim()) {
      clientErrors.push('Reason for exit is required when Exit Date is set')
    }

    if (form.mobile && !/^\d{10}$/.test(form.mobile.replace(/\s/g, ''))) {
      clientErrors.push('Mobile must be 10 digits. e.g. 9876543210')
    }

    if (form.uan && !/^\d{12}$/.test(form.uan.replace(/\s/g, ''))) {
      clientErrors.push('UAN must be exactly 12 digits')
    }

    if (form.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc.trim())) {
      clientErrors.push('IFSC must be 11 characters: 4 letters + 0 + 6 alphanumeric. e.g. SBIN0001234')
    }

    const wageFields = ['basicWage', 'daWage', 'hraWage', 'pfAmount', 'esiAmount', 'lwfAmount']
    for (const f of wageFields) {
      if (parseFloat(form[f as keyof typeof form] as string) < 0) {
        clientErrors.push('Wage amounts cannot be negative')
        break
      }
    }

    if (parseFloat(form.basicWage) > 200000) clientErrors.push('Basic wage seems too high (max ₹2,00,000)')

    if (clientErrors.length > 0) { setErrors(clientErrors); setSaving(false); return }

    const url = isEdit ? `/api/employees/${employee.id}` : '/api/employees'
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
      return
    }

    router.push('/employees')
    router.refresh()
  }

  const inputClass =
    'w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]'
  const labelClass = 'block text-xs text-[#5a8ab8] mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl p-6 space-y-6">
      {errors.length > 0 && (
        <div className="bg-[#2a1010] border border-[#5a2020] rounded p-3 text-xs text-[#f07070] space-y-1">
          {errors.map((e) => <p key={e}>{e}</p>)}
        </div>
      )}

      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Basic Details</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              Employee ID *
              <Info text="Unique ID within this establishment. e.g. EMP001 or H-2024-01. Cannot be changed later without care." />
            </label>
            <input className={inputClass} aria-label="Emp ID" value={form.empId}
              onChange={(e) => set('empId', e.target.value)} required />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>
              Full Name *
              <Info text="Full name as per Aadhaar/official records. e.g. Ramesh Kumar A" />
            </label>
            <input className={inputClass} aria-label="Name" value={form.name}
              onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>
              Sex *
              <Info text="M = Male, F = Female. Used in statutory registers." />
            </label>
            <select className={inputClass} aria-label="Sex" value={form.sex}
              onChange={(e) => set('sex', e.target.value)} required>
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelClass}>
              Father / Spouse Name *
              <Info text="Father's name (for unmarried) or spouse name (for married). Required for Form I and PF nomination." />
            </label>
            <input className={inputClass} aria-label="Father / Spouse Name" value={form.fatherSpouseName}
              onChange={(e) => set('fatherSpouseName', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>
              Date of Birth
              <Info text="Employee must be at least 14 years old. Displayed on statutory registers." />
            </label>
            <input className={inputClass} aria-label="Date of Birth" type="date" value={form.dob}
              onChange={(e) => set('dob', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              Date of Entry *
              <Info text="First day of employment. Used to compute tenure, earned leave, and 480-days milestone." />
            </label>
            <input className={inputClass} aria-label="Date of Entry" type="date" value={form.dateOfEntry}
              onChange={(e) => set('dateOfEntry', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>
              Establishment
              <Info text="The establishment this employee belongs to. Set at creation and cannot be changed." />
            </label>
            {!isEdit && defaultEstablishmentId ? (
              <p className="text-sm text-[#c8d8e8] py-1.5">
                {establishments.find((e) => e.id === defaultEstablishmentId)?.name ?? defaultEstablishmentId}
              </p>
            ) : (
              <select className={inputClass} aria-label="Establishment" value={form.establishmentId}
                onChange={(e) => set('establishmentId', e.target.value)} required>
                <option value="">Select</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>{est.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Designation *
              <Info text="Job title as per appointment letter. e.g. Staff Nurse, Pharmacist, Lab Technician" />
            </label>
            <input className={inputClass} aria-label="Designation" value={form.designation}
              onChange={(e) => set('designation', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>
              Department
              <Info text="Section or unit. e.g. OPD, ICU, Pharmacy, Admin (optional)" />
            </label>
            <input className={inputClass} value={form.department}
              onChange={(e) => set('department', e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Addresses</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Present Address *
              <Info text="Current residential address. Used in Form I register." />
            </label>
            <textarea className={inputClass} rows={2} aria-label="Present Address" value={form.presentAddress}
              onChange={(e) => set('presentAddress', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>
              Permanent Address *
              <Info text="Permanent/native address. Used in Form I register." />
            </label>
            <textarea className={inputClass} rows={2} aria-label="Permanent Address" value={form.permanentAddress}
              onChange={(e) => set('permanentAddress', e.target.value)} required />
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Statutory IDs</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              EPF UAN
              <Info text="12-digit Universal Account Number from EPFO. e.g. 100234567890" />
            </label>
            <input className={inputClass} value={form.uan}
              onChange={(e) => set('uan', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              ESI No.
              <Info text="17-digit ESI insurance number from ESIC. e.g. 12-00-123456-000-0001" />
            </label>
            <input className={inputClass} value={form.esiNo}
              onChange={(e) => set('esiNo', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              Aadhaar No.
              <Info text="12-digit Aadhaar number. Stored encrypted. e.g. 123456789012" />
            </label>
            <input className={inputClass} type="password" value={form.aadhaar}
              onChange={(e) => set('aadhaar', e.target.value)}
              placeholder="Stored encrypted" />
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Bank Details</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>
              Bank Account No.
              <Info text="Bank account number (9–18 digits). Stored encrypted for salary transfer." />
            </label>
            <input className={inputClass} type="password" value={form.bankAccount}
              onChange={(e) => set('bankAccount', e.target.value)}
              placeholder="Stored encrypted" />
          </div>
          <div>
            <label className={labelClass}>
              IFSC Code
              <Info text="11-character bank branch code. Format: 4 letters + 0 + 6 alphanumeric. e.g. SBIN0001234" />
            </label>
            <input className={inputClass} value={form.ifsc}
              onChange={(e) => set('ifsc', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>
              Bank Name
              <Info text="e.g. State Bank of India, Indian Bank" />
            </label>
            <input className={inputClass} value={form.bankName}
              onChange={(e) => set('bankName', e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Contact</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              Mobile
              <Info text="10-digit mobile number. e.g. 9876543210" />
            </label>
            <input className={inputClass} value={form.mobile}
              onChange={(e) => set('mobile', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>
              Email
              <Info text="Official contact email. Optional." />
            </label>
            <input className={inputClass} type="email" value={form.email}
              onChange={(e) => set('email', e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Service Dates</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              480 Days Completion
              <Info text="Date when employee completes 480 working days — entitles them to earned leave under TN Shops Act." />
            </label>
            <input className={inputClass} type="date" value={form.completionOf480Days}
              onChange={(e) => set('completionOf480Days', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              Date Made Permanent
              <Info text="Date of confirmation/regularisation." />
            </label>
            <input className={inputClass} type="date" value={form.dateMadePermanent}
              onChange={(e) => set('dateMadePermanent', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              Period of Suspension
              <Info text="Any suspension period for records. e.g. 15 days — April 2024" />
            </label>
            <input className={inputClass} value={form.periodOfSuspension}
              onChange={(e) => set('periodOfSuspension', e.target.value)} />
          </div>
        </div>
      </section>

      {isEdit && (
        <section>
          <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Exit Details</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status}
                onChange={(e) => set('status', e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="EXITED">Exited</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Exit Date</label>
              <input className={inputClass} type="date" value={form.exitDate}
                onChange={(e) => set('exitDate', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Reason for Exit</label>
              <input className={inputClass} value={form.exitReason}
                onChange={(e) => set('exitReason', e.target.value)} />
            </div>
          </div>
        </section>
      )}

      <section>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Salary Setup</p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelClass}>
              Default Total Salary (₹)
              <Info text="Monthly gross target (Basic + DA + HRA + Other). Basic is the remainder after the components below." />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              aria-label="Default Total Salary"
              value={form.defaultTotalSalary}
              onChange={(e) => set('defaultTotalSalary', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              DA (₹)
              <Info text="Dearness Allowance. Defaults to the firm rate but is editable per employee. Use the ↺ button to reset to the firm rate." />
            </label>
            <div className="flex gap-1">
              <input className={inputClass} type="number" min="0" step="0.01"
                aria-label="Setup DA" value={form.setupDa}
                onChange={(e) => set('setupDa', e.target.value)} />
              {selectedType && (
                <button type="button" title={`Reset to firm rate ₹${firmDa}`}
                  onClick={() => set('setupDa', String(firmDa))}
                  className="px-2 text-[10px] text-[#4a9eff] border border-[#1a3a6a] rounded hover:bg-[#1a3060] whitespace-nowrap">
                  ↺ ₹{firmDa.toLocaleString('en-IN')}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className={labelClass}>
              HRA (₹)
              <Info text="House Rent Allowance (editable). Part of the gross; reduces Basic." />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              aria-label="Setup HRA" value={form.setupHra}
              onChange={(e) => set('setupHra', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              Other Allowances (₹)
              <Info text="Any other fixed monthly allowance. Part of the gross; reduces Basic." />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              aria-label="Setup Other Allowances" value={form.setupOther}
              onChange={(e) => set('setupOther', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              Overtime / Double Wages (₹)
              <Info text="Extra earnings added on top of the gross (e.g. holiday double-wages). Not part of Basic." />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              aria-label="Setup Overtime" value={form.setupOvertime}
              onChange={(e) => set('setupOvertime', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              LWF (₹)
              <Info text="Labour Welfare Fund deduction per month (editable). TN employee share ≈ ₹10. Subtracted from gross in the net pay." />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              aria-label="Setup LWF" value={form.lwfAmount}
              onChange={(e) => set('lwfAmount', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              PF Mode
              <Info text="PERCENT: 12% of Basic+DA capped at the wage ceiling (₹1,800 default). FIXED: a flat PF amount. NONE: no PF." />
            </label>
            <select className={inputClass} aria-label="PF Mode" value={form.pfMode}
              onChange={(e) => set('pfMode', e.target.value as PfMode)}>
              <option value="PERCENT">Percent (%)</option>
              <option value="FIXED">Fixed (₹)</option>
              <option value="NONE">None</option>
            </select>
          </div>
          {form.pfMode === 'PERCENT' && (
            <>
              <div>
                <label className={labelClass}>PF %</label>
                <input className={inputClass} type="number" min="0" step="0.01"
                  aria-label="PF Percent" value={form.pfPercent}
                  onChange={(e) => set('pfPercent', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>PF Wage Ceiling (₹)</label>
                <input className={inputClass} type="number" min="0" step="1"
                  aria-label="PF Wage Ceiling" value={form.pfWageCeiling}
                  onChange={(e) => set('pfWageCeiling', e.target.value)} />
              </div>
            </>
          )}
          {form.pfMode === 'FIXED' && (
            <div>
              <label className={labelClass}>
                Fixed PF Amount (₹)
                <Info text="Flat monthly PF deducted for this employee." />
              </label>
              <input className={inputClass} type="number" min="0" step="0.01"
                aria-label="PF Fixed Amount" value={form.pfFixedAmount}
                onChange={(e) => set('pfFixedAmount', e.target.value)} />
            </div>
          )}
          <div className="col-span-3 flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-[#7a9ab8] cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={form.esiApplicable}
                onChange={(e) => set('esiApplicable', e.target.checked)} />
              ESI Applicable
              <Info text="ESI = employee % of gross wages, only when gross ≤ the threshold. TN statutory default: 0.75% with a ₹21,000 threshold — both editable here." />
            </label>
            {form.esiApplicable && (
              <>
                <label className="text-[10px] text-[#5a8ab8] ml-2">ESI %</label>
                <input className={`${inputClass} w-20`} type="number" min="0" step="0.01"
                  aria-label="ESI Percent" value={form.esiPercent}
                  onChange={(e) => set('esiPercent', e.target.value)} />
                <label className="text-[10px] text-[#5a8ab8]">Threshold ₹</label>
                <input className={`${inputClass} w-24`} type="number" min="0" step="1"
                  aria-label="ESI Threshold" value={form.esiThreshold}
                  onChange={(e) => set('esiThreshold', e.target.value)} />
              </>
            )}
            <button type="button" onClick={applyBreakdown}
              className="ml-auto px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] whitespace-nowrap">
              Apply to wage defaults ↓
            </button>
          </div>
        </div>

        {/* Live breakdown preview — updates as you type */}
        <div className="mb-5 rounded border border-[#1e2d3d] bg-[#0a1520] overflow-hidden">
          <div className="px-3 py-1.5 bg-[#0f1f30] text-[10px] uppercase tracking-wider text-[#5a8ab8] font-semibold">
            Live Breakdown Preview
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 px-4 py-3">
            <PreviewRow label="Basic" value={preview.basic} />
            <PreviewRow label="DA" value={preview.da} />
            <PreviewRow label="HRA" value={preview.hra} />
            <PreviewRow label="Other Allow." value={preview.otherAllowances} />
            <PreviewRow label="Overtime" value={preview.overtimeEarnings} accent="#c0a040" />
            <PreviewRow label="PF" value={preview.pf} accent="#f09070" />
            <PreviewRow label="ESI" value={preview.esi} accent="#f09070" />
            <PreviewRow label="LWF" value={preview.lwf} accent="#f09070" />
          </div>
          <div className="flex flex-wrap justify-between gap-2 px-4 py-2 border-t border-[#1e2d3d] text-xs">
            <span className="text-[#40c070] font-semibold">Gross: ₹{preview.grossWages.toLocaleString('en-IN')}</span>
            <span className="text-[#f07070]">− Deductions: ₹{preview.totalDeductions.toLocaleString('en-IN')}</span>
            <span className="text-white font-bold">Net Pay: ₹{preview.netSalary.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3 uppercase tracking-wide">Monthly Wage Defaults</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              Basic (₹)
              <Info text="Monthly basic wage as per appointment/minimum wages notification. e.g. ₹6,000" />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              aria-label="Basic Wage"
              value={form.basicWage}
              onChange={(e) => set('basicWage', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              DA (₹)
              <Info text="Dearness Allowance per month as per TN govt notification. e.g. ₹1,360" />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              value={form.daWage}
              onChange={(e) => set('daWage', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              HRA (₹)
              <Info text="House Rent Allowance per month (Shop establishments). e.g. ₹500" />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              value={form.hraWage}
              onChange={(e) => set('hraWage', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              PF (₹)
              <Info text="Monthly PF deduction = 12% of Basic. e.g. Basic ₹6,000 → PF ₹720" />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              value={form.pfAmount}
              onChange={(e) => set('pfAmount', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              ESI (₹)
              <Info text="Monthly ESI deduction = 0.75% of gross wages. e.g. Gross ₹7,360 → ESI ₹55.20" />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              value={form.esiAmount}
              onChange={(e) => set('esiAmount', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>
              LWF (₹)
              <Info text="Labour Welfare Fund monthly deduction. TN employee share: ₹0.25/month" />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              value={form.lwfAmount}
              onChange={(e) => set('lwfAmount', e.target.value)} />
          </div>
        </div>
      </section>

      <div>
        <label className={labelClass}>Remarks</label>
        <input className={inputClass} value={form.remarks}
          onChange={(e) => set('remarks', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Employee'}
        </button>
        <button type="button" onClick={() => router.push('/employees')}
          className="px-4 py-1.5 bg-transparent border border-[#2a3a50] text-[#7a9ab8] text-xs rounded">
          Cancel
        </button>
      </div>
    </form>
  )
}

function PreviewRow({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-[11px] text-[#5a8ab8]">{label}</span>
      <span className="text-xs font-mono" style={{ color: accent ?? '#c8d8e8' }}>
        ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}
