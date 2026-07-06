// Guards for client-submitted date fields. Routes previously did
// `new Date(b.someDate)` and persisted whatever came out — including Invalid
// Date (Prisma/SQLite accepts it silently) for garbage input, and a
// silently-rolled-over calendar date (e.g. "2026-02-30" -> March 2, 2026) for
// input that *looks* like a date but names a day that doesn't exist. These
// validators are pure so they can be unit-tested and reused by every route
// that accepts a date from a request body or query string.

export type DateParseResult = { date: Date | null; error?: string }

// Matches a bare "YYYY-MM-DD" date-only string (no time component). Per the
// ISO-8601 / ECMA-262 Date Time String spec, a string in this exact shape is
// parsed as UTC midnight, so we can safely round-trip it with the UTC getters
// below regardless of the server's local timezone.
const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

// Accepts:
//   - undefined / null / '' / whitespace-only -> { date: null } (no error —
//     optional date fields must stay optional; this is NOT a validation failure)
//   - a non-string value (number, boolean, object, array) -> error, even though
//     `new Date(1700000000000)` would "succeed" on an epoch number — request
//     bodies should send dates as strings, not raw numbers
//   - a string `new Date()` can't parse ("banana", "2026-13-45") -> error
//   - a "YYYY-MM-DD" string naming a day that doesn't exist in that month
//     ("2026-02-30", "2026-04-31") -> error, via a round-trip check, instead of
//     silently accepting whatever date `new Date()` rolled it over to
//   - any other valid ISO date/datetime string -> { date: <Date> }
export function parseDateInput(value: unknown, field: string): DateParseResult {
  if (value === undefined || value === null) return { date: null }

  if (typeof value !== 'string') {
    return { date: null, error: `${field} is not a valid date` }
  }

  const trimmed = value.trim()
  if (!trimmed) return { date: null }

  const date = new Date(trimmed)
  if (isNaN(date.getTime())) {
    return { date: null, error: `${field} is not a valid date` }
  }

  const isoMatch = ISO_DATE_ONLY.exec(trimmed)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    const roundTrips =
      date.getUTCFullYear() === Number(y) &&
      date.getUTCMonth() === Number(m) - 1 &&
      date.getUTCDate() === Number(d)
    if (!roundTrips) {
      return { date: null, error: `${field} is not a valid date` }
    }
  }

  return { date }
}

// Validate every listed date field present in `record` (row/body), collecting
// one error message per invalid field. Fields absent/empty are skipped (they
// are optional — required-ness is each route's own concern). `rowRef`
// prefixes each message (e.g. "Row 1: ") to mirror the record-numbers.ts
// pattern used for per-row validation in the wages/overtime bulk routes.
export function validateDateFields(
  record: Record<string, unknown>,
  fields: string[],
  rowRef?: string,
): string[] {
  const errors: string[] = []
  for (const field of fields) {
    const { error } = parseDateInput(record[field], field)
    if (error) errors.push(rowRef ? `${rowRef}: ${error}` : error)
  }
  return errors
}
