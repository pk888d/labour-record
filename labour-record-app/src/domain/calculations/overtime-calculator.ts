export type OvertimeTotals = {
  totalOtHours: number
  otEarnings: number
  totalEarnings: number
}

export function calculateOvertimeTotals(
  dailyOt: number[],
  normalEarnings: number,
  otRate: number
): OvertimeTotals {
  const totalOtHours = round2(dailyOt.reduce((sum, h) => sum + Math.max(0, h), 0))
  const otEarnings = round2(totalOtHours * otRate)
  return { totalOtHours, otEarnings, totalEarnings: round2(normalEarnings + otEarnings) }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
