import { create } from "zustand";

import { apiClient } from "@/lib/api/client";
import { authAdminClient } from "@/lib/api/auth-admin-client";

export interface TenantOption {
  id: string;
  slug: string;
  name: string;
}

interface TenantFilterState {
  /** Tenant a platform owner has drilled into. null = "All Tenants". */
  selected: TenantOption | null;
  select: (tenant: TenantOption | null) => void;
}

export const useTenantFilterStore = create<TenantFilterState>((set) => ({
  selected: null,
  select: (tenant) => {
    apiClient.setPlatformTenant(tenant?.id ?? null);
    authAdminClient.setPlatformTenant(tenant?.id ?? null);
    set({ selected: tenant });
  },
}));
