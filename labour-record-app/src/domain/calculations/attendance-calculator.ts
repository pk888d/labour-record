export type DayMark = 'P' | 'A' | 'L' | 'H' | 'OT' | ''

export type AttendanceTotals = {
  daysWorked: number
  leaveDays: number
  absentDays: number
  wageDays: number
}

export function calculateAttendanceTotals(dailyMarks: string[]): AttendanceTotals {
  let daysWorked = 0
  let leaveDays = 0
  let absentDays = 0

  for (const mark of dailyMarks) {
    if (mark === 'P' || mark === 'OT') daysWorked++
    else if (mark === 'L') leaveDays++
    else if (mark === 'A') absentDays++
  }

  return { daysWorked, leaveDays, absentDays, wageDays: daysWorked + leaveDays }
}

// Round-robin weekly offs (item 7): stagger each employee's weekly off across
// different days (by employeeIndex) and rotate it week-to-week (by weekIndex)
// so the establishment is never fully closed on a single day.
// Returns the day-of-week values (0=Sun..6=Sat) that are weekly offs.
export function computeWeeklyOffDays(
  workWeekDays: number,
  employeeIndex: number,
  weekIndex: number
): Set<number> {
  const offCount = 7 - workWeekDays
  if (offCount <= 0) return new Set()
  const first = mod(employeeIndex + weekIndex, 7)
  const offs = new Set<number>()
  for (let i = 0; i < offCount; i++) offs.add(mod(first + i, 7))
  return offs
}

export function applyRotatingAttendanceDefaults(
  marks: string[],
  year: number,
  month: number,
  holidayDays: Set<number>,
  workWeekDays: number,
  employeeIndex: number
): string[] {
  return marks.map((mark, i) => {
    if (mark !== '') return mark
    const day = i + 1
    if (holidayDays.has(day)) return 'H'
    const weekIndex = Math.floor((day - 1) / 7)
    const offDays = computeWeeklyOffDays(workWeekDays, employeeIndex, weekIndex)
    const dow = new Date(year, month - 1, day).getDay()
    return offDays.has(dow) ? 'H' : 'P'
  })
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

export function applyAttendanceDefaults(
  marks: string[],
  year: number,
  month: number,
  holidayDays: Set<number>,
  workWeekDays: number = 6
): string[] {
  return marks.map((mark, i) => {
    if (mark !== '') return mark
    const day = i + 1
    if (holidayDays.has(day)) return 'H'
    const dow = new Date(year, month - 1, day).getDay()
    if (workWeekDays < 7 && dow === 0) return 'H'
    if (workWeekDays === 5 && dow === 6) return 'H'
    return 'P'
  })
}
