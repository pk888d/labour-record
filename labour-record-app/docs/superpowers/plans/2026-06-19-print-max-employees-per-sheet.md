# Print Max-Employees-Per-Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two env-configurable controls to the print registers — max employees per sheet (paginate, header repeated) and a min-fill threshold (stretch rows to fill the page when few employees).

**Architecture:** A new `print-config.ts` parses two env vars (with defaults + a single-sheet clamp) and provides a `chunk` helper. `printDensity` gains a `minFillRows` param that lifts its upper row-height clamp below the threshold. `page.tsx` slices each row-table register into chunks of `maxRowsPerSheet` and re-renders the whole form per chunk — each chunk wrapped in its own density `<div>` with `break-after: page` — so the statutory header repeats on every sheet. Index-numbered forms gain a `startIndex` prop for continuous S.No.

**Tech Stack:** Next.js (App Router, server components), React, TypeScript, vitest. Note: per `AGENTS.md`, this Next.js may differ from training data — check `node_modules/next/dist/docs/` if an API surprises you.

---

## Reference: current behavior

- `src/lib/print-density.ts` exports `printDensity(rowCount, orientation)` returning CSS vars `--ts-row-h` / `--ts-cell-fs`. Upper row-height clamp is a hard `16`mm; floor `6.5`mm. `usableMm` = 150 landscape / 235 portrait.
- `src/app/print/[cycleId]/[formCode]/page.tsx` has a `switch (formCode)` that, per form, fetches data, sets `rowCount`, and builds a single `content` node. `densityEligible` is `true` for row tables, `false` for wage-slip card forms (XVII, T). It wraps `content` in one `<div style={densityStyle}>`.
- Row-table forms render a complete `.form-page` (header + table). Index-numbered forms use `{i + 1}` for S.No: V, XII, XI, IV (hospital); W, V, X (shop). Forms I and II use `r.sno` (a data field) — no index change needed.
- No `tsconfig` test setup beyond vitest; no existing `*.test.ts` under `src/`. `npm test` runs `vitest run`. Typecheck via `npx tsc --noEmit`. Full check via `npm run build`.

---

## Task 1: `print-config.ts` — config parsing + chunk helper

**Files:**
- Create: `src/lib/print-config.ts`
- Test: `src/lib/print-config.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/print-config.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { getPrintConfig, chunk } from './print-config'

const ORIG = { ...process.env }
afterEach(() => {
  process.env = { ...ORIG }
})

describe('getPrintConfig', () => {
  it('returns defaults when env vars are unset', () => {
    delete process.env.PRINT_MAX_ROWS_PER_SHEET
    delete process.env.PRINT_MIN_FILL_ROWS
    const cfg = getPrintConfig('landscape')
    // default 20 is below the landscape single-sheet ceiling (floor(150/6.5)=23)
    expect(cfg.maxRowsPerSheet).toBe(20)
    expect(cfg.minFillRows).toBe(5)
  })

  it('reads valid env overrides', () => {
    process.env.PRINT_MAX_ROWS_PER_SHEET = '15'
    process.env.PRINT_MIN_FILL_ROWS = '3'
    const cfg = getPrintConfig('portrait')
    expect(cfg.maxRowsPerSheet).toBe(15)
    expect(cfg.minFillRows).toBe(3)
  })

  it('falls back to defaults on non-numeric / zero / negative values', () => {
    process.env.PRINT_MAX_ROWS_PER_SHEET = 'abc'
    process.env.PRINT_MIN_FILL_ROWS = '0'
    const cfg = getPrintConfig('landscape')
    expect(cfg.maxRowsPerSheet).toBe(20)
    expect(cfg.minFillRows).toBe(5)
  })

  it('clamps maxRowsPerSheet to the landscape single-sheet ceiling (23)', () => {
    process.env.PRINT_MAX_ROWS_PER_SHEET = '999'
    expect(getPrintConfig('landscape').maxRowsPerSheet).toBe(23)
  })

  it('clamps maxRowsPerSheet to the portrait single-sheet ceiling (36)', () => {
    process.env.PRINT_MAX_ROWS_PER_SHEET = '999'
    expect(getPrintConfig('portrait').maxRowsPerSheet).toBe(36)
  })
})

describe('chunk', () => {
  it('splits an even array', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]])
  })
  it('keeps the remainder in a final shorter chunk', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })
  it('returns one empty sheet for an empty array', () => {
    expect(chunk([], 5)).toEqual([[]])
  })
  it('returns a single chunk when size exceeds length', () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- print-config`
