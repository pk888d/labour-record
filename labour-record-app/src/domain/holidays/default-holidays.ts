// Default double-wage holiday list (item 6).
//
// FIXED_HOLIDAYS are solar/calendar-fixed and roll forward to any year
// automatically. MOVABLE_HOLIDAYS vary year-to-year (lunar/announced) and are
// listed per calendar year; add new years as the government notifies them.
//
// NOTE: Replace/adjust these with the user's official Tamil Nadu holiday list
// when provided. All entries default to double-wage.

export type HolidaySpec = { month: number; day: number; name: string; doubleWage?: boolean }
export type ResolvedHoliday = { month: number; day: number; year: number; name: string; doubleWage: boolean }

export const FIXED_HOLIDAYS: HolidaySpec[] = [
  { month: 1, day: 1, name: "New Year's Day" },
  { month: 1, day: 14, name: 'Pongal' },
  { month: 1, day: 15, name: 'Thiruvalluvar Day' },
  { month: 1, day: 16, name: 'Uzhavar Thirunal' },
  { month: 1, day: 26, name: 'Republic Day' },
  { month: 4, day: 14, name: 'Tamil New Year / Dr. Ambedkar Birthday' },
  { month: 5, day: 1, name: 'May Day' },
  { month: 8, day: 15, name: 'Independence Day' },
  { month: 10, day: 2, name: 'Gandhi Jayanti' },
  { month: 12, day: 25, name: 'Christmas' },
]

// Festivals whose Gregorian date shifts each year. Verify against the official
// TN government holiday notification and extend as needed.
export const MOVABLE_HOLIDAYS: Record<number, HolidaySpec[]> = {
  2025: [
    { month: 3, day: 31, name: 'Ramzan (Idul Fitr)' },
    { month: 4, day: 18, name: 'Good Friday' },
    { month: 6, day: 7, name: 'Bakrid (Idul Azha)' },
    { month: 10, day: 1, name: 'Ayudha Pooja' },
    { month: 10, day: 2, name: 'Vijayadashami' },
    { month: 10, day: 20, name: 'Deepavali' },
  ],
  2026: [
    { month: 3, day: 21, name: 'Ramzan (Idul Fitr)' },
    { month: 4, day: 3, name: 'Good Friday' },
    { month: 5, day: 27, name: 'Bakrid (Idul Azha)' },
    { month: 10, day: 20, name: 'Ayudha Pooja' },
    { month: 10, day: 21, name: 'Vijayadashami' },
    { month: 11, day: 8, name: 'Deepavali' },
  ],
  2027: [
    { month: 3, day: 11, name: 'Ramzan (Idul Fitr)' },
    { month: 3, day: 26, name: 'Good Friday' },
    { month: 5, day: 17, name: 'Bakrid (Idul Azha)' },
    { month: 10, day: 9, name: 'Ayudha Pooja' },
    { month: 10, day: 10, name: 'Vijayadashami' },
    { month: 10, day: 29, name: 'Deepavali' },
  ],
}

export function getDefaultHolidaysForYear(year: number): ResolvedHoliday[] {
  const specs = [...FIXED_HOLIDAYS, ...(MOVABLE_HOLIDAYS[year] ?? [])]
  const seen = new Set<string>()
  const out: ResolvedHoliday[] = []
  for (const s of specs) {
    const key = `${s.month}-${s.day}`
    if (seen.has(key)) continue // de-dupe collisions (e.g. festival on a fixed date)
    seen.add(key)
    out.push({ month: s.month, day: s.day, year, name: s.name, doubleWage: s.doubleWage ?? true })
  }
  return out
}
