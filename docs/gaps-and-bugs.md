# ERP-UI Gaps, Bugs & Tech Debt

> Rigorous audit of the current Vue 3 `erp-ui`: broken flows, dead code, menu/route mismatches, bugs, accessibility/responsive issues, and tech debt. File:line citations where exact. Use this to scope the Next.js revamp so we don't port the rot.

Severity: 🔴 critical · 🟡 high · 🟢 medium · ⚪ low/cleanup.

---

## 1. Strategic / framework debt (the reason for the revamp)

- 🔴 **Off-platform stack.** erp-ui is the only major UI on **Vue 3 + PrimeVue**; every other UI (treasury-ui, pos-ui, ordering-frontend, marketflow) is **Next.js 16 + React 19 + shadcn/@base-ui + TanStack Query + `@bengo-hub/shared-ui-lib`**. It cannot reuse any shared component/auth/api libraries → duplicated PKCE/SSO/branding/subscription logic, divergent UX, double maintenance.
- 🔴 **Bleeding-edge, mismatched versions.** `vue-router ^5.1.0`, `vite ^8.0.16`, `express ^5`, `tailwindcss ^4.3.0`, `eslint ^9.39` — several are ahead of typical stable usage and create lock churn (`express` is declared but unused at runtime — see §6).
- 🟡 **No tests.** `"test": "echo 'No tests configured'"` ([package.json:13](../package.json)); vitest/@vue/test-utils installed but unused. Zero unit/e2e coverage.
- 🟡 **JS, not TS** (mostly). Two stray `.ts` composables (`useChartOptions.ts`, `useDashboardState.ts`) — inconsistent. No type safety on API contracts.

---

## 2. Menu → route mismatches (broken navigation) 🔴/🟡

`AppMenu.vue` links to paths that have **no matching route** → 404/NotFound:

- 🔴 `AppMenu.vue:307` → `/hrm/attendance/attendanceRecords` but the route is `/hrm/attendance/records` ([employeeRoutes.js:442](../src/router/employeeRoutes.js)). **Broken link.**
- 🔴 `AppMenu.vue:313` → `/hrm/attendance/attendanceRules` — **no route exists** at all.
- 🔴 `AppMenu.vue:325` → `/hrm/attendance/timesheetApprovals` — **no route exists**.
- 🟡 `AppMenu.vue:225/230` "Employee Documents → Document Library / Templates" — menu items with **no `to` and no route** (dead).
- 🟡 `AppMenu.vue:356` → `/hrm/appraisals/appraisalConfiguration`, `:362` → `/hrm/appraisals/appraisalCycles`, `:373` → `/hrm/appraisals/goalsList`, `:379` → `/hrm/appraisals/goalsLibrary`, `:385` → `/hrm/appraisals/myGoals`, `:393` → `/hrm/appraisals/templates` — these views **exist as `.vue` files but are not registered in `appraisalRoutes.js`** → 404 even though the screen was built. The router only registers `appraisals`, `:id`, `:id/edit`, `templates`(workflow path differs), `workflow`, `goals`, `evaluators`, `questions`, `:id/review`. So `goalsList` (menu) ≠ `goals` (route), `appraisalCycles`/`goalsLibrary`/`myGoals`/`appraisalConfiguration`/`templates` have no routes.
- 🟢 Numerous orphan appraisal views with no route or menu entry: `addAppraisal`, `addGoal`, `appraisalCycle`, `appraisalHistory`, `appraisalProgress`, `myAppraisals`, `newQuestion`, `newTemplate`, `performanceMetrics`, `appraisalWorkflow`.

> Action: in the port, drive the menu from the route table (single source of truth) so a missing route can't ship a dead menu link.

---

## 3. Dead code / leftovers from the monolith ⚪/🟢

