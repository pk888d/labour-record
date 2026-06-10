import { prisma } from '@/lib/prisma'
import { getDefaultHolidaysForYear } from './default-holidays'

// Upsert the default holiday set for a calendar year. Idempotent — existing
// dates are left untouched (so user edits survive). Returns how many were added.
export async function ensureHolidays(year: number): Promise<{ added: number; total: number }> {
  const defaults = getDefaultHolidaysForYear(year)
  let added = 0

  for (const h of defaults) {
    // Build a noon UTC date to avoid timezone day-shift.
    const date = new Date(Date.UTC(h.year, h.month - 1, h.day, 12, 0, 0))
    const existing = await prisma.govtHoliday.findUnique({ where: { date } })
    if (existing) continue
    await prisma.govtHoliday.create({
      data: { date, name: h.name, year: h.year, doubleWage: h.doubleWage },
    })
    added++
  }

  const total = await prisma.govtHoliday.count({ where: { year } })
  return { added, total }
}
