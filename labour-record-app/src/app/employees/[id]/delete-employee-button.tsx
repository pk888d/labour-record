'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteEmployeeButton({ employeeId, name }: { employeeId: string; name: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function remove() {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return
    setBusy(true); setMsg(null)
    const res = await fetch(`/api/employees/${employeeId}?mode=remove`, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) { router.push('/employees'); router.refresh(); return }
    const data = (await res.json().catch(() => ({}))) as { error?: string; canSoftDelete?: boolean }
    setMsg(data.error ?? 'Delete failed')
  }

  async function markExited() {
    setBusy(true); setMsg(null)
    const res = await fetch(`/api/employees/${employeeId}`, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) { router.push('/employees'); router.refresh(); return }
    setMsg('Could not mark exited')
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={remove} disabled={busy}
        className="px-4 py-1.5 bg-[#3a1414] border border-[#5a2020] text-[#f07070] text-xs rounded hover:bg-[#4a1a1a] disabled:opacity-50">
        Delete employee
      </button>
      {msg && (
        <div className="text-xs text-[#f0a070] space-y-1">
          <p>{msg}</p>
          <button type="button" onClick={markExited} disabled={busy}
            className="px-3 py-1 border border-[#2a3a50] text-[#c0a040] rounded hover:border-[#4a6a8a]">
            Mark Exited instead
          </button>
        </div>
      )}
    </div>
  )
}
