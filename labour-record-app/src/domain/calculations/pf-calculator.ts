import { round2 } from '@/lib/money'

export type PfMode = 'PERCENT' | 'FIXED' | 'NONE'

export type PfConfig = {
  mode: PfMode
  percent?: number
  ceiling?: number
  fixedAmount?: number
}

// EPF defaults: 12% of PF wage, statutory wage ceiling ₹15,000 → cap ₹1,800.
export const PF_DEFAULT_PERCENT = 12
export const PF_DEFAULT_CEILING = 15000
export const PF_STATUTORY_CAP = (PF_DEFAULT_PERCENT / 100) * PF_DEFAULT_CEILING // 1800

// pfWage is the wage PF is computed on (typically Basic + DA).
export function calculatePf(config: PfConfig, pfWage: number): number {
  if (config.mode === 'NONE') return 0
  if (config.mode === 'FIXED') return round2(config.fixedAmount ?? 0)

  const percent = config.percent ?? PF_DEFAULT_PERCENT
  const ceiling = config.ceiling ?? Infinity
  const cappedWage = Math.min(pfWage, ceiling)
  return round2(cappedWage * (percent / 100))
}
