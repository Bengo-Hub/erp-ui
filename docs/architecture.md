# ERP-UI Architecture (Next.js 16)

> Architecture reference for `erp-ui` — the platform's **HR & internal-operations** frontend,
> built on **Next.js 16 (App Router) + React 19**, matching treasury-ui / pos-ui / marketflow.
>
> Companion docs: [`integrations.md`](./integrations.md) (API contracts + data-ownership map),
> [`component-inventory.md`](./component-inventory.md) (implemented pages/routes),
> [`gaps-and-bugs.md`](./gaps-and-bugs.md), [`revamp-plan.md`](./revamp-plan.md), [`sprints/`](./sprints).

---

## 0. What this app is

`erp-ui` (package `bengobox-erp-ui`) is the **HR + internal-operations** frontend. After the
platform decomposition, every other business domain (Finance, CRM, Inventory, POS, Ordering,
Procurement, Manufacturing, Assets, Notifications, **Projects**, Billing) moved to its own
service + UI. ERP-UI owns **only** the HR/Ops core:

- **HRM** — employees (profile, bank, kin, salary tabs), contracts, org chart
- **Payroll** — process wizard, payslips, advances, claims, losses/damages, formulas, statutory settings
- **Leave & Attendance** — leave requests/approvals/balances/entitlement/types/logs; shift planner, records, timesheets, work-shifts, rotations, off-days, rules, self-service settings
- **Performance & Appraisals** — appraisals, cycles, goals, templates, questions, performance reviews
- **Recruitment & Training** — jobs/candidates/applications; courses/enrollments/evaluations
- **Reports** — config-driven KRA statutory + payroll reports (P9, P10A, WHT, NSSF, NHIF/SHA, NITA, bank net pay, muster roll, variance)
- **Administration** — users/roles/permissions, security dashboard, backups; HR & payroll settings; company/currency/branding settings
- **Dashboards** — executive, HRM, and ESS (Employee Self-Service) home

**Data ownership (enforced):** ERP-UI holds **no** customer / order / pickup-station /
address-book / service-type / project / bank-institution-master / inventory / finance-GL data.
Employee **bank details** are free-text fields on the employee (HR-owned); a legitimate employee
**address** is HR-owned; `region`/county is a simple reference. Everything else is an
**external link** in the sidebar "External Services" group (new tab, no API integration). See
[`integrations.md` §A — Data-ownership map](./integrations.md).

### Tech stack

| Concern | Library |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) |
| Runtime | **React 19** + react-dom |
| Language | **TypeScript 5** (strict) |
| Server data | **@tanstack/react-query 5** — one hook per resource in `src/hooks/use-*.ts` |
| HTTP | **axios** wrapped in a singleton `ApiClient` (`src/lib/api/client.ts`) — never inline fetch |
| Components | **`@bengo-hub/shared-ui-lib`** (shadcn on **@base-ui**, not Radix) + local `src/components/ui/*` |
| Styling | **Tailwind v4** + `tailwind-merge` + `clsx` + `class-variance-authority` |
| Toasts / confirm | **sonner** + shared `ConfirmDialog` |
| Forms | **react-hook-form** (+ `@hookform/resolvers`, zod where needed) |
| Charts | **recharts** |
| Light state | **zustand** (auth, tenant filter, outlet filter) |
| Theme | **next-themes** |
| Icons | **lucide-react** |
| PWA | **@ducanh2912/next-pwa** + server-generated per-tenant manifest |
| Dates | **date-fns** |
| Package mgr | **pnpm** |
| Tests | **Playwright** (e2e) |

Package manager is **pnpm**; validate every change with a full `pnpm build`.

---

## 1. Routing — App Router, tenant-scoped

All authenticated app routes live under `src/app/[orgSlug]/…` (e.g. `/codevertex/hrm/employees`),
matching ordering-frontend / treasury-ui. Auth and public routes:

```
src/app/
  page.tsx                       # root → resolves slug / redirects
  (public)/landing/page.tsx
  auth/callback/page.tsx         # flat OIDC callback (registered redirect_uri)
  healthz/route.ts               # liveness probe
  not-found.tsx · error.tsx
  [orgSlug]/
    layout.tsx                   # tenant shell (sidebar + topbar + providers) + generateMetadata (branding)
    manifest.webmanifest/route.ts# per-tenant PWA manifest (server-generated)
    page.tsx                     # executive / HRM dashboard
    ess/page.tsx                 # Employee Self-Service home
    auth/{login,callback,select-outlet,forgot-password,reset-password/[uid]/[token]}/page.tsx
    unauthorized/page.tsx
    hrm/…                        # employees, contracts, org-chart, leave, attendance, appraisals, performance, training, recruitment
    payroll/…                    # process, payslips, advances, claims, losses-damages
    reports/…                    # config-driven statutory + payroll reports
    users/…                      # users, roles, permissions
    security/{dashboard,backups}/page.tsx
    settings/…                   # company, currency-time, branding, hrm/*, payroll/*
    platform/{page,tenants}/page.tsx   # platform-owner only
```

Full page list: [`component-inventory.md`](./component-inventory.md).

The sidebar IA is **data-driven** from `src/components/layout/menu-data.ts` (a single
`APP_MENU` array), filtered by permission via `useAppPermissions`. Driving nav from one
data source (not a hardcoded mega-menu) means every nav link resolves to a real route — there
are no dead links.

---

## 2. Authentication & tenant context (SSO/OIDC + PKCE)

ERP-UI is an **SSO client only** — the auth-service is the sole OAuth handler. No
`client_secret` / IdP config lives in this repo.

- **PKCE** (`src/lib/auth/pkce.ts`) — verifier/challenge via `crypto.subtle`.
- **Auth API** (`src/lib/auth/api.ts`) — `/authorize` (redirect), `/token` (form-urlencoded
  exchange), `/auth/refresh`, `/auth/logout` against the SSO. Tokens kept client-side.
- **Two-step `/auth/me`** (`src/hooks/useMe.ts` + `src/lib/auth/api.ts`):
  (a) `GET ${SSO}/auth/me` → identity + global roles + auth perms;
  (b) `GET ${ERP}/api/v1/auth/me/` → service role + service permissions; merged
  (ERP perms preferred, derives `is_platform_owner` / `is_superuser` / `is_hq_user`).
- **Guard** — `components/auth/auth-guard.tsx` wraps `[orgSlug]/layout.tsx`, redirecting
  unauthenticated users to `/{orgSlug}/auth/login` (never auto-launches SSO).
- **Token refresh** — `src/lib/auth/token-refresh.ts`; `ApiClient` does one refresh+retry on 401.
- **Outlet / tenant** — `OutletFilter` + (platform-owner) `TenantFilter` in the header;
  state in zustand (`store/outlet-filter.ts`, `store/tenant-filter.ts`). Platform owners drill
  into a tenant via `?tenantId=` rather than tenant headers.

---

## 3. Data layer — `ApiClient` + TanStack Query (MANDATORY)

- **One `ApiClient` singleton** (`src/lib/api/client.ts`): axios instance; request interceptor
  injects `Authorization: Bearer`, `X-Tenant-Slug` + `X-Tenant-ID` (UUID-validated) for tenant
  users or `?tenantId=` for platform owners, and `X-Outlet-ID` when an outlet is selected;
  response interceptor handles 401 (one refresh+retry) and 403 `subscription_inactive` (toast,
  no logout); blob/Content-Disposition download helper for report exports.
- **Per-resource API modules** in `src/lib/api/*.ts` (typed): `employees`, `payroll`,
  `payroll-settings`, `hrm-settings`, `leave`, `attendance`, `appraisals`, `performance`,
  `training`, `recruitment`, `contracts`, `reports`, `users`, `security`, `settings`,
  `analytics`, `tenant`. DRF helpers in `drf.ts` (`normalizeList` for paginated envelopes).
