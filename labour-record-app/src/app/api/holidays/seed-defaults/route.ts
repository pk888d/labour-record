import { NextResponse } from 'next/server'
import { ensureHolidays } from '@/domain/holidays/ensure-holidays'

// Item 6: populate the default double-wage holiday list for a year.
export async function POST(request: Request) {
  try {
    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      /* empty body is fine */
    }
    const b = body as { year?: number }
    const year = b.year ?? new Date().getFullYear()
    const result = await ensureHolidays(year)
    return NextResponse.json({ success: true, year, ...result })
  } catch (error) {
    console.error('POST /api/holidays/seed-defaults failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
