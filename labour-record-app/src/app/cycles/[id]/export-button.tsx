'use client'
import { useState } from 'react'

export function ExportButton({ formTaskId }: { formTaskId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleExport() {
    setState('loading')
    setMsg('')
    const res = await fetch(`/api/form-tasks/${formTaskId}/export`, { method: 'POST' })
    const data = await res.json() as { fileName?: string; warnings?: string[]; error?: string }
    if (res.ok) {
      setState('done')
      setMsg(data.warnings?.length ? `Exported (warnings: ${data.warnings.join('; ')})` : `Exported: ${data.fileName}`)
    } else {
      setState('error')
      setMsg(data.error ?? 'Export failed')
    }
  }

  return (
    <span>
      <button
        onClick={handleExport}
        disabled={state === 'loading'}
        className="text-[10px] px-2 py-0.5 bg-[#1a3a1a] border border-[#2a5a2a] text-[#5adf5a] rounded hover:bg-[#1f4a1f] disabled:opacity-50"
      >
        {state === 'loading' ? 'Exporting…' : 'Export DOCX/PDF'}
      </button>
      {msg && (
        <span className={`ml-2 text-[10px] ${state === 'error' ? 'text-[#f07070]' : 'text-[#5a8ab8]'}`}>
          {msg}
        </span>
      )}
    </span>
  )
}
