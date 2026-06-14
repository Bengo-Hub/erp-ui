# ERP-UI Gaps, Bugs & Tech Debt — Status

> Tracks the debt the revamp set out to fix (the original Vue 3 audit) against the
> implemented Next.js 16 app. Sprints 1–4 are done; this records what is **resolved** and
> what **remains** for Sprint 5 (polish/cutover).

Severity: 🔴 critical · 🟡 high · 🟢 medium · ⚪ low/cleanup. Status: ✅ resolved · 🔄 partial · ⏳ open.

---

## 1. Strategic / framework debt — the reason for the revamp

| Item | Status |
|---|---|
| 🔴 Off-platform Vue 3 + PrimeVue island (no shared-lib reuse) | ✅ Re-platformed to Next.js 16 + React 19 + shadcn/@base-ui + TanStack Query + `@bengo-hub/shared-ui-lib` |
| 🔴 Bleeding-edge mismatched Vue/Vite/express versions, lock churn | ✅ On the platform-standard Next/pnpm stack; express/dual-lock dropped |
| 🟡 No TypeScript / no API types | ✅ TypeScript strict; all API contracts typed in `src/lib/api/*` |
| 🟡 No tests | 🔄 Playwright wired; e2e coverage lands in Sprint 5 |

---

## 2. Menu → route mismatches (broken navigation)

| Item | Status |
|---|---|
| 🔴 Attendance/appraisal menu links pointing at non-existent routes (records, rules, timesheet-approvals, appraisal cycles/goals/templates) | ✅ Menu is now **data-driven** from `menu-data.ts`; all 65 nav links resolve to real pages (verified) |
| Action: drive menu from a single source so dead links can't ship | ✅ Done — one `APP_MENU` array, permission-filtered |

---

## 3. Dead code / monolith leftovers (non-HR domains)

| Item | Status |
|---|---|
| 🟢 `PERMISSION_CATEGORIES` carrying FINANCE/TAX/CRM/ECOMMERCE/PROCUREMENT/MANUFACTURING categories | ✅ Permission model is HR/Ops only |
| 🟢 `getDashboardRedirectPath` redirecting to `/finance`,`/crm`,`/pos`… (404s) | ✅ Not ported |
| 🟢 `ROUTE_PERMISSIONS` prefix mismatch silently allowing everything | ✅ Replaced by per-link `permissions[]` + `PermissionGate` |
| ⚪ ecommerce `cartManager`/`productUtils`, storefront assets, `/ecommerce` analytics | ✅ Not ported |
| ⚪ Vestigial `project` report-filter (projects-service domain) | ✅ Removed in conformance cleanup (key + `project_id` param + field) |
| ⚪ Orphaned `/payroll/formulas` Sprint-2 stub (real page is `/settings/payroll/formulas`) | ✅ Deleted |
| ⚪ Sakai-template README / CHANGELOG / LICENSE, superseded Vue-era audit docs | ✅ Removed; docs streamlined to the HR/Ops set |

---

## 4. Auth / tenant / SSO

| Item | Status |
|---|---|
| 🟡 Dual auth (SSO + legacy DRF Token login) | ✅ SSO/OIDC-PKCE only; no legacy login, no `X-Business-ID`/`X-Branch-ID` |
| 🟡 Two competing branding systems | ✅ Single source: auth-api `by-slug` via `use-org-branding` |
| 🟡 `document.title` clobbering per-page titles | ✅ `generateMetadata` (server-side) manages titles |
| 🟢 `mergeProfiles` flicker while ERP `/auth/me/` JIT-provisions | 🔄 Two-step `useMe` with explicit loading state; monitor in Sprint 5 |
| 🟡 Tokens in `localStorage` (XSS surface) | ⏳ Platform-standard pattern retained; documented |

---

## 5. Inline I/O / data-layer debt

| Item | Status |
|---|---|
| 🟢 Direct axios/fetch in views | ✅ All I/O via `ApiClient` singleton + TanStack Query hooks; no inline fetch |
| 🟢 Manual caches (me/subscription/branding) | ✅ TanStack Query handles caching/dedupe |
| 🟢 State scattered across Vuex + local/session storage | ✅ Consolidated: zustand stores + query cache |

---

## 6. Build / deploy

| Item | Status |
|---|---|
| 🟡 Unused `express`, dual lockfiles, healthcheck on `/` | ✅ pnpm + frozen lockfile; liveness on `/healthz` |
| 🟢 `moment` + `date-fns` both bundled | ✅ date-fns only |
| 🟢 Two chart libraries (chart.js + highcharts) | ✅ recharts only |
| ⚪ committed dev certs / npm lock clutter | ✅ Clean Next.js repo |

---

## 7. UX / accessibility / responsive

| Item | Status |
|---|---|
| 🟢 ~790-line hardcoded mega-menu | ✅ Data-driven `menu-data.ts` |
| 🟢 13 near-duplicate statutory report pages | ✅ One config-driven `ReportRunner` + `reports-config.ts` |
| 🟢 AppLayout outside-click listener leak | ✅ N/A (new shell) |
| 🟢 Systematic ARIA / keyboard-nav / mobile QA | ✅ Sprint 5: dialog focus trap, skip-link + `main` landmark, nav landmarks/`aria-current`/`aria-expanded`, table `scope=col` + keyboard rows + labelled pagination, `SearchInput` labelled; responsive sidebar drawer |
| 🟢 Inconsistent loading/empty/error (blank screens, spinner-only) | ✅ Sprint 5: skeleton loaders in `DataTable`/detail/dashboards, `EmptyState`/`ErrorState` with roles, `[orgSlug]/error.tsx` boundary + `loading.tsx` |
| 🟢 Ad-hoc currency/number/date formatting | ✅ Sprint 5: centralized `src/lib/format.ts` (KES, Africa/Nairobi) applied everywhere |

---

## 8. Remaining for Sprint 5 (polish & cutover)

- ✅ Playwright e2e **smoke** (auth-gate redirects, login SSO control, return-to, healthz) —
  8/8 green headless against the standalone server. Deeper role-matrix / payroll-wizard /
  report-export e2e needs a seeded backend (deferred to cutover staging).
- ✅ Accessibility / responsive sweep across data tables, dialogs, nav, search and the shell.
- ✅ Performance pass (recharts code-split, memoized report table, `optimizePackageImports`)
  and PWA verification (per-tenant manifest, update banner, offline shell).
- 🔄 Realtime payroll-progress (`use-payroll-progress` WS) — process flow currently uses
  request/response; wire the socket if/when erp-api exposes it.
- ⏳ Parity sign-off vs. the retired Vue app + Docker/CI/Helm/ArgoCD deploy parity + DNS
  cutover (cutover-phase work, not application polish).
- 🔄 Some erp-api endpoints (leave logs, attendance rules, shift-planner resolve, appraisal
  responses) may still be in progress; pages already render loading/empty/error gracefully.

> The original audit's Finance/Inventory/Procurement/Manufacturing/CRM/POS sections are
> obsolete — those are external services and are intentionally **not** in this app.
</content>
