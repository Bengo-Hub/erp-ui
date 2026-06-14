# ERP-UI Component & Route Inventory

> The implemented Next.js 16 pages, routes, and shared components. ERP-UI is **HR/Ops only**;
> every route below resolves from the data-driven sidebar (`src/components/layout/menu-data.ts`)
> — there are no dead nav links.
>
> Source under [`src/`](../src). Architecture: [`architecture.md`](./architecture.md).

---

## 1. Auth & public routes

| Route | File | Purpose |
|---|---|---|
| `/{orgSlug}/auth/login` | `[orgSlug]/auth/login/page.tsx` | SSO sign-in |
| `/auth/callback`, `/{orgSlug}/auth/callback` | `auth/callback/page.tsx`, `[orgSlug]/auth/callback/page.tsx` | OIDC PKCE callback / token exchange |
| `/{orgSlug}/auth/select-outlet` | `[orgSlug]/auth/select-outlet/page.tsx` | post-login outlet picker (HQ users) |
| `/{orgSlug}/auth/forgot-password` | `[orgSlug]/auth/forgot-password/page.tsx` | request reset |
| `/{orgSlug}/auth/reset-password/[uid]/[token]` | `…/reset-password/[uid]/[token]/page.tsx` | set new password |
| `/{orgSlug}/unauthorized` | `[orgSlug]/unauthorized/page.tsx` | 403 |
| `/landing` | `(public)/landing/page.tsx` | marketing landing |
| `*` / errors | `not-found.tsx`, `error.tsx` | 404 / error boundary |

---

## 2. Dashboards

| Route | File | Purpose |
|---|---|---|
| `/{orgSlug}` | `[orgSlug]/page.tsx` | executive / HRM dashboard (recharts KPIs) |
| `/{orgSlug}/hrm` | `[orgSlug]/hrm/page.tsx` | HRM overview dashboard |
| `/{orgSlug}/ess` | `[orgSlug]/ess/page.tsx` | Employee Self-Service home |

Chart components: `components/charts/*`.

---

## 3. HRM — Employees / Contracts / Org chart

| Route | File | Purpose |
|---|---|---|
| `/{orgSlug}/hrm/employees` | `hrm/employees/page.tsx` (+ `_import-dialog`, `_employee-form`) | directory + CRUD + import |
| `/{orgSlug}/hrm/employees/new` | `hrm/employees/new/page.tsx` | create employee |
| `/{orgSlug}/hrm/employees/[id]` | `hrm/employees/[id]/page.tsx` (+ `_overview/_bank/_kin/_salary-tab`) | profile (tabs: overview, bank, kin, salary) |
| `/{orgSlug}/hrm/employees/[id]/edit` | `hrm/employees/[id]/edit/page.tsx` | edit employee |
| `/{orgSlug}/hrm/contracts` | `hrm/contracts/page.tsx` | employment contracts |
| `/{orgSlug}/hrm/org-chart` | `hrm/org-chart/page.tsx` | org chart |

> Employee **bank** tab = HR-owned free-text bank details (not a bank-institution master).

---

## 4. Payroll

| Route | File |
|---|---|
| `/{orgSlug}/payroll/process` | `payroll/process/page.tsx` (stepper wizard) |
| `/{orgSlug}/payroll/payslips` | `payroll/payslips/page.tsx` |
| `/{orgSlug}/payroll/payslips/[id]` | `payroll/payslips/[id]/page.tsx` |
| `/{orgSlug}/payroll/advances` | `payroll/advances/page.tsx` |
| `/{orgSlug}/payroll/claims` | `payroll/claims/page.tsx` |
| `/{orgSlug}/payroll/losses-damages` | `payroll/losses-damages/page.tsx` |

Shared: `payroll/_pay-record-manager.tsx`. Payroll **formulas** live under Settings
(`/settings/payroll/formulas`).

---

## 5. Leave & Attendance

| Route | File |
|---|---|
| `/{orgSlug}/hrm/leave/requests` (+ `/new`) | `hrm/leave/requests/page.tsx`, `…/new/page.tsx` |
| `/{orgSlug}/hrm/leave/balances` · `/entitlement` · `/types` · `/logs` | `hrm/leave/*/page.tsx` |
| `/{orgSlug}/hrm/attendance/shift-planner` | `hrm/attendance/shift-planner/page.tsx` (roster grid) |
| `/{orgSlug}/hrm/attendance/records` · `/timesheets` · `/work-shifts` · `/shift-rotations` · `/off-days` · `/rules` · `/ess-settings` | `hrm/attendance/*/page.tsx` |

