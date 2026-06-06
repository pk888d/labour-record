'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from '@/components/info-tooltip'

type Establishment = { id: string; name: string; type: string }

type Props = {
  establishments: Establishment[]
}

export function CycleForm({ establishments }: Props) {
  const router = useRouter()
  const now = new Date()

  const [form, setForm] = useState({
    establishmentId: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    wagePeriodDays: 26,
  })
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors([])

    const currentYear = new Date().getFullYear()
    if (form.year < 2000 || form.year > currentYear + 2) {
      setErrors([`Year must be between 2000 and ${currentYear + 2}`])
      setSaving(false)
      return
    }
    if (form.wagePeriodDays < 1 || form.wagePeriodDays > 31) {
      setErrors(['Wage period days must be between 1 and 31'])
      setSaving(false)
      return
    }
    if (!form.establishmentId) {
      setErrors(['Please select an establishment'])
      setSaving(false)
      return
    }

    const res = await fetch('/api/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
      return
    }

    router.push('/cycles')
    router.refresh()
  }

  const inputClass =
    'w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]'
  const labelClass = 'block text-xs text-[#5a8ab8] mb-1'

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]

  return (
    <form onSubmit={handleSubmit} className="max-w-lg p-6 space-y-4">
      {errors.length > 0 && (
        <div className="bg-[#2a1010] border border-[#5a2020] rounded p-3 text-xs text-[#f07070] space-y-1">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      <div>
        <label className={labelClass}>
          Establishment *
          <Info text="Select which establishment this wage cycle belongs to. All active employees of that establishment will be included." />
        </label>
        <select className={inputClass} aria-label="Establishment" value={form.establishmentId}
          onChange={(e) => set('establishmentId', e.target.value)} required>
          <option value="">Select establishment</option>
          {establishments.map((est) => (
            <option key={est.id} value={est.id}>
              {est.name} ({est.type})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Month *
            <Info text="The calendar month for which wages are being calculated." />
          </label>
          <select className={inputClass} aria-label="Month" value={form.month}
            onChange={(e) => set('month', parseInt(e.target.value))}>
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Year *
            <Info text="The calendar year. e.g. 2024" />
          </label>
          <input className={inputClass} aria-label="Year" type="number" min="2000" max="2100"
            value={form.year}
            onChange={(e) => set('year', parseInt(e.target.value))} required />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Wage Period Days
          <Info text="Number of working days in this wage period used for proration. Default 26 = Mon–Sat (4 Saturdays + 22 weekdays). Change to 27 if the month has 5 Saturdays." />
        </label>
        <input className={inputClass} type="number" min="1" max="31"
          value={form.wagePeriodDays}
          onChange={(e) => set('wagePeriodDays', parseInt(e.target.value))} />
        <p className="text-[10px] text-[#4a6a8a] mt-1">Default: 26 days</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50">
          {saving ? 'Creating…' : 'Create Cycle'}
        </button>
        <button type="button" onClick={() => router.push('/cycles')}
          className="px-4 py-1.5 bg-transparent border border-[#2a3a50] text-[#7a9ab8] text-xs rounded">
          Cancel
        </button>
      </div>
    </form>
  )
}
