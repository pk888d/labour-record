'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Est = { id: string; name: string }
type RowError = { row: number; messages: string[] }
type Result = { added: number; updated: number; deleted: number; exited: number; errors: RowError[] }

export function ImportClient({ establishments }: { establishments: Est[] }) {
  const router = useRouter()
  const [establishmentId, setEstablishmentId] = useState(establishments[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
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

  const inputClass = 'w-full bg-[#1a2a3a] border border-[#2a3a50] rounded px-3 py-1.5 text-sm text-[#c8d8e8]'

  return (
    <div className="max-w-xl p-6 space-y-6">

      {/* Template download */}
      <div className="rounded border border-[#1e2d3d] bg-[#0f1923] p-4 space-y-2">
        <p className="text-xs font-semibold text-[#c8d8e8] uppercase tracking-wide">Step 1 — Download Template</p>
        <p className="text-xs text-[#5a8ab8]">
          Fill the <strong className="text-[#c8d8e8]">Action</strong> column with{' '}
          <span className="text-[#40c070]">ADD</span>,{' '}
          <span className="text-[#4a9eff]">UPDATE</span>, or{' '}
          <span className="text-[#f07070]">DELETE</span> for each row.
          Emp ID is required for UPDATE and DELETE; auto-generated for ADD.
        </p>
        <a
          href="/api/employees/import/template"
          download="employee-import-template.xlsx"
          className="inline-block px-4 py-1.5 bg-[#1a3050] text-[#4a9eff] text-xs font-medium rounded hover:bg-[#1a4060] border border-[#2a4060]"
        >
          ↓ Download Template (.xlsx)
        </a>

        <table className="w-full text-[10px] mt-2 border-collapse">
          <thead>
            <tr className="border-b border-[#1e2d3d]">
              <th className="text-left py-1 px-2 text-[#5a8ab8]">Action</th>
              <th className="text-left py-1 px-2 text-[#5a8ab8]">Emp ID</th>
              <th className="text-left py-1 px-2 text-[#5a8ab8]">Name</th>
              <th className="text-left py-1 px-2 text-[#5a8ab8]">Salary</th>
              <th className="text-left py-1 px-2 text-[#5a8ab8]">What happens</th>
            </tr>
          </thead>
          <tbody className="text-[#7a9ab8]">
            <tr>
              <td className="py-1 px-2 text-[#40c070] font-mono">ADD</td>
              <td className="py-1 px-2">optional</td>
              <td className="py-1 px-2 text-[#f0f0f0]">required</td>
              <td className="py-1 px-2 text-[#f0f0f0]">required</td>
              <td className="py-1 px-2">Creates a new employee</td>
            </tr>
            <tr>
              <td className="py-1 px-2 text-[#4a9eff] font-mono">UPDATE</td>
              <td className="py-1 px-2 text-[#f0f0f0]">required</td>
              <td className="py-1 px-2">optional</td>
              <td className="py-1 px-2">optional</td>
              <td className="py-1 px-2">Updates non-blank fields only</td>
            </tr>
            <tr>
              <td className="py-1 px-2 text-[#f07070] font-mono">DELETE</td>
              <td className="py-1 px-2 text-[#f0f0f0]">required</td>
              <td className="py-1 px-2">—</td>
              <td className="py-1 px-2">—</td>
              <td className="py-1 px-2">Deletes if no cycle records; else marks Exited</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Upload form */}
      <form onSubmit={submit} className="space-y-4">
        <p className="text-xs font-semibold text-[#c8d8e8] uppercase tracking-wide">Step 2 — Upload File</p>

        <label className="block">
          <span className="block text-xs text-[#5a8ab8] mb-1">Establishment</span>
          <select value={establishmentId} onChange={(e) => setEstablishmentId(e.target.value)}
            aria-label="Establishment"
            className={inputClass}>
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
          {busy ? 'Processing…' : 'Upload & Apply'}
        </button>
      </form>

      {error && (
        <div className="rounded border border-[#5a2020] bg-[#2a1010] p-3 text-xs text-[#f07070]">{error}</div>
      )}

      {result && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#c8d8e8] uppercase tracking-wide">Result</p>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded bg-[#0f2a1a] border border-[#1a4a2a] p-2">
              <div className="text-xl font-bold text-[#40c070]">{result.added}</div>
              <div className="text-[#5a8ab8] mt-0.5">Added</div>
            </div>
            <div className="rounded bg-[#0f1f3a] border border-[#1a3a5a] p-2">
              <div className="text-xl font-bold text-[#4a9eff]">{result.updated}</div>
              <div className="text-[#5a8ab8] mt-0.5">Updated</div>
            </div>
            <div className="rounded bg-[#2a1010] border border-[#5a2020] p-2">
              <div className="text-xl font-bold text-[#f07070]">{result.deleted}</div>
              <div className="text-[#5a8ab8] mt-0.5">Deleted</div>
            </div>
            <div className="rounded bg-[#2a2010] border border-[#5a4010] p-2">
              <div className="text-xl font-bold text-[#c0a040]">{result.exited}</div>
              <div className="text-[#5a8ab8] mt-0.5">Exited</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded border border-[#5a2020] bg-[#2a1010] p-3 text-xs text-[#f0a070] space-y-1">
              <p className="font-semibold text-[#f07070]">{result.errors.length} row(s) skipped:</p>
              {result.errors.map((er, i) => (
                <p key={i}>{er.row > 0 ? `Row ${er.row}: ` : ''}{er.messages.join(', ')}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
