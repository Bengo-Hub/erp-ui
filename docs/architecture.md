# ERP-UI Architecture (Current Vue 3 + TARGET Next.js 16)

> Authoritative architecture reference for the `erp-ui` revamp from **Vue 3 (Vite / PrimeVue)** to **Next.js 16 (React 19)**, matching the platform's other Next.js UIs (treasury-ui, pos-ui, ordering-frontend, marketflow).
>
> Companion docs: [`integrations.md`](./integrations.md) (API contracts), [`component-inventory.md`](./component-inventory.md) (page/route → React port checklist), [`gaps-and-bugs.md`](./gaps-and-bugs.md), [`revamp-plan.md`](./revamp-plan.md), [`sprints/`](./sprints).

---

## 0. What this app is

`erp-ui` (package `bengobox-erp-ui` v4.1.0) is the **HR + internal-operations** frontend of the BengoBox/Codevertex platform. After the platform was decomposed into microservices, every other business domain (Finance, CRM, Inventory, POS, Ordering, Procurement, Manufacturing, Assets, Notifications, Projects, Billing) moved to its own service + UI. `erp-ui` now owns:

- **HRM** — employees, contracts, org chart, recruitment, training
- **Payroll** — processing, payslips, advances, claims, losses/damages, formulas, statutory reports (KRA P9/P10A, NSSF, NHIF/SHA, NITA, etc.)
- **Leave & Attendance** — leave requests/balances/entitlement, shift planner, timesheets, off-days
- **Performance & Appraisals** — appraisals, cycles, goals, evaluators, templates, questions
- **User management / RBAC / Security** — users, roles, permissions, backups, security settings
- **Settings** — HRM/payroll/business/currency/branding settings
- **Dashboards** — executive, HRM, ICT, ESS (Employee Self-Service)

All other domains are reached as **external links** (new tab) via the sidebar "EXTERNAL SERVICES" group (see [`src/config/externalServices.js`](../src/config/externalServices.js)).

---

## PART A — CURRENT Vue 3 Architecture

### A.1 Tech stack (from [`package.json`](../package.json))

| Concern | Library | Version |
|---|---|---|
| Framework | Vue | ^3.5.35 |
| Build | Vite | ^8.0.16 |
| Router | vue-router | ^5.1.0 |
| State | Vuex | ^4.1.0 |
| UI kit | PrimeVue + @primevue/themes (Aura) | ^4.5.5 |
| Icons | primeicons | ^7.0.0 |
| CSS | Tailwind v4 (`@tailwindcss/vite`) + tailwindcss-primeui + SCSS (sass) | ^4.3.0 |
| HTTP | axios | ^1.17.0 |
| Validation | @vuelidate/core + validators | ^2.x |
| Charts | chart.js, highcharts + highcharts-vue | 4.x / 12.x |
| Docs/exports | jspdf, jspdf-autotable, xlsx, file-saver, quill (Editor) | — |
| Crypto/PKCE | crypto-js + crypto-browserify (via vite-plugin-node-polyfills) | — |
| Dates | date-fns ^4 **and** moment ^2.30 (both present — see gaps) | — |
| Server | express ^5 declared, but [`server.js`](../server.js) is **pure Node http** (dependency-free) | — |

Package manager: **pnpm@10.30.0**. Entry: [`src/main.js`](../src/main.js) → mounts `App.vue`.

**Counts:** ~224 `.vue` files, ~107 `.js` files, ~143 view files, ~70 routes (see `component-inventory.md`).

### A.2 App bootstrap ([`src/main.js`](../src/main.js))

- Imports + **globally registers ~75 PrimeVue components** by hand (Accordion … TreeTable).
- Installs `PrimeVue` (Aura preset, `darkModeSelector: '.app-dark'`), `ToastService`, `ConfirmationService`, custom `permissionsPlugin`, `currencyPlugin`, Vuex `store`, and `router`.
- Resolves API base URL via `getApiBaseUrl()`: `VITE_API_URL` → `http://localhost:8000` (dev) → `https://erpapi.masterspace.co.ke` (prod fallback). Sets `window.$http = base + '/api/v1'` and `window.axios`.
- Registers a **PWA service worker** (`/service-worker.js`) in production only.
- Legacy: reads `sessionStorage.token` and sets `Authorization: Token <token>` (DRF token auth).

### A.3 Routing ([`src/router/`](../src/router))

Vue Router (web history). Routes are split into module files and aggregated in [`routes.js`](../src/router/routes.js):

