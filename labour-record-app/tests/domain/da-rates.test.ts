import { describe, it, expect } from 'vitest'
import { getDaRate, DA_RATES, ESTABLISHMENT_TYPES } from '@/domain/calculations/da-rates'
import type { EstablishmentType } from '@/types'

describe('getDaRate', () => {
  it('returns fixed DA for SHOP', () => {
    expect(getDaRate('SHOP')).toBe(7353)
  })
  it('returns fixed DA for HOSPITAL', () => {
    expect(getDaRate('HOSPITAL')).toBe(5544)
  })
  it('returns fixed DA for HOTEL', () => {
    expect(getDaRate('HOTEL')).toBe(8466)
  })
  it('returns fixed DA for PETROL_BUNK', () => {
    expect(getDaRate('PETROL_BUNK')).toBe(7247)
  })
  it('returns fixed DA for MEDICAL', () => {
    expect(getDaRate('MEDICAL')).toBe(7970)
  })
  it('returns fixed DA for OIL_MILL', () => {
    expect(getDaRate('OIL_MILL')).toBe(8950)
  })
  it('returns 0 for an unknown type', () => {
    expect(getDaRate('UNKNOWN' as EstablishmentType)).toBe(0)
  })
})

describe('ESTABLISHMENT_TYPES', () => {
  it('lists all six supported types', () => {
    expect(ESTABLISHMENT_TYPES).toEqual([
      'SHOP', 'HOSPITAL', 'HOTEL', 'PETROL_BUNK', 'MEDICAL', 'OIL_MILL',
    ])
  })
  it('DA_RATES has an entry for every supported type', () => {
    for (const t of ESTABLISHMENT_TYPES) {
      expect(DA_RATES[t]).toBeGreaterThan(0)
    }
  })
})
