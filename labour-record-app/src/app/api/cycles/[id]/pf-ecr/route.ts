import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCycleContext, getWagesData, getMusterData, MONTH_NAMES } from '@/lib/export/form-data'
import { buildEcrLines, type EcrInput } from '@/lib/export/statutory-returns'

type Params = { params: Promise<{ id: string }> }

// GET /api/cycles/[id]/pf-ecr — EPFO ECR 2.0 upload file (plain text, one
// #~#-delimited line per PF-applicable ACTIVE employee, CRLF line endings —
// the EPFO portal expects CRLF). Employees with PF deducted but no UAN are
// NOT emitted (the portal would reject the whole file); they are surfaced via
// the X-Skipped-Count header instead of failing the download.
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params

    const cycle = await prisma.monthlyCycle.findUnique({
      where: { id },
      include: { establishment: { select: { name: true } } },
    })
    if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Wage figures come from the SAME source as the Wage Register (getWagesData)
    // so the ECR always reconciles with the register / salary slips.
    const ctx = await getCycleContext(id)
    const wages = await getWagesData(ctx)
    const muster = await getMusterData(ctx)
    const wageByEmp = new Map(wages.map((w) => [w.employeeId, w]))

    // NCP days come from attendance wage days (worked + paid holidays + paid
    // leave). When NO attendance record exists the wage derivation assumes a
    // full month (see computeCycleWages), so mirror that here — otherwise the
    // ECR would show a full month of NCP against a full month of wages.
    const att = await prisma.attendanceRecord.findMany({
      where: { cycleId: id },
      select: { employeeId: true },
    })
    const hasAtt = new Set(att.map((a) => a.employeeId))
    const wageDaysByEmp = new Map(
      muster.map((m) => [m.employeeId, hasAtt.has(m.employeeId) ? m.wageDays : ctx.daysInMonth]),
    )

    // Only ACTIVE employees are remitted via the monthly ECR (same roster rule
    // as the disbursement sheet). UAN / PF config comes from the live employee
    // record so a just-fixed UAN shows up on re-download.
    const emps = await prisma.employee.findMany({
      where: { id: { in: ctx.employees.map((e) => e.employeeId) }, status: 'ACTIVE' },
      select: {
        id: true, name: true, uan: true,
        pfMode: true, pfPercent: true, pfAmount: true, pfWageCeiling: true,
      },
    })
    const empById = new Map(emps.map((e) => [e.id, e]))

    const inputs: EcrInput[] = ctx.employees
      .filter((e) => empById.has(e.employeeId))
      .map((e) => {
        const db = empById.get(e.employeeId)!
        const w = wageByEmp.get(e.employeeId)
        return {
          name: db.name,
          uan: db.uan,
          pfMode: db.pfMode,
          pfPercent: db.pfPercent,
          pfAmount: db.pfAmount,
          pfWageCeiling: db.pfWageCeiling,
          grossWages: w?.grossEarnings ?? 0,
          pfWage: (w?.basic ?? 0) + (w?.da ?? 0),
          pfContribution: w?.pf ?? 0,
          wageDays: wageDaysByEmp.get(e.employeeId) ?? ctx.daysInMonth,
          daysInMonth: ctx.daysInMonth,
        }
      })

    const { lines, skipped } = buildEcrLines(inputs)

    const safeName = cycle.establishment.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const month = MONTH_NAMES[cycle.month].toLowerCase()
    const filename = `ecr-${safeName}-${cycle.year}-${month}.txt`

    return new NextResponse(lines.join('\r\n'), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...(skipped.length ? { 'X-Skipped-Count': String(skipped.length) } : {}),
      },
    })
  } catch (error) {
    console.error('GET /api/cycles/[id]/pf-ecr failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
