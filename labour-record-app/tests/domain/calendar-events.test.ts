import { describe, it, expect } from 'vitest'
import { buildCalendarEvents, type EventSources } from '@/lib/calendar/events'

const d = (s: string) => new Date(s + 'T00:00:00')
const base: EventSources = { holidays: [], cycles: [], tasks: [], employees: [], custom: [] }

describe('buildCalendarEvents', () => {
  it('includes a government holiday within range as a holiday event', () => {
    const events = buildCalendarEvents(
      { ...base, holidays: [{ id: 'h1', date: d('2026-01-26'), name: 'Republic Day', doubleWage: true }] },
      d('2026-01-01'), d('2026-01-31'),
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ date: '2026-01-26', title: 'Republic Day', type: 'holiday' })
  })

  it('excludes events outside the requested range', () => {
    const events = buildCalendarEvents(
      { ...base, holidays: [{ id: 'h1', date: d('2026-03-01'), name: 'X', doubleWage: false }] },
      d('2026-01-01'), d('2026-01-31'),
    )
    expect(events).toHaveLength(0)
  })

  it('maps a form task with a due date to a task event carrying its status', () => {
    const events = buildCalendarEvents(
      { ...base, tasks: [{ id: 't1', formCode: 'HOSPITAL_FORM_XII', status: 'IN_PROGRESS', dueDate: d('2026-01-07'), establishmentName: 'DNV', cycleId: 'c1' }] },
      d('2026-01-01'), d('2026-01-31'),
    )
    expect(events[0]).toMatchObject({ type: 'task', status: 'IN_PROGRESS', date: '2026-01-07' })
    expect(events[0].title).toContain('XII')
  })

  it('emits employee join and exit events on their dates', () => {
    const events = buildCalendarEvents(
      { ...base, employees: [{ id: 'e1', name: 'Asha', dateOfEntry: d('2026-01-10'), exitDate: d('2026-01-20'), establishmentName: 'DNV' }] },
      d('2026-01-01'), d('2026-01-31'),
    )
    expect(events.map((e) => e.type).sort()).toEqual(['employee-exit', 'employee-join'])
  })

  it('expands a monthly recurring custom event into each month in range', () => {
    const events = buildCalendarEvents(
      { ...base, custom: [{ id: 'cu1', title: 'Rent', date: d('2026-01-05'), time: null, type: 'reminder', establishmentName: null, remindDaysBefore: 2, recurring: 'monthly', notes: null }] },
      d('2026-01-01'), d('2026-03-31'),
    )
    expect(events.map((e) => e.date)).toEqual(['2026-01-05', '2026-02-05', '2026-03-05'])
  })

  it('places a wage cycle as a deadline event (7th of the following month) titled with the firm', () => {
    const events = buildCalendarEvents(
      { ...base, cycles: [{ id: 'c1', month: 1, year: 2026, status: 'OPEN', establishmentName: 'DNV', dueDate: null }] },
      d('2026-01-01'), d('2026-02-28'),
    )
    const cycleEvent = events.find((e) => e.type === 'cycle')
    expect(cycleEvent).toBeTruthy()
    expect(cycleEvent!.date).toBe('2026-02-07')
    expect(cycleEvent!.title).toContain('DNV')
  })

  it('returns events sorted by date ascending', () => {
    const events = buildCalendarEvents(
      {
        ...base,
        holidays: [{ id: 'h1', date: d('2026-01-26'), name: 'RD', doubleWage: true }],
        custom: [{ id: 'cu1', title: 'A', date: d('2026-01-03'), time: null, type: 'custom', establishmentName: null, remindDaysBefore: null, recurring: 'none', notes: null }],
      },
      d('2026-01-01'), d('2026-01-31'),
    )
    expect(events.map((e) => e.date)).toEqual(['2026-01-03', '2026-01-26'])
  })
})
