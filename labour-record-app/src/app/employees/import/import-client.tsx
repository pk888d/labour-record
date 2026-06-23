'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Est = { id: string; name: string }
type RowError = { row: number; messages: string[] }

export function ImportClient({ establishments }: { establishments: Est[] }) {
  const router = useRouter()
  const [establishmentId, setEstablishmentId] = useState(establishments[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: RowError[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true); setError(null); setResult(null)
    const fd = new FormData(e.currentTarget)
    fd.set('establishmentId', establishmentId)
    const res = await fetch('/api/employees/import', { method: 'POST', body: fd })
    setBusy(false)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error ?? 'Import failed'); return }
    setResult(data)
    router.refresh()
  }

  const sample =
    'Name,Salary,Emp ID,Sex,Father/Spouse,Designation,Date of Entry,Phone,Bank A/C,IFSC,Payment Mode\n' +
    'Asha,15000,,F,Raman,Nurse,2020-01-01,9000000000,1234567890,HDFC0001,Bank\n'
  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent(sample)}`

  return (
    <form onSubmit={submit} className="max-w-xl p-6 space-y-4">
      <a href={sampleHref} download="employee-import-sample.csv"
        className="text-xs text-[#4a9eff] hover:underline">Download sample CSV</a>

      <label className="block">
        <span className="block text-xs text-[#5a8ab8] mb-1">Establishment</span>
        <select value={establishmentId} onChange={(e) => setEstablishmentId(e.target.value)}
          aria-label="Establishment"
          className="w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8]">
          {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="block text-xs text-[#5a8ab8] mb-1">File (.csv, .txt, .xlsx)</span>
        <input type="file" name="file" accept=".csv,.txt,.xlsx" required
          aria-label="Employee file"
          className="text-xs text-[#c8d8e8]" />
      </label>

      <button type="submit" disabled={busy || !establishmentId}
        className="px-4 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec] disabled:opacity-50">
        {busy ? 'Importing…' : 'Import'}
      </button>

      {error && <p className="text-sm text-[#f07070]">{error}</p>}
      {result && (
        <div className="text-xs space-y-2">
          <p className="text-[#5fd38a]">Imported {result.created} employee{result.created !== 1 ? 's' : ''}.</p>
          {result.errors.length > 0 && (
            <div className="bg-[#2a1010] border border-[#5a2020] rounded p-3 text-[#f0a070] space-y-1">
              <p className="font-semibold">{result.errors.length} row(s) skipped:</p>
              {result.errors.map((er) => <p key={er.row}>Row {er.row}: {er.messages.join(', ')}</p>)}
            </div>
          )}
        </div>
      )}
    </form>
  )
}
