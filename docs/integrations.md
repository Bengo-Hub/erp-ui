# ERP-UI Integrations & Data-Ownership Map

> Every backend integration `erp-ui` consumes, and the cross-service ownership boundary it
> must respect. ERP-UI is **HR/Ops only** — it calls erp-api (`/api/v1/hrm/*` + admin/settings),
> the auth-service (SSO + branding), and the subscriptions-service for gating. It consumes
> **nothing** from inventory / ordering / logistics / marketflow / projects / finance-GL; those
> are reached as external menu links only.
>
> See [`architecture.md`](./architecture.md) for the auth/tenant header mechanics. Type these
> contracts in `src/lib/api/*.ts`.

---

## A. Data-ownership map (authoritative — master plan §0a / §0a-map)

ERP-UI must NOT reimplement or hold data owned by another service. The verified surface:

| Service | What ERP consumes | What it is NOT allowed to own |
|---|---|---|
| **auth-service (SSO)** | JWT/JWKS identity, `/auth/me`, branding `GET /api/v1/tenants/by-slug/{slug}`, tenant outlets. ERP is a **client only**. | OAuth handling, tenant/outlet mastering (auth owns tenants/outlets; ERP shadows them) |
| **treasury (finance-service)** | (backend-only) payroll disbursement + GL posting via events; ERP-UI itself only surfaces payroll/bank-net-pay reports | Finance GL, chart-of-accounts, invoices, payout rails, **bank-institution/branch masters** |
| **subscriptions-service** | feature/limit gating (`/tenants/{id}/subscription`), mutations-only | plan/billing management (→ billing UI) |
| **inventory-service** | nothing | products, stock, warehouses, procurement, manufacturing, assets |
| **ordering-service** | nothing | customers, orders, **address_book**, **pickup_station**, **service_type** |
| **marketflow (CRM)** | nothing | customers / CRM |
| **projects-service** | nothing | **projects**, milestones, budgets, tenders, timelogs (ERP keeps only its internal `task_management`) |
| **POS** | nothing | sales, registers |

**KEPT in ERP-UI (HR-owned, legitimate):**
- Employee **bank details** as free-text form fields (`bank_name`, `branch_name`,
  `account_number`, `account_name`) on the employee — *not* a bank-institution/branch master.
- Employee **personal/contact address** — HR-owned.
- `region` / county — a simple reference (no owning service).

These boundaries are enforced in code: `src/` contains no project / customer / order /
pickup-station / address-book / service-type / bank-master / inventory / finance-GL page, form,
hook, or API client. The conformance cleanup removed the last vestigial remnant (a `project`
report-filter key) — see [`gaps-and-bugs.md`](./gaps-and-bugs.md).

---

## 1. Services consumed

| Target | Base URL (env) | Auth | Purpose |
|---|---|---|---|
| **erp-api** | `NEXT_PUBLIC_API_URL` + `/api/v1` | Bearer JWT (SSO) + tenant headers | All HRM/payroll/leave/users/settings data |
| **auth-api (SSO)** | `NEXT_PUBLIC_SSO_URL` / `NEXT_PUBLIC_AUTH_URL` | OIDC PKCE; public `by-slug` endpoints | Login, token, `/auth/me`, branding, outlets |
| **subscriptions-api** | `NEXT_PUBLIC_SUBSCRIPTIONS_API_URL` | Bearer + tenant headers | Plan/feature/limit gating (mutations-only) |
| **External UIs** | per-service `NEXT_PUBLIC_*_UI_URL` | n/a (new tab) | Cross-domain navigation only |

### 1.1 Standard headers on erp-api / subscriptions calls (`src/lib/api/client.ts`)

| Header | Value | When |
|---|---|---|
| `Authorization` | `Bearer <access_token>` | always when authed |
| `X-Tenant-ID` | tenant UUID (validated) | tenant users (not platform owners) |
| `X-Tenant-Slug` | tenant slug | tenant users |
| `?tenantId=<uuid>` (query) | selected tenant | **platform owners** drilling into a tenant (omits `X-Tenant-*`) |
| `X-Outlet-ID` | selected outlet id | when an outlet is selected |

