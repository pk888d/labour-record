import { describe, expect, it } from 'vitest'
import { printDensity } from './print-density'

// helper: pull the numeric mm out of the returned CSS var
function rowMm(style: Record<string, string>): number {
  return Number(style['--ts-row-h'].replace('mm', ''))
}

describe('printDensity', () => {
  it('below the min-fill threshold, lifts the clamp so rows fill the sheet', () => {
    // landscape usableMm = 150; 3 rows, minFill 5 => 150/3 = 50.0mm (no 16 clamp)
    const style = printDensity(3, 'landscape', 5) as Record<string, string>
    expect(rowMm(style)).toBeCloseTo(50.0, 1)
  })

  it('at the threshold, keeps the 16mm legibility clamp', () => {
    // 5 rows, minFill 5 => not below threshold => clamp 16 applies (150/5=30 -> 16)
    const style = printDensity(5, 'landscape', 5) as Record<string, string>
    expect(rowMm(style)).toBeCloseTo(16.0, 1)
  })

  it('honors the 6.5mm floor for crowded sheets', () => {
    // 40 rows landscape => 150/40 = 3.75 -> floored to 6.5
    const style = printDensity(40, 'landscape', 5) as Record<string, string>
    expect(rowMm(style)).toBeCloseTo(6.5, 1)
  })

  it('treats zero rows as one row without throwing', () => {
    const style = printDensity(0, 'portrait', 5) as Record<string, string>
    expect(rowMm(style)).toBeGreaterThan(0)
  })
})
