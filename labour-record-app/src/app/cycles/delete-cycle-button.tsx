'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  cycleId: string
  label: string
}

export function DeleteCycleButton({ cycleId, label }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/cycles/${cycleId}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error ?? 'Delete failed')
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-[#f07070]">Delete {label}?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-[#f07070] hover:underline disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-[#7a9ab8] hover:underline"
        >
          No
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-[#5a3a3a] hover:text-[#f07070]"
    >
      Delete
    </button>
  )
}
