"use client";

import { useQuery } from "@tanstack/react-query";

import { resolveApiBaseUrl } from "@/lib/api/client";
import { SSO_ME_URL } from "@/lib/auth/api";
import type { UserProfile } from "@/lib/auth/types";
import { useAuthStore } from "@/store/auth";
import { parseJwt } from "@/lib/utils";

const ME_QUERY_KEY = ["auth", "me"] as const;
const ME_STALE_MS = 5 * 60 * 1000; // 5 min TTL (matches the Vue meService cache)

const ERP_API_URL = resolveApiBaseUrl().replace(/\/$/, "");

function mergeUnique(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]));
}

/**
 * Step (b): erp-api GET /api/v1/auth/me/ — service role + service permissions.
 * Non-blocking; 404 = not provisioned (JIT) → fall back to SSO profile.
 */
async function fetchServiceMe(
  token: string,
): Promise<{ roles: string[]; permissions: string[] } | null> {
  try {
    const res = await fetch(`${ERP_API_URL}/api/v1/auth/me/`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      roles: Array.isArray(data.service_roles)
        ? data.service_roles
        : Array.isArray(data.roles)
          ? data.roles
          : [],
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
    };
  } catch {
    return null;
  }
}

/**
 * Two-step /auth/me: SSO identity (primary) merged with erp-api service RBAC.
 * Updates the auth store user so the ApiClient picks up resolved tenant context.
 */
async function fetchMe(): Promise<UserProfile> {
  const token = useAuthStore.getState().session?.accessToken;
  if (!token) throw new Error("No session");

  const [ssoRes, serviceData] = await Promise.all([
    fetch(SSO_ME_URL, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }),
    fetchServiceMe(token),
  ]);

  if (!ssoRes.ok) {
    const err = await ssoRes.json().catch(() => ({}));
    const error = new Error(err.error_description || err.error || `Me failed: ${ssoRes.status}`);
    (error as unknown as { response: { status: number } }).response = { status: ssoRes.status };
    throw error;
  }

  const data = await ssoRes.json();
  let roles: string[] = Array.isArray(data.roles) ? data.roles : [];
  let permissions: string[] = Array.isArray(data.permissions) ? data.permissions : [];
  const slug = data.tenant_slug ?? data.tenant?.slug ?? "";

  if (serviceData) {
    roles = mergeUnique(roles, serviceData.roles);
    // Prefer ERP permissions; union with SSO so neither is lost.
    permissions = mergeUnique(serviceData.permissions, permissions);
  }

  // The SSO /auth/me response has no top-level sub_exempt/billing_mode field — those live
  // only in the JWT claims (stamped by auth-api from Tenant.subscription_exempt). Decode
  // the token so this profile doesn't clobber the exemption profileFromClaims already set.
  const jwtClaims = parseJwt(token);

  const profile: UserProfile = {
    id: data.id ?? data.sub ?? "",
    email: data.email ?? "",
    fullName: data.profile?.name ?? data.full_name ?? data.name ?? data.email ?? "",
    roles,
    permissions,
    organizationId: data.tenant_id ?? data.primary_tenant ?? "",
    tenantId: data.tenant_id ?? data.primary_tenant ?? "",
    tenantSlug: slug,
    outletId: data.outlet_id ?? null,
    isHqUser: data.is_hq_user === true,
    isPlatformOwner: data.is_platform_owner === true || slug === "codevertex",
    isSuperUser: roles.includes("superuser") || data.is_superuser === true,
    subExempt: jwtClaims.sub_exempt === true,
    billingMode: (jwtClaims.billing_mode as string) ?? "",
  };

  // Keep the store + ApiClient in sync with the authoritative profile.
  useAuthStore.getState().setUser(profile);
  return profile;
}

/** Load current user + RBAC (roles/permissions) with a 5-min TTL. */
export function useMe(enabled = true) {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    enabled,
    staleTime: ME_STALE_MS,
    gcTime: ME_STALE_MS * 2,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}

export function useIsPlatformOwner(): boolean {
  const { data } = useMe();
  return data?.isPlatformOwner ?? false;
}
