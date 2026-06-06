# Form Templates

Place `.docx` template files here for DOCX export.

## Naming Convention

Templates must be named exactly as the form code (lowercase, underscores):

- `hospital/hospital_form_xii.docx` — Wages Register (Hospital)
- `hospital/hospital_form_v.docx` — Muster Roll (Hospital)
- `hospital/hospital_form_xi.docx` — Employee Register (Hospital)
- `hospital/hospital_form_xvii.docx` — Wage Slip (Hospital)
- `hospital/hospital_form_iv.docx` — Overtime Muster Roll (Hospital)
- `hospital/hospital_form_i.docx` — Fines Register (Hospital)
- `hospital/hospital_form_ii.docx` — Deductions Register (Hospital)
- `shop/shop_form_w.docx` — Wages Register (Shop)
- `shop/shop_form_t.docx` — Wage Slip (Shop)
- `shop/shop_form_u.docx` — Employee Register (Shop)
- `shop/shop_form_v.docx` — Employment Register / Muster Roll (Shop) — uses attendance/muster data
- `shop/shop_form_x.docx` — Leave Register (Shop)

## Template Variables

Templates use `{variable}` syntax (docxtemplater default delimiters).

### Common Variables (all templates)
- `{establishmentName}` — establishment name
- `{address}` — establishment address
- `{regCertNo}` — registration certificate number
- `{employerName}` — employer name
- `{managerName}` — manager name
- `{period}` — e.g., "June 2026"
- `{year}` — e.g., "2026"
- `{month}` — e.g., "6"

### Table Data
Templates use docxtemplater loop syntax `{#rows}{/rows}` for table rows.
Each row object contains the same fields as the TypeScript types in `src/lib/export/form-data.ts`.

## If No Template Found

If a template file is missing, the export API throws an error and skips DOCX generation (the error is captured in the `warnings` field of the export response).
PDF generation is skipped if DOCX generation fails.
The browser print view is always available regardless of template availability.
