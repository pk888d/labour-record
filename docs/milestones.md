# Milestones

## Milestone 0 - Discovery and Template Audit

Goal: convert the current Word document set into clear implementation inputs.

Deliverables:

- Confirm all statutory forms required for hospital and shop establishments.
- Document mandatory fields for every form.
- Decide exact MVP form list.
- Create placeholder-enabled DOCX templates for MVP exports.
- Identify fields that differ between hospital and shop workflows.

Exit criteria:

- Every MVP form has a field map.
- Filled April 2026 examples are usable as acceptance references.

## Milestone 1 - Foundation

Goal: establish the application skeleton and database.

Deliverables:

- Project scaffold.
- Authentication baseline.
- User roles.
- Database schema and migrations.
- Establishment CRUD.
- Employee master CRUD.

Exit criteria:

- Admin can create a hospital and shop establishment.
- Operator can add active employees.
- Sensitive fields can be masked.

## Milestone 2 - Monthly Cycles and Kanban Board

Goal: create the operational compliance workflow.

Deliverables:

- Monthly cycle creation.
- Required form task generation by establishment type.
- Kanban board with columns and cards.
- Status transitions.
- Comments and assignment.
- Basic validation status on cards.

Exit criteria:

- A monthly cycle creates the correct hospital/shop cards.
- Cards can move through allowed statuses only.
- Review rejection requires comments.

## Milestone 3 - Core Monthly Data Entry

Goal: support the main recurring labour records.

Deliverables:

- Cycle employee snapshot.
- Attendance/muster entry.
- Wage register entry.
- Wage calculations.
- Wage slip data derivation.
- Leave entry for shop workflow.

Exit criteria:

- Hospital cycle can prepare Form XI, Form V, Form XII, and Form XVII data.
- Shop cycle can prepare Form U, Form W, Form T, and Form X data.
- Wage totals and net pay validations work.

## Milestone 4 - Exceptions and Compliance Details

Goal: support non-routine statutory records.

Deliverables:

- Overtime records.
- Fine records.
- Deduction/damage/loss records.
- Leave and social security details.
- Review screens for exception records.

Exit criteria:

- Hospital Form IV, Form I, and Form II data can be maintained.
- Shop Form X social security fields can be maintained.
- Exception forms participate in Kanban review and approval.

## Milestone 5 - DOCX Export

Goal: generate documents matching current statutory templates.

Deliverables:

- DOCX export engine.
- Form mapping for MVP forms.
- Export history.
- Versioned generated files.
- Full-cycle export option.

Exit criteria:

- Approved cards generate DOCX files.
- Generated April 2026 sample output can be compared against filled forms.
- Exports do not overwrite old files.

## Milestone 6 - Hardening and Release

Goal: prepare the MVP for real use.

Deliverables:

- Audit logs.
- Permission checks.
- Error handling.
- Backup/export strategy.
- Regression tests.
- Seed/demo data based on sample forms.

Exit criteria:

- User can run an end-to-end monthly cycle for one hospital and one shop.
- Reviewer can approve and export records.
- Auditor can view approved records and generated files.

## Suggested Timeline

Assuming one developer:

- Milestone 0: 3-5 days
- Milestone 1: 1-2 weeks
- Milestone 2: 1 week
- Milestone 3: 2 weeks
- Milestone 4: 1 week
- Milestone 5: 1-2 weeks
- Milestone 6: 1 week

Total MVP estimate: 7-10 weeks depending on export fidelity and DOCX template complexity.