- `dashboardRoutes`, `appraisalRoutes`, `payrollRoutes`, `reportsRoutes`, `employeeRoutes`, `leaveRoutes`, `userManagementRoutes`, `securityRoutes`, `settingsRoutes`, `authRoutes`.

**Tenant-scoped URLs.** The canonical URL form is `/{orgSlug}/…` (e.g. `/codevertex/hrm/employees`), mirroring ordering-frontend's `[orgSlug]` Next.js segment. The app route tree is **mounted twice**:
1. `/:orgSlug` parent → `scopedAppChildren` (children with leading `/` stripped, names prefixed `org-`).
2. `/` flat parent → original `appChildren` (legacy/back-compat; the guard rewrites these to scoped).

Both trees use `AppLayout` as the shell.

**Global guard** ([`router/index.js`](../src/router/index.js)) does, in order:
1. Capture `orgSlug` from `route.params` → `localStorage.tenant_slug` (via `tenantContext.setOrgSlug`).
2. Let unscoped paths through (`/auth/*`, `/{slug}/auth/*`, `/landing`).
3. Normalize bare/legacy paths → `/{orgSlug}/…` (resolved slug), preserving query/hash.
4. **Auth gate:** `meta.requiresAuth && !sessionStorage.isAuthenticated` → redirect to `/{slug}/auth/login` (or flat `/auth/login` if tenant unknown) — never auto-launches SSO.
5. **Permission check** via `permissionMiddleware` on a path with the `/{orgSlug}` prefix stripped (`buildNormalisedRoute`), re-scoping any redirect it returns (`rescopeRedirect`).

`tenantContext.js` is the org-slug brain: `resolveOrgSlug`, `splitOrgPath`, `isOrgSlugSegment`, `isPlatformOwnerUser/Context`, `PLATFORM_OWNER_SLUG = 'codevertex'`, `KNOWN_APP_SEGMENTS`/`RESERVED_FIRST_SEGMENTS` discriminators.

### A.4 Authentication & tenant context

Two auth modes, switched by `VITE_SSO_ENABLED`:

**SSO (OIDC Authorization Code + PKCE)** — [`src/services/auth/ssoService.js`](../src/services/auth/ssoService.js):
- `loginRedirect()` → builds PKCE verifier/challenge (`crypto.subtle`), stores `pkce_verifier`/`oauth_state`/`post_login_redirect`, redirects to `${VITE_SSO_URL}/api/v1/authorize` with `response_type=code`, `client_id=erp-ui`, **flat** `redirect_uri=/auth/callback`, optional `tenant`/`org` hint.
- `handleCallback()` → verifies `state`, POSTs **form-urlencoded** body to `/api/v1/token`, stores `access_token`/`refresh_token`/`id_token` in `localStorage`, parses JWT for `tenant_id`/`tenant_slug`/`is_hq_user`/`outlet_id`, auto-pins single-outlet staff, sets `isAuthenticated` + `lastAuthenticatedAt` (15s grace).
- `refreshAccessToken()` → `POST /api/v1/auth/refresh`. `ssoLogoutRedirect()` → clears storage + redirects to `/api/v1/auth/logout`.
- Tokens in `localStorage` (`access_token`, `refresh_token`, `id_token`); outlet under `erp-selected-outlet-id` (+ legacy `outlet_id`).

**Two-step `/auth/me`** — [`src/services/auth/meService.js`](../src/services/auth/meService.js):
- (a) `GET ${SSO}/api/v1/auth/me` (fetch, SSO origin) → identity + global roles + auth-service perms.
- (b) `GET /api/v1/auth/me/` (axios, ERP origin, trailing slash) → service role + service permissions.
- `mergeProfiles()` unions roles, prefers ERP permissions (falls back to SSO), derives `is_platform_owner`/`is_superuser`/`is_hq_user`. In-module cache, ~5min staleTime + inflight dedupe (TanStack-Query-like, by hand).

**Legacy DRF login** — [`store/modules/auth.js`](../src/store/modules/auth.js) `login()` → `POST /auth/security/login/` (Token auth, 2FA-aware, business + branding payload).

