import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { COLS } from '../import/template/route'

function fmtDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : ''
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishmentId') ?? ''
    const statusParam = searchParams.get('status') ?? 'ACTIVE'
    const q = searchParams.get('q')?.trim() ?? ''

    if (!establishmentId) {
      return NextResponse.json({ error: 'establishmentId is required' }, { status: 422 })
    }

    const establishment = await prisma.establishment.findUnique({ where: { id: establishmentId } })
    if (!establishment) {
      return NextResponse.json({ error: 'Establishment not found' }, { status: 422 })
    }

    const VALID_STATUSES = ['ACTIVE', 'SUSPENDED', 'EXITED']
    const statusFilter = VALID_STATUSES.includes(statusParam) ? statusParam : 'ACTIVE'

    const employees = await prisma.employee.findMany({
      where: {
        establishmentId,
        status: statusFilter as 'ACTIVE' | 'SUSPENDED' | 'EXITED',
        ...(q ? { OR: [{ name: { contains: q } }, { empId: { contains: q } }] } : {}),
      },
      orderBy: { name: 'asc' },
    })

    const headers = COLS.map(([h]) => h)
    const legendRow = [
      'Action: ADD / UPDATE / DELETE — change this cell to DELETE to remove a row on re-import',
      ...Array(COLS.length - 1).fill(''),
    ]

    const rows = employees.map((e) => [
      'UPDATE',
      e.empId,
      e.name,
      e.defaultTotalSalary,
      e.sex ?? '',
      e.fatherSpouseName ?? '',
      fmtDate(e.dob),
      fmtDate(e.dateOfEntry),
      e.designation ?? '',
      e.department ?? '',
      e.mobile ?? '',
      e.email ?? '',
      e.presentAddress ?? '',
      e.permanentAddress ?? '',
      e.paymentMode ?? '',
      e.bankAccount ?? '',
      e.ifsc ?? '',
      e.bankName ?? '',
      e.uan ?? '',
      e.esiNo ?? '',
      e.aadhaar ?? '',
      e.basicWage,
      e.daWage,
      e.hraWage,
      e.pfMode ?? '',
      e.pfPercent,
      e.pfWageCeiling,
      e.pfAmount,
      e.esiAmount,
      e.lwfAmount,
      fmtDate(e.completionOf480Days),
      fmtDate(e.dateMadePermanent),
      e.periodOfSuspension ?? '',
      e.remarks ?? '',
    ])

    const data = [headers, legendRow, ...rows]

    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = COLS.map((_, i) => ({ wch: i === 0 ? 18 : 26 }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Employees')

    const buf = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))

    const safeName = establishment.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const filename = `employees-export-${safeName}-${statusFilter.toLowerCase()}.xlsx`

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('GET /api/employees/export failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
