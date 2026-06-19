import type { CSSProperties } from 'react'

// "Fill the paper" (approach A): given how many data rows a register has and the
// page orientation, derive a per-row minimum height + cell font size so a sparse
// table stretches to fill the sheet instead of clustering at the top, while a
// crowded one shrinks to stay on as few pages as possible. Returned as CSS
// custom properties that cascade to <td> via the print stylesheet — no runtime
// measuring (which also keeps the print paint deterministic; see #3).
export function printDensity(
  rowCount: number,
  orientation: 'landscape' | 'portrait',
  minFillRows: number,
): CSSProperties {
  const rows = Math.max(rowCount, 1)
  // Usable vertical band for the table body (mm), after page padding + header.
  const usableMm = orientation === 'landscape' ? 150 : 235
  // Below the min-fill threshold, lift the upper clamp so the few rows stretch
  // tall enough to fill the whole sheet. At/above it, keep the 16mm legibility
  // clamp. Floor at 6.5mm so crowded sheets stay legible.
  const maxRowH = rows < minFillRows ? usableMm / rows : 16
  const rowH = Math.min(maxRowH, Math.max(6.5, usableMm / rows))
  const fs = rows <= 12 ? 11 : rows <= 25 ? 9.5 : rows <= 40 ? 8 : 7
  return {
    ['--ts-row-h']: `${rowH.toFixed(1)}mm`,
    ['--ts-cell-fs']: `${fs}px`,
  } as CSSProperties
}
