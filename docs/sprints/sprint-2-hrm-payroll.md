# Sprint 2 — HRM & Payroll

**Goal:** Port the core HR and payroll surfaces — the highest-value, highest-traffic part of the app.

## Scope (from component-inventory.md §3, §5)
**Employees & HR**
- `[orgSlug]/hrm/employees` (list + CRUD), `/[id]` (profile with tabs: core, contact, bank, kin, basic pay, benefits, deductions, earnings, loans, HR/personal/payment data).
- Add employee (multi-step RHF wizard) + import employees (file upload).
- `[orgSlug]/hrm/contracts` (manage + bulk actions), `[orgSlug]/hrm/org-chart` (React org-chart lib).
- Training: `courses`, `enrollments`, `evaluations`. Recruitment: `jobs`, `candidates`, `applications`, `onboarding`.

**Payroll** (from payrollRoutes.js)
- `[orgSlug]/payroll/process/[employmentType]` — multi-step wizard with **realtime progress** (`use-payroll-progress` over `/ws/payroll/`).
- `payroll/payslips/{view, print/[fromDate]/[toDate]}` (jsPDF batch print), `email-payslips`, `scheduled-emails`.
- `payroll/advances`, `claims`, `losses-damages`, `casual`, `consultants`, `overtime`, `formulas`.
- `payroll/spreadsheet/[employmentType]/[components]/[filter]` — editable pay-components grid (Basic Pay/Benefits/Deductions/Earnings/Loans).

## API hooks needed
`use-employees`, `use-employee`, `use-contracts`, `use-org-chart`, `use-training-*`, `use-recruitment-*`, `use-payroll` (process/payslips/audits), `use-advances`, `use-claims`, `use-losses-damages`, `use-formulas`, `use-payroll-spreadsheet`, `use-payroll-progress` (WS). Endpoints: `/hrm/employees`, `/hrm/contracts`, `/hrm/training`, `/hrm/recruitment`, `/hrm/payroll/*` (see integrations.md §5).

## Components to build/port
DataTable views, multi-step RHF forms, `PayslipPreview`, `ProcessPayrollStepper`, pay-component tables (Earnings/Deductions/Benefits/Loans), `FormulaSelector`, file upload, PDF/Excel export utilities.

## Acceptance criteria
- Employee CRUD + import + profile tabs work end-to-end against erp-api.
- Payroll process wizard runs a period and shows live progress; payslips view/print/email/schedule work; PDFs match current output (snapshot).
- Spreadsheet grid edits persist per component/employment-type/filter.
- All data via TanStack Query hooks; permission-gated; outlet/tenant headers correct.

## Dependencies
Sprint 1 (auth, ApiClient, layout, RBAC, WS-capable client). Pick org-chart + rich-text libs in Sprint 1/early here.
