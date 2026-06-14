# Sprint 5 — Polish & Cutover

> **Status: 🔄 IN PROGRESS** — application polish ✅ done (formatting, states, a11y/
> responsive, performance, PWA, e2e smoke). Remaining: Docker/CI parity (Dockerfile +
> `/healthz` already present), full parity sign-off vs the Vue app, and the DNS/ingress cutover.

**Goal:** Production hardening, parity verification, and switching `erp-ui` traffic to the Next.js app while keeping the Vue app as rollback.

## Polish — completed in this pass
- **Centralized formatting** (`src/lib/format.ts`): KES currency / number / percent and
  Africa/Nairobi dates, applied across reports, dashboards, security, contracts, attendance,
  stat-tiles, payroll/payslips. No ad-hoc `Intl`/`toLocale*`/`toFixed` remain outside the util.
- **Loading / empty / error states:** `Skeleton`/`TableSkeleton`/`CardsSkeleton`/
  `DetailSkeleton`; `DataTable` renders a column-aware skeleton (not a bare spinner); detail
  & dashboard pages use skeletons; segment-level `[orgSlug]/error.tsx` boundary (keeps the
  shell) + route `loading.tsx`. ARIA roles (`status`/`alert`) on all state panels.
- **Accessibility:** Dialog focus trap + autofocus + focus restore + scroll lock +
  `aria-labelledby/aria-describedby`; skip-to-content link + focusable `main`; nav landmarks,
  `aria-current`, `aria-expanded`; `SearchInput` `type=search` + label; table `scope=col`,
  keyboard-activatable rows, labelled pagination. Responsive sidebar drawer already in place.
- **Performance:** recharts code-split via `next/dynamic` behind `@/components/charts`;
  `ReportRunner` columns/tiles memoized; `optimizePackageImports` for lucide/recharts/date-fns.
  (PDF/Excel export is server-side; print uses native `window.print()` — no heavy client libs.)
  React Compiler left OFF — it breaks the Turbopack build on valid `next/dynamic` patterns.
- **PWA:** per-tenant manifest (server-rendered) verified; `PwaUpdateBanner` (waiting-SW
  detection + reload); `/offline` shell wired as the next-pwa document fallback.
- **E2E smoke (Playwright):** auth-gate redirects (dashboard/employees/payroll-process/
  payslips/report), login SSO control, return-to preservation, healthz — 8/8 green headless
  against the standalone server (`e2e/start-standalone.mjs`).

## Deferred to cutover
- Docker image build + healthcheck wiring into standard CI/CD + Helm/ArgoCD parity.
- Full parity sign-off against `component-inventory.md` on a staging subdomain.
- DNS/ingress switch + Vue-app decommission after a stable window.
- Realtime `use-payroll-progress` WS (pending erp-api socket).
- Snapshot tests of statutory PDF/Excel vs the Vue app (needs a seeded backend).

## Scope
**Quality & UX**
- Accessibility pass (ARIA, labels, keyboard nav, focus management) across all surfaces — esp. the 13 report pages and the payroll spreadsheet grid.
- Responsive/mobile pass (replace ad-hoc `mobile-responsive.css` + `mobileService` with Tailwind responsive design).
- Loading/empty/error states everywhere (skeletons, `EmptyState`, error boundaries); sonner toasts standardized; shared `ConfirmDialog` on all destructive actions.
- Per-page titles via `generateMetadata` (fix the global `document.title` override).
- Fix carried-over bugs: AppLayout outside-click listener leak; mixed path casing; RBAC `ROUTE_PERMISSIONS` realignment verified.

**Testing**
- Playwright e2e: auth/SSO, tenant scoping, RBAC role matrices, payroll process, leave lifecycle, report generation, settings CRUD.
- Snapshot-test statutory PDF/Excel outputs against the current Vue app.

**Performance & PWA**
- Code-split heavy routes; verify bundle (no moment/highcharts/two-chart-libs). React Compiler on.
- PWA: per-tenant manifest, service worker (next-pwa), offline indicator, update banner (mirror platform PWA pattern).

**Build / deploy / cleanup**
- Dockerfile (Next standalone) + healthcheck on `/healthz`; CI/CD + Helm + ArgoCD parity with other UIs.
- Remove dead non-HR code/assets, express, npm lock, backup files (gaps §3, §6).
- Env: all `NEXT_PUBLIC_*` set in build args; external-service links verified.

**Cutover**
- Deploy to staging subdomain; run full parity checklist from `component-inventory.md`.
- DNS/ingress switch `erp.codevertexitsolutions.com` → Next.js app; keep Vue deployable for rollback; decommission after a stable window.

## Acceptance criteria
- Parity checklist 100% (every in-scope route ported and verified).
- Playwright e2e green; a11y audit passes; PDF/Excel snapshots match.
- Lighthouse/perf acceptable; PWA installable per tenant.
- Image builds, healthcheck green, deployed via standard CI/CD; Vue app retired after cutover window.
- No PrimeVue/Vue dependencies remain; uses `@bengo-hub/shared-ui-lib`; zero inline fetch/axios.

## Dependencies
Sprints 1–4 complete.
