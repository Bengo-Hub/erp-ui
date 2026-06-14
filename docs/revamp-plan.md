# ERP-UI Revamp Plan — Vue 3 → Next.js 16

> Plan for rebuilding `erp-ui` (HR + internal operations) from **Vue 3 / Vite / PrimeVue** to
> **Next.js 16 / React 19**, on the same stack as the platform's other UIs.
>
> **STATUS: Sprints 1–4 done & on `revamp`.** Foundation, HRM+payroll, leave/attendance/
> appraisals, and reports/admin/settings/dashboards are all implemented and building green.
> A data-ownership **conformance cleanup** has scrubbed the last decomposed-domain remnants
> (HR/Ops only). Sprint 5 (polish + cutover) is the remaining work, then `revamp` → `main`.

---

## 1. Why

- **Rejoin the platform.** Every other UI (treasury-ui, pos-ui, ordering-frontend, marketflow) is Next.js 16 + React 19 + shadcn on **@base-ui** + Tailwind v4 + TanStack Query + `@bengo-hub/shared-ui-lib`. erp-ui is the lone Vue/PrimeVue island and **cannot reuse any shared component, auth, API, or branding library** — it re-implements PKCE/SSO, branding, subscription gating, tables, and toasts from scratch.
- **Consistency.** One design system, one auth flow, one tenant/branding/manifest pattern across the suite.
- **Reduce debt.** The current app carries monolith leftovers (finance/CRM/POS/inventory permission maps, ecommerce utils, storefront assets), broken menu→route links, dual auth + dual branding systems, two chart libraries, manual caches, zero tests, and no TypeScript (see [`gaps-and-bugs.md`](./gaps-and-bugs.md)).
- **Maintainability.** A Sakai-derived ~790-line hardcoded mega-menu and 13 near-duplicate report pages become data-driven and DRY.

## 2. Target stack

