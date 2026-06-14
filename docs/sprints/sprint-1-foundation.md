# Sprint 1 — Foundation (scaffold, auth/SSO, data layer, layout/branding)

> **Status: ✅ COMPLETE** (on `revamp`, building green).

**Goal:** A running Next.js 16 app with tenant-scoped routing, SSO/PKCE login, the `ApiClient` + TanStack Query data layer, RBAC gating, the layout shell with per-tenant branding + PWA manifest, and subscription gating — i.e. an authenticated empty shell everything else plugs into.

## Scope
- Scaffold Next.js 16 (App Router, TS, React Compiler) with the treasury-ui toolchain: TanStack Query, `@bengo-hub/shared-ui-lib`, Tailwind v4, sonner, zustand, next-themes, lucide-react, react-hook-form+zod, recharts, @ducanh2912/next-pwa, Playwright. pnpm.
- `src/app/[orgSlug]/layout.tsx` shell + `(public)/landing`, `not-found.tsx`, `error.tsx`, `healthz/route.ts`.
- Providers: `QueryClientProvider`, `OrgSlugProvider`, `ThemeProvider`, `AuthProvider`.
- `src/lib/api/client.ts` `ApiClient` (Bearer + `X-Tenant-Slug`/`X-Tenant-ID`(UUID-checked)/`X-Outlet-ID`; 401 refresh; 403 `subscription_inactive` → sonner toast; blob download). Env `NEXT_PUBLIC_*` (map from `VITE_*`, see integrations.md §9).
- Auth: `lib/auth/{pkce,api,token-refresh,permissions,types}.ts`; `useMe()` two-step (`/auth/me` SSO + `/auth/me/` ERP merged); pages `[orgSlug]/auth/{login,callback,select-outlet,forgot-password,reset-password/[uid]/[token]}` + flat `/auth/callback`.
- Tenant context: `use-resolved-tenant.ts`, platform-owner detection (`is_platform_owner` claim OR `orgSlug==='codevertex'`).
- RBAC: `use-app-permissions.ts` (port `usePermissions` minus dead non-HR categories), `<PermissionGate>`, `<AuthGuard>`.
- Layout: `components/layout/{AppSidebar,AppTopbar,AppMenu(data-driven),Breadcrumb}` + `OutletFilter` + platform `TenantFilter`.
- Branding: `use-org-branding.ts` (`/api/v1/tenants/by-slug/{slug}`), brand CSS vars in shell, `generateMetadata` (title/icons/theme-color), `[orgSlug]/manifest.webmanifest/route.ts` (per-tenant PWA manifest).
- Subscription: `use-subscription.ts`, `<SubscriptionBanner>`, `<SubscriptionGate>`.

## API hooks needed
`useMe`, `use-resolved-tenant`, `use-org-branding`, `use-subscription`, `use-app-permissions`, `use-outlets` (auth-api `/tenants/{slug}/outlets`).

## Acceptance criteria
- Visiting `/{orgSlug}` unauthenticated → `/{orgSlug}/auth/login` (no auto-SSO); login → PKCE → callback → token stored → shell renders.
- Tenant branding (colors/logo/title) applied per slug; per-tenant manifest served and installable.
- `ApiClient` sends correct headers for tenant users vs platform owners (`?tenantId`).
- 401 triggers one refresh+retry; 403 `subscription_inactive` shows Upgrade toast (no logout).
- Sidebar renders from route-derived menu, filtered by permission; platform-admin section only for owners.
- TypeScript strict, ESLint (next) clean, `pnpm build` + Docker image OK, `/healthz` returns healthy.

## Dependencies
None (kickoff). Coordinate SSO `redirect_uri` registration with auth-api (reuse flat `/auth/callback`).
