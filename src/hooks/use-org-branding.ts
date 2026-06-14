"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchTenantBySlug, type TenantBrand } from "@/lib/api/tenant";

/**
 * Tenant branding (name, logo, colors) from auth-api by-slug. Cached ~6h, the
 * same order of magnitude as the JWT TTL.
 */
export function useOrgBranding(slug: string) {
  return useQuery<TenantBrand | null>({
    queryKey: ["tenant-brand", slug],
    queryFn: () => fetchTenantBySlug(slug),
    enabled: !!slug,
    staleTime: 6 * 60 * 60 * 1000,
    retry: false,
  });
}
