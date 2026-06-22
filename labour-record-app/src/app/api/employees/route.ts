import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEmployee, generateEmpId } from '@/domain/validations/employee'

const VALID_STATUSES = ['ACTIVE', 'SUSPENDED', 'EXITED']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishmentId')
    const status = searchParams.get('status')

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    const employees = await prisma.employee.findMany({
      where: {
        ...(establishmentId ? { establishmentId } : {}),
        ...(status ? { status: status as 'ACTIVE' | 'SUSPENDED' | 'EXITED' } : {}),
      },
      orderBy: { name: 'asc' },
      include: { establishment: { select: { name: true, type: true } } },
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.error('GET /api/employees failed:', error)
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = validateEmployee(body as any)
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = body as any
    const empId = b.empId?.trim()
      ? b.empId.trim()
      : generateEmpId(await prisma.employee.count({ where: { establishmentId: b.establishmentId } }))
    const employee = await prisma.employee.create({
      data: {
        empId,
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
        establishmentId: b.establishmentId,
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'Employee',
          entityId: employee.id,
          action: 'CREATED',
          newValue: JSON.stringify({ name: employee.name, empId: employee.empId }),
        },
      })
    } catch (auditError) {
      console.error('Audit log failed:', auditError)
    }

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('POST /api/employees failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