**axios interceptors** — [`src/utils/axiosConfig.js`](../src/utils/axiosConfig.js):
- Request: SSO mode adds `Authorization: Bearer`, `X-Tenant-ID`/`X-Tenant-Slug` (tenant users) or `?tenantId=` query (platform owners), `X-Outlet-ID`, `X-CSRFToken`, `X-Currency`, `X-Business-ID`/`X-Branch-ID` (legacy). Strips `Content-Type` for FormData.
- Response: `403` + `code=subscription_inactive`/`upgrade` → dispatch `subscription:inactive` event (no logout). `401` SSO → one-time refresh+retry, then `loginRedirect` (skips `/auth/me` + 15s grace). `401` legacy → clear storage + redirect to login.

### A.5 State management (Vuex)

[`store/index.js`](../src/store/modules) with namespaced modules: `auth` (user/business/addresses/branding, login/logout/checkAuthentication/loadSsoProfile/resolveEmployeeMapping), `currency`, `setup`. Much app state also lives in `localStorage`/`sessionStorage` directly (tokens, tenant, outlet, permissions, user JSON, business JSON) — a major source of coupling.

### A.6 RBAC

- [`composables/usePermissions.js`](../src/composables/usePermissions.js) — `hasPermission/hasAnyPermission/hasAllPermissions`, module CRUD helpers, `isSuperuser`, `isPlatformOwner`, and a huge static `PERMISSION_CATEGORIES` map (HRM/PAYROLL/…/even FINANCE/CRM/POS which are now external — dead weight).
- [`middleware/permission.js`](../src/middleware/permission.js) — `ROUTE_PERMISSIONS` map + `permissionMiddleware` (exact → `:id` pattern → longest-prefix). Superusers bypass. Failures redirect to the user's dashboard (`getDashboardRedirectPath`) then `/unauthorized`.
- [`directives/permission.js`](../src/directives/permission.js) (`v-permission`), [`plugins/permissions.js`](../src/plugins/permissions.js), guard components: `PermissionGuard.vue`, `PermissionButton.vue`, `PermissionWrapper.vue`.
- Menu filtered by `permissionService.filterMenuItems`.

### A.7 Service layer

- [`services/base/BaseService.js`](../src/services/base/BaseService.js) — CRUD/list/getById/patch/delete/performAction/bulkOperation/search/export over the shared axios instance, DRF-style trailing-slash URLs + pagination normalization (`extractPaginatedData`).
- HRM services extend BaseService with base paths (`/hrm`, `/hrm/employees`, `/hrm/payroll`, `/hrm/attendance`, `/hrm/leave`, `/hrm/training`, `/hrm/performance`, `/hrm/recruitment`, `/hrm/appraisals`). Endpoint map in [`services/hrm/index.js`](../src/services/hrm/index.js).
- auth services: `userManagementService` (`/auth/listusers`, `/auth/roles`, `/auth/permissions`, `/auth/backups`, `/auth/security/*`), `meService`, `outletService`, `tenantBrandingService`, `tenantService`, `ssoService`.
- shared/utils: `dashboardService`, `systemConfigService`, `communicationService`, `countryService`, `nodeService`, `photoService`, `realtimeClient` (WebSocket `/ws/payroll/`), `errorHandler`, `responseHandler`, `networkService`, `mobileService`, `imageOptimizationService`.

### A.8 Branding & subscription

- [`tenantBrandingService.js`](../src/services/auth/tenantBrandingService.js) — `GET ${VITE_AUTH_URL}/api/v1/tenants/by-slug/{slug}` (public), applies `--tenant-primary/-secondary/-logo` + a generated PrimeVue v4 `--p-primary-*` ramp; sessionStorage cache ~6h; sets `document.title`. No in-app branding editor (deep-links to auth-ui).
- [`useSubscription.js`](../src/composables/useSubscription.js) — lazy `GET ${VITE_SUBSCRIPTIONS_API_URL}/api/v1/tenants/{tenant_id}/subscription`, fail-open, module-singleton. `hasFeature/getLimit/isActive/isTrial/isPastDue/needsSubscription`. Drives `SubscriptionBanner.vue` + `SubscriptionGate.vue` + `useSubscriptionToast`.

### A.9 Layout / shell

[`layout/AppLayout.vue`](../src/layout/AppLayout.vue) (Sakai-derived): `AppTopbar`, `AppSidebar` (`AppMenu`/`AppMenuItem`/`ESSAppMenu`), `AppFooter`, `OfflineIndicator`, `SubscriptionBanner`, `PageBreadcrumb`, global `<Toast>` (+ `subscription` group toast with Upgrade button), `AppConfigurator`. `layout/composables/layout.js` holds menu mode/dark-mode state. On mount: `rehydrateOutlet()` + `loadTenantBranding()`. Menu IA lives **hardcoded** in `AppMenu.vue` (`originalModel`), filtered by permission; a `platformAdminSection` is prepended for platform owners.

