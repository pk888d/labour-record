'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Employee, Establishment } from '@/generated/prisma/client'
import { Info } from '@/components/info-tooltip'

type Props = {
  employee?: Employee
  establishments: Pick<Establishment, 'id' | 'name' | 'type'>[]
  defaultEstablishmentId?: string
}

export function EmployeeForm({ employee, establishments, defaultEstablishmentId }: Props) {
  const router = useRouter()
  const isEdit = !!employee

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
    basicWage: String(employee?.basicWage ?? 0),
    daWage: String(employee?.daWage ?? 0),
    hraWage: String(employee?.hraWage ?? 0),
    pfAmount: String(employee?.pfAmount ?? 0),
    esiAmount: String(employee?.esiAmount ?? 0),
    lwfAmount: String(employee?.lwfAmount ?? 0),
  })

  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

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
