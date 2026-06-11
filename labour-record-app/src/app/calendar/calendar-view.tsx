'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CalEvent, CalEventType } from '@/lib/calendar/events'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TYPE_COLOR: Record<CalEventType, string> = {
  holiday: 'var(--ts-maroon, #b3424a)',
  cycle: 'var(--ts-gold)',
  task: 'var(--ts-blue)',
  'employee-join': 'var(--ts-green)',
  'employee-exit': 'var(--ts-text-muted)',
  custom: '#8b7bd8',
}
const TYPE_LABEL: Record<CalEventType, string> = {
  holiday: 'Holiday', cycle: 'Wage cycle', task: 'Form due', 'employee-join': 'Joined', 'employee-exit': 'Exit', custom: 'Event',
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

type Est = { id: string; name: string }

export function CalendarView({ year, month, events, establishments }: {
  year: number; month: number; events: CalEvent[]; establishments: Est[]
}) {
  const router = useRouter()
  const [addFor, setAddFor] = useState<string | null>(null) // date for which the add-modal is open

  const todayIso = iso(new Date())
  const byDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>()
    for (const e of events) (map.get(e.date) ?? map.set(e.date, []).get(e.date)!).push(e)
    return map
  }, [events])

  // Build the 6-row week grid
  const monthStart = new Date(year, month - 1, 1)
  const gridStart = new Date(monthStart); gridStart.setDate(1 - monthStart.getDay())
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d
  })
  // trim to whole weeks that actually touch the month (5 or 6 rows)
  const rows = cells[35].getMonth() === month - 1 ? 6 : 5
  const visibleCells = cells.slice(0, rows * 7)

  const go = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1)
    router.push(`/calendar?month=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => go(-1)} aria-label="Previous month"
            className="w-8 h-8 rounded-lg border border-[var(--ts-border)] text-[var(--ts-text-secondary)] hover:text-[var(--ts-gold)] hover:border-[var(--ts-gold)]">‹</button>
          <h2 className="text-lg font-semibold text-[var(--ts-text-primary)] min-w-[180px] text-center" style={{ fontFamily: 'var(--font-heading)' }}>
            {MONTHS[month - 1]} {year}
          </h2>
          <button onClick={() => go(1)} aria-label="Next month"
            className="w-8 h-8 rounded-lg border border-[var(--ts-border)] text-[var(--ts-text-secondary)] hover:text-[var(--ts-gold)] hover:border-[var(--ts-gold)]">›</button>
          <button onClick={() => { const n = new Date(); router.push(`/calendar?month=${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`) }}
            className="ml-2 px-3 h-8 rounded-lg border border-[var(--ts-border)] text-xs text-[var(--ts-text-secondary)] hover:text-[var(--ts-gold)] hover:border-[var(--ts-gold)]">Today</button>
        </div>
        <button onClick={() => setAddFor(todayIso)}
          className="px-4 h-9 rounded-lg bg-[var(--ts-gold)] text-[var(--ts-navy)] text-sm font-semibold hover:bg-[var(--ts-gold-light)]">+ Add Event</button>
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-[var(--ts-text-muted)]">
        {(Object.keys(TYPE_LABEL) as CalEventType[]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: TYPE_COLOR[t] }} /> {TYPE_LABEL[t]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-[var(--ts-border)] border border-[var(--ts-border)] rounded-lg overflow-hidden">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-[var(--ts-navy-mid)] py-1.5 text-center text-[11px] font-medium text-[var(--ts-text-muted)]">{w}</div>
        ))}
        {visibleCells.map((d) => {
          const ds = iso(d)
          const inMonth = d.getMonth() === month - 1
          const isToday = ds === todayIso
          const dayEvents = byDate.get(ds) ?? []
          return (
            <div key={ds}
              className="bg-[var(--ts-navy)] min-h-[96px] p-1 group cursor-pointer hover:bg-[var(--ts-navy-mid)]"
              style={{ opacity: inMonth ? 1 : 0.4 }}
              onClick={() => setAddFor(ds)}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] ${isToday ? 'bg-[var(--ts-gold)] text-[var(--ts-navy)] rounded-full w-5 h-5 inline-flex items-center justify-center font-bold' : 'text-[var(--ts-text-secondary)]'}`}>
                  {d.getDate()}
                </span>
                <span className="opacity-0 group-hover:opacity-100 text-[var(--ts-text-muted)] text-xs">+</span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <div key={e.id} title={e.title}
                    className="text-[10px] leading-tight truncate px-1 py-0.5 rounded"
                    style={{ background: TYPE_COLOR[e.type], color: e.type === 'cycle' ? 'var(--ts-navy)' : '#fff' }}>
                    {e.time ? `${e.time} ` : ''}{e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-[var(--ts-text-muted)] px-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {addFor && (
        <AddEventModal date={addFor} establishments={establishments}
          onClose={() => setAddFor(null)}
          onSaved={() => { setAddFor(null); router.refresh() }} />
      )}
    </div>
  )
}