### A.10 Currency

`useCurrency`/`useGlobalCurrency` + Vuex `currency` module + `plugins/currency.js` + `X-Currency` header + `CurrencySwitcher`/`CurrencySelector`. See [`CURRENCY_MIGRATION_GUIDE.md`](../CURRENCY_MIGRATION_GUIDE.md). Note a `useGlobalCurrency.backup.js` left in tree (dead).

### A.11 Build / deploy

- [`vite.config.mjs`](../vite.config.mjs) — Vue + JSX + PrimeVue auto-import + node-polyfills (crypto) + Tailwind plugin; alias `@`→`src`, `crypto`→`crypto-browserify`; dev port 5216.
- [`Dockerfile`](../Dockerfile) — node:22.13 build (pnpm, SSH mount for private deps) → `pnpm run build` → node:22.13-alpine runtime serving `dist/` via [`server.js`](../server.js) (pure-Node static + SPA fallback + `/health`), port 3000. Prod build args set `VITE_SSO_ENABLED=true` + all prod service URLs.
- `build.sh` — full deploy script (security scan, docker build, k8s secrets, helm). `vercel.json`, `kubeSecrets/`, `.github/`.
- Self-signed `localhost.pem`/`localhost-key.pem` for local HTTPS dev.

### A.12 Current architecture diagram

```mermaid
flowchart TD
  U[Browser] -->|/{orgSlug}/...| R[Vue Router + guard]
  R -->|requiresAuth| G{isAuthenticated?}
  G -- no --> L[/auth/login -> SSO PKCE/]
  G -- yes --> P[permissionMiddleware]
  P --> V[View .vue + PrimeVue]
  V --> S[Service layer / BaseService]
  S --> AX[axios instance + interceptors]
  AX -->|Bearer + X-Tenant-* / X-Outlet-ID| ERP[(erp-api /api/v1)]
  AX -.->|by-slug branding / outlets| AUTH[(auth-api)]
  AX -.->|subscription| SUBS[(subscriptions-api)]
  V -.->|new tab| EXT[Treasury/CRM/POS/Inventory/... UIs]
```

---

## PART B — TARGET Next.js 16 Architecture

