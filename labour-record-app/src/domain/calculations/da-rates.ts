import type { EstablishmentType, WageFormulaPreset } from '@/types'

// Fixed monthly Dearness Allowance (₹) per establishment type, as notified.
// Used as the default DA when adding/editing an employee; still overridable.
export const DA_RATES: Record<EstablishmentType, number> = {
  SHOP: 7353,
  HOSPITAL: 5544,
  HOTEL: 8466,
  PETROL_BUNK: 7247,
  MEDICAL: 7970,
  OIL_MILL: 8950,
}

export const ESTABLISHMENT_TYPES: EstablishmentType[] = [
  'SHOP', 'HOSPITAL', 'HOTEL', 'PETROL_BUNK', 'MEDICAL', 'OIL_MILL',
]

export const ESTABLISHMENT_TYPE_LABELS: Record<EstablishmentType, string> = {
  SHOP: 'Shop',
  HOSPITAL: 'Hospital',
  HOTEL: 'Hotel',
  PETROL_BUNK: 'Petrol Bunk',
  MEDICAL: 'Medical',
  OIL_MILL: 'Oil Mill',
}

export function getDaRate(type: EstablishmentType): number {
  return DA_RATES[type] ?? 0
}

// Only HOSPITAL uses the Clinical Establishments forms + minimum-wages preset.
// All other types fall under the TN Shops & Establishments Act.
export function getWagePreset(type: EstablishmentType): WageFormulaPreset {
  return type === 'HOSPITAL' ? 'TN_MINIMUM_WAGES_HOSPITAL' : 'TN_SHOPS_ESTABLISHMENTS'
}

export function getFormFamily(type: EstablishmentType): 'hospital' | 'shop' {
  return type === 'HOSPITAL' ? 'hospital' : 'shop'
}
