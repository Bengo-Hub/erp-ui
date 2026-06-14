# ERP-UI Integrations & API Contracts

> Every backend integration consumed by `erp-ui`: the ERP API (`erp-api`), the platform auth API (`auth-api`), the subscriptions API, realtime sockets, and the external service UIs. This is the contract reference for the Next.js port — type these in `src/lib/api/*.ts`.
>
> See [`architecture.md`](./architecture.md) for the auth/tenant header mechanics.

---

## 1. Services consumed

| Target | Base URL (env) | Auth | Purpose |
|---|---|---|---|
| **erp-api** | `VITE_API_URL` + `/api/v1` (dev `http://localhost:8000`, prod `https://erpapi.masterspace.co.ke`) | Bearer JWT (SSO) or `Token` (legacy DRF) + tenant headers | All HRM/payroll/leave/users/settings data |
| **auth-api (SSO)** | `VITE_SSO_URL` / `VITE_AUTH_URL` (prod `https://sso.codevertexitsolutions.com`) | OIDC PKCE; some public `by-slug` endpoints | Login, token, `/auth/me`, branding, outlets |
| **subscriptions-api** | `VITE_SUBSCRIPTIONS_API_URL` (prod `https://pricingapi.codevertexitsolutions.com`) | Bearer + tenant headers | Plan/feature/limit gating |
| **realtime (WS)** | `VITE_WEBSOCKET_URL` (`wss://erpapi.masterspace.co.ke/ws/payroll/`) | token in URL/handshake | Payroll progress, notifications |
| **External UIs** | per-service `VITE_*_UI_URL` | n/a (new tab) | Cross-domain navigation |

### 1.1 Standard headers on erp-api/subscriptions calls (from `axiosConfig.js`)

| Header | Value | When |
|---|---|---|
| `Authorization` | `Bearer <access_token>` (SSO) / `Token <token>` (legacy) | always when authed |
| `X-Tenant-ID` | tenant UUID | tenant users (not platform owners) |
| `X-Tenant-Slug` | tenant slug | tenant users |
| `?tenantId=<uuid>` (query) | selected tenant | **platform owners** drilling into a tenant (omits `X-Tenant-*`) |
| `X-Outlet-ID` | selected outlet id | when an outlet is selected (`erp-selected-outlet-id`) |
| `X-Currency` | currency code | when `selectedCurrency` set |
| `X-CSRFToken` | from `csrftoken` cookie | Django CSRF |
| `X-Business-ID` / `X-Branch-ID` | legacy business/branch | legacy mode, non-platform-owner |

---

## 2. SSO / OIDC (auth-api) — `ssoService.js`, `meService.js`

| Method | Path | Body / params | Response | Notes |
|---|---|---|---|---|
| GET (redirect) | `${SSO}/api/v1/authorize` | `response_type=code`, `client_id=erp-ui`, `redirect_uri=<origin>/auth/callback`, `scope=openid profile email offline_access`, `state`, `code_challenge`, `code_challenge_method=S256`, optional `tenant`/`org` | 302 → callback w/ `code`,`state` | PKCE; redirect_uri is **flat** `/auth/callback` (registered both hosts) |
| POST | `${SSO}/api/v1/token` | **form-urlencoded**: `grant_type=authorization_code`,`code`,`code_verifier`,`client_id`,`redirect_uri` | `{access_token, refresh_token, id_token}` | exact redirect_uri match required |
| POST | `${SSO}/api/v1/auth/refresh` | JSON `{refresh_token, client_id}` | `{access_token,...}` | one-time retry on 401 |
| GET (redirect) | `${SSO}/api/v1/auth/logout` | `?post_logout_redirect_uri=<origin>` | 302 | clears shared session cookie |
| GET | `${SSO}/api/v1/auth/me` | Bearer | identity + global roles + auth perms `{id,email,name,roles,permissions,is_platform_owner,is_hq_user,tenant_id,tenant_slug,outlet_id,...}` | step (a); plain `fetch` to SSO origin |
| GET | `${ERP}/api/v1/auth/me/` | Bearer + tenant headers | `{user_id,email,service_role,service_roles,permissions,is_superuser,is_platform_owner,is_hq_user,tenant_id,tenant_slug,outlet_id,outlet_use_case}` | step (b); 404 = not provisioned (JIT) → fall back |

**JWT claims read:** `tenant_id`, `tenant_slug`, `is_hq_user`, `outlet_id`, `is_platform_owner`, `sub`.

---

## 3. Branding & outlets (auth-api, public) — `tenantBrandingService.js`, `outletService.js`

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `${AUTH_URL}/api/v1/tenants/by-slug/{slug}` | public | `{name, brand_colors:{primary,secondary}, logo_url, ...}` → CSS vars + `--p-primary-*` ramp + `document.title`; cached ~6h |
| GET | `${AUTH_URL}/api/v1/tenants/{slug}/outlets` | public | `[{id,code,name,use_case,is_hq,status,settings}]` (archived filtered out) |

