export function calculateEarnedLeaveClosing(
  opening: number,
  during: number,
  availed: number
): number {
  return Math.max(0, opening + during - availed)
}
