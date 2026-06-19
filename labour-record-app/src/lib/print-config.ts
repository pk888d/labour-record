// Deployment-level controls for how the print registers list employees.
// Set via env (defaults in parens):
//   PRINT_MAX_ROWS_PER_SHEET  (20)  max employees listed on one sheet
//   PRINT_MIN_FILL_ROWS       (5)   below this count, rows stretch to fill the page
// maxRowsPerSheet is clamped to the single-sheet ceiling per orientation so a
// chunk can never overflow into an un-headered second page (see print-density.ts:
// usableMm / 6.5mm floor => 23 landscape, 36 portrait).

const DEFAULT_MAX_ROWS_PER_SHEET = 20
const DEFAULT_MIN_FILL_ROWS = 5

export interface PrintConfig {
  maxRowsPerSheet: number
  minFillRows: number
}

function posIntEnv(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

function singleSheetCeiling(orientation: 'landscape' | 'portrait'): number {
  const usableMm = orientation === 'landscape' ? 150 : 235
  return Math.floor(usableMm / 6.5) // 23 landscape, 36 portrait
}

export function getPrintConfig(orientation: 'landscape' | 'portrait'): PrintConfig {
  const requested = posIntEnv(process.env.PRINT_MAX_ROWS_PER_SHEET, DEFAULT_MAX_ROWS_PER_SHEET)
  const maxRowsPerSheet = Math.min(requested, singleSheetCeiling(orientation))
  const minFillRows = posIntEnv(process.env.PRINT_MIN_FILL_ROWS, DEFAULT_MIN_FILL_ROWS)
  return { maxRowsPerSheet, minFillRows }
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]] // always render at least one (blank) sheet
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
