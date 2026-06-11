import { describe, it, expect } from 'vitest'
import { getReminders } from '@/lib/calendar/notifications'
import type { CalEvent } from '@/lib/calendar/events'

const today = new Date('2026-01-15T09:00:00')
const ev = (over: Partial<CalEvent> & Pick<CalEvent, 'date'>): CalEvent => ({
  id: 'x', title: 't', type: 'custom', ...over,
})

describe('getReminders', () => {
  it('flags a past-due task that is not done as overdue', () => {
    const { overdue } = getReminders([ev({ id: 'a', date: '2026-01-10', type: 'task', status: 'IN_PROGRESS' })], today)
    expect(overdue.map((e) => e.id)).toEqual(['a'])
  })

  it('does not flag a completed (DONE) task as overdue', () => {
    const { overdue } = getReminders([ev({ id: 'a', date: '2026-01-10', type: 'task', status: 'DONE' })], today)
    expect(overdue).toHaveLength(0)
  })

  it('lists an event within the default window (14 days) as upcoming', () => {
    const { upcoming } = getReminders([ev({ id: 'a', date: '2026-01-20', type: 'holiday' })], today)
    expect(upcoming.map((e) => e.id)).toEqual(['a'])
  })

  it('excludes an event beyond the default window', () => {
    const { upcoming } = getReminders([ev({ id: 'a', date: '2026-03-01', type: 'holiday' })], today)
    expect(upcoming).toHaveLength(0)
  })

  it('honours a custom event remindDaysBefore as its personal window', () => {
    const events = [
      ev({ id: 'far', date: '2026-01-20', type: 'custom', remindDaysBefore: 2 }), // 5 days away, window 2 → no
      ev({ id: 'near', date: '2026-01-16', type: 'custom', remindDaysBefore: 2 }), // 1 day away → yes
    ]
    const { upcoming } = getReminders(events, today)
    expect(upcoming.map((e) => e.id)).toEqual(['near'])
  })

  it('treats an event due today as upcoming', () => {
    const { upcoming } = getReminders([ev({ id: 'a', date: '2026-01-15', type: 'cycle', status: 'OPEN' })], today)
    expect(upcoming.map((e) => e.id)).toEqual(['a'])
  })

  it('reports a total count of overdue + upcoming', () => {
    const events = [
      ev({ id: 'o', date: '2026-01-05', type: 'task', status: 'NOT_STARTED' }),
      ev({ id: 'u', date: '2026-01-18', type: 'holiday' }),
    ]
    const { count } = getReminders(events, today)
    expect(count).toBe(2)
  })
})
