# ERP-UI Documentation

`erp-ui` (package `bengobox-erp-ui`) is the **HR & internal-operations** frontend of the
BengoBox / Codevertex platform — **Next.js 16 (App Router) + React 19 + TypeScript +
TanStack Query + shadcn on @base-ui + Tailwind v4**, matching treasury-ui / pos-ui.

After the platform was decomposed into microservices, ERP-UI owns **HR/Ops only**
(employees, payroll, leave, attendance, recruitment, training, appraisals/performance,
reports, users/security, settings, dashboards/ESS). Every other domain (finance, CRM,
inventory, POS, ordering, projects, notifications, billing) lives in its own service and
is reached as an **external link** only — ERP-UI never holds that data.

## Docs

- **[Revamp Plan](./revamp-plan.md)** — rationale, target stack, scope, sprint status (1–4 done).
- **[Architecture](./architecture.md)** — implemented Next.js 16 architecture (routing, auth, data layer, RBAC, branding, shell).
- **[Integrations](./integrations.md)** — every backend contract ERP-UI calls (erp-api `/api/v1/hrm/*`, auth SSO/branding, subscriptions) + the cross-service data-ownership map.
- **[Component & Route Inventory](./component-inventory.md)** — the real implemented pages, routes, and shared components.
- **[Gaps & Bugs](./gaps-and-bugs.md)** — what the revamp fixed vs. what remains.
- **[Sprints](./sprints)** — per-sprint scope and status.
</content>
