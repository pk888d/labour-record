import { prisma } from '@/lib/prisma'
import { buildCalendarEvents, type EventSources, type CalEvent } from './events'
import { getReminders, type Reminders } from './notifications'

// Fetch raw rows and shape them for the pure aggregator.
// Custom events are fetched unfiltered so recurring occurrences can be expanded
// into the requested window even when the anchor date is outside it.
async function fetchSources(rangeStart: Date, rangeEnd: Date): Promise<EventSources> {
  const [holidays, cycles, tasks, employees, custom] = await Promise.all([
    prisma.govtHoliday.findMany({ where: { date: { gte: rangeStart, lte: rangeEnd } } }),
    prisma.monthlyCycle.findMany({ include: { establishment: { select: { name: true } } } }),
    prisma.formTask.findMany({
      where: { dueDate: { gte: rangeStart, lte: rangeEnd } },
      include: { cycle: { include: { establishment: { select: { name: true } } } } },
    }),
    prisma.employee.findMany({
      where: { OR: [{ dateOfEntry: { gte: rangeStart, lte: rangeEnd } }, { exitDate: { gte: rangeStart, lte: rangeEnd } }] },
      include: { establishment: { select: { name: true } } },
    }),
    prisma.calendarEvent.findMany({ include: { establishment: { select: { name: true } } } }),
  ])

  return {
    holidays: holidays.map((h) => ({ id: h.id, date: h.date, name: h.name, doubleWage: h.doubleWage })),
    cycles: cycles.map((c) => ({ id: c.id, month: c.month, year: c.year, status: c.status, establishmentName: c.establishment.name, dueDate: null })),
    tasks: tasks.map((t) => ({ id: t.id, formCode: t.formCode, status: t.status, dueDate: t.dueDate, establishmentName: t.cycle.establishment.name, cycleId: t.cycleId })),
    employees: employees.map((e) => ({ id: e.id, name: e.name, dateOfEntry: e.dateOfEntry, exitDate: e.exitDate, establishmentName: e.establishment.name })),
    custom: custom.map((c) => ({ id: c.id, title: c.title, date: c.date, time: c.time, type: c.type, establishmentName: c.establishment?.name ?? null, remindDaysBefore: c.remindDaysBefore, recurring: c.recurring, notes: c.notes })),
  }
}

export async function loadCalendarEvents(rangeStart: Date, rangeEnd: Date): Promise<CalEvent[]> {
  return buildCalendarEvents(await fetchSources(rangeStart, rangeEnd), rangeStart, rangeEnd)
}

export async function loadReminders(today = new Date()): Promise<Reminders> {
  const start = new Date(today); start.setDate(start.getDate() - 60)
  const end = new Date(today); end.setDate(end.getDate() + 45)
  const events = buildCalendarEvents(await fetchSources(start, end), start, end)
  return getReminders(events, today)
}
