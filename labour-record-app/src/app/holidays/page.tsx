import { prisma } from '@/lib/prisma'
import { HolidaysClient } from './holidays-client'

export default async function HolidaysPage() {
  const currentYear = new Date().getFullYear()
  const holidays = await prisma.govtHoliday.findMany({
    where: { year: currentYear },
    orderBy: { date: 'asc' },
  })
  const serialized = holidays.map((h) => ({
    id: h.id,
    date: h.date.toISOString(),
    name: h.name,
    year: h.year,
    doubleWage: h.doubleWage,
  }))
  return <HolidaysClient initialHolidays={serialized} initialYear={currentYear} />
}