function AddEventModal({ date, establishments, onClose, onSaved }: {
  date: string; establishments: Est[]; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({ title: '', date, time: '', type: 'custom', establishmentId: '', recurring: 'none', remindDaysBefore: '', notes: '' })
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const input = 'w-full px-2 py-1.5 rounded bg-[var(--ts-navy)] border border-[var(--ts-border)] text-sm text-[var(--ts-text-primary)]'

  async function save() {
    setErrors([]); setSaving(true)
    const res = await fetch('/api/calendar-events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title, date: form.date, time: form.time || undefined, type: form.type,
        establishmentId: form.establishmentId || undefined, recurring: form.recurring,
        remindDaysBefore: form.remindDaysBefore ? Number(form.remindDaysBefore) : undefined,
        notes: form.notes || undefined,
      }),
    })
    setSaving(false)
    if (res.ok) onSaved()
    else { const d = await res.json(); setErrors(d.errors ?? [d.error ?? 'Failed to save']) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-[var(--ts-navy-mid)] border border-[var(--ts-border)] p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-[var(--ts-gold)]" style={{ fontFamily: 'var(--font-heading)' }}>Add Calendar Event</h3>
        {errors.length > 0 && <div className="text-xs text-[#f07070]">{errors.join(' · ')}</div>}
        <div>
          <label className="text-[11px] text-[var(--ts-text-muted)]">Title *</label>
          <input aria-label="Event Title" className={input} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. ESI payment due" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-[var(--ts-text-muted)]">Date *</label>
            <input aria-label="Event Date" type="date" className={input} value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] text-[var(--ts-text-muted)]">Time</label>
            <input aria-label="Event Time" type="time" className={input} value={form.time} onChange={(e) => set('time', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-[var(--ts-text-muted)]">Recurring</label>
            <select aria-label="Recurring" className={input} value={form.recurring} onChange={(e) => set('recurring', e.target.value)}>
              <option value="none">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[var(--ts-text-muted)]">Remind days before</label>
            <input aria-label="Remind Days Before" type="number" min="0" className={input} value={form.remindDaysBefore} onChange={(e) => set('remindDaysBefore', e.target.value)} placeholder="14" />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-[var(--ts-text-muted)]">Establishment (optional)</label>
          <select aria-label="Establishment" className={input} value={form.establishmentId} onChange={(e) => set('establishmentId', e.target.value)}>
            <option value="">— None —</option>
            {establishments.map((es) => <option key={es.id} value={es.id}>{es.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-[var(--ts-text-muted)]">Notes</label>
          <input aria-label="Notes" className={input} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-3 py-1.5 rounded text-sm text-[var(--ts-text-secondary)] hover:text-[var(--ts-text-primary)]">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded bg-[var(--ts-gold)] text-[var(--ts-navy)] text-sm font-semibold disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Event'}
          </button>
        </div>
      </div>
    </div>
  )
}
