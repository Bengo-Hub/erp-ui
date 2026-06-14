# BengoBox ERP UI (Next.js 16)

HR + internal-operations frontend for the BengoBox / Codevertex platform —
rebuilt from Vue 3 / Vite / PrimeVue to **Next.js 16 (App Router) + React 19**,
matching the platform's other UIs (treasury-ui, pos-ui, ordering-frontend).

> The legacy Vue app is preserved under [`legacy-vue/`](./legacy-vue) for
> reference during the migration. Architecture and migration docs live in
> [`docs/`](./docs).

## Stack

Next.js 16.2 · React 19.2 · TypeScript (strict) · TanStack Query 5 · axios
`ApiClient` singleton · Tailwind v4 · `@bengo-hub/shared-ui-lib` · sonner ·
zustand · next-themes · lucide-react · `@ducanh2912/next-pwa` · date-fns ·
Playwright · pnpm.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # adjust URLs for your environment
pnpm dev                     # http://localhost:3000
```

Open `/{orgSlug}` (e.g. `/codevertex`). Unauthenticated users are sent to
`/{orgSlug}/auth/login` (no auto-SSO). Sign-in runs the OIDC PKCE flow against
auth-api and returns via the flat `/auth/callback`.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build (standalone output) |
| `pnpm start` | Run the built app |
| `pnpm lint` | ESLint (flat config) |
| `pnpm test:e2e` | Playwright e2e |

## Architecture (Sprint 1)

- **Routing**: `src/app/[orgSlug]/…` tenant-scoped App Router; flat
  `/auth/callback`; `/landing`; `/healthz`.
- **Data layer**: `src/lib/api/client.ts` (`apiClient` singleton — Bearer +
  `X-Tenant-*` / `?tenantId` for platform owners + `X-Outlet-ID`; 401 refresh;
  403 subscription toast). Per-resource hooks in `src/hooks/use-*.ts`. No inline
  fetch in components.
- **Auth/SSO**: `src/lib/auth/*` (PKCE, token exchange/refresh) +
  `src/store/auth.ts` (zustand) + two-step `useMe()` (SSO `/auth/me` merged with
  erp-api `/auth/me/`).
- **Shell**: `src/components/layout/*` (data-driven sidebar, topbar, breadcrumb)
  + outlet/tenant filters + subscription banner/gate + ConfirmDialog + sonner.
- **Branding**: `BrandingProvider` (CSS vars from auth-api `by-slug`) +
  per-`[orgSlug]` `generateMetadata` + server-generated
  `manifest.webmanifest/route.ts` (per-tenant PWA install).
- **RBAC**: `use-app-permissions.ts` + `<PermissionGate>` + `<AuthGuard>`.

Environment variables are `NEXT_PUBLIC_*` (mapped from the old `VITE_*` — see
[`docs/integrations.md`](./docs/integrations.md) §9 and `.env.example`).

## Docker

```bash
docker build -t erp-ui .
docker run -p 3000:3000 erp-ui
```

Build args inject `NEXT_PUBLIC_*` (see `Dockerfile`). `/healthz` returns
`{ "status": "healthy" }`.
