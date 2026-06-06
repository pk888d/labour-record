import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const record = await prisma.govtHoliday.findUnique({ where: { id } })
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.govtHoliday.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/holidays/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
