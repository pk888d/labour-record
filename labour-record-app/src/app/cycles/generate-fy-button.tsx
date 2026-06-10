'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Est = { id: string; name: string }

export function GenerateFyButton({ establishments }: { establishments: Est[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [estId, setEstId] = useState(establishments[0]?.id ?? '')
  const currentFyStart = new Date().getMonth() + 1 >= 4
    ? new Date().getFullYear()
    : new Date().getFullYear() - 1
  const [startYear, setStartYear] = useState(String(currentFyStart))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function generate() {
    if (!estId) return
    setBusy(true)
    setMsg('')
    const res = await fetch('/api/cycles/generate-fy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ establishmentId: estId, startYear: parseInt(startYear) }),
    })
    const data = await res.json()
    setBusy(false)
    if (res.ok) {
      setMsg(`FY ${data.financialYear}: ${data.created} created, ${data.skipped} existed`)
      router.refresh()
    } else {
      setMsg(data.error ?? data.errors?.join(', ') ?? 'Failed')
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => currentFyStart - i + 1)
  const inputClass = 'bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]'

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-[#0f2040] text-[#4a9eff] text-xs rounded border border-[#1a3a6a] hover:bg-[#1a3060]">
        Generate Financial Year
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-[#0a1520] border border-[#1e2d3d] rounded p-2">
      <select value={estId} onChange={(e) => setEstId(e.target.value)} className={inputClass}>
        {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <select value={startYear} onChange={(e) => setStartYear(e.target.value)} className={inputClass}>
        {years.map((y) => <option key={y} value={y}>FY {y}–{(y + 1) % 100}</option>)}
      </select>
      <button onClick={generate} disabled={busy}
        className="px-3 py-1 bg-[#1a5adc] text-white text-xs rounded hover:bg-[#2a6aec] disabled:opacity-50">
        {busy ? 'Generating…' : 'Generate 12 cycles'}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-[#4a6a8a] hover:text-[#7a9ab8]">Close</button>
      {msg && <span className="text-[10px] text-[#40c070]">{msg}</span>}
    </div>
  )
}