- 🟢 `usePermissions.js:66-141` ([usePermissions.js](../src/composables/usePermissions.js)) — `PERMISSION_CATEGORIES` still includes **FINANCE, TAX, KRA, CRM, ECOMMERCE, PROCUREMENT, MANUFACTURING, NOTIFICATIONS** categories for domains that are now external services. Dead weight; misleads RBAC.
- 🟢 `permissionService.getDashboardRedirectPath` ([permissionService.js:279-293](../src/services/auth/permissionService.js)) still redirects to `/finance`, `/crm`, `/procurement`, `/manufacturing`, `/pos` — **routes that no longer exist** in this app. A non-employee finance user would be redirected to a 404.
- 🟢 `middleware/permission.js` `ROUTE_PERMISSIONS` keys like `/payroll`, `/payroll/payslips/...`, `/attendance/...`, `/leave/...` ([permission.js:5-95](../src/middleware/permission.js)) use a **different path prefix** (`/payroll`, `/hrm/employees`) than the **actual routes** (`/hrm/payroll/...`, `/hrm/Leave/...`), so most entries never match — permission enforcement silently falls through to "allow".
- ⚪ `analyticsService.js` references `/ecommerce` — dead domain.
- ⚪ `utils/cartManager.js`, `utils/productUtils.js` — e-commerce leftovers, irrelevant to HR.
- ⚪ `composables/useGlobalCurrency.backup.js` — backup file committed.
- ⚪ `src/assets/img/{home,shop}`, `assets/images/{order,products}` — storefront assets in an HR app.
- ⚪ `views/pages/performance/ImageOptimizationDashboard.vue`, `PerformanceDashboard.vue`, `communication/CommunicationDashboard.vue` — dev/ops dashboards with no routes.
- ⚪ Duplicate security settings: `security/settings.vue` (routed) vs `security/SecuritySettings.vue` (orphan).
- ⚪ `README.md` is still the **Sakai template readme** ("Sakai is an application template…") and references `docs/PNPM_MIGRATION.md` which does not exist in `docs/`.

---

## 4. Auth / tenant / SSO issues 🟡

- 🟡 **Token storage in `localStorage`** (`ssoService.js` `access_token`/`refresh_token`/`id_token`) — XSS-exfiltration risk. Acceptable platform-wide pattern but should be documented; consider memory + refresh-cookie in the rewrite if backend supports it.
- 🟡 **Dual auth modes** (SSO + legacy DRF Token) both live in `store/modules/auth.js` and `axiosConfig.js`. The legacy `/auth/security/login/` flow, business/branding payload, `X-Business-ID`/`X-Branch-ID` headers, and `businessBranding.js` are all still wired. In SSO-only prod this is dead complexity and a second branding system competing with `tenantBrandingService.js`.
- 🟡 **Two branding systems.** `tenantBrandingService.js` (auth-api `by-slug`, CSS vars) AND `businessBranding.js` + Vuex `fetchBrandingSettings`/`updateBrandingSettings` (erp-api `/business/.../branding-settings/`). They can fight over `--primary-color`/`document.title`.
- 🟡 **`document.title` set from branding** ([tenantBrandingService.js:95](../src/services/auth/tenantBrandingService.js)) — overrides per-page titles; no per-route title management. Next.js `generateMetadata` fixes this.
- 🟢 `mergeProfiles` precedence is subtle (ERP perms else SSO perms) — when ERP `/auth/me/` 404s (JIT delay) the user briefly has only global roles, which can flicker menu/permission state. Document the loading state explicitly in the port.
- 🟢 `axiosConfig.js:117` platform-owner detection by **business name string compare** (`PLATFORM_OWNER_BUSINESS_NAME`) is fragile and duplicates the slug/claim check in `tenantContext.isPlatformOwnerContext`.
- 🟢 Permission middleware reads `user` from `sessionStorage` ([permission.js:145-150](../src/middleware/permission.js)) while `usePermissions` reads from Vuex — two sources of the same truth that can desync after refresh.

---

## 5. Inline I/O / service-layer violations 🟢

- 🟢 Direct axios/fetch in views (should go through services): `settings/payroll/Banks.vue`, `settings/payroll/CustomizePayslip.vue` (Grep hits for `axios`/`fetch`). Minor but breaks the "zero direct axios" claim in the old report.
- 🟢 `BaseService` swallows errors via `handleError(error)` and **returns** its result instead of rethrowing in several verbs — callers can't reliably distinguish success from a handled-error object. Verify per-call.

---

## 6. Build / deploy issues 🟡

