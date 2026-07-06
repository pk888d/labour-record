import { prisma } from '@/lib/prisma'
import { runComplianceChecks, type PreflightFinding } from '@/domain/compliance/preflight'

// dailyMarks is persisted as a JSON string ("[]" default); tolerate bad rows.
function parseMarks(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((m) => String(m ?? '')) : []
  } catch {
    return []
  }
}

// Fetch a cycle's raw rows, shape them, and run the pure pre-flight checks.
// Returns null when the cycle does not exist.
export async function loadComplianceChecks(cycleId: string): Promise<PreflightFinding[] | null> {
  const cycle = await prisma.monthlyCycle.findUnique({
    where: { id: cycleId },
    include: {
      cycleEmployees: {
        include: {
          employee: {
            select: {
              id: true, name: true, status: true, exitDate: true,
              uan: true, esiNo: true, pfMode: true, pfPercent: true,
              pfAmount: true, esiAmount: true, defaultTotalSalary: true,
            },
          },
        },
      },
      formTasks: { select: { formCode: true, status: true } },
      attendanceRecords: { select: { employeeId: true, dailyMarks: true } },
      wageRecords: { select: { employeeId: true, grossWages: true } },
    },
  })
  if (!cycle) return null

  return runComplianceChecks({
    cycle: { month: cycle.month, year: cycle.year },
    employees: cycle.cycleEmployees.map((ce) => ce.employee),
    attendance: cycle.attendanceRecords.map((a) => ({
      employeeId: a.employeeId,
      dailyMarks: parseMarks(a.dailyMarks),
    })),
    wages: cycle.wageRecords.map((w) => ({ employeeId: w.employeeId, grossWages: w.grossWages })),
    formTasks: cycle.formTasks,
  })
}