Branding edits are **not** done in-app → deep link `${AUTH_UI}/dashboard/settings?tab=branding`.

---

## 4. Subscriptions API — `useSubscription.js`

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `${SUBSCRIPTIONS_API_URL}/api/v1/tenants/{tenant_id}/subscription` | Bearer + `X-Tenant-ID`(+Slug) | `{status, plan, features[], limits{}, expires_at/current_period_end/trial_end, ...}` |

Fail-open (null on any error). Platform owners short-circuit to synthetic `{status:'ACTIVE', plan:'enterprise'}`. Statuses: `ACTIVE`/`TRIAL(ING)`/`PAST_DUE`/`EXPIRED`/`CANCEL(L)ED`. Gating signal: erp-api returns `403 {code:'subscription_inactive'|upgrade:true}` → `subscription:inactive` event → toast (no logout).

---

## 5. erp-api — HRM / Payroll / Leave (DRF, trailing-slash, paginated)

BaseService verbs: `GET list` (`?page,page_size,search,…`), `GET {id}/`, `POST`, `PUT {id}/`, `PATCH {id}/`, `DELETE {id}/`, `POST {id}/{action}/`, `GET ?export=csv` (blob). Base paths (from `services/hrm/index.js` + service files):

| Domain | Base path | Service |
|---|---|---|
| HRM root | `/hrm` | employeeService, timesheetService, expenseClaimService, payrollService |
| Employees | `/hrm/employees` | employeeService |
| Employee status / salary / benefits / earnings / deductions / contracts | `/hrm/employee-status`, `/hrm/salary-details`, `/hrm/benefits`, `/hrm/earnings`, `/hrm/deductions`, `/hrm/contracts` | employeeService |
| Payroll | `/hrm/payroll` | payrollService |
| Payroll process / audits / advances / claims / losses-damages | `/hrm/payroll/payroll`, `/hrm/payroll/payroll-audits`, `/hrm/payroll/advances`, `/hrm/payroll/claims`, `/hrm/payroll/losses-damages` | payrollService, expenseClaimService |
| Attendance | `/hrm/attendance` | attendanceService, shiftPlannerService |
| Leave | `/hrm/leave` | leaveService |
| Training | `/hrm/training` | trainingService |
| Performance | `/hrm/performance` | performanceService |
| Recruitment | `/hrm/recruitment` | onboardingService |
| Appraisals | `/hrm/appraisals` | appraisalService |
| Analytics | `/hrm/analytics`, `/hrm/payroll/analytics`, `/hrm/{attendance,leave,training,performance,recruitment}/analytics` | hrmAnalyticsService, analyticsService |
| Payroll settings (General HR) | `/hrm/payroll-settings/general-hr-settings/` | systemConfigService |

Realtime: `realtimeClient.js` connects `wss://…/ws/payroll/` for payroll-processing progress (`usePayrollRealtime`, `useRealtime`).

---

