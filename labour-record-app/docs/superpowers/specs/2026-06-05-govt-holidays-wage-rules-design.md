# Government Holidays & Wage Rules Design

**Date:** 2026-06-05

---

## Overview

Two tightly related features:

1. **Government Holidays** — a global master list of holidays per year. Attendance defaults to `P` on weekdays, `A` on weekends, and `H` on govt holidays. If an admin changes a holiday day to `P` (employee worked), the wage calculator applies a multiplier automatically.

2. **Wage Rules** — per-establishment configurable calculation rules (holiday multiplier, OT rate, PF %, ESI %). A separate Masters page lets admins view, edit, and reset rules to defaults.

---

## Section 1 — Data Model

### GovtHoliday

```prisma
model GovtHoliday {
  id        String   @id @default(cuid())
  date      DateTime @unique
  name      String
  year      Int
  createdAt DateTime @default(now())
}
```

- `date` is unique — no duplicate holiday dates.
- `year` is a denormalized integer for fast filtering by year.
- Global — not tied to any establishment.

### WageRule

```prisma
model WageRule {
  id              String        @id @default(cuid())
  establishmentId String
  establishment   Establishment @relation(fields: [establishmentId], references: [id])
  ruleKey         String
  ruleValue       Float
  updatedAt       DateTime      @updatedAt

  @@unique([establishmentId, ruleKey])
}
```

**Supported rule keys and defaults:**

| ruleKey | Default | Meaning |
|---|---|---|
| `HOLIDAY_MULTIPLIER` | 2.0 | Wage multiplier when employee works on a govt holiday |
| `OT_MULTIPLIER` | 2.0 | Wage multiplier for overtime hours |
| `PF_EMPLOYEE_PCT` | 12.0 | PF deducted from employee (%) |
| `PF_EMPLOYER_PCT` | 13.0 | PF contributed by employer (%) |
| `ESI_EMPLOYEE_PCT` | 0.75 | ESI deducted from employee (%) |
| `ESI_EMPLOYER_PCT` | 3.25 | ESI contributed by employer (%) |

If no `WageRule` row exists for an establishment + ruleKey, the system uses the default value above.

---

## Section 2 — Government Holidays Page (`/holidays`)

A Masters-level page for managing the global holiday list.

**Features:**
- Year filter dropdown (defaults to current year) — shows holidays for that year only.
- Table: `#`, `Date` (dd MMM yyyy), `Day` (Mon/Tue…), `Holiday Name`, `Delete` button.
- Add Holiday form: `Date` (date input, required) + `Holiday Name` (text, required) + `Add Holiday` button.
- Holidays sorted by date ascending.
- No edit — delete and re-add to correct a mistake.
- Duplicate date is rejected with an error message.

**API routes:**
- `GET /api/holidays?year=2026` — list holidays for year
- `POST /api/holidays` — add holiday `{ date, name }`
- `DELETE /api/holidays/[id]` — delete by id

---

## Section 3 — Attendance Calendar with Holiday Indicators

The existing attendance grid gains three visual treatments:

| Day type | Column header | Cell default | Badge color |
|---|---|---|---|
| Weekday | Normal | `P` | Green |
| Weekend (Sat/Sun) | Darker background | `A` | Dim blue |
| Govt holiday | Amber + `★` suffix | `H` | Purple |
| Worked on holiday (H→P) | Amber + `★` | `P` | Orange |

**Default-fill behavior** (applied when a form task is first opened or when "Apply Defaults" is triggered):
- For each day in the cycle's month: if weekend → `A`; if matches a `GovtHoliday` → `H`; else → `P`.
- Admin can override any cell after defaults are applied.
- Days already filled are not overwritten on re-open (only truly empty cells get defaults).

**Visual cue for 2× pay:**
- If a cell's day is in the `GovtHoliday` set AND the value is `P`, the cell gets an orange border and orange badge — no extra action needed from the admin.

---

## Section 4 — Wage Calculation Logic

Daily rate = `(basic + DA + other allowances) / total working days in month`

For each day `d` (1 to N) in `dailyMarks`:

| `dailyMarks[d-1]` | Day type | Multiplier |
|---|---|---|
| `P` | Normal weekday | 1× daily rate |
| `P` | Govt holiday | `HOLIDAY_MULTIPLIER`× daily rate |
| `OT` | Any | 1× daily rate + OT hours × hourly rate × `OT_MULTIPLIER` |
| `H` | Govt holiday kept | 0 (not worked) |
| `L` | Leave | 0 |
| `A` | Absent | 0 |
| `''` | Unset | 0 |

Detection at calculation time:
1. Fetch all `GovtHoliday` records where `year = cycleYear` and month matches.
2. Build a `Set<number>` of holiday day-numbers.
3. For each day `d`: if `dailyMarks[d-1] === 'P'` AND `d ∈ holidaySet` → apply `HOLIDAY_MULTIPLIER`.

Wage rule lookup:
```ts
async function getRule(establishmentId: string, key: string, defaultValue: number): Promise<number> {
  const rule = await prisma.wageRule.findUnique({
    where: { establishmentId_ruleKey: { establishmentId, ruleKey: key } }
  })
  return rule?.ruleValue ?? defaultValue
}
```

PF and ESI are calculated on gross wages after the day-rate computation.

---

## Section 5 — Wage Rules Page (`/masters/wage-rules`)

A Masters-level page for configuring calculation rules per establishment.

**Layout:**
- Establishment selector at top (dropdown).
- Table of rules: `Rule Name`, `Current Value`, `Default`, `Edit` (inline pencil icon).
- Inline edit: click pencil → input replaces value cell → `Save` / `Cancel`.
- **Reset to Defaults** button (red/warning): deletes all `WageRule` rows for the selected establishment, reverting to system defaults. Confirmation required (confirm dialog).
- Shows "Using default" badge in grey when no custom rule is set for a row.

**API routes:**
- `GET /api/wage-rules?establishmentId=X` — list rules with defaults merged in
- `PUT /api/wage-rules` — upsert `{ establishmentId, ruleKey, ruleValue }`
- `DELETE /api/wage-rules?establishmentId=X` — reset all rules for establishment

---

## Section 6 — Navigation

- Add **Holidays** link to the Masters section of the sidebar (below Establishments / Employees).
- Add **Wage Rules** link to the Masters section of the sidebar.

---

## Out of Scope

- Automatic holiday import from government calendar APIs.
- Per-employee wage rule overrides.
- Retroactive recalculation of already-exported cycles.
- Holiday carry-forward / compensatory off tracking.
