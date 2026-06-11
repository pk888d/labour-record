import Link from 'next/link'
import type { Reminders } from '@/lib/calendar/notifications'
import type { CalEvent } from '@/lib/calendar/events'

export function RemindersPanel({ reminders }: { reminders: Reminders }) {
  const { overdue, upcoming } = reminders
  return (
    <div className="rounded-lg bg-[var(--ts-navy-mid)] border border-[var(--ts-border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
          Upcoming &amp; Overdue
        </h2>
        <Link href="/calendar" className="text-[11px] text-[var(--ts-gold)] hover:underline">Open calendar →</Link>
      </div>
      {overdue.length === 0 && upcoming.length === 0 ? (
        <p className="text-xs text-[var(--ts-text-muted)] py-2">Nothing due in the next two weeks. You&apos;re all caught up.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Column title={`Overdue (${overdue.length})`} color="#f07070" events={overdue} empty="No overdue items" />
          <Column title={`Upcoming (${upcoming.length})`} color="var(--ts-gold)" events={upcoming} empty="Nothing upcoming" />
        </div>
      )}
    </div>
  )
}

function Column({ title, color, events, empty }: { title: string; color: string; events: CalEvent[]; empty: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color }}>{title}</p>
      {events.length === 0 ? (
        <p className="text-xs text-[var(--ts-text-muted)]">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {events.slice(0, 6).map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-2">
              <Link href="/calendar" className="text-xs text-[var(--ts-text-primary)] truncate hover:text-[var(--ts-gold)]">{e.title}</Link>
              <span className="text-[10px] text-[var(--ts-text-muted)] shrink-0">{e.date}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
