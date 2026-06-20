# Mustearly — Tamil Nadu Labour Compliance Manager

A Next.js application for generating statutory labour registers and wage records
for Tamil Nadu establishments (hospitals under the Clinical Establishments rules;
shops/hotels/etc. under the TN Shops & Establishments Act). It manages
establishments and employees, runs a monthly cycle workflow (attendance → wages →
overtime → fines → deductions → leave), and produces the prescribed forms as
print views / DOCX / PDF.

> **Note for contributors / agents:** This repo targets a newer Next.js whose APIs
> may differ from older training data — see `AGENTS.md`. Check
> `node_modules/next/dist/docs/` when a Next API behaves unexpectedly.

## Tech stack

- **Next.js 16** (App Router, server components + route handlers)
- **Prisma 7** with the **better-sqlite3** adapter (local SQLite file DB)
- **React 19**, Tailwind CSS
- **docxtemplater** / custom PDF for statutory form export
- **Vitest** (unit) + **Playwright** (e2e)

## Getting started

```bash
npm install                 # runs `prisma generate` via postinstall
cp .env.example .env        # set DATABASE_URL (defaults to file:./dev.db)
npx prisma migrate deploy   # create the SQLite schema
npx prisma db seed          # demo establishments + employees (idempotent)
npm run dev                 # http://localhost:3000
```

If you add or change a migration, **restart the dev server** — a server started
before the migration holds a stale Prisma client.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate && next build` |
| `npm start` | Run the production build |
| `npm test` | Unit tests (Vitest) — excludes `e2e/` |
| `npm run test:coverage` | Unit tests with V8 coverage |
| `npm run typecheck` | `tsc --noEmit` |
| `npx playwright test` | End-to-end tests (auto-starts the dev server) |
| `npx prisma db seed` | Seed demo data |

## Architecture

```
src/
  app/            Next.js routes (pages + /api route handlers)
    print/        Statutory register print views (paginated)
    forms/        Per-cycle data entry (attendance/wages/...)
  domain/
    calculations/ Pure wage / PF / attendance / overtime / leave math
    validations/  Input validators (establishment, employee, record numbers)
    workflow/     Kanban form-task state machine
  lib/
    export/       DOCX / PDF / form-data builders
    money.ts      Shared monetary rounding (round2)
    print-config* Print pagination config (pure + DB-backed)
    paginate.ts   List pagination helpers
  components/     Shared UI (sidebar, forms, pagination, ...)
  generated/      Prisma client (git-ignored; regenerated)
```

**Conventions**
- Pure domain logic lives in `src/domain` and `src/lib/*.ts` (no DB/Next imports)
  so it is unit-tested in isolation. DB access is isolated in `*-server.ts`
  modules and route handlers.
- API routes follow `try/catch → 422 { errors: [] } / 500 { error }`.
- Money is rounded only via `lib/money.ts:round2`.
- Print config and app preferences are stored in the `AppSetting` key/value table,
  editable at `/settings`.

## Configuration (env)

| Var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite connection string |
| `PRINT_MAX_ROWS_PER_SHEET` | 20 | Fallback for max employees per printed sheet (overridden by the Settings page) |
| `PRINT_MIN_FILL_ROWS` | 5 | Fallback below which print rows stretch to fill the page |

## Testing

- **Unit:** `npm test` — covers the calculation domain, validators, pagination,
  print config, and the workflow state machine.
- **E2E:** `npx playwright test` — navigation, CRUD, form entry, print views
  (incl. multi-sheet pagination), settings, and the wage-calculation pipeline.

CI (`.github/workflows/ci.yml`) runs install → migrate → unit tests → build on
every push/PR.
