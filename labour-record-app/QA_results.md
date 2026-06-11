# QA Results — Mustearly E2E run

**Target:** http://localhost:3000 · **Tool:** Playwright (Chromium, headless)
**Outcome:** ✅ **36 / 36 functional checks pass · 0 uncaught console/page errors**

### Re-run log
- **2026-06-11 (run 2 — math verification + broken-link audit)** — see "Broken links / errors" and "Mathematical verification" sections below.
- **2026-06-11** — deterministic suite `e2e/qa-e2e.spec.ts` → **9/9 passed (42s)**; fresh regression sweep → **15/15 pages + 12/12 print forms HTTP 200, 0 console/page errors**. No regressions, no new defects.
- **2026-06-10** — initial full crawl (below): 36/36 checks pass, 0 errors.

---

## Broken links / error items (2026-06-11)
| Audit | Result |
|-------|--------|
| Internal links crawled (every `<a href>` across all pages) | **71** |
| **Broken links (HTTP ≥ 400)** | **0** ❌→ none |
| **Console / page errors** | **0** |
| Real routes (18) with valid IDs | 18/18 → 200 |
| e2e suite `qa-e2e.spec.ts` | **9/9 passed** |

> The only 404s in the app are intentional (removed `/wage-rules` + not-found for invalid IDs) — see `QA_404_report.md`. **No broken links and no error items were found.**

## Mathematical verification (evidence: input → expected → actual)
**Deterministic unit math:** 80/80 calc tests pass (da-rates, pf-calculator, salary-breakdown, attendance, rotation, wage-calculator). **Live in-app:** 21/21 verified.

### A. Salary breakdown — input: Total ₹20,000, DA ₹5,000, HRA ₹2,000, Other ₹1,000, PF 12%/ceiling ₹15,000, ESI 0.75%/₹21,000, LWF ₹10
| Calculation | Formula | Expected | Actual | ✓ |
|-------------|---------|---------:|-------:|:-:|
| Basic | Total − DA − HRA − Other | 12,000 | 12,000.00 | ✅ |
| PF | min(Basic+DA=17,000, 15,000) × 12% | 1,800 | 1,800.00 | ✅ |
| ESI | 0.75% × gross 20,000 | 150 | 150.00 | ✅ |
| LWF | pass-through | 10 | 10.00 | ✅ |
| Gross | Total + OT | 20,000 | 20,000 | ✅ |
| Deductions | PF + ESI + LWF | 1,960 | 1,960 | ✅ |
| **Net** | **Gross − Deductions** | **18,040** | **18,040** | ✅ |

### B. ESI threshold
| Case | Expected | Actual | ✓ |
|------|---------:|-------:|:-:|
| gross 25,000 > threshold 21,000 → ESI | 0 | 0.00 | ✅ |
| threshold raised to 30,000 → ESI (0.75% × 25,000) | 187.50 | 187.50 | ✅ |

### C. PF modes
| Mode | Expected | Actual | ✓ |
|------|---------:|-------:|:-:|
| FIXED (entered 1,500) | 1,500 | 1,500.00 | ✅ |
| NONE | 0 | 0.00 | ✅ |

### D. DA per firm type (da-rates)
Shop ₹7,353 ✅ · Hospital ₹5,544 ✅ · Hotel ₹8,466 ✅ · Petrol Bunk ₹7,247 ✅ · Medical ₹7,970 ✅ · Oil Mill ₹8,950 ✅

### E. Wage Register (Form XII) — live row: Basic 5,200 · DA 1,170 · Gross 6,730 · Deductions 678.25
| Calculation | Expected | Actual | ✓ |
|-------------|---------:|-------:|:-:|
| Total Normal = Basic + DA | 6,370.00 | 6,370.00 | ✅ |
| Net = Gross − Amount Deducted | 6,051.75 | 6,051.75 | ✅ |

### F. Muster (Form V) — 26 P + 4 H month
| Calculation | Expected | Actual | ✓ |
|-------------|---------:|-------:|:-:|
| Days Worked = P + OT (excludes H) | 26 | 26 | ✅ |
| Days counted for wages = worked + holidays + leave | 30 | 30 | ✅ |

