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
