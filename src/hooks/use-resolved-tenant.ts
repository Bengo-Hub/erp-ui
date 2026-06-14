"use client";

import { useParams } from "next/navigation";

import { useAuthStore } from "@/store/auth";
import { useTenantFilterStore } from "@/store/tenant-filter";

/**
 * Resolves the tenant identifier for API calls.
 *  - Platform owners: the TenantFilter selection (undefined = all). Drill-in is
 *    done via ?tenantId= by the ApiClient, not the URL path.
 *  - Regular tenants: the orgSlug from the URL.
 */
export function useResolvedTenant() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const user = useAuthStore((s) => s.user);
  const isPlatformOwner = orgSlug === "codevertex" || !!user?.isPlatformOwner;
  const selected = useTenantFilterStore((s) => s.selected);

  if (!isPlatformOwner) {
    return {
      isPlatformOwner: false,
      orgSlug,
      tenantPathId: orgSlug,
      tenantQueryParam: undefined as string | undefined,
      hasTenant: !!orgSlug,
    };
  }

  return {
    isPlatformOwner: true,
    orgSlug,
    tenantPathId: orgSlug,
    tenantQueryParam: selected?.id,
    hasTenant: !!selected,
  };
}
