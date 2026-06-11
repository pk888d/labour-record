'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import type { CalEvent } from '@/lib/calendar/events'

type Reminders = { overdue: CalEvent[]; upcoming: CalEvent[]; count: number }

export function NotificationBell() {
  const [data, setData] = useState<Reminders | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    const load = () => fetch('/api/notifications').then((r) => r.json()).then((d) => { if (active) setData(d) }).catch(() => {})
    load()
    const t = setInterval(load, 60000) // refresh every minute
    return () => { active = false; clearInterval(t) }
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const count = data?.count ?? 0

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications"
        className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--ts-border)] text-[var(--ts-text-secondary)] hover:text-[var(--ts-gold)] hover:border-[var(--ts-gold)] transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span data-testid="notif-count" className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#b3424a] text-white text-[10px] font-bold flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-auto rounded-xl bg-[var(--ts-navy-mid)] border border-[var(--ts-border)] shadow-xl z-50 p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-semibold text-[var(--ts-text-primary)]">Notifications</span>
            <Link href="/calendar" onClick={() => setOpen(false)} className="text-[11px] text-[var(--ts-gold)] hover:underline">Open calendar</Link>
          </div>
          {!data || count === 0 ? (
            <p className="px-2 py-4 text-xs text-[var(--ts-text-muted)] text-center">You&apos;re all caught up 🎉</p>
          ) : (
            <>
              {data.overdue.length > 0 && (
                <Section title={`Overdue (${data.overdue.length})`} color="#f07070" events={data.overdue} />
              )}
              {data.upcoming.length > 0 && (
                <Section title={`Upcoming (${data.upcoming.length})`} color="var(--ts-gold)" events={data.upcoming} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, color, events }: { title: string; color: string; events: CalEvent[] }) {
  return (
    <div className="mt-1">
      <p className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider" style={{ color }}>{title}</p>
      {events.slice(0, 10).map((e) => (
        <Link key={e.id} href="/calendar" className="block px-2 py-1.5 rounded hover:bg-[var(--ts-navy-light)]">
          <p className="text-xs text-[var(--ts-text-primary)] truncate">{e.title}</p>
          <p className="text-[10px] text-[var(--ts-text-muted)]">{e.date}{e.time ? ` · ${e.time}` : ''}</p>
        </Link>
      ))}
    </div>
  )
}