Next.js **16.2** (App Router, React Compiler) · React **19.2** · TypeScript 5 · **@tanstack/react-query 5** · axios `ApiClient` singleton · **`@bengo-hub/shared-ui-lib`** (shadcn on @base-ui) + Tailwind v4 (`@tailwindcss/postcss`) + `tailwind-merge`/`clsx`/`cva` · **sonner** + shared `ConfirmDialog` · **react-hook-form + zod** · **recharts** · **zustand** · **next-themes** · **lucide-react** · **@ducanh2912/next-pwa** · date-fns · pnpm · Playwright. (Matches treasury-ui's `package.json`.)

## 3. Scope (what erp-ui owns)

HRM (employees, contracts, org chart, training, recruitment) · Payroll (process, payslips, advances, claims, losses/damages, formulas, overtime) · Leave & Attendance · Performance & Appraisals · Statutory reports (KRA P9/P10A, WHT, NSSF, NHIF/SHA, NITA, bank net pay, muster roll, variance, approvers, CBS, custom) · Users/Roles/Permissions/Security/Backups · Settings (HRM/payroll/business/currency/branding) · Dashboards (executive, HRM, ICT, ESS). All other domains remain **external links** only.

Full route/component map: [`component-inventory.md`](./component-inventory.md). API contracts: [`integrations.md`](./integrations.md). Target architecture: [`architecture.md`](./architecture.md).

## 4. Out of scope (data-ownership — NOT in this app)

Per master plan §0a, ERP-UI holds **no** data owned by another service. Excluded entirely
(external links only): Finance/GL, CRM/customers, Inventory/products/stock, POS, Ordering/
orders/**address_book**/**pickup_station**/**service_type**, Procurement, Manufacturing, Assets,
Notifications, **Projects** (milestones/budgets/tenders/timelogs — ERP keeps only internal
task_management), Billing, **bank-institution/branch masters** (employee bank details stay as
HR form fields). Also dropped from the Vue app: ecommerce cart/product utils, storefront
assets, legacy DRF Token login, the erp-api branding-settings system (use auth-api `by-slug`),
highcharts, moment, express. A conformance scan of `src/` confirms none of these are present.

## 5. Phasing (see `sprints/`)

> **Status:** Sprints 1–4 ✅ done.
> - **S1 Foundation** — Next 16 scaffold, `[orgSlug]` routing, SSO/PKCE, `ApiClient` +
>   TanStack Query, RBAC gate, shell + branding + per-tenant manifest, subscription gating.
> - **S2 HRM & Payroll** — employee directory + profile/CRUD (overview/bank/kin/salary tabs) +
>   import, contracts, org-chart, HRM org-structure settings, payroll process wizard, payslips
>   list/detail, advances/claims/losses, payroll-settings incl. formulas + tax/statutory.
> - **S3 Leave/Attendance/Appraisals** — leave (requests + approvals, apply, balances,
>   entitlement, types, logs); attendance (records, timesheets, shift-planner grid, work-shifts,
>   rotations, off-days, rules, ESS settings); recruitment (jobs/candidates/applications);
>   training (courses/enrollments/evaluations); appraisals (list/detail/review, cycles, goals,
>   templates, questions) + performance reviews. Shared approval actions + status badges.
> - **S4 Reports/Admin/Settings/Dashboards** — one config-driven `ReportRunner` for all KRA
>   statutory + payroll reports (no per-report pages); users/roles/permissions; security
>   dashboard + backups; company/currency/branding + HR/payroll settings; executive + HRM
>   dashboards (recharts) + ESS home.
> - **Conformance cleanup** ✅ — scrubbed decomposed-domain remnants (vestigial `project`
>   report filter, orphaned `/payroll/formulas` stub); docs streamlined to the HR/Ops set.
>
> **Backend caveat:** a few erp-api endpoints (leave logs, attendance rules, shift-planner
> resolve, appraisal responses) may still be in progress; pages render loading/empty/error
> states and fail gracefully. Realtime `use-payroll-progress` WS deferred to Sprint 5 (process
> flow uses request/response for now).

| Sprint | Theme | Outcome |
|---|---|---|
| [1 — Foundation](./sprints/sprint-1-foundation.md) ✅ | Next 16 scaffold, `[orgSlug]` routing, SSO/PKCE auth, `ApiClient` + TanStack Query, RBAC gate, layout + branding + manifest, subscription gating | Authenticated empty shell with branding, nav, guards |
| [2 — HRM & Payroll](./sprints/sprint-2-hrm-payroll.md) ✅ (core) | Employees, contracts, org chart, training, recruitment, full payroll (process wizard + payslips + advances/claims/losses + formulas + spreadsheet) | Core HR/payroll usable |
| [3 — Leave, Attendance, Appraisals](./sprints/sprint-3-leave-attendance-appraisals.md) ✅ | Leave lifecycle, attendance/shifts/timesheets, appraisals/cycles/goals, approval workflows | Performance + time management |
| [4 — Reports, Users/Security, Settings, Dashboards](./sprints/sprint-4-reports-admin-settings.md) ✅ | Config-driven `ReportRunner` for statutory reports, users/roles/permissions, security/backups, all settings, dashboards (recharts), ESS | Admin + reporting + analytics complete |
| [5 — Polish & Cutover](./sprints/sprint-5-polish-cutover.md) ⏳ | a11y/responsive, Playwright e2e, perf, PWA, Docker/CI, parity verification, DNS/ingress cutover | Production cutover, Vue app retired |

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Feature parity slip (143 views) | `component-inventory.md` is the checklist; acceptance criteria per sprint; parity sign-off in Sprint 5 |
| Payroll process wizard + realtime socket complexity | Tackle early (Sprint 2); port `/ws/payroll/` via a `use-payroll-progress` hook |
| Statutory report PDF/Excel fidelity (KRA formats) | Keep jsPDF/xlsx; snapshot-test outputs against current app |
| `shared-ui-lib` gaps (org chart, rich-text, transfer-list) | Pick React libs early (org-chart, tiptap, custom TransferList) |
| SSO redirect_uri registration for new host | Reuse flat `/auth/callback` already registered; coordinate with auth-api seed |
| RBAC regressions | Replace `ROUTE_PERMISSIONS` with per-route `requiredPermissions` metadata + `PermissionGate`; e2e cover role matrices |
| Tenant/branding/manifest edge cases | Reuse treasury-ui's `use-resolved-tenant`, `use-org-branding`, `generateMetadata` + manifest route patterns verbatim |
| Big-bang cutover | Run new app on a staging subdomain; verify parity before DNS switch; keep Vue app deployable for rollback |

## 7. Success criteria

- All in-scope routes from `component-inventory.md` ported with parity.
- Zero inline fetch/axios; all I/O via `ApiClient` + hooks.
- Uses `@bengo-hub/shared-ui-lib`; no PrimeVue.
- SSO/PKCE, per-tenant branding + manifest, subscription gating, RBAC all working.
- Playwright e2e green; TypeScript strict; Docker image builds + healthcheck on `/healthz`.
- Dead non-HR domains removed.