- 🟡 **`express ^5` is a dependency but unused.** `server.js` is intentionally pure-Node (comment at top says Express 5 → qs dependency repeatedly failed under pnpm in Docker). Remove `express` from `package.json`.
- 🟡 **`Dockerfile` HEALTHCHECK uses `wget`** on `node:22.13-alpine` (`wget -qO- http://localhost:${PORT}/`) — `/` returns the SPA, but the real probe `/health` in `server.js` is unused by the healthcheck. Point healthcheck at `/health`.
- 🟢 `moment` **and** `date-fns` both bundled — pick one (date-fns) to cut bundle size.
- 🟢 `highcharts` + `highcharts-vue` imported-then-commented in `main.js:122-125` but still in deps; also chart.js present → **two chart libraries** shipped.
- 🟢 `vite-plugin-node-polyfills` + `crypto-browserify` only needed because PKCE used a polyfill path; modern `window.crypto.subtle` (already used in `ssoService.js`) makes the polyfill largely unnecessary.
- ⚪ `localhost.pem` / `localhost-key.pem` committed at repo root (dev certs — not secrets, but clutter; ensure no real keys ever land here per global no-secrets rule).
- ⚪ `package-lock.json` (npm) AND `pnpm-lock.yaml` both committed though pnpm is the package manager — drop the npm lock.

---

## 7. UX / accessibility / responsive 🟢

- 🟢 **Hardcoded mega-menu** in `AppMenu.vue` (~790 lines) — unmaintainable; deeply nested (4 levels), permission strings inline. Hard to keep in sync with routes (see §2).
- 🟢 **Sakai template heritage** — generic theme, `FloatingConfigurator`, `AppConfigurator` theme-toggle UI that overlaps tenant branding; `assets/demo/` flags + demo data still present.
- 🟢 Outside-click handler bug: `AppLayout.vue:54` calls `document.removeEventListener('click', outsideClickListener)` passing the **ref object** instead of `outsideClickListener.value` → listener never actually removed (leak).
- 🟢 No evidence of systematic ARIA/labels/keyboard-nav beyond PrimeVue defaults; mobile responsiveness relies on one `assets/styles/mobile-responsive.css` + `mobileService` — verify on the 13 report pages and the spreadsheet grid.
- 🟢 13 statutory report pages are near-duplicates (only the report type differs) — high duplication, inconsistent fixes.
- 🟢 Mixed path casing (`/hrm/Leave/...`) and inconsistent route naming (`employee_spreadsheet` params order) make deep links brittle.

---

## 8. Data-layer / state debt 🟢

- 🟢 **Manual caching** reimplemented (meService in-module cache, subscription singleton, branding sessionStorage cache) — exactly what TanStack Query gives for free. Port to query hooks.
- 🟢 **State scattered** across Vuex + `localStorage` + `sessionStorage` (tokens, tenant, outlet, user JSON, business JSON, permissions). No single source of truth.
- 🟢 `BaseService.defaultPageSize = 100` and many list calls fetch `page_size: 200` (e.g. `resolveEmployeeMapping` in `auth.js:409`) — unbounded-ish fetches client-side instead of server-side filtering.

---

## 9. Known functional gaps (from prior `UI_ANALYSIS_REPORT.md`, re-validated)

- 🟡 Custom Reports builder (`reports/CustomReports.vue`) — exists but completeness unverified; needs backend custom-report contract.
- 🟡 Attendance Records/Rules + Timesheet Approvals — menu links broken (§2); records view exists, rules/approvals do not.
- 🟢 Employee Documents (library/templates) — menu only, never built.
- 🟢 Recruitment views exist but are thin (Jobs/Candidates/Applications/Onboarding).

> The old report's Finance/Inventory/Procurement/Manufacturing/CRM/POS sections are **obsolete** — those are external services now and must NOT be ported here.

---

## Top 10 to fix in the revamp

1. 🔴 Re-platform to Next.js 16/React to rejoin shared libs (whole point).
2. 🔴 Fix broken attendance/appraisal menu→route links by driving the menu from the route table.
3. 🔴 Realign `ROUTE_PERMISSIONS` (or replace with per-route `requiresPermission` metadata) so RBAC actually enforces.
4. 🟡 Remove dead non-HR domains (permission categories, dashboard redirects, ecommerce/cart utils, storefront assets).
5. 🟡 Collapse dual auth (drop legacy DRF login) and dual branding (keep auth-api `by-slug` only).
6. 🟡 Replace manual caches with TanStack Query; consolidate token/tenant/outlet state.
7. 🟡 Build one `ReportLayout` + `useReport()` to de-duplicate 13 statutory report pages.
8. 🟡 Add tests (none today) + TypeScript types for all API contracts.
9. 🟡 Clean deps: drop express, one of moment/date-fns, one chart lib, npm lock; fix Docker healthcheck → `/health`.
10. 🟢 Fix the AppLayout outside-click listener leak and per-page title management (via `generateMetadata`).
