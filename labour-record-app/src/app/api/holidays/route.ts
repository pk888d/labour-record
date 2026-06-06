import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10)
    const holidays = await prisma.govtHoliday.findMany({
      where: { year },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(holidays)
  } catch (error) {
    console.error('GET /api/holidays failed:', error)
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
    const b = body as { date?: string; name?: string }
    if (!b.date || !b.name?.trim()) {
      return NextResponse.json({ errors: ['date and name are required'] }, { status: 422 })
    }
    const date = new Date(b.date)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ errors: ['invalid date'] }, { status: 422 })
    }
    const year = date.getFullYear()
    const holiday = await prisma.govtHoliday.create({
      data: { date, name: b.name.trim(), year },
    })
    return NextResponse.json(holiday, { status: 201 })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ errors: ['A holiday already exists on that date'] }, { status: 422 })
    }
    console.error('POST /api/holidays failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
