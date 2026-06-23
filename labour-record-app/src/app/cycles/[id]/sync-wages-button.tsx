'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SyncWagesButton({ cycleId }: { cycleId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function sync() {
    if (!confirm('Re-pull wages from each employee’s saved salary? Manually-entered fines/advances are kept.')) return
    setBusy(true); setMsg(null)
    const res = await fetch(`/api/cycles/${cycleId}/sync-wages`, { method: 'POST' })
    setBusy(false)
    if (res.ok) {
      const data = (await res.json()) as { synced: number }
      setMsg(`Synced ${data.synced} employee${data.synced !== 1 ? 's' : ''}.`)
      router.refresh()
    } else {
      setMsg('Sync failed')
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={sync} disabled={busy}
        className="px-3 py-1 bg-[#1a3050] text-[#4a9eff] text-xs rounded hover:bg-[#1a4060] disabled:opacity-50">
        {busy ? 'Syncing…' : '↻ Sync wages from employees'}
      </button>
      {msg && <span className="text-xs text-[#5fd38a]">{msg}</span>}
    </span>
  )
}
