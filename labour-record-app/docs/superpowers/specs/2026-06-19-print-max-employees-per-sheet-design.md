# Print: Configurable Max Employees Per Sheet + Fill-Page

**Date:** 2026-06-19
**Status:** Approved design — pending implementation plan
**Scope:** Print/export row-table registers only

## Problem

The print registers list every employee in one `.form-page` table. The density
helper (`printDensity`) stretches a sparse table to fill the sheet, but its 16mm
upper clamp means very few employees leave the page mostly empty, and a large
roster overflows onto a second page **without repeating the statutory form
header**. There is no operator control over how many employees appear per sheet.

## Goals

1. Two deployment-level config values control listing density per printed sheet.
2. When the roster exceeds the per-sheet cap, split into multiple sheets, each a
   complete statutory form (header repeated, continuous S.No).
3. When the roster is below a "min fill" threshold, stretch rows tall to fill the
   whole page instead of clustering at the top.

## Non-Goals

- Card-per-employee forms (Shop Form U employee register, Hospital Form XVII /
  Shop Form T wage slips). These keep rendering once with all data, unchanged.
- Per-print or UI-driven overrides. Config is set once per deployment.
- Horizontal pagination (splitting wide column sets). Out of scope.

## Decisions (locked)

| Question | Decision |
|---|---|
| Which forms | Row-table registers only (the `densityEligible` forms) |
| Config location | Environment variables |
| Fill behavior below threshold | Stretch rows taller (no blank padding rows) |
| Pagination layout | Repeat full form header on each sheet |

## Configuration

New file `src/lib/print-config.ts` parses two env vars once, with defaults and
clamping:

```
PRINT_MAX_ROWS_PER_SHEET   default 20   // max employees listed per sheet
PRINT_MIN_FILL_ROWS        default 5    // below this count, rows stretch to fill the page
```

```ts
export interface PrintConfig {
  maxRowsPerSheet: number
  minFillRows: number
}

export function getPrintConfig(orientation: 'landscape' | 'portrait'): PrintConfig
```

- Parse with `Number(...)`, fall back to defaults on `NaN`/missing/`<= 0`.
- **Single-sheet guarantee:** clamp `maxRowsPerSheet` to
  `floor(usableMm / 6.5)` for the orientation (≈23 landscape, ≈36 portrait),
  so a chunk can never overflow into an un-headered second page. `usableMm`
  mirrors `print-density.ts` (150 landscape / 235 portrait).
- `minFillRows` clamped to `>= 0`.

## Density logic (`src/lib/print-density.ts`)

`printDensity` gains a third parameter `minFillRows`. Only the upper row-height
clamp changes:

```ts
export function printDensity(
  rowCount: number,
  orientation: 'landscape' | 'portrait',
  minFillRows: number,
): CSSProperties {
  const rows = Math.max(rowCount, 1)
  const usableMm = orientation === 'landscape' ? 150 : 235
  // Below the min-fill threshold, lift the upper clamp so the few rows stretch
  // tall enough to fill the sheet. At/above it, keep the legibility clamp.
  const maxRowH = rows < minFillRows ? usableMm / rows : 16
  const rowH = Math.min(maxRowH, Math.max(6.5, usableMm / rows))
  const fs = rows <= 12 ? 11 : rows <= 25 ? 9.5 : rows <= 40 ? 8 : 7
  return {
    ['--ts-row-h']: `${rowH.toFixed(1)}mm`,
    ['--ts-cell-fs']: `${fs}px`,
  } as CSSProperties
}
```

Density is computed **per sheet** from that sheet's own row count, so a final
partial sheet (e.g. the leftover 3 of 23) also fills correctly.

## Pagination (`src/app/print/[cycleId]/[formCode]/page.tsx`)

Today the `switch` builds a single `content` node from the full data array.
Refactor each row-table case to expose:

- `data`: the row array (`wages` / `muster` / `employees` / `ot` / `fines` /
  `deductions` / `leave`).
