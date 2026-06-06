import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidTransition, requiresComment } from '@/domain/workflow/kanban-transitions'
import type { FormTaskStatus } from '@/generated/prisma/client'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES: FormTaskStatus[] = [
  'NOT_STARTED',
  'DATA_ENTRY',
  'READY_FOR_REVIEW',
  'NEEDS_CORRECTION',
  'APPROVED',
  'EXPORTED',
]

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as { to?: string; comment?: string }

    if (!b.to || !VALID_STATUSES.includes(b.to as FormTaskStatus)) {
      return NextResponse.json({ errors: ['to must be a valid FormTaskStatus'] }, { status: 422 })
    }

    const toStatus = b.to as FormTaskStatus

    const formTask = await prisma.formTask.findUnique({
      where: { id },
      include: { cycle: { include: { establishment: true } } },
    })
    if (!formTask) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const fromStatus = formTask.status

    if (!isValidTransition(fromStatus, toStatus)) {
      return NextResponse.json(
        { errors: [`Transition from ${fromStatus} to ${toStatus} is not allowed`] },
        { status: 422 }
      )
    }

    if (requiresComment(fromStatus, toStatus) && !b.comment?.trim()) {
      return NextResponse.json(
        { errors: ['A comment is required when sending back for correction'] },
        { status: 422 }
      )
    }

    // For DATA_ENTRY → READY_FOR_REVIEW, full validation enforced in Plan 3.
    // For now, allow the transition unconditionally.

    const updated = await prisma.formTask.update({
      where: { id },
      data: {
        status: toStatus,
        lastComment: b.comment?.trim() ?? formTask.lastComment,
        updatedAt: new Date(),
      },
    })

    await prisma.formTaskStatusHistory.create({
      data: {
        formTaskId: id,
        fromStatus,
        toStatus,
        comment: b.comment?.trim() ?? null,
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'FormTask',
          entityId: id,
          action: 'STATUS_CHANGED',
          previousValue: JSON.stringify({ status: fromStatus }),
          newValue: JSON.stringify({ status: toStatus, comment: b.comment }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('POST /api/form-tasks/[id]/transition failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
