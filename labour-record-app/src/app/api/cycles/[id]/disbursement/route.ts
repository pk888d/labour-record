import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { getCycleContext, getWagesData, MONTH_NAMES } from '@/lib/export/form-data'
import { buildDisbursementRows, type DisbursementInput } from '@/lib/export/disbursement'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params

    const cycle = await prisma.monthlyCycle.findUnique({
      where: { id },
      include: { establishment: { select: { name: true } } },
    })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Net pay comes from the SAME source as the Wage Register (getWagesData) so
    // the disbursement file always reconciles with the register / slips.
    const ctx = await getCycleContext(id)
    const wages = await getWagesData(ctx)
    const netByEmp = new Map(wages.map((w) => [w.employeeId, w.netWage]))

    // Only ACTIVE employees are paid via the disbursement sheet.
    const emps = await prisma.employee.findMany({
      where: { id: { in: ctx.employees.map((e) => e.employeeId) }, status: 'ACTIVE' },
      select: {
        id: true, name: true, empId: true, paymentMode: true,
        bankAccount: true, ifsc: true, bankName: true,
      },
    })
    const empById = new Map(emps.map((e) => [e.id, e]))

    const inputs: DisbursementInput[] = ctx.employees
      .filter((e) => empById.has(e.employeeId))
      .map((e) => {
        const db = empById.get(e.employeeId)!
        return {
          name: db.name,
          empId: db.empId,
          paymentMode: db.paymentMode,
          bankAccount: db.bankAccount,
          ifsc: db.ifsc,
          bankName: db.bankName,
          netPay: netByEmp.get(e.employeeId) ?? 0,
        }
      })

    const { bank, cash, warnings, totals } = buildDisbursementRows(inputs)

    const wb = XLSX.utils.book_new()

    // --- Bank Transfer sheet ---
    const bankHeader = ['S.No', 'Employee Name', 'Emp ID', 'Bank Account', 'IFSC', 'Bank Name', 'Net Pay ₹']
    const bankRows = bank.map((r, i) => [i + 1, r.name, r.empId, r.bankAccount, r.ifsc, r.bankName, r.netPay])
    const bankTotalRow = ['', 'TOTAL', '', '', '', '', totals.bank]
    const bankWs = XLSX.utils.aoa_to_sheet([bankHeader, ...bankRows, bankTotalRow])
    bankWs['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 24 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, bankWs, 'Bank Transfer')

    // --- Cash Payment sheet ---
    const cashHeader = ['S.No', 'Employee Name', 'Emp ID', 'Net Pay ₹']
    const cashRows = cash.map((r, i) => [i + 1, r.name, r.empId, r.netPay])
    const cashTotalRow = ['', 'TOTAL', '', totals.cash]
    const cashWs = XLSX.utils.aoa_to_sheet([cashHeader, ...cashRows, cashTotalRow])
    cashWs['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 12 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, cashWs, 'Cash Payment')

    // --- Warnings sheet (only when there are warnings) ---
    if (warnings.length) {
      const warnWs = XLSX.utils.aoa_to_sheet([['#', 'Warning'], ...warnings.map((w, i) => [i + 1, w])])
      warnWs['!cols'] = [{ wch: 6 }, { wch: 90 }]
      XLSX.utils.book_append_sheet(wb, warnWs, 'Warnings')
    }

    const buf = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))

    const safeName = cycle.establishment.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const month = MONTH_NAMES[cycle.month].toLowerCase()
    const filename = `disbursement-${safeName}-${cycle.year}-${month}.xlsx`

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('GET /api/cycles/[id]/disbursement failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