- `renderSheet: (rows, startIndex) => ReactNode` — calls the form component with
  the sheet's slice and its starting index.

Then `page.tsx` paginates generically for `densityEligible` forms:

```ts
const { maxRowsPerSheet, minFillRows } = getPrintConfig(orientation)
const chunks = chunk(data, maxRowsPerSheet)   // see helper below
// ...
{chunks.map((rows, i) => (
  <div
    key={i}
    style={{
      ...printDensity(rows.length, orientation, minFillRows),
      breakAfter: i < chunks.length - 1 ? 'page' : 'auto',
    }}
  >
    {renderSheet(rows, i * maxRowsPerSheet)}
  </div>
))}
```

- Each chunk re-renders the whole form (header + table), so the **header repeats
  per sheet** with no change to form bodies.
- `break-after: page` on every chunk except the last forces a fresh sheet.
- Non-`densityEligible` forms (Form U / XVII / T) keep the current single-render
  path, no chunking.

### Chunk helper

Small pure helper (in `print-config.ts` or a `lib/array.ts`):

```ts
export function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]]   // always render at least one (blank) sheet
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
```

## Form component changes

Each row-table form gains an optional `startIndex` prop (default `0`) and
numbers rows `startIndex + i + 1` so S.No is continuous across sheets:

```ts
export function HospitalFormV({
  ctx, muster, startIndex = 0,
}: { ctx: CycleContext; muster: MusterRow[]; startIndex?: number }) {
  // ...
  <td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>
}
```

Affected forms (S.No cell is the only line touched per form):
`HospitalFormV`, `HospitalFormXII`, `HospitalFormXI`, `HospitalFormIV`,
`ShopFormW`, `ShopFormV`, `ShopFormX`.

Default `startIndex = 0` keeps any non-paginated call sites working unchanged.

**Forms I and II** (`HospitalFormI`, `HospitalFormII`) number rows from a data
field (`r.sno`), not the array index, so their numbering stays correct across
sheets with **no signature change** — they are paginated by `page.tsx` only.

## Testing

- **Unit (vitest):**
  - `printDensity`: below threshold lifts clamp (rows fill, `rowH ≈ usableMm/rows`);
    at/above threshold honors 16mm clamp; 6.5mm floor for crowded sheets.
  - `getPrintConfig`: defaults, bad/empty env values, single-sheet clamp per
    orientation, `minFillRows >= 0`.
  - `chunk`: even split, uneven remainder, empty array → one empty sheet,
    `startIndex` offsets (`i * size`).
- **E2E:** existing `e2e/07-print-views.spec.ts` covers print render smoke;
  extend if a multi-sheet assertion is cheap.

## Files

| File | Change |
|---|---|
| `src/lib/print-config.ts` | **new** — `getPrintConfig`, `chunk`, defaults + clamps |
| `src/lib/print-density.ts` | add `minFillRows` param, lift clamp below threshold |
| `src/app/print/[cycleId]/[formCode]/page.tsx` | per-form `data` + `renderSheet`, chunked render with per-sheet density + page breaks |
| `src/app/print/[cycleId]/[formCode]/hospital-form-*.tsx` (V, XII, XI, IV) | `startIndex` prop |
| `src/app/print/[cycleId]/[formCode]/shop-form-*.tsx` (W, V, X) | `startIndex` prop |
| `.env` | document `PRINT_MAX_ROWS_PER_SHEET`, `PRINT_MIN_FILL_ROWS` |
| `src/lib/*.test.ts` | unit tests |

## Risks / Notes

- `maxRowsPerSheet` set above the single-sheet clamp is silently reduced; this is
  intentional to preserve the header-per-sheet guarantee. Document the effective
  ceiling near the env var.
- Wide muster tables (per-day columns) are constrained by height, not width, at
  the 6.5mm floor, so the clamp math holds.
- AGENTS.md note: this Next.js build may differ from training data — confirm
  `break-after`/server-component env access against `node_modules/next/dist/docs/`
  during implementation.
