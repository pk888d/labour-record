import type { CalEvent } from './events'

const DEFAULT_WINDOW_DAYS = 14
const DONE_STATUSES = new Set(['DONE', 'APPROVED', 'COMPLETED', 'CLOSED', 'GENERATED'])
const DEADLINE_TYPES = new Set(['task', 'cycle'])

export interface Reminders {
  overdue: CalEvent[]
  upcoming: CalEvent[]
  count: number
}

function atMidnight(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function parseDate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

const DAY_MS = 24 * 60 * 60 * 1000

// Split events into overdue deadlines and upcoming reminders relative to `today`.
// - overdue: task/cycle deadlines in the past that aren't in a completed status.
// - upcoming: any event from today up to its reminder window (event.remindDaysBefore
//   if set, otherwise the default 14-day horizon).
export function getReminders(events: CalEvent[], today: Date, defaultWindowDays = DEFAULT_WINDOW_DAYS): Reminders {
  const todayMs = atMidnight(today)
  const overdue: CalEvent[] = []
  const upcoming: CalEvent[] = []

  for (const e of events) {
    const eventMs = parseDate(e.date)
    const daysUntil = Math.round((eventMs - todayMs) / DAY_MS)

    if (daysUntil < 0) {
      if (DEADLINE_TYPES.has(e.type) && !(e.status && DONE_STATUSES.has(e.status))) {
        overdue.push(e)
      }
      continue
    }
    const window = e.remindDaysBefore ?? defaultWindowDays
    if (daysUntil <= window) upcoming.push(e)
  }

  overdue.sort((a, b) => (a.date < b.date ? -1 : 1))
  upcoming.sort((a, b) => (a.date < b.date ? -1 : 1))
  return { overdue, upcoming, count: overdue.length + upcoming.length }
}
