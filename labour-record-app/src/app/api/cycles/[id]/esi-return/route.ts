import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { getCycleContext, getWagesData, getMusterData, MONTH_NAMES } from '@/lib/export/form-data'
import { buildEsiReturnRows, type EsiInput } from '@/lib/export/statutory-returns'

type Params = { params: Promise<{ id: string }> }

// Header text mirrors the ESIC monthly-contribution (MC) Excel upload template.
const ESI_HEADER = [
  'IP Number',
  'IP Name',
  'No of Days for which wages paid/payable during the month',
  'Total Monthly Wages',
  'Reason Code for Zero workings days(numeric only; provide 0 for all other reasons)',
  'Last Working Day( Format DD/MM/YYYY)( Only if person has left service)',
]

const ddmmyyyy = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

// GET /api/cycles/[id]/esi-return — ESIC monthly-contribution upload sheet
// (XLSX, mirrors the disbursement route). ACTIVE employees plus employees who
// exited within the cycle month (their Last Working Day is filed on this
// return). ESI-applicable employees without an ESI number land on a separate
// "Skipped" sheet — an invalid row is never emitted.
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params

    const cycle = await prisma.monthlyCycle.findUnique({
      where: { id },
      include: { establishment: { select: { name: true } } },
    })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Wage figures come from the SAME source as the Wage Register (getWagesData)
    // so the return always reconciles with the register / salary slips.
    const ctx = await getCycleContext(id)
    const wages = await getWagesData(ctx)
    const muster = await getMusterData(ctx)
    const wageByEmp = new Map(wages.map((w) => [w.employeeId, w]))

    // Wage days come from attendance (worked + paid holidays + paid leave);
    // when no attendance record exists, the wage derivation assumes a full
    // month (computeCycleWages) so mirror that here.
    const att = await prisma.attendanceRecord.findMany({
      where: { cycleId: id },
      select: { employeeId: true },
    })
    const hasAtt = new Set(att.map((a) => a.employeeId))
    const wageDaysByEmp = new Map(
      muster.map((m) => [m.employeeId, hasAtt.has(m.employeeId) ? m.wageDays : ctx.daysInMonth]),
    )

    const monthStart = new Date(cycle.year, cycle.month - 1, 1)
    const nextMonthStart = new Date(cycle.year, cycle.month, 1)

    // ACTIVE roster (same rule as disbursement) + employees exited within the
    // cycle month, whose Last Working Day must be reported on this return.
    const emps = await prisma.employee.findMany({
      where: {
        id: { in: ctx.employees.map((e) => e.employeeId) },
        OR: [
          { status: 'ACTIVE' },
          { exitDate: { gte: monthStart, lt: nextMonthStart } },
        ],
      },
      select: { id: true, name: true, esiNo: true, esiAmount: true, exitDate: true },
    })
    const empById = new Map(emps.map((e) => [e.id, e]))

    const inputs: EsiInput[] = ctx.employees
      .filter((e) => empById.has(e.employeeId))
      .map((e) => {
        const db = empById.get(e.employeeId)!
        const w = wageByEmp.get(e.employeeId)
        const exitedInMonth =
          db.exitDate !== null && db.exitDate >= monthStart && db.exitDate < nextMonthStart
        return {
          name: db.name,
          esiNo: db.esiNo,
          // ESI applies when the cycle actually deducted ESI, or the employee
          // is configured with an ESI amount (covers zero-wage months).
          esiApplicable: (w?.esi ?? 0) > 0 || db.esiAmount > 0,
          grossWages: w?.grossEarnings ?? 0,
          wageDays: wageDaysByEmp.get(e.employeeId) ?? ctx.daysInMonth,
          lastWorkingDay: exitedInMonth ? ddmmyyyy(db.exitDate!) : '',
        }
      })

    const { rows, skipped } = buildEsiReturnRows(inputs)

    const wb = XLSX.utils.book_new()

    const aoa = rows.map((r) => [
      r.ipNumber, r.ipName, r.noOfDays, r.totalMonthlyWages, r.reasonCode, r.lastWorkingDay,
    ])
    const ws = XLSX.utils.aoa_to_sheet([ESI_HEADER, ...aoa])
    ws['!cols'] = [{ wch: 14 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws, 'ESI Return')

    if (skipped.length) {
      const skWs = XLSX.utils.aoa_to_sheet([
        ['#', 'Employee', 'Reason'],
        ...skipped.map((s, i) => [i + 1, s.name, s.reason]),
      ])
      skWs['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 40 }]
      XLSX.utils.book_append_sheet(wb, skWs, 'Skipped')
    }

    const buf = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))

    const safeName = cycle.establishment.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const month = MONTH_NAMES[cycle.month].toLowerCase()
    const filename = `esi-return-${safeName}-${cycle.year}-${month}.xlsx`

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...(skipped.length ? { 'X-Skipped-Count': String(skipped.length) } : {}),
      },
    })
  } catch (error) {
    console.error('GET /api/cycles/[id]/esi-return failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
