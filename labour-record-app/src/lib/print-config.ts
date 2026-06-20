// Pure logic for the print-register pagination config. No DB / env reads here
// (those live in print-config-server.ts) so this stays unit-testable and safe to
// import anywhere. Resolution precedence (saved DB value -> env -> default) is
// applied by the caller; this module only turns raw numbers into a final config.

export const DEFAULT_MAX_ROWS_PER_SHEET = 20
export const DEFAULT_MIN_FILL_ROWS = 5

export interface PrintConfig {
  maxRowsPerSheet: number
  minFillRows: number
}

// Saved raw values as the UI / resolver see them: a positive int, or null (unset).
export interface RawPrintSettings {
  maxRowsPerSheet: number | null
  minFillRows: number | null
}

function posIntOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isInteger(value) && value > 0 ? value : fallback
}

// Clamp so a chunk can never overflow into an un-headered second page
// (print-density.ts uses usableMm 150 landscape / 235 portrait and a 6.5mm floor).
export function singleSheetCeiling(orientation: 'landscape' | 'portrait'): number {
  const usableMm = orientation === 'landscape' ? 150 : 235
  return Math.floor(usableMm / 6.5) // 23 landscape, 36 portrait
}

export function resolvePrintConfig(
  rawMax: number | undefined,
  rawMin: number | undefined,
  orientation: 'landscape' | 'portrait',
): PrintConfig {
  const requested = posIntOr(rawMax, DEFAULT_MAX_ROWS_PER_SHEET)
  const maxRowsPerSheet = Math.min(requested, singleSheetCeiling(orientation))
  const minFillRows = posIntOr(rawMin, DEFAULT_MIN_FILL_ROWS)
  return { maxRowsPerSheet, minFillRows }
}

export type ParseResult =
  | { ok: true; value: number | null }
  | { ok: false }

// Validate one Settings input: blank/null/undefined => clear (null); a positive
// integer => that number; anything else => invalid.
export function parseSettingValue(input: string | number | null | undefined): ParseResult {
  if (input === null || input === undefined) return { ok: true, value: null }
  if (typeof input === 'string' && input.trim() === '') return { ok: true, value: null }
  const n = Number(input)
  if (Number.isInteger(n) && n > 0) return { ok: true, value: n }
  return { ok: false }
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]] // always render at least one (blank) sheet
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