FormData requests drop `Content-Type` so the browser sets the multipart boundary.

---

## 2. SSO / OIDC (auth-api) — `src/lib/auth/*`, `src/hooks/useMe.ts`

| Method | Path | Body / params | Notes |
|---|---|---|---|
| GET (redirect) | `${SSO}/api/v1/authorize` | `response_type=code`, `client_id`, `redirect_uri=<origin>/auth/callback`, `scope=openid profile email offline_access`, `state`, `code_challenge`, `code_challenge_method=S256`, optional `tenant`/`org` | PKCE; flat `/auth/callback` redirect_uri |
| POST | `${SSO}/api/v1/token` | form-urlencoded: `grant_type=authorization_code`, `code`, `code_verifier`, `client_id`, `redirect_uri` | exact redirect_uri match |
| POST | `${SSO}/api/v1/auth/refresh` | JSON `{refresh_token, client_id}` | one-time retry on 401 |
| GET (redirect) | `${SSO}/api/v1/auth/logout` | `?post_logout_redirect_uri=<origin>` | clears shared session |
| GET | `${SSO}/api/v1/auth/me` | Bearer | step (a): identity + global roles + auth perms |
| GET | `${ERP}/api/v1/auth/me/` | Bearer + tenant headers | step (b): service role + service permissions (404 = JIT not provisioned → fall back) |

**JWT claims read:** `tenant_id`, `tenant_slug`, `is_hq_user`, `outlet_id`, `is_platform_owner`, `sub`.
OAuth is SSO-only — no `client_secret` in this repo.

---

## 3. Branding & outlets (auth-api, public)

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `${AUTH_URL}/api/v1/tenants/by-slug/{slug}` | public | `{name, brand_colors:{primary,secondary}, logo_url, ...}` → CSS vars + title; cached |
| GET | `${AUTH_URL}/api/v1/tenants/{slug}/outlets` | public | `[{id,code,name,use_case,is_hq,status}]` |

Branding edits are **not** in-app → deep-link to auth-ui. The per-tenant PWA manifest is
generated server-side at `[orgSlug]/manifest.webmanifest`.

---

## 4. Subscriptions API — `src/hooks/use-subscription.ts`

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `${SUBSCRIPTIONS_API_URL}/api/v1/tenants/{tenant_id}/subscription` | Bearer + `X-Tenant-*` | `{status, plan, features[], limits{}, expires_at/...}` |

Fail-open (null on error). Platform owners short-circuit to a synthetic active/enterprise plan.
erp-api signals gating with `403 {code:'subscription_inactive'|upgrade:true}` → sonner toast
with an Upgrade action (no logout). Gating applies to **mutations only**.

---

## 5. erp-api — HRM / Payroll / Leave (DRF, trailing-slash, paginated)

Verbs via `ApiClient`: `GET list` (`?page,page_size,search,…`), `GET {id}/`, `POST`,
`PUT {id}/`, `PATCH {id}/`, `DELETE {id}/`, `POST {id}/{action}/`, blob export. Base paths
(typed in `src/lib/api/*.ts`):

| Domain | Base path | Module |
|---|---|---|
| Employees (+ status/salary/benefits/earnings/deductions/bank/kin) | `/hrm/employees`, `/hrm/employee-*`, `/hrm/salary-details`, … | `employees.ts` |
| Contracts | `/hrm/contracts` | `contracts.ts` |
| Payroll (process/payslips/advances/claims/losses-damages/audits) | `/hrm/payroll/*` | `payroll.ts` |
| Payroll settings (components/earnings/deductions/benefits/loans/formulas/statutory/defaults) | `/hrm/payroll-settings/*`, `/hrm/payroll/components/*` | `payroll-settings.ts` |
| HRM settings (departments/job-titles/job-groups, regions) | `/hrm/*-settings/*` | `hrm-settings.ts` |
| Leave (requests/balances/entitlement/types/logs) | `/hrm/leave/*` | `leave.ts` |
| Attendance (records/timesheets/shift-planner/work-shifts/rotations/off-days/rules/ess) | `/hrm/attendance/*` | `attendance.ts` |
| Training (courses/enrollments/evaluations) | `/hrm/training/*` | `training.ts` |
| Performance (reviews) | `/hrm/performance/*` | `performance.ts` |
| Recruitment (jobs/candidates/applications) | `/hrm/recruitment/*` | `recruitment.ts` |
| Appraisals (cycles/goals/templates/questions) | `/hrm/appraisals/*` | `appraisals.ts` |
| Reports (statutory + payroll) | `/hrm/payroll/reports/<type>/`, `/hrm/payroll/reports/export/<type>/` | `reports.ts` |
| Analytics / dashboards | `/hrm/analytics`, `/hrm/payroll/analytics`, `/hrm/{leave,attendance,…}/analytics` | `analytics.ts` |

