import { describe, expect, it } from 'vitest'
import { resolvePrintConfig, parseSettingValue, chunk } from './print-config'

describe('resolvePrintConfig', () => {
  it('uses defaults when raw values are undefined', () => {
    const cfg = resolvePrintConfig(undefined, undefined, 'landscape')
    expect(cfg.maxRowsPerSheet).toBe(20)
    expect(cfg.minFillRows).toBe(5)
  })

  it('uses provided raw values', () => {
    const cfg = resolvePrintConfig(15, 3, 'portrait')
    expect(cfg.maxRowsPerSheet).toBe(15)
    expect(cfg.minFillRows).toBe(3)
  })

  it('falls back to defaults for non-positive / non-integer raw values', () => {
    const cfg = resolvePrintConfig(0, -2, 'landscape')
    expect(cfg.maxRowsPerSheet).toBe(20)
    expect(cfg.minFillRows).toBe(5)
  })

  it('clamps max to the landscape single-sheet ceiling (23)', () => {
    expect(resolvePrintConfig(999, undefined, 'landscape').maxRowsPerSheet).toBe(23)
  })

  it('clamps max to the portrait single-sheet ceiling (36)', () => {
    expect(resolvePrintConfig(999, undefined, 'portrait').maxRowsPerSheet).toBe(36)
  })
})

describe('parseSettingValue', () => {
  it('treats blank / null / undefined as "clear" (null)', () => {
    expect(parseSettingValue('')).toEqual({ ok: true, value: null })
    expect(parseSettingValue('   ')).toEqual({ ok: true, value: null })
    expect(parseSettingValue(null)).toEqual({ ok: true, value: null })
    expect(parseSettingValue(undefined)).toEqual({ ok: true, value: null })
  })

  it('accepts a positive integer (string or number)', () => {
    expect(parseSettingValue('15')).toEqual({ ok: true, value: 15 })
    expect(parseSettingValue(15)).toEqual({ ok: true, value: 15 })
  })

  it('rejects zero, negatives, and non-integers', () => {
    expect(parseSettingValue('0').ok).toBe(false)
    expect(parseSettingValue('-3').ok).toBe(false)
    expect(parseSettingValue('1.5').ok).toBe(false)
    expect(parseSettingValue('abc').ok).toBe(false)
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
})
