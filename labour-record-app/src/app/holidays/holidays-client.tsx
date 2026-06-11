'use client'
import { useState } from 'react'
import { Info } from '@/components/info-tooltip'

type Holiday = { id: string; date: string; name: string; year: number; doubleWage?: boolean }

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function HolidaysClient({
  initialHolidays,
  initialYear,
}: {
  initialHolidays: Holiday[]
  initialYear: number
}) {
  const [year, setYear] = useState(initialYear)
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays)
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  async function loadYear(y: number) {
    const res = await fetch(`/api/holidays?year=${y}`)
    const data = await res.json() as Holiday[]
    setHolidays(data)
    setYear(y)
  }

  async function addHoliday() {
    if (!date) { setErrors(['Please select a date']); return }
    if (!name.trim()) { setErrors(['Holiday name is required']); return }
    if (name.trim().length < 3) { setErrors(['Holiday name must be at least 3 characters']); return }
    const selectedDate = new Date(date)
    const y = selectedDate.getFullYear()
    if (y < 2000 || y > 9999) {
      setErrors([`Date seems unusual. Year must be between 2000 and 9999 (got ${y}).`])
      return
    }

    setSaving(true)
    setErrors([])
    const res = await fetch('/api/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, name: name.trim() }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { errors?: string[]; error?: string }
      setErrors(data.errors ?? [data.error ?? 'Failed to add holiday'])
      return
    }
    const created = await res.json() as Holiday
    if (created.year === year) {
      setHolidays((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)))
    } else {
      await loadYear(created.year)
    }
    setDate('')
    setName('')
  }

  async function loadDefaults() {
    setSaving(true)
    setErrors([])
    const res = await fetch('/api/holidays/seed-defaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      setErrors([data.error ?? 'Failed to load defaults'])
      return
    }
    await loadYear(year)
  }

  async function deleteHoliday(id: string) {
    setSaving(true)
    setErrors([])
    const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      setErrors([data.error ?? 'Delete failed'])
      return
    }
    setHolidays((prev) => prev.filter((h) => h.id !== id))
  }

  const currentYear = new Date().getFullYear()
  const defaultYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
  const yearOptions = defaultYears.includes(year) ? defaultYears : [...defaultYears, year].sort((a, b) => a - b)

  return (
    <div>
      {/* Header bar */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#1e2d3d]">
        <div>
          <p className="text-xs text-[#5a8ab8]">Masters › Holidays</p>
          <h1 className="text-lg font-semibold text-white mt-0.5">Government Holidays</h1>
          <p className="text-[11px] text-[#4a6a8a] mt-0.5">{holidays.length} holidays in {year}</p>
          <p className="text-[10px] text-[#4a6a8a] mt-1 max-w-lg">
            Government holidays are automatically marked as H (paid) in attendance. Employees who work on a holiday (marked P) earn double wages per the HOLIDAY_MULTIPLIER wage rule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDefaults}
            disabled={saving}
            className="px-3 py-1.5 bg-[#0f2040] text-[#4a9eff] text-xs rounded border border-[#1a3a6a] hover:bg-[#1a3060] disabled:opacity-50 whitespace-nowrap"
            title="Populate the standard double-wage holidays for this year"
          >
            Load default holidays
          </button>
          <select
            value={year}
            onChange={(e) => loadYear(parseInt(e.target.value, 10))}
            className="bg-[#0f1923] border border-[#2a3a50] text-[#c8d8e8] text-xs px-3 py-1.5 rounded"
            aria-label="Year"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add form */}
      <div className="px-6 py-4 bg-[#0a1520] border-b border-[#1e2d3d]">
        <p className="text-[10px] text-[#5a8ab8] uppercase tracking-wider mb-2">Add Holiday</p>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-[10px] text-[#5a8ab8] mb-1" htmlFor="holiday-date">
              Date *
              <Info text="Select the official government holiday date. Attendance on this day auto-fills as H (paid). If an employee works on this day (marked P), they earn double wages." />
            </label>
            <input
              id="holiday-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Date"
              className="bg-[#0f1923] border border-[#2a3a50] text-[#c8d8e8] text-xs px-2 py-1.5 rounded w-40"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] text-[#5a8ab8] mb-1" htmlFor="holiday-name">
              Holiday Name *
              <Info text="Official name as notified by government. e.g. Pongal, Republic Day, Christmas" />
            </label>
            <input
              id="holiday-name"
              type="text"
              placeholder="e.g. Republic Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHoliday()}
              aria-label="Holiday Name"
              className="w-full bg-[#0f1923] border border-[#2a3a50] text-[#c8d8e8] text-xs px-2 py-1.5 rounded"
            />
          </div>
          <button
            onClick={addHoliday}
            disabled={saving}
            className="px-4 py-1.5 bg-[#1a3a1a] border border-[#2a5a2a] text-[#40c070] text-xs font-medium rounded hover:bg-[#223a22] disabled:opacity-50 whitespace-nowrap"
          >
            + Add Holiday
          </button>
        </div>
        {errors.length > 0 && (
          <div className="mt-2 text-xs text-[#f07070]">
            {errors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {holidays.length === 0 ? (
          <p className="text-sm text-[#4a6a8a]">No holidays for {year}. Add one above.</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d3d]">
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">#</th>
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">Date</th>
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">Day</th>
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">Holiday Name</th>
                <th className="text-left py-2 px-2 text-[#5a8ab8] font-medium">Double Wage</th>
                <th className="text-right py-2 px-2 text-[#5a8ab8] font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h, i) => {
                const d = new Date(h.date)
                return (
                  <tr key={h.id} className="border-b border-[#1a2332] hover:bg-[#111d2d]">
                    <td className="py-2 px-2 text-[#5a8ab8]">{i + 1}</td>
                    <td className="py-2 px-2 text-[#c8d8e8]">{formatDate(h.date)}</td>
                    <td className="py-2 px-2 text-[#7a9ab8]">{DAY_NAMES[d.getDay()]}</td>
                    <td className="py-2 px-2 text-white font-medium">{h.name}</td>
                    <td className="py-2 px-2">
                      {h.doubleWage !== false ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#0f2a1a] text-[#40c070]">2× Double</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a2332] text-[#7a9ab8]">Normal</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => deleteHoliday(h.id)}
                        disabled={saving}
                        className="text-[10px] px-2 py-0.5 border border-[#3a2020] text-[#f07070] rounded hover:bg-[#2a1010] disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
