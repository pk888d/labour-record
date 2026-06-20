import { prisma } from '@/lib/prisma'
import {
  resolvePrintConfig,
  type PrintConfig,
  type RawPrintSettings,
} from '@/lib/print-config'

export const SETTING_KEYS = {
  maxRowsPerSheet: 'print.maxRowsPerSheet',
  minFillRows: 'print.minFillRows',
} as const

function toPosIntOrNull(value: string | undefined): number | null {
  if (value === undefined) return null
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

// Saved values (positive int) or null when unset — used by the Settings UI.
export async function getRawPrintSettings(): Promise<RawPrintSettings> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: [SETTING_KEYS.maxRowsPerSheet, SETTING_KEYS.minFillRows] } },
  })
  const byKey = (k: string) => rows.find((r) => r.key === k)?.value
  return {
    maxRowsPerSheet: toPosIntOrNull(byKey(SETTING_KEYS.maxRowsPerSheet)),
    minFillRows: toPosIntOrNull(byKey(SETTING_KEYS.minFillRows)),
  }
}

// Effective config at print time: saved DB value -> env -> hardcoded default,
// then the per-orientation single-sheet clamp.
export async function getPrintConfig(
  orientation: 'landscape' | 'portrait',
): Promise<PrintConfig> {
  const raw = await getRawPrintSettings()
  const rawMax = raw.maxRowsPerSheet ?? toPosIntOrNull(process.env.PRINT_MAX_ROWS_PER_SHEET) ?? undefined
  const rawMin = raw.minFillRows ?? toPosIntOrNull(process.env.PRINT_MIN_FILL_ROWS) ?? undefined
  return resolvePrintConfig(rawMax, rawMin, orientation)
}
