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

---

## Progress (revamp branch)

**Done ✅**
- **Data layer** (all TanStack Query, no inline fetch): `src/lib/api/{employees,hrm-settings,payroll,payroll-settings,drf,error}.ts`; hooks `use-employees`, `use-hrm-settings`, `use-payroll`, `use-payroll-settings`, `use-debounce`. Mutations invalidate queries + sonner toasts; 403 sub-gating via shared `apiClient`.
- **Shared UI primitives**: `form` (Input/Select/Textarea/Switch/Field), `dialog`, `data-table` + `Pagination`, `tabs`, `stepper`, `page-header`, `search-input`, `states` (Loading/Empty/Error), `crud/crud-manager` (reusable list+dialog-form+ConfirmDialog-delete).
- **HRM — Employees**: directory (`/hrm/employees`) with debounced search, department/status/outlet filters, pagination, row→profile, **import dialog**. Create/edit RHF form (`/new`, `/[id]/edit`). Profile (`/[id]`) tabs: Overview, Salary (upsert), Bank accounts CRUD, Next-of-kin CRUD.
- **HRM — Org structure** (`/settings/hrm/{departments,job-titles,job-groups}`): tabbed CRUD.
- **Payroll — Process** (`/payroll/process`): stepper Period→Preview→Run→Disburse; preview shows PAYE/NSSF/SHIF/housing/net + totals; Run and Disburse behind PermissionGate + ConfirmDialog; wrapped in SubscriptionGate.
- **Payroll — Payslips**: list (`/payroll/payslips`, search/period filter/paginate) + detail (`/[id]`) with gross/PAYE/NSSF/SHIF/net breakdown + browser **print/PDF** view.
- **Payroll — Settings** (`/settings/payroll/{earnings,deductions,benefits,loans,formulas,statutory}`): components CRUD, loans, formulas, and **tax/statutory config** (relief + rate toggles, ERP-owned/tenant-configurable).
- **Payroll — Claims / Advances / Losses & Damages**: CRUD pages (shared `PayRecordManager`).
- Sidebar menu extended with HR Settings + Payroll Settings sections. `pnpm build` green at each commit.

**Deferred (kept as PageStub / later sprint, build stays green)**
- Employee **contracts** (`/hrm/contracts`), **org chart** (needs an org-chart lib), **import column mapping** UI (current dialog posts file only).
- Training / recruitment screens (Sprint 2 stretch — left as stubs).
- Editable **pay-components spreadsheet grid** (`/payroll/spreadsheet/...`) — large bespoke surface, deferred.
- **Realtime `use-payroll-progress`** over `/ws/payroll/`: process flow currently uses request/response (`process-with-formulas` + optional `task_status`); WS progress to be wired when the socket contract is confirmed.
- Email-payslips / scheduled-emails UI (hook `useEmailPayslips` exists; screen deferred).
