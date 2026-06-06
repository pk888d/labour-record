import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ fineId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { fineId } = await params
    const record = await prisma.fineRecord.findUnique({ where: { id: fineId } })
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.fineRecord.delete({ where: { id: fineId } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/fine-records/[fineId] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
