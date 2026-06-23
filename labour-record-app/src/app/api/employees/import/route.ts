import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { parseEmployeeRows } from '@/lib/import/parse-employees'
import { generateEmpId } from '@/domain/validations/employee'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const establishmentId = String(form.get('establishmentId') ?? '')
    const file = form.get('file')
    if (!establishmentId) return NextResponse.json({ error: 'establishmentId is required' }, { status: 422 })
    if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 422 })

    const est = await prisma.establishment.findUnique({ where: { id: establishmentId } })
    if (!est) return NextResponse.json({ error: 'establishmentId not found' }, { status: 422 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false })

    const { valid, errors } = parseEmployeeRows(rows)

    let created = 0
    let count = await prisma.employee.count({ where: { establishmentId } })
    for (const r of valid) {
      await prisma.employee.create({
        data: {
          empId: r.empId ?? generateEmpId(count),
          name: r.name,
          sex: r.sex,
          fatherSpouseName: r.fatherSpouseName,
          designation: r.designation,
          dateOfEntry: r.dateOfEntry ? new Date(r.dateOfEntry) : null,
          mobile: r.mobile,
          bankAccount: r.paymentMode === 'CASH' ? null : r.bankAccount,
          ifsc: r.paymentMode === 'CASH' ? null : r.ifsc,
          paymentMode: r.paymentMode,
          defaultTotalSalary: r.defaultTotalSalary,
          establishmentId,
        },
      })
      created++
      count++
    }

    return NextResponse.json({ created, errors })
  } catch (error) {
    console.error('POST /api/employees/import failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
