# Wide Register 2-Page Horizontal Split — Design

**Date:** 2026-06-23
**Status:** Approved design — pending implementation plan
**Context:** Phase-2 Wave C continuation (follows the print-fit `table-layout:fixed` fix)

## Problem
The daily-column statutory registers — Hospital **Form IV** (Overtime), Hospital
**Form V** (Muster Roll), and **Shop Form V** (Muster) — carry ~5 identity columns
+ **31 daily columns** + summary columns (~42 total). On A4 landscape, even with
`table-layout:fixed`, the identity columns (esp. **Name**) are crushed to be
unreadable. Operators want these split across **2 landscape pages** so each is
legible and matches the printed/filled statutory template.

## Decisions (locked)
| Question | Decision |
|---|---|
| Which forms | Hospital Form IV, Hospital Form V, Shop Form V |
| Split layout | Identity columns **repeated** on both pages; day columns **halved**; summary/earnings columns on **page 2** |
| Split point | `mid = ceil(daysInMonth / 2)` → days 1..mid on page 1, mid+1..end on page 2 |

## Architecture

### Pure helper
`src/lib/day-split.ts`:
```ts
export function splitDays(daysInMonth: number): { first: number[]; second: number[] } {
  const mid = Math.ceil(daysInMonth / 2)
  const all = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  return { first: all.slice(0, mid), second: all.slice(mid) }
}
```
Unit-tested (31 → [1..16]/[17..31], 30 → [1..15]/[16..30], 28 → [1..14]/[15..28]).

### Per-form rendering
Each of the 3 components returns a fragment of **two `.form-page` blocks**:
- **Part 1** (`<div className="form-page" style={{ breakAfter: 'page' }}>`): header +
  identity columns + day columns from `first`.
- **Part 2** (`<div className="form-page">`): header with a `(continued)` marker +
  the **same identity columns** + day columns from `second` + the summary columns.

Identity columns per form:
- **Form IV / Form V / Shop V:** S.No, Name, Father's/Husband's Name, Sex,
  Designation/Nature of work. (Form V also repeats Period of Work — commenced,
  ceased, rest interval — as part of identity since they're per-worker, not daily.)

Summary columns (page 2 only):
- **Form IV:** Total Overtime worked, Normal Rate, Overtime Rate, Normal Earnings,
  Overtime Earnings, Total Earnings.
- **Form V / Shop V:** Days Worked, No. of Days total hrs incl. weekly holidays,
  No. of Days leave with wages, No. of Days Absent, No. of Days counted for wages,
  Remarks.

To keep each component focused, extract the body-row identity cells and the
day-cell map into small local helpers so Part 1 and Part 2 don't duplicate the
per-row JSX more than necessary.

### Interaction with existing pagination
`page.tsx` / `paginateForm` are **unchanged**. `paginateForm` wraps each
employee-chunk's rendered form in a density `<div>` with `break-after:page`
between chunks. Since the form now emits 2 `.form-page` blocks (part 1 carries its
own `break-after:page`), the printed output is a grid:
**(employee-chunk) × (part 1, part 2)** — each on its own A4 landscape sheet.
The `startIndex` S.No prop still applies (same value to both parts of a chunk).

## Testing
- **Unit:** `splitDays` for 31/30/28-day months (sizes + boundaries).
- **e2e:** print Hospital Form IV and Form V for a single-sheet roster →
  assert `.form-page` count is **2** (the two parts), the form heading appears
  twice, a `(continued)` marker is present on page 2, and the **Name** column
  header appears on both parts.
- **Regression:** `10-print-pagination` Form V check still passes (its `.form-page`
  count is now 4 for the 25-employee bulk cycle = 2 chunks × 2 parts, still > 1;
  row count ≥ roster still holds because each employee renders once per part). The
  S.No continuity test is on **Form XI** (not split) — unaffected.

## Files
| File | Change |
|---|---|
| `src/lib/day-split.ts` (+ test) | **new** — `splitDays` |
| `src/app/print/[cycleId]/[formCode]/hospital-form-iv.tsx` | split into 2 parts |
| `src/app/print/[cycleId]/[formCode]/hospital-form-v.tsx` | split into 2 parts |
| `src/app/print/[cycleId]/[formCode]/shop-form-v.tsx` | split into 2 parts |
| `e2e/17-wide-register-split.spec.ts` | **new** |

## Risks / notes
- Density row-height var applies to both parts equally (computed from the
  employee-chunk row count) — consistent vertical fill on each sheet.
- Page 2's summary columns + ~15 day columns + identity (~26 cols) is still wider
  than page 1 (~21 cols) but well within legible range on landscape.
- Short months (28 days) still split 14/14 — always 2 pages for these forms, by
  design (the user wants the 2-page layout to match the template).
- Other registers (Form XII wages, Form XI employees, Shop W/U/X) are NOT daily-
  column forms and are unaffected.
