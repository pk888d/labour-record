export type EstablishmentType =
  | 'SHOP'
  | 'HOSPITAL'
  | 'HOTEL'
  | 'PETROL_BUNK'
  | 'MEDICAL'
  | 'OIL_MILL'
export type EmployeeStatus = 'ACTIVE' | 'SUSPENDED' | 'EXITED'
export type FormTaskStatus =
  | 'NOT_STARTED'
  | 'DATA_ENTRY'
  | 'READY_FOR_REVIEW'
  | 'NEEDS_CORRECTION'
  | 'APPROVED'
  | 'EXPORTED'

export type WageFormulaPreset =
  | 'TN_MINIMUM_WAGES_HOSPITAL'
  | 'TN_SHOPS_ESTABLISHMENTS'

export type WageFormulaConfig = {
  preset: WageFormulaPreset
  fixedAllowance?: number
  hra?: number
  lwfRate?: number
  esiApplicable?: boolean
  lwfApplicable?: boolean
}

export const HOSPITAL_FORM_CODES = [
  'HOSPITAL_FORM_XI',
  'HOSPITAL_FORM_V',
  'HOSPITAL_FORM_XII',
  'HOSPITAL_FORM_XVII',
  'HOSPITAL_FORM_IV',
  'HOSPITAL_FORM_I',
  'HOSPITAL_FORM_II',
] as const

export const SHOP_FORM_CODES = [
  'SHOP_FORM_U',
  'SHOP_FORM_V',
  'SHOP_FORM_W',
  'SHOP_FORM_T',
  'SHOP_FORM_X',
] as const

export type FormCode =
  | (typeof HOSPITAL_FORM_CODES)[number]
  | (typeof SHOP_FORM_CODES)[number]

export const FORM_DISPLAY_NAMES: Record<FormCode, { name: string; ref: string }> = {
  // refs match the statutory .docx templates (Minimum Wages (TN) Rules for
  // hospital forms; TN Shops & Establishments Rules for shop forms).
  HOSPITAL_FORM_XI:   { name: 'Form XI — Register of Employees',            ref: 'Rule 27(6)' },
  HOSPITAL_FORM_V:    { name: 'Form V — Register of Muster Roll',            ref: 'Rule 27(5)' },
  HOSPITAL_FORM_XII:  { name: 'Form XII — Register of Wages',                ref: 'Rule 27(1)' },
  HOSPITAL_FORM_XVII: { name: 'Form XVII — Wage Slip',                       ref: 'Rule 32(9)' },
  HOSPITAL_FORM_IV:   { name: 'Form IV — Overtime Muster Roll cum Wages',    ref: 'Rule 25(2)' },
  HOSPITAL_FORM_I:    { name: 'Form I — Register of Fines',                  ref: 'Rule 21(4)' },
  HOSPITAL_FORM_II:   { name: 'Form II — Register of Deductions',            ref: 'Rule 21(4)' },
  SHOP_FORM_U:        { name: 'Form U — Employee Register',                  ref: 'Rule 16(1)' },
  SHOP_FORM_V:        { name: 'Form V — Register of Employment',             ref: 'Rule 38(1)(a)' },
  SHOP_FORM_W:        { name: 'Form W — Register of Wages',                  ref: 'Rule 16(1)' },
  SHOP_FORM_T:        { name: 'Form T — Wage Slip',                          ref: 'Rule 11(6)' },
  SHOP_FORM_X:        { name: 'Form X — Leave & Social Security Benefits',   ref: 'Rule 16(1)' },
}
