import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { parseEmployeeRows, type ParsedEmployee } from '@/lib/import/parse-employees'
import { generateEmpId } from '@/domain/validations/employee'

function toDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function addData(r: ParsedEmployee, establishmentId: string, empId: string) {
  return {
    empId,
    name: r.name!,
    sex:                 r.sex,
    fatherSpouseName:    r.fatherSpouseName,
    dob:                 toDate(r.dob),
    dateOfEntry:         toDate(r.dateOfEntry),
    designation:         r.designation,
    department:          r.department,
    mobile:              r.mobile,
    email:               r.email,
    presentAddress:      r.presentAddress,
    permanentAddress:    r.permanentAddress,
    paymentMode:         r.paymentMode === 'CASH' ? 'CASH' : 'BANK',
    bankAccount:         r.paymentMode === 'CASH' ? null : r.bankAccount,
    ifsc:                r.paymentMode === 'CASH' ? null : r.ifsc,
    bankName:            r.paymentMode === 'CASH' ? null : r.bankName,
    uan:                 r.uan,
    esiNo:               r.esiNo,
    aadhaar:             r.aadhaar,
    defaultTotalSalary:  r.defaultTotalSalary ?? 0,
    basicWage:           r.basicWage ?? 0,
    daWage:              r.daWage ?? 0,
    hraWage:             r.hraWage ?? 0,
    pfMode:              ['PERCENT', 'FIXED', 'NONE'].includes(r.pfMode ?? '') ? r.pfMode! : 'PERCENT',
    pfPercent:           r.pfPercent ?? 12,
    pfWageCeiling:       r.pfWageCeiling ?? 15000,
    pfAmount:            r.pfAmount ?? 0,
    esiAmount:           r.esiAmount ?? 0,
    lwfAmount:           r.lwfAmount ?? 0,
    completionOf480Days: toDate(r.completionOf480Days),
    dateMadePermanent:   toDate(r.dateMadePermanent),
    periodOfSuspension:  r.periodOfSuspension,
    remarks:             r.remarks,
    establishmentId,
  }
}

function updateData(r: ParsedEmployee) {
  return {
    ...(r.name               ? { name: r.name }                                    : {}),
    ...(r.sex                ? { sex: r.sex }                                      : {}),
    ...(r.fatherSpouseName   ? { fatherSpouseName: r.fatherSpouseName }            : {}),
    ...(r.dob                ? { dob: toDate(r.dob) }                              : {}),
    ...(r.dateOfEntry        ? { dateOfEntry: toDate(r.dateOfEntry) }              : {}),
    ...(r.designation        ? { designation: r.designation }                      : {}),
    ...(r.department         ? { department: r.department }                        : {}),
    ...(r.mobile             ? { mobile: r.mobile }                                : {}),
    ...(r.email              ? { email: r.email }                                  : {}),
    ...(r.presentAddress     ? { presentAddress: r.presentAddress }                : {}),
    ...(r.permanentAddress   ? { permanentAddress: r.permanentAddress }            : {}),
    ...(r.paymentMode        ? { paymentMode: r.paymentMode }                      : {}),
    ...(r.bankAccount        ? { bankAccount: r.bankAccount }                      : {}),
    ...(r.ifsc               ? { ifsc: r.ifsc }                                    : {}),
    ...(r.bankName           ? { bankName: r.bankName }                            : {}),
    ...(r.uan                ? { uan: r.uan }                                      : {}),
    ...(r.esiNo              ? { esiNo: r.esiNo }                                  : {}),
    ...(r.aadhaar            ? { aadhaar: r.aadhaar }                              : {}),
    ...(r.defaultTotalSalary ? { defaultTotalSalary: r.defaultTotalSalary }        : {}),
    ...(r.basicWage    !== null ? { basicWage: r.basicWage! }                      : {}),
    ...(r.daWage       !== null ? { daWage: r.daWage! }                            : {}),
    ...(r.hraWage      !== null ? { hraWage: r.hraWage! }                          : {}),
    ...(r.pfMode && ['PERCENT','FIXED','NONE'].includes(r.pfMode)
      ? { pfMode: r.pfMode }                                                       : {}),
    ...(r.pfPercent    !== null ? { pfPercent: r.pfPercent! }                      : {}),
    ...(r.pfWageCeiling !== null ? { pfWageCeiling: r.pfWageCeiling! }             : {}),
    ...(r.pfAmount     !== null ? { pfAmount: r.pfAmount! }                        : {}),
    ...(r.esiAmount    !== null ? { esiAmount: r.esiAmount! }                      : {}),
    ...(r.lwfAmount    !== null ? { lwfAmount: r.lwfAmount! }                      : {}),
    ...(r.completionOf480Days ? { completionOf480Days: toDate(r.completionOf480Days) } : {}),
    ...(r.dateMadePermanent   ? { dateMadePermanent:   toDate(r.dateMadePermanent) }   : {}),
    ...(r.periodOfSuspension  ? { periodOfSuspension: r.periodOfSuspension }       : {}),
    ...(r.remarks             ? { remarks: r.remarks }                             : {}),
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const establishmentId = String(form.get('establishmentId') ?? '')
    const file = form.get('file')
    if (!establishmentId) return NextResponse.json({ error: 'establishmentId is required' }, { status: 422 })
    if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 422 })

    const est = await prisma.establishment.findUnique({ where: { id: establishmentId } })
    if (!est) return NextResponse.json({ error: 'Establishment not found' }, { status: 422 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false })

    const { valid, errors } = parseEmployeeRows(rows)

    let added = 0
    let updated = 0
    let deleted = 0
    let exited = 0
    let count = await prisma.employee.count({ where: { establishmentId } })

    for (const r of valid) {
      if (r.action === 'ADD') {
        const empId = r.empId ?? generateEmpId(count)
        await prisma.employee.create({ data: addData(r, establishmentId, empId) })
        added++
        count++
        continue
      }

      const employee = await prisma.employee.findFirst({
        where: { empId: r.empId!, establishmentId },
      })
      if (!employee) {
        errors.push({ row: -1, messages: [`Emp ID "${r.empId}" not found in this establishment`] })
        continue
      }

      if (r.action === 'UPDATE') {
        await prisma.employee.update({ where: { id: employee.id }, data: updateData(r) })
        updated++
        continue
      }

      if (r.action === 'DELETE') {
        const refCount =
          (await prisma.cycleEmployee.count({ where: { employeeId: employee.id } })) +
          (await prisma.wageRecord.count({ where: { employeeId: employee.id } })) +
          (await prisma.attendanceRecord.count({ where: { employeeId: employee.id } })) +
          (await prisma.leaveRecord.count({ where: { employeeId: employee.id } })) +
          (await prisma.overtimeRecord.count({ where: { employeeId: employee.id } })) +
          (await prisma.fineRecord.count({ where: { employeeId: employee.id } })) +
          (await prisma.deductionRecord.count({ where: { employeeId: employee.id } }))

        if (refCount === 0) {
          await prisma.employee.delete({ where: { id: employee.id } })
          deleted++
        } else {
          await prisma.employee.update({
            where: { id: employee.id },
            data: { status: 'EXITED', exitDate: new Date(), exitReason: 'Bulk import — marked exited' },
          })
          exited++
        }
      }
    }

    return NextResponse.json({ added, updated, deleted, exited, errors })
  } catch (error) {
    console.error('POST /api/employees/import failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
