// Money helpers. Single source of truth for monetary rounding so every wage /
// PF / OT / salary calculation rounds identically (half-up to 2 decimals).

// Round to 2 decimal places (paise). Guards against NaN/Infinity by returning 0,
// so a bad upstream value can never persist as NaN into a wage record.
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

// Format a number as INR for display (e.g. ₹1,234.50).
export function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)
}