Approve/reject flows use shared approval actions + status badges.

---

## 6. Appraisals / Performance / Training / Recruitment

| Route | File |
|---|---|
| `/{orgSlug}/hrm/appraisals` (+ `/[id]`, `/[id]/review`) | `hrm/appraisals/*` |
| `/{orgSlug}/hrm/appraisals/cycles` · `/goals` · `/templates` · `/questions` | `hrm/appraisals/*/page.tsx` |
| `/{orgSlug}/hrm/performance/reviews` | `hrm/performance/reviews/page.tsx` |
| `/{orgSlug}/hrm/training/courses` · `/enrollments` · `/evaluations` | `hrm/training/*/page.tsx` |
| `/{orgSlug}/hrm/recruitment/jobs` · `/candidates` · `/applications` | `hrm/recruitment/*/page.tsx` |

---

## 7. Reports — config-driven (no per-report page bodies)

A single `ReportRunner` (`components/reports/report-runner.tsx`) + `ReportFilters` renders any
report from `src/lib/reports-config.ts`. Each route is a ~4-line wrapper picking a config key,
eliminating the legacy 13-near-duplicate-pages debt.

| Route | Report |
|---|---|
| `/{orgSlug}/reports` | hub (all reports) |
| `/{orgSlug}/reports/p9` · `/p10a` · `/withholding-tax` · `/nssf` · `/nhif` · `/nita` | KRA statutory |
| `/{orgSlug}/reports/bank-net-pay` · `/muster-roll` · `/variance` | payroll |

Filters: year, month, department, region, employee, date-range. Exports stream PDF/Excel blobs.

---

## 8. Administration — Users / Security / Settings

| Route | File |
|---|---|
| `/{orgSlug}/users` · `/users/roles` · `/users/permissions` | `users/*/page.tsx` |
| `/{orgSlug}/security/dashboard` · `/security/backups` | `security/*/page.tsx` |
| `/{orgSlug}/settings` (company) · `/settings/currency-time` · `/settings/branding` | `settings/*/page.tsx` |
| `/{orgSlug}/settings/hrm/{departments,job-titles,job-groups}` | `settings/hrm/*/page.tsx` (+ `_tabs.ts`) |
| `/{orgSlug}/settings/payroll/{earnings,deductions,benefits,loans,formulas,statutory}` | `settings/payroll/*/page.tsx` (+ `_component-manager.tsx`, `_tabs.ts`) |

Reference-data CRUD screens share `components/crud/crud-manager.tsx` + `useCrudResource`.

---

## 9. Platform-owner routes

| Route | File |
|---|---|
| `/{orgSlug}/platform` | `platform/page.tsx` (platform overview) |
| `/{orgSlug}/platform/tenants` | `platform/tenants/page.tsx` |

Rendered only for platform owners (or the `codevertex` slug).

---

## 10. Cross-cutting components

| Area | Files |
|---|---|
| Shell / nav | `layout/{org-shell,app-sidebar,app-topbar,breadcrumb,menu-data}` |
| Auth | `auth/{auth-guard,callback-handler,permission-gate}` |
| Outlet / tenant | `outlet/{outlet-filter,tenant-filter}` |
| Subscription | `subscription/{subscription-banner,subscription-gate}` |
| UI primitives | `ui/{base,form,dialog,confirm-dialog,data-table,page-header,tabs,states,stepper,search-input}` (on `@bengo-hub/shared-ui-lib`) |
| CRUD | `crud/crud-manager` + `hooks/use-crud-resource` |
| Reports | `reports/{report-runner,report-filters}` |
| Charts | `charts/*` (recharts) |
| Providers | `providers/{query,auth,branding,theme}-provider` |
| Stores (zustand) | `store/{auth,outlet-filter,tenant-filter}` |
| API clients | `lib/api/*` (one per resource) + `lib/api/client.ts` (singleton) |
| Hooks | `hooks/use-*.ts` (one per resource; TanStack Query) |
| External links | `config/external-services.ts` |

---

## 11. Out of scope (NOT in this app — external links only)

No pages/forms/hooks/API clients for: customers · orders · address-book · pickup-station ·
service-type · **projects** · bank-institution/branch masters · inventory/products/stock ·
POS · finance/GL. Reached via the sidebar External Services group only. See
[`integrations.md` §A](./integrations.md).
</content>