**Math verdict: 21/21 live + 80/80 unit calculations correct.** No arithmetic defects.

> Two checks initially reported FAIL but were **test-harness selector bugs, not app defects** — both verified to pass with corrected selectors (details below). No application bug was found.

## Summary by area

| Area | Result |
|------|--------|
| 1. Authentication | N/A — no login (local single-user tool); no auth wall |
| 2. Navigation (6 sidebar links, TopNav Home/Back/Forward, /wage-rules 404) | ✅ all pass |
| 3. Dashboard (summary cards, 4-view switcher, persistence) | ✅ all pass |
| 4. Establishments (native + JS validation) | ✅ pass |
| 5. Employees (empty submit, invalid mobile, salary live-preview/apply) | ✅ pass |
| 6. Holidays (load defaults, Double-Wage column, empty-add error) | ✅ pass |
| 7. Monthly Cycles (Generate FY control) | ✅ pass |
| 8. Forms / Kanban (form-task entry, kanban home) | ✅ pass |
| 9. Print — 12 statutory forms + orientation toggle + watermark | ✅ 12/12 |
| 10. Salary slips (list + Original/Photocopy sheet) | ✅ pass |
| 11. Exports | ✅ page loads; DOCX export returns 201 (PDF step warns only if LibreOffice absent) |
| 12. Error states (404 unknown route, bad establishment/cycle/employee IDs) | ✅ all 404 |

## Edge cases tested
- Empty establishment submit → blocked by native `required` (stays on form). ✓
- Establishment name `"ab"` (< 3 chars) → inline error *"…at least 3 characters"*. ✓
- Empty employee submit → required-field errors listed. ✓
- Invalid mobile `123` → *"Mobile must be 10 digits"*. ✓
- Empty holiday add → *"Please select a date"*. ✓
- Print orientation toggle → page width 1123px (landscape) → 794px (portrait). ✓
- 4 unknown/invalid-ID routes → all HTTP 404 / not-found, no crash. ✓

## Issues logged

### Defects (application)
- **None.** No uncaught console errors, no page errors, no broken links, no crashes across all crawled pages.

### Test-harness issues found & fixed (NOT app bugs)
1. **Ambiguous selector** — `getByLabel('Name')` matched 3 fields (Establishment Name / Employer Name / Manager Name). Fixed with `getByLabel('Name', { exact:true })`. Re-verified: min-length validation works.
2. **Stale selector** — the Salary Setup button was renamed *"Compute breakdown" → "Apply to wage defaults"* (a live preview now computes automatically as you type). Old selector timed out. Re-verified: live preview shows Basic ₹9,456 and Apply fills the field.

### Minor recommendation (non-blocking, accessibility/testability)
- Several **employee-form inputs lack `aria-label`** (Mobile, Email, UAN, ESI No, Aadhaar, Bank, IFSC, Father/Spouse, etc.), while the salary fields have them. They work and are labelled visually, but adding `aria-label` (or `htmlFor`/`id` association) would improve screen-reader support and make automation more robust. *Optional.*

## Environment note
- DOCX→PDF auto-conversion logs `soffice: command not found` (LibreOffice not installed). This is environmental, not an app error — the `.docx` files generate correctly.

## Deterministic re-run
The validated flows are codified in **`e2e/qa-e2e.spec.ts`** (Playwright). It derives record IDs through the UI so it runs against any seeded DB, and guards against app-origin console/page errors.

```
npx playwright test e2e/qa-e2e.spec.ts
→ 9 passed (≈46s): Navigation · Dashboard · Establishments · Employees ·
  Holidays · Cycles · Print (12 forms) · Salary slips · Error states
```

(Removed the obsolete `e2e/10-wage-rules.spec.ts` since that page no longer exists.)

## Verdict
The application is **stable and functional end-to-end**. All happy paths and the tested edge cases behave correctly with proper validation and 404 handling, and there are **no console/page errors**. The two initial failures were test-selector bugs, fixed; the suite now runs **9/9 green** deterministically.