## 6. erp-api — Users / Roles / Permissions / Security — `userManagementService.js`

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/auth/listusers/` | list / create users |
| GET/PATCH/PUT/DELETE | `/auth/listusers/{id}/` | user CRUD |
| POST | `/auth/listusers/{id}/activate/`, `/deactivate/`, `/reset-password/` | user actions |
| POST | `/auth/listusers/{userId}/assign-role/{roleId}/`, `/remove-role/{roleId}/` | role membership |
| GET/POST | `/auth/roles/`, GET/PUT/DELETE `/auth/roles/{id}/` | roles CRUD |
| POST | `/auth/roles/{roleId}/assign-permission/{permissionId}/`, `/remove-permission/{permissionId}/` | role perms |
| GET/POST/PUT/DELETE | `/auth/permissions/`, `/auth/permissions/{id}/` | permissions CRUD |
| POST | `/auth/change-password/` | change password |
| GET/POST | `/auth/password-policy/` | password policy |
| GET/POST/DELETE | `/auth/backups/`, `/auth/backups/{id}/` (+ `?action=download` / `?action=url`) | backups |
| GET/POST/PUT/PATCH | `/auth/backups/config/`, `/auth/backups/schedule/` (+ `/{id}/`) | backup config/schedule |
| GET | `/user-logs/`, `/users/{userId}/login-history/` | audit/login history |
| GET/POST | `/account-requests/` (+ `/{id}/approve/`, `/{id}/reject/`) | account requests |
| GET/POST/PUT | `/auth/security/2fa/` (+ `/verify/`, `/disable/`) | 2FA |
| GET | `/auth/security/dashboard/`, `/auth/security/audit-logs/` | security |
| POST | `/auth/security/unlock-account/` | unlock |
| GET/PUT | `/auth/security/settings/` | security settings |
| POST | `/auth/security/login/` | **legacy** DRF login (Token + 2FA) |
| POST | `/auth/logout/` | legacy logout |
| GET | `/auth/listusers/{id}/` (refreshUser) | profile refresh |

---

## 7. erp-api — Core / Business / Settings / Currency

| Method | Path | Service | Purpose |
|---|---|---|---|
| GET/PUT | `/business/business/branding-settings/` | store/auth, systemConfigService `/core/branding-settings/` | branding settings (legacy) |
| GET/POST/PUT | `/business/payment-integrations/` (+ `/{id}/`) | systemConfigService | M-Pesa/payment integrations |
| GET/POST/PUT | `/core/regional-settings/` (+ `/{id}/`) | systemConfigService | currency/time/region |
| GET/POST/PUT | `/hrm/payroll-settings/general-hr-settings/` (+ `/{id}/`) | systemConfigService | general HR settings |
| GET | `/business/` , `/core/` , `/addresses/addresses/` | coreService | business/core/addresses |
| GET/POST/PATCH | `/integrations/exchange-rate-api/` (+ `/current/`, `/status/`, `/fetch_now/`, `/latest_rates/`) | coreService | FX rates |
| — | `/integrations` | communicationService | comms/integrations |
| GET | `/api/health/` | networkService | health probe |

> Note: several `/finance`, `/crm`, `/procurement`, `/manufacturing`, `/pos` paths still exist in `permissionService.getDashboardRedirectPath` and `analyticsService` (`/ecommerce`) as **dead references** — those domains are decomposed. Do **not** port them.

---

## 8. External service UIs — `config/externalServices.js`

Opened in a new tab (`window.open(url,'_blank','noopener')`), no API integration:

| Key | Env var | Prod URL |
|---|---|---|
| finance | `VITE_TREASURY_UI_URL` | books.codevertexitsolutions.com |
| crm | `VITE_MARKETFLOW_UI_URL` | marketflow.codevertexitsolutions.com |
| inventory (also procurement/manufacturing/assets) | `VITE_INVENTORY_UI_URL` | inventory.codevertexitsolutions.com |
| pos | `VITE_POS_UI_URL` | pos.codevertexitsolutions.com |
| ordering | `VITE_ORDERING_UI_URL` | ordersapp.codevertexitsolutions.com |
| notifications | `VITE_NOTIFICATIONS_UI_URL` | notifications.codevertexitsolutions.com |
| projects | `VITE_PROJECTS_UI_URL` | projects.codevertexitsolutions.com |
| billing | `VITE_SUBSCRIPTIONS_UI_URL` | pricing.codevertexitsolutions.com |
| auth (platform admin / tenant mgmt) | `VITE_AUTH_UI_URL` | accounts.codevertexitsolutions.com |

---

## 9. Environment variables (full list)

| Var | Purpose |
|---|---|
| `VITE_API_URL` | erp-api base (no `/api/v1`) |
| `VITE_SSO_ENABLED` | toggle SSO vs legacy login |
| `VITE_SSO_URL` / `VITE_AUTH_API_URL` (alias) | auth-api / SSO base |
| `VITE_AUTH_URL` | auth-api for public branding/outlet endpoints |
| `VITE_SSO_CLIENT_ID` | OAuth client (`erp-ui`) |
| `VITE_SUBSCRIPTIONS_API_URL` | subscriptions API base |
| `VITE_WEBSOCKET_URL` | realtime socket base |
| `VITE_BASE_URL` | router base path |
| `VITE_*_UI_URL` (treasury/marketflow/inventory/pos/ordering/notifications/projects/subscriptions/auth) | external links |

### Next.js port note
Vite `VITE_*` vars become **`NEXT_PUBLIC_*`** (build-time) in Next.js (matching treasury-ui's `NEXT_PUBLIC_API_URL`). Map each `VITE_X` → `NEXT_PUBLIC_X`. The `ApiClient` reads `process.env.NEXT_PUBLIC_API_URL`.

---

## 10. Target API client contracts (Next.js)

- `src/lib/api/client.ts` — `ApiClient` singleton (Bearer + `X-Tenant-Slug`/`X-Tenant-ID` UUID-validated + `X-Outlet-ID`; 401 refresh; 403 subscription; blob download). Methods: `get/post/put/patch/delete<T>`, `download`.
- `src/lib/api/employees.ts`, `payroll.ts`, `leave.ts`, `attendance.ts`, `appraisals.ts`, `training.ts`, `recruitment.ts`, `reports.ts`, `users.ts`, `roles.ts`, `permissions.ts`, `security.ts`, `settings.ts`, `analytics.ts`, `tenant.ts`.
- `src/lib/auth/{api,pkce,token-refresh,permissions,subscription,types}.ts`.
- Each `src/hooks/use-*.ts` wraps queries/mutations with stable query keys.
