import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPrintConfig, chunk } from './print-config'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getPrintConfig', () => {
  it('returns defaults when env vars are unset', () => {
    // No vi.stubEnv calls — vars are absent (cleared by unstubAllEnvs from prior tests)
    const cfg = getPrintConfig('landscape')
    // default 20 is below the landscape single-sheet ceiling (floor(150/6.5)=23)
    expect(cfg.maxRowsPerSheet).toBe(20)
    expect(cfg.minFillRows).toBe(5)
  })

  it('reads valid env overrides', () => {
    vi.stubEnv('PRINT_MAX_ROWS_PER_SHEET', '15')
    vi.stubEnv('PRINT_MIN_FILL_ROWS', '3')
    const cfg = getPrintConfig('portrait')
    expect(cfg.maxRowsPerSheet).toBe(15)
    expect(cfg.minFillRows).toBe(3)
  })

  it('falls back to defaults on non-numeric value', () => {
    vi.stubEnv('PRINT_MAX_ROWS_PER_SHEET', 'abc')
    vi.stubEnv('PRINT_MIN_FILL_ROWS', '')
    const cfg = getPrintConfig('landscape')
    expect(cfg.maxRowsPerSheet).toBe(20)
    expect(cfg.minFillRows).toBe(5)
  })

  it('falls back to defaults on zero value', () => {
    vi.stubEnv('PRINT_MAX_ROWS_PER_SHEET', '0')
    vi.stubEnv('PRINT_MIN_FILL_ROWS', '0')
    const cfg = getPrintConfig('landscape')
    expect(cfg.maxRowsPerSheet).toBe(20)
    expect(cfg.minFillRows).toBe(5)
  })

  it('falls back to defaults on negative value', () => {
    vi.stubEnv('PRINT_MAX_ROWS_PER_SHEET', '-3')
    vi.stubEnv('PRINT_MIN_FILL_ROWS', '-1')
    const cfg = getPrintConfig('landscape')
    expect(cfg.maxRowsPerSheet).toBe(20)
    expect(cfg.minFillRows).toBe(5)
  })

  it('clamps maxRowsPerSheet to the landscape single-sheet ceiling (23)', () => {
    vi.stubEnv('PRINT_MAX_ROWS_PER_SHEET', '999')
    expect(getPrintConfig('landscape').maxRowsPerSheet).toBe(23)
  })

  it('clamps maxRowsPerSheet to the portrait single-sheet ceiling (36)', () => {
    vi.stubEnv('PRINT_MAX_ROWS_PER_SHEET', '999')
    expect(getPrintConfig('portrait').maxRowsPerSheet).toBe(36)
  })
})

describe('chunk', () => {
  it('splits an even array', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]])
  })
  it('keeps the remainder in a final shorter chunk', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })
  it('returns one empty sheet for an empty array', () => {
    expect(chunk([], 5)).toEqual([[]])
  })
  it('returns a single chunk when size exceeds length', () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]])
  })
})