Report filter params: `year`, `month`, `department_id`, `region_id`, `employee_id`,
`from_date`/`to_date`, `deduction_type`. (No `project_id` — project belongs to projects-service.)

---

## 6. erp-api — Users / Roles / Permissions / Security — `src/lib/api/{users,security}.ts`

| Method | Path | Purpose |
|---|---|---|
| GET/POST/PATCH/DELETE | `/auth/listusers/` (+ `/{id}/`) | users CRUD |
| POST | `/auth/listusers/{id}/{activate,deactivate,reset-password}/` | user actions |
| POST | `/auth/listusers/{userId}/{assign-role,remove-role}/{roleId}/` | role membership |
| GET/POST/PUT/DELETE | `/auth/roles/` (+ `/{id}/`, `{assign,remove}-permission/{permissionId}/`) | roles CRUD |
| GET/POST/PUT/DELETE | `/auth/permissions/` (+ `/{id}/`) | permissions CRUD |
| GET/POST/DELETE | `/auth/backups/` (+ `/{id}/`, `config/`, `schedule/`) | backups |
| GET | `/auth/security/{dashboard,audit-logs}/` | security |

---

## 7. erp-api — Core / Business / Settings — `src/lib/api/settings.ts`

| Method | Path | Purpose |
|---|---|---|
| GET/PUT | `/core/regional-settings/` | currency / time / region |
| GET/PUT | `/hrm/payroll-settings/general-hr-settings/` | general HR settings |
| GET/PUT | company / branding settings | company profile (branding read-through to auth-api `by-slug`) |

---

## 8. External service UIs — `src/config/external-services.ts`

Opened in a new tab (`window.open(url,'_blank','noopener')`), **no API integration** — these are
the only references to other services in ERP-UI:

| Key | Env var | Default prod URL |
|---|---|---|
| finance | `NEXT_PUBLIC_TREASURY_UI_URL` | books.codevertexitsolutions.com |
| crm | `NEXT_PUBLIC_MARKETFLOW_UI_URL` | marketflow.codevertexitsolutions.com |
| inventory (also procurement/manufacturing/assets) | `NEXT_PUBLIC_INVENTORY_UI_URL` | inventory.codevertexitsolutions.com |
| pos | `NEXT_PUBLIC_POS_UI_URL` | pos.codevertexitsolutions.com |
| ordering | `NEXT_PUBLIC_ORDERING_UI_URL` | ordersapp.codevertexitsolutions.com |
| notifications | `NEXT_PUBLIC_NOTIFICATIONS_UI_URL` | notifications.codevertexitsolutions.com |
| projects | `NEXT_PUBLIC_PROJECTS_UI_URL` | projects.codevertexitsolutions.com |
| billing | `NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL` | pricing.codevertexitsolutions.com |
| auth (tenant mgmt / branding editor) | `NEXT_PUBLIC_AUTH_UI_URL` | accounts.codevertexitsolutions.com |

---

## 9. Environment variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | erp-api base (without `/api/v1`) |
| `NEXT_PUBLIC_SSO_URL` / `NEXT_PUBLIC_AUTH_URL` | auth-api / SSO base |
| `NEXT_PUBLIC_SSO_CLIENT_ID` | OAuth client (`erp-ui`) — public client, no secret |
| `NEXT_PUBLIC_SUBSCRIPTIONS_API_URL` | subscriptions API base |
| `NEXT_PUBLIC_*_UI_URL` | external service links (table §8) |
</content>
