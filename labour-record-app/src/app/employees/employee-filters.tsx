'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Est = { id: string; name: string }

type Props = {
  establishments: Est[]
  initialQ: string
  initialEstablishmentId: string
  initialStatus: string
}

export function EmployeeFilters({ establishments, initialQ, initialEstablishmentId, initialStatus }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState(initialQ)
  const [establishmentId, setEstablishmentId] = useState(initialEstablishmentId)
  const [status, setStatus] = useState(initialStatus)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function push(nextQ: string, nextEst: string, nextStatus: string) {
    const params = new URLSearchParams()
    if (nextQ) params.set('q', nextQ)
    if (nextEst) params.set('establishmentId', nextEst)
    if (nextStatus) params.set('status', nextStatus)
    router.replace(`${pathname}?${params.toString()}`)
  }

  function handleQ(value: string) {
    setQ(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => push(value, establishmentId, status), 300)
  }

  function handleEst(value: string) {
    setEstablishmentId(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    push(q, value, status)
  }

  function handleStatus(value: string) {
    setStatus(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    push(q, establishmentId, value)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const inputClass = 'bg-[#1a2a3a] border border-[#2a3a50] rounded px-2 py-1 text-xs text-[#c8d8e8]'

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={q}
        onChange={(e) => handleQ(e.target.value)}
        placeholder="Search name or ID…"
        aria-label="Search employees"
        className={`${inputClass} w-48`}
      />
      <select
        value={establishmentId}
        onChange={(e) => handleEst(e.target.value)}
        aria-label="Filter by establishment"
        className={inputClass}
      >
        <option value="">All Establishments</option>
        {establishments.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
      <select
        value={status}
        onChange={(e) => handleStatus(e.target.value)}
        aria-label="Filter by status"
        className={inputClass}
      >
        <option value="ACTIVE">Active</option>
        <option value="EXITED">Exited</option>
        <option value="SUSPENDED">Suspended</option>
      </select>
    </div>
  )
}
