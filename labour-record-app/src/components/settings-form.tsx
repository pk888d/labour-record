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
        <h1 className="text-lg font-bold">Settings</h1>
        <p className="text-xs text-gray-500 mt-1">Print register layout</p>
      </div>

      {errors.length > 0 && (
        <ul className="text-sm text-red-600 list-disc pl-5">
          {errors.map((er, i) => <li key={i}>{er}</li>)}
        </ul>
      )}
      {saved && <p className="text-sm text-green-700">Saved.</p>}

      <label className="block">
        <span className="text-sm font-medium">Max employees per sheet</span>
        <input
          type="number"
          min={1}
          aria-label="Max employees per sheet"
          value={maxRowsPerSheet}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Default 20"
          className="mt-1 block w-40 border rounded px-2 py-1"
        />
        <span className="block text-xs text-gray-500 mt-1">
          Leave blank for the default (20). Values above the per-sheet ceiling
          ({ceilings.landscape} landscape / {ceilings.portrait} portrait) are capped
          so each sheet keeps its own header.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Min fill rows</span>
        <input
          type="number"
          min={1}
          aria-label="Min fill rows"
          value={minFillRows}
          onChange={(e) => setMin(e.target.value)}
          placeholder="Default 5"
          className="mt-1 block w-40 border rounded px-2 py-1"
        />
        <span className="block text-xs text-gray-500 mt-1">
          Below this many employees, rows stretch to fill the whole page. Blank uses the default (5).
        </span>
      </label>

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded bg-[var(--ts-navy-mid)] text-white text-sm disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
