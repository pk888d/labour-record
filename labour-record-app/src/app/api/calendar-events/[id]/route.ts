import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    await prisma.calendarEvent.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('DELETE /api/calendar-events/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
