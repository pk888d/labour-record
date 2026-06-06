'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  establishmentId: string
  name: string
}

export function DeleteEstablishmentButton({ establishmentId, name }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    const res = await fetch(`/api/establishments/${establishmentId}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Delete failed')
      setConfirming(false)
    }
  }

  if (error) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-[#f07070]">{error}</span>
        <button onClick={() => setError('')} className="text-xs text-[#7a9ab8] hover:underline">
          OK
        </button>
      </span>
    )
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-[#f07070]">Delete &ldquo;{name}&rdquo;?</span>
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
