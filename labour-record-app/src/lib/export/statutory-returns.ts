// Pure builders for the monthly statutory return files (TEC-30):
//
//   - buildEcrLines      → EPFO ECR 2.0 text lines (#~#-delimited, one line per
//                          PF-applicable member, whole-rupee figures — the EPFO
//                          portal rejects decimals).
//   - buildEsiReturnRows → ESIC monthly-contribution ("MC") upload rows.
//
// Both builders take already-shaped plain rows (no Prisma here — same split as
// disbursement.ts). Wage figures MUST come from the same derivation as the Wage
// Register (src/lib/export/form-data.ts getWagesData) so the filed figures
// always reconcile with the printed register.
//
// Employees whose statutory number (UAN / ESI number) is missing are returned
// in `skipped` — an invalid line is never emitted. Employees for whom PF / ESI
// simply does not apply are excluded silently (they don't belong on the return
// at all, so they are not "skipped").
import { PF_DEFAULT_PERCENT } from '@/domain/calculations/pf-calculator'

// EPS (pension) statutory parameters: 8.33% of EPS wages, wage ceiling ₹15,000.
export const EPS_PERCENT = 8.33
export const EPS_WAGE_CEILING = 15000

// ESIC "Reason Code for Zero Working Days": 0 = not required (days > 0),
// 11 = "No work" — the honest default when a member had zero wage days.
export const ESI_REASON_NOT_REQUIRED = 0
export const ESI_REASON_NO_WORK = 11

export type SkippedEmployee = { name: string; reason: string }

export type EcrInput = {
  name: string
  uan: string | null
  pfMode: string // 'PERCENT' | 'FIXED' | 'NONE'
  pfPercent: number
  pfAmount: number
  pfWageCeiling: number // employee's PF wage ceiling; <= 0 means uncapped
  grossWages: number // cycle gross earnings (Wage Register figure)
  pfWage: number // PF-able wage (Basic + DA) BEFORE the ceiling is applied
  pfContribution: number // employee-share PF as computed for the cycle
  wageDays: number // paid days from attendance (worked + paid holidays/leave)
  daysInMonth: number
}

export type EcrResult = { lines: string[]; skipped: SkippedEmployee[] }

export type EsiInput = {
  name: string
  esiNo: string | null
  esiApplicable: boolean // ESI actually applies to this employee this cycle
  grossWages: number // cycle gross earnings (Wage Register figure)
  wageDays: number
  lastWorkingDay: string // '' unless the employee exited within the cycle month (DD/MM/YYYY)
}

export type EsiReturnRow = {
  ipNumber: string
  ipName: string
  noOfDays: number
  totalMonthlyWages: number
  reasonCode: number
  lastWorkingDay: string
}

export type EsiResult = { rows: EsiReturnRow[]; skipped: SkippedEmployee[] }

const isBlank = (v: string | null | undefined) => !v || v.trim() === ''

// PF is actually deducted when the mode computes a non-zero contribution —
// mirrors calculatePf (src/domain/calculations/pf-calculator.ts) and
// pfApplies in src/domain/compliance/preflight.ts.
function pfApplies(e: Pick<EcrInput, 'pfMode' | 'pfPercent' | 'pfAmount'>): boolean {
  if (e.pfMode === 'NONE') return false
  if (e.pfMode === 'FIXED') return e.pfAmount > 0
  return e.pfPercent > 0 // PERCENT (default)
}

// EPFO member names may only contain A-Z, space and dot; anything else is
// stripped (the portal rejects the line otherwise). Uppercase, collapse runs
// of whitespace left behind by stripped characters.
export function sanitizeMemberName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z. ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// EPFO ECR 2.0 member line:
// UAN#~#MEMBER NAME#~#GROSS WAGES#~#EPF WAGES#~#EPS WAGES#~#EDLI WAGES#~#
// EPF CONTRI REMITTED#~#EPS CONTRI REMITTED#~#EPF EPS DIFF REMITTED#~#
// NCP DAYS#~#REFUND OF ADVANCES
export function buildEcrLines(rows: EcrInput[]): EcrResult {
  const lines: string[] = []
  const skipped: SkippedEmployee[] = []

  for (const r of rows) {
    if (!pfApplies(r)) continue // PF not applicable → not on the return at all
    if (isBlank(r.uan)) {
      skipped.push({ name: r.name, reason: 'Missing UAN' })
      continue
    }

    const ceiling = r.pfWageCeiling > 0 ? r.pfWageCeiling : Infinity
    const epfWages = Math.round(Math.min(r.pfWage, ceiling))
    const epsWages = Math.min(epfWages, EPS_WAGE_CEILING)
    const edliWages = epsWages
    const epfContri = Math.round(r.pfContribution)
    const epsContri = Math.round(epsWages * (EPS_PERCENT / 100))
    const epfEpsDiff = Math.max(
      0,
      Math.round(epfWages * (PF_DEFAULT_PERCENT / 100)) - epsContri,
    )
    const ncpDays = Math.max(0, r.daysInMonth - r.wageDays)

    lines.push(
      [
        r.uan!.trim(),
        sanitizeMemberName(r.name),
        Math.round(r.grossWages),
        epfWages,
        epsWages,
        edliWages,
        epfContri,
        epsContri,
        epfEpsDiff,
        ncpDays,
        0, // refund of advances
      ].join('#~#'),
    )
  }

  return { lines, skipped }
}

export function buildEsiReturnRows(rows: EsiInput[]): EsiResult {
  const out: EsiReturnRow[] = []
  const skipped: SkippedEmployee[] = []

  for (const r of rows) {
    if (!r.esiApplicable) continue // ESI not applicable → not on the return at all
    if (isBlank(r.esiNo)) {
      skipped.push({ name: r.name, reason: 'Missing ESI number' })
      continue
    }

    const noOfDays = Math.max(0, r.wageDays)
    out.push({
      ipNumber: r.esiNo!.trim(),
      ipName: r.name.trim(),
      noOfDays,
      totalMonthlyWages: Math.round(r.grossWages),
      reasonCode: noOfDays > 0 ? ESI_REASON_NOT_REQUIRED : ESI_REASON_NO_WORK,
      lastWorkingDay: r.lastWorkingDay,
    })
  }

  return { rows: out, skipped }
}
