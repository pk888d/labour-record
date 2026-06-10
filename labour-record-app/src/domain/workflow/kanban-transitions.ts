import type { FormTaskStatus, EstablishmentType } from '@/types'
import { HOSPITAL_FORM_CODES, SHOP_FORM_CODES } from '@/types'

export const VALID_TRANSITIONS: Record<FormTaskStatus, FormTaskStatus[]> = {
  NOT_STARTED:        ['DATA_ENTRY'],
  DATA_ENTRY:         ['READY_FOR_REVIEW'],
  READY_FOR_REVIEW:   ['APPROVED', 'NEEDS_CORRECTION'],
  NEEDS_CORRECTION:   ['DATA_ENTRY'],
  APPROVED:           ['EXPORTED', 'DATA_ENTRY'],
  EXPORTED:           [],
}

export function isValidTransition(from: FormTaskStatus, to: FormTaskStatus): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to)
}

export function requiresComment(from: FormTaskStatus, to: FormTaskStatus): boolean {
  return from === 'READY_FOR_REVIEW' && to === 'NEEDS_CORRECTION'
}

// Only HOSPITAL uses Clinical Establishments forms; every other type falls
// under the TN Shops & Establishments Act and uses the shop form set.
export function getFormCodes(type: EstablishmentType): readonly string[] {
  return type === 'HOSPITAL' ? HOSPITAL_FORM_CODES : SHOP_FORM_CODES
}
