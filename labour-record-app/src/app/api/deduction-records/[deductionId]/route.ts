import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ deductionId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { deductionId } = await params
    const record = await prisma.deductionRecord.findUnique({ where: { id: deductionId } })
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.deductionRecord.delete({ where: { id: deductionId } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/deduction-records/[deductionId] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
