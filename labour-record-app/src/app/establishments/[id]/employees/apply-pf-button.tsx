'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { pluralize } from '@/lib/utils'
import { apiPath } from '@/lib/api-path'
import { readApiError } from '@/lib/read-api-error'

export function ApplyPfButton({ establishmentId }: { establishmentId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'PERCENT' | 'FIXED' | 'NONE'>('PERCENT')
  const [percent, setPercent] = useState('12')
  const [ceiling, setCeiling] = useState('15000')
  const [fixedAmount, setFixedAmount] = useState('1800')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function apply() {
    setBusy(true)
    setMsg('')
    const res = await fetch(apiPath(`/api/establishments/${establishmentId}/apply-pf`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pfMode: mode,
        pfPercent: parseFloat(percent) || 12,
        pfWageCeiling: parseFloat(ceiling) || 15000,
        pfFixedAmount: parseFloat(fixedAmount) || 0,
      }),
    })
    setBusy(false)
    if (res.ok) {
      const data = await res.json() as { updated: number }
      setMsg(`Applied to ${pluralize(data.updated, 'employee')}`)
      router.refresh()
      setTimeout(() => setOpen(false), 1200)
    } else {
      const data = await readApiError(res, 'Failed')
      setMsg(data.error)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-[#0f2040] text-[#4a9eff] text-xs rounded border border-[#1a3a6a] hover:bg-[#1a3060]"
      >
        Apply PF to all
      </button>
    )
  }

  const inputClass = 'w-20 bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]'

  return (
    <div className="flex items-center gap-2 bg-[#0a1520] border border-[#1e2d3d] rounded p-2">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as 'PERCENT' | 'FIXED' | 'NONE')}
        className="bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]"
      >
        <option value="PERCENT">Percent</option>
        <option value="FIXED">Fixed</option>
        <option value="NONE">None</option>
      </select>
      {mode === 'PERCENT' && (
        <>
          <input className={inputClass} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="%" />
          <input className={inputClass} value={ceiling} onChange={(e) => setCeiling(e.target.value)} placeholder="ceiling" />
        </>
      )}
      {mode === 'FIXED' && (
        <input className={inputClass} value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} placeholder="₹" />
      )}
      <button
        onClick={apply}
        disabled={busy}
        className="px-3 py-1 bg-[#1a5adc] text-white text-xs rounded hover:bg-[#2a6aec] disabled:opacity-50"
      >
        {busy ? 'Applying…' : 'Apply'}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-[#4a6a8a] hover:text-[#7a9ab8]">Cancel</button>
      {msg && <span className="text-[10px] text-[#40c070]">{msg}</span>}
    </div>
  )
}
