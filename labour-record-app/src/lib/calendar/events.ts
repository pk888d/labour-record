// Pure calendar-event aggregation. Takes already-shaped source rows (no Prisma
// here, so it stays trivially testable) and returns a unified, range-filtered,
// date-sorted list of events for the calendar + reminders.

export type CalEventType = 'holiday' | 'cycle' | 'task' | 'employee-join' | 'employee-exit' | 'custom'

export interface CalEvent {
  id: string
  date: string // YYYY-MM-DD
  time?: string | null
  title: string
  type: CalEventType
  establishmentName?: string | null
  status?: string | null
  remindDaysBefore?: number | null
  notes?: string | null
}

export interface EventSources {
  holidays: { id: string; date: Date; name: string; doubleWage: boolean }[]
  cycles: { id: string; month: number; year: number; status: string; establishmentName: string; dueDate?: Date | null }[]
  tasks: { id: string; formCode: string; status: string; dueDate: Date | null; establishmentName: string; cycleId: string }[]
  employees: { id: string; name: string; dateOfEntry: Date; exitDate: Date | null; establishmentName: string }[]
  custom: {
    id: string; title: string; date: Date; time: string | null; type: string
    establishmentName: string | null; remindDaysBefore: number | null; recurring: string | null; notes: string | null
  }[]
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function iso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function inRange(date: Date, start: Date, end: Date): boolean {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime()
}

// Short, human label for a statutory form code (e.g. HOSPITAL_FORM_XII -> "Form XII")
function formLabel(formCode: string): string {
  const part = formCode.replace(/^(HOSPITAL|SHOP)_FORM_/, '')
  return `Form ${part}`
}

export function buildCalendarEvents(sources: EventSources, rangeStart: Date, rangeEnd: Date): CalEvent[] {
  const out: CalEvent[] = []

  for (const h of sources.holidays) {
    if (inRange(h.date, rangeStart, rangeEnd)) {
      out.push({ id: `holiday-${h.id}`, date: iso(h.date), title: h.name, type: 'holiday', notes: h.doubleWage ? '2× double wage' : null })
    }
  }

  for (const c of sources.cycles) {
    // Wage payment is due by the 7th of the month following the wage period.
    const due = c.dueDate ?? new Date(c.year, c.month, 7) // c.month is 1-based → Date month index == following month
    if (inRange(due, rangeStart, rangeEnd)) {
      out.push({
        id: `cycle-${c.id}`,
        date: iso(due),
        title: `Wage payment due — ${MONTHS[c.month - 1]} ${c.year} (${c.establishmentName})`,
        type: 'cycle',
        establishmentName: c.establishmentName,
        status: c.status,
      })
    }
  }

  for (const t of sources.tasks) {
    if (t.dueDate && inRange(t.dueDate, rangeStart, rangeEnd)) {
      out.push({
        id: `task-${t.id}`,
        date: iso(t.dueDate),
        title: `${formLabel(t.formCode)} due — ${t.establishmentName}`,
        type: 'task',
        establishmentName: t.establishmentName,
        status: t.status,
      })
    }
  }

  for (const e of sources.employees) {
    if (inRange(e.dateOfEntry, rangeStart, rangeEnd)) {
      out.push({ id: `emp-join-${e.id}`, date: iso(e.dateOfEntry), title: `${e.name} joined — ${e.establishmentName}`, type: 'employee-join', establishmentName: e.establishmentName })
    }
    if (e.exitDate && inRange(e.exitDate, rangeStart, rangeEnd)) {
      out.push({ id: `emp-exit-${e.id}`, date: iso(e.exitDate), title: `${e.name} exit — ${e.establishmentName}`, type: 'employee-exit', establishmentName: e.establishmentName })
    }
  }

  for (const c of sources.custom) {
    for (const occ of expandRecurring(c.date, c.recurring, rangeStart, rangeEnd)) {
      out.push({
        id: `custom-${c.id}-${iso(occ)}`,
        date: iso(occ),
        time: c.time,
        title: c.title,
        type: 'custom',
        establishmentName: c.establishmentName,
        remindDaysBefore: c.remindDaysBefore,
        notes: c.notes,
      })
    }
  }

  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

// Expand a (possibly recurring) custom event into its occurrences within [start, end].
function expandRecurring(date: Date, recurring: string | null, start: Date, end: Date): Date[] {
  const mode = recurring ?? 'none'
  if (mode === 'none') return inRange(date, start, end) ? [date] : []

  const occurrences: Date[] = []
  const day = date.getDate()
  if (mode === 'monthly') {
    // walk month-by-month from the first month >= start back to the anchor
    const cur = new Date(start.getFullYear(), start.getMonth(), day)
    if (cur.getTime() < start.getTime()) cur.setMonth(cur.getMonth() + 1)
    while (cur.getTime() <= end.getTime()) {
      if (cur.getTime() >= date.getTime()) occurrences.push(new Date(cur))
      cur.setMonth(cur.getMonth() + 1)
    }
  } else if (mode === 'yearly') {
    let year = start.getFullYear()
    while (year <= end.getFullYear()) {
      const occ = new Date(year, date.getMonth(), day)
      if (inRange(occ, start, end) && occ.getTime() >= date.getTime()) occurrences.push(occ)
      year++
    }
  }
  return occurrences
}
