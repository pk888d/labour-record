import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { getCycleContext, getWagesData, getOvertimeData, MONTH_NAMES } from '@/lib/export/form-data'
import { buildDetailedWagesRows, type DetailedWagesInput } from '@/lib/export/detailed-wages'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params

    const cycle = await prisma.monthlyCycle.findUnique({
      where: { id },
      include: { establishment: { select: { name: true } } },
    })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Wage figures come from the SAME source as the Wage Register
    // (getWagesData) and overtime earnings from the same source as the
    // Overtime register (getOvertimeData) so this internal report always
    // reconciles with those documents.
    const ctx = await getCycleContext(id)
    const [wages, overtime] = await Promise.all([getWagesData(ctx), getOvertimeData(ctx)])
    const otByEmployee = new Map(overtime.map((o) => [o.employeeId, o.otEarnings]))

    const inputs: DetailedWagesInput[] = wages.map((w) => ({
      name: w.name,
      empId: w.empId,
      daysWorked: w.daysWorked,
      basic: w.basic,
      da: w.da,
      hra: w.hra,
      otherAllowances: w.otherAllowances,
      otEarnings: otByEmployee.get(w.employeeId) ?? 0,
      grossEarnings: w.grossEarnings,
      pf: w.pf,
      esi: w.esi,
      lwf: w.lwf,
      fineDeduction: w.fineDeduction,
      otherDeductions: w.otherDeductions,
      advanceRecovered: w.advanceRecovered,
      netWage: w.netWage,
      paymentDate: w.paymentDate,
      receiptRef: w.receiptRef,
    }))

    const { rows, totals } = buildDetailedWagesRows(inputs)

    // Internal working sheet — deliberately NO rule citation, NO "Form" naming.
    const header = [
      'S.No', 'Employee Name', 'Emp ID', 'Days Worked', 'Basic', 'DA', 'HRA',
      'Other Allowances', 'Overtime Earnings', 'Gross Wages',
      'PF', 'ESI', 'LWF', 'Fine Deduction', 'Other Deductions', 'Advance Recovered',
      'Total Deductions', 'Net Wage', 'Payment Date', 'Receipt Ref',
    ]
    const dataRows = rows.map((r, i) => [
      i + 1, r.name, r.empId, r.daysWorked, r.basic, r.da, r.hra,
      r.otherAllowances, r.otEarnings, r.grossEarnings,
      r.pf, r.esi, r.lwf, r.fineDeduction, r.otherDeductions, r.advanceRecovered,
      r.totalDeductions, r.netWage, r.paymentDate, r.receiptRef,
    ])
    const totalRow = [
      '', 'TOTAL', '', '', totals.basic, totals.da, totals.hra,
      totals.otherAllowances, totals.otEarnings, totals.grossEarnings,
      totals.pf, totals.esi, totals.lwf, totals.fineDeduction, totals.otherDeductions,
      totals.advanceRecovered, totals.totalDeductions, totals.netWage, '', '',
    ]

    const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows, totalRow])
    ws['!cols'] = [
      { wch: 6 }, { wch: 26 }, { wch: 12 }, { wch: 11 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
      { wch: 16 }, { wch: 16 }, { wch: 13 },
      { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 15 }, { wch: 16 },
      { wch: 15 }, { wch: 13 }, { wch: 14 }, { wch: 14 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Detailed Wages')

    const buf = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))

    const safeName = cycle.establishment.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const month = MONTH_NAMES[cycle.month].toLowerCase()
    const filename = `detailed-wages-${safeName}-${cycle.year}-${month}.xlsx`

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('GET /api/cycles/[id]/detailed-wages failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
