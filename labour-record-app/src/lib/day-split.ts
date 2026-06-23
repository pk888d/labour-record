// Split a month's day numbers into two near-equal halves for the 2-page
// horizontal split of wide daily-column registers (Form IV/V).
export function splitDays(daysInMonth: number): { first: number[]; second: number[] } {
  const mid = Math.ceil(daysInMonth / 2)
  const all = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  return { first: all.slice(0, mid), second: all.slice(mid) }
}
