'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Establishment } from '@/generated/prisma/client'
import type { WageFormulaConfig } from '@/types'
import { Info } from '@/components/info-tooltip'

type Props = {
  establishment?: Establishment
}

const defaultFormula: WageFormulaConfig = {
  preset: 'TN_MINIMUM_WAGES_HOSPITAL',
  fixedAllowance: 0,
  esiApplicable: false,
  lwfApplicable: true,
  lwfRate: 0.25,
}

export function EstablishmentForm({ establishment }: Props) {
  const router = useRouter()
  const isEdit = !!establishment

  const [form, setForm] = useState({
    name: establishment?.name ?? '',
    address: establishment?.address ?? '',
    employerName: establishment?.employerName ?? '',
    managerName: establishment?.managerName ?? '',
    regCertNo: establishment?.regCertNo ?? '',
    type: establishment?.type ?? 'HOSPITAL',
    isActive: establishment?.isActive ?? true,
    wageFormulaConfig: establishment?.wageFormulaConfig
      ? (JSON.parse(establishment.wageFormulaConfig) as WageFormulaConfig)
      : defaultFormula,
  })

  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const setFormula = (field: string, value: unknown) =>
    setForm((prev) => ({
      ...prev,
      wageFormulaConfig: { ...prev.wageFormulaConfig, [field]: value },
    }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors([])

    const clientErrors: string[] = []
    if (form.name.trim().length < 3) clientErrors.push('Establishment name must be at least 3 characters')
    if (form.regCertNo.trim().length < 3) clientErrors.push('Registration certificate number is required')
    if ((form.wageFormulaConfig.fixedAllowance ?? 0) > 50000) clientErrors.push('Fixed allowance seems too high (max ₹50,000)')
    if ((form.wageFormulaConfig.lwfRate ?? 0) > 100) clientErrors.push('LWF rate seems unusually high')
    if (clientErrors.length > 0) { setErrors(clientErrors); setSaving(false); return }

    const url = isEdit ? `/api/establishments/${establishment.id}` : '/api/establishments'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
      return
    }

    router.push('/establishments')
    router.refresh()
  }

  const inputClass =
    'w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]'
  const labelClass = 'block text-xs text-[#5a8ab8] mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl p-6 space-y-4">
      {errors.length > 0 && (
        <div className="bg-[#2a1010] border border-[#5a2020] rounded p-3 text-xs text-[#f07070] space-y-1">
          {errors.map((e) => <p key={e}>{e}</p>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>
            Establishment Name *
            <Info text="Legal registered name. e.g. City General Hospital" />
          </label>
          <input className={inputClass} aria-label="Name" value={form.name}
            onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>
            Address *
            <Info text="Full registered address including city and pincode. Appears on all statutory forms." />
          </label>
          <textarea className={inputClass} aria-label="Address" rows={2} value={form.address}
            onChange={(e) => set('address', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>
            Employer Name *
            <Info text="Name of the owner/proprietor as per licence. e.g. Dr. John Smith" />
          </label>
          <input className={inputClass} aria-label="Employer Name" value={form.employerName}
            onChange={(e) => set('employerName', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>
            Manager / In-Charge *
            <Info text="Name of the manager responsible. Appears on Form I, Form V etc." />
          </label>
          <input className={inputClass} aria-label="Manager Name" value={form.managerName}
            onChange={(e) => set('managerName', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>
            Registration Certificate No. *
            <Info text="Certificate no. under Shops & Establishments Act or Clinical Establishments Act. e.g. REG/TN/2024/1234" />
          </label>
          <input className={inputClass} aria-label="Reg Cert No" value={form.regCertNo}
            onChange={(e) => set('regCertNo', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>
            Establishment Type *
            <Info text="HOSPITAL: Clinical Establishments Act applies. SHOP: Tamil Nadu Shops & Establishments Act applies. Determines which statutory forms are generated." />
          </label>
          <select className={inputClass} aria-label="Type" value={form.type}
            onChange={(e) => {
              set('type', e.target.value)
              setFormula('preset', e.target.value === 'HOSPITAL'
                ? 'TN_MINIMUM_WAGES_HOSPITAL' : 'TN_SHOPS_ESTABLISHMENTS')
            }}>
            <option value="HOSPITAL">Hospital</option>
            <option value="SHOP">Shop</option>
          </select>
        </div>
      </div>

      <div className="border-t border-[#1e2d3d] pt-4">
        <p className="text-xs font-semibold text-[#c8d8e8] mb-3">Wage Formula Configuration</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className={labelClass}>Preset</label>
            <input className={`${inputClass} text-[#7a9ab8]`}
              value={form.wageFormulaConfig.preset} readOnly />
          </div>
          {form.type === 'HOSPITAL' && (
            <div>
              <label className={labelClass}>
                Fixed Allowance (₹) beyond Basic+DA
                <Info text="Additional fixed monthly allowance beyond Basic+DA (hospital only). e.g. ₹360/month as per TN notification." />
              </label>
              <input className={inputClass} type="number" min="0"
                value={form.wageFormulaConfig.fixedAllowance ?? 0}
                onChange={(e) => setFormula('fixedAllowance', parseFloat(e.target.value))} />
            </div>
          )}
          {form.type === 'SHOP' && (
            <div>
              <label className={labelClass}>HRA (₹)</label>
              <input className={inputClass} type="number" min="0"
                value={form.wageFormulaConfig.hra ?? 0}
                onChange={(e) => setFormula('hra', parseFloat(e.target.value))} />
            </div>
          )}
          <div>
            <label className={labelClass}>
              LWF Rate (₹ per month)
              <Info text="Labour Welfare Fund deduction per employee per month. TN rate: ₹0.25 employee + ₹0.75 employer." />
            </label>
            <input className={inputClass} type="number" min="0" step="0.01"
              value={form.wageFormulaConfig.lwfRate ?? 0}
              onChange={(e) => setFormula('lwfRate', parseFloat(e.target.value))} />
          </div>
          <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-2 text-xs text-[#7a9ab8] cursor-pointer">
              <input type="checkbox"
                checked={form.wageFormulaConfig.esiApplicable ?? false}
                onChange={(e) => setFormula('esiApplicable', e.target.checked)} />
              ESI Applicable
              <Info text="Tick if any employee earns ≤ ₹21,000/month gross. ESI = 0.75% employee + 3.25% employer." />
            </label>
            <label className="flex items-center gap-2 text-xs text-[#7a9ab8] cursor-pointer">
              <input type="checkbox"
                checked={form.wageFormulaConfig.lwfApplicable ?? true}
                onChange={(e) => setFormula('lwfApplicable', e.target.checked)} />
              LWF Applicable
              <Info text="Labour Welfare Fund applicable to all establishments in TN by default." />
            </label>
          </div>
        </div>
      </div>

      {isEdit && (
        <div>
          <label className="flex items-center gap-2 text-xs text-[#7a9ab8] cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)} />
            Active
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Establishment'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/establishments')}
          className="px-4 py-1.5 bg-transparent border border-[#2a3a50] text-[#7a9ab8] text-xs rounded hover:border-[#4a6a8a]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
