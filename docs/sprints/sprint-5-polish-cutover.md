# Sprint 5 — Polish & Cutover

**Goal:** Production hardening, parity verification, and switching `erp-ui` traffic to the Next.js app while keeping the Vue app as rollback.

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