Expected: FAIL — `Cannot find module './print-config'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/print-config.ts`:

```ts
// Deployment-level controls for how the print registers list employees.
// Set via env (defaults in parens):
//   PRINT_MAX_ROWS_PER_SHEET  (20)  max employees listed on one sheet
//   PRINT_MIN_FILL_ROWS       (5)   below this count, rows stretch to fill the page
// maxRowsPerSheet is clamped to the single-sheet ceiling per orientation so a
// chunk can never overflow into an un-headered second page (see print-density.ts:
// usableMm / 6.5mm floor => 23 landscape, 36 portrait).

const DEFAULT_MAX_ROWS_PER_SHEET = 20
const DEFAULT_MIN_FILL_ROWS = 5

export interface PrintConfig {
  maxRowsPerSheet: number
  minFillRows: number
}

function posIntEnv(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

function singleSheetCeiling(orientation: 'landscape' | 'portrait'): number {
  const usableMm = orientation === 'landscape' ? 150 : 235
  return Math.floor(usableMm / 6.5) // 23 landscape, 36 portrait
}

export function getPrintConfig(orientation: 'landscape' | 'portrait'): PrintConfig {
  const requested = posIntEnv(process.env.PRINT_MAX_ROWS_PER_SHEET, DEFAULT_MAX_ROWS_PER_SHEET)
  const maxRowsPerSheet = Math.min(requested, singleSheetCeiling(orientation))
  const minFillRows = posIntEnv(process.env.PRINT_MIN_FILL_ROWS, DEFAULT_MIN_FILL_ROWS)
  return { maxRowsPerSheet, minFillRows }
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]] // always render at least one (blank) sheet
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- print-config`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/print-config.ts src/lib/print-config.test.ts
git commit -m "feat: print-config env parsing + chunk helper"
```

---

## Task 2: `printDensity` — min-fill stretch

**Files:**
- Modify: `src/lib/print-density.ts`
- Test: `src/lib/print-density.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/print-density.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { printDensity } from './print-density'

// helper: pull the numeric mm out of the returned CSS var
function rowMm(style: Record<string, string>): number {
  return Number(style['--ts-row-h'].replace('mm', ''))
}

