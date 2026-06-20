'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RawPrintSettings } from '@/lib/print-config'

type Props = {
  initial: RawPrintSettings
  ceilings: { landscape: number; portrait: number }
}

export function SettingsForm({ initial, ceilings }: Props) {
  const router = useRouter()
  const inputClass =
    'w-40 bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8] focus:outline-none focus:border-[#4a9eff]'
  const hintClass = 'block text-xs text-[#5a8ab8] mt-1'
  const [maxRowsPerSheet, setMax] = useState(initial.maxRowsPerSheet?.toString() ?? '')
  const [minFillRows, setMin] = useState(initial.minFillRows?.toString() ?? '')
  const [errors, setErrors] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors([])
    setSaved(false)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxRowsPerSheet, minFillRows }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Save failed'])
      return
    }
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl p-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-[#c8d8e8]">Settings</h1>
        <p className="text-xs text-[#5a8ab8] mt-1">Print register layout</p>
      </div>

      {errors.length > 0 && (
        <div className="bg-[#2a1010] border border-[#5a2020] rounded p-3 text-xs text-[#f07070] space-y-1">
          {errors.map((er, i) => <p key={i}>{er}</p>)}
        </div>
      )}
      {saved && <p className="text-xs text-[#5fd38a]">Saved.</p>}

      <label className="block">
        <span className="block text-xs text-[#5a8ab8] mb-1">Max employees per sheet</span>
        <input
          type="number"
          aria-label="Max employees per sheet"
          value={maxRowsPerSheet}
          onChange={(e) => { setSaved(false); setMax(e.target.value) }}
          placeholder="Default 20"
          className={inputClass}
        />
        <span className={hintClass}>
          Leave blank for the default (20). Values above the per-sheet ceiling
          ({ceilings.landscape} landscape / {ceilings.portrait} portrait) are capped
          so each sheet keeps its own header.
        </span>
      </label>

      <label className="block">
        <span className="block text-xs text-[#5a8ab8] mb-1">Min fill rows</span>
        <input
          type="number"
          aria-label="Min fill rows"
          value={minFillRows}
          onChange={(e) => { setSaved(false); setMin(e.target.value) }}
          placeholder="Default 5"
          className={inputClass}
        />
        <span className={hintClass}>
          Below this many employees, rows stretch to fill the whole page. Blank uses the default (5).
        </span>
      </label>

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
