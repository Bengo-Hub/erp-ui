# Sprint 4 — Reports, Users/Security, Settings & Dashboards

**Goal:** Statutory + payroll reports (DRY), user/role/permission/security administration, all settings, and the analytics dashboards.

## Scope (component-inventory.md §2, §4, §8, §9, §10)
**Reports** — build ONE `ReportLayout` + `useReport(reportType)` and render all 13 from config (fixes 13-duplicate-pages debt):
- `[orgSlug]/reports` (hub), `/p9`, `/p10a`, `/withholding-tax`, `/nssf`, `/nhif`, `/nita`, `/bank-net-pay`, `/muster-roll`, `/variance`, `/approvers`, `/cbs`, `/custom`.
- Shared `ReportFilters` (period/date pickers), `ReportDataTable`, `ReportExportActions` (jsPDF/xlsx). Preserve KRA PDF formats (snapshot-test).

**Users / Roles / Permissions / Security**
- `users` (list/hub), `/[id]` (profile), `/roles`, `/permissions`, `/account`.
- `security/dashboard`, `/settings`, `/backups`. Endpoints `/auth/listusers`, `/auth/roles`, `/auth/permissions`, `/auth/backups`, `/auth/security/*` (integrations.md §6). `TransferList` for role/permission assignment, 2FA, password policy.

**Settings**
- `settings` (system config), `/business`, `/currency-time`, `/general-hr`, `/branding` (deep-link to auth-ui editor), `/approvals`, `/expense-claims`.
- `settings/hrm/{departments,job-titles,job-groups,projects,unions,holidays,ess,appraisals}`.
- `settings/payroll/{formulas,[id],components,deductions,earnings,benefits,loans,defaults,banks,customize-payslip,scheduled}`.
- Endpoints: `/core/regional-settings`, `/hrm/payroll-settings/general-hr-settings`, `/core/branding-settings` (integrations.md §7). Reusable `ConfigCard`/`ConfigField`/`InlineEditableTable`.

**Dashboards** (recharts)
- `[orgSlug]` executive, `hrm` dashboard, `hrm/analytics`, `dashboard/ict`, `ess` (Employee Self-Service home). Port `KPICard`, `TrendChart`, `BarChart`, `BreakdownChart`, `PerformanceGauge` to recharts.

## API hooks needed
`use-reports`, `use-users`, `use-roles`, `use-permissions`, `use-backups`, `use-security`, `use-settings`, `use-payroll-settings`, `use-regional-settings`, `use-hrm-analytics`, `use-dashboard`.

## Acceptance criteria
- One report engine renders all 13 reports with correct data, filters, and PDF/Excel exports matching current output.
- User/role/permission admin + security/backups + 2FA functional.
- All settings pages persist correctly; currency/time + general-HR + payroll settings wired.
- Dashboards render recharts with real erp-api data; ESS works for staff with employee mapping.

## Dependencies
Sprints 1–3 (DataTable, RHF, export utils, RBAC).
