import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const RECURRING = ['none', 'monthly', 'yearly']

export async function GET() {
  try {
    const events = await prisma.calendarEvent.findMany({ orderBy: { date: 'asc' } })
    return NextResponse.json(events)
  } catch (error) {
    console.error('GET /api/calendar-events failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const b = body as {
      title?: string; date?: string; time?: string; type?: string
      establishmentId?: string; remindDaysBefore?: number; recurring?: string; notes?: string
    }

    const errors: string[] = []
    if (!b.title?.trim()) errors.push('title is required')
    if (!b.date) errors.push('date is required')
    const date = b.date ? new Date(b.date) : null
    if (date && isNaN(date.getTime())) errors.push('invalid date')
    if (b.recurring && !RECURRING.includes(b.recurring)) errors.push('recurring must be none, monthly or yearly')
    if (b.remindDaysBefore != null && (!Number.isInteger(b.remindDaysBefore) || b.remindDaysBefore < 0)) {
      errors.push('remindDaysBefore must be a non-negative integer')
    }
    if (errors.length) return NextResponse.json({ errors }, { status: 422 })

    const event = await prisma.calendarEvent.create({
      data: {
        title: b.title!.trim(),
        date: date!,
        time: b.time?.trim() || null,
        type: b.type?.trim() || 'custom',
        establishmentId: b.establishmentId || null,
        remindDaysBefore: b.remindDaysBefore ?? null,
        recurring: b.recurring || 'none',
        notes: b.notes?.trim() || null,
      },
    })
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('POST /api/calendar-events failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
