"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOutlets, type OutletItem } from "@/lib/api/tenant";
import { useAuthStore } from "@/store/auth";

/** Outlet list for a tenant (auth-api /tenants/{slug}/outlets). */
export function useOutlets(slug: string, enabled = true) {
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  return useQuery<OutletItem[]>({
    queryKey: ["outlets", slug],
    queryFn: () => fetchOutlets(slug, accessToken),
    enabled: enabled && !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