- **Per-resource hooks** in `src/hooks/use-*.ts` wrapping `useQuery`/`useMutation` with stable
  query keys + `invalidateQueries`. **No inline `fetch`/`axios` in components.**
- A shared `useCrudResource` + `CrudManager` / `crud-manager.tsx` powers the many simple
  reference-data CRUD screens (departments, job titles/groups, leave types, payroll components…)
  from config, avoiding per-screen boilerplate.

---

## 4. RBAC

- `src/lib/auth/permissions.ts` + `src/hooks/use-app-permissions.ts` —
  `hasPermission` / `hasAnyPermission` / `isPlatformOwner` / `isSuperuser`. Permission
  categories cover **HR/Ops only** (no FINANCE/CRM/POS dead categories from the monolith).
- `components/auth/permission-gate.tsx` — declarative component gate around buttons/sections.
- Menu visibility is permission-filtered in `app-sidebar.tsx` via the `permissions[]` on each
  `menu-data` link; superusers / platform owners see all.

---

## 5. Branding + manifest

- `src/hooks/use-org-branding.ts` + `providers/branding-provider.tsx` fetch
  `GET ${AUTH_URL}/api/v1/tenants/by-slug/{slug}` (public) and apply brand CSS vars + logo/title.
- `[orgSlug]/layout.tsx` `generateMetadata` returns title/icons/theme-color **server-side**;
  `[orgSlug]/manifest.webmanifest/route.ts` serves the **per-tenant PWA manifest** server-side
  (fixes the per-tenant install fallback bug). No in-app branding editor — deep-links to auth-ui.

---

## 6. Subscription gating

- `src/hooks/use-subscription.ts` (+ `lib/auth/subscription.ts`) lazily fetches
  `GET ${SUBSCRIPTIONS_API_URL}/api/v1/tenants/{tenant_id}/subscription` (fail-open).
  `components/subscription/subscription-banner.tsx` + `subscription-gate.tsx` surface status;
  the `ApiClient` 403-`subscription_inactive` handler raises a sonner toast with an Upgrade action.
  Gating is **mutations-only**.

---

## 7. Layout / shell

`[orgSlug]/layout.tsx` → `components/layout/org-shell.tsx` composes `AppSidebar`
(data-driven menu, External-Services group, platform section), `AppTopbar`
(outlet/tenant filters, theme toggle, subscription banner), `Breadcrumb`, and the global
sonner toaster. Providers (`providers/*`): `QueryProvider`, `AuthProvider`,
`BrandingProvider`, `ThemeProvider`.

---

## 8. Architecture diagram

```mermaid
flowchart TD
  U[Browser] --> N[Next.js App Router /[orgSlug]/...]
  N --> SC[Server components + generateMetadata branding/manifest]
  N --> CC[Client components 'use client']
  CC --> AG[AuthGuard + PermissionGate]
  AG --> H[TanStack Query hooks use-*]
  H --> AC[ApiClient singleton axios]
  AC -->|Bearer + X-Tenant-* / X-Outlet-ID| ERP[(erp-api /api/v1/hrm/*)]
  AC -.->|token/me/by-slug branding/outlets| AUTH[(auth-api SSO)]
  AC -.->|subscription| SUBS[(subscriptions-api)]
  CC -.->|external links new tab| EXT[Treasury/CRM/POS/Inventory/Ordering/Projects/... UIs]
```

---

## 9. Build / deploy

- `pnpm build` (Next 16 + Turbopack) — green is the gate for every commit.
- Dockerfile uses pnpm with a frozen lockfile; liveness via `/healthz`.
- Env vars are `NEXT_PUBLIC_*` (build-time): API base, SSO/auth URLs, subscriptions URL,
  and the `NEXT_PUBLIC_*_UI_URL` external-service links (see [`integrations.md`](./integrations.md)).
- OAuth/OIDC is SSO-only; this repo carries **no** OAuth client secret or IdP config.
</content>