The target mirrors **treasury-ui** (the platform's reference UI): **Next.js 16.2 / React 19.2**, App Router, TanStack Query, axios `ApiClient` singleton, shadcn-style primitives on **@base-ui** (NOT Radix) via `@bengo-hub/shared-ui-lib`, Tailwind v4, sonner, zustand, zod + react-hook-form, OIDC/PKCE SSO, per-tenant branding via `generateMetadata` + manifest.

### B.1 Target stack

| Concern | Library | Notes |
|---|---|---|
| Framework | **Next.js 16.2** (App Router, React Compiler) | `next`, `eslint-config-next` |
| UI runtime | **React 19.2** + react-dom | |
| Language | **TypeScript 5** | strict |
| Server data | **@tanstack/react-query 5** (+ devtools) | one hook per resource in `src/hooks/use-*.ts` |
| HTTP | **axios** wrapped in a singleton `ApiClient` (`src/lib/api/client.ts`) | NEVER inline fetch in components |
| Components | **`@bengo-hub/shared-ui-lib`** (shadcn on @base-ui) + local `src/components/ui` | Button/Dialog/DataTable/Select/etc. |
| Styling | **Tailwind v4** (`@tailwindcss/postcss`) + `tailwind-merge` + `clsx` + `class-variance-authority` | |
| Toasts | **sonner** | + a shared `ConfirmDialog` |
| Forms | **react-hook-form** + `@hookform/resolvers` + **zod** | |
| Charts | **recharts 3** | replaces chart.js/highcharts |
| Light state | **zustand 5** | tenant/outlet/UI state |
| Theme | **next-themes** | dark mode |
| Icons | **lucide-react** | replaces primeicons |
| PWA | **@ducanh2912/next-pwa** + workbox-window | per-tenant manifest |
| Dates | **date-fns 4** only | drop moment |
| Package mgr | **pnpm** | |
| Tests | **Playwright** (e2e) | |

### B.2 App Router folder layout (target, mirroring treasury-ui)

```
src/
  app/
    [orgSlug]/
      layout.tsx                 # tenant shell: sidebar + topbar + providers; generateMetadata (branding + manifest)
      manifest.webmanifest/route.ts  # per-tenant PWA manifest (server-generated)
      page.tsx                   # executive dashboard (or redirect by role)
      auth/
        login/page.tsx
        callback/page.tsx        # OIDC PKCE callback (also flat /auth/callback)
        select-outlet/page.tsx
        forgot-password/page.tsx
        reset-password/[uid]/[token]/page.tsx
      ess/page.tsx               # Employee Self-Service dashboard (fallback)
      hrm/
        employees/{page,[id]/page}.tsx
        contracts/page.tsx
        org-chart/page.tsx
        attendance/{shift-planner,timesheets,records,off-days,work-shifts/...}/...
        leave/{requests,balances,entitlement,types,logs}/...
        training/{courses,enrollments,evaluations}/...
        recruitment/{jobs,candidates,applications,onboarding}/...
        appraisals/{page,[id]/{page,edit,review},templates,cycles,goals,questions,evaluators,workflow}/...
        performance/{reviews}/...
      payroll/
        process/[employmentType]/page.tsx
        payslips/{view,print}/...
        advances/, claims/, losses-damages/, casual/, consultants/, overtime/
        email-payslips/, scheduled-emails/, formulas/, spreadsheet/[...]/page.tsx
      reports/                   # all KRA/statutory/payroll reports
        {p9,p10a,withholding-tax,nssf,nhif,nita,bank-net-pay,muster-roll,variance,approvers,cbs,custom}/page.tsx
      users/{page,[id]/page,roles,permissions,account}/...
      security/{dashboard,settings,backups}/...
      settings/
        business/, currency-time/, general-hr/, branding/, approvals/
        hrm/{departments,job-titles,job-groups,projects,unions,holidays,ess,appraisals}/...
        payroll/{formulas,[id],components,deductions,earnings,benefits,loans,defaults,banks,customize-payslip,scheduled}/...
        expense-claims/
      unauthorized/page.tsx
    (public)/landing/page.tsx
    healthz/route.ts
    not-found.tsx
  components/
    ui/                          # local shadcn primitives (re-export shared-ui-lib)
    auth/                        # AuthGuard, PermissionGate, RoleChip, UserCard
    layout/                      # AppSidebar, AppTopbar, AppMenu (data-driven), Breadcrumb
    subscription/                # SubscriptionBanner, SubscriptionGate
    outlet/                      # OutletFilter, TenantFilter (platform owner)
    hrm/ payroll/ reports/ settings/ charts/   # feature components
  hooks/                         # use-employees.ts, use-payroll.ts, use-leave.ts, use-me.ts, use-subscription.ts, use-org-branding.ts, use-resolved-tenant.ts ...
  lib/
    api/                         # client.ts (ApiClient singleton) + per-resource modules (employees.ts, payroll.ts, ...)
    auth/                        # api.ts, pkce.ts, token-refresh.ts, permissions.ts, subscription.ts, types.ts
    utils.ts                     # cn(), formatters
  providers/                     # QueryClientProvider, OrgSlugProvider, ThemeProvider, AuthProvider
  store/                         # zustand stores (tenant, outlet, ui)
  config/external-services.ts
```

### B.3 Server vs client components

- **Server components by default** for static page shells, metadata, and layout. `generateMetadata` per `[orgSlug]` fetches branding (title, theme-color, icons) and emits the per-tenant manifest link (fixes the PWA per-tenant manifest issue — server-side, not client-injected).
- **Client components** (`'use client'`) for anything interactive: data tables, forms, charts, the sidebar, auth flows, anything using TanStack Query/zustand/hooks. The OIDC callback, login, and outlet selector are client components.
- Token storage stays client-side (`localStorage`) as today; `ApiClient` is hydrated from it in a client provider.

### B.4 Data layer (TanStack Query + ApiClient) — MANDATORY pattern

- **One `ApiClient` singleton** (`src/lib/api/client.ts`) like treasury-ui: axios instance with request interceptor injecting `Bearer`, `X-Tenant-Slug`/`X-Tenant-ID` (UUID-validated), `X-Outlet-ID`; response interceptor for 401 refresh + 403 subscription gating; blob/Content-Disposition download helper. `setTenantContext()`, `setPlatformOwner()`, `setOutlet()`, `setAccessToken()`.
- **Per-resource API modules** in `src/lib/api/*.ts` (typed request/response).
- **Per-resource hooks** in `src/hooks/use-*.ts` wrapping `useQuery`/`useMutation` with query keys `['employees', params]`, optimistic updates + `invalidateQueries`. **No inline `fetch`/`axios` in components** (current Vue code already mostly enforces this via BaseService — keep that discipline).

### B.5 Auth / SSO (target)

- Port `pkce.ts` (verifier/challenge), `auth/api.ts` (authorize/token/refresh/logout), two-step `useMe()` (`/auth/me` SSO + `/auth/me/` ERP, merged), `token-refresh.ts`. Reuse treasury-ui's `use-resolved-tenant.ts` + `OrgSlugProvider` to keep `tenant_slug`/`tenant_id` in sync from the `[orgSlug]` segment.
- An `AuthGuard` (client) wraps `[orgSlug]/layout.tsx` children, redirecting unauthenticated users to `/{orgSlug}/auth/login`. Permission gating via `PermissionGate` component + `use-app-permissions.ts` (port `usePermissions`).
- Platform owner: `is_platform_owner` claim OR `orgSlug==='codevertex'` → `TenantFilter` in header drills via `?tenantId` (cross-tenant) instead of tenant headers.

### B.6 Branding + manifest

- `use-org-branding.ts` fetches `GET ${AUTH_URL}/api/v1/tenants/by-slug/{slug}`; `[orgSlug]/layout.tsx` applies brand CSS vars (server-rendered into the shell) and `generateMetadata` returns title/icons/theme-color. `manifest.webmanifest/route.ts` serves the per-tenant PWA manifest. No in-app branding editor (deep-link to auth-ui), matching current behavior.

### B.7 Subscription gating

- `use-subscription.ts` (port) + `SubscriptionBanner`/`SubscriptionGate`. `ApiClient` 403-`subscription_inactive` handler raises a sonner toast with an "Upgrade" action linking to the subscriptions UI.

### B.8 Component mapping (high level — full table in `component-inventory.md`)

| PrimeVue | shadcn/@base-ui (shared-ui-lib) |
|---|---|
| DataTable + Column + Paginator | `DataTable` (TanStack Table) |
| Dialog / ConfirmDialog / ConfirmPopup | `Dialog` + shared `ConfirmDialog` |
| Dropdown / MultiSelect / Listbox / SelectButton | `Select` / `MultiSelect` / `ToggleGroup` |
| InputText / Textarea / Password / InputNumber / InputMask | `Input` / `Textarea` + RHF |
| Calendar | `DatePicker` (date-fns) |
| TabView / TabPanel / TabMenu | `Tabs` |
| Steps | `Stepper` |
| Card / Panel / Fieldset / Accordion | `Card` / `Accordion` |
| Tag / Chip / Badge | `Badge` |
| Toast | `sonner` |
| Chart (chart.js) / Highcharts | `recharts` |
| Editor (Quill) | a React rich-text editor (e.g. tiptap) |
| FileUpload | shared upload component |
| Tree / TreeTable / TreeSelect | `Tree` (org chart: a dedicated React org-chart lib) |
| PickList / DualList | `TransferList` |

### B.9 Target architecture diagram

```mermaid
flowchart TD
  U[Browser] --> N[Next.js App Router /[orgSlug]/...]
  N --> SC[Server components + generateMetadata branding/manifest]
  N --> CC[Client components 'use client']
  CC --> AG[AuthGuard + PermissionGate]
  AG --> H[TanStack Query hooks use-*]
  H --> AC[ApiClient singleton axios]
  AC -->|Bearer + X-Tenant-* / X-Outlet-ID| ERP[(erp-api /api/v1)]
  AC -.-> AUTH[(auth-api: token/me/branding/outlets)]
  AC -.-> SUBS[(subscriptions-api)]
  CC -.->|external links| EXT[Treasury/CRM/POS/Inventory/... UIs]
```

### B.10 Migration principles

1. **Behavior-preserving:** every Vue route/workflow must have a Next.js equivalent (see `component-inventory.md` checklist). Lose no workflow.
2. **No inline fetch:** all I/O through `ApiClient` + hooks.
3. **Reuse shared libs:** adopt `@bengo-hub/shared-ui-lib` so erp-ui stops being an off-platform PrimeVue island.
4. **Tenant scoping first:** `[orgSlug]` segment + OrgSlugProvider before porting features.
5. **Drop dead domains:** remove FINANCE/CRM/POS/etc. permission categories + any leftover non-HR code; those are external services only.
6. **TypeScript everywhere:** type API contracts from `integrations.md`.
