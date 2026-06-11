import { PageHeader } from '@/components/page-header'
import { prisma } from '@/lib/prisma'
import { loadCalendarEvents } from '@/lib/calendar/load'
import { CalendarView } from './calendar-view'

export const dynamic = 'force-dynamic'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams
  const now = new Date()
  const [y, m] = month && /^\d{4}-\d{1,2}$/.test(month)
    ? month.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1]

  const monthStart = new Date(y, m - 1, 1)
  const monthEnd = new Date(y, m, 0)
  // Calendar grid spans full weeks (Sun–Sat) around the month.
  const gridStart = new Date(monthStart); gridStart.setDate(1 - monthStart.getDay())
  const gridEnd = new Date(monthEnd); gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()))

  const [events, establishments] = await Promise.all([
    loadCalendarEvents(gridStart, gridEnd),
    prisma.establishment.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Holidays, wage-cycle deadlines, form due-dates, employee milestones & your own events" />
      <div className="p-6">
        <CalendarView year={y} month={m} events={events} establishments={establishments} />
      </div>
    </div>
  )
}
