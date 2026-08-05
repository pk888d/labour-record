'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { pluralize } from '@/lib/utils'
import { apiPath } from '@/lib/api-path'
import { readApiError } from '@/lib/read-api-error'

export function SyncEmployeesButton({ cycleId }: { cycleId: string }) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSync() {
    setSyncing(true)
    setMessage('')
    const res = await fetch(apiPath(`/api/cycles/${cycleId}/sync-employees`), { method: 'POST' })
    setSyncing(false)
    if (res.ok) {
      const data = await res.json() as { added: number }
      setMessage(data.added === 0 ? 'Already up to date' : `Added ${pluralize(data.added, 'employee')}`)
      if (data.added > 0) router.refresh()
    } else {
      const data = await readApiError(res, 'Sync failed')
      setMessage(data.error)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="text-xs px-2 py-1 bg-[#1a3050] text-[#4a9eff] rounded hover:bg-[#1a4060] disabled:opacity-50"
      >
        {syncing ? 'Syncing…' : 'Sync Employees'}
      </button>
      {message && <span className="text-xs text-[#7a9ab8]">{message}</span>}
    </div>
  )
}