describe('printDensity', () => {
  it('below the min-fill threshold, lifts the clamp so rows fill the sheet', () => {
    // landscape usableMm = 150; 3 rows, minFill 5 => 150/3 = 50.0mm (no 16 clamp)
    const style = printDensity(3, 'landscape', 5) as Record<string, string>
    expect(rowMm(style)).toBeCloseTo(50.0, 1)
  })

  it('at the threshold, keeps the 16mm legibility clamp', () => {
    // 5 rows, minFill 5 => not below threshold => clamp 16 applies (150/5=30 -> 16)
    const style = printDensity(5, 'landscape', 5) as Record<string, string>
    expect(rowMm(style)).toBeCloseTo(16.0, 1)
  })

  it('honors the 6.5mm floor for crowded sheets', () => {
    // 40 rows landscape => 150/40 = 3.75 -> floored to 6.5
    const style = printDensity(40, 'landscape', 5) as Record<string, string>
    expect(rowMm(style)).toBeCloseTo(6.5, 1)
  })

  it('treats zero rows as one row without throwing', () => {
    const style = printDensity(0, 'portrait', 5) as Record<string, string>
    expect(rowMm(style)).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- print-density`
Expected: FAIL — current `printDensity` takes 2 args; calls pass a 3rd `minFillRows`, and the threshold test expects 50mm but current code clamps to 16. TypeScript/runtime mismatch.

- [ ] **Step 3: Edit the implementation**

In `src/lib/print-density.ts`, change the signature and the clamp. Replace:

```ts
export function printDensity(
  rowCount: number,
  orientation: 'landscape' | 'portrait',
): CSSProperties {
  const rows = Math.max(rowCount, 1)
  // Usable vertical band for the table body (mm), after page padding + header.
  const usableMm = orientation === 'landscape' ? 150 : 235
  // Stretch to fill, but clamp so few rows don't become comically tall and many
  // rows don't get crushed below legibility.
  const rowH = Math.min(16, Math.max(6.5, usableMm / rows))
```

with:

```ts
export function printDensity(
  rowCount: number,
  orientation: 'landscape' | 'portrait',
  minFillRows: number,
): CSSProperties {
  const rows = Math.max(rowCount, 1)
  // Usable vertical band for the table body (mm), after page padding + header.
  const usableMm = orientation === 'landscape' ? 150 : 235
  // Below the min-fill threshold, lift the upper clamp so the few rows stretch
  // tall enough to fill the whole sheet. At/above it, keep the 16mm legibility
  // clamp. Floor at 6.5mm so crowded sheets stay legible.
  const maxRowH = rows < minFillRows ? usableMm / rows : 16
  const rowH = Math.min(maxRowH, Math.max(6.5, usableMm / rows))
```

(Leave the `fs` line and the `return` block unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- print-density`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/print-density.ts src/lib/print-density.test.ts
git commit -m "feat: printDensity stretches rows to fill below min-fill threshold"
```

---

## Task 3: Add `startIndex` prop to index-numbered forms

These 7 forms number S.No with `{i + 1}`. Add an optional `startIndex = 0` prop and change the cell to `{startIndex + i + 1}`. No tests here (presentational; covered by typecheck in Task 5 and existing `e2e/07-print-views.spec.ts`).

**Files (modify):**
- `src/app/print/[cycleId]/[formCode]/hospital-form-v.tsx`
- `src/app/print/[cycleId]/[formCode]/hospital-form-xii.tsx`
- `src/app/print/[cycleId]/[formCode]/hospital-form-xi.tsx`
- `src/app/print/[cycleId]/[formCode]/hospital-form-iv.tsx`
- `src/app/print/[cycleId]/[formCode]/shop-form-w.tsx`
- `src/app/print/[cycleId]/[formCode]/shop-form-v.tsx`
- `src/app/print/[cycleId]/[formCode]/shop-form-x.tsx`

- [ ] **Step 1: hospital-form-v.tsx**

Signature — replace:
```ts
export function HospitalFormV({ ctx, muster }: { ctx: CycleContext; muster: MusterRow[] }) {
```
with:
```ts
export function HospitalFormV({ ctx, muster, startIndex = 0 }: { ctx: CycleContext; muster: MusterRow[]; startIndex?: number }) {
```
S.No cell — replace `<td style={{ textAlign: 'center' }}>{i + 1}</td>` with
`<td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>`.

- [ ] **Step 2: hospital-form-xii.tsx**

Signature — replace:
```ts
export function HospitalFormXII({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
```
with:
```ts
export function HospitalFormXII({ ctx, wages, startIndex = 0 }: { ctx: CycleContext; wages: WagesRow[]; startIndex?: number }) {
```
S.No cell (the `{i + 1}` inside `wages.map((r, i) => ...`) — replace
`<td style={{ textAlign: 'center' }}>{i + 1}</td>` with
`<td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>`.
(Do NOT touch the `Array.from({ length: 17 }, (_, i) => ...({i + 1})...)` header line.)

- [ ] **Step 3: hospital-form-xi.tsx**

Signature — replace:
```ts
export function HospitalFormXI({ ctx, employees }: { ctx: CycleContext; employees: EmployeeRow[] }) {
```
with:
```ts
export function HospitalFormXI({ ctx, employees, startIndex = 0 }: { ctx: CycleContext; employees: EmployeeRow[]; startIndex?: number }) {
```
S.No cell (inside `employees.map((emp, i) => ...`) — replace
`<td style={{ textAlign: 'center' }}>{i + 1}</td>` with
`<td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>`.
(Do NOT touch the `Array.from({ length: 9 }, ...)` header line.)

- [ ] **Step 4: hospital-form-iv.tsx**

Signature — replace:
```ts
export function HospitalFormIV({ ctx, ot }: { ctx: CycleContext; ot: OvertimeRow[] }) {
```
with:
```ts
export function HospitalFormIV({ ctx, ot, startIndex = 0 }: { ctx: CycleContext; ot: OvertimeRow[]; startIndex?: number }) {
```
S.No cell (inside `ot.map((row, i) => ...`) — replace
`<td style={{ textAlign: 'center' }}>{i + 1}</td>` with
`<td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>`.

- [ ] **Step 5: shop-form-w.tsx**

Signature — replace:
```ts
export function ShopFormW({ ctx, wages }: { ctx: CycleContext; wages: WagesRow[] }) {
```
with:
```ts
export function ShopFormW({ ctx, wages, startIndex = 0 }: { ctx: CycleContext; wages: WagesRow[]; startIndex?: number }) {
```
S.No cell (inside `wages.map((row, i) => ...`) — replace
`<td style={{ textAlign: 'center' }}>{i + 1}</td>` with
`<td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>`.
(Do NOT touch the `Array.from({ length: 14 }, ...)` header line.)

- [ ] **Step 6: shop-form-v.tsx**

Signature — replace:
```ts
export function ShopFormV({ ctx, muster }: { ctx: CycleContext; muster: MusterRow[] }) {
```
with:
```ts
export function ShopFormV({ ctx, muster, startIndex = 0 }: { ctx: CycleContext; muster: MusterRow[]; startIndex?: number }) {
```
S.No cell (inside `muster.map((row, i) => ...`) — replace
`<td style={{ textAlign: 'center' }}>{i + 1}</td>` with
`<td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>`.

- [ ] **Step 7: shop-form-x.tsx**

Signature — replace:
```ts
export function ShopFormX({ ctx, leave }: { ctx: CycleContext; leave: LeaveRow[] }) {
```
with:
```ts
export function ShopFormX({ ctx, leave, startIndex = 0 }: { ctx: CycleContext; leave: LeaveRow[]; startIndex?: number }) {
```
S.No cell (inside `leave.map((row, i) => ...`) — replace
`<td style={{ textAlign: 'center' }}>{i + 1}</td>` with
`<td style={{ textAlign: 'center' }}>{startIndex + i + 1}</td>`.
(Do NOT touch the `Array.from({ length: 9 }, ...)` header line.)

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS — no errors (props are optional, so existing call sites in `page.tsx` still compile before Task 4).

- [ ] **Step 9: Commit**

```bash
git add "src/app/print/[cycleId]/[formCode]/hospital-form-v.tsx" \
  "src/app/print/[cycleId]/[formCode]/hospital-form-xii.tsx" \
  "src/app/print/[cycleId]/[formCode]/hospital-form-xi.tsx" \
  "src/app/print/[cycleId]/[formCode]/hospital-form-iv.tsx" \
  "src/app/print/[cycleId]/[formCode]/shop-form-w.tsx" \
  "src/app/print/[cycleId]/[formCode]/shop-form-v.tsx" \
  "src/app/print/[cycleId]/[formCode]/shop-form-x.tsx"
git commit -m "feat: startIndex prop for continuous S.No across print sheets"
```

---

## Task 4: Paginate in `page.tsx`

Refactor the `switch` so each row-table case yields a `data` array and a `renderSheet(rows, startIndex)` callback instead of a finished `content` node, then chunk + render per sheet. Card forms (XVII, T) keep the single-render path.

**Files:**
- Modify: `src/app/print/[cycleId]/[formCode]/page.tsx`

- [ ] **Step 1: Add imports**

After the existing import of `printDensity`, add:
```ts
import { getPrintConfig, chunk } from '@/lib/print-config'
```

- [ ] **Step 2: Replace the rendering model**

Replace the block from `let content: React.ReactNode` through the end of the `switch` and the `densityStyle` line. Current code:

```ts
  let content: React.ReactNode
  let rowCount = 0
  // Wage-slip layouts (Form XVII / Form T) lay out per-employee cards, not a row
  // table, so the row-height density does not apply to them.
  let densityEligible = true

  switch (formCode) {
    case 'HOSPITAL_FORM_XII': {
      const wages = await getWagesData(ctx)
      rowCount = wages.length
      content = <HospitalFormXII ctx={ctx} wages={wages} />
      break
    }
    // ... all other cases ...
  }

  const densityStyle = densityEligible ? printDensity(rowCount, orientation) : undefined
```

New code — for row-table forms set `data` + `renderSheet`; for card forms set `content` directly:

```ts
  // Row-table registers: chunked across sheets (header repeats per sheet).
  // `data` is the full row array; `renderSheet` renders one sheet's slice with a
  // starting index so S.No stays continuous.
  let data: unknown[] | null = null
  let renderSheet: ((rows: never[], startIndex: number) => React.ReactNode) | null = null
  // Card forms (Form XVII / Form T) render once with all data, no chunking.
  let content: React.ReactNode = null

  switch (formCode) {
    case 'HOSPITAL_FORM_XII': {
      const wages = await getWagesData(ctx)
      data = wages
      renderSheet = (rows, startIndex) => <HospitalFormXII ctx={ctx} wages={rows} startIndex={startIndex} />
      break
    }
    case 'HOSPITAL_FORM_V': {
      const muster = await getMusterData(ctx)
      data = muster
      renderSheet = (rows, startIndex) => <HospitalFormV ctx={ctx} muster={rows} startIndex={startIndex} />
      break
    }
    case 'HOSPITAL_FORM_XI': {
      const employees = await getEmployeeData(ctx)
      data = employees
      renderSheet = (rows, startIndex) => <HospitalFormXI ctx={ctx} employees={rows} startIndex={startIndex} />
      break
    }
    case 'HOSPITAL_FORM_XVII': {
      const wages = await getWagesData(ctx)
      content = <HospitalFormXVII ctx={ctx} wages={wages} />
      break
    }
    case 'HOSPITAL_FORM_IV': {
      const ot = await getOvertimeData(ctx)
      data = ot
      renderSheet = (rows, startIndex) => <HospitalFormIV ctx={ctx} ot={rows} startIndex={startIndex} />
      break
    }
    case 'HOSPITAL_FORM_I': {
      const fines = await getFinesData(ctx)
      data = fines
      // Form I numbers from r.sno (data field), so no startIndex is needed.
      renderSheet = (rows) => <HospitalFormI ctx={ctx} fines={rows} />
      break
    }
    case 'HOSPITAL_FORM_II': {
      const ded = await getDeductionsData(ctx)
      data = ded
      // Form II numbers from r.sno (data field), so no startIndex is needed.
      renderSheet = (rows) => <HospitalFormII ctx={ctx} deductions={rows} />
      break
    }
    case 'SHOP_FORM_W': {
      const wages = await getWagesData(ctx)
      data = wages
      renderSheet = (rows, startIndex) => <ShopFormW ctx={ctx} wages={rows} startIndex={startIndex} />
      break
    }
    case 'SHOP_FORM_T': {
      const wages = await getWagesData(ctx)
      content = <ShopFormT ctx={ctx} wages={wages} />
      break
    }
    case 'SHOP_FORM_U': {
      const employees = await getEmployeeData(ctx)
      content = <ShopFormU ctx={ctx} employees={employees} />
      break
    }
    case 'SHOP_FORM_V': {
      const muster = await getMusterData(ctx)
      data = muster
      renderSheet = (rows, startIndex) => <ShopFormV ctx={ctx} muster={rows} startIndex={startIndex} />
      break
    }
    case 'SHOP_FORM_X': {
      const leave = await getLeaveData(ctx)
      data = leave
      renderSheet = (rows, startIndex) => <ShopFormX ctx={ctx} leave={rows} startIndex={startIndex} />
      break
    }
  }

  // Build the printable body: chunked sheets for row tables, single node for cards.
  let body: React.ReactNode
  if (data && renderSheet) {
    const { maxRowsPerSheet, minFillRows } = getPrintConfig(orientation)
    const sheets = chunk(data, maxRowsPerSheet)
    body = sheets.map((rows, i) => (
      <div
        key={i}
        style={{
          ...printDensity(rows.length, orientation, minFillRows),
          breakAfter: i < sheets.length - 1 ? 'page' : 'auto',
        }}
      >
        {renderSheet(rows as never[], i * maxRowsPerSheet)}
      </div>
    ))
  } else {
    body = content
  }
```

> Note on `SHOP_FORM_U`: it is currently in the density-eligible group but renders employee *cards* in a grid, not a row table. Treat it as a card form here (single render, no chunking) — matching the spec's "card forms untouched" scope.

- [ ] **Step 3: Render `body` instead of the old wrapped content**

Replace the final return's body line. Current:
```tsx
      <PrintButton orientation={orientation} />
      <div style={densityStyle}>{content}</div>
```
New:
```tsx
      <PrintButton orientation={orientation} />
      {body}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS. (If a `never[]` cast complains at a call site, confirm the `renderSheet` signature matches Step 2 exactly.)

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: Build succeeds; `/print/[cycleId]/[formCode]` compiles.

- [ ] **Step 6: Commit**

```bash
git add "src/app/print/[cycleId]/[formCode]/page.tsx"
git commit -m "feat: paginate print registers into per-sheet chunks with repeated header"
```

---

## Task 5: Document env vars + full verification

**Files:**
- Modify: `.env`

- [ ] **Step 1: Add documented env vars to `.env`**

Append:
```
# Print registers: how many employees are listed per printed sheet, and the
# threshold below which rows stretch to fill the whole page. maxRowsPerSheet is
# capped to the single-sheet ceiling (~23 landscape / ~36 portrait) so each
# sheet repeats the statutory header without overflowing.
PRINT_MAX_ROWS_PER_SHEET=20
PRINT_MIN_FILL_ROWS=5
```

- [ ] **Step 2: Run the full unit suite**

Run: `npm test`
Expected: PASS — includes `print-config` (9) and `print-density` (4).

- [ ] **Step 3: Run the print e2e smoke test**

Run: `npx playwright test e2e/07-print-views.spec.ts`
Expected: PASS (or the same pass/skip baseline as before this change — if it requires a running server or seed data that is unavailable, note that it was unchanged rather than newly broken).

- [ ] **Step 4: Manual verification (optional but recommended)**

Run `npm run dev`, open a cycle's print URL for a row-table form (e.g. Form V) with:
- a roster larger than `PRINT_MAX_ROWS_PER_SHEET` → confirm multiple sheets, header repeated, S.No continuous (no restart at 1 on sheet 2).
- a roster of 2–3 employees → confirm rows stretch to fill the page.

- [ ] **Step 5: Update status.md**

Per repo convention (`CLAUDE.md`), add a Task Update entry to `status.md` recording this change.

- [ ] **Step 6: Commit**

```bash
git add .env status.md
git commit -m "docs: document print sheet env vars + status update"
```

---

## Self-review notes

- **Spec coverage:** Config (Task 1) ✓; density min-fill (Task 2) ✓; continuous S.No (Task 3) ✓; per-sheet chunking with repeated header + page breaks (Task 4) ✓; env documentation + verification (Task 5) ✓. Forms I/II paginate without `startIndex` per the corrected spec ✓. Card forms (U, XVII, T) untouched ✓.
- **Single-sheet guarantee:** enforced by the `singleSheetCeiling` clamp in Task 1 and exercised by its tests.
- **Type consistency:** `getPrintConfig` / `chunk` / `printDensity(rowCount, orientation, minFillRows)` / `startIndex?` props are used identically across Tasks 1–4.
