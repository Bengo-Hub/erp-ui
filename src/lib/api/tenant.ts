/**
 * Tenant lookups against auth-api (public endpoints).
 *  - GET /api/v1/tenants/by-slug/{slug}  → branding (public)
 *  - GET /api/v1/tenants/{slug}/outlets  → outlet list (public)
 *  - GET /api/v1/admin/tenants           → platform-owner tenant list (JWT)
 */

import { useAuthStore } from "@/store/auth";

const AUTH_API_URL = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.NEXT_PUBLIC_SSO_URL ||
  "https://sso.codevertexitsolutions.com"
).replace(/\/$/, "");

export interface TenantBrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  status?: string;
  use_case?: string;
  logo_url?: string;
  brand_colors?: TenantBrandColors;
  contact_email?: string;
  website?: string;
  metadata?: Record<string, unknown>;
}

export interface TenantBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  orgName: string;
  useCase: string;
}

export interface OutletItem {
  id: string;
  code: string;
  name: string;
  use_case?: string;
  is_hq?: boolean;
  status?: string;
}

interface TenantMeta {
  logo_url?: string;
  logoUrl?: string;
  primary_color?: string;
  primaryColor?: string;
  secondary_color?: string;
  secondaryColor?: string;
  org_name?: string;
  orgName?: string;
}

export function parseBrandFromTenant(t: TenantResponse): TenantBrand {
  const meta = (t.metadata || {}) as TenantMeta;
  const logoUrl = t.logo_url ?? meta.logo_url ?? meta.logoUrl ?? null;
  const primaryColor = t.brand_colors?.primary ?? meta.primary_color ?? meta.primaryColor ?? null;
  const secondaryColor =
    t.brand_colors?.secondary ?? meta.secondary_color ?? meta.secondaryColor ?? null;
  const orgName = meta.org_name ?? meta.orgName ?? t.name ?? "";

  return {
    id: t.id,
    name: t.name ?? "",
    slug: t.slug ?? "",
    logoUrl: typeof logoUrl === "string" ? logoUrl : null,
    primaryColor: typeof primaryColor === "string" ? primaryColor : null,
    secondaryColor: typeof secondaryColor === "string" ? secondaryColor : null,
    orgName: typeof orgName === "string" ? orgName : (t.name ?? ""),
    useCase: t.use_case ?? "other",
  };
}

export async function fetchTenantBySlug(slug: string): Promise<TenantBrand | null> {
  if (!slug) return null;
  try {
    const res = await fetch(
      `${AUTH_API_URL}/api/v1/tenants/by-slug/${encodeURIComponent(slug)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    return parseBrandFromTenant((await res.json()) as TenantResponse);
  } catch {
    return null;
  }
}

export async function fetchOutlets(slug: string, accessToken?: string): Promise<OutletItem[]> {
  if (!slug) return [];
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(
      `${AUTH_API_URL}/api/v1/tenants/${encodeURIComponent(slug)}/outlets`,
      { headers },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list: OutletItem[] = Array.isArray(data) ? data : (data.outlets ?? data.data ?? []);
    return list.filter((o) => o.status !== "archived");
  } catch {
    return [];
  }
}

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  status?: string;
}

export async function listPlatformTenants(search?: string): Promise<PlatformTenant[]> {
  const token = useAuthStore.getState().session?.accessToken;
  if (!token) return [];
  const url = new URL(`${AUTH_API_URL}/api/v1/admin/tenants`);
  if (search) url.searchParams.set("search", search);
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list: PlatformTenant[] = Array.isArray(data)
      ? data
      : (data?.data ?? data?.tenants ?? data?.items ?? []);
    return list.filter((t) => t.slug !== "codevertex");
  } catch {
    return [];
  }
}
