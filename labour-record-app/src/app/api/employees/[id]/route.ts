import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEmployee } from '@/domain/validations/employee'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { establishment: { select: { name: true, type: true } } },
    })
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(employee)
  } catch (error) {
    console.error('GET /api/employees/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eb = body as any
    // Coerce the form's string salary to a number for the number-typed validator.
    const errors = validateEmployee({ ...eb, defaultTotalSalary: parseFloat(eb.defaultTotalSalary) || 0 }, { requireSalary: false })
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

    const previous = await prisma.employee.findUnique({ where: { id } })
    if (!previous) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = body as any
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        empId: b.empId?.trim() || previous.empId,
        name: b.name.trim(),
        sex: b.sex?.trim() || null,
        fatherSpouseName: b.fatherSpouseName?.trim() || null,
        dob: b.dob ? new Date(b.dob) : null,
        dateOfEntry: b.dateOfEntry ? new Date(b.dateOfEntry) : null,
        designation: b.designation?.trim() || null,
        department: b.department?.trim() || null,
        presentAddress: b.presentAddress?.trim() || null,
        permanentAddress: b.permanentAddress?.trim() || null,
        uan: b.uan?.trim() || null,
        esiNo: b.esiNo?.trim() || null,
        aadhaar: b.aadhaar?.trim() || null,
        bankAccount: b.paymentMode === 'CASH' ? null : (b.bankAccount?.trim() || null),
        ifsc: b.paymentMode === 'CASH' ? null : (b.ifsc?.trim() || null),
        bankName: b.paymentMode === 'CASH' ? null : (b.bankName?.trim() || null),
        mobile: b.mobile?.trim() || null,
        email: b.email?.trim() || null,
        completionOf480Days: b.completionOf480Days ? new Date(b.completionOf480Days) : null,
        dateMadePermanent: b.dateMadePermanent ? new Date(b.dateMadePermanent) : null,
        periodOfSuspension: b.periodOfSuspension?.trim() || null,
        status: b.status ?? previous.status,
        exitDate: b.exitDate ? new Date(b.exitDate) : null,
        exitReason: b.exitReason?.trim() || null,
        remarks: b.remarks?.trim() || null,
        paymentMode: b.paymentMode === 'CASH' ? 'CASH' : 'BANK',
        defaultTotalSalary: parseFloat(b.defaultTotalSalary) || 0,
        basicWage: parseFloat(b.basicWage) || 0,
        daWage: parseFloat(b.daWage) || 0,
        hraWage: parseFloat(b.hraWage) || 0,
        pfMode: ['PERCENT', 'FIXED', 'NONE'].includes(b.pfMode) ? b.pfMode : 'PERCENT',
        pfPercent: parseFloat(b.pfPercent) || 12,
        pfWageCeiling: parseFloat(b.pfWageCeiling) || 15000,
        pfAmount: parseFloat(b.pfAmount) || 0,
        esiAmount: parseFloat(b.esiAmount) || 0,
        lwfAmount: parseFloat(b.lwfAmount) || 0,
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'Employee',
          entityId: id,
          action: 'UPDATED',
          previousValue: JSON.stringify({ name: previous.name, status: previous.status }),
          newValue: JSON.stringify({ name: updated.name, status: updated.status }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/employees/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode')
    const employee = await prisma.employee.findUnique({ where: { id } })
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (mode === 'remove') {
      const refCount =
        (await prisma.cycleEmployee.count({ where: { employeeId: id } })) +
        (await prisma.wageRecord.count({ where: { employeeId: id } })) +
        (await prisma.attendanceRecord.count({ where: { employeeId: id } })) +
        (await prisma.leaveRecord.count({ where: { employeeId: id } })) +
        (await prisma.overtimeRecord.count({ where: { employeeId: id } })) +
        (await prisma.fineRecord.count({ where: { employeeId: id } })) +
        (await prisma.deductionRecord.count({ where: { employeeId: id } }))
      if (refCount > 0) {
        return NextResponse.json(
          {
            error:
              'This employee appears in one or more cycles and cannot be permanently deleted. Mark them Exited instead.',
            canSoftDelete: true,
          },
          { status: 409 },
        )
      }
      await prisma.employee.delete({ where: { id } })
      try {
        await prisma.auditLog.create({
          data: {
            entityType: 'Employee',
            entityId: id,
            action: 'DELETED',
            previousValue: JSON.stringify({ name: employee.name, empId: employee.empId }),
          },
        })
      } catch (auditError) {
        console.error('Audit log failed:', auditError)
      }
      return NextResponse.json({ success: true, removed: true })
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { status: 'EXITED', exitDate: new Date() },
    })
    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'Employee',
          entityId: id,
          action: 'EXITED',
          newValue: JSON.stringify({ exitDate: updated.exitDate }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/employees/[id] failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
