# Print Config Settings Page (UI-editable, app-wide)

**Date:** 2026-06-19
**Status:** Approved design — pending implementation plan
**Builds on:** `2026-06-19-print-max-employees-per-sheet-design.md`

## Problem

`PRINT_MAX_ROWS_PER_SHEET` and `PRINT_MIN_FILL_ROWS` are deployment-level env
vars — invisible and uneditable to the operator using the app. They should be
adjustable from a **Settings** page reachable from the sidebar.

## Goals

1. A "Settings" entry in the sidebar opening a `/settings` page.
2. The two print-pagination values are editable there and persisted in the DB.
3. The saved value is the source of truth at print time; env then hardcoded
   defaults remain as fallback so nothing breaks before a value is saved.

## Non-Goals

- Per-establishment config (decided: app-wide single setting).
- Settings unrelated to print pagination (the page is built to grow, but only
  these two fields ship now — YAGNI).
- Authentication / per-user settings (the app is currently single-user/no-auth).

## Decisions (locked)

| Question | Decision |
|---|---|
| Scope | App-wide (single global value) |
| Storage | New generic key/value `AppSetting` DB table |
| Env vars | DB is source of truth; env seeds initial fallback, then hardcoded 20/5 |

## Data model

New Prisma model (SQLite, matches existing style):

```prisma
model AppSetting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

Keys used by this feature:
- `print.maxRowsPerSheet`
- `print.minFillRows`

A missing row means "not set" → fall back to env, then default. Values stored as
strings; parsed/validated on read and write. Requires a Prisma migration.

## Config resolution (`src/lib/print-config.ts`)

Split the current logic into a pure core plus a thin async I/O wrapper so the
math stays unit-testable without a DB.

```ts
const DEFAULT_MAX_ROWS_PER_SHEET = 20
const DEFAULT_MIN_FILL_ROWS = 5

export interface PrintConfig { maxRowsPerSheet: number; minFillRows: number }
export interface RawPrintSettings { maxRowsPerSheet: number | null; minFillRows: number | null }

// pure: defaults + single-sheet clamp. `raw*` may be undefined (not set).
export function resolvePrintConfig(
  rawMax: number | undefined,
  rawMin: number | undefined,
  orientation: 'landscape' | 'portrait',
): PrintConfig {
  const requestedMax = (Number.isInteger(rawMax) && (rawMax as number) > 0)
    ? (rawMax as number) : DEFAULT_MAX_ROWS_PER_SHEET
  const maxRowsPerSheet = Math.min(requestedMax, singleSheetCeiling(orientation)) // 23 / 36
  const minFillRows = (Number.isInteger(rawMin) && (rawMin as number) > 0)
    ? (rawMin as number) : DEFAULT_MIN_FILL_ROWS
  return { maxRowsPerSheet, minFillRows }
}

// async: DB row -> env -> undefined, then resolve.
export async function getPrintConfig(orientation): Promise<PrintConfig>

// async: saved raw values (or null) for the Settings UI to display.
export async function getRawPrintSettings(): Promise<RawPrintSettings>
```

`getPrintConfig` reads both `AppSetting` rows; for each, if absent it falls back
to the matching env var; whatever it resolves (possibly `undefined`) is handed to
`resolvePrintConfig`. The existing `chunk<T>` helper stays unchanged.

The resolution precedence for each value: **saved DB row → env var → hardcoded
default**, then the orientation clamp on max.

## API (`src/app/api/settings/route.ts`)

- `GET` → `{ maxRowsPerSheet: number | null, minFillRows: number | null }`
  (the saved raw values; `null` = not set).
- `PUT` → body `{ maxRowsPerSheet?: string | number | null, minFillRows?: string | number | null }`.
  For each provided field:
  - blank/empty/`null` → delete that `AppSetting` row (revert to env/default).
  - positive integer → upsert the row.
  - anything else → `422` with `{ errors: [...] }` naming the field.

Mirrors the validation/response style of `/api/cycles` (422 + `errors` array).
Uses `import { prisma } from '@/lib/prisma'`.

## UI

**Sidebar** (`src/components/sidebar.tsx`): add a new group:
```
{ section: 'System', items: [ { href: '/settings', label: 'Settings', icon: '⚙' } ] }
```

**Page** (`src/app/settings/page.tsx`, server component): force-dynamic; loads
`getRawPrintSettings()` and the effective ceiling, renders a client form.

**Form** (`src/components/settings-form.tsx`, client component, mirrors
`establishment-form.tsx`): two number inputs (Max employees per sheet, Min fill
rows), Save button → `PUT /api/settings`. Shows:
- current saved value or a "using default (N)" placeholder when null,
- inline field errors from a 422,
- a helper note: values above the per-sheet ceiling (~23 landscape / ~36 portrait)
  are capped so each sheet keeps its own header,
- a success indicator on save.

## Consuming the config (`src/app/print/[cycleId]/[formCode]/page.tsx`)

`getPrintConfig` becomes async, so fetch it once at the top of `PrintPage`:

```ts
const cfg = await getPrintConfig(orientation)
```

and pass `cfg` into `paginateForm` as a parameter, instead of `paginateForm`
calling `getPrintConfig` itself. This keeps `paginateForm` pure/synchronous and
does one DB read per print render. New `paginateForm` signature:

```ts
function paginateForm<T>(
  data: T[],
  cfg: PrintConfig,
  orientation: 'landscape' | 'portrait',
  render: (rows: T[], startIndex: number) => React.ReactNode,
): React.ReactNode
```

(It still calls `printDensity(rows.length, orientation, cfg.minFillRows)` and
`chunk(data, cfg.maxRowsPerSheet)`.)

The print route is already dynamic (`ƒ`), so saved changes reflect on next print.

## Files

| File | Change |
|---|---|
| `prisma/schema.prisma` | add `AppSetting` model |
| `prisma/migrations/*` | new migration |
| `src/lib/print-config.ts` | add `resolvePrintConfig` (pure), async `getPrintConfig`, `getRawPrintSettings`; keep `chunk` |
| `src/lib/print-config.test.ts` | retarget tests to `resolvePrintConfig` |
| `src/app/api/settings/route.ts` | **new** — GET/PUT |
| `src/app/settings/page.tsx` | **new** — server page |
| `src/components/settings-form.tsx` | **new** — client form |
| `src/components/sidebar.tsx` | add Settings nav item |
| `src/app/print/[cycleId]/[formCode]/page.tsx` | await config once, pass into `paginateForm` |
| e2e | settings page loads + save persists |

## Testing

- **Unit:** `resolvePrintConfig` — defaults when raw undefined; raw overrides; clamp
  per orientation; invalid (0/negative/non-integer) falls back. Validation/parse
  helper for the API (positive-int / blank-to-clear).
- **e2e:** Settings reachable from sidebar; set Max = 10, save, reload → value
  persists; (optional) a seeded multi-employee register now splits at 10; reset to
  blank → reverts to default. Runs against the seeded dev DB.

## Risks / Notes

- `getPrintConfig` is now async + does a DB read per print render — one indexed PK
  lookup, negligible.
- Migration must be applied in every environment (`prisma migrate deploy`) before
  the Settings page works; before any value is saved, behavior is identical to
  today (env/default).
- `.env.example` keeps documenting the env vars (now the fallback, not primary).
- AGENTS.md: this Next.js may differ from training data — confirm route handler /
  server-action and `revalidatePath` patterns against `node_modules/next/dist/docs/`
  during implementation.
